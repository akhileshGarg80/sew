import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Github,
  Key,
  RefreshCw,
  GitBranch,
  Star,
  GitFork,
  Download,
  ExternalLink,
  ChevronDown,
  Globe,
  SlidersHorizontal,
  Code2,
  FileCode2,
  Users,
  MapPin,
  Building,
  Calendar,
  Columns,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  History,
  X,
  Trash2,
} from 'lucide-react';
import { GitHubUser, GitHubRepo, RateLimitInfo } from '../types';
import { getProductionUrl } from '../services/github';
import {
  getRecentUsers,
  saveRecentUser,
  removeRecentUser,
  clearRecentUsers,
} from '../utils/recentUsers';

interface HeaderProps {
  currentUsername: string;
  user: GitHubUser | null;
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  onSearch: (username: string) => void;
  isLoading: boolean;
  rateLimit: RateLimitInfo | null;
  onOpenTokenModal: () => void;
  onOpenQuickFileSearch: () => void;
  showRepoSidebar: boolean;
  setShowRepoSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  showActivitySidebar: boolean;
  setShowActivitySidebar: React.Dispatch<React.SetStateAction<boolean>>;
  isSplitCodeLive: boolean;
  setIsSplitCodeLive: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenLivePreview?: () => void;
  onReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUsername,
  user,
  repos,
  selectedRepo,
  onSelectRepo,
  onSearch,
  isLoading,
  rateLimit,
  onOpenTokenModal,
  onOpenQuickFileSearch,
  showRepoSidebar,
  setShowRepoSidebar,
  showActivitySidebar,
  setShowActivitySidebar,
  isSplitCodeLive,
  setIsSplitCodeLive,
  onOpenLivePreview,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(currentUsername);
  const [showUserPopover, setShowUserPopover] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentUsers());

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const userPopoverRef = useRef<HTMLDivElement>(null);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  // Sync search input when username changes
  useEffect(() => {
    setSearchInput(currentUsername);
  }, [currentUsername]);

  // Sync recent searches with storage events
  useEffect(() => {
    const handleUpdate = () => {
      setRecentSearches(getRecentUsers());
    };
    window.addEventListener('recent-users-updated', handleUpdate);
    return () => window.removeEventListener('recent-users-updated', handleUpdate);
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userPopoverRef.current && !userPopoverRef.current.contains(e.target as Node)) {
        setShowUserPopover(false);
      }
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node)) {
        setShowRepoDropdown(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSearchHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      saveRecentUser(trimmed);
      setRecentSearches(getRecentUsers());
      onSearch(trimmed);
      setShowSearchHistory(false);
    }
  };

  const handleSelectRecent = (name: string) => {
    setSearchInput(name);
    saveRecentUser(name);
    setRecentSearches(getRecentUsers());
    onSearch(name);
    setShowSearchHistory(false);
  };

  const handleRemoveRecent = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    removeRecentUser(name);
    setRecentSearches(getRecentUsers());
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentUsers();
    setRecentSearches([]);
  };

  const prodUrl = selectedRepo ? getProductionUrl(selectedRepo) : null;

  const downloadZipUrl = selectedRepo
    ? `https://github.com/${selectedRepo.owner.login}/${selectedRepo.name}/archive/refs/heads/${
        selectedRepo.default_branch || 'main'
      }.zip`
    : null;

  const githubDevUrl = selectedRepo
    ? `https://github.dev/${selectedRepo.owner.login}/${selectedRepo.name}`
    : null;

  return (
    <header
      id="app-top-nav"
      className="h-13 shrink-0 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between gap-2.5 z-40 select-none relative"
    >
      {/* Left Section: Logo, User Badge & Breadcrumb / Repo Switcher */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Brand Logo */}
        <button
          type="button"
          id="brand-logo-home-btn"
          onClick={onReset}
          className="flex items-center gap-2 shrink-0 group cursor-pointer text-left focus:outline-hidden"
          title="Return to clean home search"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-700 flex items-center justify-center text-neutral-100 shadow-xs group-hover:border-emerald-500 transition-colors">
            <Github className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-bold text-sm text-neutral-100 hidden sm:inline tracking-tight group-hover:text-emerald-300 transition-colors">
            GitInspect
          </span>
        </button>

        <div className="h-5 w-px bg-neutral-800 hidden sm:block" />

        {/* User Pill with Interactive Popover or Clean Placeholder */}
        {user ? (
          <div ref={userPopoverRef} className="relative shrink-0">
            <button
              id="user-profile-popover-btn"
              onClick={() => setShowUserPopover((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-200 transition-colors shadow-xs"
              title="Click to view author details, stats & links"
            >
              <img
                src={user.avatar_url}
                alt={user.login}
                referrerPolicy="no-referrer"
                className="w-5 h-5 rounded-full border border-neutral-700 shrink-0"
              />
              <span className="font-semibold text-neutral-100 max-w-[90px] sm:max-w-[120px] truncate">
                @{user.login}
              </span>
              <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-neutral-400 font-mono">
                {user.public_repos} repos
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {/* Profile Popover (Overlay that doesn't eat vertical screen height) */}
            {showUserPopover && (
              <div
                id="user-profile-popover"
                className="absolute left-0 top-full mt-1.5 w-72 bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2.5 text-xs text-neutral-300"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-full border border-neutral-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-neutral-100 truncate">
                      {user.name || user.login}
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-mono">@{user.login}</p>
                    {user.bio && (
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Followers</span>
                    <span className="text-neutral-200 font-medium">{user.followers}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Public Repos</span>
                    <span className="text-neutral-200 font-medium">{user.public_repos}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-neutral-400 pt-1">
                  {user.blog && (
                    <a
                      href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-400 hover:underline truncate"
                    >
                      <Globe className="w-3 h-3 shrink-0" />
                      <span className="truncate">{user.blog}</span>
                    </a>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0 text-neutral-500" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                  {user.company && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Building className="w-3 h-3 shrink-0 text-neutral-500" />
                      <span className="truncate">{user.company}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-neutral-800">
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors text-[11px]"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Selected Repo Dropdown Selector */}
        {selectedRepo && (
          <div ref={repoDropdownRef} className="relative min-w-0">
            <button
              id="top-nav-repo-selector-btn"
              onClick={() => setShowRepoDropdown((prev) => !prev)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-200 transition-colors max-w-[130px] sm:max-w-[200px] md:max-w-[240px] truncate shadow-xs"
              title={`Active repo: ${selectedRepo.name}. Click to switch repo`}
            >
              <span className="text-neutral-500 hidden md:inline">/</span>
              <span className="font-semibold text-emerald-400 truncate">{selectedRepo.name}</span>
              <div className="flex items-center gap-1 text-[10px] text-neutral-400 shrink-0 ml-0.5">
                <GitBranch className="w-3 h-3 text-neutral-500" />
                <span className="hidden xl:inline">{selectedRepo.default_branch || 'main'}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            </button>

            {/* Quick Repo Selector Dropdown */}
            {showRepoDropdown && (
              <div
                id="top-nav-repo-dropdown"
                className="absolute left-0 top-full mt-1.5 w-72 bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto divide-y divide-neutral-800/60"
              >
                <div className="p-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Switch Repository ({repos.length})
                </div>
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => {
                      onSelectRepo(repo);
                      setShowRepoDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      repo.id === selectedRepo.id
                        ? 'bg-emerald-950/80 text-emerald-300 font-medium'
                        : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate font-semibold">{repo.name}</p>
                      {repo.description && (
                        <p className="text-[10px] text-neutral-500 truncate">{repo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400/30" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center Section: Search User Input with History dropdown */}
      <div ref={searchBoxRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-2">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            id="global-user-search-input"
            type="text"
            value={searchInput}
            onFocus={() => setShowSearchHistory(true)}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search GitHub user (e.g. torvalds)..."
            className="w-full pl-8 pr-22 py-1.5 rounded-lg bg-neutral-950 border border-neutral-750 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />

          {/* Right Action Group inside Input: History dropdown trigger & Go button */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* History dropdown toggle button */}
            <button
              type="button"
              id="toggle-recent-searches-dropdown-btn"
              onClick={() => setShowSearchHistory((prev) => !prev)}
              className={`p-1 rounded-md transition-colors flex items-center gap-1 text-[10px] font-mono ${
                showSearchHistory
                  ? 'bg-neutral-800 text-emerald-300'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
              title="View saved profiles from localStorage"
            >
              <History className="w-3.5 h-3.5" />
              {recentSearches.length > 0 && (
                <span className="hidden sm:inline bg-neutral-800 px-1 rounded text-[9px] text-neutral-300 font-mono">
                  {recentSearches.length}
                </span>
              )}
            </button>

            {/* Go submit button */}
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Go</span>}
            </button>
          </div>
        </form>

        {/* Recent Searches Dropdown */}
        {showSearchHistory && (
          <div
            id="recent-searches-dropdown"
            className="absolute left-0 right-0 top-full mt-1.5 bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-neutral-800/60"
          >
            <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider pb-1.5">
              <span className="flex items-center gap-1.5">
                <History className="w-3 h-3 text-emerald-400" />
                Saved Searches ({recentSearches.length})
              </span>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllRecent}
                  className="text-neutral-500 hover:text-rose-400 text-[10px] normal-case flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <div className="py-3 px-2 text-center text-neutral-500 text-[11px]">
                No saved users yet. Search any username to save it in localStorage.
              </div>
            ) : (
              <div className="py-1 max-h-56 overflow-y-auto space-y-0.5">
                {recentSearches.map((name) => (
                  <div
                    key={name}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-neutral-800/90 text-neutral-300 hover:text-neutral-100 group transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectRecent(name)}
                      className="flex-1 text-left flex items-center gap-2 min-w-0"
                    >
                      <span className="font-mono text-xs text-emerald-300 group-hover:text-emerald-200 truncate">
                        @{name}
                      </span>
                      <span className="text-[10px] text-neutral-500 group-hover:text-neutral-300">
                        Load
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecent(e, name)}
                      className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-700/50 transition-colors shrink-0"
                      title={`Remove @${name} from saved searches`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Quick File Finder, View Modes, Export & Rate Limit */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick File Search Modal Trigger (Ctrl+P) */}
        <button
          id="trigger-quick-file-search-btn"
          onClick={onOpenQuickFileSearch}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-750 hover:border-neutral-600 text-xs text-neutral-300 hover:text-neutral-100 transition-colors shadow-xs"
          title="Jump to any file (Ctrl + P)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono text-[11px]">Jump to File</span>
          <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400 border border-neutral-700">
            Ctrl+P
          </kbd>
        </button>

        {/* Live Site Shortcut Pill (if available) */}
        {prodUrl && (
          <button
            id="top-nav-live-site-btn"
            onClick={onOpenLivePreview}
            className="hidden lg:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-mono transition-colors shadow-xs"
            title={`Preview live production deployment: ${prodUrl}`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Live Site</span>
          </button>
        )}

        {/* Split Code + Live View Toggle */}
        <button
          id="toggle-split-code-live-btn"
          onClick={() => setIsSplitCodeLive((prev) => !prev)}
          className={`p-1.5 rounded-lg border text-xs transition-colors hidden sm:flex items-center gap-1 ${
            isSplitCodeLive
              ? 'bg-emerald-950 text-emerald-300 border-emerald-600/60 shadow-xs'
              : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border-neutral-800'
          }`}
          title={isSplitCodeLive ? 'Disable Split Screen' : 'Side-by-Side Split View (Code + Live)'}
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden xl:inline text-[11px]">Split View</span>
        </button>

        {/* Sidebar Visibility Toggles (To expand Code & Live View width) */}
        <div className="hidden lg:flex items-center bg-neutral-950 p-0.5 rounded-lg border border-neutral-800">
          <button
            id="toggle-repo-sidebar-btn"
            onClick={() => setShowRepoSidebar((prev) => !prev)}
            className={`p-1 rounded transition-colors ${
              showRepoSidebar
                ? 'text-neutral-200 bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title={showRepoSidebar ? 'Hide Repositories sidebar (give more space to code)' : 'Show Repositories sidebar'}
          >
            {showRepoSidebar ? (
              <PanelLeftClose className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            id="toggle-activity-sidebar-btn"
            onClick={() => setShowActivitySidebar((prev) => !prev)}
            className={`p-1 rounded transition-colors ${
              showActivitySidebar
                ? 'text-neutral-200 bg-neutral-800'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title={showActivitySidebar ? 'Hide Activity sidebar (give more space to code)' : 'Show Activity sidebar'}
          >
            {showActivitySidebar ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* External Web Editor / Download ZIP */}
        {selectedRepo && (
          <div className="hidden xl:flex items-center gap-1">
            {githubDevUrl && (
              <a
                id="top-nav-github-dev-link"
                href={githubDevUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors"
                title="Open in VS Code for Web (github.dev)"
              >
                <FileCode2 className="w-3.5 h-3.5 text-sky-400" />
              </a>
            )}

            {downloadZipUrl && (
              <a
                id="top-nav-download-zip-link"
                href={downloadZipUrl}
                download
                className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-neutral-100 transition-colors"
                title="Download full repository as ZIP"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </a>
            )}
          </div>
        )}

        {/* Rate Limit & Token Pill */}
        <button
          id="top-nav-token-btn"
          onClick={onOpenTokenModal}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-xs font-mono text-neutral-300 hover:text-neutral-100 transition-colors shadow-xs"
          title="GitHub Personal Access Token & API Rate Limit status"
        >
          <Key className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">
            <strong className={rateLimit && rateLimit.remaining < 10 ? 'text-rose-400' : 'text-emerald-400'}>
              {rateLimit ? `${rateLimit.remaining}/${rateLimit.limit}` : '60/60'}
            </strong>
          </span>
        </button>
      </div>
    </header>
  );
};
