
export type TimelineActionKind = 'tool' | 'subagent' | 'snapshot' | 'tool_result' | 'other';

export interface TimelineAction {
  id: string;
  kind: TimelineActionKind;
  label: string;
  timestamp?: string;
  meta?: {
    fileCount?: number;
    toolName?: string;
    agentName?: string;
  };
  payload?: Record<string, unknown>;
  isError?: boolean;
}

export interface ContextEvent {
  id: string;
  type: 'context_compaction';
  text: string;
  timestamp: string;
  stats: {
    chars: number;
    lines: number;
  };
}

export interface ProjectTurn {
  id: string;
  timestamp: string;
  queryNumber?: number;
  userQuery: string;
  replyPreview: string;
  actions: TimelineAction[];
  contextEvents: ContextEvent[];
  thinkingPreview: string;
  userQueryMeta?: {
      isLongInput: boolean;
      charCount: number;
      lineCount: number;
      hasCodeFence: boolean;
  };
  guardrails?: string[];
  systemNotes?: string[];
}