import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Tab } from './types';
import { useFullscreen } from './hooks/useFullscreen';
import { useSync } from './hooks/useSync';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { TabBar } from './components/TabBar';
import { Omnibox } from './components/Omnibox';
import { BookmarksBar } from './components/BookmarksBar';
import { WebView } from './components/WebView';
import { HistoryModal } from './components/HistoryModal';
import { SyncModal } from './components/SyncModal';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { Check, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

const INITIAL_TAB: Tab = {
  id: 'tab-1',
  url: 'desktopmax://newtab',
  title: 'New Tab',
  favicon: '',
  isLoading: false,
  historyStack: ['desktopmax://newtab'],
  historyIndex: 0,
};

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([INITIAL_TAB]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [useProxy, setUseProxy] = useState<boolean>(true);
  const [zenModeRevealed, setZenModeRevealed] = useState<boolean>(false);
  const [fullscreenToast, setFullscreenToast] = useState<string | null>(null);

  // Modals state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pwaOpen, setPwaOpen] = useState(false);

  const { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const {
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
  } = useSync();

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const isWebPageActive = activeTab && !activeTab.url.startsWith('desktopmax://');

  // Trigger toast on fullscreen change
  const prevFsRef = useRef(isFullscreen);
  useEffect(() => {
    if (isFullscreen && !prevFsRef.current) {
      setFullscreenToast('Full Screen Active — Android Notification Bar Hidden');
      const timer = setTimeout(() => setFullscreenToast(null), 3000);
      return () => clearTimeout(timer);
    }
    prevFsRef.current = isFullscreen;
  }, [isFullscreen]);

  // Tab operations
  const handleNewTab = useCallback((targetUrl = 'desktopmax://newtab') => {
    const newId = 'tab-' + Date.now();
    const newTab: Tab = {
      id: newId,
      url: targetUrl,
      title: targetUrl === 'desktopmax://newtab' ? 'New Tab' : 'Loading...',
      favicon: '',
      isLoading: targetUrl !== 'desktopmax://newtab',
      historyStack: [targetUrl],
      historyIndex: 0,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const handleCloseTab = useCallback((idToClose: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((t) => t.id !== idToClose);
      if (activeTabId === idToClose) {
        const nextActive = filtered[filtered.length - 1];
        setActiveTabId(nextActive.id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const handleSelectTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const handleNavigate = useCallback((url: string) => {
    if (!url) return;
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id === activeTabId) {
          const newStack = tab.historyStack.slice(0, tab.historyIndex + 1);
          newStack.push(url);
          return {
            ...tab,
            url,
            title: url.startsWith('desktopmax://') ? 'New Tab' : new URL(url).hostname,
            isLoading: !url.startsWith('desktopmax://'),
            historyStack: newStack,
            historyIndex: newStack.length - 1,
            canGoBack: newStack.length > 1,
            canGoForward: false,
          };
        }
        return tab;
      })
    );

    // Record in history & cache
    recordVisit(url);
  }, [activeTabId, recordVisit]);

  const handleUpdateTabInfo = useCallback((
    tabId: string,
    info: { title?: string; favicon?: string; url?: string; isLoading?: boolean }
  ) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === tabId) {
          const updated = { ...t, ...info };
          return updated;
        }
        return t;
      })
    );

    if (info.url && !info.url.startsWith('desktopmax://')) {
      recordVisit(info.url, info.title, info.favicon);
    }
  }, [recordVisit]);

  const handleBack = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTabId && t.historyIndex > 0) {
          const newIndex = t.historyIndex - 1;
          const prevUrl = t.historyStack[newIndex];
          return {
            ...t,
            url: prevUrl,
            historyIndex: newIndex,
            canGoBack: newIndex > 0,
            canGoForward: true,
          };
        }
        return t;
      })
    );
  }, [activeTabId]);

  const handleForward = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTabId && t.historyIndex < t.historyStack.length - 1) {
          const newIndex = t.historyIndex + 1;
          const nextUrl = t.historyStack[newIndex];
          return {
            ...t,
            url: nextUrl,
            historyIndex: newIndex,
            canGoBack: true,
            canGoForward: newIndex < t.historyStack.length - 1,
          };
        }
        return t;
      })
    );
  }, [activeTabId]);

  const handleReload = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id === activeTabId) {
          return { ...t, isLoading: true };
        }
        return t;
      })
    );
  }, [activeTabId]);

  const handleHome = useCallback(() => {
    handleNavigate('desktopmax://newtab');
  }, [handleNavigate]);

  const handleToggleBookmarkCurrent = useCallback(() => {
    if (activeTab && !activeTab.url.startsWith('desktopmax://')) {
      toggleBookmark(activeTab.url, activeTab.title, activeTab.favicon);
    }
  }, [activeTab, toggleBookmark]);

  const handleRemoveBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, [setBookmarks]);

  const handleAddCustomBookmark = useCallback(() => {
    const url = window.prompt('Enter bookmark URL:', 'https://');
    if (url && /^https?:\/\//i.test(url)) {
      const title = window.prompt('Enter bookmark Title:', new URL(url).hostname) || new URL(url).hostname;
      toggleBookmark(url, title, `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`);
    }
  }, [toggleBookmark]);

  const handleChangeZoom = useCallback((newZoom: number) => {
    setSettings((prev) => ({ ...prev, desktopZoom: newZoom }));
  }, [setSettings]);

  // Keyboard navigation shortcuts
  useKeyboardShortcuts({
    onToggleFullscreen: toggleFullscreen,
    onNewTab: () => handleNewTab(),
    onCloseTab: () => handleCloseTab(activeTabId),
    onFocusOmnibox: () => {
      setZenModeRevealed(true);
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      input?.focus();
      input?.select();
    },
    onReload: handleReload,
    onToggleBookmark: handleToggleBookmarkCurrent,
    onOpenHistory: () => setHistoryOpen(true),
    onToggleBookmarksBar: () => setSettings((prev) => ({ ...prev, showBookmarksBar: !prev.showBookmarksBar })),
    onZoomIn: () => setSettings((prev) => ({ ...prev, desktopZoom: Math.min(1.5, prev.desktopZoom + 0.1) })),
    onZoomOut: () => setSettings((prev) => ({ ...prev, desktopZoom: Math.max(0.5, prev.desktopZoom - 0.1) })),
    onZoomReset: () => setSettings((prev) => ({ ...prev, desktopZoom: 1.0 })),
    onBack: handleBack,
    onForward: handleForward,
    onSelectTab: (idx) => {
      if (tabs[idx]) setActiveTabId(tabs[idx].id);
    },
    onNextTab: () => {
      const currIdx = tabs.findIndex((t) => t.id === activeTabId);
      const nextIdx = (currIdx + 1) % tabs.length;
      setActiveTabId(tabs[nextIdx].id);
    },
    onPrevTab: () => {
      const currIdx = tabs.findIndex((t) => t.id === activeTabId);
      const prevIdx = (currIdx - 1 + tabs.length) % tabs.length;
      setActiveTabId(tabs[prevIdx].id);
    },
  });

  // Determine if top bars should be collapsed in Zen Mode
  const isZenModeHidden = settings.autoHideToolbar && isFullscreen && isWebPageActive && !zenModeRevealed;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Fullscreen status toast */}
      {fullscreenToast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-950/90 border border-emerald-500/60 px-4 py-2 rounded-full text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{fullscreenToast}</span>
        </div>
      )}

      {/* Top Edge Hover Trigger for Zen Mode */}
      {settings.autoHideToolbar && isFullscreen && isWebPageActive && (
        <div
          onMouseEnter={() => setZenModeRevealed(true)}
          className="fixed top-0 left-0 right-0 h-3 z-40 bg-gradient-to-b from-sky-500/30 to-transparent cursor-pointer group"
          title="Move mouse here or press Ctrl+L to show browser bars"
        >
          <div className="w-12 h-1 bg-sky-400/60 rounded-full mx-auto group-hover:scale-125 transition" />
        </div>
      )}

      {/* Browser Chrome Header (Tabs, Omnibox, Bookmarks) */}
      <header
        onMouseLeave={() => {
          if (settings.autoHideToolbar && isFullscreen && isWebPageActive) {
            setZenModeRevealed(false);
          }
        }}
        className={`flex flex-col z-30 transition-transform duration-200 ${
          isZenModeHidden ? '-translate-y-full absolute top-0 left-0 right-0' : 'relative'
        }`}
      >
        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onNewTab={() => handleNewTab()}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        {/* Omnibox / Navigation Bar */}
        <Omnibox
          currentUrl={activeTab.url}
          isLoading={activeTab.isLoading}
          canGoBack={Boolean(activeTab.canGoBack)}
          canGoForward={Boolean(activeTab.canGoForward)}
          isBookmarked={isBookmarked(activeTab.url)}
          isFullscreen={isFullscreen}
          zoomLevel={settings.desktopZoom}
          syncStatus={syncStatus}
          historyItems={history}
          bookmarks={bookmarks}
          settings={settings}
          useProxy={useProxy}
          onNavigate={handleNavigate}
          onBack={handleBack}
          onForward={handleForward}
          onReload={handleReload}
          onHome={handleHome}
          onToggleBookmark={handleToggleBookmarkCurrent}
          onToggleFullscreen={toggleFullscreen}
          onChangeZoom={handleChangeZoom}
          onToggleProxy={() => setUseProxy((p) => !p)}
          onOpenHistory={() => setHistoryOpen(true)}
          onOpenSync={() => setSyncOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenPWA={() => setPwaOpen(true)}
        />

        {/* Bookmarks Bar */}
        {settings.showBookmarksBar && (
          <BookmarksBar
            bookmarks={bookmarks}
            onNavigate={handleNavigate}
            onOpenNewTab={(url) => handleNewTab(url)}
            onAddBookmark={handleAddCustomBookmark}
            onRemoveBookmark={handleRemoveBookmark}
          />
        )}
      </header>

      {/* Main Web Viewport */}
      <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
        <WebView
          tab={activeTab}
          settings={settings}
          useProxy={useProxy}
          historyItems={history}
          bookmarks={bookmarks}
          isFullscreen={isFullscreen}
          onNavigate={handleNavigate}
          onOpenNewTab={(url) => handleNewTab(url)}
          onUpdateTabInfo={handleUpdateTabInfo}
          onToggleFullscreen={toggleFullscreen}
        />
      </main>

      {/* Floating Zen Mode Restore Pill (when hidden) */}
      {isZenModeHidden && (
        <button
          onClick={() => setZenModeRevealed(true)}
          className="fixed bottom-3 right-3 z-40 p-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white shadow-xl backdrop-blur-sm transition"
          title="Show Browser Controls (Ctrl+L)"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* Modals */}
      <HistoryModal
        isOpen={historyOpen}
        history={history}
        onClose={() => setHistoryOpen(false)}
        onNavigate={handleNavigate}
        onOpenNewTab={(url) => handleNewTab(url)}
        onClearHistory={clearHistory}
      />

      <SyncModal
        isOpen={syncOpen}
        syncKey={settings.syncKey}
        syncStatus={syncStatus}
        lastSyncedTime={lastSyncedTime}
        onClose={() => setSyncOpen(false)}
        onSyncNow={() => pushSync(tabs)}
        onConnectSyncKey={async (newKey) => {
          const payload = await pullSync(newKey);
          if (payload && payload.openTabs && payload.openTabs.length > 0) {
            setTabs(
              payload.openTabs.map((t, idx) => ({
                id: 'tab-sync-' + idx,
                url: t.url,
                title: t.title,
                favicon: t.favicon,
                isLoading: false,
                historyStack: [t.url],
                historyIndex: 0,
              }))
            );
            setActiveTabId('tab-sync-0');
          }
        }}
      />

      <SettingsModal
        isOpen={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      <PWAInstallModal
        isOpen={pwaOpen}
        onClose={() => setPwaOpen(false)}
      />
    </div>
  );
}
