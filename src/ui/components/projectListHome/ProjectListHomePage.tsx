
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderSearch } from 'lucide-react';
import { useData } from '../../../app/DataContext';
import { useI18n } from '../../i18n';
import { selectProjectIdentities, buildUniqueProjectDisplayNames } from '../../../model/selectors/projectIdentity';
import { ProjectRow } from './ProjectRow';
import { ProjectIdentity } from '../../../model/projects';

export const ProjectListHomePage: React.FC = () => {
  const { data } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();

  // 1. Get Unified Identities
  const projects = useMemo(() => selectProjectIdentities(data), [data]);

  // 2. Generate Display Names
  const displayNames = useMemo(() => buildUniqueProjectDisplayNames(projects), [projects]);

  const handleSelectProject = (project: ProjectIdentity) => {
    // Navigate to timeline with projectId param (using encoded ID)
    navigate(`/timeline?projectId=${encodeURIComponent(project.id)}`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* 1. Header */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 mr-3">
          {t('projectList.title')}
        </h1>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
           {t('projectList.experiment')}
        </span>
      </div>

      {/* 2. Main List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
         <div className="max-w-4xl mx-auto">
            {projects.length > 0 ? (
               projects.map(p => (
                 <ProjectRow 
                   key={p.id} 
                   project={p} 
                   displayName={displayNames.get(p.id) || p.id}
                   onClick={handleSelectProject} 
                 />
               ))
            ) : (
               <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 border-dashed">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                     <FolderSearch size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">
                     {t('projectList.emptyTitle')}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                     {t('projectList.emptyDesc')}
                  </p>
               </div>
            )}

            {/* Bottom Padding */}
            <div className="h-10"></div>
         </div>
      </div>
    </div>
  );
};
