import React, { useState } from 'react';
import {
  Search,
  Maximize2,
  Minimize2,
  Clock,
  Compass,
  Keyboard,
  MousePointer,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { HistoryItem, Bookmark, BrowserSettings } from '../types';

interface NewTabPageProps {
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
  historyItems: HistoryItem[];
  bookmarks: Bookmark[];
  settings: BrowserSettings;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const DESKTOP_SHORTCUTS = [
  { title: 'Google', url: 'https://www.google.com', category: 'Search', iconBg: 'bg-blue-600', domain: 'google.com' },
  { title: 'YouTube', url: 'https://www.youtube.com', category: 'Video', iconBg: 'bg-red-600', domain: 'youtube.com' },
  { title: 'GitHub', url: 'https://github.com', category: 'Code', iconBg: 'bg-slate-700', domain: 'github.com' },
  { title: 'Reddit', url: 'https://www.reddit.com', category: 'Community', iconBg: 'bg-orange-600', domain: 'reddit.com' },
  { title: 'Wikipedia', url: 'https://en.wikipedia.org', category: 'Reference', iconBg: 'bg-neutral-700', domain: 'wikipedia.org' },
  { title: 'Google Docs', url: 'https://docs.google.com', category: 'Productivity', iconBg: 'bg-blue-500', domain: 'google.com' },
  { title: 'X / Twitter', url: 'https://x.com', category: 'Social', iconBg: 'bg-zinc-800', domain: 'x.com' },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', category: 'Tech', iconBg: 'bg-amber-600', domain: 'ycombinator.com' },
];

export const NewTabPage: React.FC<NewTabPageProps> = ({
  onNavigate,
  historyItems,
  bookmarks,
  settings,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim();
    if (q.includes('.') && !q.includes(' ')) {
      const url = /^https?:\/\//i.test(q) ? q : 'https://' + q;
      onNavigate(url);
    } else {
      let searchUrl = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
      if (settings.defaultSearchEngine === 'duckduckgo') {
        searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
      } else if (settings.defaultSearchEngine === 'bing') {
        searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
      } else if (settings.defaultSearchEngine === 'brave') {
        searchUrl = `https://search.brave.com/search?q=${encodeURIComponent(q)}`;
      }
      onNavigate(searchUrl);
    }
  };

  // Top visited sites from history cache
  const topVisited = [...historyItems]
    .sort((a, b) => (b.visitCount || 1) - (a.visitCount || 1))
    .slice(0, 8);

  return (
    <div className="h-full w-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center select-none">
      <div className="w-full max-w-4xl flex flex-col items-center my-auto py-6">
        {/* Fullscreen Mobile Experience Banner */}
        <div className="w-full mb-8 bg-gradient-to-r from-sky-950/70 via-indigo-950/70 to-slate-900 border border-sky-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Mobile Keyboard & Mouse Desktop Mode
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isFullscreen ? 'Notification Bar Hidden (Full Screen Active)' : 'Full Screen Desktop Experience'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Chrome keeps the top notification bar & address bar visible. DesktopMax triggers Android immersive
                fullscreen so you get 100% of your screen for desktop web apps with mouse & keyboard.
              </p>
            </div>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl font-semibold text-sm transition shadow-lg ${
                isFullscreen
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/40'
                  : 'bg-sky-600 hover:bg-sky-500 text-white ring-2 ring-sky-400/40 animate-pulse'
              }`}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span>{isFullscreen ? 'Exit Full Screen' : 'Hide Notification Bar (F11)'}</span>
            </button>
          </div>

          {/* Quick specs pill */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-sky-400" />
              <span>Keyboard: F11 / Ctrl+T / Ctrl+W / Ctrl+L</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Mouse: Middle-click opens tab</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sync ID: <code className="text-sky-300 font-mono font-bold">{settings.syncKey}</code></span>
            </span>
          </div>
        </div>

        {/* Brand / Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              DesktopMax <span className="text-sky-400 font-light text-xl">Browser</span>
            </h1>
            <p className="text-xs text-slate-400">Desktop Web Experience with Full Screen Immersion</p>
          </div>
        </div>

        {/* Central Search Omnibox */}
        <form onSubmit={handleSearch} className="w-full max-w-2xl mb-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search with ${settings.defaultSearchEngine.toUpperCase()} or enter URL...`}
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 text-slate-100 placeholder-slate-400 text-sm shadow-xl outline-none transition font-sans"
            />
            <button
              type="submit"
              className="absolute inset-y-1.5 right-1.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition shadow"
            >
              <span>Search</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Desktop Speed Dial Tiles */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> Desktop Quick Launcher
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DESKTOP_SHORTCUTS.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(item.url)}
                className="group p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-sky-500/50 cursor-pointer transition flex items-center gap-3 shadow-md hover:shadow-sky-500/10"
              >
                <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0`}>
                  {item.title.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate transition">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{item.category}</div>
                </div>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-slate-300 opacity-0 group-hover:opacity-100 transition" />
              </div>
            ))}
          </div>
        </div>

        {/* Visited Sites Cache & Recent History */}
        {topVisited.length > 0 && (
          <div className="w-full mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Cached & Visited Websites ({historyItems.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topVisited.map((hist) => (
                <div
                  key={hist.id}
                  onClick={() => onNavigate(hist.url)}
                  className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600 flex items-center gap-3 cursor-pointer transition text-xs"
                >
                  {hist.favicon ? (
                    <img
                      src={hist.favicon}
                      alt=""
                      className="w-4 h-4 rounded object-contain flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-300">
                      •
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-200 truncate">{hist.title}</div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">{hist.url}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-700/60 flex-shrink-0">
                    {hist.visitCount} visits
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
