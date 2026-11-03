export interface Tab {
  id: string;
  url: string;
  title: string;
  favicon: string;
  isLoading: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  historyStack: string[];
  historyIndex: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  favicon: string;
  lastVisited: number;
  visitCount: number;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon: string;
  category?: string;
  createdAt: number;
}

export interface BrowserSettings {
  defaultSearchEngine: 'google' | 'duckduckgo' | 'bing' | 'brave';
  desktopZoom: number; // e.g. 0.85, 1.0, 1.15
  userAgentMode: 'chrome_win' | 'chrome_mac' | 'firefox_win' | 'edge_win';
  autoHideToolbar: boolean;
  autoFullscreenOnLaunch: boolean;
  virtualResolution: 'native' | '1080p' | '720p' | '1440p';
  theme: 'dark' | 'midnight' | 'slate' | 'black';
  showBookmarksBar: boolean;
  bypassProxyForDirectDomains: boolean;
  syncKey: string;
}

export interface SyncPayload {
  settings: BrowserSettings;
  bookmarks: Bookmark[];
  history: HistoryItem[];
  openTabs: { url: string; title: string; favicon: string }[];
  updatedAt: number;
}
