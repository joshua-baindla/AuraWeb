import React from 'react';
import { BrowserSettings } from '../types';
import { Settings, X, Monitor, Search, Eye, Sparkles, Sliders } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: BrowserSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<BrowserSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Desktop & Mobile Settings</h2>
              <p className="text-xs text-slate-400">Configure viewport, resolution, and immersion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Virtual Desktop Resolution */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>Virtual Desktop Resolution</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Simulates wide desktop screen widths for web pages that require desktop monitor layout.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'native', label: 'Native Full Width' },
                { id: '1080p', label: '1080p (1920px Canvas)' },
                { id: '720p', label: '720p (1280px Canvas)' },
                { id: '1440p', label: '1440p (2560px Canvas)' },
              ].map((res) => (
                <button
                  key={res.id}
                  onClick={() => onUpdateSettings({ virtualResolution: res.id as any })}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition ${
                    settings.virtualResolution === res.id
                      ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {res.label}
                </button>
              ))}
            </div>
          </div>

          {/* User-Agent Emulation */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Desktop User-Agent</span>
            </label>
            <p className="text-[11px] text-slate-400">
              Informs web servers to deliver full desktop layouts and unthrottled desktop features.
            </p>
            <select
              value={settings.userAgentMode}
              onChange={(e) => onUpdateSettings({ userAgentMode: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="chrome_win">Google Chrome 130 on Windows 11 (Recommended)</option>
              <option value="chrome_mac">Google Chrome 130 on macOS</option>
              <option value="firefox_win">Mozilla Firefox 132 on Windows</option>
              <option value="edge_win">Microsoft Edge 130 on Windows</option>
            </select>
          </div>

          {/* Default Search Engine */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Default Search Engine</span>
            </label>
            <select
              value={settings.defaultSearchEngine}
              onChange={(e) => onUpdateSettings({ defaultSearchEngine: e.target.value as any })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            >
              <option value="google">Google Search</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="bing">Microsoft Bing</option>
              <option value="brave">Brave Search</option>
            </select>
          </div>

          {/* Immersion & Fullscreen Options */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Immersion & Appearance
            </span>

            {/* Auto Fullscreen */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">Auto Fullscreen on Launch</div>
                <div className="text-[11px] text-slate-400">
                  Immediately hide Android notification bar on startup
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFullscreenOnLaunch}
                onChange={(e) => onUpdateSettings({ autoFullscreenOnLaunch: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500"
              />
            </label>

            {/* Auto Hide Toolbar (Zen Mode) */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">Zen Mode (Auto-Hide Toolbar)</div>
                <div className="text-[11px] text-slate-400">
                  Hide top toolbar during browsing; hover top edge to reveal
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoHideToolbar}
                onChange={(e) => onUpdateSettings({ autoHideToolbar: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500"
              />
            </label>

            {/* Show Bookmarks Bar */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800">
              <div>
                <div className="text-xs font-semibold text-slate-200">Show Bookmarks Bar</div>
                <div className="text-[11px] text-slate-400">
                  Display quick bookmarks row underneath address bar
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.showBookmarksBar}
                onChange={(e) => onUpdateSettings({ showBookmarksBar: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-slate-700 focus:ring-sky-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
