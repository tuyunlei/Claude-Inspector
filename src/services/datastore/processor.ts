
import { DataStore } from '../../model/datastore';
import { FileEntry } from '../../model/files';
import { processConfigs } from '../parsing/config';
import { processTodos } from '../parsing/todos';
import { processPlans } from '../parsing/plans';
import { processSessions, processHistory } from '../parsing/sessions';
import { calculateProjectStats } from '../analytics/projects';
import { buildFileTree } from '../filesystem/tree';

export const buildDataStoreFromEntries = async (
  entries: FileEntry[],
  optionalExtraConfig?: File
): Promise<DataStore> => {
  
  const fileMap = new Map<string, FileEntry>();
  for (const entry of entries) {
    fileMap.set(entry.path, entry);
  }

  const store: DataStore = {
    sessions: [],
    projects: [],
    todos: [],
    plans: [],
    config: {},
    history: [],
    warnings: [],
    isLoaded: false,
    fileCount: entries.length,
    fileMap: fileMap,
    fileTree: undefined,
  };

  // 1. Parse Configs
  await processConfigs(fileMap, store, optionalExtraConfig);

  // 2. Parse Todos & Plans
  await processTodos(fileMap, store);
  await processPlans(fileMap, store);

  // 3. Parse Sessions (projects/*.jsonl)
  await processSessions(fileMap, store);

  // 4. Parse History (history.jsonl) - Optional Enrichment
  await processHistory(fileMap, store);

  // 5. Aggregates (Projects Stats)
  calculateProjectStats(store);

  // 6. Build File Tree
  store.fileTree = buildFileTree(fileMap);

  store.isLoaded = true;
  return store;
};