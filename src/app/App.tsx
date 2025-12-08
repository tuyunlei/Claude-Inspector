import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { UploadPage } from '../ui/pages/UploadPage';
import { ConfigPage } from '../ui/pages/ConfigPage';
import { Layout } from '../ui/components/layout/Layout';
import { ProjectWorkspacePage } from '../ui/pages/ProjectWorkspace/ProjectWorkspacePage';
import { DashboardPage } from '../ui/pages/DashboardPage';
import { GlobalHistoryPage } from '../ui/pages/GlobalHistoryPage';
import { GlobalFilesPage } from '../ui/pages/GlobalFilesPage';
import { ProjectDirectoryPage } from '../ui/pages/Projects/ProjectDirectoryPage';
import { MarkdownDebugPage } from '../ui/pages/MarkdownDebugPage';
import { DataStore } from '../model/datastore';
import { I18nProvider } from '../ui/i18n';
import { ThemeProvider } from '../ui/theme';
import { DataContext } from './DataContext';

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

    const handleConfigUpload = async (file: File) => {
        if (!data) return;
        try {
            const text = await file.text();
            let json;
            try {
                json = JSON.parse(text);
            } catch (e) {
                 alert("Invalid JSON file");
                 return;
            }
            
            // Shallow clone data
            const newData = { ...data };
            // Clone config to avoid mutation
            newData.config = { ...data.config };
            
            // Update raw and merged
            newData.config.extraMcpJson = text;
            if (json.mcpServers) {
                newData.config.mcpServers = {
                    ...(newData.config.mcpServers || {}),
                    ...json.mcpServers
                };
            }
            
            setData(newData);
            navigate('/config');
        } catch (e) {
            console.error(e);
            alert("Failed to process config file");
        }
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
                <Route element={<Layout hasData={hasData} onReset={handleReset} onConfigUpload={handleConfigUpload} />}>
                    
                    {/* New Top-Level Routes */}
                    <Route path="/overview" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <DashboardPage />
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

                    {/* Markdown Debug */}
                    <Route path="/debug/markdown" element={
                        <ProtectedRoute isAllowed={hasData}>
                            <MarkdownDebugPage />
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