import React from 'react';
import { History } from 'lucide-react';

export function GlobalHistoryPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
      <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-full mb-4">
        <History size={48} className="text-slate-400 dark:text-slate-600" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Global History</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2">
        A unified timeline of all sessions across all projects will be implemented here.
      </p>
    </div>
  );
}