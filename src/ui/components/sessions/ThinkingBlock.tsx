
import React, { useState } from 'react';
import { Lightbulb, EyeOff } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ClaudeContentBlock } from '../../../model/events';

export const ThinkingBlock: React.FC<{ block: ClaudeContentBlock }> = ({ block }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  // Redacted Thinking Block
  if ((block as any).type === 'redacted_thinking') {
      return (
        <div className="my-1 rounded bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-500 flex items-center gap-2">
          <EyeOff size={12} />
          {t('sessions.redactedThinking')}
        </div>
      );
  }

  const text = block.thinking || '';
    
  if (!text) {
      return (
        <div className="my-1 rounded bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-500">
          {t('sessions.thinkingEmpty')}
        </div>
      );
  }

  const preview = text.length > 120 ? text.slice(0, 120) + '…' : text;

  return (
    <div className="my-1 rounded-md bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 border border-dashed border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Lightbulb size={12} className="shrink-0" />
              <span className="font-medium">{t('sessions.thinkingTitle')}</span>
          </span>
          <button
            type="button"
            className="text-[10px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t('sessions.collapse') : t('sessions.expand')}
          </button>
      </div>

      <div className="mt-1.5 whitespace-pre-wrap leading-relaxed opacity-80">
          {expanded ? text : preview}
      </div>
    </div>
  );
};
