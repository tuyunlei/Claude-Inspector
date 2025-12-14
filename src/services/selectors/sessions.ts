
import { DataStore } from '../../model/datastore';
import { SessionSummary } from '../../model/sessions';

export const selectSessionList = (data: DataStore): SessionSummary[] => {
  return data.sessions;
};

export const selectSessionById = (data: DataStore, id: string | null): SessionSummary | undefined => {
  if (!id) return undefined;
  return data.sessions.find((s) => s.id === id);
};