
import React from 'react';
import { Search, FolderGit2, MonitorCog, History, MessageSquare, Terminal, Activity, PanelLeftClose } from 'lucide-react';
import { cn, formatDate } from '../../../shared/utils';
import { useI18n } from '../../../shared/i18n';
import { SessionSummary, SessionStoryRole } from '../../../types';
import { GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID, UNKNOWN_PROJECT_PATH } from '../../../core/analytics/projects';

interface SessionSidebarProps {
    sessions: SessionSummary[];
    filter: string;
    onFilterChange: (val: string) => void;
    selectedId: string | null;
    onSelect: (id: string) => void;
    viewMode: SessionStoryRole;
    onViewModeChange: (mode: SessionStoryRole) => void;
    className?: string;
    onClose?: () => void;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({ 
    sessions, filter, onFilterChange, selectedId, onSelect,
    viewMode, onViewModeChange, className, onClose
}) => {
    const { t } = useI18n();

    const formatTokenCount = (num: number, kind: string) => {
        if (kind === 'file-history-only') return 'N/A';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'm';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const getProjectDisplayName = (session: SessionSummary) => {
        if (session.primaryProjectId === GLOBAL_SESSIONS_ID) return t('projects.groups.globalTitle');
        if (session.primaryProjectId === SYSTEM_SESSIONS_ID) return t('projects.groups.systemTitle');
        
        const path = session.primaryProjectPath || UNKNOWN_PROJECT_PATH;
        if (path === UNKNOWN_PROJECT_PATH) return t('common.unknown');
        
        // Show last two parts of path for clarity
        return path.split('/').slice(-2).join('/');
    };

    // Defense against raw UUIDs
    const isUuidLike = (str: string): boolean => {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };

    const getSafeTitle = (session: SessionSummary) => {
        const raw = session.display;
        if (isUuidLike(raw)) {
            return `${t('common.untitled')} (${raw.slice(0, 8)})`;
        }
        return raw;
    };

    return (
        <div className={cn("flex flex-col h-full w-full", className)}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900 shrink-0">
                
                {/* View Mode Tabs */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        {[
                            { id: 'chat', label: t('sessions.views.chat'), icon: MessageSquare },
                            { id: 'code-activity', label: t('sessions.views.code'), icon: Terminal },
                            { id: 'system', label: t('sessions.views.system'), icon: Activity }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onViewModeChange(tab.id as SessionStoryRole)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all",
                                    viewMode === tab.id 
                                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                )}
                                title={tab.label}
                            >
                                <tab.icon size={14} className="opacity-80" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="hidden md:flex p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Collapse List"
                        >
                            <PanelLeftClose size={18} />
                        </button>
                    )}
                </div>

                {/* Text Filter */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={t('sessions.searchPlaceholder')} 
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-500 transition-shadow"
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
                {sessions.map((session) => {
                    const projectDisplay = getProjectDisplayName(session);
                    const pathCount = session.pathUsages?.length || 1;
                    const safeTitle = getSafeTitle(session);

                    // Determine what detail to show based on view mode
                    let metaDetail: React.ReactNode;
                    
                    if (viewMode === 'code-activity') {
                         metaDetail = (
                            <div className="flex items-center gap-2">
                                <span>{session.fileSnapshotCount} {t('sidebar.snapshots')}</span>
                            </div>
                         );
                    } else if (viewMode === 'system') {
                         metaDetail = <span>{session.messageCount} {t('sidebar.events')}</span>;
                    } else {
                         // Chat Mode
                         metaDetail = (
                             <div className="flex items-center gap-2">
                                <span>{session.messageCount} {t('sidebar.msgs')}</span>
                                {session.totalTokens > 0 && (
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-medium">
                                        {formatTokenCount(session.totalTokens, 'chat')} {t('sessions.tok')}
                                    </span>
                                )}
                             </div>
                         );
                    }

                    return (
                        <div 
                            key={session.id} 
                            onClick={() => onSelect(session.id)}
                            className={cn(
                                "p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors",
                                selectedId === session.id 
                                    ? "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-l-orange-500" 
                                    : "border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className={cn("font-medium text-sm line-clamp-2", selectedId === session.id ? "text-orange-900 dark:text-orange-100" : "text-slate-800 dark:text-slate-200")}>
                                    {safeTitle}
                                </h4>
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                                {viewMode === 'system' ? <MonitorCog size={12} className="shrink-0"/> : <FolderGit2 size={12} className="shrink-0" />}
                                <span className="truncate" title={session.primaryProjectPath || ''}>
                                    {projectDisplay}
                                </span>
                                {pathCount > 1 && (
                                    <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded-sm text-[9px] font-mono text-slate-600 dark:text-slate-300 flex items-center" title="This session appears in multiple paths">
                                        <History size={8} className="mr-0.5" /> +{pathCount - 1}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                                <span>{formatDate(session.timestamp)}</span>
                                {metaDetail}
                            </div>
                        </div>
                    );
                })}
                {sessions.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">{t('sessions.noSessions')}</div>
                )}
            </div>
        </div>
    );
};
