import React from 'react';
import { cn } from '../../../utils/utils';
import { ClaudeEvent } from '../../../model/events';
import { ContentBlock } from './ContentBlock';
import { useI18n } from '../../i18n';
import { User, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

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
                "w-6 h-6 rounded-md flex items-center justify-center shrink-0",
                isUser ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
            )}>
                {isUser ? <User size={14} /> : <Sparkles size={14} />}
            </div>
            
            {/* Name */}
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isUser ? t('common.user') : t('common.assistant')}
            </span>

             {/* Time */}
             <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                {timestamp}
            </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="pl-0 md:pl-8.5">
          {Array.isArray(content) ? (
            <div className="flex flex-col gap-3">
              {content.map((block, i) => (
                <ContentBlock key={i} block={block} query={query} />
              ))}
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
              <MarkdownRenderer 
                 content={typeof content === 'string' ? content : ''} 
                 className="prose-slate dark:prose-invert"
              />
            </div>
          )}
      </div>
    </div>
  );
};