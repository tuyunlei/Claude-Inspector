import React from 'react';
import { ProjectStats } from '../../../model/projects';
import { Settings } from 'lucide-react';
import { useI18n } from '../../i18n';

interface ProjectSettingsViewProps {
    project: ProjectStats;
}

export const ProjectSettingsView: React.FC<ProjectSettingsViewProps> = ({ project }) => {
  const { t } = useI18n();
  return (
    <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Settings size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{t('projects.settingsTitle')}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {t('projects.settingsDesc', { name: project.name })}
            </p>
        </div>
    </div>
  );
};