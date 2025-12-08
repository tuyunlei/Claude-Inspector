
import { DataStore } from '../../model/datastore';
import { FileEntry } from '../../model/files';

export async function processConfigs(
  fileMap: Map<string, FileEntry>, 
  store: DataStore,
  optionalExtraConfig?: File
) {
  // Identify root directory name if present in paths
  const rootDir = Array.from(fileMap.keys())[0]?.split('/')[0];
  
  // Helper to find file with or without root dir prefix
  const findFile = (name: string) => {
    return fileMap.get(name) || (rootDir ? fileMap.get(`${rootDir}/${name}`) : undefined);
  };

  const settingsEntry = findFile('settings.json');
  if (settingsEntry) {
    try {
      const text = await settingsEntry.text();
      store.config.rawSettingsJson = text;
      store.config.settings = JSON.parse(text);
    } catch (e: any) {
      store.warnings.push({ file: settingsEntry.path, message: `Failed to parse settings.json: ${e.message}` });
    }
  }

  const mcpEntry = findFile('mcp-servers.json');
  if (mcpEntry) {
    try {
      const text = await mcpEntry.text();
      store.config.rawMcpJson = text;
      const json = JSON.parse(text);
      store.config.mcpServers = json?.mcpServers || {};
    } catch (e: any) {
      store.warnings.push({ file: mcpEntry.path, message: `Failed to parse mcp-servers.json: ${e.message}` });
    }
  }

  // Handle optional extra config upload
  if (optionalExtraConfig) {
    try {
      const text = await new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = (e) => resolve(e.target?.result as string);
         reader.onerror = () => reject(new Error(`Failed to read extra config: ${reader.error?.message}`));
         reader.readAsText(optionalExtraConfig);
      });
      
      store.config.extraMcpJson = text;
      const json = JSON.parse(text);
      
      if (json.mcpServers) {
        // Merge strategy: Existing servers (from mcp-servers.json) take precedence
        store.config.mcpServers = {
            ...json.mcpServers,
            ...(store.config.mcpServers || {})
        };
      }
    } catch (e: any) {
       store.warnings.push({ file: optionalExtraConfig.name, message: `Failed to parse extra config JSON: ${e.message}` });
    }
  }
}
