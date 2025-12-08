import React, { ReactElement } from 'react';
import { Activity } from 'lucide-react';
import { RowComponentProps } from 'react-window';
import { ClaudeEvent } from '../../../model/events';
import { EventRow } from './EventRow';

export type TimelineRowKind = 'start' | 'event' | 'end' | 'footer';

export interface RowData {
  events: ClaudeEvent[];
  query: string;
  hasSystemFooter: boolean;
  t: (key: string, args?: Record<string, string>) => string;
}

export function getRowKind(
  index: number,
  eventsLength: number,
  hasFooter: boolean,
): { kind: TimelineRowKind; eventIndex?: number } {
  if (index === 0) return { kind: 'start' };
  if (index === eventsLength + 1) return { kind: 'end' };
  if (hasFooter && index === eventsLength + 2) return { kind: 'footer' };
  return { kind: 'event', eventIndex: index - 1 };
}

export function TimelineRow(props: RowComponentProps<RowData> & RowData): ReactElement {
  const { index, style, events, query, hasSystemFooter, t } = props;
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
  const isLast = eventIndex === events.length - 1;

  return (
    <div style={style} data-index={index}>
      <div className="px-4 md:px-6 w-full">
        <EventRow
          event={event}
          query={query}
          index={eventIndex}
          isLast={isLast}
        />
      </div>
    </div>
  );
}