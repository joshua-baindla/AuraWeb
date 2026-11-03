import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onToggleFullscreen: () => void;
  onNewTab: () => void;
  onCloseTab: () => void;
  onFocusOmnibox: () => void;
  onReload: () => void;
  onToggleBookmark: () => void;
  onOpenHistory: () => void;
  onToggleBookmarksBar: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onBack: () => void;
  onForward: () => void;
  onSelectTab: (index: number) => void;
  onNextTab: () => void;
  onPrevTab: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // F11: Fullscreen toggle (Crucial for mobile keyboard!)
      if (e.key === 'F11') {
        e.preventDefault();
        handlers.onToggleFullscreen();
        return;
      }

      // F5 or Ctrl + R: Reload
      if (e.key === 'F5' || (isCtrlOrMeta && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
        handlers.onReload();
        return;
      }

      // Alt + D or Ctrl + L: Focus Omnibox
      if ((e.altKey && e.key.toLowerCase() === 'd') || (isCtrlOrMeta && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        handlers.onFocusOmnibox();
        return;
      }

      // Ctrl + T: New Tab
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handlers.onNewTab();
        return;
      }

      // Ctrl + W: Close Tab
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handlers.onCloseTab();
        return;
      }

      // Ctrl + D: Bookmark
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'd' && !e.altKey) {
        e.preventDefault();
        handlers.onToggleBookmark();
        return;
      }

      // Ctrl + H: History
      if (isCtrlOrMeta && !e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        handlers.onOpenHistory();
        return;
      }

      // Ctrl + Shift + B: Toggle Bookmarks Bar
      if (isCtrlOrMeta && e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handlers.onToggleBookmarksBar();
        return;
      }

      // Ctrl + Plus / Equal: Zoom In
      if (isCtrlOrMeta && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handlers.onZoomIn();
        return;
      }

      // Ctrl + Minus: Zoom Out
      if (isCtrlOrMeta && e.key === '-') {
        e.preventDefault();
        handlers.onZoomOut();
        return;
      }

      // Ctrl + 0: Zoom Reset
      if (isCtrlOrMeta && e.key === '0') {
        e.preventDefault();
        handlers.onZoomReset();
        return;
      }

      // Alt + Left: Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlers.onBack();
        return;
      }

      // Alt + Right: Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handlers.onForward();
        return;
      }

      // Ctrl + Tab / Ctrl + Shift + Tab: Switch Tabs
      if (isCtrlOrMeta && e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onPrevTab();
        } else {
          handlers.onNextTab();
        }
        return;
      }

      // Ctrl + 1..9: Direct Tab Jump
      if (isCtrlOrMeta && !e.shiftKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handlers.onSelectTab(parseInt(e.key, 10) - 1);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [handlers]);
}
