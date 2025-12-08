import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../../app/App';
import { selectSessionList, selectSessionById } from '../../../core/selectors/sessions';
import { selectProjects } from '../../../core/selectors/projects';
import { sessionToMarkdown, downloadTextFile, copyMarkdownToClipboard } from '../../../core/exports/sessionMarkdown';
import { buildRenderEvents } from '../viewModel';

interface UseSessionControllerProps {
    initialProjectId?: string;
}

export type DateRangeOption = 'all' | '7d' | '30d';

export const useSessionController = (props?: UseSessionControllerProps) => {
  const { data } = useData();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filter, setFilter] = useState('');
  const [inSessionQuery, setInSessionQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');
  
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

  const visibleSessions = useMemo(() => {
    // 1. Calculate Date Cutoff
    let cutoff = 0;
    if (dateRange !== 'all') {
        const d = new Date();
        if (dateRange === '7d') d.setDate(d.getDate() - 7);
        if (dateRange === '30d') d.setDate(d.getDate() - 30);
        cutoff = d.getTime();
    }

    const result = sessionList.filter(s => {
        // Project Filter
        if (selectedProject) {
            if (s.primaryProjectId !== selectedProject) return false;
        }

        // Date Filter
        if (cutoff > 0 && s.timestamp < cutoff) return false;
        
        // Text Search
        const search = filter.toLowerCase();
        return (
            s.display.toLowerCase().includes(search) || 
            (s.primaryProjectPath || '').toLowerCase().includes(search)
        );
    });

    return result;
  }, [sessionList, filter, selectedProject, dateRange]);

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
      sessions: visibleSessions,
      selectedSessionId,
      setSelectedSessionId,
      selectedSession,
      inSessionQuery,
      setInSessionQuery,
      renderEvents,
      handleDownload,
      handleCopy,
      copied,
      dateRange,
      setDateRange
  };
};