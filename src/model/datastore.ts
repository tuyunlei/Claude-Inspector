
import { SessionSummary } from './sessions';
import { ProjectStats } from './projects';
import { TodoItem } from './todos';
import { Plan } from './plans';
import { ConfigData, ParseWarning } from './config';
import { FileTreeNode, FileEntry } from './files';

export interface DataStore {
  sessions: SessionSummary[];
  projects: ProjectStats[];
  todos: TodoItem[];
  plans: Plan[];
  config: ConfigData;
  warnings: ParseWarning[];
  isLoaded: boolean;
  fileCount: number;
  fileTree?: FileTreeNode;
  fileMap?: Map<string, FileEntry>;
}
