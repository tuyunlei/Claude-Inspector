
export type ProjectGroupType = 'workspace' | 'global' | 'system';

export interface ProjectStats {
  id: string;          // Unique identifier (projectPath for workspaces, constant for virtuals)
  name: string;        // Display name
  sessionCount: number;
  lastActive: number;
  totalTokens: number;
  groupType: ProjectGroupType;
}
