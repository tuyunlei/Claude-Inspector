import { DataStore } from '../../datastore';
import { selectSessionsByProject } from '../context';
import { ClaudeEvent } from '../../events';
import { ProjectTurn, ContextEvent, TimelineAction, TimelineActionKind } from './types';
import { stripAnsi, getTextContent, getActionKind } from './helpers';

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
  // Ensure we sort chronologically: Oldest (small timestamp) -> Newest (large timestamp)
  allEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const blocks: ProjectTurn[] = [];
  let currentBlock: ProjectTurn | null = null;
  let queryCounter = 1;
  let pendingGuardrail: string | null = null;

  // [DEBUG] Stats container
  const debugStats = {
    total: 0,
    toolOnly: 0,
    complex: 0,
    normal: 0,
    compaction: 0,
    guardrails: 0,
    systemNotes: 0,
    reasons: { lenThreshold: 0, hasCodeFence: 0, both: 0 } as Record<string, number>
  };
  const shouldLog = !loggedDebugProjects.has(projectId) && projectId;

  for (const event of allEvents) {
    const timeStr = new Date(event.timestamp).toLocaleTimeString(undefined, {
       hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // --- A. User Message -> Start New Turn (or Merge) ---
    if (event.message?.role === 'user') {
      const text = getTextContent(event.message.content);
      const content = event.message.content;
      const textTrim = text ? text.trim() : '';
      const textClean = stripAnsi(textTrim);

      // 1. Detect Guardrails (Caveat) -> Bind to NEXT turn
      // Matches: "Caveat: The messages below..."
      if (textClean.startsWith("Caveat:") || (textClean.includes("Caveat:") && textClean.includes("DO NOT respond"))) {
          pendingGuardrail = textClean;
          if (shouldLog) debugStats.guardrails++;
          continue; // Skip creating a block
      }

      // 2. Detect System Notes (Compacted status) -> Bind to PREVIOUS turn
      // Matches: "Compacted (ctrl+o to see full summary)"
      if (textClean.includes("Compacted (") && textClean.toLowerCase().includes("ctrl+o")) {
          if (currentBlock) {
              if (!currentBlock.systemNotes) currentBlock.systemNotes = [];
              currentBlock.systemNotes.push(textClean);
              if (shouldLog) debugStats.systemNotes++;
          }
          continue; // Skip creating a block
      }

      // 3. Detect Compaction Context Event (Legacy handling)
      const isCompaction = textTrim.startsWith("This session is being continued from a previous conversation");

      if (isCompaction) {
          const contextEvent: ContextEvent = {
              id: event.uuid || `ctx-${Date.now()}-${Math.random()}`,
              type: 'context_compaction',
              text: text,
              timestamp: timeStr,
              stats: {
                  chars: text.length,
                  lines: text.split('\n').length
              }
          };

          const lastBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;

          if (lastBlock) {
              lastBlock.contextEvents.push(contextEvent);
          } else {
              // Orphan case
              const timestampDisplay = new Date(event.timestamp).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', 
                  hour: '2-digit', minute: '2-digit'
              });
              
              currentBlock = {
                  id: event.uuid || `evt-orphan-${blocks.length}`,
                  timestamp: timestampDisplay,
                  userQuery: "System Context Restored", 
                  replyPreview: '',
                  actions: [],
                  contextEvents: [contextEvent],
                  thinkingPreview: ''
              };
              blocks.push(currentBlock);
          }
          if (shouldLog) debugStats.compaction++;
          continue; 
      }

      // 4. Standard User Turn Creation
      if (text || (Array.isArray(content) && content.length > 0)) {
         
         const timestampDisplay = new Date(event.timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit'
         });

         // Check if input is complex (code blocks, etc)
         const len = text.length;
         const hasCodeFence = text.includes('```');
         const isLengthy = len > 500;
         const isToolResultOnly = !text;

         let isLongInput = false;
         let reasonKey = 'normal';

         if (!isToolResultOnly) {
             if (isLengthy && hasCodeFence) {
                 isLongInput = true;
                 reasonKey = 'both';
             } else if (isLengthy) {
                 isLongInput = true;
                 reasonKey = 'lenThreshold';
             } else if (hasCodeFence) {
                 isLongInput = true;
                 reasonKey = 'hasCodeFence';
             }
         }

         // [DEBUG] Collect stats
         if (shouldLog) {
             debugStats.total++;
             if (isToolResultOnly) {
                 debugStats.toolOnly++;
             } else if (isLongInput) {
                 debugStats.complex++;
                 if (debugStats.reasons[reasonKey] !== undefined) debugStats.reasons[reasonKey]++;
             } else {
                 debugStats.normal++;
             }
         }

         let displayQuery = text;
         if (isToolResultOnly) {
             displayQuery = '(Complex Input/Tool Result Only)';
         }
         
         const userQueryMeta = isLongInput ? {
             isLongInput: true,
             charCount: len,
             lineCount: text.split('\n').length,
             hasCodeFence
         } : undefined;

         currentBlock = {
           id: event.uuid || `evt-${blocks.length}-${Math.random()}`,
           timestamp: timestampDisplay,
           queryNumber: queryCounter++,
           userQuery: displayQuery,
           replyPreview: '',
           actions: [],
           contextEvents: [],
           thinkingPreview: '',
           userQueryMeta,
           guardrails: pendingGuardrail ? [pendingGuardrail] : undefined
         };
         
         // Clear pending guardrail after consuming it
         pendingGuardrail = null;

         blocks.push(currentBlock); 
         continue;
      }
    }

    // If we haven't started a block yet, skip orphan events (e.g. system events before first user query)
    if (!currentBlock) continue;

    // --- B. Assistant Message -> Reply & Thinking ---
    if (event.message?.role === 'assistant') {
       const text = getTextContent(event.message.content);
       if (text) {
           if (currentBlock.replyPreview) {
               currentBlock.replyPreview += '\n\n' + text;
           } else {
               currentBlock.replyPreview = text;
           }
       }
       
       if (Array.isArray(event.message.content)) {
           const thinking = event.message.content.find((c: any) => c.type === 'thinking');
           if (thinking && thinking.thinking) {
               if (currentBlock.thinkingPreview) currentBlock.thinkingPreview += '\n';
               currentBlock.thinkingPreview += thinking.thinking;
           }
       }
    }

    // --- C. Tool Use -> Action Card ---
    if (event.type === 'tool_use' || (event.message?.content && Array.isArray(event.message.content))) {
       const content = event.message?.content;
       if (Array.isArray(content)) {
           content.forEach((c: any) => {
               if (c.type === 'tool_use') {
                   const kind = getActionKind(c.name);
                   let label = c.name;
                   if (kind === 'subagent') {
                       label = `Subagent: ${c.name.replace('agent', '')}`;
                   } else {
                       label = `Tool: ${c.name}`;
                   }

                   currentBlock!.actions.push({
                       id: c.tool_use_id || `tool-${Math.random()}`,
                       kind: kind,
                       label: label,
                       timestamp: timeStr,
                       meta: { toolName: c.name },
                       payload: c.input
                   });
               }
           });
       } else if (event.type === 'tool_use') {
           // Legacy/Raw event handling
             currentBlock.actions.push({
                 id: event.uuid || `tool-${Math.random()}`,
                 kind: 'tool',
                 label: 'Tool Use',
                 timestamp: timeStr,
                 payload: (event as any).toolUseResult
             });
       }
    }

    // --- D. Tool Result -> Action Card ---
    if (event.type === 'tool_result' || (event.message?.content && Array.isArray(event.message.content))) {
        const content = event.message?.content;
        if (Array.isArray(content)) {
            content.forEach((c: any) => {
                if (c.type === 'tool_result') {
                    let isError = c.is_error || false;
                    const contentStr = typeof c.content === 'string' ? c.content : JSON.stringify(c.content);
                    if (!isError && contentStr && (contentStr.includes('Error:') || contentStr.includes('Failed'))) {
                        isError = true;
                    }

                    currentBlock!.actions.push({
                        id: c.tool_use_id ? `res-${c.tool_use_id}` : `res-${Math.random()}`,
                        kind: 'tool_result',
                        label: 'Tool Result',
                        timestamp: timeStr,
                        payload: c.content,
                        isError: isError
                    });
                }
            });
        }
    }

    // --- E. Snapshot -> Action Card ---
    if (event.type === 'file-history-snapshot') {
        const fileCount = event.raw?.snapshot?.trackedFileBackups ? Object.keys(event.raw.snapshot.trackedFileBackups).length : 0;
        currentBlock.actions.push({
            id: event.uuid || `snap-${Math.random()}`,
            kind: 'snapshot',
            label: `Snapshot · ${fileCount} files`,
            timestamp: timeStr,
            meta: { fileCount },
            payload: event.raw?.snapshot
        });
    }
  }
  
  // [DEBUG] Output logs once per project
  if (shouldLog) {
      console.log(`[PTComplexDebug2] project=${projectId} total=${debugStats.total} toolOnly=${debugStats.toolOnly} complex=${debugStats.complex} normal=${debugStats.normal} compaction=${debugStats.compaction} guardrails=${debugStats.guardrails} sysNotes=${debugStats.systemNotes}`);
      loggedDebugProjects.add(projectId);
  }

  return blocks;
}