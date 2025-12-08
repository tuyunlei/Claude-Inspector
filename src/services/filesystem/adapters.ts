
import JSZip from 'jszip';
import { FileEntry } from '../../model/files';

export const createFileEntriesFromFiles = (files: FileList | DataTransferItemList): FileEntry[] => {
  const entries: FileEntry[] = [];
  // Handle both FileList and DataTransferItemList logic roughly same way for our purpose
  // but strictly speaking FileList is what we get from <input> and Drop (files property)
  const fileList = files instanceof FileList ? files : (files as any); 

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    entries.push({
      path: file.webkitRelativePath || file.name,
      text: () =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file '${file.name}': ${reader.error?.message || 'Unknown error'}`));
          reader.readAsText(file);
        }),
    });
  }
  return entries;
};

export const createFileEntriesFromZip = async (zipFile: File): Promise<FileEntry[]> => {
  const zip = await JSZip.loadAsync(zipFile);
  const entries: FileEntry[] = [];
  
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      entries.push({
        path: relativePath,
        text: () => zipEntry.async('string'),
      });
    }
  });
  
  return entries;
};
