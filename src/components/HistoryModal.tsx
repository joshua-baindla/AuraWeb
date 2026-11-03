import React, { useState } from 'react';
import { HistoryItem } from '../types';
import { History, Search, Trash2, ExternalLink, X, Clock, Calendar, Download } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  history: HistoryItem[];
  onClose: () => void;
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  history,
  onClose,
  onNavigate,
  onOpenNewTab,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'popular'>('all');

  if (!isOpen) return null;

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const filtered = history
    .filter((item) => {
      if (filter === 'today' && item.lastVisited < oneDayAgo) return false;
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (filter === 'popular') return (b.visitCount || 1) - (a.visitCount || 1);
      return b.lastVisited - a.lastVisited;
    });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `desktopmax_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Browsing Cache & History</h2>
              <p className="text-xs text-slate-400">
                {history.length} cached websites visited with keyboard & mouse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search visited sites by title or URL..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filter === 'all' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filter === 'today' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('popular')}
              className={`px-2.5 py-1 rounded-lg transition ${
                filter === 'popular' ? 'bg-sky-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Most Visited
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              No matching websites found in cache.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="group p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40 hover:border-slate-600 flex items-center justify-between gap-3 transition"
              >
                <div
                  onClick={() => {
                    onNavigate(item.url);
                    onClose();
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  {item.favicon ? (
                    <img
                      src={item.favicon}
                      alt=""
                      className="w-4 h-4 rounded object-contain flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center text-[10px]">
                      •
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 truncate transition">
                      {item.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 truncate">{item.url}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTime(item.lastVisited)}
                  </span>
                  <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700/60 text-slate-300 font-mono">
                    {item.visitCount} visits
                  </span>
                  <button
                    onClick={() => {
                      onOpenNewTab(item.url);
                      onClose();
                    }}
                    className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Open in New Tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History JSON</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all cached browsing history?')) {
                  onClearHistory();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History Cache</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
