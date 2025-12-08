
import { DataStore } from '../datastore';
import { ProjectStats } from '../projects';

export const selectProjects = (data: DataStore): ProjectStats[] => {
  return data.projects;
};
