
import { DataStore } from '../domain/datastore';
import { SessionSummary } from '../domain/sessions';

export const selectSessionList = (data: DataStore): SessionSummary[] => {
  return data.sessions;
};

export const selectSessionById = (data: DataStore, id: string | null): SessionSummary | undefined => {
  if (!id) return undefined;
  return data.sessions.find((s) => s.id === id);
};
