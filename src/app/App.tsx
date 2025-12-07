import React, { createContext, useContext, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UploadPage } from '../features/upload/UploadPage';
import { ConfigPage } from '../features/config/ConfigPage';
import { Layout } from '../shared/components/Layout';
import { ProjectWorkspacePage } from '../features/projects/ProjectWorkspacePage';
import { GlobalOverviewPage } from '../features/dashboard/GlobalOverviewPage';
import { GlobalHistoryPage } from '../features/history/GlobalHistoryPage';
import { GlobalFilesPage } from '../features/structure/GlobalFilesPage';
import { ProjectDirectoryPage } from '../features/projects/ProjectDirectoryPage';
import { DataStore } from '../types';
import { I18nProvider } from '../shared/i18n';
import { ThemeProvider } from '../shared/theme';

const DataContext = createContext<{ data: DataStore } | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataContext');
  return context;
};

// Extracted ProtectedRoute component
const ProtectedRoute: React.FC<{ isAllowed: boolean; children: React.ReactNode }> = ({ isAllowed, children }) => {
    if (!isAllowed) return <Navigate to="/" replace />;
    return <>{children}</>;
};

const AppRoutes = () => {
    const [data, setData] = useState<DataStore | null>(null);
    const navigate = useNavigate();

    const handleDataLoaded = (store: DataStore) => {
        setData(store);
        navigate('/overview');
    };

    const handleReset = () => {
        setData(null);
        navigate('/');
    };
    
    const hasData = !!data;

    return (
        <DataContext.Provider value={data ? { data } : undefined}>
            <Routes>
                {/* Public / Upload Route */}
                <Route path="/" element={
                     !data ? <UploadPage onDataLoaded={handleDataLoaded} /> : <Navigate to="/overview" replace />
                } />

                {/* Main App Layout */}
                <Route element={<Layout hasData={hasData} onReset={handleReset} />}>
                    
                    {/* New Top-Level Routes */}
                    <Route path="/overview" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <GlobalOverviewPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/history" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <GlobalHistoryPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/files" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <GlobalFilesPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/projects" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <ProjectDirectoryPage />
                        </ProtectedRoute>
                    } />

                    {/* Existing Project Workspace */}
                    <Route path="/project/:projectId" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <ProjectWorkspacePage />
                        </ProtectedRoute>
                    } />

                    {/* Config */}
                    <Route path="/config" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <ConfigPage />
                        </ProtectedRoute>
                    } />

                    {/* Catch-all Redirect */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                    
                </Route>
            </Routes>
        </DataContext.Provider>
    );
};

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </ThemeProvider>
    </I18nProvider>
  );
}