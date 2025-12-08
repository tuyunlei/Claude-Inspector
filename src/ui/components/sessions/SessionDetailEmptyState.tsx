
import React from 'react';
import { MessageSquare, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '../../i18n';

interface SessionDetailEmptyStateProps {
  onExpandList?: () => void;
}

export const SessionDetailEmptyState: React.FC<SessionDetailEmptyStateProps> = ({ onExpandList }) => {
  const { t } = useI18n();

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
};
