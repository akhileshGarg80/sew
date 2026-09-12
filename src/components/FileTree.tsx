import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  FileImage,
  File,
  GitBranch,
  Search,
  ChevronsUpDown,
  RefreshCw,
  FolderTree,
} from 'lucide-react';
import { GitHubRepo, GitTreeItem, TreeNode } from '../types';
import { buildTreeFromGitItems, getFileExtension } from '../utils/treeBuilder';
import { formatBytes } from '../services/github';

interface FileTreeProps {
  repo: GitHubRepo | null;
  treeItems: GitTreeItem[];
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

function getFileIcon(filename: string) {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'rs':
    case 'go':
    case 'java':
    case 'c':
    case 'cpp':
    case 'cs':
    case 'php':
    case 'rb':
    case 'sh':
    case 'html':
    case 'css':
      return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
    case 'json':
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'xml':
      return <FileJson className="w-4 h-4 text-amber-400 shrink-0" />;
    case 'md':
    case 'txt':
    case 'rtf':
    case 'pdf':
      return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <FileImage className="w-4 h-4 text-purple-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-neutral-400 shrink-0" />;
  }
}

interface TreeItemRowProps {
  node: TreeNode;
  level: number;
  openFolders: Set<string>;
  toggleFolder: (path: string) => void;
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
}

const TreeItemRow: React.FC<TreeItemRowProps> = ({
  node,
  level,
  openFolders,
  toggleFolder,
  selectedFilePath,
  onSelectFile,
}) => {
  const isFolder = node.type === 'tree';
  const isOpen = openFolders.has(node.path);
  const isSelected = selectedFilePath === node.path;

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <button
        id={`file-tree-node-${node.path.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
        onClick={handleClick}
        style={{ paddingLeft: `${Math.max(level * 14 + 10, 10)}px` }}
        className={`w-full text-left py-1.5 pr-2.5 flex items-center gap-2 rounded-md transition-colors text-xs font-mono group ${
          isSelected
            ? 'bg-neutral-800 text-emerald-300 font-semibold border-l-2 border-emerald-400'
            : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-neutral-100'
        }`}
      >
        {isFolder ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400/90 shrink-0" />
          )
        ) : (
          getFileIcon(node.name)
        )}

        <span className="truncate flex-1">{node.name}</span>

        {!isFolder && node.size !== undefined && (
          <span className="text-[10px] text-neutral-500 font-sans opacity-0 group-hover:opacity-100 transition-opacity">
            {formatBytes(node.size)}
          </span>
        )}
      </button>

      {isFolder && isOpen && node.children && (
        <div className="border-l border-neutral-800/80 ml-3">
          {node.children.map((child) => (
            <TreeItemRow
              key={child.path}
              node={child}
              level={level + 1}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              selectedFilePath={selectedFilePath}
              onSelectFile={onSelectFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  repo,
  treeItems,
  selectedFilePath,
  onSelectFile,
  isLoading,
  onRefresh,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());

  // Build the hierarchical tree
  const fullTree = useMemo(() => {
    return buildTreeFromGitItems(treeItems);
  }, [treeItems]);

  // Expand top-level folders initially
  React.useEffect(() => {
    if (fullTree.length > 0) {
      const initialOpen = new Set<string>();
      // Open root folders
      fullTree.forEach((node) => {
        if (node.type === 'tree') {
          initialOpen.add(node.path);
        }
      });
      setOpenFolders(initialOpen);
    }
  }, [fullTree]);

  // If search query is present, filter flat list or open all folders
  const filteredFlatItems = useMemo(() => {
    if (!filterQuery.trim()) return null;
    const q = filterQuery.toLowerCase();
    return treeItems.filter((item) => item.path.toLowerCase().includes(q));
  }, [treeItems, filterQuery]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const toggleAllFolders = () => {
    if (openFolders.size > 0) {
      setOpenFolders(new Set());
    } else {
      const allPaths = new Set<string>();
      treeItems.forEach((item) => {
        if (item.type === 'tree') allPaths.add(item.path);
      });
      setOpenFolders(allPaths);
    }
  };

  if (!repo) {
    return (
      <div id="file-tree-empty" className="h-full flex flex-col items-center justify-center p-6 text-center text-neutral-500 bg-neutral-900 border-r border-neutral-800">
        <FolderTree className="w-10 h-10 mb-3 text-neutral-600" />
        <p className="text-sm font-medium text-neutral-400">Select a repository</p>
        <p className="text-xs text-neutral-500 mt-1">Choose a repo on the left to view files and folder structure</p>
      </div>
    );
  }

  return (
    <div id="file-tree-panel" className="flex flex-col h-full bg-neutral-900 border-r border-neutral-800">
      {/* Panel Top Header */}
      <div className="p-3.5 border-b border-neutral-800 bg-neutral-950/40 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-neutral-200 truncate font-semibold">
              {repo.default_branch || 'main'}
            </span>
            <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded-full shrink-0 font-mono">
              {treeItems.filter((i) => i.type === 'blob').length} files
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="toggle-all-folders-btn"
              onClick={toggleAllFolders}
              title={openFolders.size > 0 ? 'Collapse all folders' : 'Expand all folders'}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              id="refresh-tree-btn"
              onClick={onRefresh}
              title="Refresh file tree"
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            id="filter-files-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search files in repo..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-neutral-950 border border-neutral-700/80 text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 6, 7].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-2 py-1">
                <div className="w-4 h-4 bg-neutral-800 rounded"></div>
                <div
                  className="h-3 bg-neutral-800 rounded"
                  style={{ width: `${40 + (i * 12) % 50}%` }}
                ></div>
              </div>
            ))}
          </div>
        ) : filteredFlatItems ? (
          /* Flat search results view when user searches for a specific file */
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] text-neutral-400 font-medium">
              Found {filteredFlatItems.length} items
            </div>
            {filteredFlatItems.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No matching files found
              </div>
            ) : (
              filteredFlatItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.type === 'blob') onSelectFile(item.path);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center gap-2 text-xs font-mono transition-colors ${
                    selectedFilePath === item.path
                      ? 'bg-neutral-800 text-emerald-300 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800/60'
                  }`}
                >
                  {item.type === 'tree' ? (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    getFileIcon(item.path)
                  )}
                  <span className="truncate flex-1">{item.path}</span>
                  {item.size !== undefined && (
                    <span className="text-[10px] text-neutral-500 font-sans shrink-0">
                      {formatBytes(item.size)}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        ) : fullTree.length === 0 ? (
          <div className="text-center py-12 px-4 text-neutral-500 text-xs">
            No files found or repository is empty.
          </div>
        ) : (
          <div className="space-y-0.5">
            {fullTree.map((node) => (
              <TreeItemRow
                key={node.path}
                node={node}
                level={0}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                selectedFilePath={selectedFilePath}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
