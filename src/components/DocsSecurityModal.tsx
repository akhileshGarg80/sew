import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  ExternalLink,
  Key,
  ServerOff,
  DatabaseZap,
  Layers,
  ArrowRight,
  Code2,
  Globe,
  FolderTree,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface DocsSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTokenModal: () => void;
}

export const DocsSecurityModal: React.FC<DocsSecurityModalProps> = ({
  isOpen,
  onClose,
  onOpenTokenModal,
}) => {
  const [activeTab, setActiveTab] = useState<'how-it-works' | 'security' | 'token-benefits' | 'how-to-create'>('how-it-works');

  if (!isOpen) return null;

  return (
    <div
      id="docs-security-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="docs-security-modal-card"
        className="w-full max-w-2xl sm:max-w-3xl rounded-2xl bg-neutral-900 border border-neutral-750 text-neutral-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-neutral-100 flex items-center gap-2">
                <span>GitInspect Guide & Security</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px] font-mono font-normal">
                  100% Client-Side
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                How this site functions, token privacy guarantee, and rate-limit benefits
              </p>
            </div>
          </div>
          <button
            id="close-docs-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 overflow-x-auto shrink-0 scrollbar-none">
          <button
            id="tab-how-it-works"
            onClick={() => setActiveTab('how-it-works')}
            className={`py-3 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'how-it-works'
                ? 'border-emerald-500 text-emerald-300 bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>How the Site Works</span>
          </button>

          <button
            id="tab-security"
            onClick={() => setActiveTab('security')}
            className={`py-3 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-300 bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Token Security & Privacy</span>
          </button>

          <button
            id="tab-token-benefits"
            onClick={() => setActiveTab('token-benefits')}
            className={`py-3 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'token-benefits'
                ? 'border-emerald-500 text-emerald-300 bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Token Benefits (60 vs 5,000)</span>
          </button>

          <button
            id="tab-how-to-create"
            onClick={() => setActiveTab('how-to-create')}
            className={`py-3 px-3 border-b-2 text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'how-to-create'
                ? 'border-emerald-500 text-emerald-300 bg-neutral-800/30'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-sky-400" />
            <span>How to Create Token</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-neutral-300 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: HOW THE SITE WORKS */}
          {activeTab === 'how-it-works' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Direct Browser-to-GitHub Communication
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  GitInspect is a <strong>100% client-side React single-page application</strong>. Every action you take—searching a username, browsing repositories, viewing source files, inspecting commit histories, and previewing live sites—happens directly in your browser through GitHub's official REST and Git Data APIs (<code className="text-emerald-300 font-mono text-[11px]">https://api.github.com</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                    <FolderTree className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Recursive Git Tree Explorer</span>
                  </div>
                  <p className="text-neutral-400 text-xs">
                    Uses GitHub’s Git Trees API to fetch the full repository folder structure on-demand, allowing you to expand and collapse folders and inspect files without cloning.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                    <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Syntax Highlighting & Markdown</span>
                  </div>
                  <p className="text-neutral-400 text-xs">
                    Source code is decoded client-side and rendered with syntax highlighting and line numbers. Markdown READMEs and documentation are rendered cleanly with tables and badges.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                    <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Full-Page Live Overlay Box</span>
                  </div>
                  <p className="text-neutral-400 text-xs">
                    Detects production deployments (GitHub Pages, Vercel, Netlify, Render). Clicking opens a live iframe overlay covering the screen, while leaving the far-right links rail open for rapid switching.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Zero Credit Waste on Launch</span>
                  </div>
                  <p className="text-neutral-400 text-xs">
                    The app does not load any default user on startup. Zero API calls are made until you search or select a user from your saved search history.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-950/40 border border-neutral-800/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-neutral-200">Keyboard Shortcut</div>
                  <div className="text-[11px] text-neutral-400">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-300">Ctrl + P</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 font-mono text-neutral-300">Cmd + P</kbd> anywhere to quickly search files across the repository.
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('security')}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium shrink-0 flex items-center gap-1 transition-colors"
                >
                  <span>Security Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY & ZERO-SERVER GUARANTEE */}
          {activeTab === 'security' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>100% Security Guarantee: Site Token Khud Nahi Leti</span>
                </div>
                <p className="text-neutral-300 text-xs leading-relaxed">
                  GitInspect has <strong>NO external database, NO server-side token logging, and NO analytics trackers</strong> collecting your keys. The entire application operates completely on your machine.
                </p>
              </div>

              {/* 3 Core Security Pillars */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
                    <DatabaseZap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Kahan Save Hota Hai? (Where is it stored?)</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    Your token is saved <strong>exclusively in your own browser's private local storage</strong> (<code className="text-emerald-300 font-mono text-[11px]">localStorage.getItem('github_personal_token')</code>). It never leaves your browser storage and no other website can access it.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
                    <Lock className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Kaise Use Hota Hai? (How is it transmitted?)</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    When you make requests, your browser attaches the token directly into the standard HTTP request header:
                    <br />
                    <code className="text-emerald-300 font-mono text-[11px] block mt-1 bg-neutral-900 p-2 rounded border border-neutral-800">
                      Authorization: Bearer ghp_xxxxxxxxxxxxxxxx
                    </code>
                    This header is sent directly to <strong>api.github.com</strong> over encrypted HTTPS. It is never proxied through any third-party server.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-100">
                    <ServerOff className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>You Have Full Control: 1-Click Removal</span>
                  </div>
                  <p className="text-neutral-400 text-xs leading-relaxed">
                    You can inspect, update, or permanently remove your token at any second by clicking the Key icon in the top header or on the initial screen and clicking <strong>"Remove Token"</strong>. It is immediately purged from your browser storage.
                  </p>
                </div>
              </div>

              {/* Scope Recommendation */}
              <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-neutral-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Zero-Permission Token Recommendation</span>
                </div>
                <p className="text-neutral-400 leading-relaxed text-[12px]">
                  When generating your token on GitHub, you do <strong>not</strong> need to check any checkboxes! An empty (0-scope) token has read-only access to public repositories only, meaning it has zero permission to write, modify, or delete anything on your GitHub account.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: TOKEN BENEFITS */}
          {activeTab === 'token-benefits' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Why Should You Add a Token? (Benefits & Rate Limits)
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  GitHub enforces strict rate limiting to prevent abuse of their public API. Adding a free token drastically multiplies your quota so you can explore repositories freely without hitting rate limit errors.
                </p>
              </div>

              {/* Rate Limit Comparison Table */}
              <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/60">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/80 text-neutral-400 font-mono text-[11px] uppercase">
                      <th className="p-3">Feature</th>
                      <th className="p-3 text-rose-400">Without Token (Anonymous)</th>
                      <th className="p-3 text-emerald-400">With Personal Token (Free)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-xs">
                    <tr>
                      <td className="p-3 font-medium text-neutral-300">API Rate Limit</td>
                      <td className="p-3 font-mono text-rose-400 font-semibold">60 requests / hour</td>
                      <td className="p-3 font-mono text-emerald-400 font-semibold">5,000 requests / hour (83x more!)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-300">IP Sharing</td>
                      <td className="p-3 text-neutral-400">Shared across everyone on your Wi-Fi/IP</td>
                      <td className="p-3 text-emerald-300">Dedicated solely to your account</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-300">Large Repositories</td>
                      <td className="p-3 text-neutral-400">Can hit limit after browsing 3-4 folders</td>
                      <td className="p-3 text-emerald-300">Browse thousands of files with ease</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-300">Git History & PRs</td>
                      <td className="p-3 text-neutral-400">Can fail due to fast credit depletion</td>
                      <td className="p-3 text-emerald-300">Instant loading of all commits & PRs</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-300">Cost</td>
                      <td className="p-3 text-neutral-400">Free</td>
                      <td className="p-3 font-semibold text-emerald-400">100% Free Forever</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Benefit Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-neutral-200 block">No Unexpected Stalls</span>
                    <span className="text-xs text-neutral-400">Never get blocked by the red "API Rate limit exceeded" message while researching code.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/50 border border-neutral-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-neutral-200 block">Instant Switching</span>
                    <span className="text-xs text-neutral-400">Jump between 10+ open source profiles back-to-back without worrying about quota.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HOW TO CREATE TOKEN */}
          {activeTab === 'how-to-create' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
                <h3 className="font-semibold text-neutral-100 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-400" />
                  How to Generate a Safe GitHub Token (1 Minute Guide)
                </h3>
                <p className="text-neutral-400 text-xs leading-relaxed">
                  Follow these 4 simple steps on GitHub to generate a completely safe, read-only token in under 60 seconds:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-neutral-200">
                      Open GitHub Token Settings
                    </p>
                    <p className="text-neutral-400 text-xs">
                      Sign in to GitHub, go to <strong>Settings</strong> &rarr; <strong>Developer Settings</strong> &rarr; <strong>Personal access tokens</strong> &rarr; <strong>Tokens (classic)</strong>.
                    </p>
                    <a
                      href="https://github.com/settings/tokens/new?description=GitInspect+Explorer&scopes="
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-mono pt-1 transition-colors"
                    >
                      <span>Direct Link to Token Generator</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-neutral-200">
                      Give it a Note name
                    </p>
                    <p className="text-neutral-400 text-xs">
                      In the "Note" field, type anything you like, e.g. <code className="text-emerald-300 font-mono bg-neutral-900 px-1 rounded">GitInspect</code>. Choose an expiration (e.g. 30 days, 90 days, or no expiration).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-neutral-200">
                      Crucial Safety: Leave ALL Scope Checkboxes UNCHECKED
                    </p>
                    <p className="text-neutral-400 text-xs">
                      Do <strong>not</strong> select any checkboxes! Leaving all scopes blank grants read-only access strictly to public repositories. It cannot access your private repos or perform any writes.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-mono text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-neutral-200">
                      Click "Generate token" and paste into GitInspect
                    </p>
                    <p className="text-neutral-400 text-xs">
                      Copy the generated key (starts with <code className="text-emerald-300 font-mono bg-neutral-900 px-1 rounded">ghp_</code>) and click the button below to paste it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-neutral-950/90 border-t border-neutral-800 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Zero servers • Client localStorage only</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="close-docs-modal-action-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              id="open-token-from-docs-btn"
              onClick={() => {
                onClose();
                onOpenTokenModal();
              }}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configure Token</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
