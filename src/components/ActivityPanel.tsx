import React, { useState } from 'react';
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
} from 'lucide-react';
import { GitHubRepo, GitHubCommit, GitHubPullRequest, GitHubComment } from '../types';
import { formatTimeAgo } from '../services/github';

interface ActivityPanelProps {
  repo: GitHubRepo | null;
  commits: GitHubCommit[];
  pullRequests: GitHubPullRequest[];
  comments: GitHubComment[];
  isLoading: boolean;
  onRefresh: () => void;
}

type TabType = 'commits' | 'prs' | 'comments' | 'overview';

export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  repo,
  commits,
  pullRequests,
  comments,
  isLoading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('comments');
  const [prFilter, setPrFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [commentFilter, setCommentFilter] = useState<'all' | 'issue' | 'commit' | 'pull_request_review'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedClone, setCopiedClone] = useState(false);

  const filteredCommits = commits.filter((c) => {
    const msg = c.commit.message.toLowerCase();
    const author = (c.commit.author.name || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return msg.includes(query) || author.includes(query) || c.sha.includes(query);
  });

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesState = prFilter === 'all' || pr.state === prFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      pr.title.toLowerCase().includes(query) ||
      pr.user.login.toLowerCase().includes(query) ||
      `#${pr.number}`.includes(query);
    return matchesState && matchesSearch;
  });

  const filteredComments = comments.filter((c) => {
    const matchesType = commentFilter === 'all' || c.type === commentFilter;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      (c.body || '').toLowerCase().includes(query) ||
      c.user.login.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });

  const handleCopyClone = () => {
    if (!repo) return;
    navigator.clipboard.writeText(`https://github.com/${repo.full_name}.git`);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  if (!repo) {
    return (
      <div id="activity-panel-empty" className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-neutral-900">
        <MessageSquare className="w-10 h-10 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">Repository Activity</p>
        <p className="text-xs text-neutral-600 mt-1">
          Select a repository to view all commits, PRs, and comments
        </p>
      </div>
    );
  }

  return (
    <div id="activity-panel" className="flex flex-col h-full bg-neutral-900 text-neutral-200">
      {/* Top Header & Navigation Tabs */}
      <div className="p-3 border-b border-neutral-800 bg-neutral-950/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Repo Feed & Activity
          </span>
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
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-1 rounded-md font-medium transition-all flex items-center justify-center gap-1 ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">About</span>
          </button>
        </div>

        {/* Filter / Search bar for active tab */}
        {activeTab !== 'overview' && (
          <div className="space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="search-activity-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-neutral-950 border border-neutral-700/80 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Subfilters for Comments */}
            {activeTab === 'comments' && (
              <div className="flex items-center gap-1 text-[11px] overflow-x-auto scrollbar-none pt-0.5">
                {(
                  [
                    { key: 'all', label: 'All Comments' },
                    { key: 'issue', label: 'Issues' },
                    { key: 'commit', label: 'Commits' },
                    { key: 'pull_request_review', label: 'PR Reviews' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setCommentFilter(f.key)}
                    className={`px-2 py-0.5 rounded-md font-medium shrink-0 transition-colors ${
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

            {/* Subfilters for PRs */}
            {activeTab === 'prs' && (
              <div className="flex items-center gap-1 text-[11px] pt-0.5">
                {(
                  [
                    { key: 'all', label: 'All PRs' },
                    { key: 'open', label: 'Open' },
                    { key: 'closed', label: 'Closed' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setPrFilter(f.key)}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition-colors ${
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

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
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
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
              {comments.length === 0
                ? 'No comments found in this repository.'
                : 'No comments match your filter.'}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <div
                key={`${comment.type}-${comment.id}`}
                id={`comment-card-${comment.id}`}
                className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors text-xs space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.login}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full border border-neutral-700 shrink-0"
                    />
                    <span className="font-semibold text-neutral-200 truncate">
                      {comment.user.login}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                        comment.type === 'issue'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800/50'
                          : comment.type === 'commit'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800/50'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      }`}
                    >
                      {comment.type === 'pull_request_review' ? 'PR Review' : comment.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-neutral-500 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(comment.created_at)}</span>
                    <a
                      href={comment.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View comment on GitHub"
                      className="ml-1 text-neutral-500 hover:text-emerald-400 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Comment Context Info */}
                {comment.path && (
                  <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded truncate">
                    File: {comment.path} {comment.line ? `(L${comment.line})` : ''}
                  </div>
                )}
                {comment.commit_id && (
                  <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded truncate">
                    Commit: {comment.commit_id.substring(0, 7)}
                  </div>
                )}
                {comment.sourceNumber && (
                  <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900 px-2 py-0.5 rounded">
                    Issue/PR #{comment.sourceNumber}
                  </div>
                )}

                {/* Comment Body */}
                <div className="text-neutral-300 leading-relaxed font-sans whitespace-pre-wrap line-clamp-6 bg-neutral-900/50 p-2.5 rounded-md border border-neutral-800/50">
                  {comment.body}
                </div>
              </div>
            ))
          )
        ) : activeTab === 'prs' ? (
          /* PULL REQUESTS TAB ("pyar") */
          filteredPRs.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              <GitPullRequest className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
              {pullRequests.length === 0
                ? 'No pull requests found for this repository.'
                : 'No pull requests match your filter.'}
            </div>
          ) : (
            filteredPRs.map((pr) => (
              <div
                key={pr.id}
                id={`pr-card-${pr.number}`}
                className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-700 transition-colors text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {pr.merged_at ? (
                      <span className="p-1 rounded bg-purple-950/80 text-purple-400 border border-purple-800/50 shrink-0">
                        <GitMerge className="w-3.5 h-3.5" />
                      </span>
                    ) : pr.state === 'open' ? (
                      <span className="p-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 shrink-0">
                        <GitPullRequest className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-rose-950/80 text-rose-400 border border-rose-800/50 shrink-0">
                        <GitPullRequest className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-semibold text-neutral-100 line-clamp-1">
                      {pr.title}
                    </span>
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

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400">
                  <span className="font-mono font-medium text-emerald-400">#{pr.number}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <img
                      src={pr.user.avatar_url}
                      alt={pr.user.login}
                      referrerPolicy="no-referrer"
                      className="w-3.5 h-3.5 rounded-full"
                    />
                    <span>{pr.user.login}</span>
                  </div>
                  <span>•</span>
                  <span>{formatTimeAgo(pr.created_at)}</span>

                  {pr.comments + pr.review_comments > 0 && (
                    <div className="ml-auto flex items-center gap-1 text-neutral-300 font-mono">
                      <MessageSquare className="w-3 h-3" />
                      <span>{pr.comments + pr.review_comments} comments</span>
                    </div>
                  )}
                </div>

                {pr.labels.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {pr.labels.map((label) => (
                      <span
                        key={label.id}
                        style={{
                          backgroundColor: `#${label.color}15`,
                          borderColor: `#${label.color}40`,
                          color: `#${label.color}`,
                        }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )
        ) : activeTab === 'commits' ? (
          /* COMMITS TAB */
          filteredCommits.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              <GitCommit className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
              {commits.length === 0
                ? 'No commits found.'
                : 'No commits match your search.'}
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
          /* OVERVIEW / REPOSITORY DETAILS TAB */
          <div className="space-y-3.5 text-xs">
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

            {/* Clone URL Box */}
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

            {/* Topics */}
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

            {/* GitHub Links */}
            <div className="p-3 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-1.5 transition-colors"
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
