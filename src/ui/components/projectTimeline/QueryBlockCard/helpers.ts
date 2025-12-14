
import { TimelineAction } from '../../../../services/selectors/projectTimeline/types';
import { EvidenceItem } from '../EvidenceBadgeList';

export interface EvidenceStats {
    readFilesMap: Map<string, { count: number; actions: TimelineAction[] }>;
    changedFilesMap: Map<string, { count: number; actions: TimelineAction[] }>;
    toolCountsMap: Map<string, { count: number; actions: TimelineAction[] }>;
    hasError: boolean;
}

export function analyzeEvidence(actions: TimelineAction[]): EvidenceStats {
    const stats: EvidenceStats = {
        readFilesMap: new Map(),
        changedFilesMap: new Map(),
        toolCountsMap: new Map(),
        hasError: false
    };

    actions.forEach(action => {
        // 1. Error Detection
        if (action.isError) {
            stats.hasError = true;
        }

        // 2. Tool Counts
        if (action.kind === 'tool' || action.kind === 'subagent') {
            const name = action.meta?.toolName || 'unknown';
            const entry = stats.toolCountsMap.get(name) || { count: 0, actions: [] };
            entry.count++;
            entry.actions.push(action);
            stats.toolCountsMap.set(name, entry);
        }

        // 3. File Extraction (Heuristic)
        if (action.kind === 'tool' && action.payload) {
            const toolName = (action.meta?.toolName || '').toLowerCase();
            const args = action.payload;
            
            // Extract potential path from common args
            const path = args.path || args.file_path || args.file || args.filename || args.target;
            
            if (path && typeof path === 'string') {
                const isWrite = toolName.match(/write|edit|save|update|replace|patch|sed/);
                const map = isWrite ? stats.changedFilesMap : stats.readFilesMap;
                
                const entry = map.get(path) || { count: 0, actions: [] };
                entry.count++;
                entry.actions.push(action);
                map.set(path, entry);
            }
        }
    });

    return stats;
}

export function formatToolName(name: string): string {
    const parts = name.split('__');
    if (parts.length <= 1) return name;
    
    // Source: Prioritize 2nd segment (index 1), fallback to 1st (index 0)
    const source = parts.length >= 2 ? parts[1] : parts[0];
    const action = parts[parts.length - 1];
    
    if (source === action) return action;
    return `${source} · ${action}`;
}

export function convertToEvidenceItems(
    map: Map<string, { count: number; actions: TimelineAction[] }>, 
    type: EvidenceItem['type']
): EvidenceItem[] {
    return Array.from(map.entries()).map(([key, val]) => ({
        id: key,
        label: type === 'tool' ? formatToolName(key) : key.split('/').pop() || key,
        fullPath: key,
        count: val.count,
        type: type,
        meta: undefined
    })).sort((a, b) => b.count - a.count);
}