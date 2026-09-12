import React, { useState, useEffect, useMemo, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';

import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  Eye,
  FileCode,
  FileSpreadsheet,
  Globe,
  Maximize2,
  Minimize2,
  Search,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  WrapText,
  X,
  ChevronDown,
  ChevronUp,
  Columns,
  FileText,
  Sparkles,
} from 'lucide-react';
import { FileContentState, GitHubRepo } from '../types';
import { getFileExtension, getPrismLanguage } from '../utils/treeBuilder';
import { formatBytes, getProductionUrl } from '../services/github';

interface CodeViewerProps {
  repo: GitHubRepo | null;
  fileData: FileContentState | null;
  isLoading: boolean;
  initialMode?: 'code' | 'preview' | 'live-site';
  isSplitCodeLive?: boolean;
  onToggleSplitMode?: () => void;
  onOpenLiveSiteOverlay?: (url: string, title: string) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  repo,
  fileData,
  isLoading,
  initialMode = 'code',
  isSplitCodeLive = false,
  onToggleSplitMode,
  onOpenLiveSiteOverlay,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'live-site'>(initialMode);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // In-file search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const prodUrl = useMemo(() => getProductionUrl(repo), [repo]);

  const fileExt = useMemo(() => {
    return fileData ? getFileExtension(fileData.name) : '';
  }, [fileData]);

  const isHtml = useMemo(() => {
    return ['html', 'htm'].includes(fileExt);
  }, [fileExt]);

  const isSvg = useMemo(() => {
    return fileExt === 'svg';
  }, [fileExt]);

  const isMarkdown = useMemo(() => {
    return ['md', 'markdown'].includes(fileExt);
  }, [fileExt]);

  const isImage = useMemo(() => {
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico'].includes(fileExt);
  }, [fileExt]);

  const isPreviewable = isHtml || isSvg || isMarkdown;

  // Reset view mode when file changes
  useEffect(() => {
    if (fileData) {
      if (initialMode === 'live-site' && prodUrl) {
        setViewMode('live-site');
      } else if (isHtml || isMarkdown || isSvg) {
        setViewMode((prev) => (prev === 'preview' ? 'preview' : 'code'));
      } else {
        setViewMode('code');
      }
    }
    setCopied(false);
    setShowSearch(false);
    setSearchQuery('');
  }, [fileData?.path, initialMode, prodUrl, isHtml, isMarkdown, isSvg]);

  // Syntax highlighting
  const highlightedCode = useMemo(() => {
    if (!fileData || !fileData.content || fileData.isBinary) return '';
    const lang = getPrismLanguage(fileData.name);
    const grammar = Prism.languages[lang] || Prism.languages.clike || Prism.languages.javascript;
    try {
      return Prism.highlight(fileData.content, grammar, lang);
    } catch {
      return fileData.content;
    }
  }, [fileData]);

  const lines = useMemo(() => {
    if (!fileData || !fileData.content) return [];
    return fileData.content.split('\n');
  }, [fileData]);

