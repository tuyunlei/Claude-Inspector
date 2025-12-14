
import { DataStore } from '../../../model/datastore';
import { FileEntry } from '../../../model/files';
import { HistoryItem } from '../../../model/history';
import { HISTORY_SESSION_MATCH_WINDOW_MS } from './types';

function findHistoryFile(fileMap: Map<string, FileEntry>): FileEntry | undefined {
    // Identify root directory name if present in paths
    // Similar to config parser logic, history is usually at ~/.claude/history.jsonl
    const rootDir = Array.from(fileMap.keys()).filter(k => k.endsWith('history.jsonl'))[0]?.split('/history.jsonl')[0] || '';
    const findFile = (name: string) => fileMap.get(name) || (rootDir ? fileMap.get(`${rootDir}/${name}`) : undefined);
    return findFile('history.jsonl');
}

function parseHistoryLines(text: string, path: string, store: DataStore): HistoryItem[] {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    const items: HistoryItem[] = [];

    lines.forEach((line, i) => {
        try {
            const item = JSON.parse(line);
            if (!item.timestamp || !item.project) return;
            items.push(item);
        } catch (e) {
            store.warnings.push({ file: path, line: i + 1, message: 'Invalid history item JSON' });
        }
    });

    return items;
}

function findMatchingSession(item: HistoryItem, store: DataStore) {
    const historyTime = new Date(item.timestamp).getTime();
    
    return store.sessions.find(s => {
        const timeDiff = Math.abs(s.timestamp - historyTime);
        if (timeDiff > HISTORY_SESSION_MATCH_WINDOW_MS) return false;
        
        const pNorm = item.project.trim().replace(/\/$/, '');
        const sNorm = (s.primaryProjectPath || '').trim().replace(/\/$/, '');
        
        return pNorm === sNorm || (s.primaryProjectId === item.project);
    });
}

export async function processHistory(fileMap: Map<string, FileEntry>, store: DataStore) {
    const historyEntry = findHistoryFile(fileMap);
    if (!historyEntry) return;

    try {
        const text = await historyEntry.text();
        const items = parseHistoryLines(text, historyEntry.path, store);

        // Store raw items
        store.history = items;

        // Enrich sessions with display names from history
        items.forEach((item) => {
            const matchedSession = findMatchingSession(item, store);
            if (matchedSession && item.display) {
                matchedSession.display = item.display;
            }
        });

    } catch (e: unknown) {
       const msg = e instanceof Error ? e.message : String(e);
       store.warnings.push({ file: historyEntry.path, message: `Failed to read history.jsonl: ${msg}` });
    }
}
