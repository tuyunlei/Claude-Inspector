
import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { useI18n } from '../../i18n';
import { formatDate } from '../../../utils/utils';
import { ProjectIdentity } from '../../../model/projects';

interface ProjectRowProps {
  project: ProjectIdentity;
  displayName: string;
  onClick: (project: ProjectIdentity) => void;
}

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, displayName, onClick }) => {
  const { t } = useI18n();

  const isLowConfidence = project.pathConfidence === 'low';

  return (
    <div 
      onClick={() => onClick(project)}
      className="group flex items-center justify-between p-4 mb-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50 cursor-pointer transition-all"
    >
      <div className="flex flex-col min-w-0 pr-4">
        {/* Main Title: Friendly Name */}
        <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
            {displayName}
            </h3>
            {isLowConfidence && (
                <div className="group/icon relative">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-2 bg-slate-800 text-slate-200 text-xs rounded-lg opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity z-50">
                        Path guessed from directory name. May not match original project path exactly.
                    </div>
                </div>
            )}
        </div>
        
        {/* Subtitle: Canonical Path */}
        <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono truncate max-w-[300px] md:max-w-[500px]" title={project.canonicalPath}>
          {project.canonicalPath}
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-8 shrink-0">
        {/* Activity Info - No separators, stacked */}
        <div className="text-right flex flex-col items-end justify-center">
           <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
             {t('projectList.lastActive')}: {formatDate(project.lastActiveAt)}
           </div>
           <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {t('projectList.messages')}: {project.queryCount}
           </div>
        </div>

        {/* Chevron */}
        <div className="text-slate-300 dark:text-slate-600 group-hover:text-orange-500 transition-colors">
          <ChevronRight size={20} />
        </div>
      </div>
    </div>
  );
};
