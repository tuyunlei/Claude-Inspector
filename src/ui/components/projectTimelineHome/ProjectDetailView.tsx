import React from 'react';
import { ArrowLeft, Activity } from 'lucide-react';
import { useI18n } from '../../i18n';
import { QueryTimelineList } from './QueryTimelineList';
import { ProjectTurn } from '../../../model/selectors/projectTimeline/index';
import { ProjectIdentity } from '../../../model/projects';
import { useScrollToBottom } from './hooks/useScrollToBottom';

interface ProjectDetailViewProps {
    projectId: string;
    displayName: string;
    currentProject: ProjectIdentity | null | undefined;
    blocks: ProjectTurn[];
    onBack: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ 
    projectId, 
    displayName, 
    currentProject, 
    blocks, 
    onBack 
}) => {
    const { t } = useI18n();
    const { scrollContainerRef } = useScrollToBottom(projectId, blocks.length);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* 1. Header */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-4 min-w-0">
                <button 
                    onClick={onBack}
                    className="p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Back to Projects"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded text-orange-600 dark:text-orange-400">
                        <Activity size={18} />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base truncate max-w-[200px] md:max-w-md">
                                {displayName}
                            </h1>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                {t('timeline.title')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="hidden md:block text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full truncate max-w-[300px]" title={currentProject?.canonicalPath}>
                {currentProject?.canonicalPath || t('timeline.workspacePlaceholder')}
            </div>
        </div>

        {/* 2. Main Scrollable Area */}
        <div 
            className="flex-1 overflow-y-auto" 
            ref={scrollContainerRef}
        >
            {blocks.length > 0 ? (
                <QueryTimelineList blocks={blocks} />
            ) : (
                <div className="py-20 text-center text-slate-400">
                    <p>{t('history.empty')}</p>
                </div>
            )}
            
            {/* Bottom Padding */}
            <div className="h-10"></div>
        </div>
        </div>
    );
};