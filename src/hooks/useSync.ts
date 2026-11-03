import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserSettings, Bookmark, HistoryItem, Tab, SyncPayload } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'desktopmax_settings',
  BOOKMARKS: 'desktopmax_bookmarks',
  HISTORY: 'desktopmax_history',
  TABS: 'desktopmax_tabs',
};

const DEFAULT_SETTINGS: BrowserSettings = {
  defaultSearchEngine: 'google',
  desktopZoom: 1.0,
  userAgentMode: 'chrome_win',
  autoHideToolbar: false,
  autoFullscreenOnLaunch: false,
  virtualResolution: 'native',
  theme: 'slate',
  showBookmarksBar: true,
  bypassProxyForDirectDomains: true,
  syncKey: '',
};

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: 'b-1', title: 'Google', url: 'https://www.google.com', favicon: 'https://www.google.com/favicon.ico', category: 'Search', createdAt: Date.now() },
  { id: 'b-2', title: 'YouTube', url: 'https://www.youtube.com', favicon: 'https://www.youtube.com/favicon.ico', category: 'Media', createdAt: Date.now() },
  { id: 'b-3', title: 'GitHub', url: 'https://github.com', favicon: 'https://github.com/favicon.ico', category: 'Dev', createdAt: Date.now() },
  { id: 'b-4', title: 'Reddit', url: 'https://www.reddit.com', favicon: 'https://www.reddit.com/favicon.ico', category: 'Social', createdAt: Date.now() },
  { id: 'b-5', title: 'Wikipedia', url: 'https://en.wikipedia.org', favicon: 'https://en.wikipedia.org/favicon.ico', category: 'Reference', createdAt: Date.now() },
  { id: 'b-6', title: 'Hacker News', url: 'https://news.ycombinator.com', favicon: 'https://news.ycombinator.com/favicon.ico', category: 'News', createdAt: Date.now() },
];

function generateSyncKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'DESK-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useSync() {
  const [settings, setSettings] = useState<BrowserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    const newKey = generateSyncKey();
    return { ...DEFAULT_SETTINGS, syncKey: newKey };
  });

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BOOKMARKS;
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<number>(Date.now());
  const isSyncingRef = useRef(false);

  // Local storage auto-persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (e) {}
  }, [bookmarks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (e) {}
  }, [history]);

  // Pull updates from server for this sync key
  const pullSync = useCallback(async (keyToPull?: string) => {
    const key = (keyToPull || settings.syncKey || '').trim().toLowerCase();
    if (!key) return;

    try {
      setSyncStatus('syncing');
      const res = await fetch(`/api/sync/${encodeURIComponent(key)}`);
      if (!res.ok) throw new Error('Failed to pull sync');
      const json = await res.json();
      if (json.data) {
        const payload: SyncPayload = json.data;
        if (payload.settings) {
          setSettings((prev) => ({ ...prev, ...payload.settings, syncKey: key.toUpperCase() }));
        }
        if (Array.isArray(payload.bookmarks)) {
          setBookmarks(payload.bookmarks);
        }
        if (Array.isArray(payload.history)) {
          setHistory(payload.history);
        }
        setLastSyncedTime(Date.now());
        setSyncStatus('synced');
        return payload;
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.warn('Sync pull error:', err);
      setSyncStatus('error');
    }
  }, [settings.syncKey]);

  // Push updates to server
  const pushSync = useCallback(async (currentTabs?: Tab[]) => {
    const key = settings.syncKey.trim().toLowerCase();
    if (!key || isSyncingRef.current) return;

    try {
      isSyncingRef.current = true;
      setSyncStatus('syncing');

      const tabsToSave = (currentTabs || []).map((t) => ({
        url: t.url,
        title: t.title,
        favicon: t.favicon,
      }));

      const payload: SyncPayload = {
        settings,
        bookmarks,
        history: history.slice(0, 300), // persist top 300
        openTabs: tabsToSave,
        updatedAt: Date.now(),
      };

      const res = await fetch(`/api/sync/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });

      if (!res.ok) throw new Error('Sync push failed');
      setLastSyncedTime(Date.now());
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Sync push error:', err);
      setSyncStatus('error');
    } finally {
      isSyncingRef.current = false;
    }
  }, [settings, bookmarks, history]);

  // Record a visited website to cache & history
  const recordVisit = useCallback((url: string, title?: string, favicon?: string) => {
    if (!url || url === 'about:blank' || url.startsWith('desktopmax://')) return;

    try {
      const cleanUrl = url.trim();
      const parsed = new URL(cleanUrl);
      const siteTitle = title || parsed.hostname;
      const siteFavicon = favicon || `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;

      setHistory((prev) => {
        const existingIdx = prev.findIndex((item) => item.url === cleanUrl);
        let updated: HistoryItem[];
        if (existingIdx >= 0) {
          const item = prev[existingIdx];
          const newItem: HistoryItem = {
            ...item,
            title: siteTitle,
            favicon: siteFavicon,
            lastVisited: Date.now(),
            visitCount: item.visitCount + 1,
          };
          updated = [newItem, ...prev.filter((_, i) => i !== existingIdx)];
        } else {
          const newItem: HistoryItem = {
            id: 'h-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            url: cleanUrl,
            title: siteTitle,
            favicon: siteFavicon,
            lastVisited: Date.now(),
            visitCount: 1,
          };
          updated = [newItem, ...prev];
        }
        return updated.slice(0, 500);
      });

      // Also fire-and-forget server cache update
      fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: settings.syncKey,
          entry: {
            url: cleanUrl,
            title: siteTitle,
            favicon: siteFavicon,
          },
        }),
      }).catch(() => {});
    } catch (e) {
      // invalid URL, ignore
    }
  }, [settings.syncKey]);

  // Periodic background sync every 45s
  useEffect(() => {
    const timer = setInterval(() => {
      pushSync();
    }, 45000);
    return () => clearInterval(timer);
  }, [pushSync]);

  // Add or toggle bookmark
  const toggleBookmark = useCallback((url: string, title: string, favicon: string) => {
    if (!url || url.startsWith('desktopmax://')) return false;

    setBookmarks((prev) => {
      const exists = prev.find((b) => b.url === url);
      if (exists) {
        return prev.filter((b) => b.url !== url);
      } else {
        const newBm: Bookmark = {
          id: 'b-' + Date.now(),
          url,
          title: title || new URL(url).hostname,
          favicon: favicon || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`,
          createdAt: Date.now(),
        };
        return [...prev, newBm];
      }
    });
    return true;
  }, []);

  const isBookmarked = useCallback((url: string) => {
    return bookmarks.some((b) => b.url === url);
  }, [bookmarks]);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      await fetch(`/api/cache?user=${encodeURIComponent(settings.syncKey)}`, { method: 'DELETE' });
    } catch (e) {}
  }, [settings.syncKey]);

  return {
    settings,
    setSettings,
    bookmarks,
    setBookmarks,
    history,
    recordVisit,
    toggleBookmark,
    isBookmarked,
    clearHistory,
    syncStatus,
    lastSyncedTime,
    pullSync,
    pushSync,
  };
}
