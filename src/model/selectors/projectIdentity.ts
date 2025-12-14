
import { DataStore } from '../datastore';
import { ProjectIdentity } from '../projects';

/**
 * Encodes a raw project path to match Claude's directory naming convention.
 * Replaces '/' and '_' with '-'. Ensures result starts with '-'.
 */
function encodeProjectPath(rawPath: string): string {
  // Replace / and _ with -
  let result = rawPath.replace(/[\/_]/g, '-');
  
  // Ensure it starts with '-' (assuming absolute paths)
  if (!result.startsWith('-')) {
    result = '-' + result;
  }
  return result;
}

/**
 * Best-effort decoding for unknown projects.
 * Since multiple chars map to '-', this is lossy.
 */
function decodeProjectPathGuess(encoded: string): string {
  // Remove leading '-'
  const trimmed = encoded.startsWith('-') ? encoded.slice(1) : encoded;
  const segments = trimmed.split('-').filter(Boolean);
  // Assume unix-style absolute path
  return '/' + segments.join('/');
}

export function selectProjectIdentities(data: DataStore): ProjectIdentity[] {
  // 1. Calculate Real Stats from Session Events (User Messages)
  // Map<projectId, { userMsgCount: number, lastUserMsgAt: number }>
  const projectEventStats = new Map<string, { userMsgCount: number, lastUserMsgAt: number }>();

  const updateStats = (id: string, count: number, lastAt: number) => {
      const prev = projectEventStats.get(id) || { userMsgCount: 0, lastUserMsgAt: 0 };
      projectEventStats.set(id, {
          userMsgCount: prev.userMsgCount + count,
          lastUserMsgAt: Math.max(prev.lastUserMsgAt, lastAt)
      });
  };

  for (const session of data.sessions) {
      if (!session.primaryProjectId) continue;
      
      let count = 0;
      let maxTs = 0;
      
      for (const event of session.events) {
          // Count only User messages as "Queries" or "Conversations"
          if (event.message?.role === 'user') {
              count++;
              const ts = new Date(event.timestamp).getTime();
              if (ts > maxTs) maxTs = ts;
          }
      }
      
      updateStats(session.primaryProjectId, count, maxTs);
  }

  // 2. Build History Index & Encoded Map (Legacy/Fallback for identification)
  // Map<projectPath, { lastActive, queryCount }>
  const historyIndex = new Map<string, { lastActiveAt: number; queryCount: number }>();
  // Map<encodedId, canonicalPath[]>
  const encodedToPaths = new Map<string, string[]>();

  for (const item of data.history) {
    if (!item.project) continue;

    // Index stats (History-based fallback: count = session count, time = session start)
    const existing = historyIndex.get(item.project) || { lastActiveAt: 0, queryCount: 0 };
    
    const ts = new Date(item.timestamp).getTime();
    existing.lastActiveAt = Math.max(existing.lastActiveAt, ts);
    existing.queryCount += 1; 
    
    historyIndex.set(item.project, existing);

    // Index encoding mapping
    const encoded = encodeProjectPath(item.project);
    const paths = encodedToPaths.get(encoded) || [];
    if (!paths.includes(item.project)) {
      paths.push(item.project);
    }
    encodedToPaths.set(encoded, paths);
  }

  // 3. Iterate over detected workspace projects
  // We only care about actual directories found in ~/.claude/projects
  const workspaceProjects = data.projects.filter(p => p.groupType === 'workspace');
  
  const results: ProjectIdentity[] = [];

  for (const proj of workspaceProjects) {
    const encodedId = proj.id;
    const candidates = encodedToPaths.get(encodedId) || [];

    let identity: ProjectIdentity;

    // Resolve Canonical Path based on History
    if (candidates.length === 1) {
      // Case A: Exact Match
      const canonicalPath = candidates[0];
      const stats = historyIndex.get(canonicalPath)!;
      identity = {
        id: encodedId,
        canonicalPath: canonicalPath,
        pathSource: 'history',
        pathConfidence: 'high',
        lastActiveAt: stats.lastActiveAt, // Fallback
        queryCount: 0 // Will be updated by real stats
      };
    } else if (candidates.length > 1) {
      // Case B: Collision - Pick Max Activity (History based)
      const bestCandidate = candidates.reduce((prev, curr) => {
        const prevStats = historyIndex.get(prev)!;
        const currStats = historyIndex.get(curr)!;
        return (currStats.queryCount > prevStats.queryCount) ? curr : prev;
      });
      
      const stats = historyIndex.get(bestCandidate)!;
      identity = {
        id: encodedId,
        canonicalPath: bestCandidate,
        pathSource: 'history-ambiguous-picked-max',
        pathConfidence: 'medium',
        lastActiveAt: stats.lastActiveAt, // Fallback
        queryCount: 0 // Will be updated by real stats
      };
    } else {
      // Case C: Unknown (Not in history)
      identity = {
        id: encodedId,
        canonicalPath: decodeProjectPathGuess(encodedId),
        pathSource: 'guessed-from-encoded',
        pathConfidence: 'low',
        lastActiveAt: proj.lastActive, // Fallback
        queryCount: 0 
      };
    }

    // 4. Apply Real Stats (User Message Counts)
    const realStats = projectEventStats.get(encodedId);
    if (realStats) {
        identity.queryCount = realStats.userMsgCount;
        
        // Only update timestamp if we found actual user messages. 
        // Otherwise retain the session-start timestamp (from history/proj.lastActive) to show *some* activity.
        if (realStats.lastUserMsgAt > 0) {
            identity.lastActiveAt = realStats.lastUserMsgAt;
        }
    }

    results.push(identity);
  }

  // Sort by activity desc
  return results.sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

/**
 * Generates shortest unique suffix for display names.
 */
export function buildUniqueProjectDisplayNames(projects: ProjectIdentity[]): Map<string, string> {
  const nameMap = new Map<string, string>();
  
  const splitPath = (path: string) => path.split(/[/\\]/).filter(p => p && p !== '.');
  
  const items = projects.map(p => ({
    id: p.id,
    segments: splitPath(p.canonicalPath)
  }));

  const depths = new Map<string, number>();
  items.forEach(p => depths.set(p.id, 1));

  let hasCollision = true;
  // Guard against infinite loops if paths are identical
  let iterations = 0; 
  const maxIterations = 20; 

  while (hasCollision && iterations < maxIterations) {
    hasCollision = false;
    iterations++;

    const nameToIds = new Map<string, string[]>();

    // Build current names
    for (const item of items) {
      const depth = depths.get(item.id)!;
      // If we run out of segments, use full path (segments joined)
      const effectiveDepth = Math.min(depth, item.segments.length);
      const name = item.segments.slice(-effectiveDepth).join('/');
      
      const list = nameToIds.get(name) || [];
      list.push(item.id);
      nameToIds.set(name, list);
    }

    // Detect collisions
    for (const [name, ids] of nameToIds.entries()) {
      if (ids.length > 1) {
        let collisionResolved = false;
        for (const id of ids) {
          const item = items.find(i => i.id === id)!;
          const currentDepth = depths.get(id)!;
          
          if (currentDepth < item.segments.length) {
            depths.set(id, currentDepth + 1);
            hasCollision = true;
            collisionResolved = true;
          }
        }
        // If we couldn't increase depth for any colliding item, they are identical paths (unlikely given ID uniqueness, but possible if canonicalPath logic fails)
        // We accept the collision in display name if we can't resolve it.
        if (!collisionResolved) {
             // Leave hasCollision as is for this group
        }
      }
    }
  }

  // Finalize
  for (const item of items) {
    const depth = depths.get(item.id)!;
    const effectiveDepth = Math.min(depth, item.segments.length);
    let name = item.segments.slice(-effectiveDepth).join('/');
    if (!name) name = item.id; // Fallback
    nameMap.set(item.id, name);
  }

  return nameMap;
}
