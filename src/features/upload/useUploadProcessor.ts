
import { useState } from 'react';
import { buildDataStoreFromEntries } from '../../core/datastore/processor';
import { createFileEntriesFromFiles, createFileEntriesFromZip } from '../../core/filesystem/adapters';
import { DataStore } from '../../types';
import { useI18n } from '../../shared/i18n';

export const useUploadProcessor = (onDataLoaded: (data: DataStore) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedConfig, setDetectedConfig] = useState<File | null>(null);
  const { t } = useI18n();

  const processFiles = async (files: FileList | File[], type: 'auto' | 'zip' | 'dir') => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 100)); // UI flush

      // 1. Separate Config & Data
      let config = detectedConfig;
      const dataFiles: File[] = [];
      let zipFile: File | null = null;

      // Normalize FileList to Array
      const fileArray = Array.from(files);

      for (const file of fileArray) {
        // Check for specific config filenames or explicit manual upload
        if (file.name === 'claude.json' || file.name === 'settings.json' || file.name === 'mcp-servers.json') {
           config = file;
           setDetectedConfig(file);
        } else if (file.name.endsWith('.zip')) {
           zipFile = file;
        } else {
           dataFiles.push(file);
        }
      }

      let entries;

      // 2. Determine Processing Strategy
      if (zipFile) {
         entries = await createFileEntriesFromZip(zipFile);
      } else if (dataFiles.length > 0) {
         const dt = new DataTransfer();
         dataFiles.forEach(f => dt.items.add(f));
         entries = createFileEntriesFromFiles(dt.files);
      } else if (config) {
          throw new Error("Please include the .claude directory or log files along with the config.");
      } else {
          throw new Error("No valid logs or zip files found.");
      }

      // 3. Kick off processing
      const store = await buildDataStoreFromEntries(entries, config || undefined);
      onDataLoaded(store);

    } catch (err: any) {
      console.error("Upload error details:", err);
      let errorDetails = err instanceof Error ? err.message : String(err);
      setError(`${t('upload.error')}: ${errorDetails}`);
      setLoading(false);
    }
  };

  return { loading, error, detectedConfig, processFiles };
};
