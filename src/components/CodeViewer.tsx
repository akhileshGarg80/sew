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
  Type,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FileContentState, GitHubRepo } from '../types';
import { getFileExtension, getPrismLanguage } from '../utils/treeBuilder';
import { formatBytes, getProductionUrl } from '../services/github';

interface CodeViewerProps {
  repo: GitHubRepo | null;
  fileData: FileContentState | null;
  isLoading: boolean;
  initialMode?: 'code' | 'preview' | 'live-site';
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  repo,
  fileData,
  isLoading,
  initialMode = 'code',
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'live-site'>(initialMode);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [wrapLines, setWrapLines] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        // Keep current viewMode if user prefers preview, otherwise code
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
      <div id="code-viewer-empty-repo" className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800 select-none">
        <Code2 className="w-12 h-12 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">Code & Live Preview Inspector</p>
        <p className="text-xs text-neutral-600 mt-1">Select a repository and file to view source code or live preview</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div id="code-viewer-loading" className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border-r border-neutral-800 text-neutral-400 select-none">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono">Fetching file content from GitHub...</p>
      </div>
    );
  }

  if (!fileData && viewMode !== 'live-site') {
    return (
      <div id="code-viewer-empty-file" className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800 select-none">
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

  const githubFileUrl = fileData ? `${repo.html_url}/blob/${repo.default_branch || 'main'}/${fileData.path}` : repo.html_url;

  return (
    <div
      id="code-viewer-panel"
      className={`flex flex-col h-full bg-neutral-950 border-r border-neutral-800 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 bg-neutral-950' : 'relative'
      }`}
    >
      {/* Code Header Bar */}
      <div className="px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Breadcrumb path & Modes */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
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
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === 'code' ? 'bg-neutral-800 text-neutral-100 font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
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
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === 'preview' ? 'bg-neutral-800 text-emerald-300 font-medium shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
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
                className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-colors ${
                  viewMode === 'live-site' ? 'bg-emerald-950/90 border border-emerald-600/40 text-emerald-300 font-medium shadow-xs' : 'text-neutral-400 hover:text-emerald-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Live Site</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {/* File stats */}
          {fileData && viewMode === 'code' && (
            <div className="hidden md:flex items-center gap-2 text-neutral-400 font-mono text-[11px] mr-2">
              <span>{lines.length} lines</span>
              <span>•</span>
              <span>{formatBytes(fileData.size)}</span>
            </div>
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
                showSearch ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
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
                wrapLines ? 'bg-neutral-700 text-emerald-300' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
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
                className={`px-1.5 py-0.5 rounded ${fontSize === 'sm' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'}`}
                title="Small font"
              >
                S
              </button>
              <button
                onClick={() => setFontSize('base')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'base' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'}`}
                title="Medium font"
              >
                M
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-1.5 py-0.5 rounded ${fontSize === 'lg' ? 'bg-neutral-700 text-white font-bold' : 'text-neutral-400'}`}
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
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
          )}

          {/* Download Button */}
          {fileData && !fileData.isBinary && viewMode === 'code' && (
            <button
              id="download-file-btn"
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            id="toggle-fullscreen-btn"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Maximize Code Viewer'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
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
                {searchMatches.length > 0 ? `${currentMatchIndex + 1} of ${searchMatches.length}` : 'No matches'}
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
              className="p-1 rounded text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body Area: Code / Live Preview / Live Site */}
      <div
        id="code-viewer-scroll-container"
        className="flex-1 min-h-0 overflow-auto overscroll-contain bg-neutral-950 font-mono select-text"
      >
        {/* VIEW MODE: LIVE SITE (Production deployment of the repo) */}
        {viewMode === 'live-site' && prodUrl ? (
          <div className="h-full flex flex-col bg-neutral-950">
            {/* Live Site Toolbar */}
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                <span className="text-xs font-mono text-neutral-300 truncate">{prodUrl}</span>
                <a
                  href={prodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 transition-colors p-1"
                  title="Open live site in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                <button
                  onClick={() => setDeviceMode('desktop')}
                  className={`p-1.5 rounded transition-colors ${deviceMode === 'desktop' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                  title="Desktop view (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('tablet')}
                  className={`p-1.5 rounded transition-colors ${deviceMode === 'tablet' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                  title="Tablet view (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeviceMode('mobile')}
                  className={`p-1.5 rounded transition-colors ${deviceMode === 'mobile' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400 hover:text-neutral-200'}`}
                  title="Mobile view (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                  title="Reload preview"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live iframe container */}
            <div className="flex-1 min-h-0 bg-neutral-900/30 flex items-center justify-center p-3 overflow-hidden">
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
                  key={`site-${previewKey}`}
                  src={prodUrl}
                  title="Live Production Preview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  className="w-full flex-1 border-0"
                />
              </div>
            </div>
          </div>
        ) : viewMode === 'preview' && fileData ? (
          /* VIEW MODE: LIVE PREVIEW OF FILE (HTML / SVG / MARKDOWN) */
          <div className="h-full flex flex-col bg-neutral-950">
            {/* Preview Toolbar */}
            <div className="px-4 py-2 border-b border-neutral-800 bg-neutral-900/60 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-mono text-neutral-300">
                  {isHtml ? 'Live HTML Sandbox' : isSvg ? 'Rendered Vector SVG' : 'Markdown Formatted Preview'}
                </span>
              </div>

              {isHtml && (
                <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                  <button
                    onClick={() => setDeviceMode('desktop')}
                    className={`p-1.5 rounded transition-colors ${deviceMode === 'desktop' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400'}`}
                    title="Desktop (100%)"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('tablet')}
                    className={`p-1.5 rounded transition-colors ${deviceMode === 'tablet' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400'}`}
                    title="Tablet (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('mobile')}
                    className={`p-1.5 rounded transition-colors ${deviceMode === 'mobile' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-400'}`}
                    title="Mobile (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    title="Reload"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Preview Content */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
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
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="p-6 bg-neutral-900/90 border border-neutral-800 rounded-xl shadow-lg max-w-2xl max-h-full overflow-auto flex items-center justify-center">
                    <div
                      className="max-w-full max-h-96"
                      dangerouslySetInnerHTML={{ __html: fileData.content }}
                    />
                  </div>
                </div>
              ) : (
                /* Markdown preview */
                <div className="max-w-3xl mx-auto py-4 px-2 font-sans text-neutral-200">
                  <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 whitespace-pre-wrap leading-relaxed text-sm font-sans">
                    {fileData.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isImage && fileData?.download_url ? (
          /* IMAGE VIEWER */
          <div className="flex flex-col items-center justify-center p-8 h-full">
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
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500">
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
          /* CODE VIEWER WITH LINE NUMBERS AND INDEPENDENT SCROLL */
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
                wrapLines ? 'whitespace-pre-wrap break-words overflow-x-hidden' : 'overflow-x-auto whitespace-pre'
              }`}
            >
              <code
                className={`language-${getPrismLanguage(fileData.name)}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
};
