import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  ReactElement,
} from 'react';
import {
  VariableSizeList as List,
  ListChildComponentProps,
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

// -- Dynamic Height Hook --
const useRowMeasurement = (
  index: number,
  setSize: (index: number, size: number) => void,
) => {
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = rowRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use borderBoxSize if available for better accuracy, fallback to contentRect
        const height =
          (entry as any).borderBoxSize?.[0]?.blockSize ??
          entry.contentRect.height;
        if (height && height > 0) {
          setSize(index, height);
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [index, setSize]);

  return rowRef;
};

// -- Row Data Interface --
interface RowData {
  events: ClaudeEvent[];
  query: string;
  hasSystemFooter: boolean;
  setSize: (index: number, size: number) => void;
  t: (key: string, args?: Record<string, string>) => string;
}

// -- Row Component --
function TimelineRow(props: ListChildComponentProps<RowData>): ReactElement {
  const {
    index,
    style,
    data,
  } = props;

  const {
    events,
    query,
    hasSystemFooter,
    setSize,
    t,
  } = data;

  const { kind, eventIndex } = getRowKind(index, events.length, hasSystemFooter);
  const rowRef = useRowMeasurement(index, setSize);

  // Note: We use a wrapper div with `style` (from react-window) and an inner div with `ref` (for ResizeObserver).
  // This allows the inner content to grow naturally and be measured, even if the outer container has a fixed height temporarily.

  if (kind === 'start') {
    return (
      <div style={style}>
        <div
          ref={rowRef}
          className="px-4 md:px-6 py-8 flex items-center justify-center gap-3 opacity-50"
        >
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
      <div style={style}>
        <div
          ref={rowRef}
          className="px-4 md:px-6 py-8 flex items-center justify-center gap-3 opacity-30"
        >
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
      <div style={style}>
        <div
          ref={rowRef}
          className="px-4 md:px-6 py-8 flex items-center justify-center"
        >
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
    return <div style={style} ref={rowRef} />;
  }

  const event = events[eventIndex];

  return (
    <div style={style}>
      <div ref={rowRef} className="px-4 md:px-6 w-full">
        <EventRow
          key={event.uuid || eventIndex}
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
  const listRef = useRef<List>(null);
  const sizeMapRef = useRef<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const hasSystemFooter = !!showSystemFooter;
  const baseRowCount = events.length + 2; // start + end
  const rowCount = hasSystemFooter ? baseRowCount + 1 : baseRowCount;

  // Constants for default heights
  const MARKER_HEIGHT = 80;
  const FOOTER_HEIGHT = 180;
  const DEFAULT_EVENT_HEIGHT = 100;

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

  // Reset cache when events change
  useEffect(() => {
    sizeMapRef.current.clear();
    listRef.current?.resetAfterIndex?.(0);
  }, [events]);

  const setSize = useCallback((index: number, size: number) => {
    const map = sizeMapRef.current;
    const prev = map.get(index) ?? 0;
    // Only update if difference is significant to avoid thrashing
    if (Math.abs(prev - size) > 0.5) {
      map.set(index, size);
      listRef.current?.resetAfterIndex?.(index);
    }
  }, []);

  const getRowHeight = useCallback(
    (index: number) => {
      const { kind } = getRowKind(index, events.length, hasSystemFooter);
      const cached = sizeMapRef.current.get(index);

      if (cached !== undefined) return cached;

      if (kind === 'start' || kind === 'end') return MARKER_HEIGHT;
      if (kind === 'footer') return FOOTER_HEIGHT;
      return DEFAULT_EVENT_HEIGHT;
    },
    [events.length, hasSystemFooter],
  );

  const rowProps: RowData = useMemo(
    () => ({
      events,
      query,
      hasSystemFooter,
      setSize,
      t,
    }),
    [events, query, hasSystemFooter, setSize, t],
  );

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
                  ref={listRef}
                  height={dimensions.height}
                  width={dimensions.width}
                  itemCount={rowCount}
                  itemSize={getRowHeight}
                  itemData={rowProps}
                  overscanCount={8}
                >
                  {TimelineRow}
                </List>
            )
        )}
      </div>
    </div>
  );
};
