
import React, { useState } from 'react';
import { Search, FolderGit2, MessageSquare, Download, Copy, Check, Clock, Hash, ChevronDown, ChevronRight, History, PanelLeftOpen, ArrowLeft, AlertCircle, Activity } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { formatDate } from '../../../shared/utils';
import { SessionSummary, ClaudeEvent } from '../../../types';
import { EventRow } from './EventRow';

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
    const roleColor = session.storyRole === 'system' 
        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
        : session.storyRole === 'code-activity'
        ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800'
        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800';

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
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}>
                            {session.storyRole}
                        </span>
                        {session.storyRole === 'system' && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                <AlertCircle size={10} /> Safe to ignore
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 break-all" title={session.display}>{session.display}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(session.timestamp)}</span>
                        <span className="flex items-center gap-1 truncate max-w-[200px]" title={session.primaryProjectPath || 'Unknown'}>
                            <FolderGit2 size={12} /> {session.primaryProjectPath || t('projects.groups.unknown')}
                        </span>
                        <span className="flex items-center gap-1"><Hash size={12} /> {session.id.slice(0,8)}</span>
                        
                        {session.totalTokens > 0 && (
                            <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{session.totalTokens.toLocaleString()} {t('sessions.tokens')}</span>
                        )}
                    </div>

                    {/* Path History Dropdown */}
                    {pathUsages.length > 0 && (
                        <div className="mt-2">
                                <div 
                                className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-400 cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-300 w-fit"
                                onClick={() => setShowPaths(!showPaths)}
                                >
                                <History size={10} />
                                <span>{t('sessions.trackedLocations')} ({pathUsages.length})</span>
                                {showPaths ? <ChevronDown size={10}/> : <ChevronRight size={10}/>}
                                </div>
                                {showPaths && (
                                    <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-950/50 rounded border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1 max-h-32 overflow-y-auto">
                                        {pathUsages.map((usage, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                                                <span className="truncate mr-4" title={usage.path}>{usage.path}</span>
                                                <span className="shrink-0 text-[10px] opacity-70">{usage.messageCount} {t('sidebar.items')}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
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

    const renderTimeline = () => (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth">
            
            {/* Start of Timeline Marker */}
            <div className="flex items-center justify-center gap-3 opacity-50 mb-8">
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Start of Session</span>
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
            </div>

            {events.length > 0 ? (
                <div className="w-full space-y-1">
                    {events.map((event, idx) => (
                        <EventRow 
                            key={event.uuid || idx} 
                            event={event} 
                            query={query} 
                            index={idx} 
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                    {t('sessions.eventCount')}: 0
                </div>
            )}

             {/* End of Timeline Marker */}
             <div className="flex items-center justify-center gap-3 opacity-30 mt-8 mb-4">
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">End of Session</span>
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
            </div>
            
            {/* Optional System Stats Footer */}
            {session.storyRole === 'system' && (
                <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
                    <Activity size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="mb-2 font-medium">{t('sessions.systemView.description')}</p>
                    <p className="opacity-75">{t('sessions.systemView.safeToIgnore')}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden transition-colors min-w-0">
             {renderHeader()}
             {renderTimeline()}
        </div>
    );
};
