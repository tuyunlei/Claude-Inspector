import React, { useRef, useState, useLayoutEffect, useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Search, Activity, PanelLeftOpen } from 'lucide-react';
import { useI18n } from '../../i18n';
import { ClaudeEvent } from '../../../model/events';
import { EventRow } from './EventRow';

interface SessionDetailTimelineProps {
  events: ClaudeEvent[];
  query: string;
  onQueryChange: (val: string) => void;
  onExpandList?: () => void;
  showSystemFooter?: boolean;
}

// Height estimates for virtual list items
const ITEM_HEIGHT_EVENT = 120;
const ITEM_HEIGHT_MARKER = 64; // increased slightly to account for margins
const ITEM_HEIGHT_FOOTER = 160;

type TimelineRowKind = 'start' | 'event' | 'end' | 'footer';

function getRowKind(index: number, eventsLength: number, hasFooter: boolean): { kind: TimelineRowKind; eventIndex?: number } {
  if (index === 0) {
    return { kind: 'start' };
  }
  if (index === eventsLength + 1) {
    return { kind: 'end' };
  }
  if (hasFooter && index === eventsLength + 2) {
    return { kind: 'footer' };
  }
  // 1..eventsLength corresponds to events[0..N-1]
  return { kind: 'event', eventIndex: index - 1 };
}

export const SessionDetailTimeline: React.FC<SessionDetailTimelineProps> = ({
  events,
  query,
  onQueryChange,
  onExpandList,
  showSystemFooter
}) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<List | null>(null);
  const [listHeight, setListHeight] = useState<number>(0);
  const [listWidth, setListWidth] = useState<number>(0);

  const hasSystemFooter = !!showSystemFooter;
  const baseItemCount = events.length + 2; // start + end
  const itemCount = hasSystemFooter ? baseItemCount + 1 : baseItemCount;

  useLayoutEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        setListHeight(containerRef.current.clientHeight);
        setListWidth(containerRef.current.clientWidth);
      }
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getItemSize = useCallback(
    (index: number) => {
      const { kind } = getRowKind(index, events.length, hasSystemFooter);
      if (kind === 'event') return ITEM_HEIGHT_EVENT;
      if (kind === 'footer') return ITEM_HEIGHT_FOOTER;
      // start / end markers
      return ITEM_HEIGHT_MARKER;
    },
    [events.length, hasSystemFooter]
  );

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { kind, eventIndex } = getRowKind(index, events.length, hasSystemFooter);
    
    // Adjust style to account for horizontal padding of container
    const rowStyle = { ...style, paddingLeft: '1rem', paddingRight: '1rem' };
    const mdRowStyle = { ...style, paddingLeft: '1.5rem', paddingRight: '1.5rem' };
    
    // Determine effective style based on a simple heuristic or just apply padding inside the div
    // Since we can't easily switch style based on media query in JS without a listener, 
    // we will apply the padding via classNames inside the wrapper, and let 'style' control layout.
    // However, react-window style sets width: 100%. If we want padding, we should put a div inside.

    if (kind === 'start') {
      return (
        <div style={style} className="px-4 md:px-6 flex items-center justify-center gap-3 opacity-50">
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Start of Session
          </span>
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
        </div>
      );
    }

    if (kind === 'end') {
      return (
        <div style={style} className="px-4 md:px-6 flex items-center justify-center gap-3 opacity-30">
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            End of Session
          </span>
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
        </div>
      );
    }

    if (kind === 'footer') {
      return (
        <div style={style} className="px-4 md:px-6 flex items-center justify-center">
          <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto w-full">
            <Activity size={24} className="mx-auto mb-2 text-slate-400" />
            <p className="mb-2 font-medium">{t('sessions.systemView.description')}</p>
            <p className="opacity-75">{t('sessions.systemView.safeToIgnore')}</p>
          </div>
        </div>
      );
    }

    // kind === 'event'
    if (eventIndex == null || eventIndex < 0 || eventIndex >= events.length) {
      return null;
    }

    const event = events[eventIndex];

    return (
      <div style={style} className="px-4 md:px-6 w-full">
        <EventRow
          key={event.uuid || eventIndex}
          event={event}
          query={query}
          index={eventIndex}
        />
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Bar / Toolbar Area */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 sticky top-0 z-10">
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
        
        {/* Optional Expand List Button (Contextual) */}
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

      {/* Timeline Scroll Area */}
      <div 
        ref={containerRef}
        className="flex-1 bg-slate-50 dark:bg-slate-950 min-h-0"
      >
        {events.length === 0 ? (
          <div className="p-6">
            <div className="flex items-center justify-center gap-3 opacity-50 mb-8">
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Start of Session</span>
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
            </div>
            
            <div className="text-center py-12 text-slate-400 text-sm italic border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
              {t('sessions.eventCount')}: 0
            </div>

            <div className="flex items-center justify-center gap-3 opacity-30 mt-8 mb-4">
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">End of Session</span>
                <div className="h-px w-12 bg-slate-300 dark:bg-slate-600"></div>
            </div>
          </div>
        ) : (
          listHeight > 0 && (
            <List
              height={listHeight}
              width={listWidth || '100%'}
              itemCount={itemCount}
              itemSize={getItemSize}
              overscanCount={8}
              ref={listRef}
              className="scroll-smooth"
            >
              {Row}
            </List>
          )
        )}
      </div>
    </div>
  );
};
