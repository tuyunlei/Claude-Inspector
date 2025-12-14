
import { DataStore } from '../../model/datastore';
import { FileTreeNode, FileEntry } from '../../model/files';
import { buildFileTree } from '../filesystem/tree';

/**
 * Selects the global file tree representing the entire ~/.claude directory structure.
 */
export const selectFileTree = (data: DataStore): FileTreeNode | undefined => {
  return data.fileTree;
};

export const selectFileMap = (data: DataStore): Map<string, FileEntry> | undefined => {
  return data.fileMap;
};

/**
 * Selects a file tree scoped to a specific project.
 * Filters files based on the sessions associated with the project.
 * 
 * RE-ROOTING LOGIC:
 * This selector performs a "squash" operation to remove generic top-level directories
 * (like 'root', '.claude', 'projects') if they are just single-child containers.
 * The returned node represents the "Project Root" container, but the UI is expected
 * to render its children directly to provide a clean list.
 */
export const selectProjectFileTree = (data: DataStore, projectId: string): FileTreeNode | undefined => {
    if (!data.fileMap || !data.sessions) return undefined;

    // 1. Identify Session IDs belonging to this project
    const projectSessionIds = new Set(
        data.sessions
            .filter(s => s.primaryProjectId === projectId)
            .map(s => s.id)
    );

    // 2. Filter FileMap to only include relevant files
    const filteredMap = new Map<string, FileEntry>();
    
    for (const [path, entry] of data.fileMap.entries()) {
        const parts = path.split('/');
        const filename = parts[parts.length - 1];
        
        // Session Logs: projects/{sessionId}.jsonl
        if (path.includes('projects/') && filename.endsWith('.jsonl')) {
            const id = filename.replace('.jsonl', '');
            if (projectSessionIds.has(id)) {
                filteredMap.set(path, entry);
            }
        }
        
        // Todos: todos/{sessionId}.json
        else if (path.includes('todos/') && filename.endsWith('.json')) {
            const id = filename.replace('.json', '');
            if (projectSessionIds.has(id)) {
                filteredMap.set(path, entry);
            }
        }
    }

    if (filteredMap.size === 0) return undefined;

    // 3. Build Tree on the fly
    const rawTree = buildFileTree(filteredMap);

    // 4. Squash / Re-root
    // Drill down while the node has exactly one child and that child is a directory.
    // This effectively strips 'root' -> '.claude' -> 'projects' -> [content].
    let current = rawTree;
    while (current.children && current.children.length === 1 && current.children[0].isDir) {
        current = current.children[0];
    }

    return current;
};