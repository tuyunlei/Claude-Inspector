
import React from 'react';
import { ProjectTurn } from '../../../model/selectors/projectTimeline';
import { QueryBlockCard } from './QueryBlockCard';

interface QueryTimelineListProps {
  blocks: ProjectTurn[];
}

export const QueryTimelineList: React.FC<QueryTimelineListProps> = ({ blocks }) => {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="space-y-2">
        {blocks.map((block) => (
          <QueryBlockCard key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
};
