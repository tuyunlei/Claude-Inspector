
import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import { ClaudeContentBlock } from '../../../model/events';
import { useI18n } from '../../i18n';
import { cn } from '../../../utils/utils';
import { HighlightText } from './HighlightText';

export const ToolResultBlock: React.FC<{ block: ClaudeContentBlock; query: string }> = ({ block, query }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  // Safety check: ensure content exists for error checking
  const safeContent = block.content ?? '';
  const isError = safeContent.toString().includes('Error');
  
  let contentStr = '';
  
  if (typeof block.content === 'string') {
      contentStr = block.content;
  } else {
      // JSON.stringify(undefined) returns undefined, so we default to empty string
      contentStr = JSON.stringify(block.content, null, 2) || '';
  }
  
  // Preview: first 5 lines
  const lines = contentStr.split('\n');
  const isLong = lines.length > 5;
  const previewText = isLong && !expanded ? lines.slice(0, 5).join('\n') + `\n... (${lines.length - 5} ${t('sessions.moreLines')})` : contentStr;

  return (
      <div className={cn("my-1 rounded border overflow-hidden", isError ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900")}>
           <div 
              className={cn("px-3 py-1 text-xs font-mono font-medium flex items-center justify-between cursor-pointer select-none", isError ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}
              onClick={() => setExpanded(!expanded)}
           >
              <div className="flex items-center gap-2">
                  <Terminal size={10} />
                  {t('sessions.toolResult')}
              </div>
              {isLong && (
                  <div className="flex items-center gap-1 opacity-70 hover:opacity-100 text-[10px]">
                      {expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                  </div>
              )}
          </div>
          <div className="p-2 font-mono text-xs overflow-x-auto text-slate-700 dark:text-slate-300 max-h-[500px] overflow-y-auto">
              <HighlightText text={previewText} query={query} />
          </div>
      </div>
  );
};
