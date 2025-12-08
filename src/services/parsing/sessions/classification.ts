import { ClaudeEvent } from '../../../model/events';
import { SessionKind, SessionStoryRole } from '../../../model/sessions';
import { SessionFeatureFlags } from './types';

interface FeatureCounts {
    hasChatMessages: boolean;
    hasFileSnapshots: boolean;
    hasToolCalls: boolean;
    fileSnapshotCount: number;
}

function detectFeatureFlags(events: ClaudeEvent[]): FeatureCounts {
    let hasChatMessages = false;
    let hasFileSnapshots = false;
    let hasToolCalls = false;
    let fileSnapshotCount = 0;

    for (const event of events) {
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
    }

    return {
        hasChatMessages,
        hasFileSnapshots,
        hasToolCalls,
        fileSnapshotCount
    };
}

function classifyKind(counts: FeatureCounts): SessionKind {
    if (counts.hasChatMessages) return 'chat';
    if (counts.hasFileSnapshots && !counts.hasChatMessages) return 'file-history-only';
    return 'other';
}

function classifyStoryRole(counts: FeatureCounts): SessionStoryRole {
    if (counts.hasChatMessages) {
        return 'chat';
    } else if (counts.hasFileSnapshots) {
        return 'code-activity';
    } else {
        return 'system';
    }
}

export function detectSessionFeatures(events: ClaudeEvent[]): SessionFeatureFlags {
    const counts = detectFeatureFlags(events);
    const kind = classifyKind(counts);
    const storyRole = classifyStoryRole(counts);
    
    return {
        ...counts,
        kind,
        storyRole
    };
}
