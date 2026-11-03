import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  Search,
  Star,
  Settings,
  History,
  Cloud,
  Maximize2,
  Minimize2,
  ZoomIn,
  Keyboard,
  ShieldCheck,
  ChevronDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { HistoryItem, Bookmark, BrowserSettings } from '../types';

interface OmniboxProps {
  currentUrl: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isBookmarked: boolean;
  isFullscreen: boolean;
  zoomLevel: number;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  historyItems: HistoryItem[];
  bookmarks: Bookmark[];
  settings: BrowserSettings;
  useProxy: boolean;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onToggleBookmark: () => void;
  onToggleFullscreen: () => void;
  onChangeZoom: (newZoom: number) => void;
  onToggleProxy: () => void;
  onOpenHistory: () => void;
  onOpenSync: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenPWA: () => void;
}

const ZOOM_OPTIONS = [0.5, 0.67, 0.75, 0.85, 1.0, 1.15, 1.25, 1.5];

export const Omnibox: React.FC<OmniboxProps> = ({
  currentUrl,
  isLoading,
  canGoBack,
  canGoForward,
  isBookmarked,
  isFullscreen,
  zoomLevel,
  syncStatus,
  historyItems,
  bookmarks,
  settings,
  useProxy,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onToggleBookmark,
  onToggleFullscreen,
  onChangeZoom,
  onToggleProxy,
  onOpenHistory,
  onOpenSync,
  onOpenSettings,
  onOpenShortcuts,
  onOpenPWA,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; url: string; source: 'history' | 'bookmark' | 'search' }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoomMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocused) {
      if (currentUrl.startsWith('desktopmax://')) {
        setInputValue('');
      } else {
        setInputValue(currentUrl);
      }
    }
  }, [currentUrl, isFocused]);

  // Click outside to close zoom menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setShowZoomMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    const lower = val.toLowerCase();
    const matches: { title: string; url: string; source: 'history' | 'bookmark' | 'search' }[] = [];

    // Check bookmarks
    bookmarks.forEach((bm) => {
      if (bm.title.toLowerCase().includes(lower) || bm.url.toLowerCase().includes(lower)) {
        if (!matches.some((m) => m.url === bm.url)) {
          matches.push({ title: bm.title, url: bm.url, source: 'bookmark' });
        }
      }
    });

    // Check history cache
    historyItems.forEach((h) => {
      if (h.title.toLowerCase().includes(lower) || h.url.toLowerCase().includes(lower)) {
        if (!matches.some((m) => m.url === h.url)) {
          matches.push({ title: h.title, url: h.url, source: 'history' });
        }
      }
    });

    // Add search suggestion
    matches.push({
      title: `Search ${settings.defaultSearchEngine.toUpperCase()} for "${val}"`,
      url: getSearchUrl(val, settings.defaultSearchEngine),
      source: 'search',
    });

    setSuggestions(matches.slice(0, 6));
  };

  const getSearchUrl = (query: string, engine: string) => {
    const q = encodeURIComponent(query);
    switch (engine) {
      case 'duckduckgo':
        return `https://duckduckgo.com/?q=${q}`;
      case 'bing':
        return `https://www.bing.com/search?q=${q}`;
      case 'brave':
        return `https://search.brave.com/search?q=${q}`;
      case 'google':
      default:
        return `https://www.google.com/search?q=${q}`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let target = inputValue.trim();
    // Check if it's a domain/URL or search query
    const hasSpace = target.includes(' ');
    const hasDot = target.includes('.');
    const isUrl = !hasSpace && hasDot;

    if (isUrl) {
      if (!/^https?:\/\//i.test(target)) {
        target = 'https://' + target;
      }
      onNavigate(target);
    } else {
      onNavigate(getSearchUrl(target, settings.defaultSearchEngine));
    }

    setIsFocused(false);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleSelectSuggestion = (url: string) => {
    onNavigate(url);
    setIsFocused(false);
    setSuggestions([]);
  };

  return (
    <div className="relative bg-slate-800 border-b border-slate-700/80 px-2 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2 z-20 shadow-sm">
      {/* Navigation Controls */}
      <div className="flex items-center gap-0.5 sm:gap-1 text-slate-300">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="p-1.5 rounded-full hover:bg-slate-700/80 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent transition"
          title="Back (Alt+Left)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onForward}
          disabled={!canGoForward}
          className="p-1.5 rounded-full hover:bg-slate-700/80 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent transition"
          title="Forward (Alt+Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onReload}
          className="p-1.5 rounded-full hover:bg-slate-700/80 hover:text-white transition"
          title="Reload (Ctrl+R / F5)"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
        </button>

        <button
          type="button"
          onClick={onHome}
          className="p-1.5 rounded-full hover:bg-slate-700/80 hover:text-white transition"
          title="Home (Desktop Speed Dial)"
        >
          <Home className="w-4 h-4" />
        </button>
      </div>

      {/* Omnibox / Search & URL Input Form */}
      <div className="flex-1 relative min-w-0">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div
            className={`w-full flex items-center gap-2 bg-slate-900 border rounded-full px-3 py-1.5 text-xs sm:text-sm transition-all shadow-inner ${
              isFocused
                ? 'border-sky-500 ring-2 ring-sky-500/20 bg-slate-950'
                : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            {/* Lock / Protocol Icon */}
            {currentUrl.startsWith('https://') ? (
              <span title="Secure Connection (HTTPS)"><Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /></span>
            ) : currentUrl.startsWith('desktopmax://') ? (
              <span title="DesktopMax Start Page"><ShieldCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" /></span>
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            )}

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => {
                setIsFocused(true);
                inputRef.current?.select();
              }}
              onBlur={() => {
                // Short delay to allow clicking suggestions
                setTimeout(() => setIsFocused(false), 200);
              }}
              placeholder="Search Google or enter desktop URL..."
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 min-w-0 text-xs sm:text-sm font-mono tracking-tight"
            />

            {/* Clear Input */}
            {isFocused && inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  inputRef.current?.focus();
                }}
                className="text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Proxy Mode Toggle Badge */}
            <button
              type="button"
              onClick={onToggleProxy}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                useProxy
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
              title={
                useProxy
                  ? 'Desktop Frame Proxy Active: Bypasses X-Frame-Options & CORS'
                  : 'Direct Embed Active: Loads directly from origin'
              }
            >
              {useProxy ? 'DESKTOP PROXY' : 'DIRECT EMBED'}
            </button>

            {/* Star / Bookmark current page */}
            {!currentUrl.startsWith('desktopmax://') && (
              <button
                type="button"
                onClick={onToggleBookmark}
                className={`p-1 rounded-full transition ${
                  isBookmarked
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bookmark This Page (Ctrl+D)"
              >
                <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400' : ''}`} />
              </button>
            )}
          </div>
        </form>

        {/* Suggestions & Autocomplete Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800">
            {suggestions.map((item, idx) => (
              <div
                key={idx}
                onMouseDown={() => handleSelectSuggestion(item.url)}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-800 cursor-pointer transition text-xs"
              >
                {item.source === 'history' && <History className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                {item.source === 'bookmark' && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                {item.source === 'search' && <Search className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}

                <span className="font-medium text-slate-200 truncate flex-1">{item.title}</span>
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[200px]">{item.url}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Tools: Desktop Zoom, Fullscreen, Sync & Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-slate-300">
        {/* Desktop Viewport Zoom Dropdown */}
        <div className="relative" ref={zoomMenuRef}>
          <button
            type="button"
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-xs font-mono font-medium hover:text-white transition"
            title="Desktop Viewport Zoom (Ctrl + / -)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
            <span>{Math.round(zoomLevel * 100)}%</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showZoomMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                Desktop Zoom
              </div>
              {ZOOM_OPTIONS.map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => {
                    onChangeZoom(zoom);
                    setShowZoomMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition ${
                    Math.abs(zoomLevel - zoom) < 0.01 ? 'text-sky-400 font-semibold bg-slate-800/60' : 'text-slate-300'
                  }`}
                >
                  <span>{Math.round(zoom * 100)}%</span>
                  {zoom === 1.0 && <span className="text-[10px] text-slate-500">Default</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen & Hide Notification Bar Button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
            isFullscreen
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
              : 'bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border-sky-500/40'
          }`}
          title="Toggle Fullscreen & Hide Mobile Notification Bar (F11)"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline text-[11px]">
            {isFullscreen ? 'Notification Bar Hidden' : 'Hide Notif Bar'}
          </span>
        </button>

        {/* Visited Sites History & Cache */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="p-1.5 rounded-lg hover:bg-slate-700/80 hover:text-white transition relative"
          title="History & Cache (Ctrl+H)"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Cross-Device Sync Status Button */}
        <button
          type="button"
          onClick={onOpenSync}
          className={`p-1.5 rounded-lg transition relative ${
            syncStatus === 'syncing'
              ? 'text-sky-400 bg-sky-950/60'
              : syncStatus === 'error'
              ? 'text-amber-400'
              : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
          }`}
          title={`Cross-Device Sync: ${settings.syncKey || 'Active'}`}
        >
          <Cloud className="w-4 h-4" />
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
              syncStatus === 'synced'
                ? 'bg-emerald-400 ring-1 ring-emerald-500'
                : syncStatus === 'syncing'
                ? 'bg-sky-400 animate-ping'
                : 'bg-amber-400'
            }`}
          />
        </button>

        {/* Keyboard Shortcuts Cheat Sheet */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-slate-700/80 hover:text-white transition"
          title="Keyboard & Mouse Shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Browser Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg hover:bg-slate-700/80 hover:text-white transition"
          title="Desktop Settings & User-Agent"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Direct Open in Native Window */}
        {!currentUrl.startsWith('desktopmax://') && (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex p-1.5 rounded-lg hover:bg-slate-700/80 hover:text-white transition"
            title="Open in Native Chrome Tab"
          >
            <ExternalLink className="w-4 h-4 text-slate-400 hover:text-slate-200" />
          </a>
        )}
      </div>
    </div>
  );
};
