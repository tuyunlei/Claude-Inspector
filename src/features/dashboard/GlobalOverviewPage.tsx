import React, { useMemo } from 'react';
import { useData } from '../../app/App';
import { StatCard } from './components/StatCard';
import { FolderGit2, MessageSquare, Zap, Clock, Database } from 'lucide-react';

export const GlobalOverviewPage: React.FC = () => {
  const { data } = useData();

  const stats = useMemo(() => {
    const totalProjects = data.projects.length;
    const totalSessions = data.sessions.length;
    const totalTokens = data.sessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const totalFiles = data.fileCount;
    
    // Find most recent activity across all sessions
    const lastActiveTimestamp = data.sessions.length > 0 
        ? Math.max(...data.sessions.map(s => s.timestamp)) 
        : Date.now();

    return { totalProjects, totalSessions, totalTokens, totalFiles, lastActiveTimestamp };
  }, [data]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Global Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Summary of all Claude Code activity in your local environment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Projects" 
            value={stats.totalProjects} 
            icon={FolderGit2} 
            color="text-orange-600" 
        />
        <StatCard 
            title="Total Sessions" 
            value={stats.totalSessions} 
            icon={MessageSquare} 
            color="text-blue-600" 
        />
        <StatCard 
            title="Total Tokens" 
            value={stats.totalTokens.toLocaleString()} 
            icon={Zap} 
            color="text-yellow-600" 
        />
        <StatCard 
            title="Last Active" 
            value={new Date(stats.lastActiveTimestamp).toLocaleDateString()} 
            icon={Clock} 
            color="text-green-600" 
        />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Database size={20} className="text-slate-400" />
            Data Summary
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                 <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Files Processed</div>
                 <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stats.totalFiles}</div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                 <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Global Config Status</div>
                 <div className="text-lg font-medium text-slate-800 dark:text-slate-200">
                     {data.config.settings ? 'Loaded' : 'Not Found'}
                 </div>
             </div>
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                 <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">MCP Servers</div>
                 <div className="text-lg font-medium text-slate-800 dark:text-slate-200">
                     {Object.keys(data.config.mcpServers || {}).length} Configured
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};