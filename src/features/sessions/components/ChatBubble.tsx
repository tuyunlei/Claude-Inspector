
import React from 'react';
import { cn } from '../../../shared/utils';
import { ClaudeEvent } from '../../../types';
import { ContentBlock } from './ContentBlock';
import { HighlightText } from './HighlightText';
import { useI18n } from '../../../shared/i18n';

interface ChatBubbleProps {
  event: ClaudeEvent;
  query: string;
  index: number;
  isFirstInSequence?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ event, query, index, isFirstInSequence = true }) => {
  const { t } = useI18n();
  if (!event.message) return null;
  const isUser = event.message.role === 'user';
  const content = event.message.content;
  const timestamp = event.timestamp ? new Date(event.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '';

  const borderColorClass = isFirstInSequence 
    ? (isUser ? "border-l-orange-600 dark:border-l-orange-400" : "border-l-slate-400 dark:border-l-slate-500")
    : "border-l-transparent";

  const containerClass = cn(
    "mb-2 pl-4 py-1 text-sm border-l-[3px] transition-colors group",
    borderColorClass
  );

  const roleLabelClass = cn(
    "text-[11px] tracking-wider uppercase select-none",
    isUser 
      ? "font-bold text-orange-600 dark:text-orange-400" 
      : "font-medium text-slate-400 dark:text-slate-500"
  );

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between gap-2 mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="flex items-baseline gap-2">
            <span className={roleLabelClass}>
            {isUser ? t('common.user') : t('common.assistant')}
            </span>
            
            {timestamp && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{timestamp}</span>
            )}
        </div>

        {!isUser && event.message.usage && (
             <div className="flex items-center gap-2 text-[10px] text-slate-400 opacity-60">
                <span>{t('common.in')}: {event.message.usage.input_tokens}</span>
                <span>{t('common.out')}: {event.message.usage.output_tokens}</span>
                {event.message.model && <span className="hidden sm:inline">| {event.message.model}</span>}
             </div>
         )}
      </div>

      <div className="space-y-1">
            {Array.isArray(content) ? (
                content.map((b, i) => <ContentBlock key={i} block={b} query={query} />)
            ) : (
                <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                    <HighlightText text={typeof content === 'string' ? content : ''} query={query} />
                </div>
            )}
      </div>
    </div>
  );
};
