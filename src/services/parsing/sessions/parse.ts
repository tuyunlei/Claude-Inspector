
import { DataStore } from '../../../model/datastore';
import { FileEntry } from '../../../model/files';
import { ClaudeEvent } from '../../../model/events';
import { UNKNOWN_PROJECT_PATH, decodeProjectName } from '../../../model/analytics/projects';
import { ParsedSessionSnapshot } from './types';
import { detectSessionFeatures } from './classification';
import { generateDisplayForSession } from './display';

export function collectSessionFilePaths(fileMap: Map<string, FileEntry>): string[] {
    return Array.from(fileMap.keys()).filter((path) =>
        path.includes('/projects/') && path.endsWith('.jsonl')
    );
}

async function readSessionFile(path: string, entry: FileEntry, store: DataStore): Promise<string | null> {
    try {
        return await entry.text();
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        store.warnings.push({ file: path, message: `Failed to read session file: ${msg}` });
        return null;
    }
}

function parseLineToEvent(line: string, index: number, path: string, filenameId: string, store: DataStore): ClaudeEvent | null {
    if (!line.trim()) return null;
    try {
        const json = JSON.parse(line);
        return {
            uuid: json.uuid,
            sessionId: json.sessionId || filenameId,
            cwd: json.cwd,
            timestamp: json.timestamp || new Date().toISOString(),
            type: json.type,
            message: json.message,
            toolUseResult: json.toolUseResult,
            raw: json,
        };
    } catch (e: unknown) {
        store.warnings.push({ 
            file: path, 
            line: index + 1, 
            message: `JSON parse error` 
        });
        return null;
    }
}

async function buildSnapshotFromFile(path: string, entry: FileEntry, store: DataStore): Promise<ParsedSessionSnapshot | null> {
    // --- Project Identification Logic ---
    const parts = path.split('/');
    const projectsIndex = parts.lastIndexOf('projects');
    
    let directoryId: string | null = null;
    let decodedPath: string | null = null;

    if (projectsIndex !== -1 && parts.length > projectsIndex + 2) {
        directoryId = parts[projectsIndex + 1];
        decodedPath = decodeProjectName(directoryId);
    }

    const text = await readSessionFile(path, entry, store);
    if (!text) return null;

    const lines = text.split('\n');
    const filenameId = path.split('/').pop()?.replace('.jsonl', '') || '';

    const events: ClaudeEvent[] = [];
    let totalTokens = 0;
    const modelDistribution: Record<string, number> = {};
    let lastCwd = '';
    let sessionId = '';

    lines.forEach((line, index) => {
        const event = parseLineToEvent(line, index, path, filenameId, store);
        if (event) {
            if (event.cwd) lastCwd = event.cwd;
            if (event.sessionId) sessionId = event.sessionId;

            // Token & Model Stats
            if (event.message?.usage) {
                totalTokens += (event.message.usage.input_tokens || 0) + (event.message.usage.output_tokens || 0);
            }
            if (event.message?.model) {
                modelDistribution[event.message.model] = (modelDistribution[event.message.model] || 0) + 1;
            }
            events.push(event);
        }
    });

    if (events.length === 0) return null;

    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const effectiveSessionId = sessionId || filenameId;
    const effectiveProjectPath = decodedPath || lastCwd || UNKNOWN_PROJECT_PATH;
    
    const features = detectSessionFeatures(events);

    const display = generateDisplayForSession({
        storyRole: features.storyRole,
        sessionId: effectiveSessionId,
        events,
        projectPath: effectiveProjectPath,
        fileSnapshotCount: features.fileSnapshotCount
    });

    return {
        id: effectiveSessionId,
        directoryId, 
        projectPath: effectiveProjectPath,
        timestamp: events[0].timestamp,
        firstEventAt: events[0].timestamp,
        lastEventAt: events[events.length - 1].timestamp,
        messageCount: events.length,
        totalTokens,
        modelDistribution,
        events,
        display,
        ...features
    };
}

export async function parseSessionSnapshots(fileMap: Map<string, FileEntry>, store: DataStore): Promise<ParsedSessionSnapshot[]> {
    const paths = collectSessionFilePaths(fileMap);
    const snapshots: ParsedSessionSnapshot[] = [];

    for (const path of paths) {
        const entry = fileMap.get(path);
        if (!entry) continue;
        const snapshot = await buildSnapshotFromFile(path, entry, store);
        if (snapshot) snapshots.push(snapshot);
    }

    return snapshots;
}
