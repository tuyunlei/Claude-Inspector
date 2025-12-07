
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = "text-blue-600" }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
        <div className={`p-2 bg-slate-50 dark:bg-slate-700 rounded-lg ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {trend && <span className="text-xs text-slate-400 mb-1">{trend}</span>}
      </div>
    </div>
  );
}
