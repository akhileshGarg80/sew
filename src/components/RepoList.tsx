import React, { useState, useMemo } from 'react';
import { Search, Star, GitFork, BookMarked, ArrowUpDown, ChevronRight, Lock } from 'lucide-react';
import { GitHubRepo } from '../types';
import { formatTimeAgo } from '../services/github';

interface RepoListProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  isLoading: boolean;
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
};

export const RepoList: React.FC<RepoListProps> = ({
  repos,
  selectedRepo,
  onSelectRepo,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'name'>('updated');

  const filteredAndSortedRepos = useMemo(() => {
    let list = repos.filter((repo) => {
      const matchName = repo.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDesc = repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLang = repo.language?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchDesc || matchLang;
    });

    list = [...list].sort((a, b) => {
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
  }, [repos, searchTerm, sortBy]);

  return (
    <div id="repo-list-panel" className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Panel Top Header */}
      <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/40 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-neutral-200">Repositories</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-neutral-800 text-neutral-300">
              {repos.length}
            </span>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <ArrowUpDown className="w-3 h-3" />
            <select
              id="sort-repos-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'stars' | 'name')}
              aria-label="Sort repositories"
              className="bg-neutral-900 border border-neutral-700/80 rounded-md px-2 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
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
            placeholder="Filter repositories..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-neutral-950 border border-neutral-700/80 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Repo List Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/60 p-2 space-y-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/40 space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-800/60 rounded w-full"></div>
                <div className="h-3 bg-neutral-800/40 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedRepos.length === 0 ? (
          <div className="text-center py-12 px-4 text-neutral-500 text-xs">
            {searchTerm ? 'No repositories match your filter' : 'No public repositories found for this user.'}
          </div>
        ) : (
          filteredAndSortedRepos.map((repo) => {
            const isSelected = selectedRepo?.id === repo.id;
            return (
              <button
                key={repo.id}
                id={`repo-item-${repo.name}`}
                onClick={() => onSelectRepo(repo)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-150 relative group ${
                  isSelected
                    ? 'bg-neutral-800 border border-emerald-500/50 shadow-sm text-neutral-100'
                    : 'hover:bg-neutral-800/60 text-neutral-300 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-neutral-100 truncate group-hover:text-emerald-400 transition-colors">
                        {repo.name}
                      </span>
                      {repo.private && (
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>

                    {repo.description && (
                      <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                        {repo.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-neutral-400 font-mono">
                      {repo.language && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              LANGUAGE_COLORS[repo.language] || 'bg-neutral-400'
                            }`}
                          />
                          <span>{repo.language}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-amber-400/90 shrink-0">
                        <Star className="w-3 h-3 fill-amber-400/20" />
                        <span>{repo.stargazers_count}</span>
                      </div>

                      {repo.forks_count > 0 && (
                        <div className="flex items-center gap-1 text-neutral-400 shrink-0">
                          <GitFork className="w-3 h-3" />
                          <span>{repo.forks_count}</span>
                        </div>
                      )}

                      <span className="text-neutral-500 ml-auto shrink-0 font-sans">
                        {formatTimeAgo(repo.pushed_at || repo.updated_at)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                      isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-neutral-600 group-hover:text-neutral-400'
                    }`}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
