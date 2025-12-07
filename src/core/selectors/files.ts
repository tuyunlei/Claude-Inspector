
import { DataStore } from '../domain/datastore';
import { FileTreeNode, FileEntry } from '../domain/files';

export const selectFileTree = (data: DataStore): FileTreeNode | undefined => {
  return data.fileTree;
};

export const selectFileMap = (data: DataStore): Map<string, FileEntry> | undefined => {
  return data.fileMap;
};
