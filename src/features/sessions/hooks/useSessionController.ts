
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../../app/App';
import { selectSessionList, selectSessionById } from '../../../core/selectors/sessions';
import { selectProjects } from '../../../core/selectors/projects';
import { sessionToMarkdown, downloadTextFile, copyMarkdownToClipboard } from '../../../core/exports/sessionMarkdown';
import { buildRenderEvents } from '../viewModel';
import { SessionStoryRole } from '../../../core/domain/sessions';

interface UseSessionControllerProps {
    initialProjectId?: string;
}

export const useSessionController = (props?: UseSessionControllerProps) => {
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filter, setFilter] = useState('');
  const [inSessionQuery, setInSessionQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<SessionStoryRole>('chat');
  
  // URL State / Props logic
  // Priority: 1. props.initialProjectId (if passed by workspace) 2. URL param (legacy)
  const selectedProject = props?.initialProjectId || searchParams.get('project') || '';
  const selectedSessionId = searchParams.get('session');

  const sessionList = useMemo(() => selectSessionList(data), [data]);
  const projects = useMemo(() => selectProjects(data), [data]);

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const setSelectedSessionId = (sessionId: string | null) => {
      updateParam('session', sessionId);
  };

  // Allow updating project param ONLY if we are not in forced mode
  const setSelectedProject = (projectId: string) => {
     if (!props?.initialProjectId) {
         updateParam('project', projectId);
     }
  };

  const filteredSessions = useMemo(() => {
    const result = sessionList.filter(s => {
        if (s.storyRole !== viewMode) return false;
        
        if (selectedProject) {
            if (s.primaryProjectId !== selectedProject) return false;
        }
        
        const search = filter.toLowerCase();
        return (
            s.display.toLowerCase().includes(search) || 
            (s.primaryProjectPath || '').toLowerCase().includes(search)
        );
    });

    return result;
  }, [sessionList, filter, selectedProject, viewMode]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return undefined;
    const session = selectSessionById(data, selectedSessionId);
    if (!session) return undefined;
    
    // Strict match: If a project is selected, ensure session belongs to it
    if (selectedProject && session.primaryProjectId !== selectedProject) return undefined;
    
    return session;
  }, [data, selectedSessionId, selectedProject]);

  const renderEvents = useMemo(() => 
    buildRenderEvents(selectedSession?.events || []), 
  [selectedSession]);

  useEffect(() => {
    if (selectedSession) {
        setInSessionQuery('');
    }
  }, [selectedSession]);

  const handleSetViewMode = (newMode: SessionStoryRole) => {
    setViewMode(newMode);
    if (selectedSession && selectedSession.storyRole !== newMode) {
        setSelectedSessionId(null);
    }
  };

  useEffect(() => {
      if (selectedSession && selectedSession.storyRole !== viewMode) {
          setViewMode(selectedSession.storyRole);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession]);

  const handleDownload = () => {
      if (!selectedSession) return;
      const markdown = sessionToMarkdown(selectedSession);
      const filename = `claude-session-${selectedSession.id.slice(0, 8)}.md`;
      downloadTextFile(filename, markdown);
  };

  const handleCopy = async () => {
      if (!selectedSession) return;
      const markdown = sessionToMarkdown(selectedSession);
      const success = await copyMarkdownToClipboard(markdown);
      if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return {
      filter,
      setFilter,
      selectedProject,
      setSelectedProject,
      projects,
      filteredSessions,
      selectedSessionId,
      setSelectedSessionId,
      selectedSession,
      inSessionQuery,
      setInSessionQuery,
      renderEvents,
      handleDownload,
      handleCopy,
      copied,
      viewMode,
      setViewMode: handleSetViewMode
  };
};
