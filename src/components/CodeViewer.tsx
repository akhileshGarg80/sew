import React, { useState, useEffect, useMemo } from 'react';
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
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { FileContentState, GitHubRepo } from '../types';
import { getFileExtension, getPrismLanguage } from '../utils/treeBuilder';
import { formatBytes } from '../services/github';

interface CodeViewerProps {
  repo: GitHubRepo | null;
  fileData: FileContentState | null;
  isLoading: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  repo,
  fileData,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const isMarkdown = useMemo(() => {
    if (!fileData) return false;
    const ext = getFileExtension(fileData.name);
    return ext === 'md' || ext === 'markdown';
  }, [fileData]);

  const isImage = useMemo(() => {
    if (!fileData) return false;
    const ext = getFileExtension(fileData.name);
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext);
  }, [fileData]);

  // Reset view mode when file changes
  useEffect(() => {
    setViewMode('code');
    setCopied(false);
  }, [fileData?.path]);

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

  if (!repo) {
    return (
      <div id="code-viewer-empty-repo" className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800">
        <Code2 className="w-12 h-12 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">Code Inspector</p>
        <p className="text-xs text-neutral-600 mt-1">Select a repository and file to view source code</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div id="code-viewer-loading" className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 border-r border-neutral-800 text-neutral-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-mono">Fetching file content from GitHub...</p>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div id="code-viewer-empty-file" className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 bg-neutral-950 border-r border-neutral-800">
        <FileCode className="w-12 h-12 mb-3 text-neutral-700" />
        <p className="text-sm font-medium text-neutral-400">No file selected</p>
        <p className="text-xs text-neutral-600 mt-1 max-w-xs">
          Click any file from the file tree explorer to view its complete source code with syntax highlighting
        </p>
      </div>
    );
  }

  const githubFileUrl = `${repo.html_url}/blob/${repo.default_branch || 'main'}/${fileData.path}`;

  return (
    <div id="code-viewer-panel" className="flex flex-col h-full bg-neutral-950 border-r border-neutral-800">
      {/* Code Header Bar */}
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1.5 text-xs font-mono min-w-0 flex-1">
          <span className="text-neutral-500">{repo.name} /</span>
          <span className="text-emerald-400 font-medium truncate">{fileData.path}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          {/* File stats */}
          <div className="hidden sm:flex items-center gap-2 text-neutral-400 font-mono text-[11px] mr-2">
            <span>{lines.length} lines</span>
            <span>•</span>
            <span>{formatBytes(fileData.size)}</span>
          </div>

          {/* Markdown Toggle */}
          {isMarkdown && (
            <div className="flex items-center rounded-lg bg-neutral-950 p-0.5 border border-neutral-800">
              <button
                id="code-mode-btn"
                onClick={() => setViewMode('code')}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  viewMode === 'code' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
              <button
                id="preview-mode-btn"
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-neutral-800 text-neutral-100 font-medium' : 'text-neutral-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>
          )}

          {/* Copy Button */}
          {!fileData.isBinary && (
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
          {!fileData.isBinary && (
            <button
              id="download-file-btn"
              onClick={handleDownload}
              className="p-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

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

      {/* Code Area */}
      <div className="flex-1 overflow-auto bg-neutral-950 font-mono text-xs leading-relaxed select-text">
        {isImage && fileData.download_url ? (
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
        ) : fileData.isBinary ? (
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
        ) : isMarkdown && viewMode === 'preview' ? (
          /* Clean Markdown Preview */
          <div className="p-6 max-w-3xl mx-auto font-sans text-neutral-200 space-y-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 whitespace-pre-wrap font-sans text-sm leading-relaxed text-neutral-200">
                {fileData.content}
              </div>
            </div>
          </div>
        ) : (
          /* Code with line numbers */
          <div className="flex min-w-full">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 pl-3 pr-3 text-right bg-neutral-900/40 text-neutral-600 border-r border-neutral-800/80 shrink-0 font-mono text-[11px] leading-5">
              {lines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Syntax Highlighted Code */}
            <pre className="py-3 px-4 flex-1 overflow-x-auto text-[11px] font-mono leading-5 m-0 bg-transparent text-neutral-200">
              <code
                className={`language-${getPrismLanguage(fileData.name)}`}
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
