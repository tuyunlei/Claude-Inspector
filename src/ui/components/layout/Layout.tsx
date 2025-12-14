import React from 'react';
import { Outlet } from 'react-router-dom';

export const Layout: React.FC<{ hasData: boolean; onReset: () => void; onConfigUpload?: (file: File) => void }> = ({ hasData }) => {
  if (!hasData) {
    return <Outlet />;
  }

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
       <Outlet />
    </div>
  );
};