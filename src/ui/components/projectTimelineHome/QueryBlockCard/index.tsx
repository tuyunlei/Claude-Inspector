import React, { useState, useMemo } from 'react';
import { useI18n } from '../../../i18n';
import { cn } from '../../../../utils/utils';
import { Terminal, Lightbulb, MessageSquare, AlertTriangle, CheckCircle2, Eye, EyeOff, Filter, Archive, Info, FolderGit2, Shield } from 'lucide-react';
import { ProjectTurn } from '../../../../model/selectors/projectTimeline/types';
import { EvidenceBadgeList } from '../EvidenceBadgeList';

import { MarkdownPreviewText } from './MarkdownPreviewText';
import { SimpleTextPreview } from './SimpleTextPreview';
import { PayloadViewer } from './PayloadViewer';
import { GuardrailBadge } from './GuardrailBadge';
import { analyzeEvidence, convertToEvidenceItems } from './helpers';

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
          <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-top-2 duration-200">
             
             {/* A. User Full Query */}
             <div className="mb-6">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{t('timeline.queryLabel')}</div>
                 <div className="text-sm font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                     {block.userQuery}
                 </div>
                 {/* Guardrails in Details */}
                 {block.guardrails && block.guardrails.length > 0 && (
                     <div className="mt-2 space-y-1">
                         {block.guardrails.map((g, i) => (
                             <div key={i} className="flex items-start gap-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded text-xs text-blue-800 dark:text-blue-300 font-mono">
                                 <Shield size={12} className="shrink-0 mt-0.5" />
                                 {g}
                             </div>
                         ))}
                     </div>
                 )}
             </div>

             {/* B. Context Compaction Events */}
             {hasContextEvents && (
                 <div className="mb-6">
                     <div className="text-[10px] uppercase font-bold text-indigo-400 mb-2 flex items-center gap-1">
                         <Archive size={10} /> {t('timeline.contextLabel')} / {t('timeline.contextCompacted')}
                     </div>
                     <div className="space-y-2">
                         {block.contextEvents.map((ctx) => (
                             <div key={ctx.id} className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-3">
                                 <div className="flex items-center justify-between gap-2 mb-2">
                                     <div className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                         {t('timeline.contextEvent')}
                                     </div>
                                     <div className="text-[10px] text-indigo-400 dark:text-indigo-500 font-mono">
                                         {ctx.stats.chars.toLocaleString()} {t('timeline.chars')} • {ctx.stats.lines} {t('timeline.lines')} • {ctx.timestamp}
                                     </div>
                                 </div>
                                 <SimpleTextPreview
                                     text={ctx.text}
                                     maxLines={3}
                                     className="text-xs font-mono text-slate-600 dark:text-slate-400"
                                 />
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* C. Action Stream Filter */}
             {block.actions.length > 0 && (
                 <div className="flex items-center gap-2 mb-3">
                     <Filter size={12} className="text-slate-400" />
                     <div className="flex bg-white dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                         {(['all', 'tools', 'files', 'errors'] as const).map(f => (
                             <button
                                key={f}
                                onClick={() => setEvidenceFilter(f)}
                                className={cn(
                                    "px-3 py-1 rounded text-[10px] font-medium capitalize transition-all",
                                    evidenceFilter === f 
                                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                             >
                                 {f}
                             </button>
                         ))}
                     </div>
                 </div>
             )}

             {/* D. Action Stream List */}
             <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                 {filteredActions.map((action, idx) => (
                     <div key={action.id || idx} className="relative">
                         <div className={cn(
                             "absolute -left-[21px] top-2.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900",
                             action.isError ? "bg-red-500" : action.kind === 'tool' ? "bg-blue-400" : "bg-slate-300 dark:bg-slate-600"
                         )}></div>
                         
                         <div className={cn(
                             "p-3 rounded-lg border text-sm bg-white dark:bg-slate-900",
                             action.isError ? "border-red-200 dark:border-red-900/50" : "border-slate-200 dark:border-slate-800"
                         )}>
                             <div className="flex items-center justify-between gap-2 mb-1">
                                 <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                                     {action.kind === 'tool' && <Terminal size={12} className="text-blue-500" />}
                                     {action.kind === 'tool_result' && <CheckCircle2 size={12} className={action.isError ? "text-red-500" : "text-green-500"} />}
                                     {action.kind === 'snapshot' && <FolderGit2 size={12} className="text-purple-500" />}
                                     <span title={action.meta?.toolName || action.label}>
                                         {action.kind === 'tool' && action.meta?.toolName ? action.meta.toolName : action.label}
                                     </span>
                                     {action.isError && <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 rounded">Failed</span>}
                                 </div>
                                 <div className="text-[10px] font-mono text-slate-400">{action.timestamp}</div>
                             </div>

                             {action.payload && (
                                 <PayloadViewer 
                                    data={action.payload} 
                                    label={action.kind === 'tool' ? 'Args' : action.kind === 'tool_result' ? 'Result' : 'Data'} 
                                 />
                             )}
                         </div>
                     </div>
                 ))}
                 {filteredActions.length === 0 && block.actions.length > 0 && (
                     <div className="text-xs text-slate-400 italic py-2">No events match filter.</div>
                 )}
             </div>

             {/* E. Assistant Reply & Thinking */}
             {(block.replyPreview || block.thinkingPreview) && (
                 <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                     {block.thinkingPreview && (
                         <div className="mb-4">
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Lightbulb size={10}/> Thinking</div>
                            <div className="text-xs text-slate-500 italic bg-slate-100 dark:bg-slate-950 p-3 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                                {block.thinkingPreview}
                            </div>
                         </div>
                     )}
                     {block.replyPreview && (
                         <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><MessageSquare size={10}/> {t('timeline.assistantReply')}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {block.replyPreview}
                            </div>
                         </div>
                     )}
                 </div>
             )}
          </div>
      )}
    </div>
  );
};