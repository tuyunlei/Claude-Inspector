
import { DataStore } from '../domain/datastore';
import { FileEntry } from '../domain/files';
import { ClaudeEvent } from '../domain/events';
import { SessionKind, SessionSummary, SessionPathUsage, SessionStoryRole } from '../domain/sessions';
import { UNKNOWN_PROJECT_PATH, GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID, decodeProjectName } from '../analytics/projects';

// Internal intermediate structure
interface ParsedSessionSnapshot {
  id: string;
  directoryId: string | null; // The folder name in ~/.claude/projects/
  projectPath: string; // The display path (decoded from directoryId or fallback to cwd)
  kind: SessionKind;
  timestamp: string; // ISO
  firstEventAt: string;
  lastEventAt: string;
  messageCount: number;
  totalTokens: number;
  modelDistribution: Record<string, number>;
  events: ClaudeEvent[];
  display: string;
  
  // New fields for aggregation
  hasChatMessages: boolean;
  hasFileSnapshots: boolean;
  hasToolCalls: boolean;
  storyRole: SessionStoryRole;
  fileSnapshotCount: number;
}

/**
 * Helper: Generate a robust display title based on session role and content.
 * Prevents raw UUIDs from being used as titles.
 */
function generateDisplayForSession(params: {
    storyRole: SessionStoryRole;
    sessionId: string;
    events: ClaudeEvent[];
    projectPath?: string;
    fileSnapshotCount?: number;
}): string {
    const { storyRole, sessionId, events, projectPath, fileSnapshotCount } = params;
    const shortId = sessionId.slice(0, 8);

    // 1. Chat Strategy
    if (storyRole === 'chat') {
        // Try User Text
        const firstUserMsg = events.find(e => e.message?.role === 'user' && typeof e.message.content === 'string');
        if (firstUserMsg && typeof firstUserMsg.message?.content === 'string') {
            return firstUserMsg.message.content.slice(0, 100);
        }
        
        // Try User Complex Block (Text)
        const complexUserMsg = events.find(e => e.message?.role === 'user' && Array.isArray(e.message.content));
        if (complexUserMsg && Array.isArray(complexUserMsg.message?.content)) {
            const textBlock = complexUserMsg.message?.content.find(c => c.type === 'text');
            if (textBlock && textBlock.text) {
                return textBlock.text.slice(0, 100);
            }
        }

        // Try Assistant Text (First response)
        const firstAssistantMsg = events.find(e => e.message?.role === 'assistant');
        if (firstAssistantMsg) {
             if (typeof firstAssistantMsg.message?.content === 'string') {
                 return firstAssistantMsg.message.content.slice(0, 100);
             }
             if (Array.isArray(firstAssistantMsg.message?.content)) {
                 const textBlock = firstAssistantMsg.message.content.find(c => c.type === 'text');
                 if (textBlock && textBlock.text) {
                     return textBlock.text.slice(0, 100);
                 }
             }
        }

        return `Untitled Chat (${shortId})`;
    }

    // 2. Code Activity Strategy
    if (storyRole === 'code-activity') {
        const pName = projectPath && projectPath !== UNKNOWN_PROJECT_PATH 
            ? projectPath.split('/').pop() 
            : 'Project';
        const countStr = fileSnapshotCount ? ` (${fileSnapshotCount} snapshots)` : '';
        return `Code Activity: ${pName}${countStr}`;
    }

    // 3. System Strategy
    return `System Session (${shortId})`;
}

