
import React, { useState } from 'react';
import { ClaudeEvent } from '../../../types';
import { cn } from '../../../shared/utils';
import { FileJson, Check, Copy, AlertCircle, Terminal } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { FileSnapshotBlock } from './FileSnapshotBlock';
import { useI18n } from '../../../shared/i18n';

interface EventRowProps {
    event: ClaudeEvent;
    query: string;
    index: number;
}

export const EventRow: React.FC<EventRowProps> = ({ event, query, index }) => {
    const { t } = useI18n();
    const [showRaw, setShowRaw] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = JSON.stringify(event.raw || event, null, 2);
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    };

    const renderContent = () => {
        if (event.message || event.type === 'message') {
            return <ChatBubble event={event} query={query} index={index} />;
        }
        
        if (event.type === 'file-history-snapshot') {
            return <FileSnapshotBlock event={event} />;
        }

        // Fallback for unknown/system types
        return (
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <AlertCircle size={14} />
                    <span className="font-semibold text-xs uppercase">{event.type || 'Unknown Type'}</span>
                </div>
                {/* Try to show some meaningful preview if possible */}
                <div className="font-mono text-xs text-slate-600 dark:text-slate-300 opacity-80 break-all line-clamp-3">
                     {JSON.stringify(event.raw || event)}
                </div>
            </div>
        );
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'message': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30';
            case 'file-history-snapshot': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30';
            case 'tool_use': 
            case 'tool_result':
                return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
            default: return 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
        }
    };

    const timestamp = new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return (
        <div className="group relative pl-4 pb-6 border-l-2 border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
            {/* Timeline Dot */}
            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-50 dark:ring-slate-950" />

            {/* Meta Header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                     <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getTypeColor(event.type))}>
                        {event.type}
                     </span>
                     <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {timestamp}
                     </span>
                </div>

                <button 
                    onClick={() => setShowRaw(!showRaw)}
                    className={cn(
                        "p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                        showRaw ? "text-orange-500 bg-orange-50 dark:bg-orange-900/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                    title="View Raw JSON"
                >
                    <FileJson size={14} />
                </button>
            </div>

            {/* Main Content */}
            <div className="relative">
                {renderContent()}
            </div>

            {/* Raw JSON Viewer */}
            {showRaw && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="relative bg-slate-900 text-slate-200 rounded-lg p-3 text-[10px] font-mono shadow-inner border border-slate-700">
                         <div className="absolute top-2 right-2 flex gap-2">
                             <button onClick={handleCopy} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                 {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                             </button>
                         </div>
                         <div className="flex items-center gap-2 mb-2 text-slate-500 border-b border-slate-800 pb-2">
                             <Terminal size={12} />
                             <span className="uppercase font-bold tracking-wider">Raw Event Data</span>
                         </div>
                         <pre className="overflow-x-auto whitespace-pre-wrap break-all pr-8 max-h-[300px] overflow-y-auto">
                             {JSON.stringify(event.raw || event, null, 2)}
                         </pre>
                    </div>
                </div>
            )}
        </div>
    );
};
