
import { DataStore } from '../domain/datastore';
import { ProjectStats, ProjectGroupType } from '../domain/projects';

export const UNKNOWN_PROJECT_PATH = 'Unknown Project';
export const GLOBAL_SESSIONS_ID = '__global_sessions__';
export const SYSTEM_SESSIONS_ID = '__system_sessions__';

/**
 * Decodes a Claude CLI project directory name into a readable path.
 * Rule: Claude replaces both '/' and '.' with '-'.
 * Example: -Users-username-projects-my-app -> /Users/username/projects/my-app
 */
export function decodeProjectName(encodedName: string): string {
  if (!encodedName) return '';
  
  // Heuristic: If it looks like a standard encoded path (starts with -), treat as path.
  // We simply replace dashes with slashes. This isn't perfect (dots also become slashes),
  // but provides the most readable approximation of the original path.
  return encodedName.replace(/-/g, '/');
}

export function calculateProjectStats(store: DataStore) {
  const map = new Map<string, ProjectStats>();

  // Helper to get or create stats entry
  const getEntry = (id: string, name: string, groupType: ProjectGroupType) => {
      if (!map.has(id)) {
          map.set(id, {
              id,
              name,
              sessionCount: 0,
              lastActive: 0,
              totalTokens: 0,
              groupType
          });
      }
      return map.get(id)!;
  };

  // Iterate over Canonical Sessions
  for (const session of store.sessions) {
    const projectId = session.primaryProjectId;
    
    // Skip if we couldn't determine a project (rare, usually maps to Global/System if unknown)
    if (!projectId) continue;

    let name = session.primaryProjectPath || UNKNOWN_PROJECT_PATH;
    let groupType: ProjectGroupType = 'workspace';

    // Determine Metadata based on ID
    if (projectId === GLOBAL_SESSIONS_ID) {
        name = 'Global Sessions';
        groupType = 'global';
    } else if (projectId === SYSTEM_SESSIONS_ID) {
        name = 'System Sessions';
        groupType = 'system';
    } else {
        // Workspace Project: The ID is the directory name (e.g. -Users-foo)
        // The Name is the decoded path (e.g. /Users/foo)
        // If the Name equals the ID, it means we didn't decode it (legacy), so check if we can decode it now
        if (name === projectId) {
            name = decodeProjectName(projectId);
        }
    }

    const entry = getEntry(projectId, name, groupType);

    entry.sessionCount++;
    entry.totalTokens += session.totalTokens;
    if (session.timestamp > entry.lastActive) {
      entry.lastActive = session.timestamp;
    }
  }

  store.projects = Array.from(map.values()).sort((a, b) => {
      // Sort priority: Workspace (recent) -> Global -> System
      if (a.groupType !== b.groupType) {
          if (a.groupType === 'workspace') return -1;
          if (b.groupType === 'workspace') return 1;
          if (a.groupType === 'global') return -1;
          return 1;
      }
      return b.lastActive - a.lastActive;
  });
}
