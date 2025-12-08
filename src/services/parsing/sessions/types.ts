import { ClaudeEvent } from '../../../model/events';
import { SessionKind, SessionStoryRole } from '../../../model/sessions';

export const HISTORY_SESSION_MATCH_WINDOW_MS = 5000;

export interface SessionFeatureFlags {
  hasChatMessages: boolean;
  hasFileSnapshots: boolean;
  hasToolCalls: boolean;
  fileSnapshotCount: number;
  storyRole: SessionStoryRole;
  kind: SessionKind;
}

export interface ParsedSessionSnapshot extends SessionFeatureFlags {
  id: string;
  directoryId: string | null; // The folder name in ~/.claude/projects/
  projectPath: string; // The display path (decoded from directoryId or fallback to cwd)
  timestamp: string; // ISO
  firstEventAt: string;
  lastEventAt: string;
  messageCount: number;
  totalTokens: number;
  modelDistribution: Record<string, number>;
  events: ClaudeEvent[];
  display: string;
}
