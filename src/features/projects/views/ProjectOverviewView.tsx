
import React, { useMemo } from 'react';
import { useData } from '../../../app/App';
import { MessageSquare, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { ProjectStats } from '../../../types';
import { selectSessionsByProject, selectTodosByProject } from '../../../core/selectors/context';
import { StatCard } from '../../dashboard/components/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#f43f5e'];

interface ProjectOverviewViewProps {
    project: ProjectStats;
}

export const ProjectOverviewView: React.FC<ProjectOverviewViewProps> = ({ project }) => {
  const { data } = useData();
  const { t } = useI18n();

  const projectSessions = useMemo(() => selectSessionsByProject(data, project.id), [data, project.id]);
  const projectTodos = useMemo(() => selectTodosByProject(data, project.id), [data, project.id]);

  const stats = useMemo(() => {
    const totalSessions = projectSessions.length;
    const totalTokens = projectSessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const pendingTodos = projectTodos.filter(t => t.status === 'pending').length;
    
    // Activity by Date (Last 14 active days)
    const dateMap = new Map<string, number>();
    projectSessions.forEach(s => {
        const date = new Date(s.timestamp).toLocaleDateString();
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    const activityData = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14);

    // Model Distribution
    const modelMap = new Map<string, number>();
    projectSessions.forEach(s => {
        Object.entries(s.modelDistribution).forEach(([model, count]) => {
            modelMap.set(model, (modelMap.get(model) || 0) + (count as number));
        });
    });
    
    const modelData = Array.from(modelMap.entries())
        .map(([name, value]) => ({ name, value }));

    return { totalSessions, totalTokens, pendingTodos, activityData, modelData };
  }, [projectSessions, projectTodos]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title={t('dashboard.totalSessions')} value={stats.totalSessions} icon={MessageSquare} color="text-orange-600" />
        <StatCard title={t('dashboard.totalTokens')} value={stats.totalTokens.toLocaleString()} icon={Zap} color="text-yellow-600" />
        <StatCard title={t('workspace.headers.lastActive')} value={new Date(project.lastActive).toLocaleDateString()} icon={Clock} color="text-blue-600" />
        <StatCard title={t('dashboard.pendingTasks')} value={stats.pendingTodos} icon={CheckCircle2} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.sessionActivity')}</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} minTickGap={30} />
                <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                    contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid var(--tooltip-border)', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        backgroundColor: 'var(--tooltip-bg)',
                        color: 'var(--tooltip-text)'
                    }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Bar dataKey="count" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-80">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.modelUsage')}</h3>
          <div className="h-56 w-full">
             {stats.modelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={stats.modelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    >
                    {stats.modelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid var(--tooltip-border)', 
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            backgroundColor: 'var(--tooltip-bg)',
                            color: 'var(--tooltip-text)'
                        }}
                    />
                    <Legend wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">{t('dashboard.noModelData')}</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
