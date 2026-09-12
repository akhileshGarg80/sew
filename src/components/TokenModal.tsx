import React, { useState, useEffect } from 'react';
import { Key, X, CheckCircle2, ShieldAlert, ExternalLink, Trash2 } from 'lucide-react';
import { getStoredToken, setStoredToken, checkRateLimit } from '../services/github';
import { RateLimitInfo } from '../types';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenChanged: () => void;
}

export const TokenModal: React.FC<TokenModalProps> = ({ isOpen, onClose, onTokenChanged }) => {
  const [token, setToken] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToken(getStoredToken());
      setStatusMsg(null);
      checkRateLimit().then(setRateLimit);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      setStoredToken(token.trim());
      const info = await checkRateLimit();
      setRateLimit(info);
      if (token.trim() && info && info.limit > 60) {
        setStatusMsg({
          type: 'success',
          text: `Token valid! Rate limit increased to ${info.limit} requests/hr (${info.remaining} remaining).`,
        });
      } else if (!token.trim()) {
        setStatusMsg({
          type: 'success',
          text: 'Token cleared. Using standard anonymous rate limit (60 requests/hr).',
        });
      } else {
        setStatusMsg({
          type: 'success',
          text: 'Token saved and active.',
        });
      }
      onTokenChanged();
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Failed to verify token with GitHub API.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClear = () => {
    setToken('');
    setStoredToken('');
    setStatusMsg({
      type: 'success',
      text: 'Token removed. Using anonymous rate limit.',
    });
    checkRateLimit().then(setRateLimit);
    onTokenChanged();
  };

  return (
    <div
      id="token-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="token-modal-card"
        className="w-full max-w-lg rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg text-neutral-100">GitHub Access Token</h3>
          </div>
          <button
            id="close-token-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-neutral-300 leading-relaxed">
            GitHub allows <span className="text-neutral-100 font-medium">60 requests/hour</span> for unauthenticated
            requests. Adding a personal token increases your limit to{' '}
            <span className="text-emerald-400 font-medium">5,000 requests/hour</span>.
          </p>

          <div className="p-3.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-300">Current Rate Limit Status:</span>
              <span className="text-emerald-400 font-mono font-medium">
                {rateLimit ? `${rateLimit.remaining} / ${rateLimit.limit} left` : 'Checking...'}
              </span>
            </div>
            {rateLimit && (
              <div className="text-neutral-500">
                Resets at {new Date(rateLimit.reset * 1000).toLocaleTimeString()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="token-input" className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Personal Access Token (PAT)
            </label>
            <input
              id="token-input"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-100 font-mono text-sm placeholder:text-neutral-600 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <p className="text-xs text-neutral-500">
              Your token is stored safely only in your browser's local storage and used directly in the headers. No special permissions are required.
            </p>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-neutral-800 text-xs">
            <a
              href="https://github.com/settings/tokens/new?description=GitHub+Repo+Explorer&scopes="
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-emerald-400 transition-colors"
            >
              <span>Create public-read token</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {getStoredToken() && (
              <button
                id="clear-token-btn"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Token</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-950/70 border-t border-neutral-800">
          <button
            id="cancel-token-btn"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-token-btn"
            onClick={handleSave}
            disabled={testing}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {testing ? 'Saving...' : 'Save Token'}
          </button>
        </div>
      </div>
    </div>
  );
};
