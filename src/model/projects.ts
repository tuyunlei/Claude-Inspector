

export type ProjectGroupType = 'workspace' | 'global' | 'system';

export interface ProjectStats {
  id: string;          // Unique identifier (projectPath for workspaces, constant for virtuals)
  name: string;        // Display name
  sessionCount: number;
  lastActive: number;
  totalTokens: number;
  groupType: ProjectGroupType;
}

export type ProjectPathSource =
  | 'history'                       // Found in history.jsonl
  | 'history-ambiguous-picked-max'  // Collision in encoding, picked most active
  | 'guessed-from-encoded';         // Not found in history, guessed

export type ProjectPathConfidence = 'high' | 'medium' | 'low';

export interface ProjectIdentity {
  id: string;                 // encoded directory name (e.g. -Users-name)
  canonicalPath: string;      // The real path
  pathSource: ProjectPathSource;
  pathConfidence: ProjectPathConfidence;
  lastActiveAt: number;       // ms timestamp
  queryCount: number;         // message/query count
}
