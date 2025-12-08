
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../../app/App';
import { MessageSquare, Zap, Clock, CheckCircle2, BarChart2, ChevronRight, FileText } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { ProjectStats } from '../../../types';
import { selectSessionsByProject, selectTodosByProject } from '../../../core/selectors/context';
import { StatCard } from '../../../shared/components/StatCard';
import { formatDate } from '../../../shared/utils';
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

const COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#f43f5e', '#64748b'];

interface ProjectOverviewViewProps {
    project: ProjectStats;
}

export const ProjectOverviewView: React.FC<ProjectOverviewViewProps> = ({ project }) => {
  const { data } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();

  const projectSessions = useMemo(() => selectSessionsByProject(data, project.id), [data, project.id]);
  const projectTodos = useMemo(() => selectTodosByProject(data, project.id), [data, project.id]);

  const stats = useMemo(() => {
    const totalSessions = projectSessions.length;
    const totalTokens = projectSessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const pendingTodos = projectTodos.filter(t => t.status === 'pending').length;
    
    // Activity by Date (Last 30 active days to match Global)
    const dateMap = new Map<string, number>();
    projectSessions.forEach(s => {
        const date = new Date(s.timestamp).toLocaleDateString('en-CA');
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    const activityData = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30);

    // Model Distribution
    const modelMap = new Map<string, number>();
    projectSessions.forEach(s => {
        Object.entries(s.modelDistribution).forEach(([model, count]) => {
            modelMap.set(model, (modelMap.get(model) || 0) + (count as number));
        });
    });
    
    const modelData = Array.from(modelMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // Recent Sessions (Top 5)
    const recentSessions = [...projectSessions]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    return { totalSessions, totalTokens, pendingTodos, activityData, modelData, recentSessions };
  }, [projectSessions, projectTodos]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto h-full overflow-y-auto">
      {/* Stats Grid - Aligned with Global Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
            title={t('dashboard.totalSessions')} 
            value={stats.totalSessions} 
            icon={MessageSquare} 
            color="text-blue-600" 
        />
        <StatCard 
            title={t('dashboard.totalTokens')} 
            value={stats.totalTokens.toLocaleString()} 
            icon={Zap} 
            color="text-yellow-600" 
        />
        <StatCard 
            title={t('workspace.headers.lastActive')} 
            value={new Date(project.lastActive).toLocaleDateString()} 
            icon={Clock} 
            color="text-green-600" 
        />
        <StatCard 
            title={t('dashboard.pendingTasks')} 
            value={stats.pendingTodos} 
            icon={CheckCircle2} 
            color="text-orange-600" 
        />
      </div>

      {/* Charts Section - Aligned with Global Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Activity Trend (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[384px] flex flex-col min-w-0">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.sessionActivity')}</h3>
          <div className="flex-1 w-full min-h-[250px] overflow-hidden">
             {stats.activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 10, fill: '#94a3b8'}} 
                        minTickGap={30} 
                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
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
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Bar dataKey="count" name={t('dashboard.chartSessions')} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <BarChart2 size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">{t('dashboard.noActivity')}</p>
                </div>
             )}
          </div>
        </div>

        {/* Model Usage (1/3 width) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[384px] flex flex-col min-w-0">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.modelUsage')}</h3>
          <div className="flex-1 w-full min-h-[250px] overflow-hidden">
             {stats.modelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={stats.modelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
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
                    <Legend wrapperStyle={{fontSize: '11px'}} layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
                </ResponsiveContainer>
             ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">{t('dashboard.noModelData')}</div>
             )}
          </div>
        </div>
      </div>

      {/* Recent Sessions List - Aligns with 'Top Projects' section in Global Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recentSessions')}</h3>
            <button 
                onClick={() => navigate(`/project/${encodeURIComponent(project.id)}?tab=history`)}
                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
            >
                {t('dashboard.viewAllHistory')} <ChevronRight size={16} />
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">{t('projects.columns.session')}</th>
                <th className="px-6 py-3 text-right">{t('projects.columns.tokens')}</th>
                <th className="px-6 py-3 text-right">{t('projects.columns.messages')}</th>
                <th className="px-6 py-4 text-right">{t('projects.columns.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {stats.recentSessions.map((s) => (
                <tr 
                    key={s.id} 
                    onClick={() => navigate(`/project/${encodeURIComponent(project.id)}?tab=history&session=${encodeURIComponent(s.id)}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="truncate max-w-xs" title={s.display}>{s.display}</span>
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400 font-mono">
                      {s.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                      {s.messageCount}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-500">
                      {formatDate(s.timestamp)}
                  </td>
                </tr>
              ))}
              {stats.recentSessions.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">{t('dashboard.noRecent')}</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
