
import React, { useState } from 'react';
import { useSessionController, DateRangeOption } from '../../sessions/hooks/useSessionController';
import { SessionSidebar } from '../../sessions/components/SessionSidebar';
import { SessionDetail } from '../../sessions/components/SessionDetail';
import { cn } from '../../../shared/utils';
import { ProjectStats } from '../../../types';
import { useI18n } from '../../../shared/i18n';
import { PanelLeftOpen, Calendar } from 'lucide-react';

interface ProjectHistoryViewProps {
    project: ProjectStats;
}

export const ProjectHistoryView: React.FC<ProjectHistoryViewProps> = ({ project }) => {
  const { t } = useI18n();
  const { 
      filteredSessions, 
      filter, 
      setFilter, 
      selectedSessionId, 
      setSelectedSessionId,
      selectedSession,
      renderEvents,
      inSessionQuery,
      setInSessionQuery,
      handleCopy,
      handleDownload,
      copied,
      viewMode,
      setViewMode,
      dateRange,
      setDateRange
  } = useSessionController({ initialProjectId: project.id });

  const [isListVisible, setIsListVisible] = useState(true);

  // Mobile View Logic
  const isDetailView = !!selectedSessionId;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Project Scoped Filter Bar - Aligned with Global History Page */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center justify-between gap-4 z-20 shadow-sm">
             <div className="flex items-center gap-4">
                 <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 hidden md:block whitespace-nowrap">
                     {t('history.title')}
                 </h1>
                 <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                 
                 {/* Time Filter */}
                 <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400 shrink-0" />
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                        className="bg-slate-50 dark:bg-slate-800 border-none text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 py-1.5 pl-2 pr-8 outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
                    >
                        <option value="all">{t('history.ranges.all')}</option>
                        <option value="7d">{t('history.ranges.7d')}</option>
                        <option value="30d">{t('history.ranges.30d')}</option>
                    </select>
                 </div>
             </div>
             
             <div className="text-xs text-slate-400 font-mono hidden md:block">
                {filteredSessions.length} {t('common.sessions')}
             </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
            {/* Sidebar (List) */}
            <div className={cn(
                "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-10",
                isDetailView ? "hidden md:flex" : "flex w-full md:w-auto",
                isListVisible ? "md:w-80 lg:w-96" : "md:w-0 md:overflow-hidden md:border-none"
            )}>
                <SessionSidebar 
                    sessions={filteredSessions}
                    filter={filter}
                    onFilterChange={setFilter}
                    selectedId={selectedSessionId}
                    onSelect={setSelectedSessionId}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onClose={() => setIsListVisible(false)}
                    className="h-full"
                />
            </div>
            
            {/* Detail Area */}
            <div className={cn(
                "flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-slate-950",
                !isDetailView ? "hidden md:flex" : "flex"
            )}>
                {!isListVisible && !selectedSessionId && (
                    <button 
                        onClick={() => setIsListVisible(true)}
                        className="hidden md:flex absolute top-4 left-4 z-20 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Show List"
                    >
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                <SessionDetail 
                    session={selectedSession}
                    events={renderEvents}
                    query={inSessionQuery}
                    onQueryChange={setInSessionQuery}
                    onCopy={handleCopy}
                    onDownload={handleDownload}
                    isCopied={copied}
                    onBack={() => setSelectedSessionId(null)}
                    onExpandList={!isListVisible ? () => setIsListVisible(true) : undefined}
                />
            </div>
        </div>
    </div>
  );
};
