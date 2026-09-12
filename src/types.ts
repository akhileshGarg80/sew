export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics?: string[];
  has_pages?: boolean;
  archived?: boolean;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  } | null;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  children?: TreeNode[];
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    comment_count: number;
    verification?: {
      verified: boolean;
      reason: string;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  parents: Array<{ sha: string; url: string; html_url: string }>;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  locked: boolean;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  body: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  html_url: string;
  comments: number;
  review_comments: number;
  draft?: boolean;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
}

export interface GitHubComment {
  id: number;
  type: 'issue' | 'commit' | 'pull_request_review';
  body: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  issue_url?: string;
  commit_id?: string;
  path?: string;
  line?: number;
  sourceTitle?: string;
  sourceNumber?: number;
}

export interface FileContentState {
  path: string;
  name: string;
  content: string;
  isBinary?: boolean;
  size?: number;
  download_url?: string;
  sha: string;
  encoding?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  published_at: string;
  html_url: string;
  prerelease: boolean;
  draft: boolean;
}

export type RepoLanguages = Record<string, number>;
