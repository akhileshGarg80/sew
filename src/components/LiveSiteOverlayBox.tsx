import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  ExternalLink,
  Globe,
  Copy,
  Check,
  Monitor,
  Tablet,
  Smartphone,
  ShieldCheck,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface LiveSiteOverlayBoxProps {
  isOpen: boolean;
  url: string | null;
  title: string;
  repo: GitHubRepo | null;
  onClose: () => void;
  railWidth: number; // width in pixels of the right links rail so that right side remains empty/accessible
}

export const LiveSiteOverlayBox: React.FC<LiveSiteOverlayBoxProps> = ({
  isOpen,
  url,
  title,
  repo,
  onClose,
  railWidth,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloadKey, setReloadKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset loading state when url changes
  useEffect(() => {
    if (url) {
      setIframeLoading(true);
    }
  }, [url, reloadKey]);

  if (!isOpen || !url) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="live-site-overlay-box"
      style={{ right: `${railWidth}px` }}
      className="fixed left-0 top-0 bottom-0 z-40 bg-neutral-950/98 backdrop-blur-md flex flex-col border-r border-neutral-800 shadow-2xl animate-in fade-in zoom-in-98 duration-150"
    >
      {/* Top Header of the Box with prominent Close (X) icon and controls */}
      <div className="h-12 bg-neutral-900 border-b border-neutral-800 px-3.5 flex items-center justify-between gap-3 shrink-0 select-none">
        {/* Left: Close Button (Cross Icon) & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            id="close-live-overlay-box-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/80 hover:text-rose-400 text-neutral-300 border border-neutral-700 transition-all flex items-center gap-1 text-xs font-medium group shadow-xs"
            title="Close Box (ESC)"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-150" />
            <span className="hidden sm:inline font-mono text-[11px]">Close</span>
          </button>

          <div className="h-4 w-px bg-neutral-800" />

          {/* Active Site Title / Repo Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="flex items-center gap-1.5 truncate">
              {repo && (
                <span className="text-[11px] font-mono text-neutral-400 hidden md:inline truncate">
                  {repo.name} :
                </span>
              )}
              <span className="font-semibold text-xs text-emerald-300 truncate">
                {title || url}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Address Bar with URL */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-950 border border-neutral-800 max-w-md w-full justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-neutral-200 truncate">{url}</span>
          </div>
          <button
            onClick={handleCopyUrl}
            className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Right Controls: Device Sizing, Reload, Open New Tab */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Viewport device selector */}
          <div className="flex items-center bg-neutral-950 rounded-lg p-0.5 border border-neutral-800">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Desktop View (Full Width)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'tablet'
                  ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-neutral-800 text-emerald-300 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reload iframe */}
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 transition-colors"
            title="Reload live page"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Open in real new tab */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-emerald-950 text-neutral-300 hover:text-emerald-300 border border-neutral-750 transition-colors flex items-center gap-1 text-xs"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px] font-mono">New Tab</span>
          </a>
        </div>
      </div>

      {/* Main Box Body with fast interactive iframe & right rail kept free */}
      <div className="flex-1 min-h-0 relative bg-neutral-950 overflow-hidden flex items-center justify-center p-2 sm:p-4">
        {/* Loading Spinner overlay */}
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-xs">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-mono text-neutral-300">Loading {title || 'live site'}...</p>
            <p className="text-[11px] font-mono text-neutral-500 mt-1 max-w-sm text-center px-4">
              Click any link on the right rail to switch instantaneously
            </p>
          </div>
        )}

        {/* Responsive viewport container */}
        <div
          className={`h-full bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-200 border border-neutral-700/80 flex flex-col ${
            deviceMode === 'mobile'
              ? 'w-[375px]'
              : deviceMode === 'tablet'
              ? 'w-[768px]'
              : 'w-full'
          }`}
        >
          <iframe
            key={`${url}-${reloadKey}`}
            src={url}
            title={title || 'Live Website'}
            onLoad={() => setIframeLoading(false)}
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
            className="w-full flex-1 border-0 bg-white"
          />
        </div>
      </div>

      {/* Box bottom bar info */}
      <div className="px-4 py-1.5 bg-neutral-900 border-t border-neutral-850 text-[11px] text-neutral-400 flex items-center justify-between font-mono shrink-0 select-none">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sandboxed Live Preview • Select links from the right rail to change site without delay</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-neutral-500">
          <span>Press ESC to close box</span>
        </div>
      </div>
    </div>
  );
};
