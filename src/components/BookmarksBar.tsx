import React from 'react';
import { Bookmark } from '../types';
import { Plus, X, Globe } from 'lucide-react';

interface BookmarksBarProps {
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
  onOpenNewTab: (url: string) => void;
  onAddBookmark: () => void;
  onRemoveBookmark: (id: string) => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({
  bookmarks,
  onNavigate,
  onOpenNewTab,
  onAddBookmark,
  onRemoveBookmark,
}) => {
  return (
    <div className="bg-slate-900 border-b border-slate-800 px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none text-xs">
      {bookmarks.map((bm) => (
        <div
          key={bm.id}
          onClick={() => onNavigate(bm.url)}
          onMouseDown={(e) => {
            if (e.button === 1) {
              // Middle click opens in new tab
              e.preventDefault();
              onOpenNewTab(bm.url);
            }
          }}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition flex-shrink-0"
          title={`${bm.title}\n${bm.url}\n(Middle-click to open in new tab)`}
        >
          {bm.favicon ? (
            <img
              src={bm.favicon}
              alt=""
              className="w-3.5 h-3.5 rounded-sm object-contain flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          )}

          <span className="truncate max-w-[120px] font-normal">{bm.title}</span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveBookmark(bm.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-400 transition"
            title="Remove Bookmark"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddBookmark}
        className="flex items-center gap-1 px-2 py-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition ml-1 flex-shrink-0"
        title="Add Custom Bookmark"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="text-[11px]">Add</span>
      </button>
    </div>
  );
};
