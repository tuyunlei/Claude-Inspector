import React, { useState, useMemo } from 'react';
import { useI18n } from '../../../i18n';
import { MessageSquare, AlertTriangle, Eye, EyeOff, Archive, Info } from 'lucide-react';
import { ProjectTurn } from '../../../../model/selectors/projectTimeline/types';
import { EvidenceBadgeList } from '../EvidenceBadgeList';

import { MarkdownPreviewText } from './MarkdownPreviewText';
import { GuardrailBadge } from './GuardrailBadge';
import { analyzeEvidence, convertToEvidenceItems } from './helpers';
import { ExpandedDetailsSection } from './ExpandedDetailsSection';

interface QueryBlockCardProps {
  block: ProjectTurn;
}

export const QueryBlockCard: React.FC<QueryBlockCardProps> = ({ block }) => {
  const { t } = useI18n();
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'files' | 'tools' | 'errors'>('all');

  // Analysis
  const stats = useMemo(() => analyzeEvidence(block.actions), [block.actions]);
  
  // Data prep for Badge Lists
  const writeItems = useMemo(() => convertToEvidenceItems(stats.changedFilesMap, 'write'), [stats]);
  const readItems = useMemo(() => convertToEvidenceItems(stats.readFilesMap, 'read'), [stats]);
  const toolItems = useMemo(() => convertToEvidenceItems(stats.toolCountsMap, 'tool'), [stats]);

  const filteredActions = useMemo(() => {
      if (evidenceFilter === 'all') return block.actions;
      return block.actions.filter(a => {
          if (evidenceFilter === 'errors') return a.isError;
          if (evidenceFilter === 'tools') return a.kind === 'tool' || a.kind === 'subagent' || a.kind === 'tool_result';
          if (evidenceFilter === 'files') return a.kind === 'snapshot' || (a.kind === 'tool' && (a.payload?.path || a.payload?.file));
          return true;
      });
  }, [block.actions, evidenceFilter]);

  const hasFiles = writeItems.length > 0 || readItems.length > 0;
  const hasTools = toolItems.length > 0;
  const hasContextEvents = block.contextEvents && block.contextEvents.length > 0;
  const isSlashCommand = block.userQuery.trim().startsWith('/');

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
      
      {/* 1. Default State */}
      <div className="p-4 md:p-5 pb-3">
         {/* Meta Header */}
         <div className="flex justify-between items-start gap-4 mb-2">
             <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                 <span className="font-bold text-slate-500 dark:text-slate-400">{block.timestamp}</span>
                 {block.queryNumber && <span className="opacity-30">#{block.queryNumber}</span>}
                 {isSlashCommand && (
                     <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                         Command
                     </span>
                 )}
             </div>
             <div className="flex items-center gap-2">
                 {/* Guardrails (Evidence Badge) */}
                 {block.guardrails && block.guardrails.length > 0 && (
                     <GuardrailBadge guardrails={block.guardrails} />
                 )}
                 {hasContextEvents && (
                     <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-full text-[10px] font-medium flex items-center gap-1 border border-indigo-100 dark:border-indigo-800/50">
                         <Archive size={10} /> Context x{block.contextEvents.length}
                     </div>
                 )}
                 {stats.hasError && (
                     <div className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] font-bold flex items-center gap-1">
                         <AlertTriangle size={10} /> Error
                     </div>
                 )}
             </div>
         </div>

         {/* A. User Query Preview */}
         <div className="mb-4">
             {block.userQueryMeta?.isLongInput && (
                 <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700">
                     <span className="font-bold text-slate-500 dark:text-slate-300 uppercase">{t('timeline.longInputLabel')}</span>
                     <span>•</span>
                     <span>{block.userQueryMeta.charCount} {t('timeline.chars')}</span>
                     <span>•</span>
                     <span>{block.userQueryMeta.lineCount} {t('timeline.lines')}</span>
                 </div>
             )}
             <MarkdownPreviewText
                text={block.userQuery}
                maxHeightClass="max-h-32"
                className="mb-1"
                isCommand={isSlashCommand}
             />
         </div>

         {/* B. Assistant Reply Preview */}
         {block.replyPreview && (
             <div className="mb-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                 <MarkdownPreviewText
                    text={block.replyPreview}
                    maxHeightClass="max-h-60"
                    label={<><MessageSquare size={10}/> {t('timeline.assistantReply')}</>}
                 />
             </div>
         )}

         {/* C. Evidence Summary */}
         <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {(hasFiles || hasTools) && (
                   <div className="flex flex-col gap-3">
                        {writeItems.length > 0 && (
                            <div className="flex items-start gap-2">
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 uppercase tracking-wider w-14 text-center mt-0.5">
                                    {t('timeline.filesChanged')}
                                </span>
                                <EvidenceBadgeList items={writeItems} maxRows={3} title={t('timeline.filesChanged')} className="flex-1 min-w-0" />
                            </div>
                        )}
                        {readItems.length > 0 && (
                            <div className="flex items-start gap-2">
                                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-wider w-14 text-center mt-0.5">
                                    {t('timeline.filesRead')}
                                </span>
                                <EvidenceBadgeList items={readItems} maxRows={5} title={t('timeline.filesRead')} className="flex-1 min-w-0" />
                            </div>
                        )}
                        <div className="flex items-start gap-2">
                             <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-wider w-14 text-center mt-0.5">
                                 {t('timeline.toolsLabel')}
                             </span>
                             <div className="flex-1 min-w-0">
                                 {hasTools ? (
                                    <EvidenceBadgeList items={toolItems} maxRows={2} title={t('timeline.toolsLabel')} className="w-full" />
                                 ) : (
                                    <span className="text-[10px] text-slate-400 italic mt-0.5 block">{t('timeline.noToolsUsed')}</span>
                                 )}
                             </div>
                        </div>
                   </div>
            )}
            
            {/* System Notes (Compaction messages, etc) */}
            {block.systemNotes && block.systemNotes.length > 0 && (
                <div className="mt-1 space-y-1">
                    {block.systemNotes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 text-[10px] text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <Info size={12} className="shrink-0 mt-0.5 opacity-70" />
                            <div>{note}</div>
                        </div>
                    ))}
                </div>
            )}
         </div>
      </div>

      {/* 2. Action: Single Consolidated Details Entry */}
      <button 
        onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
      >
        {isEvidenceExpanded ? (
            <><EyeOff size={12} /> {t('timeline.collapse')} {t('timeline.detailsButton')}</>
        ) : (
            <><Eye size={12} /> {t('timeline.viewDetails')}</>
        )}
      </button>

      {/* 3. Expanded Evidence View */}
      {isEvidenceExpanded && (
          <ExpandedDetailsSection 
              block={block}
              filteredActions={filteredActions}
              evidenceFilter={evidenceFilter}
              onFilterChange={setEvidenceFilter}
          />
      )}
    </div>
  );
};