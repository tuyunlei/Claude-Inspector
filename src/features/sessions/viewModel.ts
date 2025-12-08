
import { ClaudeEvent } from '../../types';

export function buildRenderEvents(events: ClaudeEvent[]): ClaudeEvent[] {
  // Return events exactly as they are parsed from the JSONL file.
  // We no longer merge tool_use/tool_result blocks into messages to preserve
  // the 1:1 mapping between file lines and displayed rows.
  return events;
}
