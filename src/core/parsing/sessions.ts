
import { DataStore } from '../domain/datastore';
import { FileEntry } from '../domain/files';
import { ClaudeEvent } from '../domain/events';
import { SessionKind, SessionSummary, SessionPathUsage, SessionStoryRole } from '../domain/sessions';
import { UNKNOWN_PROJECT_PATH, GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID } from '../analytics/projects';

// Internal intermediate structure
interface ParsedSessionSnapshot {
  id: string;
  projectPath: string; // Defaults to UNKNOWN_PROJECT_PATH if missing
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
    let cwd = '';
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

        if (event.cwd) cwd = event.cwd;
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

      // Generate Display Title
      let display = generateDisplayForSession({
          storyRole,
          sessionId: effectiveSessionId,
          events,
          projectPath: cwd || UNKNOWN_PROJECT_PATH,
          fileSnapshotCount
      });

      // Special case: If original JSON had a specific display field, allow it to override 
      // ONLY if we didn't extract a meaningful chat title (i.e. if we fell back to default).
      // But typically we trust our generation. If events[0].raw.display exists, it's usually from history.jsonl injection,
      // which is handled in processHistory separately. 

      snapshots.push({
        id: effectiveSessionId,
        projectPath: cwd || UNKNOWN_PROJECT_PATH,
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

function resolveProjectId(path: string, kind: SessionKind): string | null {
    if (path === UNKNOWN_PROJECT_PATH) {
        if (kind === 'chat') return GLOBAL_SESSIONS_ID;
        if (kind === 'file-history-only') return SYSTEM_SESSIONS_ID;
        return null; // Truly unknown/other
    }
    return path; // For standard projects, ID is the path
}

function buildCanonicalSessions(rawSessions: ParsedSessionSnapshot[]): SessionSummary[] {
    const byId = new Map<string, ParsedSessionSnapshot[]>();
    
    // Group by ID
    for (const snap of rawSessions) {
        if (!snap.id) continue;
        const arr = byId.get(snap.id) ?? [];
        arr.push(snap);
        byId.set(snap.id, arr);
    }

    const result: SessionSummary[] = [];

    for (const [id, snapshots] of byId) {
        if (snapshots.length === 0) continue;

        // 1. Build Path Usages
        const pathUsageMap = new Map<string, SessionPathUsage>();
        
        for (const snap of snapshots) {
            const path = snap.projectPath;
            const existing = pathUsageMap.get(path);
            const projectId = resolveProjectId(path, snap.kind);

            if (!existing) {
                pathUsageMap.set(path, {
                    path,
                    projectId,
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

        // 2. Select Primary Project (Ownership)
        const nonUnknown = pathUsages.filter(u => u.path !== UNKNOWN_PROJECT_PATH);
        const candidates = nonUnknown.length > 0 ? nonUnknown : pathUsages;
        
        let primaryUsage: SessionPathUsage | undefined;
        for (const usage of candidates) {
            if (!primaryUsage || usage.messageCount > primaryUsage.messageCount) {
                primaryUsage = usage;
            }
        }

        const primaryProjectId = primaryUsage?.projectId ?? null;
        const primaryProjectPath = primaryUsage?.path ?? UNKNOWN_PROJECT_PATH;

        // 3. Select Base Snapshot for events/tokens (Latest activity preferred)
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

        // 4. Merge Feature Flags (Union)
        const hasChatMessages = snapshots.some(s => s.hasChatMessages);
        const hasFileSnapshots = snapshots.some(s => s.hasFileSnapshots);
        const hasToolCalls = snapshots.some(s => s.hasToolCalls);
        const fileSnapshotCount = snapshots.reduce((acc, s) => acc + s.fileSnapshotCount, 0);

        // Re-evaluate Story Role based on merged data
        let storyRole: SessionStoryRole;
        if (hasChatMessages) storyRole = 'chat';
        else if (hasFileSnapshots) storyRole = 'code-activity';
        else storyRole = 'system';

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
    const rootDir = Array.from(fileMap.keys())[0]?.split('/')[0];
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
  
              const matchedSession = store.sessions.find(s => {
                  const p2 = (item.project || '').trim().replace(/\/$/, '');
                  const hasPathMatch = s.pathUsages.some(u => u.path.trim().replace(/\/$/, '') === p2);
                  if (!hasPathMatch) return false;
  
                  const timeDiff = Math.abs(s.timestamp - historyTime);
                  return timeDiff < 5000;
              });
  
              if (matchedSession) {
                  // Only overwrite if the history display is meaningful and not just a UUID
                  // (Assuming history.jsonl generally contains user-intent titles)
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
