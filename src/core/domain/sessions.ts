
import { ClaudeEvent } from './events';

export type SessionKind = 'chat' | 'file-history-only' | 'other';
export type SessionStoryRole = 'chat' | 'code-activity' | 'system';

export interface SessionPathUsage {
  path: string;              // The raw cwd or projectPath found in the log
  projectId: string | null;  // The mapped Project ID
  firstEventAt: string;      // ISO string
  lastEventAt: string;       // ISO string
  messageCount: number;      // Number of events recorded in this path
}

export interface SessionSummary {
  id: string;
  timestamp: number;
  
  // Canonical Project Ownership
  primaryProjectId: string | null;     // The ID of the project this session primarily belongs to
  primaryProjectPath: string | null;   // The path string for display/debugging
  
  pathUsages: SessionPathUsage[];      // History of where this session ID was found

  // Legacy/Display fields (Derived from the primary/latest snapshot)
  projectPath: string; // Kept for backward compatibility, mapped to primaryProjectPath
  display: string;
  messageCount: number;
  totalTokens: number;
  modelDistribution: Record<string, number>;
  events: ClaudeEvent[];
  kind: SessionKind;

  // Story / Categorization Fields
  hasChatMessages: boolean;        // Contains user or assistant messages
  hasFileSnapshots: boolean;       // Contains file-history-snapshot events
  hasToolCalls: boolean;           // Contains tool use or results
  storyRole: SessionStoryRole;     // The product-level role of this session
  fileSnapshotCount: number;       // Number of file snapshots
}

export interface FileBackupStatsSummary {
  totalSnapshots: number;
}

export function extractFileBackupStatsFromSnapshots(events: ClaudeEvent[]): FileBackupStatsSummary {
  return {
    totalSnapshots: events.filter((e) => e.type === 'file-history-snapshot').length,
  };
}
