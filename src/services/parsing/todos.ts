
import { DataStore } from '../../model/datastore';
import { FileEntry } from '../../model/files';

export async function processTodos(fileMap: Map<string, FileEntry>, store: DataStore) {
  const todoFiles = Array.from(fileMap.keys()).filter((path) =>
    path.includes('/todos/') && path.endsWith('.json')
  );

  for (const path of todoFiles) {
    const entry = fileMap.get(path);
    if (!entry) continue;
    
    try {
      const text = await entry.text();
      const items = JSON.parse(text);
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          store.todos.push({
            content: item.content,
            status: item.status,
            priority: item.priority,
            id: item.id,
            sessionId: path.split('/').pop()?.replace('.json', '')
          });
        });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      store.warnings.push({ file: path, message: `Invalid todo JSON: ${msg}` });
    }
  }
}
