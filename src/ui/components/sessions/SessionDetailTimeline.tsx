import React from 'react';
import {
  List,
  useDynamicRowHeight,
  useListRef,
} from 'react-window';
import { Search, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ClaudeEvent } from '../../../model/events';
import { useElementSize } from '../hooks/useElementSize';
import { TimelineRow, RowData } from './SessionDetailTimelineRow';

interface SessionDetailTimelineProps {
  events: ClaudeEvent[];
  query: string;
  onQueryChange: (val: string) => void;
  onExpandList?: () => void;
  showSystemFooter?: boolean;
}

interface TimelineHeaderProps {
  query: string;
  onQueryChange: (val: string) => void;
  onExpandList?: () => void;
  t: (key: string, args?: Record<string, string>) => string;
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  query,
  onQueryChange,
  onExpandList,
  t,
}) => {
  return (
    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 z-20">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2 text-slate-400 group-focus-within:text-orange-500" size={14} />
          <input
            type="text"
            placeholder={t('sessions.searchInSession')}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100"
          />
        </div>
        
        {onExpandList && (
           <button 
             onClick={onExpandList} 
             className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
             title="Show List"
           >
              <PanelLeftOpen size={18} />
           </button>
        )}
      </div>
  );
};

export const SessionDetailTimeline: React.FC<SessionDetailTimelineProps> = ({
  events,
  query,
  onQueryChange,
  onExpandList,
  showSystemFooter,
}) => {
  const { t } = useI18n();
  const listRef = useListRef(null);
  const { ref: containerRef, size: dimensions } = useElementSize<HTMLDivElement>();

  const hasSystemFooter = !!showSystemFooter;
  const baseRowCount = events.length + 2; // start + end
  const rowCount = hasSystemFooter ? baseRowCount + 1 : baseRowCount;

  // v2: Use useDynamicRowHeight hook for dynamic row heights
  // The key parameter ensures cache is reset when events change
  const DEFAULT_EVENT_HEIGHT = 100;
  const dynamicRowHeight = useDynamicRowHeight({
    defaultRowHeight: DEFAULT_EVENT_HEIGHT,
    key: events.length, // Reset cache when events change
  });

  const rowProps: RowData = {
    events,
    query,
    hasSystemFooter,
    t,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      
      <TimelineHeader
        query={query}
        onQueryChange={onQueryChange}
        onExpandList={onExpandList}
        t={t}
      />

      {/* Virtualized List Container */}
      <div className="flex-1 min-h-0" ref={containerRef}>
        {events.length === 0 ? (
           <div className="p-6 h-full flex flex-col items-center justify-center opacity-50">
               <div className="text-center text-slate-400 text-sm italic">
                  {t('sessions.noChatEvents')}
               </div>
           </div>
        ) : (
            dimensions.height > 0 && (
                <List
                  listRef={listRef}
                  rowComponent={TimelineRow}
                  rowCount={rowCount}
                  rowHeight={dynamicRowHeight}
                  rowProps={rowProps}
                  overscanCount={8}
                  style={{ height: dimensions.height, width: dimensions.width }}
                />
            )
        )}
      </div>
    </div>
  );
};