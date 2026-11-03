import React, { useState, useEffect, useRef } from 'react';
import { Tab, HistoryItem, Bookmark, BrowserSettings } from '../types';
import { NewTabPage } from './NewTabPage';
import { ExternalLink, RefreshCw, AlertCircle, ShieldAlert, BookOpen } from 'lucide-react';

interface WebViewProps {
  tab: Tab;
  settings: BrowserSettings;
  useProxy: boolean;
  historyItems: HistoryItem[];
  bookmarks: Bookmark[];
  isFullscreen: boolean;
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
  onUpdateTabInfo: (tabId: string, info: { title?: string; favicon?: string; url?: string; isLoading?: boolean }) => void;
  onToggleFullscreen: () => void;
}

export const WebView: React.FC<WebViewProps> = ({
  tab,
  settings,
  useProxy,
  historyItems,
  bookmarks,
  isFullscreen,
  onNavigate,
  onOpenNewTab,
  onUpdateTabInfo,
  onToggleFullscreen,
}) => {
  const [loadError, setLoadError] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [readerMode, setReaderMode] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isNewTab = !tab.url || tab.url.startsWith('desktopmax://');

  // Compute final iframe src
  const iframeSrc = React.useMemo(() => {
    if (isNewTab) return '';
    if (useProxy) {
      return `/api/proxy?url=${encodeURIComponent(tab.url)}&ua=${settings.userAgentMode}`;
    }
    return tab.url;
  }, [tab.url, useProxy, settings.userAgentMode, isNewTab]);

  // Reset errors on navigation
  useEffect(() => {
    setLoadError(false);
  }, [tab.url]);

  // Listen to iframe postMessages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'PROXY_PAGE_LOADED') {
        if (data.url && data.url !== tab.url) {
          onUpdateTabInfo(tab.id, {
            title: data.title,
            favicon: data.favicon,
            url: data.url,
            isLoading: false,
          });
        } else {
          onUpdateTabInfo(tab.id, {
            title: data.title,
            favicon: data.favicon,
            isLoading: false,
          });
        }
      } else if (data.type === 'PROXY_NAVIGATE') {
        if (data.url) {
          onNavigate(data.url);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tab.id, tab.url, onNavigate, onUpdateTabInfo]);

  if (isNewTab) {
    return (
      <NewTabPage
        onNavigate={onNavigate}
        onOpenNewTab={onOpenNewTab}
        historyItems={historyItems}
        bookmarks={bookmarks}
        settings={settings}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
    );
  }

  // Calculate desktop viewport width & scaling
  const zoom = settings.desktopZoom || 1.0;
  const isVirtualResolution = settings.virtualResolution !== 'native';
  let virtualWidth = '100%';
  if (settings.virtualResolution === '1080p') virtualWidth = '1920px';
  else if (settings.virtualResolution === '720p') virtualWidth = '1280px';
  else if (settings.virtualResolution === '1440p') virtualWidth = '2560px';

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Loading Progress Bar */}
      {tab.isLoading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-30 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 animate-pulse w-full" />
        </div>
      )}

      {/* Frame Error Fallback */}
      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Display Restriction</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            This website restricts being rendered directly inside an embedded frame. You can reload using the Desktop Proxy or open it in a direct browser tab.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setLoadError(false);
                setIframeKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Load</span>
            </button>
            <a
              href={tab.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition shadow"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Full Native Tab</span>
            </a>
          </div>
        </div>
      ) : (
        /* The Iframe Container with Desktop Scaling */
        <div className="flex-1 w-full h-full relative overflow-auto bg-white">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={iframeSrc}
            title={tab.title || 'Web View'}
            className="border-none w-full h-full block"
            style={{
              width: isVirtualResolution ? virtualWidth : `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            onLoad={() => {
              onUpdateTabInfo(tab.id, { isLoading: false });
            }}
            onError={() => {
              setLoadError(true);
              onUpdateTabInfo(tab.id, { isLoading: false });
            }}
          />
        </div>
      )}
    </div>
  );
};