  // Matches for in-file search
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || !lines.length) return [];
    const query = searchQuery.toLowerCase();
    const matches: number[] = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query)) {
        matches.push(idx);
      }
    });
    return matches;
  }, [lines, searchQuery]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % searchMatches.length);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + searchMatches.length) % searchMatches.length);
  };

  const handleCopy = () => {
    if (fileData?.content) {
      navigator.clipboard.writeText(fileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;
    const blob = new Blob([fileData.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fontSizeClass = {
    sm: 'text-[11px] leading-5',
    base: 'text-xs leading-5.5',
    lg: 'text-sm leading-6',
  }[fontSize];

  if (!repo) {
    return (
      <div
        id="code-viewer-empty-repo"
        className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800 select-none"
      >
        <Code2 className="w-12 h-12 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">Code & Live Preview Inspector</p>
        <p className="text-xs text-neutral-600 mt-1">
          Select a repository and file to view source code or live preview
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        id="code-viewer-loading"
        className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border-r border-neutral-800 text-neutral-400 select-none"
      >
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono">Fetching file content from GitHub...</p>
      </div>
    );
  }

  if (!fileData && viewMode !== 'live-site' && !isSplitCodeLive) {
    return (
      <div
        id="code-viewer-empty-file"
        className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800 select-none"
      >
        <FileCode className="w-12 h-12 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-300">No file selected</p>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          Click any file from the file tree explorer to view syntax-highlighted code or live preview.
        </p>
        {prodUrl && (
          <button
            id="open-repo-live-site-btn"
            onClick={() => setViewMode('live-site')}
            className="mt-4 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors shadow-sm"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Preview Live Site: {prodUrl.replace(/^https?:\/\//, '')}</span>
          </button>
        )}
      </div>
    );
  }

  const githubFileUrl = fileData
    ? `${repo.html_url}/blob/${repo.default_branch || 'main'}/${fileData.path}`
    : repo.html_url;

  // Subcomponent: Live Site / Preview Frame
  const renderLiveFrame = () => {
    const activeUrl = prodUrl;

    if (viewMode === 'live-site' || (isSplitCodeLive && !isPreviewable && activeUrl)) {
      if (!activeUrl) {
        return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950">
            <Globe className="w-10 h-10 mb-2 text-neutral-700" />
            <p className="text-xs font-medium text-neutral-400">No production URL configured</p>
            <p className="text-[11px] text-neutral-600 mt-1">
              This repository has no homepage URL listed on GitHub.
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
          {/* Top Live Bar */}
          <div className="p-2 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono text-[11px] text-emerald-300 truncate">{activeUrl}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Device Selector */}
              <div className="flex items-center bg-neutral-950 rounded-md p-0.5 border border-neutral-800">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1 rounded ${
                    deviceMode === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Desktop View (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-1 rounded ${
                    deviceMode === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Tablet View (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1 rounded ${
                    deviceMode === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                title="Reload Live Site"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {onOpenLiveSiteOverlay && activeUrl && (
                <button
                  id="code-viewer-expand-box-btn"
                  onClick={() => onOpenLiveSiteOverlay(activeUrl, `${repo?.name || 'Site'} Live`)}
                  className="p-1.5 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px] font-mono"
                  title="Expand to Full Site Box"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Full Box</span>
                </button>
              )}

              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 transition-colors"
                title="Open live site in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Iframe Viewport */}
          <div className="flex-1 min-h-0 overflow-auto bg-neutral-900/30 flex items-center justify-center p-2">
            <div
              className={`h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border border-neutral-700 flex flex-col ${
                deviceMode === 'mobile'
                  ? 'w-[375px]'
                  : deviceMode === 'tablet'
                  ? 'w-[768px]'
                  : 'w-full'
              }`}
            >
              <iframe
                key={`live-${previewKey}`}
                src={activeUrl}
                title="Live Production App"
                sandbox="allow-scripts allow-modals allow-same-origin allow-forms allow-popups"
                className="w-full flex-1 border-0"
              />
            </div>
          </div>
        </div>
      );
    }

    if (fileData && isPreviewable) {
      return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
          <div className="p-2 border-b border-neutral-800 bg-neutral-900/90 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400 truncate">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preview: {fileData.name}</span>
            </div>

            {isHtml && (
              <div className="flex items-center gap-1">
                <div className="flex items-center bg-neutral-950 rounded-md p-0.5 border border-neutral-800">
                  <button
                    onClick={() => setDeviceMode('desktop')}
                    className={`p-1 rounded ${
                      deviceMode === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Desktop"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('tablet')}
                    className={`p-1 rounded ${
                      deviceMode === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Tablet"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('mobile')}
                    className={`p-1 rounded ${
                      deviceMode === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                    title="Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                  title="Reload preview"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3">
            {isHtml ? (
              <div className="h-full flex items-center justify-center">
                <div
                  className={`h-full bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 border border-neutral-700 flex flex-col ${
                    deviceMode === 'mobile'
                      ? 'w-[375px]'
                      : deviceMode === 'tablet'
                      ? 'w-[768px]'
                      : 'w-full'
                  }`}
                >
                  <iframe
                    key={`html-${previewKey}`}
                    srcDoc={fileData.content}
                    title="Sandboxed HTML Preview"
                    sandbox="allow-scripts allow-modals allow-same-origin"
                    className="w-full flex-1 border-0"
                  />
                </div>
              </div>
            ) : isSvg ? (
              <div className="h-full flex flex-col items-center justify-center p-4">
                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg max-w-full max-h-full overflow-auto flex items-center justify-center">
                  <div
                    className="max-w-full max-h-96"
                    dangerouslySetInnerHTML={{ __html: fileData.content }}
                  />
                </div>
              </div>
            ) : (
              /* Markdown preview */
              <div className="max-w-3xl mx-auto py-2 font-sans text-neutral-200">
                <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm font-sans">
                  {fileData.content}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Default fallback if split mode has no previewable content
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-neutral-950">
        <Sparkles className="w-8 h-8 mb-2 text-neutral-700" />
        <p className="text-xs font-medium text-neutral-400">Split Preview Canvas</p>
        <p className="text-[11px] text-neutral-600 mt-1 max-w-xs">
          Select an HTML, SVG, or Markdown file, or open a live deployment to preview alongside your code.
        </p>
      </div>
    );
  };

  // Subcomponent: Code Panel
  const renderCodePanel = () => {
    if (!fileData) return null;

    return (
      <div className="flex-1 min-h-0 overflow-auto overscroll-contain bg-neutral-950">
        {showRaw ? (
          <textarea
            readOnly
            value={fileData.content}
            className="w-full h-full p-4 bg-transparent text-neutral-200 font-mono text-xs focus:outline-hidden resize-none leading-relaxed select-text"
          />
        ) : (
          <div className="flex min-w-full">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 pl-3 pr-3 text-right bg-neutral-900/50 text-neutral-600 border-r border-neutral-800/80 shrink-0 font-mono text-[11px] leading-5">
              {lines.map((_, i) => {
                const isMatch = searchMatches.includes(i);
                const isCurrentMatch = searchMatches[currentMatchIndex] === i;
                return (
                  <div
                    key={i}
                    className={`transition-colors ${
                      isCurrentMatch
                        ? 'text-emerald-400 font-bold bg-emerald-950/60 px-1 rounded'
                        : isMatch
                        ? 'text-amber-400 font-medium'
                        : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {/* Syntax Highlighted Code */}
            <pre
              className={`py-3 px-4 flex-1 m-0 bg-transparent text-neutral-200 font-mono ${fontSizeClass} ${
                wrapLines
                  ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                  : 'overflow-x-auto whitespace-pre'
              }`}
            >
              <code
                className={`language-${getPrismLanguage(fileData.name)}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="code-viewer-panel"
      className={`flex flex-col h-full bg-neutral-950 border-r border-neutral-800 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950' : 'relative'
      }`}
    >
      {/* Code Header Bar */}
      <div className="px-3.5 py-2 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        {/* Breadcrumb path & Modes */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-mono min-w-0">
            <span className="text-neutral-500">{repo.name} /</span>
            <span className="text-emerald-400 font-medium truncate">
              {viewMode === 'live-site' ? 'Live Production Site' : fileData?.path}
            </span>
          </div>

          {/* Mode Switcher Tabs (Code / Live Preview / Live Site) */}
          <div className="flex items-center rounded-lg bg-neutral-950 p-0.5 border border-neutral-800 shrink-0">
            {fileData && (
              <button
                id="code-mode-tab-btn"
                onClick={() => setViewMode('code')}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'code'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
            )}

            {fileData && isPreviewable && (
              <button
                id="preview-mode-tab-btn"
                onClick={() => setViewMode('preview')}
                title="Live preview rendered in sandboxed frame"
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-neutral-800 text-emerald-300 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Preview</span>
              </button>
            )}

            {prodUrl && (
              <button
                id="live-site-tab-btn"
                onClick={() => setViewMode('live-site')}
                title={`Live production website: ${prodUrl}`}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                  viewMode === 'live-site'
                    ? 'bg-emerald-950/90 border border-emerald-600/40 text-emerald-300 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-emerald-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Site</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {/* File stats */}
          {fileData && viewMode === 'code' && (
            <div className="hidden lg:flex items-center gap-1.5 text-neutral-400 font-mono text-[11px] mr-1">
              <span>{lines.length} lines</span>
              <span>•</span>
              <span>{formatBytes(fileData.size)}</span>
            </div>
          )}

          {/* Raw / Formatted Toggle */}
          {fileData && viewMode === 'code' && !fileData.isBinary && (
            <button
              onClick={() => setShowRaw((prev) => !prev)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono transition-colors ${
                showRaw
                  ? 'bg-neutral-700 text-emerald-300'
                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-400'
              }`}
              title={showRaw ? 'Switch to syntax highlighted view' : 'Switch to raw text view'}
            >
              {showRaw ? 'Formatted' : 'Raw'}
            </button>
          )}

          {/* Search Toggle in file */}
          {fileData && viewMode === 'code' && !fileData.isBinary && (
            <button
              id="toggle-search-in-file-btn"
              onClick={() => {
                setShowSearch((prev) => !prev);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className={`p-1.5 rounded-md transition-colors ${
                showSearch
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title="Find in code (Ctrl+F)"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Line Wrap Toggle */}
          {fileData && viewMode === 'code' && !fileData.isBinary && (
            <button
              id="toggle-wrap-lines-btn"
              onClick={() => setWrapLines((prev) => !prev)}
              className={`p-1.5 rounded-md transition-colors ${
                wrapLines
                  ? 'bg-neutral-700 text-emerald-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title={wrapLines ? 'Disable line wrap' : 'Enable line wrap'}
            >
              <WrapText className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Font Size Selector */}
          {fileData && viewMode === 'code' && !fileData.isBinary && (
            <div className="flex items-center bg-neutral-800 rounded-md p-0.5 text-[11px] font-mono">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-1.5 py-0.5 rounded ${
                  fontSize === 'sm' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'
                }`}
                title="Small font"
              >
                S
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${
                  fontSize === 'base' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'
                }`}
                title="Medium font"
              >
                M
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${
                  fontSize === 'lg' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'
                }`}
                title="Large font"
              >
                L
              </button>
            </div>
          )}

          {/* Copy Button */}
          {fileData && !fileData.isBinary && viewMode === 'code' && (
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 font-mono text-[11px]"
              title="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Copy</span>
                </>
              )}
            </button>
          )}

          {/* Download Button */}
          {fileData && !fileData.isBinary && (
            <button
              id="download-file-btn"
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Split Mode Button (local trigger) */}
          {onToggleSplitMode && (
            <button
              onClick={onToggleSplitMode}
              className={`p-1.5 rounded-md transition-colors ${
                isSplitCodeLive
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title={isSplitCodeLive ? 'Close Split View' : 'Open Split View (Code + Live)'}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="toggle-fullscreen-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Code Viewer'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Open on GitHub */}
          <a
            id="open-github-file-btn"
            href={githubFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title="Open on GitHub"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* In-File Search Bar (when activated) */}
      {showSearch && fileData && viewMode === 'code' && (
        <div
          id="in-file-search-bar"
          className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-3 text-xs shrink-0 shadow-inner"
        >
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              ref={searchInputRef}
              id="file-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentMatchIndex(0);
              }}
              placeholder="Find in file..."
              className="flex-1 px-2 py-1 rounded bg-neutral-950 border border-neutral-700 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
            {searchQuery && (
              <span>
                {searchMatches.length > 0
                  ? `${currentMatchIndex + 1} of ${searchMatches.length}`
                  : 'No matches'}
              </span>
            )}
            <button
              onClick={handlePrevMatch}
              disabled={searchMatches.length === 0}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              title="Previous match"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextMatch}
              disabled={searchMatches.length === 0}
              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              title="Next match"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Split Mode or Single Mode */}
      {isSplitCodeLive ? (
        /* SIDE-BY-SIDE SPLIT VIEW */
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col overflow-hidden">
            <div className="px-3 py-1 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3 h-3 text-emerald-400" />
                <span>Source Code</span>
              </span>
              <span>{lines.length} lines</span>
            </div>
            {renderCodePanel()}
          </div>
          <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col overflow-hidden">
            <div className="px-3 py-1 bg-neutral-900 border-b border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Live View & Preview</span>
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">{renderLiveFrame()}</div>
          </div>
        </div>
      ) : viewMode === 'live-site' ? (
        /* FULL LIVE PRODUCTION SITE VIEW */
        <div className="flex-1 min-h-0 overflow-hidden">{renderLiveFrame()}</div>
      ) : viewMode === 'preview' && fileData && isPreviewable ? (
        /* FULL FILE PREVIEW VIEW */
        <div className="flex-1 min-h-0 overflow-hidden">{renderLiveFrame()}</div>
      ) : isImage && fileData?.download_url ? (
        /* IMAGE VIEWER */
        <div className="flex flex-col items-center justify-center p-8 h-full bg-neutral-950">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl shadow-lg max-w-lg">
            <img
              src={fileData.download_url}
              alt={fileData.name}
              referrerPolicy="no-referrer"
              className="max-h-96 object-contain mx-auto rounded"
            />
            <div className="text-center mt-3 text-neutral-400 text-xs font-mono">
              {fileData.name} ({formatBytes(fileData.size)})
            </div>
          </div>
        </div>
      ) : fileData?.isBinary ? (
        /* BINARY FILE NOTICE */
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950">
          <FileSpreadsheet className="w-12 h-12 mb-3 text-neutral-600" />
          <p className="text-sm font-medium text-neutral-300">Binary File</p>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            This file cannot be previewed as text. You can download it or inspect it on GitHub.
          </p>
          {fileData.download_url && (
            <a
              href={fileData.download_url}
              download
              className="mt-4 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-sans transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {fileData.name}</span>
            </a>
          )}
        </div>
      ) : fileData ? (
        /* CODE VIEWER WITH LINE NUMBERS */
        renderCodePanel()
      ) : null}
    </div>
  );
};
