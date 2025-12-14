
import { ClaudeEvent } from '../../../../model/events';
import { ProjectTurn } from '../types';
import { getTextContent, getActionKind } from '../helpers';

interface ThinkingContent {
    type: 'thinking';
    thinking?: string;
}

interface ToolUseContent {
    type: 'tool_use';
    name: string;
    tool_use_id?: string;
    input?: Record<string, unknown>;
}

interface ToolResultContent {
    type: 'tool_result';
    tool_use_id?: string;
    content?: string | unknown;
    is_error?: boolean;
}

export function processAssistantContent(event: ClaudeEvent, currentBlock: ProjectTurn) {
    const timeStr = new Date(event.timestamp).toLocaleTimeString(undefined, {
       hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

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
           const thinking = (event.message.content as Array<{type: string}>).find(c => c.type === 'thinking') as ThinkingContent | undefined;
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
           content.forEach((c) => {
               if (c.type === 'tool_use') {
                   const toolUse = c as ToolUseContent;
                   const kind = getActionKind(toolUse.name);
                   let label = toolUse.name;
                   if (kind === 'subagent') {
                       label = `Subagent: ${toolUse.name.replace('agent', '')}`;
                   } else {
                       label = `Tool: ${toolUse.name}`;
                   }

                   currentBlock.actions.push({
                       id: toolUse.tool_use_id || `tool-${Math.random()}`,
                       kind: kind,
                       label: label,
                       timestamp: timeStr,
                       meta: { toolName: toolUse.name },
                       payload: toolUse.input
                   });
               }
           });
       } else if (event.type === 'tool_use') {
           // Legacy/Raw event handling
             const rawEvent = event as unknown as { toolUseResult: Record<string, unknown> };
             currentBlock.actions.push({
                 id: event.uuid || `tool-${Math.random()}`,
                 kind: 'tool',
                 label: 'Tool Use',
                 timestamp: timeStr,
                 payload: rawEvent.toolUseResult
             });
       }
    }

    // --- D. Tool Result -> Action Card ---
    if (event.type === 'tool_result' || (event.message?.content && Array.isArray(event.message.content))) {
        const content = event.message?.content;
        if (Array.isArray(content)) {
            content.forEach((c) => {
                if (c.type === 'tool_result') {
                    const toolResult = c as ToolResultContent;
                    let isError = toolResult.is_error || false;
                    const contentStr = typeof toolResult.content === 'string' ? toolResult.content : JSON.stringify(toolResult.content);
                    if (!isError && contentStr && (contentStr.includes('Error:') || contentStr.includes('Failed'))) {
                        isError = true;
                    }

                    // Normalize payload to Record<string, unknown> if possible for consistency, but payload is generic
                    // The payload field expects Record<string, unknown>, but sometimes result is just string
                    // PayloadViewer handles string | object. The type definition says Record<string, unknown>.
                    // We should cast or wrap it.
                    let payload: Record<string, unknown> | undefined;
                    if (typeof toolResult.content === 'object' && toolResult.content !== null) {
                        payload = toolResult.content as Record<string, unknown>;
                    } else if (typeof toolResult.content === 'string') {
                         payload = { result: toolResult.content };
                    }

                    currentBlock.actions.push({
                        id: toolResult.tool_use_id ? `res-${toolResult.tool_use_id}` : `res-${Math.random()}`,
                        kind: 'tool_result',
                        label: 'Tool Result',
                        timestamp: timeStr,
                        payload: payload,
                        isError: isError
                    });
                }
            });
        }
    }

    // --- E. Snapshot -> Action Card ---
    if (event.type === 'file-history-snapshot') {
        const rawSnapshot = event.raw?.snapshot as { trackedFileBackups?: Record<string, unknown> } | undefined;
        const fileCount = rawSnapshot?.trackedFileBackups ? Object.keys(rawSnapshot.trackedFileBackups).length : 0;
        currentBlock.actions.push({
            id: event.uuid || `snap-${Math.random()}`,
            kind: 'snapshot',
            label: `Snapshot · ${fileCount} files`,
            timestamp: timeStr,
            meta: { fileCount },
            payload: event.raw?.snapshot as Record<string, unknown> | undefined
        });
    }
}