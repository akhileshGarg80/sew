import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Star,
  GitFork,
  BookMarked,
  ArrowUpDown,
  ChevronRight,
  Lock,
  Globe,
  ExternalLink,
  Sparkles,
  Pin,
  Check,
  Copy,
} from 'lucide-react';
import { GitHubRepo } from '../types';
import { formatTimeAgo, getProductionUrl } from '../services/github';

interface RepoListProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  isLoading: boolean;
  onOpenLivePreview?: (repo: GitHubRepo) => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Python: 'bg-sky-500',
  HTML: 'bg-orange-500',
  CSS: 'bg-indigo-400',
  Rust: 'bg-amber-600',
  Go: 'bg-cyan-500',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-neutral-400',
  PHP: 'bg-purple-400',
  Ruby: 'bg-rose-600',
  Swift: 'bg-orange-600',
  Kotlin: 'bg-violet-500',
  Shell: 'bg-emerald-500',
  Vue: 'bg-emerald-400',
  Dart: 'bg-blue-400',
};

export const RepoList: React.FC<RepoListProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
  isLoading,
  onOpenLivePreview,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');
  const [filterType, setFilterType] = useState<'all' | 'live' | 'starred' | 'pinned'>('all');
  const [copiedCloneRepoId, setCopiedCloneRepoId] = useState<number | null>(null);

  // Pinned repos in localStorage
  const [pinnedRepoIds, setPinnedRepoIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('gh_explorer_pinned_repos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePin = (repoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedRepoIds((prev) => {
      const next = prev.includes(repoId) ? prev.filter((id) => id !== repoId) : [...prev, repoId];
      try {
        localStorage.setItem('gh_explorer_pinned_repos', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleCopyClone = (repo: GitHubRepo, e: React.MouseEvent) => {
    e.stopPropagation();
    const cloneCmd = `git clone ${repo.clone_url || repo.html_url}.git`;
    navigator.clipboard.writeText(cloneCmd);
    setCopiedCloneRepoId(repo.id);
    setTimeout(() => setCopiedCloneRepoId(null), 2000);
  };

  const liveReposCount = useMemo(() => {
    return repos.filter((r) => Boolean(getProductionUrl(r))).length;
  }, [repos]);

  const starredReposCount = useMemo(() => {
    return repos.filter((r) => r.stargazers_count > 0).length;
  }, [repos]);

  const pinnedReposCount = useMemo(() => {
    return repos.filter((r) => pinnedRepoIds.includes(r.id)).length;
  }, [repos, pinnedRepoIds]);

  const filteredAndSortedRepos = useMemo(() => {
    let list = repos.filter((repo) => {
      // Filter by type
      if (filterType === 'live' && !getProductionUrl(repo)) return false;
      if (filterType === 'starred' && repo.stargazers_count === 0) return false;
      if (filterType === 'pinned' && !pinnedRepoIds.includes(repo.id)) return false;

      // Search
      const query = searchTerm.toLowerCase();
      const matchName = repo.name.toLowerCase().includes(query);
      const matchDesc = repo.description?.toLowerCase().includes(query);
      const matchLang = repo.language?.toLowerCase().includes(query);
      const matchUrl = repo.homepage?.toLowerCase().includes(query);
      return matchName || matchDesc || matchLang || matchUrl;
    });

    list = [...list].sort((a, b) => {
      // If pinned, pin to the very top in 'all' view
      const aPinned = pinnedRepoIds.includes(a.id);
      const bPinned = pinnedRepoIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      if (sortBy === 'stars') {
        return b.stargazers_count - a.stargazers_count;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      // default: updated
      return new Date(b.pushed_at || b.updated_at).getTime() - new Date(a.pushed_at || a.updated_at).getTime();
    });

    return list;
  }, [repos, searchTerm, sortBy, filterType, pinnedRepoIds]);

  return (
    <div
      id="repo-list-panel"
      className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800 overflow-hidden select-none"
    >
      {/* Panel Top Header */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/60 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-neutral-200">Repositories</h2>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">
              {repos.length}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
            <ArrowUpDown className="w-3 h-3" />
            <select
              id="sort-repos-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'stars' | 'name')}
              aria-label="Sort repositories"
              className="bg-neutral-900 border border-neutral-750 rounded-md px-1.5 py-0.5 text-[11px] text-neutral-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="updated">Recent</option>
              <option value="stars">Stars</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Search inside repos */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            id="search-repos-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by name, language, live URL..."
            className="w-full pl-8 pr-3 py-1 rounded-md bg-neutral-950 border border-neutral-750 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Badges: All, Live Prod, Starred, Pinned */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[10px] font-medium">
          <button
            id="filter-all-repos-btn"
            onClick={() => setFilterType('all')}
            className={`px-2 py-0.5 rounded transition-colors shrink-0 ${
              filterType === 'all'
                ? 'bg-neutral-800 text-emerald-400 border border-neutral-700'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            All ({repos.length})
          </button>

          <button
            id="filter-live-repos-btn"
            onClick={() => setFilterType('live')}
            title="Repositories with live production or demo website"
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 ${
              filterType === 'live'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                : 'text-neutral-400 hover:text-emerald-300 hover:bg-neutral-850'
            }`}
          >
            <Globe className="w-3 h-3 text-emerald-400" />
            <span>Live ({liveReposCount})</span>
          </button>

          <button
            id="filter-starred-repos-btn"
            onClick={() => setFilterType('starred')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 ${
              filterType === 'starred'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-850'
            }`}
          >
            <Star className="w-3 h-3 text-amber-400" />
            <span>Starred ({starredReposCount})</span>
          </button>

          {pinnedReposCount > 0 && (
            <button
              id="filter-pinned-repos-btn"
              onClick={() => setFilterType('pinned')}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 ${
                filterType === 'pinned'
                  ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-600/50'
                  : 'text-neutral-400 hover:text-indigo-300 hover:bg-neutral-850'
              }`}
            >
              <Pin className="w-3 h-3 text-indigo-400 rotate-45" />
              <span>Pinned ({pinnedReposCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Repo List Container - Independent Scrolling */}
      <div
        id="repo-list-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-neutral-800/60 p-2 space-y-1"
      >
        {isLoading ? (
          <div className="p-3 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="animate-pulse p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/40 space-y-2"
              >
                <div className="h-3.5 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-2.5 bg-neutral-800/60 rounded w-full"></div>
                <div className="h-2.5 bg-neutral-800/40 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedRepos.length === 0 ? (
          <div className="text-center py-12 px-4 text-neutral-500 text-xs">
            {searchTerm
              ? 'No repositories match your filter'
              : filterType === 'live'
              ? 'No repositories with live production URL found.'
              : filterType === 'pinned'
              ? 'No pinned repositories. Click the pin icon on any repo to keep it here.'
              : filterType === 'starred'
              ? 'No starred repositories found.'
              : 'No public repositories found for this user.'}
          </div>
        ) : (
          filteredAndSortedRepos.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id;
            const isPinned = pinnedRepoIds.includes(repo.id);
            const isCopiedClone = copiedCloneRepoId === repo.id;
            const prodUrl = getProductionUrl(repo);

            return (
              <div
                key={repo.id}
                id={`repo-item-${repo.name}`}
                onClick={() => onSelectRepo(repo)}
                className={`w-full text-left p-2.5 rounded-lg transition-all duration-150 relative group cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-800/90 border border-emerald-500/60 shadow-md text-neutral-100'
                    : 'hover:bg-neutral-800/50 text-neutral-300 border border-neutral-800/40 bg-neutral-950/40'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isPinned && (
                        <Pin className="w-3 h-3 text-indigo-400 rotate-45 shrink-0" />
                      )}
                      <span className="font-semibold text-xs text-neutral-100 truncate group-hover:text-emerald-400 transition-colors">
                        {repo.name}
                      </span>
                      {repo.private && (
                        <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                      )}
                      {repo.archived && (
                        <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 rounded">
                          Archived
                        </span>
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                        {repo.description}
                      </p>
                    )}

                    {/* Production / Live URL Badge & Direct Link */}
                    {prodUrl && (
                      <div className="mt-1.5 flex items-center gap-1 flex-wrap">
                        <a
                          id={`repo-live-url-${repo.name}`}
                          href={prodUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`Open live production site: ${prodUrl}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono hover:bg-emerald-900 transition-colors shadow-xs"
                        >
                          <Globe className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                          <span className="truncate max-w-[140px]">
                            {prodUrl.replace(/^https?:\/\//, '')}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-80" />
                        </a>

                        {onOpenLivePreview && (
                          <button
                            id={`repo-preview-btn-${repo.name}`}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenLivePreview(repo);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-[10px] font-mono transition-colors"
                            title="Open live sandbox preview in inspector"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Preview</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Bottom Metadata (Language, Stars, Forks, Updated, Actions) */}
                    <div className="flex items-center gap-2.5 mt-2 text-[10px] text-neutral-400 font-mono flex-wrap">
                      {repo.language && (
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              LANGUAGE_COLORS[repo.language] || 'bg-neutral-400'
                            }`}
                          />
                          <span className="text-neutral-300">{repo.language}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-0.5 text-neutral-400">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400/20" />
                        <span>{repo.stargazers_count}</span>
                      </div>

                      <div className="flex items-center gap-0.5 text-neutral-400">
                        <GitFork className="w-2.5 h-2.5" />
                        <span>{repo.forks_count}</span>
                      </div>

                      <span className="text-neutral-500 text-[10px]">
                        {formatTimeAgo(repo.pushed_at || repo.updated_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions Right (Pin & Copy Clone) */}
                  <div className="flex flex-col items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => togglePin(repo.id, e)}
                      className={`p-1 rounded transition-colors ${
                        isPinned
                          ? 'text-indigo-400 bg-indigo-950/60'
                          : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800'
                      }`}
                      title={isPinned ? 'Unpin repository' : 'Pin to top of list'}
                    >
                      <Pin className={`w-3 h-3 ${isPinned ? 'rotate-45 fill-indigo-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleCopyClone(repo, e)}
                      className="p-1 rounded text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
                      title="Copy git clone command"
                    >
                      {isCopiedClone ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
