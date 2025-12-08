
import React, { useState } from 'react';
import { 
  ArrowLeft, PanelLeftOpen, AlertCircle, Clock, FolderGit2, Hash, 
  History, ChevronDown, ChevronRight, Copy, Check, Download 
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { SessionSummary } from '../../../model/sessions';
import { formatDate } from '../../../utils/utils';
import { getSessionStoryRoleBadge, getSessionPathUsages } from '../../modules/sessions/ui';

interface SessionDetailHeaderProps {
  session: SessionSummary;
  onBack?: () => void;
  onCopy: () => void;
  onDownload: () => void;
  isCopied: boolean;
  onExpandList?: () => void;
}

export const SessionDetailHeader: React.FC<SessionDetailHeaderProps> = ({
  session,
  onBack,
  onCopy,
  onDownload,
  isCopied,
  onExpandList,
}) => {
  const { t } = useI18n();
  const [showPaths, setShowPaths] = useState(false);

  const roleBadge = getSessionStoryRoleBadge(session);
  const pathUsages = getSessionPathUsages(session);

  return (
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

        {/* Desktop Expand Button */}
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
          {/* Title & Role */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${roleBadge.className}`}>
              {roleBadge.label}
            </span>
            {session.storyRole === 'system' && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <AlertCircle size={10} /> Safe to ignore
              </span>
            )}
          </div>
          
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 break-all" title={session.display}>
            {session.display}
          </h2>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDate(session.timestamp)}
            </span>
            <span className="flex items-center gap-1 truncate max-w-[200px]" title={session.primaryProjectPath || 'Unknown'}>
              <FolderGit2 size={12} /> {session.primaryProjectPath || t('projects.groups.unknown')}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={12} /> {session.id.slice(0, 8)}
            </span>

            {session.totalTokens > 0 && (
              <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                {session.totalTokens.toLocaleString()} {t('sessions.tokens')}
              </span>
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
                {showPaths ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 justify-end md:justify-start">
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
};