export async function processSessions(fileMap: Map<string, FileEntry>, store: DataStore) {
  const sessionFiles = Array.from(fileMap.keys()).filter((path) =>
    path.includes('/projects/') && path.endsWith('.jsonl')
  );

  const snapshots: ParsedSessionSnapshot[] = [];

  // Phase 1: Parse all files into snapshots
  for (const path of sessionFiles) {
    const entry = fileMap.get(path);
    if (!entry) continue;
    
    // --- Project Identification Logic ---
    // Extract project ID from directory structure: ~/.claude/projects/<ENCODED_NAME>/session.jsonl
    const parts = path.split('/');
    const projectsIndex = parts.lastIndexOf('projects');
    
    let directoryId: string | null = null;
    let decodedPath: string | null = null;

    if (projectsIndex !== -1 && parts.length > projectsIndex + 2) {
        // We have a subfolder after 'projects'
        directoryId = parts[projectsIndex + 1];
        decodedPath = decodeProjectName(directoryId);
    }
    // ------------------------------------

    let text = '';
    try {
        text = await entry.text();
    } catch (e: any) {
        store.warnings.push({ file: path, message: `Failed to read session file: ${e.message}` });
        continue;
    }

    const lines = text.split('\n').filter((l) => l.trim() !== '');
    const events: ClaudeEvent[] = [];
    
    let totalTokens = 0;
    const modelCount: Record<string, number> = {};
    let lastCwd = '';
    let sessionId = '';
    
    // Extract session ID from filename as backup
    const filenameId = path.split('/').pop()?.replace('.jsonl', '') || '';

    // Statistics for Role Derivation
    let hasChatMessages = false;
    let hasFileSnapshots = false;
    let hasToolCalls = false;
    let fileSnapshotCount = 0;

    lines.forEach((line, index) => {
      try {
        const json = JSON.parse(line);
        
        const event: ClaudeEvent = {
          uuid: json.uuid,
          sessionId: json.sessionId || filenameId,
          cwd: json.cwd,
          timestamp: json.timestamp || new Date().toISOString(),
          type: json.type,
          message: json.message,
          toolUseResult: json.toolUseResult,
          raw: json,
        };

        if (event.cwd) lastCwd = event.cwd;
        if (event.sessionId) sessionId = event.sessionId;

        // Token & Model Stats
        if (event.message?.usage) {
          totalTokens += (event.message.usage.input_tokens || 0) + (event.message.usage.output_tokens || 0);
        }
        if (event.message?.model) {
          modelCount[event.message.model] = (modelCount[event.message.model] || 0) + 1;
        }

        // Feature Detection
        if (event.type === 'message' || (event.message && (event.message.role === 'user' || event.message.role === 'assistant'))) {
            // Check if it has actual content (not just empty ack)
            hasChatMessages = true;
        }
        
        if (event.type === 'file-history-snapshot') {
            hasFileSnapshots = true;
            fileSnapshotCount++;
        }

        if (event.type === 'tool_use' || event.type === 'tool_result' || 
            (event.message?.content && Array.isArray(event.message.content) && 
             event.message.content.some(c => c.type === 'tool_use' || c.type === 'tool_result'))) {
            hasToolCalls = true;
        }

        events.push(event);
      } catch (e: any) {
        store.warnings.push({ 
            file: path, 
            line: index + 1, 
            message: `JSON parse error` 
        });
      }
    });

    if (events.length > 0) {
      events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const effectiveSessionId = sessionId || filenameId;

      // Determine Kind (Legacy)
      let kind: SessionKind = 'other';
      if (hasChatMessages) kind = 'chat';
      else if (hasFileSnapshots && !hasChatMessages) kind = 'file-history-only';

      // Determine Story Role (New)
      let storyRole: SessionStoryRole;
      if (hasChatMessages) {
          storyRole = 'chat';
      } else if (hasFileSnapshots) {
          storyRole = 'code-activity';
      } else {
          storyRole = 'system';
      }

      // Finalize Project Info
      // Priority: Decoded directory path -> Last seen CWD -> Unknown
      const effectiveProjectPath = decodedPath || lastCwd || UNKNOWN_PROJECT_PATH;

      // Generate Display Title
      let display = generateDisplayForSession({
          storyRole,
          sessionId: effectiveSessionId,
          events,
          projectPath: effectiveProjectPath,
          fileSnapshotCount
      });

      snapshots.push({
        id: effectiveSessionId,
        directoryId, // The folder name (e.g. -Users-foo)
        projectPath: effectiveProjectPath,
        kind,
        timestamp: events[0].timestamp,
        firstEventAt: events[0].timestamp,
        lastEventAt: events[events.length - 1].timestamp,
        messageCount: events.length,
        totalTokens,
        modelDistribution: modelCount,
        events,
        display,
        // New Fields
        hasChatMessages,
        hasFileSnapshots,
        hasToolCalls,
        storyRole,
        fileSnapshotCount
      });
    }
  }

  // Phase 2: Aggregate snapshots into Canonical Sessions
  store.sessions = buildCanonicalSessions(snapshots);
  
  // Sort by latest timestamp descending
  store.sessions.sort((a, b) => b.timestamp - a.timestamp);
}

