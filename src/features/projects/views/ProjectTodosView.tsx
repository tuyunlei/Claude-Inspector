
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../app/App';
import { cn } from '../../../shared/utils';
import { CheckSquare, Circle, Clock, FolderGit2, ArrowUpRight } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { selectTodosByProject } from '../../../core/selectors/context';
import { ProjectStats } from '../../../types';

interface ProjectTodosViewProps {
    project: ProjectStats;
}

export const ProjectTodosView: React.FC<ProjectTodosViewProps> = ({ project }) => {
  const { data } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState('');

  const todos = useMemo(() => selectTodosByProject(data, project.id), [data, project.id]);

  const filteredTodos = useMemo(() => {
      return todos.filter(todo => {
          if (selectedStatus && todo.status !== selectedStatus) return false;
          return true;
      });
  }, [todos, selectedStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed': return <CheckSquare className="text-green-500" size={18} />;
        case 'in_progress': return <Clock className="text-blue-500" size={18} />;
        default: return <Circle className="text-slate-400" size={18} />;
    }
  };

  const getPriorityColor = (p?: string) => {
      if (p === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      if (p === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300';
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  };

  const handleViewSession = (sessionId?: string) => {
      if (sessionId) {
        // Just link to history with query param
        navigate(`/project/${encodeURIComponent(project.id)}?tab=history&session=${encodeURIComponent(sessionId)}`);
      }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
      <div className="mb-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <select 
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
             >
                 <option value="">All Statuses</option>
                 <option value="pending">Pending</option>
                 <option value="in_progress">In Progress</option>
                 <option value="completed">Completed</option>
             </select>
          </div>
          <div className="text-sm text-slate-500">
              {filteredTodos.length} Tasks
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
         {/* Desktop Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
            <div className="col-span-1 text-center">{t('todos.status')}</div>
            <div className="col-span-8">{t('todos.task')}</div>
            <div className="col-span-1">{t('todos.priority')}</div>
            <div className="col-span-2 text-right">Actions</div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto">
            {filteredTodos.length === 0 ? (
                <div className="p-8 text-center text-slate-400">{t('todos.noTodos')}</div>
            ) : (
                filteredTodos.map((todo, i) => (
                    <div key={`${todo.id}-${i}`} className="flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group">
                        {/* Status Icon */}
                        <div className="md:col-span-1 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                            <span className="md:hidden text-xs font-bold uppercase text-slate-400">Status: </span>
                            {getStatusIcon(todo.status)}
                        </div>
                        
                        {/* Task Content */}
                        <div className="md:col-span-8 font-medium text-slate-700 dark:text-slate-200 text-sm">
                            {todo.content}
                        </div>

                        {/* Priority Badge */}
                        <div className="md:col-span-1">
                            <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize inline-block", getPriorityColor(todo.priority))}>
                                {todo.priority || t('todos.normal')}
                            </span>
                        </div>

                        {/* Action Button */}
                        <div className="md:col-span-2 text-left md:text-right mt-2 md:mt-0">
                            {todo.sessionId && (
                                <button 
                                    onClick={() => handleViewSession(todo.sessionId)}
                                    className="inline-flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium px-2 py-1 rounded hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                >
                                    View Session <ArrowUpRight size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
