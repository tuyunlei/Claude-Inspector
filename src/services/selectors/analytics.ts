
import { DataStore } from '../../model/datastore';
import { ProjectStats } from '../../model/projects';

export const selectGlobalSummary = (data: DataStore) => {
  const sessions = data.sessions;
  const timestamps = sessions.map(s => s.timestamp).filter(t => t > 0);
  
  return {
    totalProjects: data.projects.length,
    totalSessions: sessions.length,
    totalTokens: sessions.reduce((acc, s) => acc + s.totalTokens, 0),
    firstActivityAt: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : undefined,
    lastActivityAt: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined,
    fileCount: data.fileCount
  };
};

export const selectGlobalActivityByDate = (data: DataStore, days = 30) => {
  const map = new Map<string, { sessions: number; tokens: number }>();
  
  data.sessions.forEach(session => {
    // Use local date string to align with user's day boundary
    const date = new Date(session.timestamp).toLocaleDateString('en-CA'); // ISO-like YYYY-MM-DD
    const entry = map.get(date) || { sessions: 0, tokens: 0 };
    entry.sessions += 1;
    entry.tokens += session.totalTokens;
    map.set(date, entry);
  });

  const sortedData = Array.from(map.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter for last N days if days > 0
  if (days > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      cutoff.setHours(0, 0, 0, 0); // Normalize to start of day

      return sortedData.filter(d => {
         // Parse YYYY-MM-DD manually to avoid UTC conversion issues
         const [y, m, day] = d.date.split('-').map(Number);
         const dateObj = new Date(y, m - 1, day);
         return dateObj >= cutoff;
      });
  }

  return sortedData;
};

export const selectTopProjectsByTokens = (data: DataStore, limit = 5): ProjectStats[] => {
  return [...data.projects]
    .sort((a, b) => b.totalTokens - a.totalTokens)
    .slice(0, limit);
};

export const selectModelUsageDistribution = (data: DataStore) => {
  const modelMap = new Map<string, number>();
  
  data.sessions.forEach(session => {
    if (session.modelDistribution) {
        Object.entries(session.modelDistribution).forEach(([model, count]) => {
            // NOTE: Currently accumulating message counts as a proxy for "Model Usage".
            // Since tokens are aggregated at the session level, exact per-model token usage
            // is not available without re-parsing raw events.
            modelMap.set(model, (modelMap.get(model) || 0) + (count as number));
        });
    }
  });

  return Array.from(modelMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};