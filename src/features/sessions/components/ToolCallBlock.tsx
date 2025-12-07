
import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { ClaudeContentBlock } from '../../../types';

export const ToolCallBlock: React.FC<{ block: ClaudeContentBlock }> = ({ block }) => {
  const [expanded, setExpanded] = useState(false);
  const inputJson = JSON.stringify(block.input, null, 2);
  
  // Try to extract a meaningful summary for preview
  let summary = '';
  if (block.input) {
       if (block.input.command) summary = block.input.command;
       else if (block.input.path) summary = block.input.path;
       else if (block.input.query) summary = block.input.query;
  }

  return (
    <div className="my-1 rounded border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
      <div 
          className="px-3 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-xs font-mono font-medium flex items-center justify-between cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
      >
          <div className="flex items-center gap-2">
              <Wrench size={10} />
              <span>{block.name}</span>
              {!expanded && summary && (
                  <span className="opacity-60 text-[10px] font-normal truncate max-w-[300px] hidden sm:inline-block">
                       — {summary}
                  </span>
              )}
          </div>
          <div className="flex items-center gap-1 opacity-70 hover:opacity-100 text-[10px]">
              {expanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
          </div>
      </div>
      
      {expanded && (
          <div className="p-2 font-mono text-xs overflow-x-auto text-amber-900 dark:text-amber-100 bg-amber-50/50 dark:bg-transparent border-t border-amber-200 dark:border-amber-900/30">
              <pre>{inputJson}</pre>
          </div>
      )}
    </div>
  );
};
