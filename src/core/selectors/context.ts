
import { DataStore } from '../domain/datastore';
import { TodoItem } from '../domain/todos';
import { SessionSummary } from '../domain/sessions';
import { GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID, UNKNOWN_PROJECT_PATH } from '../analytics/projects';

export interface TodoItemWithContext extends TodoItem {
  projectPath: string;
  sessionDisplay?: string;
  sessionTimestamp?: number;
}

export function selectTodosWithContext(data: DataStore): TodoItemWithContext[] {
  // Create a map for fast session lookup
  const sessionMap = new Map<string, SessionSummary>();
  data.sessions.forEach(s => sessionMap.set(s.id, s));

  return data.todos.map(todo => {
    // Try to find session by ID
    const sessionId = todo.sessionId || '';
    const session = sessionMap.get(sessionId);

    return {
      ...todo,
      projectPath: session?.primaryProjectPath || UNKNOWN_PROJECT_PATH,
      sessionDisplay: session?.display,
      sessionTimestamp: session?.timestamp
    };
  });
}

export function selectTodosByProject(data: DataStore, projectId: string): TodoItemWithContext[] {
  const all = selectTodosWithContext(data);
  
  if (projectId === GLOBAL_SESSIONS_ID) {
      // Global sessions = Unknown Project path
      return all.filter(t => t.projectPath === UNKNOWN_PROJECT_PATH);
  }
  if (projectId === SYSTEM_SESSIONS_ID) {
      // System sessions usually don't have user todos, but we use same logic
      return []; 
  }
  
  return all.filter(t => t.projectPath === projectId);
}

export function selectSessionsByProject(data: DataStore, projectId: string): SessionSummary[] {
  // Filter by the Canonical Session's primaryProjectId.
  // This ensures a session only appears in ONE project list.
  return data.sessions.filter(s => s.primaryProjectId === projectId);
}
