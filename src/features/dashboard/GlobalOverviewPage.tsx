
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../app/App';
import { StatCard } from '../../shared/components/StatCard';
import { FolderGit2, MessageSquare, Zap, Clock, ChevronRight, BarChart2, FileText } from 'lucide-react';
import { 
    selectGlobalSummary, 
    selectGlobalActivityByDate, 
    selectTopProjectsByTokens, 
    selectModelUsageDistribution 
} from '../../core/selectors/analytics';
import { useI18n } from '../../shared/i18n';
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
import { formatDate } from '../../shared/utils';

const COLORS = ['#ea580c', '#3b82f6', '#22c55e', '#a855f7', '#f43f5e', '#64748b'];

export const GlobalOverviewPage: React.FC = () => {
  const { data } = useData();
  const { t } = useI18n();
  const navigate = useNavigate();

  const summary = useMemo(() => selectGlobalSummary(data), [data]);
  const activityData = useMemo(() => selectGlobalActivityByDate(data, 30), [data]); // Last 30 days
  const topProjects = useMemo(() => selectTopProjectsByTokens(data, 5), [data]);
  const modelData = useMemo(() => selectModelUsageDistribution(data), [data]);

  const activityRangeLabel = useMemo(() => {
      if (!summary.firstActivityAt || !summary.lastActivityAt) return 'N/A';
      return `${summary.firstActivityAt.toLocaleDateString()} - ${summary.lastActivityAt.toLocaleDateString()}`;
  }, [summary]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 h-full overflow-y-auto">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          {t('dashboard.overview')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
            title={t('dashboard.totalProjects')} 
            value={summary.totalProjects} 
            icon={FolderGit2} 
            color="text-orange-600" 
        />
        <StatCard 
            title={t('dashboard.totalSessions')} 
            value={summary.totalSessions} 
            icon={MessageSquare} 
            color="text-blue-600" 
        />
        <StatCard 
            title={t('dashboard.totalTokens')} 
            value={summary.totalTokens.toLocaleString()} 
            icon={Zap} 
            color="text-yellow-600" 
        />
        <StatCard 
            title={t('dashboard.activityRange')} 
            value={activityRangeLabel} 
            icon={Clock} 
            color="text-green-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Trend (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[384px] flex flex-col min-w-0">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.sessionActivity')} ({t('dashboard.last30Days')})</h3>
          <div className="flex-1 w-full min-h-[250px] overflow-hidden">
            {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                    <Bar dataKey="sessions" name={t('dashboard.chartSessions')} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <BarChart2 size={48} className="mb-2 opacity-20" />
                    <p className="text-sm">{t('dashboard.noActivity30d')}</p>
                </div>
            )}
          </div>
        </div>

        {/* Model Distribution (1/3 width) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm min-h-[384px] flex flex-col min-w-0">
          <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-slate-100">{t('dashboard.modelUsage')}</h3>
          <div className="flex-1 w-full min-h-[250px] overflow-hidden">
             {modelData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={modelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    >
                    {modelData.map((entry, index) => (
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

      {/* Top Projects Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.topProjects')}</h3>
            <button 
                onClick={() => navigate('/projects')}
                className="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1"
            >
                {t('common.viewAll')} <ChevronRight size={16} />
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">{t('projects.columns.project')}</th>
                <th className="px-6 py-3 text-right">{t('projects.columns.tokens')}</th>
                <th className="px-6 py-3 text-right">{t('projects.columns.messages')}</th>
                <th className="px-6 py-4 text-right">{t('projects.columns.lastActive')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {topProjects.map((p) => (
                <tr 
                    key={p.id} 
                    onClick={() => navigate(`/project/${encodeURIComponent(p.id)}`)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                          <FolderGit2 size={16} className="text-slate-400" />
                          {p.name}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400 font-mono">
                      {p.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                      {p.sessionCount}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-500">
                      {formatDate(p.lastActive)}
                  </td>
                </tr>
              ))}
              {topProjects.length === 0 && (
                  <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">{t('dashboard.noActivity')}</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
