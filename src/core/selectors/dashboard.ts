
import { DataStore } from '../domain/datastore';

export const selectDashboardStats = (data: DataStore) => {
    const totalSessions = data.sessions.length;
    const totalTokens = data.sessions.reduce((acc, s) => acc + s.totalTokens, 0);
    const totalProjects = data.projects.length;
    const pendingTodos = data.todos.filter(t => t.status === 'pending').length;
    
    // Chart Data: Activity by Date (Last 7 active days)
    const dateMap = new Map<string, number>();
    data.sessions.forEach(s => {
        const date = new Date(s.timestamp).toLocaleDateString();
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    
    const activityData = Array.from(dateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-14); // Last 14 days

    // Chart Data: Model Distribution
    const modelMap = new Map<string, number>();
    data.sessions.forEach(s => {
        Object.entries(s.modelDistribution).forEach(([model, count]) => {
            modelMap.set(model, (modelMap.get(model) || 0) + (count as number));
        });
    });
    
    const modelData = Array.from(modelMap.entries())
        .map(([name, value]) => ({ name, value }));

    return { totalSessions, totalTokens, totalProjects, pendingTodos, activityData, modelData };
};
