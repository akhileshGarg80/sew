import React, { useState, useEffect } from 'react';
import {
  Search,
  History,
  Trash2,
  ExternalLink,
  Github,
  Globe,
  Code2,
  FolderTree,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  ServerOff,
  Key,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import {
  getRecentUsers,
  saveRecentUser,
  removeRecentUser,
  clearRecentUsers,
} from '../utils/recentUsers';
import { getStoredToken } from '../services/github';

interface CleanInitialStateProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
  onOpenTokenModal: () => void;
  onOpenDocs: () => void;
}

export const CleanInitialState: React.FC<CleanInitialStateProps> = ({
  onSearch,
  isLoading,
  onOpenTokenModal,
  onOpenDocs,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [recentUsers, setRecentUsers] = useState<string[]>([]);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setRecentUsers(getRecentUsers());
    setHasToken(Boolean(getStoredToken()));
    const handleUpdate = () => {
      setRecentUsers(getRecentUsers());
      setHasToken(Boolean(getStoredToken()));
    };
    window.addEventListener('recent-users-updated', handleUpdate);
    return () => window.removeEventListener('recent-users-updated', handleUpdate);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      saveRecentUser(trimmed);
      onSearch(trimmed);
    }
  };

  const handleSelectUser = (name: string) => {
    saveRecentUser(name);
    onSearch(name);
  };

  const handleRemoveUser = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    removeRecentUser(name);
    setRecentUsers(getRecentUsers());
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentUsers();
    setRecentUsers([]);
  };

  const suggestedExamples = ['torvalds', 'vuejs', 'facebook', 'vercel', 'tailwindlabs'];

  return (
    <div
      id="clean-initial-state-canvas"
      className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto bg-gradient-to-b from-neutral-950 via-neutral-900/60 to-neutral-950 select-none"
    >
      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-98 duration-200 py-6">
        {/* Brand Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-750 flex items-center justify-center shadow-xl text-emerald-400 group">
            <Github className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-neutral-950" />
          </span>
        </div>

        {/* Heading & Rate Limit Friendly Note */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
            GitHub Explorer & Live Viewer
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Search any GitHub user or organization to inspect public repositories, code files,
            activity, and full-page live production previews.
          </p>
        </div>

        {/* Clean Rate-Limit Shield Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-[11px] font-mono text-emerald-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Credits Protected: Zero automatic API calls until you search</span>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg relative flex items-center shadow-2xl"
        >
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-neutral-500" />
            <input
              id="initial-user-search-input"
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter GitHub username (e.g. torvalds, vercel)..."
              className="w-full pl-10 pr-24 py-3 rounded-xl bg-neutral-900/90 border border-neutral-750 focus:border-emerald-500 focus:outline-hidden text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors shadow-inner"
            />
            <button
              id="initial-search-submit-btn"
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Saved Searches From LocalStorage Section */}
        {recentUsers.length > 0 ? (
          <div className="w-full max-w-lg bg-neutral-900/70 border border-neutral-800 rounded-xl p-3.5 text-left space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span className="flex items-center gap-1.5 font-semibold text-neutral-300">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Saved in LocalStorage ({recentUsers.length})
              </span>
              <button
                onClick={handleClearAll}
                className="text-[11px] text-neutral-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Clear all saved searches from local storage"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {recentUsers.map((user) => (
                <div
                  key={user}
                  onClick={() => handleSelectUser(user)}
                  className="group flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 text-xs text-neutral-300 hover:text-emerald-300 font-mono transition-all cursor-pointer shadow-xs"
                >
                  <span>@{user}</span>
                  <button
                    onClick={(e) => handleRemoveUser(e, user)}
                    className="p-1 rounded text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors opacity-60 group-hover:opacity-100"
                    title={`Remove @${user} from saved searches`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Suggestion chips when nothing is saved yet */
          <div className="flex flex-col items-center space-y-1.5 text-xs text-neutral-500">
            <span className="font-mono text-[11px]">Quick suggestion examples (click to search):</span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {suggestedExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => handleSelectUser(example)}
                  className="px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[11px] font-mono text-neutral-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  @{example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated GitHub Token & Security Guarantee Card */}
        <div
          id="initial-token-security-card"
          className="w-full max-w-lg rounded-2xl bg-neutral-900/85 border border-neutral-750 p-4 sm:p-5 text-left space-y-3.5 shadow-xl"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-semibold text-neutral-100">
                  GitHub Token & Security Guarantee
                </h2>
                <p className="text-[11px] text-neutral-400">
                  How tokens work, privacy guarantees, and rate limit benefits
                </p>
              </div>
            </div>

            {hasToken ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active (5,000/hr)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-[10px] font-mono">
                Anonymous (60/hr)
              </span>
            )}
          </div>

          {/* Key Facts list */}
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-neutral-300">
              <ServerOff className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-neutral-100">Site Token Khud Nahi Leti:</strong> GitInspect is 100% client-side. We have no database or backend server. Your token is stored exclusively in your browser's private <code className="text-emerald-300 font-mono text-[10px]">localStorage</code> and sent directly to <code className="text-emerald-300 font-mono text-[10px]">api.github.com</code>.
              </p>
            </div>

            <div className="flex items-start gap-2 text-neutral-300">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-neutral-100">Huge Benefit:</strong> Without a token, GitHub limits your IP to <span className="text-rose-300 font-mono">60 req/hr</span>. Adding a free personal token boosts your limit to <span className="text-emerald-400 font-mono font-semibold">5,000 req/hr (83x more)</span> so you never get rate-limited.
              </p>
            </div>

            <div className="flex items-start gap-2 text-neutral-300">
              <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-neutral-100">Zero Risk Setup:</strong> When creating a token on GitHub, leave all scope checkboxes empty. It grants read-only access for public repos with zero write permissions.
              </p>
            </div>
          </div>

          {/* Action buttons inside the card */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800">
            <button
              id="initial-open-docs-btn"
              type="button"
              onClick={onOpenDocs}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-emerald-300 transition-colors cursor-pointer group"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Read Full How-It-Works Guide</span>
            </button>

            <button
              id="initial-open-token-modal-btn"
              type="button"
              onClick={onOpenTokenModal}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{hasToken ? 'Manage Token' : 'Add Free Token (Optional)'}</span>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (visual overview of the app without burning credits) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-left pt-1">
          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
              <span>File Explorer</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Browse full repository file tree and structure with keyboard search (Ctrl+P).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Code2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Code Viewer</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Syntax highlighting, markdown rendered preview, and split-view code layout.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900/40 border border-neutral-800/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Site Box</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Instant full-page live production website overlays with right-side links rail.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

