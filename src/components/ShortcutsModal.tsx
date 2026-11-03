import React from 'react';
import { Keyboard, MousePointer, X, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: 'F11', desc: 'Toggle Fullscreen & Hide Notification Bar' },
    { key: 'Ctrl + T', desc: 'Open a new browser tab' },
    { key: 'Ctrl + W', desc: 'Close active browser tab' },
    { key: 'Ctrl + L / Alt + D', desc: 'Focus address bar / Omnibox' },
    { key: 'Ctrl + R / F5', desc: 'Reload current webpage' },
    { key: 'Ctrl + D', desc: 'Bookmark current webpage' },
    { key: 'Ctrl + H', desc: 'Open visited sites cache & history' },
    { key: 'Ctrl + Shift + B', desc: 'Toggle bookmarks bar' },
    { key: 'Ctrl + + / Ctrl + -', desc: 'Zoom in / Zoom out desktop viewport' },
    { key: 'Ctrl + 0', desc: 'Reset zoom scale to 100%' },
    { key: 'Alt + Left / Right', desc: 'Go Back / Go Forward in history' },
    { key: 'Ctrl + Tab', desc: 'Switch to next open tab' },
    { key: 'Ctrl + 1 ... 9', desc: 'Jump directly to tab index' },
  ];

  const MOUSE_ACTIONS = [
    { action: 'Middle Click on Tab', desc: 'Immediately close that tab' },
    { action: 'Middle Click on Bookmark', desc: 'Open bookmark in a new background tab' },
    { action: 'Hover Top Edge (Zen Mode)', desc: 'Temporarily reveals the address & tab bar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Keyboard & Mouse Controls</h2>
              <p className="text-xs text-slate-400">True desktop shortcuts tailored for mobile peripherals</p>
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
          {/* Key shortcuts list */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Keyboard Shortcuts
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {SHORTCUTS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs"
                >
                  <span className="text-slate-300">{item.desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] font-bold text-sky-400 shadow-sm flex-shrink-0">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Mouse shortcuts */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-indigo-400" /> Mouse Gestures
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {MOUSE_ACTIONS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs"
                >
                  <span className="text-slate-300">{item.desc}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] font-medium text-indigo-300 shadow-sm flex-shrink-0">
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
