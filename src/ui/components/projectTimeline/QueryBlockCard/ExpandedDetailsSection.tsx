
import React from 'react';
import { useI18n } from '../../../i18n';
import { cn } from '../../../../lib/utils';
import { Terminal, Lightbulb, MessageSquare, CheckCircle2, Filter, Archive, FolderGit2, Shield } from 'lucide-react';
import { ProjectTurn } from '../../../../services/selectors/projectTimeline/types';
import { TimelineAction } from '../../../../services/selectors/projectTimeline/types';
import { SimpleTextPreview } from './SimpleTextPreview';
import { PayloadViewer } from './PayloadViewer';

interface ExpandedDetailsSectionProps {
    block: ProjectTurn;
    filteredActions: TimelineAction[];
    evidenceFilter: 'all' | 'files' | 'tools' | 'errors';
    onFilterChange: (filter: 'all' | 'files' | 'tools' | 'errors') => void;
}

export const ExpandedDetailsSection: React.FC<ExpandedDetailsSectionProps> = ({ 
    block, 
    filteredActions, 
    evidenceFilter, 
    onFilterChange 
}) => {
    const { t } = useI18n();
    const hasContextEvents = block.contextEvents && block.contextEvents.length > 0;

    return (
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
                                onClick={() => onFilterChange(f)}
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
    );
};