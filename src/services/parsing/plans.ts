
import { DataStore } from '../../model/datastore';
import { FileEntry } from '../../model/files';
import { Plan } from '../../model/plans';

export async function processPlans(fileMap: Map<string, FileEntry>, store: DataStore) {
  const planFiles = Array.from(fileMap.keys()).filter((path) =>
    path.includes('/plans/') && path.endsWith('.md')
  );

  for (const path of planFiles) {
    const entry = fileMap.get(path);
    if (!entry) continue;

    try {
      const text = await entry.text();
      // Extract title: Try first markdown heading #, or fallback to first non-empty line
      const lines = text.split('\n');
      let title = path.split('/').pop() || 'Untitled Plan';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          title = trimmed.replace('# ', '').trim();
          break;
        }
        if (trimmed.length > 0 && !trimmed.startsWith('#')) {
             // Fallback to first text line if no heading immediately found, 
             // but usually plans start with a heading.
             // We'll stick to filename if no clear header found to avoid grabbing metadata.
        }
      }

      const plan: Plan = {
        id: path,
        filePath: path,
        title: title,
        content: text,
      };

      store.plans.push(plan);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      store.warnings.push({ file: path, message: `Failed to read plan file: ${msg}` });
    }
  }
}