function resolveProjectId(snapshot: ParsedSessionSnapshot): string | null {
    // 1. If we have a physical directory ID, that IS the project.
    if (snapshot.directoryId) {
        return snapshot.directoryId;
    }

    // 2. If no directory ID (e.g. file was in root of projects/), fallback to legacy logic
    // or standard special buckets.
    const path = snapshot.projectPath;
    
    if (path === UNKNOWN_PROJECT_PATH) {
        if (snapshot.kind === 'chat') return GLOBAL_SESSIONS_ID;
        if (snapshot.kind === 'file-history-only') return SYSTEM_SESSIONS_ID;
        return null;
    }
    
    // Fallback: use the path itself as ID (legacy behavior for files without parent dir)
    return path; 
}

function buildCanonicalSessions(rawSessions: ParsedSessionSnapshot[]): SessionSummary[] {
    const byId = new Map<string, ParsedSessionSnapshot[]>();
    
    // Group by Session ID
    for (const snap of rawSessions) {
        if (!snap.id) continue;
        const arr = byId.get(snap.id) ?? [];
        arr.push(snap);
        byId.set(snap.id, arr);
    }

    const result: SessionSummary[] = [];

    for (const [id, snapshots] of byId) {
        if (snapshots.length === 0) continue;

        // 1. Determine Primary Project ID
        // We look for the most frequent Project ID associated with this session's snapshots.
        // In the new model, this is driven by the directory the file lives in.
        const projectCounts = new Map<string, number>();
        let bestProjectId: string | null = null;
        let maxCount = -1;

        for (const snap of snapshots) {
            const pid = resolveProjectId(snap);
            if (pid) {
                const count = (projectCounts.get(pid) || 0) + 1;
                projectCounts.set(pid, count);
                if (count > maxCount) {
                    maxCount = count;
                    bestProjectId = pid;
                }
            }
        }
        
        const primaryProjectId = bestProjectId;

        // 2. Select Base Snapshot (Latest activity preferred)
        let baseSnapshot: ParsedSessionSnapshot | undefined;
        for (const snap of snapshots) {
            if (!baseSnapshot) {
                baseSnapshot = snap;
                continue;
            }
            if (snap.lastEventAt > baseSnapshot.lastEventAt) {
                baseSnapshot = snap;
            }
        }

        if (!baseSnapshot) continue;

        // 3. Build Path Usages (still useful for history of CWDs within the project)
        // Note: usage.projectId might differ if we moved files, but we map them to current understanding
        const pathUsageMap = new Map<string, SessionPathUsage>();
        for (const snap of snapshots) {
            // Use the snapshot's calculated project path (decoded or cwd)
            const path = snap.projectPath;
            const existing = pathUsageMap.get(path);
            const pid = resolveProjectId(snap);

            if (!existing) {
                pathUsageMap.set(path, {
                    path,
                    projectId: pid,
                    firstEventAt: snap.firstEventAt,
                    lastEventAt: snap.lastEventAt,
                    messageCount: snap.messageCount
                });
            } else {
                if (snap.firstEventAt < existing.firstEventAt) existing.firstEventAt = snap.firstEventAt;
                if (snap.lastEventAt > existing.lastEventAt) existing.lastEventAt = snap.lastEventAt;
                existing.messageCount += snap.messageCount;
            }
        }
        const pathUsages = Array.from(pathUsageMap.values());

        // 4. Merge Feature Flags
        const hasChatMessages = snapshots.some(s => s.hasChatMessages);
        const hasFileSnapshots = snapshots.some(s => s.hasFileSnapshots);
        const hasToolCalls = snapshots.some(s => s.hasToolCalls);
        const fileSnapshotCount = snapshots.reduce((acc, s) => acc + s.fileSnapshotCount, 0);

        let storyRole: SessionStoryRole;
        if (hasChatMessages) storyRole = 'chat';
        else if (hasFileSnapshots) storyRole = 'code-activity';
        else storyRole = 'system';

        // Use the path associated with the primary project ID if available, otherwise base snapshot
        let primaryProjectPath = baseSnapshot.projectPath;
        if (primaryProjectId && primaryProjectId.startsWith('-')) {
             // If ID is encoded directory, decode it for display
             primaryProjectPath = decodeProjectName(primaryProjectId);
        }

        result.push({
            id: baseSnapshot.id,
            timestamp: new Date(baseSnapshot.firstEventAt).getTime(),
            projectPath: primaryProjectPath, // Backward compat
            primaryProjectId,
            primaryProjectPath,
            pathUsages,
            display: baseSnapshot.display,
            messageCount: baseSnapshot.messageCount,
            totalTokens: baseSnapshot.totalTokens,
            modelDistribution: baseSnapshot.modelDistribution,
            events: baseSnapshot.events,
            kind: baseSnapshot.kind,
            // New Fields
            hasChatMessages,
            hasFileSnapshots,
            hasToolCalls,
            storyRole,
            fileSnapshotCount
        });
    }

    return result;
}

