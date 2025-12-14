
import { ClaudeEvent } from '../../../events';
import { ProjectTurn, ContextEvent } from '../types';
import { getTextContent, stripAnsi } from '../helpers';

export interface DebugStats {
    total: number;
    toolOnly: number;
    complex: number;
    normal: number;
    compaction: number;
    guardrails: number;
    systemNotes: number;
    reasons: Record<string, number>;
}

export interface ProcessUserMessageResult {
    newBlock: ProjectTurn | null;
    newQueryCounter: number;
    newPendingGuardrail: string | null;
    shouldContinue: boolean; // if true, stop processing this event loop iteration
}

export function processUserMessage(
    event: ClaudeEvent, 
    currentBlock: ProjectTurn | null, 
    blocks: ProjectTurn[], 
    queryCounter: number, 
    pendingGuardrail: string | null,
    debugStats: DebugStats,
    shouldLog: boolean
): ProcessUserMessageResult {
    const timeStr = new Date(event.timestamp).toLocaleTimeString(undefined, {
       hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const text = getTextContent(event.message?.content);
    const content = event.message?.content;
    const textTrim = text ? text.trim() : '';
    const textClean = stripAnsi(textTrim);

    // 1. Detect Guardrails (Caveat) -> Bind to NEXT turn
    if (textClean.startsWith("Caveat:") || (textClean.includes("Caveat:") && textClean.includes("DO NOT respond"))) {
        if (shouldLog) debugStats.guardrails++;
        return { newBlock: null, newQueryCounter: queryCounter, newPendingGuardrail: textClean, shouldContinue: true };
    }

    // 2. Detect System Notes (Compacted status) -> Bind to PREVIOUS turn
    if (textClean.includes("Compacted (") && textClean.toLowerCase().includes("ctrl+o")) {
        if (currentBlock) {
            if (!currentBlock.systemNotes) currentBlock.systemNotes = [];
            currentBlock.systemNotes.push(textClean);
            if (shouldLog) debugStats.systemNotes++;
        }
        return { newBlock: null, newQueryCounter: queryCounter, newPendingGuardrail: pendingGuardrail, shouldContinue: true };
    }

    // 3. Detect Compaction Context Event
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
            
            const orphanBlock: ProjectTurn = {
                id: event.uuid || `evt-orphan-${blocks.length}`,
                timestamp: timestampDisplay,
                userQuery: "System Context Restored", 
                replyPreview: '',
                actions: [],
                contextEvents: [contextEvent],
                thinkingPreview: ''
            };
            blocks.push(orphanBlock);
            if (shouldLog) debugStats.compaction++;
            return { newBlock: orphanBlock, newQueryCounter: queryCounter, newPendingGuardrail: pendingGuardrail, shouldContinue: true };
        }
        if (shouldLog) debugStats.compaction++;
        return { newBlock: null, newQueryCounter: queryCounter, newPendingGuardrail: pendingGuardrail, shouldContinue: true };
    }

    // 4. Standard User Turn Creation
    if (text || (Array.isArray(content) && content.length > 0)) {
         
         const timestampDisplay = new Date(event.timestamp).toLocaleString(undefined, {
            month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit'
         });

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

         const newBlock: ProjectTurn = {
           id: event.uuid || `evt-${blocks.length}-${Math.random()}`,
           timestamp: timestampDisplay,
           queryNumber: queryCounter,
           userQuery: displayQuery,
           replyPreview: '',
           actions: [],
           contextEvents: [],
           thinkingPreview: '',
           userQueryMeta,
           guardrails: pendingGuardrail ? [pendingGuardrail] : undefined
         };
         
         blocks.push(newBlock);
         
         return { 
             newBlock, 
             newQueryCounter: queryCounter + 1, 
             newPendingGuardrail: null, // Clear pending guardrail
             shouldContinue: true 
         };
    }

    return { newBlock: null, newQueryCounter: queryCounter, newPendingGuardrail: pendingGuardrail, shouldContinue: false };
}
