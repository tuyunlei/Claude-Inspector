
import React from 'react';
import { SessionSummary } from '../../../model/sessions';
import { ClaudeEvent } from '../../../model/events';
import { SessionDetailEmptyState } from './SessionDetailEmptyState';
import { SessionDetailHeader } from './SessionDetailHeader';
import { SessionDetailTimeline } from './SessionDetailTimeline';

interface SessionDetailProps {
  session: SessionSummary | undefined;
  events: ClaudeEvent[];
  query: string;
  onQueryChange: (val: string) => void;
  onCopy: () => void;
  onDownload: () => void;
  isCopied: boolean;
  onBack?: () => void;
  onExpandList?: () => void;
}

export const SessionDetail: React.FC<SessionDetailProps> = ({
  session,
  events,
  query,
  onQueryChange,
  onCopy,
  onDownload,
  isCopied,
  onBack,
  onExpandList,
}) => {
  if (!session) {
    return <SessionDetailEmptyState onExpandList={onExpandList} />;
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-full overflow-hidden transition-colors min-w-0">
      <SessionDetailHeader
        session={session}
        onBack={onBack}
        onCopy={onCopy}
        onDownload={onDownload}
        isCopied={isCopied}
        onExpandList={onExpandList}
      />
      
      <SessionDetailTimeline
        events={events}
        query={query}
        onQueryChange={onQueryChange}
        onExpandList={onExpandList}
        showSystemFooter={session.storyRole === 'system'}
      />
    </div>
  );
};
