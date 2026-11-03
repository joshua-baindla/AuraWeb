import React from 'react';
import { Tab } from '../types';
import { Plus, X, Globe, Maximize2, Minimize2, Loader2 } from 'lucide-react';

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  isFullscreen,
  onToggleFullscreen,
}) => {
  return (
    <div className="flex items-center bg-slate-900 border-b border-slate-800 px-2 pt-1.5 select-none overflow-x-auto no-scrollbar h-10">
      {/* Chrome Window Dots */}
      <div className="hidden sm:flex items-center gap-1.5 mr-3 ml-1">
        <span className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer inline-block" title="Close" />
        <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer inline-block" title="Minimize" />
        <span 
          onClick={onToggleFullscreen}
          className={`w-3 h-3 rounded-full cursor-pointer inline-block transition ${
            isFullscreen ? 'bg-emerald-400 ring-2 ring-emerald-500/50' : 'bg-emerald-500/80 hover:bg-emerald-500'
          }`} 
          title="Toggle Fullscreen (F11)" 
        />
      </div>

      {/* Tabs Container */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={(e) => {
                // Middle click closes tab
                if (e.button === 1) {
                  e.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              className={`group relative flex items-center gap-2 max-w-[220px] min-w-[110px] h-8 px-3 rounded-t-lg text-xs font-medium cursor-pointer transition-all border-t border-x ${
                isActive
                  ? 'bg-slate-800 text-sky-400 border-slate-700 shadow-sm z-10'
                  : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {/* Tab Icon / Spinner */}
              {tab.isLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin flex-shrink-0" />
              ) : tab.favicon ? (
                <img
                  src={tab.favicon}
                  alt=""
                  className="w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              )}

              {/* Title */}
              <span className="truncate flex-1 font-normal" title={tab.title || tab.url}>
                {tab.title || (tab.url.startsWith('desktopmax://') ? 'New Tab' : tab.url)}
              </span>

              {/* Close Button */}
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-slate-700/80 hover:text-slate-200 text-slate-400 transition"
                  title="Close Tab (Ctrl+W)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Active Tab Accent Line */}
              {isActive && (
                <div className="absolute top-0 left-2 right-2 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" />
              )}
            </div>
          );
        })}

        {/* New Tab Button */}
        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition ml-1"
          title="New Tab (Ctrl+T)"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Fullscreen & Mode Badge */}
      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={onToggleFullscreen}
          className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-semibold transition ${
            isFullscreen
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Toggle Fullscreen & Hide Notification Bar (F11)"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          <span className="hidden md:inline">
            {isFullscreen ? 'Full Screen (Bar Hidden)' : 'Enter Full Screen'}
          </span>
        </button>
      </div>
    </div>
  );
};
