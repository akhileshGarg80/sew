import React, { useState, useMemo } from 'react';
import {
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Info,
  ExternalLink,
  CheckCircle2,
  GitMerge,
  Search,
  MessageCircle,
  Clock,
  User,
  Copy,
  Check,
  Tag,
  Scale,
  Eye,
  RefreshCw,
  Globe,
  Users,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  GitHubRepo,
  GitHubCommit,
  GitHubPullRequest,
  GitHubComment,
  GitHubContributor,
  GitHubRelease,
  RepoLanguages,
} from '../types';
import { formatTimeAgo, formatBytes, getProductionUrl } from '../services/github';

interface ActivityPanelProps {
  repo: GitHubRepo | null;
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  comments: GitHubComment[];
  languages?: RepoLanguages | null;
  contributors?: GitHubContributor[];
  releases?: GitHubRelease[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenLivePreview?: () => void;
}

type TabType = 'comments' | 'prs' | 'commits' | 'overview';

const LANGUAGE_BAR_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
};

export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  repo,
  commits,
  pullRequests,
  comments,
  languages,
  contributors = [],
  releases = [],
  isLoading,
  onRefresh,
  onOpenLivePreview,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const [prFilter, setPrFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [commentFilter, setCommentFilter] = useState<'all' | 'issue' | 'commit' | 'pull_request_review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedClone, setCopiedClone] = useState(false);

  const prodUrl = useMemo(() => getProductionUrl(repo), [repo]);

  // Language breakdown calculations
  const languageStats = useMemo(() => {
    if (!languages || Object.keys(languages).length === 0) return [];
    const entries = Object.entries(languages);
    const total = entries.reduce((sum, [, bytes]) => sum + Number(bytes), 0);
    if (total === 0) return [];

    return entries
      .map(([lang, bytes]) => {
        const byteNum = Number(bytes);
        return {
          name: lang,
          bytes: byteNum,
          percentage: ((byteNum / total) * 100).toFixed(1),
          color: LANGUAGE_BAR_COLORS[lang] || '#94a3b8',
        };
      })
      .sort((a, b) => b.bytes - a.bytes);
  }, [languages]);

  const filteredCommits = useMemo(() => {
    return commits.filter((c) => {
      const msg = c.commit.message.toLowerCase();
      const author = (c.commit.author.name || '').toLowerCase();
      const query = searchTerm.toLowerCase();
      return msg.includes(query) || author.includes(query) || c.sha.includes(query);
    });
  }, [commits, searchTerm]);

  const filteredPRs = useMemo(() => {
    return pullRequests.filter((pr) => {
      const matchesState = prFilter === 'all' || pr.state === prFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        pr.title.toLowerCase().includes(query) ||
        pr.user.login.toLowerCase().includes(query) ||
        `#${pr.number}`.includes(query);
      return matchesState && matchesSearch;
    });
  }, [pullRequests, prFilter, searchTerm]);

  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      const matchesType = commentFilter === 'all' || c.type === commentFilter;
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        (c.body || '').toLowerCase().includes(query) ||
        c.user.login.toLowerCase().includes(query);
      return matchesType && matchesSearch;
    });
  }, [comments, commentFilter, searchTerm]);

  const handleCopyClone = () => {
    if (!repo) return;
    navigator.clipboard.writeText(`https://github.com/${repo.full_name}.git`);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  if (!repo) {
    return (
      <div id="activity-panel-empty" className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-neutral-900 select-none">
        <MessageSquare className="w-10 h-10 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">Repository Activity</p>
        <p className="text-xs text-neutral-600 mt-1">
          Select a repository to view all commits, PRs, comments & production links
        </p>
      </div>
    );
  }

  return (
    <div id="activity-panel" className="flex flex-col h-full bg-neutral-900 text-neutral-200 overflow-hidden">
      {/* Top Header & Navigation Tabs */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/60 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Repo Feed & Activity
            </span>
            {prodUrl && (
              <a
                href={prodUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Open live production site: ${prodUrl}`}
                className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-[10px] font-mono hover:bg-emerald-900 transition-colors"
              >
                <Globe className="w-2.5 h-2.5 text-emerald-400" />
                <span>Live Site</span>
              </a>
            )}
          </div>

          <button
            id="refresh-activity-btn"
            onClick={onRefresh}
            title="Refresh repository activity"
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 4 Tabs: Comments, PRs, Commits, Overview */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
          <button
            id="tab-comments-btn"
            onClick={() => {
              setActiveTab('comments');
              setSearchTerm('');
            }}
            className={`py-1.5 px-1 rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'comments'
                ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comments</span>
            <span className="text-[10px] bg-neutral-900 px-1 py-0.2 rounded-full font-mono">
              {comments.length}
            </span>
          </button>

          <button
            id="tab-prs-btn"
            onClick={() => {
              setActiveTab('prs');
              setSearchTerm('');
            }}
            className={`py-1.5 px-1 rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'prs'
                ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PRs</span>
            <span className="text-[10px] bg-neutral-900 px-1 py-0.2 rounded-full font-mono">
              {pullRequests.length}
            </span>
          </button>

          <button
            id="tab-commits-btn"
            onClick={() => {
              setActiveTab('commits');
              setSearchTerm('');
            }}
            className={`py-1.5 px-1 rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'commits'
                ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Commits</span>
            <span className="text-[10px] bg-neutral-900 px-1 py-0.2 rounded-full font-mono">
              {commits.length}
            </span>
          </button>

          <button
            id="tab-overview-btn"
            onClick={() => {
              setActiveTab('overview');
              setSearchTerm('');
            }}
            className={`py-1.5 px-1 rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </button>
        </div>

        {/* Sub-filters & Search for tabs */}
        {activeTab !== 'overview' && (
          <div className="space-y-2 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="activity-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-neutral-950 border border-neutral-700/80 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Sub-filter chips */}
            {activeTab === 'comments' && (
              <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'issue', label: 'Issues' },
                  { key: 'commit', label: 'Commits' },
                  { key: 'pull_request_review', label: 'PR Reviews' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setCommentFilter(f.key as typeof commentFilter)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors shrink-0 ${
                      commentFilter === f.key
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'prs' && (
              <div className="flex items-center gap-1 text-[11px]">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'open', label: 'Open' },
                  { key: 'closed', label: 'Closed' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setPrFilter(f.key as typeof prFilter)}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      prFilter === f.key
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content Container - Independent Scrolling */}
      <div
        id="activity-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2.5"
      >
        {isLoading ? (
          <div className="space-y-2.5 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/60 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-neutral-800"></div>
                  <div className="h-3 bg-neutral-800 rounded w-1/3"></div>
                </div>
                <div className="h-3 bg-neutral-800/60 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'comments' ? (
          /* COMMENTS TAB */
          filteredComments.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              {searchTerm
                ? 'No comments match your search filter'
                : 'No public comments found for this repository (issues, commits, or pull requests).'}
            </div>
          ) : (
            filteredComments.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                id={`comment-card-${item.id}`}
                className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.user.avatar_url}
                      alt={item.user.login}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full border border-neutral-700 shrink-0"
                    />
                    <span className="font-semibold text-neutral-200 truncate">
                      {item.user.login}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        item.type === 'issue'
                          ? 'bg-sky-950/80 text-sky-400 border border-sky-800/60'
                          : item.type === 'commit'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          : 'bg-purple-950/80 text-purple-400 border border-purple-800/60'
                      }`}
                    >
                      {item.type === 'issue'
                        ? 'Issue Comment'
                        : item.type === 'commit'
                        ? 'Commit Comment'
                        : 'PR Review'}
                    </span>
                  </div>

                  <span className="text-[11px] text-neutral-500 shrink-0">
                    {formatTimeAgo(item.created_at)}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed break-words bg-neutral-900/40 p-2 rounded border border-neutral-850">
                  {item.body}
                </p>

                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                  {item.sourceNumber && (
                    <span className="font-mono text-neutral-400">
                      #{item.sourceNumber}
                    </span>
                  )}
                  {item.path && (
                    <span className="font-mono text-neutral-400 truncate max-w-[160px]">
                      {item.path}{item.line ? `:${item.line}` : ''}
                    </span>
                  )}
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-neutral-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'prs' ? (
          /* PULL REQUESTS TAB */
          filteredPRs.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              {searchTerm
                ? 'No pull requests match your search'
                : 'No pull requests found for this filter.'}
            </div>
          ) : (
            filteredPRs.map((pr) => (
              <div
                key={pr.id}
                id={`pr-card-${pr.number}`}
                className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                          pr.state === 'open'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {pr.state === 'open' ? (
                          <GitPullRequest className="w-2.5 h-2.5" />
                        ) : (
                          <GitMerge className="w-2.5 h-2.5" />
                        )}
                        <span>{pr.state.toUpperCase()}</span>
                      </span>
                      <span className="font-semibold text-neutral-200">
                        #{pr.number}
                      </span>
                    </div>

                    <h4 className="font-medium text-neutral-100 mt-1 leading-snug">
                      {pr.title}
                    </h4>
                  </div>

                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-emerald-400 transition-colors p-0.5 shrink-0"
                    title="Open PR on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {pr.labels && pr.labels.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {pr.labels.map((lbl) => (
                      <span
                        key={lbl.id}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: `#${lbl.color}20`,
                          color: `#${lbl.color}`,
                          borderColor: `#${lbl.color}40`,
                        }}
                      >
                        {lbl.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                  <div className="flex items-center gap-1.5">
                    <img
                      src={pr.user.avatar_url}
                      alt={pr.user.login}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full border border-neutral-700"
                    />
                    <span>{pr.user.login}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="w-3 h-3" />
                      {pr.comments + pr.review_comments}
                    </span>
                    <span>{formatTimeAgo(pr.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : activeTab === 'commits' ? (
          /* COMMITS TAB */
          filteredCommits.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              {searchTerm
                ? 'No commits match your filter'
                : 'No commits retrieved for this branch.'}
            </div>
          ) : (
            filteredCommits.map((item) => (
              <div
                key={item.sha}
                id={`commit-card-${item.sha.substring(0, 7)}`}
                className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors text-xs space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-neutral-200 font-medium line-clamp-2 leading-relaxed">
                    {item.commit.message.split('\n')[0]}
                  </p>
                  <a
                    href={item.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View commit on GitHub"
                    className="text-neutral-500 hover:text-emerald-400 transition-colors p-0.5 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {item.author?.avatar_url ? (
                      <img
                        src={item.author.avatar_url}
                        alt={item.author.login}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full border border-neutral-700 shrink-0"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    )}
                    <span className="truncate text-neutral-300">
                      {item.author?.login || item.commit.author.name}
                    </span>
                    {item.commit.verification?.verified && (
                      <CheckCircle2
                        className="w-3 h-3 text-emerald-400 shrink-0"
                        title="Verified commit"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-[10px] text-neutral-300">
                      {item.sha.substring(0, 7)}
                    </span>
                    <span className="text-neutral-500 font-sans">
                      {formatTimeAgo(item.commit.author.date)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          /* OVERVIEW / REPOSITORY DETAILS & PRODUCTION URL TAB */
          <div className="space-y-3 text-xs">
            {/* 1. PRODUCTION & LIVE URL CARD (Highlighted for user request) */}
            {prodUrl ? (
              <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-600/50 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-semibold text-xs">
                    <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span>Live Production Website</span>
                  </div>
                  <span className="text-[10px] bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                    Deployed
                  </span>
                </div>

                <div className="p-2 rounded bg-neutral-950/80 border border-emerald-700/40 font-mono text-[11px] text-emerald-300 break-all">
                  {prodUrl}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    id="overview-launch-prod-link"
                    href={prodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <span>Open Live App</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {onOpenLivePreview && (
                    <button
                      id="overview-preview-prod-btn"
                      onClick={onOpenLivePreview}
                      className="py-1.5 px-3 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium flex items-center justify-center gap-1.5 transition-colors border border-neutral-700"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Preview in Tab</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-neutral-400 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-neutral-600" />
                  <span className="text-xs">No production homepage configured for this repo</span>
                </div>
              </div>
            )}

            {/* 2. REPOSITORY DETAILS */}
            <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <h4 className="font-semibold text-neutral-200">Repository Details</h4>
              {repo.description && (
                <p className="text-neutral-400 leading-relaxed text-xs">
                  {repo.description}
                </p>
              )}

              <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-2 text-neutral-300 font-mono text-[11px]">
                <div>
                  <span className="text-neutral-500 block">Default Branch</span>
                  <span>{repo.default_branch}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Open Issues</span>
                  <span>{repo.open_issues_count}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Watchers</span>
                  <span>{repo.watchers_count}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">License</span>
                  <span>{repo.license?.spdx_id || repo.license?.name || 'None'}</span>
                </div>
              </div>
            </div>

            {/* 3. LANGUAGES BREAKDOWN BAR */}
            {languageStats.length > 0 && (
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Languages Breakdown</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {languageStats.length} detected
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-800">
                  {languageStats.map((item) => (
                    <div
                      key={item.name}
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                      title={`${item.name}: ${item.percentage}% (${formatBytes(item.bytes)})`}
                    />
                  ))}
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  {languageStats.slice(0, 6).map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-neutral-300">{item.name}</span>
                      <span className="text-neutral-500 ml-auto font-mono text-[10px]">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. CONTRIBUTORS LIST */}
            {contributors.length > 0 && (
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Top Contributors ({contributors.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {contributors.slice(0, 8).map((contributor) => (
                    <a
                      key={contributor.id}
                      href={contributor.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-850 border border-neutral-800/60 text-neutral-300 transition-colors group"
                    >
                      <img
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full border border-neutral-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-[11px]">
                        <p className="truncate font-medium group-hover:text-emerald-400 transition-colors">
                          {contributor.login}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {contributor.contributions} commits
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 5. RELEASES / TAGS */}
            {releases.length > 0 && (
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Recent Releases ({releases.length})</span>
                </div>
                <div className="space-y-1.5">
                  {releases.slice(0, 3).map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between p-2 rounded bg-neutral-900 border border-neutral-800/60 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-semibold text-emerald-400">
                          {rel.tag_name}
                        </span>
                        {rel.name && (
                          <span className="text-neutral-400 truncate max-w-[120px]">
                            - {rel.name}
                          </span>
                        )}
                      </div>
                      <a
                        href={rel.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. CLONE URL */}
            <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <span className="text-neutral-400 font-medium block">Clone Repository</span>
              <div className="flex items-center gap-2 bg-neutral-900 p-2 rounded border border-neutral-800 font-mono text-[11px] text-neutral-300">
                <span className="truncate flex-1">git clone https://github.com/{repo.full_name}.git</span>
                <button
                  id="copy-clone-url-btn"
                  onClick={handleCopyClone}
                  className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                  title="Copy git clone command"
                >
                  {copiedClone ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* 7. TOPICS */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 font-medium">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Topics</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {repo.topics.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 8. OPEN ON GITHUB */}
            <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <span>View Repository on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
