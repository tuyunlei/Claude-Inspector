import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../../app/DataContext';
import { FileTreeNode } from '../../../model/files';
import { ProjectStats } from '../../../model/projects';
import { cn } from '../../../utils/utils';
import { useI18n } from '../../i18n';
import { FolderOpen, Info, AlertOctagon, Folder } from 'lucide-react';
import { selectProjectFileTree, selectFileMap } from '../../../model/selectors/files';
import { TreeNode, getKindIcon, getKindColor } from '../../components/structure/TreeNode';
import { FileContentPreview } from '../../components/structure/FileContentPreview';
import { DirectoryStats } from '../../components/structure/DirectoryStats';

interface ProjectFilesViewProps {
    project: ProjectStats;
}

export const ProjectFilesView: React.FC<ProjectFilesViewProps> = ({ project }) => {
  const { data } = useData();
  const { t } = useI18n();
  
  // Use project-scoped file tree (re-rooted)
  const fileTree = useMemo(() => 
    selectProjectFileTree(data, project.id), 
  [data, project.id]);

  const fileMap = selectFileMap(data);
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);

  useEffect(() => {
      // Default select the first file in the list if nothing selected
      if (!selectedNode && fileTree) {
          const firstChild = fileTree.children?.[0];
          if (firstChild) {
              setSelectedNode(firstChild);
          } else {
              // Fallback to the root itself if empty
              setSelectedNode(fileTree);
          }
      }
  }, [fileTree, selectedNode]);

  if (!fileTree) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <FolderOpen size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">{t('structure.noProjectFiles')}</p>
            <p className="text-sm mt-2 opacity-70 max-w-sm text-center">
                {t('structure.projectFilesDesc')}
            </p>
        </div>
      );
  }

  const getMeta = (node: FileTreeNode) => {
      let key: string = node.kind;
      if (node.isDir && key === 'other') key = 'folder';
      const label = t(`structure.kinds.${key}.label`);
      const description = t(`structure.kinds.${key}.description`);
      const match = t(`structure.kinds.${key}.match`);
      const sensitive = node.kind === 'credentials';
      return { label, description, match, sensitive };
  };

  const meta = selectedNode ? getMeta(selectedNode) : null;
  const Icon = selectedNode ? getKindIcon(selectedNode.kind, selectedNode.isDir) : Folder;

  return (
    <div className="flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar: Tree - Matched width and styles with GlobalFilesPage */}
      <div className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto flex flex-col transition-colors shrink-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <FolderOpen size={18} className="text-orange-600"/>
            {t('structure.projectFilesTitle')}
        </div>
        <div className="py-2">
            {/* Render children directly to hide the container folder (re-rooting UI) */}
            {fileTree.children && fileTree.children.length > 0 ? (
                fileTree.children.map(child => (
                    <TreeNode 
                        key={child.path} 
                        node={child} 
                        depth={0} 
                        selectedPath={selectedNode?.path || null} 
                        onSelect={setSelectedNode} 
                    />
                ))
            ) : (
                <div className="px-4 text-sm text-slate-400 italic">{t('structure.emptyDir')}</div>
            )}
        </div>
      </div>

      {/* Main Content: Details */}
      <div className="flex-1 overflow-y-auto p-8 transition-colors">
         {selectedNode && meta ? (
             <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm", getKindColor(selectedNode.kind))}>
                        <Icon size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 break-all">{selectedNode.name || 'Root'}</h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                                 {meta.label}
                             </span>
                             <span className="text-slate-400 dark:text-slate-500 text-sm font-mono">{selectedNode.path || '/'}</span>
                        </div>
                    </div>
                </div>

                {/* Description Box */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                         <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{meta.label}</h3>
                            {meta.match && (
                                <div className="text-[10px] bg-slate-100 dark:bg-slate-750 text-slate-500 dark:text-slate-400 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 font-mono flex items-center gap-1">
                                    <Info size={10} />
                                    {t('structure.matchRule')}: {meta.match}
                                </div>
                            )}
                         </div>
                        
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{meta.description}</p>
                        
                        {meta.sensitive && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded border border-red-100 dark:border-red-900 w-fit">
                                <AlertOctagon size={14} />
                                {t('structure.sensitive')}
                            </div>
                        )}
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
                        <FileContentPreview node={selectedNode} fileMap={fileMap} sensitive={meta.sensitive} />
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