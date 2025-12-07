import React, { useMemo, useState } from 'react';
import { Search, FolderGit2, MessageSquare, Download, Copy, Check, Clock, Hash, FileClock, AlertCircle, FileText, ChevronDown, ChevronRight, History, Terminal, Activity, ArrowLeft, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { formatDate } from '../../../shared/utils';
import { SessionSummary, ClaudeEvent } from '../../../types';
import { ChatBubble } from './ChatBubble';

interface SessionDetailProps {
    session: SessionSummary | undefined;
    events: ClaudeEvent[];
    query: string;
    onQueryChange: (val: string) => void;
    onCopy: () => void;
    onDownload: () => void;
    isCopied: boolean;
    onBack?: () => void;
    onExpandList?: () => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({ 
    session, events, query, onQueryChange, onCopy, onDownload, isCopied, onBack, onExpandList
}) => {
    const { t } = useI18n();
    const [showPaths, setShowPaths] = useState(false);

    // Derived State
    const { chatEvents, fileHistoryEvents, snapshotFiles } = useMemo(() => {
        const chat = events.filter(e => e.type === 'user' || e.type === 'assistant');
        const history = events.filter(e => e.type === 'file-history-snapshot');
        
        // Extract unique files touched for Code Activity View
        const files = new Set<string>();
        history.forEach(e => {
            const snapshot = e.raw?.snapshot;
            if (snapshot?.trackedFileBackups) {
                Object.keys(snapshot.trackedFileBackups).forEach(f => files.add(f));
            }
        });

        return { chatEvents: chat, fileHistoryEvents: history, snapshotFiles: Array.from(files) };
    }, [events]);

    if (!session) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-4 text-center bg-slate-50 dark:bg-slate-950 relative">
                 {/* Expand Button for Empty State */}
                 {onExpandList && (
                    <button 
                        onClick={onExpandList} 
                        className="hidden md:flex absolute top-4 left-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Show List"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p>{t('sessions.selectSession')}</p>
            </div>
        );
    }

    const pathUsages = session.pathUsages || [];
    const isCodeView = session.storyRole === 'code-activity';
    const isSystemView = session.storyRole === 'system';

    // -- RENDER HELPERS --

    const renderHeader = () => (
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row xl:items-start justify-between gap-4 shadow-sm z-10 shrink-0">
            <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Mobile Back Button */}
                {onBack && (
                    <button 
                        onClick={onBack} 
                        className="md:hidden p-1.5 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                
                {/* Desktop Expand Button (only if passed) */}
                {onExpandList && (
                    <button 
                        onClick={onExpandList} 
                        className="hidden md:flex p-1.5 -ml-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        title="Show List"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 break-all" title={session.display}>{session.display}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(session.timestamp)}</span>
                        <span className="flex items-center gap-1 truncate max-w-[200px]" title={session.primaryProjectPath || 'Unknown'}>
                            <FolderGit2 size={12} /> {session.primaryProjectPath || 'Unknown Project'}
                        </span>
                        <span className="flex items-center gap-1"><Hash size={12} /> {session.id.slice(0,8)}</span>
                        
                        {!isSystemView && !isCodeView && (
                            <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{session.totalTokens.toLocaleString()} {t('sessions.tokens')}</span>
                        )}
                        
                        <span className={`px-1.5 rounded font-medium capitalize 
                            ${isSystemView ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 
                            isCodeView ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 
                            'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                            {session.storyRole}
                        </span>
                    </div>

                    {/* Path History Dropdown */}
                    {pathUsages.length > 0 && (
                        <div className="mt-2">
                                <div 
                                className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400 cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-300 w-fit"
                                onClick={() => setShowPaths(!showPaths)}
                                >
                                <History size={10} />
                                <span>Tracked Locations ({pathUsages.length})</span>
                                {showPaths ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                </div>
                                {showPaths && (
                                    <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                                        {pathUsages.map((usage, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                                <span className="truncate mr-4" title={usage.path}>{usage.path}</span>
                                                <span className="shrink-0 text-[10px] opacity-70">{usage.messageCount} items</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
                {!isSystemView && !isCodeView && (
                    <div className="relative group">
                        <Search className="absolute left-2.5 top-2 text-slate-400 group-focus-within:text-orange-500" size={14} />
                        <input 
                            type="text"
                            placeholder={t('sessions.searchInSession')}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            className="w-full sm:w-40 xl:w-56 pl-8 pr-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-md focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                )}
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                <button 
                    onClick={onCopy}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    title={t('sessions.copyMarkdown')}
                >
                    {isCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
                    <button 
                    onClick={onDownload}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                    title={t('sessions.exportMarkdown')}
                >
                    <Download size={18} />
                </button>
            </div>
        </div>
    );

    const renderChatView = () => (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 scroll-smooth space-y-8">
            {/* Chat Timeline */}
            <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                    <MessageSquare size={14} />
                    {t('sessions.chatTimeline')}
                </div>
                {chatEvents.length > 0 ? (
                    <div className="w-full">
                        {chatEvents.map((event, idx) => {
                            const isFirst = idx === 0 || chatEvents[idx - 1].message?.role !== event.message?.role;
                            return (
                                <ChatBubble 
                                    key={event.uuid || idx} 
                                    event={event} 
                                    query={query} 
                                    index={idx} 
                                    isFirstInSequence={isFirst}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        {t('sessions.noChatEvents')}
                    </div>
                )}
            </div>

            {/* File Timeline (Secondary in Chat View) */}
            {fileHistoryEvents.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                        <FileClock size={14} />
                        {t('sessions.fileTimeline')}
                    </div>
                    {renderFileEvents(fileHistoryEvents)}
                </div>
            )}
        </div>
    );

    const renderCodeView = () => (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 scroll-smooth space-y-8">
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                    <Terminal size={32} className="text-purple-500 mt-1" />
                    <div>
                        <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-2">{t('sessions.codeActivity.title')}</h3>
                        <p className="text-sm text-purple-800 dark:text-purple-200 mb-4 opacity-80">
                             This session contains recorded file history snapshots but no conversation messages. 
                             This usually happens when using CLI commands that modify files without direct chat interaction (e.g. undo/rewind/checkout).
                        </p>
                        
                        <div className="flex flex-col gap-2">
                             <div className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                                 {t('sessions.codeActivity.filesTouched')} ({snapshotFiles.length})
                             </div>
                             <div className="flex flex-wrap gap-2">
                                 {snapshotFiles.map((f, i) => (
                                     <span key={i} className="px-2 py-1 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-800 text-xs font-mono text-slate-700 dark:text-slate-300">
                                         {f}
                                     </span>
                                 ))}
                                 {snapshotFiles.length === 0 && <span className="text-xs italic opacity-50">No files listed in snapshots.</span>}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                    <FileClock size={14} />
                    {t('sessions.codeActivity.timeline')}
                </div>
                {fileHistoryEvents.length > 0 ? renderFileEvents(fileHistoryEvents) : (
                    <div className="text-center py-8 text-slate-400 text-sm italic">{t('sessions.codeActivity.empty')}</div>
                )}
            </div>
        </div>
    );

    const renderSystemView = () => (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 flex flex-col items-center">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center shadow-sm">
                 <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                     <Activity size={32} className="text-slate-400" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{t('sessions.systemView.title')}</h3>
                 <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                     {t('sessions.systemView.description')}
                 </p>
                 <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-4 inline-flex items-center gap-3 text-sm text-green-800 dark:text-green-300">
                     <Check size={16} />
                     {t('sessions.systemView.safeToIgnore')}
                 </div>

                 <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left">
                     <div className="text-xs font-mono text-slate-400 mb-2">RAW EVENT STATS</div>
                     <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                         <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 py-1">
                             <span>Events</span>
                             <span className="font-mono">{session?.messageCount}</span>
                         </div>
                         <div className="flex justify-between border-b border-slate-50 dark:border-slate-800 py-1">
                             <span>Duration</span>
                             <span className="font-mono">{(session?.events.length && session.events.length > 1) 
                                 ? ((new Date(session.events[session.events.length-1].timestamp).getTime() - new Date(session.events[0].timestamp).getTime()) / 1000).toFixed(2) + 's' 
                                 : '0s'}
                             </span>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
    );

    // Shared Helper
    const renderFileEvents = (list: ClaudeEvent[]) => (
        <div className="space-y-4">
            {list.map((event, idx) => {
                const snapshot = event.raw?.snapshot;
                const fileCount = snapshot?.trackedFileBackups ? Object.keys(snapshot.trackedFileBackups).length : 0;
                const time = event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '';
                
                return (
                    <div key={event.uuid || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm relative group">
                            <div className="absolute top-4 right-4 text-xs text-slate-400 font-mono">{time}</div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1">{t('sessions.fileSnapshot')}</h4>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        {fileCount} {t('sessions.trackedFiles')}
                                    </div>
                                    <details className="group/details">
                                        <summary className="text-[10px] text-slate-400 hover:text-orange-500 cursor-pointer select-none flex items-center gap-1 transition-colors w-fit">
                                            {t('sessions.viewRawSnapshot')}
                                        </summary>
                                        <pre className="mt-2 p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-60 overflow-y-auto">
                                            {JSON.stringify(snapshot, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden transition-colors min-w-0">
             {renderHeader()}
             {isCodeView ? renderCodeView() : isSystemView ? renderSystemView() : renderChatView()}
        </div>
    );
};