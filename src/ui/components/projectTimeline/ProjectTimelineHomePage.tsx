
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n';
import { useData } from '../../../DataContext';
import { selectProjectTimeline } from '../../../services/selectors/projectTimeline/index';
import { selectProjectIdentities, buildUniqueProjectDisplayNames } from '../../../services/selectors/projectIdentity/index';

import { ProjectListView } from './ProjectListView';
import { ProjectDetailView } from './ProjectDetailView';
import { useMergedBlocks } from '../../hooks/useMergedBlocks';

export const ProjectTimelineHomePage: React.FC = () => {
  const { t } = useI18n();
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 1. Get Context
  const projectId = searchParams.get('projectId');
  
  // 2. Get Project Display Info
  const projectIdentities = useMemo(() => selectProjectIdentities(data), [data]);
  const displayNames = useMemo(() => buildUniqueProjectDisplayNames(projectIdentities), [projectIdentities]);
  
  const currentProject = useMemo(() => 
    projectId ? projectIdentities.find(p => p.id === projectId) : null, 
  [projectId, projectIdentities]);

  const displayName = currentProject 
    ? (displayNames.get(currentProject.id) || currentProject.canonicalPath.split('/').pop() || currentProject.id)
    : t('common.unknown');

  // 3. Get Raw Timeline Data
  const rawBlocks = useMemo(() => {
      if (!projectId) return [];
      return selectProjectTimeline(data, projectId);
  }, [data, projectId]);

  // 4. Merge "Tool Result Only" Blocks
  const blocks = useMergedBlocks(rawBlocks);

  const handleBack = () => {
      // Clear project ID to return to list view
      setSearchParams({});
  };

  const handleSelectProject = (id: string) => {
      setSearchParams({ projectId: id });
  };

  if (!projectId) {
      return (
          <ProjectListView 
              projectIdentities={projectIdentities} 
              displayNames={displayNames} 
              onSelectProject={handleSelectProject} 
          />
      );
  }

  return (
      <ProjectDetailView 
          projectId={projectId}
          displayName={displayName}
          currentProject={currentProject}
          blocks={blocks}
          onBack={handleBack}
      />
  );
};