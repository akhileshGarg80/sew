import { GitTreeItem, TreeNode } from '../types';

export function buildTreeFromGitItems(items: GitTreeItem[]): TreeNode[] {
  const root: TreeNode = {
    name: '',
    path: '',
    type: 'tree',
    sha: '',
    children: [],
  };

  const sortedItems = [...items].sort((a, b) => {
    // Directories first, then alphabetical
    if (a.type !== b.type) {
      return a.type === 'tree' ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  for (const item of sortedItems) {
    const parts = item.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!current.children) {
        current.children = [];
      }

      let existing = current.children.find((child) => child.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          type: isLast ? item.type : 'tree',
          sha: isLast ? item.sha : '',
          size: isLast ? item.size : undefined,
          children: isLast && item.type === 'blob' ? undefined : [],
        };
        current.children.push(existing);
      }

      current = existing;
    }
  }

  // Sort recursively so folders are always at the top
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return nodes
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'tree' ? -1 : 1;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      })
      .map((node) => {
        if (node.children) {
          return { ...node, children: sortNodes(node.children) };
        }
        return node;
      });
  }

  return sortNodes(root.children || []);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.pop()?.toLowerCase() || '';
  }
  return '';
}

export function getPrismLanguage(filename: string): string {
  const ext = getFileExtension(filename);
  const langMap: Record<string, string> = {
    js: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    py: 'python',
    json: 'json',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    less: 'css',
    md: 'markdown',
    markdown: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    sql: 'sql',
    rust: 'rust',
    rs: 'rust',
    go: 'go',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    php: 'php',
    rb: 'ruby',
    dockerfile: 'docker',
    xml: 'xml',
    svg: 'xml',
    graphql: 'graphql',
    gql: 'graphql',
  };

  const lowerName = filename.toLowerCase();
  if (lowerName === 'dockerfile') return 'docker';
  if (lowerName === 'makefile') return 'makefile';
  if (lowerName.endsWith('.env') || lowerName.startsWith('.env.')) return 'bash';

  return langMap[ext] || 'clike';
}
