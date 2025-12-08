
import { SessionSummary } from '../../../model/sessions';

export function getSessionStoryRoleBadge(session: SessionSummary): {
  label: string;
  className: string;
} {
  const role = session.storyRole;
  let className = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-800';
  
  if (role === 'system') {
    className = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  } else if (role === 'code-activity') {
    className = 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 border-purple-100 dark:border-purple-800';
  }

  return {
    label: role,
    className
  };
}

export function getSessionPathUsages(session: SessionSummary) {
  return session.pathUsages || [];
}
