
import { DataStore } from '../domain/datastore';
import { ProjectStats } from '../domain/projects';

export const selectProjects = (data: DataStore): ProjectStats[] => {
  return data.projects;
};
