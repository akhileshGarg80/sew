import React, { useState, useEffect } from 'react';
import {
  Search,
  History,
  Trash2,
  ExternalLink,
  Github,
  Globe,
  Code2,
  FolderTree,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  getRecentUsers,
  saveRecentUser,
  removeRecentUser,
  clearRecentUsers,
} from '../utils/recentUsers';

interface CleanInitialStateProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
  onOpenTokenModal: () => void;
}

export const CleanInitialState: React.FC<CleanInitialStateProps> = ({
  onSearch,
  isLoading,
  onOpenTokenModal,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [recentUsers, setRecentUsers] = useState<string[]>([]);

  useEffect(() => {
    setRecentUsers(getRecentUsers());
    const handleUpdate = () => setRecentUsers(getRecentUsers());
    window.addEventListener('recent-users-updated', handleUpdate);
    return () => window.removeEventListener('recent-users-updated', handleUpdate);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      saveRecentUser(trimmed);
      onSearch(trimmed);
    }
  };

  const handleSelectUser = (name: string) => {
    saveRecentUser(name);
    onSearch(name);
  };

  const handleRemoveUser = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    removeRecentUser(name);
    setRecentUsers(getRecentUsers());
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentUsers();
    setRecentUsers([]);
  };

  const suggestedExamples = ['torvalds', 'vuejs', 'facebook', 'vercel', 'tailwindlabs'];

  return (
    <div
      id="clean-initial-state-canvas"
      className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 select-none"
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-98 duration-200">
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-750 flex items-center justify-center shadow-xl text-emerald-400 group">
            <Github className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-neutral-950" />
          </span>
        </div>

        {/* Heading & Rate Limit Friendly Note */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
            GitHub Explorer & Live Viewer
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Search any GitHub user or organization to inspect public repositories, code files,
            activity, and full-page live production previews.
          </p>
        </div>

        {/* Clean Rate-Limit Shield Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-[11px] font-mono text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Credits Protected: No automatic API requests until you search</span>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg relative flex items-center shadow-2xl"
        >
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-neutral-500" />
            <input
              id="initial-user-search-input"
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds, vercel)..."
              className="w-full pl-10 pr-24 py-3 rounded-xl bg-neutral-900/90 border border-neutral-750 focus:border-emerald-500 focus:outline-hidden text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors shadow-inner"
            />
            <button
              id="initial-search-submit-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Saved Searches From LocalStorage Section */}
        {recentUsers.length > 0 ? (
          <div className="w-full max-w-lg bg-neutral-900/70 border border-neutral-800 rounded-xl p-3.5 text-left space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Saved in LocalStorage ({recentUsers.length})
              </span>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-neutral-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Clear all saved searches from local storage"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {recentUsers.map((user) => (
                <div
                  key={user}
                  onClick={() => handleSelectUser(user)}
                  className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 text-xs text-neutral-300 hover:text-emerald-300 font-mono transition-all cursor-pointer shadow-xs"
                >
                  <span>@{user}</span>
                  <button
                    onClick={(e) => handleRemoveUser(e, user)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors opacity-60 group-hover:opacity-100"
                    title={`Remove @${user} from saved searches`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Suggestion chips when nothing is saved yet */
          <div className="flex flex-col items-center space-y-2 text-xs text-neutral-500">
            <span className="font-mono text-[11px]">Quick suggestion examples (click to search):</span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {suggestedExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => handleSelectUser(example)}
                  className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  @{example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature Cards Grid (visual overview of the app without burning credits) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left pt-2">
          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span>File Explorer</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Browse full repository file tree and structure with keyboard search (Ctrl+P).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Code Viewer</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Syntax highlighting, markdown rendered preview, and split-view code layout.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Site Box</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Instant full-page live production website overlays with right-side links rail.
            </p>
          </div>
        </div>

        {/* Token CTA */}
        <div className="pt-2">
          <button
            onClick={onOpenTokenModal}
            className="text-[11px] font-mono text-neutral-500 hover:text-emerald-400 underline transition-colors"
          >
            Optional: Add a Personal GitHub Token to raise rate limit to 5,000 req/hr
          </button>
        </div>
      </div>
    </div>
  );
};
