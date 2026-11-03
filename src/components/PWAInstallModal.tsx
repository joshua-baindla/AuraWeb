import React from 'react';
import { Download, X, CheckCircle, Smartphone, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Install DesktopMax PWA</h2>
              <p className="text-xs text-slate-400">Zero notification bar, standalone desktop app</p>
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
        <div className="p-5 space-y-4">
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Already Installed!</h3>
              <p className="text-xs text-slate-300">
                DesktopMax is already running as an installed PWA. Launch it anytime from your mobile home screen or app drawer!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Installing DesktopMax to your mobile home screen enables the <strong>fullscreen PWA engine</strong>, which permanently hides the mobile status/notification bar and browser chrome!
                </p>

                <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 space-y-2 text-xs">
                  <div className="font-semibold text-sky-400">How to install on Android Chrome:</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                    <li>Tap the <strong>Install DesktopMax</strong> button below (if prompted).</li>
                    <li>Or tap Chrome's three vertical dots <strong>(⋮)</strong> in the top-right.</li>
                    <li>Select <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                    <li>Launch from your home screen for full immersion with mouse and keyboard!</li>
                  </ol>
                </div>

                {isIOS && (
                  <div className="bg-indigo-950/40 rounded-xl p-3 border border-indigo-500/30 space-y-2 text-xs">
                    <div className="font-semibold text-indigo-300">How to install on iOS Safari:</div>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px]">
                      <li>Tap the <strong>Share</strong> button (box with upward arrow) in Safari.</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>

              {isInstallable && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Install DesktopMax App</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
