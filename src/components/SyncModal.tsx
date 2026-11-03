import React, { useState } from 'react';
import { Cloud, Check, Copy, RefreshCw, Smartphone, Laptop, Tablet, X, Shield, ArrowRight } from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  syncKey: string;
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncedTime: number;
  onClose: () => void;
  onSyncNow: () => void;
  onConnectSyncKey: (newKey: string) => Promise<any>;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  syncKey,
  syncStatus,
  lastSyncedTime,
  onClose,
  onSyncNow,
  onConnectSyncKey,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [connectError, setConnectError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(syncKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;

    try {
      setIsConnecting(true);
      setConnectError('');
      await onConnectSyncKey(inputKey.trim());
      setInputKey('');
    } catch (err: any) {
      setConnectError(err.message || 'Failed to connect sync key');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cross-Device Cloud Sync</h2>
              <p className="text-xs text-slate-400">Keep preferences, cache, bookmarks & tabs synced</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Active Sync Card */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Your Active Sync ID</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  syncStatus === 'synced'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : syncStatus === 'syncing'
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {syncStatus === 'synced' ? 'Synchronized' : syncStatus === 'syncing' ? 'Syncing...' : 'Sync Error'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono font-bold text-sky-400 tracking-wider">
                {syncKey || 'DESK-DEFAULT'}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-white transition shadow"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Last synced: {new Date(lastSyncedTime).toLocaleTimeString()}</span>
              <button
                onClick={onSyncNow}
                disabled={syncStatus === 'syncing'}
                className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            </div>
          </div>

          {/* Connect Another Device Form */}
          <form onSubmit={handleConnect} className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Connect to Another Device (Laptop, Tablet, or Phone)
            </label>
            <p className="text-[11px] text-slate-400">
              Enter the Sync ID from your other device to load all its bookmarks, history cache, and desktop zoom preferences.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                placeholder="e.g. DESK-83FA91"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 uppercase outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={!inputKey.trim() || isConnecting}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-semibold text-white transition shadow"
              >
                <span>Connect</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {connectError && <p className="text-[11px] text-red-400">{connectError}</p>}
          </form>

          {/* Cross-device feature highlights */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              What stays in sync
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Laptop className="w-5 h-5 mx-auto text-sky-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium block">Tabs & Zoom</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Smartphone className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium block">Visited Cache</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <Tablet className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium block">Bookmarks</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
