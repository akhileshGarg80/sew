import React, { useState, useMemo } from 'react';
import {
  Globe,
  ExternalLink,
  Github,
  Code2,
  FileCode2,
  Tag,
  Link2,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Compass,
  Laptop,
} from 'lucide-react';
import { GitHubRepo, GitHubUser } from '../types';
import { getProductionUrl } from '../services/github';

interface RightLinksRailProps {
  repos: GitHubRepo[];
  selectedRepo: GitHubRepo | null;
  user: GitHubUser | null;
  activeOverlayUrl: string | null;
  isOverlayOpen: boolean;
  onSelectLink: (url: string, title: string, repo: GitHubRepo | null) => void;
  railMode: 'compact' | 'expanded';
  setRailMode: React.Dispatch<React.SetStateAction<'compact' | 'expanded'>>;
}

function getShortDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

export const RightLinksRail: React.FC<RightLinksRailProps> = ({
  repos,
  selectedRepo,
  user,
  activeOverlayUrl,
  isOverlayOpen,
  onSelectLink,
  railMode,
  setRailMode,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'live'>('live');

  // Repos that have a live deployed site
  const liveRepos = useMemo(() => {
    return repos
      .map((r) => ({
        repo: r,
        url: getProductionUrl(r),
      }))
      .filter((item): item is { repo: GitHubRepo; url: string } => Boolean(item.url));
  }, [repos]);

  const activeRepoProdUrl = selectedRepo ? getProductionUrl(selectedRepo) : null;

  const activeRepoDevUrl = selectedRepo
    ? `https://github.dev/${selectedRepo.owner.login}/${selectedRepo.name}`
    : null;

  return (
    <aside
      id="right-links-rail"
      aria-label="Repository Links & Live Demos"
      className={`h-full bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 select-none transition-all duration-200 z-50 ${
        railMode === 'compact' ? 'w-14' : 'w-48 sm:w-56'
      }`}
    >
      {/* Rail Header */}
      <div className="h-12 border-b border-neutral-800 bg-neutral-950/80 px-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0">
            <Globe className="w-3.5 h-3.5" />
          </div>
          {railMode === 'expanded' && (
            <div className="min-w-0">
              <h3 className="text-[11px] font-bold text-neutral-200 uppercase tracking-wider truncate">
                Links & Demos
              </h3>
              <p className="text-[9px] text-neutral-500 font-mono truncate">
                {liveRepos.length} live sites
              </p>
            </div>
          )}
        </div>

        {/* Toggle between compact (icon only) & expanded (short url) */}
        <button
          id="toggle-rail-mode-btn"
          onClick={() => setRailMode((prev) => (prev === 'compact' ? 'expanded' : 'compact'))}
          className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          title={railMode === 'compact' ? 'Expand to see short URLs' : 'Collapse to icons only'}
        >
          {railMode === 'compact' ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Filter Tabs (when expanded) */}
      {railMode === 'expanded' && (
        <div className="p-1.5 border-b border-neutral-800/80 bg-neutral-950/40 flex items-center gap-1 text-[10px] font-mono">
          <button
            onClick={() => setFilterType('live')}
            className={`flex-1 py-1 px-1.5 rounded text-center transition-colors ${
              filterType === 'live'
                ? 'bg-neutral-800 text-emerald-300 font-medium'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            Live ({liveRepos.length})
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1 px-1.5 rounded text-center transition-colors ${
              filterType === 'all'
                ? 'bg-neutral-800 text-emerald-300 font-medium'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            All Repos ({repos.length})
          </button>
        </div>
      )}

      {/* Links Scroll Area */}
      <div
        id="right-links-scroll-list"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5 space-y-3"
      >
        {/* SECTION 1: Active Repo Specific Links */}
        {selectedRepo && (
          <div className="space-y-1">
            {railMode === 'expanded' && (
              <div className="px-1 text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Active Repo
              </div>
            )}

            {/* Active Repo Live Site */}
            {activeRepoProdUrl ? (
              <button
                id="rail-active-live-btn"
                onClick={() => onSelectLink(activeRepoProdUrl, `${selectedRepo.name} Live`, selectedRepo)}
                className={`w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 group relative border ${
                  isOverlayOpen && activeOverlayUrl === activeRepoProdUrl
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-emerald-950/40 border-emerald-700/40 hover:bg-emerald-950/80 text-neutral-200'
                }`}
                title={`Open live site for ${selectedRepo.name}: ${activeRepoProdUrl}`}
              >
                <div className="w-7 h-7 rounded-md bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <Globe className="w-3.5 h-3.5 animate-pulse" />
                </div>
                {railMode === 'expanded' && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-emerald-300 truncate">
                      {getShortDomain(activeRepoProdUrl)}
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono truncate">Live Site</p>
                  </div>
                )}
                {/* Active Indicator dot */}
                {isOverlayOpen && activeOverlayUrl === activeRepoProdUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute right-1.5 top-1.5 animate-ping" />
                )}
              </button>
            ) : null}

            {/* Active Repo GitHub Link */}
            <a
              href={selectedRepo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 group relative border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white"
              title={`View ${selectedRepo.name} on GitHub`}
            >
              <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 shrink-0">
                <Github className="w-3.5 h-3.5" />
              </div>
              {railMode === 'expanded' && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-neutral-200 truncate">github.com</p>
                  <p className="text-[9px] text-neutral-500 font-mono truncate">{selectedRepo.name}</p>
                </div>
              )}
            </a>

            {/* Active Repo Web Editor (github.dev) */}
            {activeRepoDevUrl && (
              <a
                href={activeRepoDevUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 group relative border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-sky-300"
                title={`Open ${selectedRepo.name} in Web VS Code`}
              >
                <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-sky-400 shrink-0">
                  <FileCode2 className="w-3.5 h-3.5" />
                </div>
                {railMode === 'expanded' && (
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-sky-300 truncate">github.dev</p>
                    <p className="text-[9px] text-neutral-500 font-mono truncate">VS Code Web</p>
                  </div>
                )}
              </a>
            )}
          </div>
        )}

        {/* SECTION 2: All Live Sites Across Repositories */}
        <div className="space-y-1 pt-1">
          {railMode === 'expanded' && (
            <div className="px-1 text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center justify-between">
              <span>{filterType === 'live' ? 'Live Deployments' : 'All Repos'}</span>
              <span className="text-emerald-400">{filterType === 'live' ? liveRepos.length : repos.length}</span>
            </div>
          )}

          {filterType === 'live' ? (
            liveRepos.length === 0 ? (
              <div className="text-center py-4 px-1 text-[10px] text-neutral-500">
                {railMode === 'expanded' ? 'No live sites in repos' : '—'}
              </div>
            ) : (
              liveRepos.map(({ repo, url }) => {
                const isCurrentActive = isOverlayOpen && activeOverlayUrl === url;
                const shortDomain = getShortDomain(url);

                return (
                  <div
                    key={repo.id}
                    className="relative group flex items-center"
                  >
                    <button
                      id={`rail-link-${repo.name}`}
                      onClick={() => onSelectLink(url, `${repo.name} Live`, repo)}
                      className={`w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 border cursor-pointer ${
                        isCurrentActive
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                      title={`Click to open live site for ${repo.name} (${shortDomain})`}
                    >
                      <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Globe className="w-3.5 h-3.5" />
                      </div>

                      {railMode === 'expanded' && (
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-neutral-200 truncate group-hover:text-emerald-300">
                            {shortDomain}
                          </p>
                          <p className="text-[9px] text-neutral-500 font-mono truncate">
                            {repo.name}
                          </p>
                        </div>
                      )}

                      {/* Small External Link Icon */}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded text-neutral-500 hover:text-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Open in new browser tab"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </button>
                  </div>
                );
              })
            )
          ) : (
            /* All Repos Quick Jump Links */
            repos.map((repo) => {
              const prodUrl = getProductionUrl(repo);
              const targetUrl = prodUrl || repo.html_url;
              const isCurrentActive = isOverlayOpen && activeOverlayUrl === targetUrl;

              return (
                <button
                  key={repo.id}
                  onClick={() => onSelectLink(targetUrl, repo.name, repo)}
                  className={`w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 border cursor-pointer ${
                    isCurrentActive
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                  title={`${repo.name}: ${targetUrl}`}
                >
                  <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 shrink-0">
                    {prodUrl ? <Globe className="w-3.5 h-3.5 text-emerald-400" /> : <Github className="w-3.5 h-3.5" />}
                  </div>

                  {railMode === 'expanded' && (
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-neutral-200 truncate">
                        {repo.name}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-mono truncate">
                        {prodUrl ? getShortDomain(prodUrl) : 'github.com'}
                      </p>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* SECTION 3: User Portfolio / Blog Link */}
        {user?.blog && (
          <div className="pt-2 border-t border-neutral-800/80">
            {railMode === 'expanded' && (
              <div className="px-1 text-[9px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1">
                Author Site
              </div>
            )}
            <button
              onClick={() => {
                const blogUrl = user.blog!.startsWith('http') ? user.blog! : `https://${user.blog}`;
                onSelectLink(blogUrl, `@${user.login} Website`, null);
              }}
              className="w-full rounded-lg text-left transition-all p-1.5 flex items-center gap-2 border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white group"
              title={`Author blog: ${user.blog}`}
            >
              <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-amber-400 shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              {railMode === 'expanded' && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-amber-300 truncate">
                    {getShortDomain(user.blog)}
                  </p>
                  <p className="text-[9px] text-neutral-500 font-mono truncate">@{user.login}</p>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Rail Footer */}
      <div className="p-2 border-t border-neutral-800 bg-neutral-950/60 text-center text-[10px] font-mono text-neutral-500 shrink-0">
        {railMode === 'expanded' ? (
          <span>Click to launch site box</span>
        ) : (
          <Globe className="w-3.5 h-3.5 mx-auto text-neutral-600" />
        )}
      </div>
    </aside>
  );
};
