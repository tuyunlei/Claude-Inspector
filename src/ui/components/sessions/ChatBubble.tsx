
import React from 'react';
import { cn } from '../../../utils/utils';
import { ClaudeEvent } from '../../../model/events';
import { ContentBlock } from './ContentBlock';
import { HighlightText } from './HighlightText';
import { useI18n } from '../../i18n';
import { User, Sparkles } from 'lucide-react';

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

  // Container Style: Distinct "Cards" for User vs Assistant
  const containerClass = cn(
    "rounded-xl p-4 border transition-colors relative",
    isUser 
      ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
      : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
  );

  return (
    <div className={containerClass}>
      {/* Header: Icon, Name, Time */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
            {/* Avatar Icon */}
            <div className={cn(
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0 shadow-sm",
                isUser 
                    ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            )}>
                {isUser ? <User size={14} /> : <Sparkles size={14} />}
            </div>

            {/* Role Name */}
            <span className={cn(
                "text-xs font-bold tracking-wide uppercase",
                isUser ? "text-slate-700 dark:text-slate-300" : "text-slate-700 dark:text-slate-300"
            )}>
                {isUser ? t('common.user') : t('common.assistant')}
            </span>
            
            {/* Timestamp */}
            {timestamp && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {timestamp}
                </span>
            )}
        </div>

        {/* Token Usage Stats (Right Aligned) */}
        {!isUser && event.message.usage && (
             <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <span>In: {event.message.usage.input_tokens}</span>
                <span className="opacity-30">|</span>
                <span>Out: {event.message.usage.output_tokens}</span>
             </div>
         )}
      </div>

      {/* Content Body */}
      <div className="pl-[34px] space-y-2">
            {Array.isArray(content) ? (
                content.map((b, i) => <ContentBlock key={i} block={b} query={query} />)
            ) : (
                <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
                    <HighlightText text={typeof content === 'string' ? content : ''} query={query} />
                </div>
            )}
      </div>
    </div>
  );
};
