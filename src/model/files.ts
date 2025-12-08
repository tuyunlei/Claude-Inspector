
export type ClaudeFileKind =
  | "root"
  | "project-log"
  | "project-root"
  | "todo"
  | "todo-root"
  | "shell-snapshot"
  | "shell-root"
  | "stats"
  | "stats-root"
  | "settings"
  | "mcp-config"
  | "history-index"
  | "credentials"
  | "commands"
  | "commands-root"
  | "other";

export interface FileTreeNode {
  name: string;
  path: string;          // Relative path
  isDir: boolean;
  kind: ClaudeFileKind;
  children?: FileTreeNode[];
  size?: number;
}

export interface FileEntry {
  path: string;
  text: () => Promise<string>;
}
