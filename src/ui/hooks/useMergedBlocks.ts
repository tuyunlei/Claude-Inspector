
import { useMemo } from 'react';
import { ProjectTurn } from '../../services/selectors/projectTimeline/index';

export type ProjectTurnWithMerge = ProjectTurn & {
  mergedToolResultCount?: number;
};

export function useMergedBlocks(rawBlocks: ProjectTurn[]): ProjectTurnWithMerge[] {
    return useMemo(() => {
      const merged: ProjectTurnWithMerge[] = [];
      let current: ProjectTurnWithMerge | null = null;

      for (const block of rawBlocks) {
          // Identify Tool Result Only: Empty user text, usually marked by specific placeholder
          const isToolResultOnly = block.userQuery === '(Complex Input/Tool Result Only)';

          if (isToolResultOnly) {
              if (current) {
                  // Merge actions (Evidence)
                  current.actions = [...current.actions, ...block.actions];
                  
                  // Merge contextEvents if present
                  if (block.contextEvents && block.contextEvents.length > 0) {
                      current.contextEvents = [...current.contextEvents, ...block.contextEvents];
                  }

                  // Merge reply preview if present (Assistant reaction to tool)
                  if (block.replyPreview) {
                      if (current.replyPreview) {
                          current.replyPreview += '\n\n---\n\n' + block.replyPreview;
                      } else {
                          current.replyPreview = block.replyPreview;
                      }
                  }
                  
                  // Merge thinking if present
                  if (block.thinkingPreview) {
                       if (current.thinkingPreview) {
                           current.thinkingPreview += '\n\n' + block.thinkingPreview;
                       } else {
                           current.thinkingPreview = block.thinkingPreview;
                       }
                  }

                  current.mergedToolResultCount = (current.mergedToolResultCount || 0) + 1;
              } else {
                  // Orphan case (start of list): keep it but mark it
                  merged.push({ ...block, mergedToolResultCount: 0 });
              }
          } else {
              // Real Turn: Push as new card
              const newBlock = { ...block, mergedToolResultCount: 0 };
              merged.push(newBlock);
              current = newBlock;
          }
      }
      return merged;
  }, [rawBlocks]);
}