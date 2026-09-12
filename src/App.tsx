import { useState, useEffect, useCallback } from 'react';
import {
  fetchGitHubUser,
  fetchUserRepos,
  fetchRepoTree,
  fetchFileContent,
  fetchRepoCommits,
  fetchRepoPullRequests,
  fetchAllRepoComments,
  checkRateLimit,
} from './services/github';
import {
  GitHubUser,
  GitHubRepo,
  GitTreeItem,
  FileContentState,
  GitHubCommit,
  GitHubPullRequest,
  GitHubComment,
  RateLimitInfo,
} from './types';
import { Header } from './components/Header';
import { UserCard } from './components/UserCard';
import { RepoList } from './components/RepoList';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { ActivityPanel } from './components/ActivityPanel';
import { TokenModal } from './components/TokenModal';
import {
  AlertTriangle,
  FolderTree,
  Code2,
  GitPullRequest,
  BookMarked,
  Key,
  XCircle,
} from 'lucide-react';

export default function App() {
  const [currentUsername, setCurrentUsername] = useState<string>('shadcn');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  const [treeItems, setTreeItems] = useState<GitTreeItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileContentState | null>(null);

  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [comments, setComments] = useState<GitHubComment[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  // Mobile layout active column
  const [mobileView, setMobileView] = useState<'repos' | 'tree' | 'code' | 'activity'>('repos');

  // Listen for rate limit updates from headers
  useEffect(() => {
    const handleRateLimitUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<RateLimitInfo>;
      if (customEvent.detail) {
        setRateLimit(customEvent.detail);
      }
    };
    window.addEventListener('github-ratelimit-update', handleRateLimitUpdate);
    checkRateLimit().then(setRateLimit);
    return () => {
      window.removeEventListener('github-ratelimit-update', handleRateLimitUpdate);
    };
  }, []);

  // Fetch user data & repositories
  const loadUserData = useCallback(async (username: string) => {
    setIsLoadingUser(true);
    setErrorMessage(null);
    setSelectedRepo(null);
    setTreeItems([]);
    setSelectedFilePath(null);
    setFileData(null);
    setCommits([]);
    setPullRequests([]);
    setComments([]);

    try {
      const userData = await fetchGitHubUser(username);
      setUser(userData);
      setCurrentUsername(userData.login);

      const userRepos = await fetchUserRepos(username);
      setRepos(userRepos);

      // Automatically select the first repository
      if (userRepos.length > 0) {
        const firstRepo = userRepos[0];
        setSelectedRepo(firstRepo);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch GitHub user.';
      setErrorMessage(msg);
      setUser(null);
      setRepos([]);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch repository tree and activity whenever selectedRepo changes
  const loadRepoData = useCallback(async (repo: GitHubRepo) => {
    setIsLoadingTree(true);
    setIsLoadingActivity(true);
    setSelectedFilePath(null);
    setFileData(null);

    // Fetch Git Tree
    try {
      const items = await fetchRepoTree(repo.owner.login, repo.name, repo.default_branch || 'main');
      setTreeItems(items);

      // Auto-select README.md or the first code/text file
      const readme = items.find((i) => i.type === 'blob' && i.path.toLowerCase().startsWith('readme'));
      const firstBlob = readme || items.find((i) => i.type === 'blob');

      if (firstBlob) {
        setSelectedFilePath(firstBlob.path);
        // Load the file content
        setIsLoadingFile(true);
        fetchFileContent(repo.owner.login, repo.name, firstBlob.path, repo.default_branch)
          .then((content) => setFileData(content))
          .catch(() => setFileData(null))
          .finally(() => setIsLoadingFile(false));
      }
    } catch (err: unknown) {
      console.error('Failed to load repo tree:', err);
      setTreeItems([]);
    } finally {
      setIsLoadingTree(false);
    }

    // Fetch Commits, PRs, and Comments
    Promise.allSettled([
      fetchRepoCommits(repo.owner.login, repo.name),
      fetchRepoPullRequests(repo.owner.login, repo.name),
      fetchAllRepoComments(repo.owner.login, repo.name),
    ]).then(([commitsRes, prsRes, commentsRes]) => {
      if (commitsRes.status === 'fulfilled') setCommits(commitsRes.value);
      else setCommits([]);

      if (prsRes.status === 'fulfilled') setPullRequests(prsRes.value);
      else setPullRequests([]);

      if (commentsRes.status === 'fulfilled') setComments(commentsRes.value);
      else setComments([]);

      setIsLoadingActivity(false);
    });
  }, []);

  // Initial load
  useEffect(() => {
    loadUserData('shadcn');
  }, [loadUserData]);

  // When selectedRepo changes, trigger loadRepoData
  useEffect(() => {
    if (selectedRepo) {
      loadRepoData(selectedRepo);
    }
  }, [selectedRepo, loadRepoData]);

  // Handle repository selection
  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setMobileView('tree');
  };

  // Handle file selection
  const handleSelectFile = async (filePath: string) => {
    if (!selectedRepo) return;
    setSelectedFilePath(filePath);
    setIsLoadingFile(true);
    setMobileView('code');

    try {
      const data = await fetchFileContent(
        selectedRepo.owner.login,
        selectedRepo.name,
        filePath,
        selectedRepo.default_branch
      );
      setFileData(data);
    } catch (err: unknown) {
      console.error('Failed to fetch file content:', err);
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <div id="app-root" className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 antialiased font-sans">
      {/* Top Global Header */}
      <Header
        currentUsername={currentUsername}
        onSearch={loadUserData}
        isLoading={isLoadingUser}
        rateLimit={rateLimit}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />

      {/* User Profile Bar (if user loaded) */}
      {user && <UserCard user={user} />}

      {/* Error / Rate Limit Alert Banner */}
      {errorMessage && (
        <div
          id="error-banner"
          className="bg-rose-950/80 border-b border-rose-800/80 px-4 py-3 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-inner"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {errorMessage.toLowerCase().includes('rate limit') && (
              <button
                id="add-token-from-error"
                onClick={() => setIsTokenModalOpen(true)}
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Add GitHub Token</span>
              </button>
            )}
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 p-1"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Tab Bar Switcher (< lg screens) */}
      <div className="lg:hidden flex items-center border-b border-neutral-800 bg-neutral-900 text-xs font-medium">
        <button
          id="mobile-tab-repos"
          onClick={() => setMobileView('repos')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileView === 'repos'
              ? 'border-emerald-400 text-emerald-300 bg-neutral-800/60'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <BookMarked className="w-3.5 h-3.5" />
          <span>Repos ({repos.length})</span>
        </button>

        <button
          id="mobile-tab-tree"
          onClick={() => setMobileView('tree')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileView === 'tree'
              ? 'border-emerald-400 text-emerald-300 bg-neutral-800/60'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          <span>Files</span>
        </button>

        <button
          id="mobile-tab-code"
          onClick={() => setMobileView('code')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileView === 'code'
              ? 'border-emerald-400 text-emerald-300 bg-neutral-800/60'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code</span>
        </button>

        <button
          id="mobile-tab-activity"
          onClick={() => setMobileView('activity')}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
            mobileView === 'activity'
              ? 'border-emerald-400 text-emerald-300 bg-neutral-800/60'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <GitPullRequest className="w-3.5 h-3.5" />
          <span>Activity</span>
        </button>
      </div>

      {/* Main 4-Column Responsive Layout */}
      <main id="main-content-area" className="flex-1 flex overflow-hidden min-h-[600px] h-[calc(100vh-140px)]">
        {/* Column 1: Public Repositories (Left) */}
        <section
          aria-label="Repositories"
          className={`w-full lg:w-72 xl:w-80 shrink-0 h-full ${
            mobileView === 'repos' ? 'block' : 'hidden lg:block'
          }`}
        >
          <RepoList
            repos={repos}
            selectedRepo={selectedRepo}
            onSelectRepo={handleSelectRepo}
            isLoading={isLoadingUser}
          />
        </section>

        {/* Column 2: File & Folder Structure Explorer */}
        <section
          aria-label="File Tree"
          className={`w-full lg:w-64 xl:w-72 shrink-0 h-full ${
            mobileView === 'tree' ? 'block' : 'hidden lg:block'
          }`}
        >
          <FileTree
            repo={selectedRepo}
            treeItems={treeItems}
            selectedFilePath={selectedFilePath}
            onSelectFile={handleSelectFile}
            isLoading={isLoadingTree}
            onRefresh={() => selectedRepo && loadRepoData(selectedRepo)}
          />
        </section>

        {/* Column 3: File Code Viewer (Center/Expandable) */}
        <section
          aria-label="Code Viewer"
          className={`w-full lg:flex-1 h-full min-w-0 ${
            mobileView === 'code' ? 'block' : 'hidden lg:block'
          }`}
        >
          <CodeViewer
            repo={selectedRepo}
            fileData={fileData}
            isLoading={isLoadingFile}
          />
        </section>

        {/* Column 4: Commits, PRs & Comments (Right Side) */}
        <section
          aria-label="Activity Feed"
          className={`w-full lg:w-80 xl:w-96 shrink-0 h-full ${
            mobileView === 'activity' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ActivityPanel
            repo={selectedRepo}
            commits={commits}
            pullRequests={pullRequests}
            comments={comments}
            isLoading={isLoadingActivity}
            onRefresh={() => selectedRepo && loadRepoData(selectedRepo)}
          />
        </section>
      </main>

      {/* GitHub Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenChanged={() => {
          checkRateLimit().then(setRateLimit);
          if (selectedRepo) loadRepoData(selectedRepo);
        }}
      />
    </div>
  );
}
