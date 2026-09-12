import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchGitHubUser,
  fetchUserRepos,
  fetchRepoTree,
  fetchFileContent,
  fetchRepoCommits,
  fetchRepoPullRequests,
  fetchAllRepoComments,
  fetchRepoLanguages,
  fetchRepoContributors,
  fetchRepoReleases,
  checkRateLimit,
  getProductionUrl,
} from './services/github';
import {
  GitHubUser,
  GitHubRepo,
  GitTreeItem,
  FileContentState,
  GitHubCommit,
  GitHubPullRequest,
  GitHubComment,
  GitHubContributor,
  GitHubRelease,
  RepoLanguages,
  RateLimitInfo,
} from './types';
import { Header } from './components/Header';
import { RepoList } from './components/RepoList';
import { FileTree } from './components/FileTree';
import { CodeViewer } from './components/CodeViewer';
import { ActivityPanel } from './components/ActivityPanel';
import { TokenModal } from './components/TokenModal';
import { QuickFileSearchModal } from './components/QuickFileSearchModal';
import { RightLinksRail } from './components/RightLinksRail';
import { LiveSiteOverlayBox } from './components/LiveSiteOverlayBox';
import { CleanInitialState } from './components/CleanInitialState';
import { DocsSecurityModal } from './components/DocsSecurityModal';
import { saveRecentUser } from './utils/recentUsers';
import {
  AlertTriangle,
  FolderTree,
  Code2,
  GitPullRequest,
  BookMarked,
  Key,
  XCircle,
  Globe,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);

  const [treeItems, setTreeItems] = useState<GitTreeItem[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileContentState | null>(null);

  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitHubPullRequest[]>([]);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [languages, setLanguages] = useState<RepoLanguages | null>(null);
  const [contributors, setContributors] = useState<GitHubContributor[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);

  const [codeViewerMode, setCodeViewerMode] = useState<'code' | 'preview' | 'live-site'>('code');

  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false);
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState<boolean>(false);

  // Layout customization states
  const [showRepoSidebar, setShowRepoSidebar] = useState<boolean>(true);
  const [showActivitySidebar, setShowActivitySidebar] = useState<boolean>(true);
  const [isSplitCodeLive, setIsSplitCodeLive] = useState<boolean>(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(false);

  // Live site overlay box state (full page box above content, with right links rail remaining accessible)
  const [isOverlayBoxOpen, setIsOverlayBoxOpen] = useState<boolean>(false);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayTitle, setOverlayTitle] = useState<string>('');
  const [overlayRepo, setOverlayRepo] = useState<GitHubRepo | null>(null);

  // Right Links Rail density mode ('compact' icon-only or 'expanded' short URL)
  const [railMode, setRailMode] = useState<'compact' | 'expanded'>('compact');

  // Mobile layout active column
  const [mobileView, setMobileView] = useState<'repos' | 'tree' | 'code' | 'activity' | 'links'>('repos');

  // Width in pixels of the right rail so overlay leaves right side free
  const railWidthPx = useMemo(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 0;
    }
    return railMode === 'compact' ? 56 : 224;
  }, [railMode]);

  // Global keyboard shortcuts (Ctrl+P / Cmd+P to quick search files)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsQuickSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    const trimmed = username.trim();
    if (!trimmed) return;
    setIsLoadingUser(true);
    setErrorMessage(null);
    setSelectedRepo(null);
    setTreeItems([]);
    setSelectedFilePath(null);
    setFileData(null);
    setCommits([]);
    setPullRequests([]);
    setComments([]);
    setLanguages(null);
    setContributors([]);
    setReleases([]);
    saveRecentUser(trimmed);

    try {
      const userData = await fetchGitHubUser(trimmed);
      setUser(userData);
      setCurrentUsername(userData.login);

      const userRepos = await fetchUserRepos(trimmed);
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

  // Fetch repository tree, activity, languages, contributors, releases
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

    // Fetch Commits, PRs, Comments, Languages, Contributors, and Releases in parallel
    Promise.allSettled([
      fetchRepoCommits(repo.owner.login, repo.name),
      fetchRepoPullRequests(repo.owner.login, repo.name),
      fetchAllRepoComments(repo.owner.login, repo.name),
      fetchRepoLanguages(repo.owner.login, repo.name),
      fetchRepoContributors(repo.owner.login, repo.name),
      fetchRepoReleases(repo.owner.login, repo.name),
    ]).then(([commitsRes, prsRes, commentsRes, langRes, contribRes, relRes]) => {
      if (commitsRes.status === 'fulfilled') setCommits(commitsRes.value);
      else setCommits([]);

      if (prsRes.status === 'fulfilled') setPullRequests(prsRes.value);
      else setPullRequests([]);

      if (commentsRes.status === 'fulfilled') setComments(commentsRes.value);
      else setComments([]);

      if (langRes.status === 'fulfilled') setLanguages(langRes.value);
      else setLanguages(null);

      if (contribRes.status === 'fulfilled') setContributors(contribRes.value);
      else setContributors([]);

      if (relRes.status === 'fulfilled') setReleases(relRes.value);
      else setReleases([]);

      setIsLoadingActivity(false);
    });
  }, []);

  // Reset back to clean initial state (no user loaded)
  const handleReset = useCallback(() => {
    setUser(null);
    setSelectedRepo(null);
    setCurrentUsername('');
    setRepos([]);
    setTreeItems([]);
    setSelectedFilePath(null);
    setFileData(null);
    setCommits([]);
    setPullRequests([]);
    setComments([]);
    setLanguages(null);
    setContributors([]);
    setReleases([]);
    setErrorMessage(null);
    setIsOverlayBoxOpen(false);
  }, []);

  // When selectedRepo changes, trigger loadRepoData
  useEffect(() => {
    if (selectedRepo) {
      loadRepoData(selectedRepo);
      setCodeViewerMode('code');
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
    setCodeViewerMode('code');
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

  // Handle Live Production Preview Trigger
  const handleOpenLivePreview = (repo?: GitHubRepo) => {
    const targetRepo = repo || selectedRepo;
    if (repo && repo.id !== selectedRepo?.id) {
      setSelectedRepo(repo);
    }
    const prod = targetRepo ? getProductionUrl(targetRepo) : null;
    if (prod) {
      setOverlayUrl(prod);
      setOverlayTitle(`${targetRepo?.name || 'Site'} Live`);
      setOverlayRepo(targetRepo || null);
      setIsOverlayBoxOpen(true);
    } else {
      setCodeViewerMode('live-site');
      setMobileView('code');
    }
  };

  return (
    <div
      id="app-root"
      className="h-screen max-h-screen w-screen max-w-full flex flex-col bg-neutral-950 text-neutral-100 antialiased font-sans overflow-hidden select-none relative"
    >
      {/* Top Persistent Fixed Single Nav Bar */}
      <div className="shrink-0 flex flex-col border-b border-neutral-800 bg-neutral-950 z-30">
        <Header
          currentUsername={currentUsername}
          user={user}
          repos={repos}
          selectedRepo={selectedRepo}
          onSelectRepo={handleSelectRepo}
          onSearch={loadUserData}
          isLoading={isLoadingUser}
          rateLimit={rateLimit}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
          onOpenQuickFileSearch={() => setIsQuickSearchOpen(true)}
          showRepoSidebar={showRepoSidebar}
          setShowRepoSidebar={setShowRepoSidebar}
          showActivitySidebar={showActivitySidebar}
          setShowActivitySidebar={setShowActivitySidebar}
          isSplitCodeLive={isSplitCodeLive}
          setIsSplitCodeLive={setIsSplitCodeLive}
          onOpenLivePreview={() => handleOpenLivePreview(selectedRepo || undefined)}
          onReset={handleReset}
          onOpenDocs={() => setIsDocsModalOpen(true)}
        />

        {/* Error / Rate Limit Alert Banner */}
        {errorMessage && (
          <div
            id="error-banner"
            className="bg-rose-950/90 border-b border-rose-800 px-4 py-2 text-rose-200 text-xs flex items-center justify-between gap-3 shadow-inner"
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

        {/* Mobile Tab Bar Switcher (< lg screens, only when user loaded) */}
        {user && (
          <div className="lg:hidden flex items-center border-t border-neutral-800 bg-neutral-900 text-xs font-medium">
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
              <span>Code & Live</span>
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

            <button
              id="mobile-tab-links"
              onClick={() => setMobileView('links')}
              className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                mobileView === 'links'
                  ? 'border-emerald-400 text-emerald-300 bg-neutral-800/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Links</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Clean initial state OR Loading Canvas OR 5-Column Dashboard */}
      {!user && !isLoadingUser ? (
        <CleanInitialState
          onSearch={loadUserData}
          isLoading={isLoadingUser}
          onOpenTokenModal={() => setIsTokenModalOpen(true)}
          onOpenDocs={() => setIsDocsModalOpen(true)}
        />
      ) : isLoadingUser && !user ? (
        <div
          id="loading-user-initial-canvas"
          className="flex-1 w-full h-full flex flex-col items-center justify-center space-y-4 p-8 bg-neutral-950 text-center select-none"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-750 flex items-center justify-center shadow-2xl">
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-neutral-200">
              Loading GitHub User Data...
            </h2>
            <p className="text-xs text-neutral-500 font-mono">
              {currentUsername ? `@${currentUsername}` : 'Fetching repositories and profile'}
            </p>
          </div>
        </div>
      ) : (
        /* Main Responsive Layout with 5 Side-by-Side Columns */
        <main id="main-content-area" className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* Column 1: Public Repositories (Vertical list) */}
          {showRepoSidebar && (
            <section
              aria-label="Repositories"
              className={`w-full lg:w-56 xl:w-64 shrink-0 h-full overflow-hidden flex flex-col border-r border-neutral-850 ${
                mobileView === 'repos' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <RepoList
                repos={repos}
                selectedRepo={selectedRepo}
                onSelectRepo={handleSelectRepo}
                isLoading={isLoadingUser}
                onOpenLivePreview={handleOpenLivePreview}
              />
            </section>
          )}

          {/* Column 2: File & Folder Structure Explorer */}
          <section
            aria-label="File Tree"
            className={`w-full lg:w-52 xl:w-60 shrink-0 h-full overflow-hidden flex flex-col border-r border-neutral-850 ${
              mobileView === 'tree' ? 'flex' : 'hidden lg:flex'
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

          {/* Column 3: File Code Viewer & Live Preview (Center View - Highest Flexibility) */}
          <section
            aria-label="Code Viewer"
            className={`w-full lg:flex-1 h-full min-w-0 overflow-hidden flex flex-col ${
              mobileView === 'code' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <CodeViewer
              repo={selectedRepo}
              fileData={fileData}
              isLoading={isLoadingFile}
              initialMode={codeViewerMode}
              isSplitCodeLive={isSplitCodeLive}
              onToggleSplitMode={() => setIsSplitCodeLive((prev) => !prev)}
              onOpenLiveSiteOverlay={(url, title) => {
                setOverlayUrl(url);
                setOverlayTitle(title);
                setOverlayRepo(selectedRepo);
                setIsOverlayBoxOpen(true);
              }}
            />
          </section>

          {/* Column 4: Commits, PRs, Comments & Overview (Right-side column) */}
          {showActivitySidebar && (
            <section
              aria-label="Activity Feed"
              className={`w-full lg:w-64 xl:w-72 shrink-0 h-full overflow-hidden flex flex-col border-l border-neutral-850 ${
                mobileView === 'activity' ? 'flex' : 'hidden lg:flex'
              }`}
            >
              <ActivityPanel
                repo={selectedRepo}
                commits={commits}
                pullRequests={pullRequests}
                comments={comments}
                languages={languages}
                contributors={contributors}
                releases={releases}
                isLoading={isLoadingActivity}
                onRefresh={() => selectedRepo && loadRepoData(selectedRepo)}
                onOpenLivePreview={() => handleOpenLivePreview(selectedRepo || undefined)}
              />
            </section>
          )}

          {/* Column 5: Right Links Rail (Far-right quick links & live demos) */}
          <section
            aria-label="Quick Links & Demos"
            className={`h-full overflow-hidden flex flex-col ${
              mobileView === 'links' ? 'flex w-full' : 'hidden lg:flex shrink-0'
            }`}
          >
            <RightLinksRail
              repos={repos}
              selectedRepo={selectedRepo}
              user={user}
              activeOverlayUrl={overlayUrl}
              isOverlayOpen={isOverlayBoxOpen}
              onSelectLink={(url, title, repo) => {
                setOverlayUrl(url);
                setOverlayTitle(title);
                setOverlayRepo(repo);
                setIsOverlayBoxOpen(true);
              }}
              railMode={railMode}
              setRailMode={setRailMode}
            />
          </section>

          {/* Full-Page Live Site Box (covers left & center columns, leaving right links rail accessible) */}
          <LiveSiteOverlayBox
            isOpen={isOverlayBoxOpen}
            url={overlayUrl}
            title={overlayTitle}
            repo={overlayRepo}
            onClose={() => setIsOverlayBoxOpen(false)}
            railWidth={railWidthPx}
          />
        </main>
      )}

      {/* Quick File Search Modal (Cmd/Ctrl+P) */}
      <QuickFileSearchModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        items={treeItems}
        onSelectFile={handleSelectFile}
        repoName={selectedRepo?.name || ''}
      />

      {/* GitHub Token Modal */}
      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenChanged={() => {
          checkRateLimit().then(setRateLimit);
          if (selectedRepo) loadRepoData(selectedRepo);
        }}
        onOpenDocs={() => setIsDocsModalOpen(true)}
      />

      {/* How It Works & Token Security Documentation Modal */}
      <DocsSecurityModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />
    </div>
  );
}
