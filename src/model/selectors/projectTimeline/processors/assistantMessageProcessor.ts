import { ClaudeEvent } from '../../../events';
import { ProjectTurn } from '../types';
import { getTextContent, getActionKind } from '../helpers';

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

                   currentBlock.actions.push({
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

                    currentBlock.actions.push({
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