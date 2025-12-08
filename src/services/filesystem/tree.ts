
import { FileEntry, FileTreeNode, ClaudeFileKind } from '../../model/files';

function getFileKind(path: string, isDir: boolean): ClaudeFileKind {
    const parts = path.split('/');
    const name = parts[parts.length - 1];

    if (isDir) {
        if (name === 'projects' || name === 'projets') return 'project-root';
        if (name === 'todos') return 'todo-root';
        if (name === 'shell_snapshots' || name === 'shell-snapshots') return 'shell-root';
        if (name === 'statsig') return 'stats-root';
        if (name === 'commands') return 'commands-root';
        return 'other'; // Generic folder
    }

    // Security first: Credentials (handle various naming conventions)
    if (name.endsWith('.credentials.json') || name === 'credentials.json' || name.includes('auth_cache')) {
        return 'credentials';
    }
    
    // Configuration - strict name check
    if (name === 'settings.json') return 'settings';
    if (name === 'mcp-servers.json') return 'mcp-config';
    
    // Core Data
    if (name === 'history.jsonl') return 'history-index';
    
    // Contextual matches
    if (path.includes('/projects/') && name.endsWith('.jsonl')) return 'project-log';
    if (path.includes('/todos/') && name.endsWith('.json')) return 'todo';
    if (path.includes('/shell_snapshots/') || path.includes('/shell-snapshots/')) return 'shell-snapshot';
    if (path.includes('/statsig/')) return 'stats';
    if (path.includes('/commands/')) return 'commands';
    
    return 'other';
}

export function buildFileTree(fileMap: Map<string, FileEntry>): FileTreeNode {
    const root: FileTreeNode = {
        name: 'root',
        path: '',
        isDir: true,
        kind: 'root',
        children: []
    };

    const keys = Array.from(fileMap.keys()).sort();

    for (const fullPath of keys) {
        const parts = fullPath.split('/');
        let current = root;
        let pathAccumulator = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            pathAccumulator = pathAccumulator ? `${pathAccumulator}/${part}` : part;
            
            let child = current.children?.find(c => c.name === part);

            if (!child) {
                // If it's the last part, it's the file itself (from keys). 
                // If not last, it's an implied directory.
                const isDir = !isLast;
                
                child = {
                    name: part,
                    path: pathAccumulator,
                    isDir: isDir,
                    kind: getFileKind(pathAccumulator, isDir),
                    children: []
                };

                if (!current.children) current.children = [];
                current.children.push(child);
            }

            current = child;
        }
    }

    // Sort: Directories first, then files. Alphabetical within groups.
    const sortTree = (node: FileTreeNode) => {
        if (node.children && node.children.length > 0) {
            node.children.sort((a, b) => {
                if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
                return a.isDir ? -1 : 1;
            });
            node.children.forEach(sortTree);
        }
    };

    sortTree(root);
    return root;
}
