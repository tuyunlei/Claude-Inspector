
import React, { useState } from 'react';
import { useSessionController } from '../../sessions/hooks/useSessionController';
import { SessionSidebar } from '../../sessions/components/SessionSidebar';
import { SessionDetail } from '../../sessions/components/SessionDetail';
import { cn } from '../../../shared/utils';
import { ProjectStats } from '../../../types';
import { useI18n } from '../../../shared/i18n';
import { PanelLeftOpen } from 'lucide-react';

interface ProjectHistoryViewProps {
    project: ProjectStats;
}

export const ProjectHistoryView: React.FC<ProjectHistoryViewProps> = ({ project }) => {
  const { t } = useI18n();
  const { 
      filteredSessions, 
      filter, 
      setFilter, 
      projects, // needed by SessionSidebar component interface but unused in this specific view
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
      setViewMode
  } = useSessionController({ initialProjectId: project.id });

  const [isListVisible, setIsListVisible] = useState(true);

  // Mobile View Logic
  const isDetailView = !!selectedSessionId;

  return (
    <div className="flex h-full relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Sidebar (List) */}
      <div className={cn(
          "flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out z-10",
          isDetailView ? "hidden md:flex" : "flex w-full md:w-auto",
          isListVisible ? "md:w-80 lg:w-96" : "md:w-0 md:overflow-hidden md:border-none"
      )}>
        {/* We reuse SessionSidebar but we could simplify it. 
            For now, we just pass the filtered list and single project. */}
        <SessionSidebar 
            sessions={filteredSessions}
            projects={projects} // Passed but we override behavior
            filter={filter}
            onFilterChange={setFilter}
            selectedProject={project.id} // Forced to current project
            onProjectChange={(val) => { /* No-op, prevent changing project inside history view */ }}
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
  );
};
