
import React, { useMemo, useLayoutEffect, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useData } from '../../../app/DataContext';
import { Activity, ArrowLeft, FolderSearch } from 'lucide-react';
import { QueryTimelineList } from './QueryTimelineList';
import { selectProjectTimeline, ProjectTurn } from '../../../model/selectors/projectTimeline';
import { selectProjectIdentities, buildUniqueProjectDisplayNames } from '../../../model/selectors/projectIdentity';

// Extended type to support merged state in UI
export type ProjectTurnWithMerge = ProjectTurn & {
  mergedToolResultCount?: number;
};

export const ProjectTimelineHomePage: React.FC = () => {
  const { t } = useI18n();
  const { data } = useData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 1. Get Context
  const projectId = searchParams.get('projectId');
  
  // 2. Get Project Display Info
  const projectIdentities = useMemo(() => selectProjectIdentities(data), [data]);
  const displayNames = useMemo(() => buildUniqueProjectDisplayNames(projectIdentities), [projectIdentities]);
  
  const currentProject = useMemo(() => 
    projectId ? projectIdentities.find(p => p.id === projectId) : null, 
  [projectId, projectIdentities]);

  const displayName = currentProject 
    ? (displayNames.get(currentProject.id) || currentProject.canonicalPath.split('/').pop() || currentProject.id)
    : t('common.unknown');

  // 3. Get Raw Timeline Data
  const rawBlocks = useMemo(() => {
      if (!projectId) return [];
      return selectProjectTimeline(data, projectId);
  }, [data, projectId]);

  // 4. Merge "Tool Result Only" Blocks (UI Layer Merging)
  const blocks = useMemo(() => {
      const merged: ProjectTurnWithMerge[] = [];
      let current: ProjectTurnWithMerge | null = null;

      for (const block of rawBlocks) {
          // Identify Tool Result Only: Empty user text, usually marked by specific placeholder
          const isToolResultOnly = block.userQuery === '(Complex Input/Tool Result Only)';

          if (isToolResultOnly) {
              if (current) {
                  // Merge actions (Evidence)
                  current.actions = [...current.actions, ...block.actions];
                  
                  // Merge contextEvents if present
                  if (block.contextEvents && block.contextEvents.length > 0) {
                      current.contextEvents = [...current.contextEvents, ...block.contextEvents];
                  }

                  // Merge reply preview if present (Assistant reaction to tool)
                  if (block.replyPreview) {
                      if (current.replyPreview) {
                          current.replyPreview += '\n\n---\n\n' + block.replyPreview;
                      } else {
                          current.replyPreview = block.replyPreview;
                      }
                  }
                  
                  // Merge thinking if present
                  if (block.thinkingPreview) {
                       if (current.thinkingPreview) {
                           current.thinkingPreview += '\n\n' + block.thinkingPreview;
                       } else {
                           current.thinkingPreview = block.thinkingPreview;
                       }
                  }

                  current.mergedToolResultCount = (current.mergedToolResultCount || 0) + 1;
              } else {
                  // Orphan case (start of list): keep it but mark it
                  merged.push({ ...block, mergedToolResultCount: 0 });
              }
          } else {
              // Real Turn: Push as new card
              const newBlock = { ...block, mergedToolResultCount: 0 };
              merged.push(newBlock);
              current = newBlock;
          }
      }
      return merged;
  }, [rawBlocks]);

  // 5. Scroll Logic State Machine
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollModeRef = useRef<'autoBottom' | 'user'>('autoBottom');
  const lastScrollHeightRef = useRef<number>(0);
  const lastClientHeightRef = useRef<number>(0);
  const prevProjectIdRef = useRef<string | null>(projectId);
  const BOTTOM_THRESHOLD = 64;

  // Logic 1: Initial Jump / Data Change / Project Switch
  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const isProjectSwitch = prevProjectIdRef.current !== projectId;
    prevProjectIdRef.current = projectId;

    if (isProjectSwitch) {
      scrollModeRef.current = 'autoBottom';
    }

    const { scrollHeight, clientHeight } = el;
    lastScrollHeightRef.current = scrollHeight;
    lastClientHeightRef.current = clientHeight;

    if (scrollModeRef.current === 'autoBottom') {
      el.scrollTop = Math.max(scrollHeight - clientHeight, 0);
    }
  }, [projectId, blocks.length]);

  // Logic 2: Scroll Event Listener
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

      if (scrollModeRef.current === 'autoBottom' && distanceToBottom > BOTTOM_THRESHOLD) {
        scrollModeRef.current = 'user';
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [projectId]);

  // Logic 3: ResizeObserver
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const target = entry.target as HTMLDivElement;

      const newScrollHeight = target.scrollHeight;
      const newClientHeight = target.clientHeight;
      
      const oldScrollHeight = lastScrollHeightRef.current || 0;
      // const oldClientHeight = lastClientHeightRef.current || newClientHeight;
      
      const delta = newScrollHeight - oldScrollHeight;

      if (delta > 0 && scrollModeRef.current === 'autoBottom') {
        const prevMaxScrollTop = Math.max(oldScrollHeight - newClientHeight, 0);
        const distanceToBottomBefore = prevMaxScrollTop - target.scrollTop;

        if (distanceToBottomBefore <= BOTTOM_THRESHOLD) {
            target.scrollTop = Math.max(newScrollHeight - newClientHeight, 0);
        }
      }

      lastScrollHeightRef.current = newScrollHeight;
      lastClientHeightRef.current = newClientHeight;
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [projectId]);


  const handleBack = () => {
      navigate('/project-list');
  };

  if (!projectId) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-950 text-slate-400">
            <FolderSearch size={48} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No Project Selected</p>
            <button 
                onClick={handleBack}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center gap-1"
            >
                <ArrowLeft size={16} /> Go to Project List
            </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* 1. Header */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-10 shadow-sm">
         <div className="flex items-center gap-4 min-w-0">
            <button 
                onClick={handleBack}
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
