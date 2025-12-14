
import React from 'react';
import { FolderSearch, AlertTriangle, ChevronRight } from 'lucide-react';
import { ProjectIdentity } from '../../../model/projects';
import { formatDate } from '../../../lib/utils';

interface ProjectListViewProps {
    projectIdentities: ProjectIdentity[];
    displayNames: Map<string, string>;
    onSelectProject: (id: string) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({ projectIdentities, displayNames, onSelectProject }) => {
    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
             <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0 z-10 shadow-sm">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mr-3">
                    Projects
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-3">
                    {projectIdentities.length > 0 ? (
                        projectIdentities.map(p => {
                             const name = displayNames.get(p.id) || p.id;
                             const isLowConfidence = p.pathConfidence === 'low';
                             return (
                                <div 
                                    key={p.id}
                                    onClick={() => onSelectProject(p.id)}
                                    className="group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 cursor-pointer transition-all"
                                >
                                    <div className="flex flex-col min-w-0 pr-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                                {name}
                                            </h3>
                                            {isLowConfidence && (
                                                <div title="Path guessed from directory name" className="flex items-center">
                                                    <AlertTriangle size={16} className="text-amber-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono truncate" title={p.canonicalPath}>
                                            {p.canonicalPath}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 md:gap-8 shrink-0 text-right">
                                        <div>
                                            <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                {formatDate(p.lastActiveAt)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                {p.queryCount} messages
                                            </div>
                                        </div>
                                        <div className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                </div>
                             );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <FolderSearch size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No projects found in logs.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};