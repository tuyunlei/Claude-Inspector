
import { DataStore } from '../../model/datastore';
import { ProjectStats } from '../../model/projects';

export const selectProjects = (data: DataStore): ProjectStats[] => {
  return data.projects;
};