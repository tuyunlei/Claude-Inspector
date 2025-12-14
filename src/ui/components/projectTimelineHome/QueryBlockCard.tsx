
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useI18n } from '../../i18n';
import { cn } from '../../../utils/utils';
import {
    Terminal, Lightbulb, Box, FolderGit2,
    MessageSquare, AlertTriangle, CheckCircle2, Eye, EyeOff, Filter, Archive, Shield, Info
} from 'lucide-react';
import { ProjectTurn, TimelineAction } from '../../../model/selectors/projectTimeline';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { EvidenceBadgeList, EvidenceItem } from './EvidenceBadgeList';

interface QueryBlockCardProps {
  block: ProjectTurn;
}

// --- Helper: Heuristics for Files & Tools ---
interface EvidenceStats {
    readFilesMap: Map<string, { count: number; actions: TimelineAction[] }>;
    changedFilesMap: Map<string, { count: number; actions: TimelineAction[] }>;
    toolCountsMap: Map<string, { count: number; actions: TimelineAction[] }>;
    hasError: boolean;
}

function analyzeEvidence(actions: TimelineAction[]): EvidenceStats {
    const stats: EvidenceStats = {
        readFilesMap: new Map(),
        changedFilesMap: new Map(),
        toolCountsMap: new Map(),
        hasError: false
    };

    actions.forEach(action => {
        // 1. Error Detection
        if (action.isError) {
            stats.hasError = true;
        }

        // 2. Tool Counts
        if (action.kind === 'tool' || action.kind === 'subagent') {
            const name = action.meta?.toolName || 'unknown';
            const entry = stats.toolCountsMap.get(name) || { count: 0, actions: [] };
            entry.count++;
            entry.actions.push(action);
            stats.toolCountsMap.set(name, entry);
        }

        // 3. File Extraction (Heuristic)
        if (action.kind === 'tool' && action.payload) {
            const toolName = (action.meta?.toolName || '').toLowerCase();
            const args = action.payload;
            
            // Extract potential path from common args
            const path = args.path || args.file_path || args.file || args.filename || args.target;
            
            if (path && typeof path === 'string') {
                const isWrite = toolName.match(/write|edit|save|update|replace|patch|sed/);
                const map = isWrite ? stats.changedFilesMap : stats.readFilesMap;
                
                const entry = map.get(path) || { count: 0, actions: [] };
                entry.count++;
                entry.actions.push(action);
                map.set(path, entry);
            }
        }
    });

    return stats;
}

// --- Helper: Tool Name Compression ---
function formatToolName(name: string): string {
    const parts = name.split('__');
    if (parts.length <= 1) return name;
    
    // Source: Prioritize 2nd segment (index 1), fallback to 1st (index 0)
    const source = parts.length >= 2 ? parts[1] : parts[0];
    const action = parts[parts.length - 1];
    
    if (source === action) return action;
    return `${source} · ${action}`;
}

// --- Helper: Data Conversion for BadgeList ---
function convertToEvidenceItems(
    map: Map<string, { count: number; actions: TimelineAction[] }>, 
    type: EvidenceItem['type']
): EvidenceItem[] {
    return Array.from(map.entries()).map(([key, val]) => ({
        id: key,
        label: type === 'tool' ? formatToolName(key) : key.split('/').pop() || key,
        fullPath: key,
        count: val.count,
        type: type,
        meta: undefined
    })).sort((a, b) => b.count - a.count);
}

// --- Helper: Markdown Normalization ---
function normalizeMarkdownForPreview(text: string): string {
    if (!text) return '';
    return text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ');
}

// --- Component: Markdown Preview ---
const MarkdownPreviewText: React.FC<{
    text: string;
    maxHeightClass?: string; // e.g. 'max-h-32'
    className?: string;
    label?: React.ReactNode;
    isCommand?: boolean;
}> = ({ text, maxHeightClass = 'max-h-32', className, label, isCommand }) => {
    const processed = normalizeMarkdownForPreview(text);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (!containerRef.current) return;
            const { scrollHeight, clientHeight } = containerRef.current;
            setIsTruncated(scrollHeight > clientHeight + 1);
        };
        checkTruncation();
        const observer = new ResizeObserver(() => checkTruncation());
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [text, maxHeightClass]); 

    return (
        <div className={cn("group", className)}>
             {label && <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">{label}</div>}
             <div className={cn("relative overflow-hidden", maxHeightClass)} ref={containerRef}>
                 <div className={cn(
                     "text-sm leading-relaxed", 
                     isCommand ? "font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"
                 )}>
                     {isCommand ? (
                         // Simple text render for commands to preserve spacing/formatting exactly
                         <div className="whitespace-pre-wrap">{text}</div>
                     ) : (
                        <MarkdownRenderer
                            content={processed}
                            className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_hr]:my-2"
                        />
                     )}
                 </div>
                 {isTruncated && !isCommand && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
                 )}
             </div>
        </div>
    );
};

// --- Component: Simple Text Preview ---
const SimpleTextPreview: React.FC<{
    text: string;
    maxLines?: number;
    className?: string;
}> = ({ text, maxLines = 3, className }) => {
    return (
        <div
            className={cn("whitespace-pre-wrap overflow-hidden", className)}
            style={{
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical'
            }}
        >
            {text}
        </div>
    );
};

// --- Component: Payload Viewer ---
const PayloadViewer: React.FC<{ data: any; label?: string; maxLines?: number }> = ({ data, label, maxLines = 5 }) => {
    const [expanded, setExpanded] = useState(false);
    let content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    if (!content) return null;
    const lines = content.split('\n');
    const isLong = lines.length > maxLines;
    const preview = isLong ? lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)` : content;

    return (
        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
            {label && <div className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[10px] uppercase">{label}</div>}
            <div className="p-2 overflow-x-auto text-slate-700 dark:text-slate-300">
                <pre className="whitespace-pre-wrap break-all">{expanded ? content : preview}</pre>
            </div>
            {isLong && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="w-full text-center py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] text-slate-500 transition-colors"
                >
                    {expanded ? "Collapse" : "Show Full Payload"}
                </button>
            )}
        </div>
    );
};

// --- Component: Guardrail Badge ---
const GuardrailBadge: React.FC<{ guardrails: string[] }> = ({ guardrails }) => {
    const [show, setShow] = useState(false);
    if (!guardrails || guardrails.length === 0) return null;

    return (
        <div 
          className="relative group inline-block"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
             <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 rounded-full text-[10px] font-bold cursor-default select-none">
                 <Shield size={10} />
                 <span>Guardrail</span>
             </div>
             
             {/* Popover */}
             <div className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[300px] z-50 pointer-events-none transition-all duration-200",
                show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
             )}>
                <div className="bg-slate-900 text-slate-50 text-xs rounded-lg shadow-xl p-3 border border-slate-700 leading-tight">
                   <div className="font-bold mb-2 flex items-center gap-1.5 text-blue-300">
                       <Shield size={12} />
                       <span>System Guardrail / Caveat</span>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                       {guardrails.map((g, i) => (
                           <div key={i} className="bg-slate-950 p-2 rounded text-[10px] font-mono opacity-90 border border-slate-800">
                               {g}
                           </div>
                       ))}
                   </div>
                   <div className="mt-2 text-[10px] opacity-60 italic">
                       These messages were injected by the system to prevent recursion loops or guide model behavior.
                   </div>
                   {/* Arrow */}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                </div>
             </div>
        </div>
    );
};

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
