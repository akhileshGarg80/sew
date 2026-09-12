import React, { useState } from 'react';
import { Search, Github, Key, RefreshCw, Sparkles } from 'lucide-react';
import { RateLimitInfo } from '../types';

interface HeaderProps {
  currentUsername: string;
  onSearch: (username: string) => void;
  isLoading: boolean;
  rateLimit: RateLimitInfo | null;
  onOpenTokenModal: () => void;
}

const POPULAR_USERS = [
  { name: 'shadcn', label: 'shadcn' },
  { name: 'facebook', label: 'facebook' },
  { name: 'vercel', label: 'vercel' },
  { name: 'tailwindlabs', label: 'tailwindlabs' },
  { name: 'torvalds', label: 'torvalds' },
  { name: 'vuejs', label: 'vuejs' },
];

export const Header: React.FC<HeaderProps> = ({
  currentUsername,
  onSearch,
  isLoading,
  rateLimit,
  onOpenTokenModal,
}) => {
  const [searchInput, setSearchInput] = useState(currentUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleQuickSelect = (user: string) => {
    setSearchInput(user);
    onSearch(user);
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-100 shadow-xs">
              <Github className="w-5 h-5 text-neutral-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-neutral-100 tracking-tight">
                  GitHub Repo Explorer
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 rounded-full">
                  Live v3 API
                </span>
              </div>
              <p className="text-xs text-neutral-400 hidden sm:block">
                Inspect public repos, file trees, code & full activity
              </p>
            </div>
          </div>

          {/* Rate Limit Pill - Mobile View */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              id="mobile-token-btn"
              onClick={onOpenTokenModal}
              title="GitHub Rate Limit & Token Settings"
              className="px-2.5 py-1 text-xs rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 hover:text-neutral-100 flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>{rateLimit ? `${rateLimit.remaining}/${rateLimit.limit}` : 'Rate Limit'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Quick Picks */}
        <div className="flex-1 max-w-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form onSubmit={handleSubmit} className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="github-username-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds, vercel, shadcn)..."
              className="w-full pl-9 pr-24 py-2 rounded-lg bg-neutral-950 border border-neutral-700 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <button
              id="github-search-submit"
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="absolute inset-y-1 right-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Search</span>
              )}
            </button>
          </form>

          {/* Rate Limit & API Token button - Desktop View */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              id="token-settings-btn"
              onClick={onOpenTokenModal}
              className="px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 hover:text-neutral-100 flex items-center gap-2 transition-colors shadow-xs"
              title="Click to configure GitHub Personal Access Token"
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Rate Limit:{' '}
                <strong className={rateLimit && rateLimit.remaining < 10 ? 'text-rose-400' : 'text-emerald-400'}>
                  {rateLimit ? `${rateLimit.remaining} / ${rateLimit.limit}` : '60 / 60'}
                </strong>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Suggested User Chips */}
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 border-t border-neutral-800/60 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs text-neutral-400">
        <span className="flex items-center gap-1 font-medium text-neutral-400 shrink-0">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Popular:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {POPULAR_USERS.map((user) => (
            <button
              key={user.name}
              id={`quick-user-${user.name}`}
              onClick={() => handleQuickSelect(user.name)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                currentUsername.toLowerCase() === user.name.toLowerCase()
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                  : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 border border-neutral-700/60'
              }`}
            >
              @{user.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
