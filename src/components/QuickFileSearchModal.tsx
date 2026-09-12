import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, FileText, FileJson, File, X, CornerDownLeft } from 'lucide-react';
import { GitTreeItem } from '../types';
import { getFileExtension } from '../utils/treeBuilder';

interface QuickFileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: GitTreeItem[];
  onSelectFile: (path: string) => void;
  repoName: string;
}

function getIconForFile(path: string) {
  const ext = getFileExtension(path);
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'rs':
    case 'go':
    case 'java':
    case 'html':
    case 'css':
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'md':
    case 'txt':
      return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  }
}

export const QuickFileSearchModal: React.FC<QuickFileSearchModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectFile,
  repoName,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const fileBlobs = React.useMemo(() => {
    return items.filter((item) => item.type === 'blob');
  }, [items]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return fileBlobs.slice(0, 50);
    const q = query.toLowerCase();
    return fileBlobs
      .filter((item) => item.path.toLowerCase().includes(q))
      .slice(0, 50);
  }, [fileBlobs, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectFile(filtered[selectedIndex].path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onSelectFile, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="quick-file-search-overlay"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="quick-file-search-modal"
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950/80 gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            id="quick-file-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search files in ${repoName}... (e.g. package.json, App.tsx)`}
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div
          id="quick-file-search-results"
          className="max-h-96 overflow-y-auto p-2 space-y-1 divide-y-0 text-xs"
        >
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-neutral-500">
              No files found matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const fileName = item.path.split('/').pop();
              const dirPath = item.path.includes('/')
                ? item.path.substring(0, item.path.lastIndexOf('/'))
                : '';

              return (
                <div
                  key={item.sha || item.path}
                  id={`file-search-item-${idx}`}
                  onClick={() => {
                    onSelectFile(item.path);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-800 text-neutral-100'
                      : 'text-neutral-300 hover:bg-neutral-850 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {getIconForFile(item.path)}
                    <span className="font-medium text-neutral-200 truncate">{fileName}</span>
                    {dirPath && (
                      <span className="text-neutral-500 text-[11px] font-mono truncate max-w-xs">
                        {dirPath}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 shrink-0 ml-2">
                      <span>Jump</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/60 text-[11px] text-neutral-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="font-mono">{fileBlobs.length} total files</span>
        </div>
      </div>
    </div>
  );
};
