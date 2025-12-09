
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../app/DataContext';
import { selectProjects } from '../../../model/selectors/projects';
import { FolderGit2, Globe, Monitor, ChevronRight, Zap, MessageSquare, Clock } from 'lucide-react';
import { cn, formatDate } from '../../../utils/utils';
import { ProjectStats } from '../../../model/projects';
import { useI18n } from '../../i18n';

export const ProjectDirectoryPage: React.FC = () => {
  const { data } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const projects = selectProjects(data);

  const getProjectIcon = (type: string) => {
      switch(type) {
          case 'global': return <Globe size={20} className="text-blue-500" />;
          case 'system': return <Monitor size={20} className="text-slate-500" />;
          default: return <FolderGit2 size={20} className="text-orange-500" />;
      }
  };

  const handleRowClick = (projectId: string) => {
    navigate(`/project/${encodeURIComponent(projectId)}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('projects.directoryTitle')}</h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t('projects.directorySubtitle')} ({projects.length}).
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4">{t('projects.columns.name')}</th>
                <th className="px-6 py-4">{t('projects.columns.type')}</th>
                <th className="px-6 py-4 text-right">{t('projects.columns.messages')}</th>
                <th className="px-6 py-4 text-right">{t('projects.columns.tokens')}</th>
                <th className="px-6 py-4 text-right">{t('projects.columns.lastActive')}</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((p) => (
                <tr 
                  key={p.id} 
                  onClick={() => handleRowClick(p.id)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        {getProjectIcon(p.groupType)}
                      </div>
                      <div>
                         <div className="font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                         <div className="text-xs text-slate-400 font-mono truncate max-w-[200px]">{p.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-2 py-1 rounded text-xs font-medium capitalize",
                       p.groupType === 'workspace' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" :
                       p.groupType === 'global' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" :
                       "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                     )}>
                       {p.groupType}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-400">
                         <MessageSquare size={14} className="opacity-50" />
                         {p.sessionCount}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-1.5 text-slate-600 dark:text-slate-400">
                         <Zap size={14} className="opacity-50" />
                         {p.totalTokens.toLocaleString()}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                      {formatDate(p.lastActive)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 group-hover:text-orange-500 transition-colors">
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
