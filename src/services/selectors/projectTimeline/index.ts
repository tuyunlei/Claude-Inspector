
import { DataStore } from '../../model/datastore';
import { selectSessionsByProject } from '../context';
import { ClaudeEvent } from '../../model/events';
import { ProjectTurn } from './types';
import { processUserMessage, processAssistantContent, DebugStats } from './processors/index';

export * from './types';

const loggedDebugProjects = new Set<string>();

/**
 * [Selector Documentation]
 * Aggregates raw ClaudeEvents into high-level "ProjectTurns".
 * 
 * Strategy:
 * 1. Flatten all events from all sessions in the project.
 * 2. Sort chronologically (Oldest -> Newest) to reconstruct the conversation flow.
 * 3. Group events into "Turns":
 *    - A Turn starts when a 'user' message is encountered.
 *    - Subsequent 'assistant' messages, tool uses, and snapshots are appended to the current turn.
 * 4. Merging Logic:
 *    - "Caveat:" messages are merged into the NEXT user turn as `guardrails`.
 *    - "Compacted (ctrl+o)" messages are merged into the PREVIOUS turn as `systemNotes`.
 */
export function selectProjectTimeline(data: DataStore, projectId: string): ProjectTurn[] {
  const sessions = selectSessionsByProject(data, projectId);
  
  // 1. Flatten all events from all sessions in this project
  let allEvents: ClaudeEvent[] = [];
  sessions.forEach(s => {
    allEvents = allEvents.concat(s.events);
  });

  // 2. Sort by timestamp (Oldest first for processing context)
  allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const blocks: ProjectTurn[] = [];
  let currentBlock: ProjectTurn | null = null;
  let queryCounter = 1;
  let pendingGuardrail: string | null = null;

  // [DEBUG] Stats container
  const debugStats: DebugStats = {
    total: 0,
    toolOnly: 0,
    complex: 0,
    normal: 0,
    compaction: 0,
    guardrails: 0,
    systemNotes: 0,
    reasons: {}
  };
  const shouldLog = !loggedDebugProjects.has(projectId) && !!projectId;

  for (const event of allEvents) {
    // --- A. User Message -> Start New Turn (or Merge) ---
    if (event.message?.role === 'user') {
      const result = processUserMessage(
          event, 
          currentBlock, 
          blocks, 
          queryCounter, 
          pendingGuardrail, 
          debugStats, 
          shouldLog
      );

      queryCounter = result.newQueryCounter;
      pendingGuardrail = result.newPendingGuardrail;
      
      if (result.newBlock) {
          currentBlock = result.newBlock;
      }
      
      if (result.shouldContinue) continue;
    }

    // If we haven't started a block yet, skip orphan events (e.g. system events before first user query)
    if (!currentBlock) continue;

    // --- B. Assistant / Tool Content ---
    processAssistantContent(event, currentBlock);
  }
  
  // [DEBUG] Output logs once per project
  if (shouldLog) {
      console.log(`[PTComplexDebug2] project=${projectId} total=${debugStats.total} toolOnly=${debugStats.toolOnly} complex=${debugStats.complex} normal=${debugStats.normal} compaction=${debugStats.compaction} guardrails=${debugStats.guardrails} sysNotes=${debugStats.systemNotes}`);
      loggedDebugProjects.add(projectId);
  }

  return blocks;
}