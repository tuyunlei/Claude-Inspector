import React, {
  useRef,
  useEffect,
  useState,
  ReactElement,
} from 'react';
import {
  List,
  RowComponentProps,
  useDynamicRowHeight,
  useListRef,
} from 'react-window';
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

// -- Row Modeling --
type TimelineRowKind = 'start' | 'event' | 'end' | 'footer';

function getRowKind(
  index: number,
  eventsLength: number,
  hasFooter: boolean,
): { kind: TimelineRowKind; eventIndex?: number } {
  if (index === 0) return { kind: 'start' };
  if (index === eventsLength + 1) return { kind: 'end' };
  if (hasFooter && index === eventsLength + 2) return { kind: 'footer' };
  return { kind: 'event', eventIndex: index - 1 };
}

// -- Row Data Interface (v2: passed via rowProps, destructured directly in component) --
interface RowData {
  events: ClaudeEvent[];
  query: string;
  hasSystemFooter: boolean;
  t: (key: string, args?: Record<string, string>) => string;
}

// -- Row Component (v2: props are destructured directly, not from data) --
function TimelineRow({
  index,
  style,
  events,
  query,
  hasSystemFooter,
  t,
}: RowComponentProps<RowData>): ReactElement {
  const { kind, eventIndex } = getRowKind(index, events.length, hasSystemFooter);

  // v2: Row elements are automatically observed by useDynamicRowHeight's observeRowElements
  // We add data-index attribute for the observer to identify rows

  if (kind === 'start') {
    return (
      <div style={style} data-index={index}>
        <div className="px-4 md:px-6 py-8 flex items-center justify-center gap-3 opacity-50">
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            Start of Session
          </span>
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
        </div>
      </div>
    );
  }

  if (kind === 'end') {
    return (
      <div style={style} data-index={index}>
        <div className="px-4 md:px-6 py-8 flex items-center justify-center gap-3 opacity-30">
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
            End of Session
          </span>
          <div className="h-px w-12 bg-slate-300 dark:bg-slate-600" />
        </div>
      </div>
    );
  }

  if (kind === 'footer') {
    return (
      <div style={style} data-index={index}>
        <div className="px-4 md:px-6 py-8 flex items-center justify-center">
          <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-lg text-center text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 max-w-lg mx-auto w-full">
            <Activity size={24} className="mx-auto mb-2 text-slate-400" />
            <p className="mb-2 font-medium">{t('sessions.systemView.description')}</p>
            <p className="opacity-75">{t('sessions.systemView.safeToIgnore')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Event Row
  if (eventIndex == null || eventIndex < 0 || eventIndex >= events.length) {
    return <div style={style} data-index={index} />;
  }

  const event = events[eventIndex];

  return (
    <div style={style} data-index={index}>
      <div className="px-4 md:px-6 w-full">
        <EventRow
          event={event}
          query={query}
          index={eventIndex}
        />
      </div>
    </div>
  );
}

// -- Main Component --
export const SessionDetailTimeline: React.FC<SessionDetailTimelineProps> = ({
  events,
  query,
  onQueryChange,
  onExpandList,
  showSystemFooter,
}) => {
  const { t } = useI18n();
  const listRef = useListRef();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // v2: rowProps no longer needs setSize, the library handles dynamic heights
  const rowProps: RowData = {
    events,
    query,
    hasSystemFooter,
    t,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
      
      {/* Sticky Search Header */}
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
