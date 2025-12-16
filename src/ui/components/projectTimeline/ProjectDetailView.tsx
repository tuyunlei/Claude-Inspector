
import React, { useState, useRef, useLayoutEffect, useEffect, useMemo } from 'react';
import { ArrowLeft, Activity, History, ArrowUp } from 'lucide-react';
import { useI18n } from '../../i18n';
import { QueryTimelineList } from './QueryTimelineList';
import { ProjectTurn } from '../../../services/selectors/projectTimeline/index';
import { ProjectIdentity } from '../../../model/projects';
import { useScrollToBottom } from '../../hooks/useScrollToBottom';

interface ProjectDetailViewProps {
    projectId: string;
    displayName: string;
    currentProject: ProjectIdentity | null | undefined;
    blocks: ProjectTurn[];
    onBack: () => void;
}

const PAGE_SIZE = 20;
const LOAD_MORE_THRESHOLD_PX = 120;

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ 
    projectId, 
    displayName, 
    currentProject, 
    blocks, 
    onBack 
}) => {
    const { t } = useI18n();
    
    // -- 1. State for Pagination --
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const isLoadingMoreRef = useRef(false);
    
    // We need to capture scroll position BEFORE the DOM updates with new items
    const restoreScrollRef = useRef<{ height: number; top: number } | null>(null);

    // Reset pagination when project changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
        isLoadingMoreRef.current = false;
        restoreScrollRef.current = null;
    }, [projectId]);

    // -- 2. Compute Visible Slice --
    const totalBlocks = blocks.length;
    const hasMore = visibleCount < totalBlocks;
    
    const visibleBlocks = useMemo(() => {
        if (!hasMore) return blocks;
        const start = Math.max(0, totalBlocks - visibleCount);
        return blocks.slice(start);
    }, [blocks, visibleCount, hasMore, totalBlocks]);

    // -- 3. Scroll Handling --
    // We pass 'preventAutoScroll' to useScrollToBottom so it doesn't force us to the bottom 
    // when we are just loading older history at the top.
    const isRestoringHistory = !!restoreScrollRef.current;
    const { scrollContainerRef } = useScrollToBottom(projectId, visibleBlocks.length, { 
        preventAutoScroll: isRestoringHistory 
    });

    const triggerLoadMore = () => {
        if (!hasMore || isLoadingMoreRef.current) return;
        
        const el = scrollContainerRef.current;
        if (el) {
            isLoadingMoreRef.current = true;
            // Capture current dimensions to restore visual position later
            restoreScrollRef.current = {
                height: el.scrollHeight,
                top: el.scrollTop
            };
            
            // Increase count
            setVisibleCount(prev => Math.min(prev + PAGE_SIZE, totalBlocks));
        }
    };

    // -- 4. Scroll Restoration (The Magic) --
    useLayoutEffect(() => {
        const el = scrollContainerRef.current;
        const snapshot = restoreScrollRef.current;

        if (el && snapshot) {
            const newHeight = el.scrollHeight;
            const diff = newHeight - snapshot.height;
            
            // Adjust scrollTop so the user sees the same content relative to viewport
            el.scrollTop = snapshot.top + diff;
            
            // Cleanup
            restoreScrollRef.current = null;
            isLoadingMoreRef.current = false;
        }
    }, [visibleBlocks.length]); // Run specifically when the rendered list changes size

    // -- 5. Infinite Scroll Listener --
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        if (scrollTop < LOAD_MORE_THRESHOLD_PX && hasMore && !isLoadingMoreRef.current) {
            triggerLoadMore();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Header */}
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

        {/* Main Scrollable Area */}
        <div 
            className="flex-1 overflow-y-auto" 
            ref={scrollContainerRef}
            onScroll={handleScroll}
        >
            {/* Load More Button (Manual Trigger & Visual Indicator) */}
            {hasMore && (
                <div className="py-4 flex justify-center animate-in fade-in duration-300">
                    <button 
                        onClick={triggerLoadMore}
                        className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all text-xs font-medium text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400"
                    >
                        <History size={12} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                        <span>加载更多历史 (+{PAGE_SIZE})</span>
                        <span className="opacity-50 ml-1 font-normal">
                            ({visibleBlocks.length} / {totalBlocks})
                        </span>
                    </button>
                </div>
            )}
            
            {!hasMore && blocks.length > PAGE_SIZE && (
                 <div className="py-6 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="text-[10px] uppercase tracking-widest opacity-70">Start of History</span>
                </div>
            )}

            {visibleBlocks.length > 0 ? (
                <QueryTimelineList blocks={visibleBlocks} />
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
