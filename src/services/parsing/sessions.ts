import { DataStore } from '../../model/datastore';
import { FileEntry } from '../../model/files';
import { ParsedSessionSnapshot } from './sessions/types';
import { parseSessionSnapshots } from './sessions/parse';
import { buildCanonicalSessions } from './sessions/summary';
export { processHistory } from './sessions/history';

export async function processSessions(fileMap: Map<string, FileEntry>, store: DataStore) {
  const snapshots: ParsedSessionSnapshot[] = await parseSessionSnapshots(fileMap, store);
  const canonical = buildCanonicalSessions(snapshots);
  
  // Sort by latest timestamp descending
  canonical.sort((a, b) => b.timestamp - a.timestamp);
  
  store.sessions = canonical;
}
