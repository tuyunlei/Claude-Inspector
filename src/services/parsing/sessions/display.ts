import { ClaudeEvent } from '../../../model/events';
import { SessionStoryRole } from '../../../model/sessions';
import { UNKNOWN_PROJECT_PATH } from '../../../model/analytics/projects';

interface DisplayParams {
    storyRole: SessionStoryRole;
    sessionId: string;
    events: ClaudeEvent[];
    projectPath?: string;
    fileSnapshotCount?: number;
}

/**
 * Helper: Generate a robust display title based on session role and content.
 * Prevents raw UUIDs from being used as titles.
 */
export function generateDisplayForSession(params: DisplayParams): string {
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
