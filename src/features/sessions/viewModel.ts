
import { ClaudeEvent, ClaudeContentBlock } from '../../types';

function hasToolUseBlocks(blocks: ClaudeContentBlock[] | string | undefined): boolean {
  if (!Array.isArray(blocks)) return false;
  return blocks.some(b => b.type === 'tool_use');
}

function hasOnlyToolResultBlocks(blocks: ClaudeContentBlock[] | string | undefined): boolean {
  if (!Array.isArray(blocks)) return false;
  return blocks.length > 0 && blocks.every(b => b.type === 'tool_result');
}

export function buildRenderEvents(events: ClaudeEvent[]): ClaudeEvent[] {
  const result: ClaudeEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const msg = event.message;
    if (!msg) {
      result.push(event);
      continue;
    }

    const blocks = Array.isArray(msg.content) ? msg.content : undefined;

    // Check for assistant message with tool use
    if (msg.role === 'assistant' && hasToolUseBlocks(blocks)) {
      // Clone content to avoid mutating original state references unexpectedly
      const mergedContent = blocks ? [...blocks] : [];
      
      const mergedEvent: ClaudeEvent = {
        ...event,
        message: {
          ...msg,
          content: mergedContent,
        },
      };

      let j = i + 1;
      // Look ahead and merge consecutive user messages that only contain tool results
      while (j < events.length) {
        const next = events[j];
        const nextMsg = next.message;
        
        if (!nextMsg) break;
        
        const nextBlocks = Array.isArray(nextMsg.content) ? nextMsg.content : undefined;

        if (nextMsg.role === 'user' && hasOnlyToolResultBlocks(nextBlocks) && nextBlocks) {
          mergedContent.push(...nextBlocks);
          j++;
        } else {
          break;
        }
      }

      result.push(mergedEvent);
      i = j - 1; // fast-forward index
    } else {
      result.push(event);
    }
  }

  return result;
}
