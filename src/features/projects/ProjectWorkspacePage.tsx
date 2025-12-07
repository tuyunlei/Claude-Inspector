
import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../app/App';
import { selectProjects } from '../../core/selectors/projects';
import { useI18n } from '../../shared/i18n';
import { cn } from '../../shared/utils';
import { LayoutDashboard, History, FolderTree, CheckSquare, Settings, Globe, MonitorCog, FolderGit2 } from 'lucide-react';
import { ProjectOverviewView } from './views/ProjectOverviewView';
import { ProjectHistoryView } from './views/ProjectHistoryView';
import { ProjectFilesView } from './views/ProjectFilesView';
import { ProjectTodosView } from './views/ProjectTodosView';
import { ProjectSettingsView } from './views/ProjectSettingsView';
import { GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID } from '../../core/analytics/projects';

type WorkspaceTab = 'overview' | 'history' | 'files' | 'todos' | 'settings';

export const ProjectWorkspacePage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data } = useData();
  const { t } = useI18n();
  const projects = selectProjects(data);

  // Default tab from URL or overview
  const initialTab = (searchParams.get('tab') as WorkspaceTab) || 'overview';
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);

  // Sync tab state with URL
  useEffect(() => {
     const currentTab = searchParams.get('tab') as WorkspaceTab;
     if (currentTab && currentTab !== activeTab) {
         setActiveTab(currentTab);
     }
  }, [searchParams]);

  const handleTabChange = (tab: WorkspaceTab) => {
      setActiveTab(tab);
      setSearchParams(prev => {
          const next = new URLSearchParams(prev);
          next.set('tab', tab);
          return next;
      });
  };

  const project = projects.find(p => p.id === projectId);

  if (!project) {
      // If no project found (and data loaded), redirect to first project or showing error
      if (projects.length > 0) {
          return <Navigate to={`/project/${encodeURIComponent(projects[0].id)}`} replace />;
      }
      return <div className="p-8 text-center text-slate-500">No project found. Please upload logs.</div>;
  }

  const getProjectIcon = (type: string) => {
    switch(type) {
        case 'global': return <Globe size={24} className="text-blue-500" />;
        case 'system': return <MonitorCog size={24} className="text-slate-500" />;
        default: return <FolderGit2 size={24} className="text-orange-600" />;
    }
  };

  const tabs = [
    { id: 'overview', label: t('workspace.tabs.overview'), icon: LayoutDashboard },
    { id: 'history', label: t('workspace.tabs.history'), icon: History },
    { id: 'files', label: t('workspace.tabs.files'), icon: FolderTree },
    { id: 'todos', label: t('workspace.tabs.todos'), icon: CheckSquare },
    { id: 'settings', label: t('workspace.tabs.settings'), icon: Settings },
  ] as const;

  const getProjectLabel = (p: any) => {
    if (p.id === GLOBAL_SESSIONS_ID) return t('projects.groups.globalTitle');
    if (p.id === SYSTEM_SESSIONS_ID) return t('projects.groups.systemTitle');
    return p.name;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Project Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-4 mb-6">
             <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                 {getProjectIcon(project.groupType)}
             </div>
             <div>
                 <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{getProjectLabel(project)}</h1>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1 opacity-80">{project.id}</p>
             </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
              {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={cn(
                        "flex items-center gap-2 pb-4 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        activeTab === tab.id
                            ? "border-orange-500 text-orange-600 dark:text-orange-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    )}
                  >
                      <tab.icon size={16} />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && <ProjectOverviewView project={project} />}
          {activeTab === 'history' && <ProjectHistoryView project={project} />}
          {activeTab === 'files' && <ProjectFilesView project={project} />}
          {activeTab === 'todos' && <ProjectTodosView project={project} />}
          {activeTab === 'settings' && <ProjectSettingsView project={project} />}
      </div>
    </div>
  );
};
