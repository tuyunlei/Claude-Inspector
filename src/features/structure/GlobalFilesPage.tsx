import React, { useState, useEffect } from 'react';
import { useData } from '../../app/App';
import { FolderTree, FolderOpen, Info } from 'lucide-react';
import { selectFileTree, selectFileMap } from '../../core/selectors/files';
import { TreeNode, getKindIcon, getKindColor } from '../structure/components/TreeNode';
import { FileContentPreview } from '../structure/components/FileContentPreview';
import { DirectoryStats } from '../structure/components/DirectoryStats';
import { FileTreeNode } from '../../types';
import { useI18n } from '../../shared/i18n';
import { cn } from '../../shared/utils';

export const GlobalFilesPage: React.FC = () => {
  const { data } = useData();
  const { t } = useI18n();
  const fileTree = selectFileTree(data);
  const fileMap = selectFileMap(data);
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);

  useEffect(() => {
      // Default select the root if nothing selected
      if (!selectedNode && fileTree) {
          setSelectedNode(fileTree);
      }
  }, [fileTree, selectedNode]);

  if (!fileTree) {
      return <div className="p-8 text-center text-slate-400">No file structure available.</div>;
  }

  const Icon = selectedNode ? getKindIcon(selectedNode.kind, selectedNode.isDir) : FolderOpen;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar: Tree */}
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col transition-colors shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FolderTree size={18} className="text-orange-600"/>
            All Files (~/.claude)
        </div>
        <div className="py-2">
            <TreeNode 
                node={fileTree} 
                depth={0} 
                selectedPath={selectedNode?.path || null} 
                onSelect={setSelectedNode} 
            />
        </div>
      </div>

      {/* Main Content: Details */}
      <div className="flex-1 overflow-y-auto p-8 transition-colors">
         {selectedNode ? (
             <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm", getKindColor(selectedNode.kind))}>
                        <Icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-all">{selectedNode.name || '~/.claude'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-slate-400 dark:text-slate-500 text-sm font-mono">{selectedNode.path || '/'}</span>
                        </div>
                    </div>
                </div>

                {/* Content or Stats */}
                {selectedNode.isDir ? (
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 uppercase tracking-wider">{t('structure.contentsOverview')}</h3>
                        <DirectoryStats node={selectedNode} />
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">{t('structure.fileContent')}</h3>
                        </div>
                        <FileContentPreview node={selectedNode} fileMap={fileMap} />
                    </div>
                )}
             </div>
         ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                 <FolderOpen size={48} className="mb-4 opacity-20" />
                 <p>{t('structure.selectFile')}</p>
             </div>
         )}
      </div>
    </div>
  );
};