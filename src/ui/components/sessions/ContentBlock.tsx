import React from 'react';
import { ClaudeContentBlock } from '../../../model/events';
import { useI18n } from '../../i18n';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { ToolResultBlock } from './ToolResultBlock';
import { MarkdownRenderer } from '../MarkdownRenderer';

export const ContentBlock: React.FC<{ block: ClaudeContentBlock; query: string }> = ({ block, query }) => {
  const { t } = useI18n();

  if (block.type === 'thinking' || (block as any).type === 'redacted_thinking') {
    return <ThinkingBlock block={block} />;
  }
  
  if (block.type === 'text') {
    return (
      <div className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        <MarkdownRenderer 
          content={block.text || ''} 
          className="prose-slate dark:prose-invert"
        />
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