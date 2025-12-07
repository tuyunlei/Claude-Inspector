import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { UploadCloud, Settings, FolderGit2, Globe, MonitorCog, PanelLeftClose, PanelLeftOpen, Sun, Moon, Languages, Menu, X, Monitor } from 'lucide-react';
import { cn } from '../utils';
import { useData } from '../../app/App';
import { useI18n } from '../i18n';
import { useTheme, Theme } from '../theme';
import { selectProjects } from '../../core/selectors/projects';
import { GLOBAL_SESSIONS_ID, SYSTEM_SESSIONS_ID } from '../../core/analytics/projects';

interface SidebarProps {
  onReset: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onReset, isOpen, onCloseMobile }) => {
  const { data } = useData();
  const projects = selectProjects(data);
  const { t } = useI18n();
  const location = useLocation();

  // Helper to determine active state including nested routes
  const isProjectActive = (id: string) => {
      return location.pathname.startsWith(`/project/${encodeURIComponent(id)}`);
  };
  
  const getProjectIcon = (type: string) => {
      switch(type) {
          case 'global': return <Globe size={18} />;
          case 'system': return <MonitorCog size={18} />;
          default: return <FolderGit2 size={18} />;
      }
  };

  const getProjectLabel = (p: any) => {
    if (p.id === GLOBAL_SESSIONS_ID) return t('projects.groups.globalTitle');
    if (p.id === SYSTEM_SESSIONS_ID) return t('projects.groups.systemTitle');
    return p.name;
  };

  return (
    <div className={cn(
        "bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col h-full border-r border-slate-800 transition-all duration-300",
        isOpen ? "w-64" : "w-0 md:w-16 overflow-hidden"
    )}>
      {/* Sidebar Header (Logo Area) - Only visible when open or on desktop collapsed */}
      <div className="p-4 h-14 flex items-center shrink-0 border-b border-slate-800">
         <div className={cn("flex items-center gap-2 font-bold text-white transition-opacity", !isOpen && "md:justify-center md:w-full")}>
            <span className={cn("text-orange-500", !isOpen && "md:hidden")}>Claude</span> 
            {isOpen ? <span>Inspector</span> : <span className="hidden md:block text-orange-500">I</span>}
         </div>
         {/* Mobile Close Button */}
         <button onClick={onCloseMobile} className="md:hidden ml-auto text-slate-400 hover:text-white">
             <X size={20} />
         </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <div className={cn("text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 transition-opacity", !isOpen && "md:hidden")}>
             {t('sidebar.projects')}
        </div>
        
        {projects.length === 0 && isOpen && (
            <div className="px-4 text-sm text-slate-500">{t('sidebar.noProjects')}</div>
        )}

        {projects.map((p) => (
            <NavLink
                key={p.id}
                to={`/project/${encodeURIComponent(p.id)}`}
                onClick={onCloseMobile}
                title={!isOpen ? getProjectLabel(p) : undefined}
                className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm",
                    isProjectActive(p.id)
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20"
                        : "hover:bg-slate-800 hover:text-white",
                    !isOpen && "justify-center px-0"
                )}
            >
                {getProjectIcon(p.groupType)}
                <span className={cn("truncate font-medium", !isOpen && "md:hidden")}>
                    {getProjectLabel(p)}
                </span>
            </NavLink>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-2 border-t border-slate-800 space-y-1">
         <NavLink
            to="/config"
            onClick={onCloseMobile}
            title={!isOpen ? t('sidebar.globalConfig') : undefined}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-xs hover:bg-slate-800 hover:text-white",
                isActive ? "text-orange-400 bg-slate-800" : "text-slate-400",
                !isOpen && "justify-center"
            )}
         >
             <Settings size={16} />
             <span className={cn(!isOpen && "md:hidden")}>{t('sidebar.globalConfig')}</span>
         </NavLink>

         <button
          onClick={onReset}
          title={!isOpen ? t('sidebar.upload') : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors text-xs hover:bg-slate-800 hover:text-white text-slate-400",
            !isOpen && "justify-center"
          )}
        >
          <UploadCloud size={16} />
          <span className={cn(!isOpen && "md:hidden")}>{t('sidebar.upload')}</span>
        </button>
      </div>
    </div>
  );
};

export const Layout: React.FC<{ hasData: boolean; onReset: () => void }> = ({ hasData, onReset }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useI18n();
  const { t } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const cycleTheme = () => {
    const modes: Theme[] = ['system', 'light', 'dark'];
    const next = modes[(modes.indexOf(theme) + 1) % modes.length];
    setTheme(next);
  };

  const getThemeIcon = () => {
    switch(theme) {
      case 'dark': return <Moon size={16} />;
      case 'light': return <Sun size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  if (!hasData) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
      )}

      {/* Sidebar Container */}
      <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0",
           mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
         <Sidebar 
            onReset={onReset} 
            isOpen={desktopSidebarOpen}
            onCloseMobile={() => setMobileMenuOpen(false)} 
         />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
          {/* Global Header */}
          <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 shadow-sm z-30">
              <div className="flex items-center gap-3">
                  {/* Mobile Toggle */}
                  <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                      <Menu size={20} />
                  </button>
                  
                  {/* Desktop Toggle */}
                  <button onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)} className="hidden md:block p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title={desktopSidebarOpen ? t('sidebar.collapse') : t('sidebar.expand')}>
                      {desktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                  </button>
              </div>

              <div className="flex items-center gap-2">
                  <button onClick={cycleTheme} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title={t(`theme.${theme}`)}>
                      {getThemeIcon()}
                  </button>
                   <button onClick={toggleLanguage} className="flex items-center gap-1 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs">
                      <Languages size={16} />
                      {language === 'en' ? 'EN' : '中'}
                  </button>
              </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
              <Outlet />
          </main>
      </div>
    </div>
  );
};