export async function processHistory(fileMap: Map<string, FileEntry>, store: DataStore) {
    const rootDir = Array.from(fileMap.keys()).filter(k => k.endsWith('history.jsonl'))[0]?.split('/history.jsonl')[0] || '';
    const findFile = (name: string) => fileMap.get(name) || (rootDir ? fileMap.get(`${rootDir}/${name}`) : undefined);
    
    const historyEntry = findFile('history.jsonl');
    if (!historyEntry) return;
  
    try {
      const text = await historyEntry.text();
      const lines = text.split('\n').filter(l => l.trim() !== '');
      
      lines.forEach((line, i) => {
          try {
              const item = JSON.parse(line);
              if (!item.timestamp || !item.project) return;
  
              const historyTime = new Date(item.timestamp).getTime();
  
              // Attempt to match history items to sessions
              const matchedSession = store.sessions.find(s => {
                  // Fuzzy match logic
                  const timeDiff = Math.abs(s.timestamp - historyTime);
                  if (timeDiff > 5000) return false;
                  
                  // Match project path if possible (normalized)
                  // item.project might be encoded OR decoded depending on CLI version, 
                  // but usually it's the readable path.
                  const pNorm = item.project.trim().replace(/\/$/, '');
                  const sNorm = (s.primaryProjectPath || '').trim().replace(/\/$/, '');
                  
                  return pNorm === sNorm || (s.primaryProjectId === item.project);
              });
  
              if (matchedSession) {
                  if (item.display) {
                      matchedSession.display = item.display;
                  }
              }
          } catch (e) {
              store.warnings.push({ file: historyEntry.path, line: i + 1, message: 'Invalid history item JSON' });
          }
      });
  
    } catch (e: any) {
       store.warnings.push({ file: historyEntry.path, message: `Failed to read history.jsonl: ${e.message}` });
    }
}
