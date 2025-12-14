
import { DataStore } from '../../datastore';
import { ProjectIdentity } from '../../projects';
import { encodeProjectPath, decodeProjectPathGuess } from './pathEncoder';

export { encodeProjectPath, decodeProjectPathGuess } from './pathEncoder';
export { buildUniqueProjectDisplayNames } from './displayNameBuilder';

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
