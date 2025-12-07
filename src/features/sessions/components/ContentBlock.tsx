
import React from 'react';
import { ClaudeContentBlock } from '../../../types';
import { useI18n } from '../../../shared/i18n';
import { HighlightText } from './HighlightText';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { ToolResultBlock } from './ToolResultBlock';

export const ContentBlock: React.FC<{ block: ClaudeContentBlock; query: string }> = ({ block, query }) => {
  const { t } = useI18n();

  if (block.type === 'thinking' || (block as any).type === 'redacted_thinking') {
    return <ThinkingBlock block={block} />;
  }
  
  if (block.type === 'text') {
    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        <HighlightText text={block.text || ''} query={query} />
      </div>
    );
  }
  
  if (block.type === 'tool_use') {
    return <ToolCallBlock block={block} />;
  }

  if (block.type === 'tool_result') {
    return <ToolResultBlock block={block} query={query} />;
  }

  return <div className="text-gray-400 italic text-xs">[{t('sessions.unsupported')}: {block.type}]</div>;
};
