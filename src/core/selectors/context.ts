
import { DataStore } from '../domain/datastore';
import { TodoItem } from '../domain/todos';
import { SessionSummary } from '../domain/sessions';
import { Plan } from '../domain/plans';
import { ProjectStats } from '../domain/projects';
import { selectProjects } from './projects';
import { GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID, UNKNOWN_PROJECT_PATH } from '../analytics/projects';

export interface TodoItemWithContext extends TodoItem {
  projectPath: string;
  sessionDisplay?: string;
  sessionTimestamp?: number;
}

export interface PlanWithContext extends Plan {
  matchedProjectPath?: string;
  matchScore: number;
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

export function selectPlans(data: DataStore): Plan[] {
  return data.plans || [];
}

// --- Heuristic Inference for Plans ---

function inferProjectForPlan(plan: Plan, projects: ProjectStats[]): PlanWithContext {
  // If explicitly linked in future versions, return immediately
  if (plan.inferredProjectPath) {
    return { ...plan, matchedProjectPath: plan.inferredProjectPath, matchScore: 100 };
  }

  let bestMatch: string | undefined = undefined;
  let maxScore = 0;

  const planTitle = (plan.title || '').toLowerCase();
  const planPath = (plan.filePath || '').toLowerCase();
  const planContent = (plan.content || '').slice(0, 500).toLowerCase();

  // Only match against workspace projects
  const workspaceProjects = projects.filter(p => p.groupType === 'workspace');

  for (const project of workspaceProjects) {
    let score = 0;
    // Extract leaf name, e.g., "/home/user/code/my-app" -> "my-app"
    // Handle trailing slashes just in case
    const cleanPath = project.id.replace(/\/$/, '');
    const projectName = cleanPath.split('/').pop()?.toLowerCase();

    if (!projectName) continue;

    // Heuristics
    // 1. Title contains project name (Strong signal)
    if (planTitle.includes(projectName)) score += 2;

    // 2. File path contains project name (Medium signal)
    if (planPath.includes(projectName)) score += 1;

    // 3. Content start contains project name (Weak signal)
    if (planContent.includes(projectName)) score += 1;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = project.id;
    }
  }

  // Threshold: Score must be >= 2 to be considered a match
  const finalMatch = maxScore >= 2 ? bestMatch : undefined;

  return {
    ...plan,
    matchedProjectPath: finalMatch,
    matchScore: finalMatch ? maxScore : 0
  };
}

export function selectPlansWithContext(data: DataStore): PlanWithContext[] {
  const projects = selectProjects(data);
  const plans = data.plans || [];
  return plans.map(p => inferProjectForPlan(p, projects));
}

export function selectPlansByProject(data: DataStore, projectId: string): PlanWithContext[] {
  // Plans are only heuristics linked to workspace projects
  if (projectId === GLOBAL_SESSIONS_ID || projectId === SYSTEM_SESSIONS_ID) return [];
  
  const all = selectPlansWithContext(data);
  return all.filter(p => p.matchedProjectPath === projectId);
}
