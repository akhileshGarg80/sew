import {
  GitHubUser,
  GitHubRepo,
  GitTreeItem,
  GitHubCommit,
  GitHubPullRequest,
  GitHubComment,
  FileContentState,
  RateLimitInfo,
} from '../types';

const BASE_URL = 'https://api.github.com';

export function getStoredToken(): string {
  return localStorage.getItem('github_pat') || '';
}

export function setStoredToken(token: string): void {
  if (token.trim()) {
    localStorage.setItem('github_pat', token.trim());
  } else {
    localStorage.removeItem('github_pat');
  }
}

function getHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

// Memory cache to preserve API rate limits
const cache = new Map<string, { timestamp: number; data: unknown }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache<T>(url: string, bypassCache = false): Promise<T> {
  const token = getStoredToken();
  const cacheKey = `${url}_${token ? 'auth' : 'anon'}`;

  if (!bypassCache && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }
  }

  const response = await fetch(url, {
    headers: getHeaders(),
  });

  // Extract rate limit headers if available
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');

  if (limit && remaining && reset) {
    window.dispatchEvent(
      new CustomEvent('github-ratelimit-update', {
        detail: {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10),
        } as RateLimitInfo,
      })
    );
  }

  if (!response.ok) {
    if (response.status === 403 && remaining === '0') {
      const resetDate = reset ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString() : 'soon';
      throw new Error(
        `GitHub API rate limit exceeded! Unauthenticated limit is 60 req/hr. Resets at ${resetDate}. Please add a GitHub Personal Access Token in settings for 5,000 req/hr.`
      );
    }
    if (response.status === 404) {
      throw new Error('Not found (404). Please verify username or repository name.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `GitHub request failed with status ${response.status}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { timestamp: Date.now(), data });
  return data as T;
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const cleanUsername = username.trim().replace(/^@/, '');
  return fetchWithCache<GitHubUser>(`${BASE_URL}/users/${encodeURIComponent(cleanUsername)}`);
}

export async function fetchUserRepos(username: string): Promise<GitHubRepo[]> {
  const cleanUsername = username.trim().replace(/^@/, '');
  // Fetch up to 100 repos, sorted by recently updated
  return fetchWithCache<GitHubRepo[]>(
    `${BASE_URL}/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated`
  );
}

export async function fetchRepoTree(owner: string, repo: string, defaultBranch = 'main'): Promise<GitTreeItem[]> {
  // First try with defaultBranch
  try {
    const data = await fetchWithCache<{ tree: GitTreeItem[]; truncated: boolean }>(
      `${BASE_URL}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`
    );
    return data.tree || [];
  } catch (err: unknown) {
    // If branch name main fails or returns 404, try master or fetch repo info to get exact default branch
    if (defaultBranch === 'main') {
      try {
        const data = await fetchWithCache<{ tree: GitTreeItem[]; truncated: boolean }>(
          `${BASE_URL}/repos/${owner}/${repo}/git/trees/master?recursive=1`
        );
        return data.tree || [];
      } catch {
        // Fallback through
      }
    }
    throw err;
  }
}

// Decode base64 UTF-8 properly (atob can fail on multi-byte characters)
function b64DecodeUnicode(str: string): string {
  try {
    const binary = atob(str.replace(/\s/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return atob(str.replace(/\s/g, ''));
  }
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<FileContentState> {
  const refQuery = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const url = `${BASE_URL}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${refQuery}`;

  const data = await fetchWithCache<{
    name: string;
    path: string;
    sha: string;
    size: number;
    encoding: string;
    content?: string;
    download_url: string;
  }>(url);

  const fileName = data.name || path.split('/').pop() || '';
  const isBinary = isBinaryFile(fileName);

  let textContent = '';
  if (data.content && data.encoding === 'base64') {
    if (!isBinary) {
      try {
        textContent = b64DecodeUnicode(data.content);
      } catch {
        textContent = 'Unable to decode file content.';
      }
    }
  } else if (data.download_url && !isBinary) {
    // Fetch directly from download_url
    const rawRes = await fetch(data.download_url);
    textContent = await rawRes.text();
  }

  return {
    path: data.path || path,
    name: fileName,
    content: textContent,
    isBinary,
    size: data.size,
    download_url: data.download_url,
    sha: data.sha,
    encoding: data.encoding,
  };
}

export async function fetchRepoCommits(owner: string, repo: string): Promise<GitHubCommit[]> {
  return fetchWithCache<GitHubCommit[]>(
    `${BASE_URL}/repos/${owner}/${repo}/commits?per_page=40`
  );
}

export async function fetchRepoPullRequests(owner: string, repo: string): Promise<GitHubPullRequest[]> {
  return fetchWithCache<GitHubPullRequest[]>(
    `${BASE_URL}/repos/${owner}/${repo}/pulls?state=all&per_page=40`
  );
}

export async function fetchAllRepoComments(owner: string, repo: string): Promise<GitHubComment[]> {
  // Fetch Issue comments, Commit comments, and PR review comments in parallel
  const [issueCommentsRes, commitCommentsRes, prReviewCommentsRes] = await Promise.allSettled([
    fetchWithCache<Array<{
      id: number;
      body: string;
      user: { login: string; avatar_url: string; html_url: string };
      created_at: string;
      updated_at: string;
      html_url: string;
      issue_url?: string;
    }>>(`${BASE_URL}/repos/${owner}/${repo}/issues/comments?per_page=40&sort=updated&direction=desc`),

    fetchWithCache<Array<{
      id: number;
      body: string;
      user: { login: string; avatar_url: string; html_url: string };
      created_at: string;
      updated_at: string;
      html_url: string;
      commit_id?: string;
      path?: string;
      line?: number;
    }>>(`${BASE_URL}/repos/${owner}/${repo}/comments?per_page=30`),

    fetchWithCache<Array<{
      id: number;
      body: string;
      user: { login: string; avatar_url: string; html_url: string };
      created_at: string;
      updated_at: string;
      html_url: string;
      pull_request_url?: string;
      path?: string;
      line?: number;
    }>>(`${BASE_URL}/repos/${owner}/${repo}/pulls/comments?per_page=30&sort=updated&direction=desc`),
  ]);

  const allComments: GitHubComment[] = [];

  if (issueCommentsRes.status === 'fulfilled' && Array.isArray(issueCommentsRes.value)) {
    for (const item of issueCommentsRes.value) {
      const issueNumber = item.issue_url ? parseInt(item.issue_url.split('/').pop() || '0', 10) : undefined;
      allComments.push({
        id: item.id,
        type: 'issue',
        body: item.body || '(No text content)',
        user: item.user,
        created_at: item.created_at,
        updated_at: item.updated_at,
        html_url: item.html_url,
        issue_url: item.issue_url,
        sourceNumber: issueNumber,
      });
    }
  }

  if (commitCommentsRes.status === 'fulfilled' && Array.isArray(commitCommentsRes.value)) {
    for (const item of commitCommentsRes.value) {
      allComments.push({
        id: item.id,
        type: 'commit',
        body: item.body || '(No text content)',
        user: item.user,
        created_at: item.created_at,
        updated_at: item.updated_at,
        html_url: item.html_url,
        commit_id: item.commit_id,
        path: item.path,
        line: item.line,
      });
    }
  }

  if (prReviewCommentsRes.status === 'fulfilled' && Array.isArray(prReviewCommentsRes.value)) {
    for (const item of prReviewCommentsRes.value) {
      allComments.push({
        id: item.id,
        type: 'pull_request_review',
        body: item.body || '(No text content)',
        user: item.user,
        created_at: item.created_at,
        updated_at: item.updated_at,
        html_url: item.html_url,
        path: item.path,
        line: item.line,
      });
    }
  }

  // Sort descending by created_at
  allComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return allComments;
}

export async function checkRateLimit(): Promise<RateLimitInfo | null> {
  try {
    const res = await fetch(`${BASE_URL}/rate_limit`, {
      headers: getHeaders(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      limit: data.resources.core.limit,
      remaining: data.resources.core.remaining,
      reset: data.resources.core.reset,
    };
  } catch {
    return null;
  }
}

export function isBinaryFile(fileName: string): boolean {
  const binaryExtensions = [
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'ico', 'pdf', 'zip',
    'tar', 'gz', '7z', 'exe', 'dll', 'so', 'dylib', 'woff', 'woff2',
    'ttf', 'eot', 'mp3', 'mp4', 'mov', 'avi', 'wav', 'ogg', 'wasm'
  ];
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? binaryExtensions.includes(ext) : false;
}

export function formatBytes(bytes?: number): string {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}
