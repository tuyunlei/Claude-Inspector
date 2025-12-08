
import React, { useState } from 'react';
import { ClaudeEvent } from '../../../model/events';
import { cn } from '../../../utils/utils';
import { FileJson, Check, Copy, AlertCircle, Terminal, User, Sparkles, FolderGit2 } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { FileSnapshotBlock } from './FileSnapshotBlock';
import { useI18n } from '../../i18n';

interface EventRowProps {
    event: ClaudeEvent;
    query: string;
    index: number;
    isLast?: boolean;
}

export const EventRow: React.FC<EventRowProps> = ({ event, query, index, isLast }) => {
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
            <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
                    <AlertCircle size={16} />
                    <span className="font-semibold text-xs uppercase">{event.type || 'Unknown Type'}</span>
                    <span className="text-[10px] font-mono opacity-60 ml-auto">
                        {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                </div>
                {/* Try to show some meaningful preview if possible */}
                <div className="font-mono text-xs text-slate-600 dark:text-slate-300 opacity-80 break-all line-clamp-3">
                     {JSON.stringify(event.raw || event)}
                </div>
            </div>
        );
    };

    return (
        <div className="group relative pb-4">
            {/* Header / Meta Actions (Hidden by default, shown on hover for cleaner look) */}
            <div className="absolute right-0 top-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => setShowRaw(!showRaw)}
                    className={cn(
                        "p-1.5 rounded-lg transition-colors border",
                        showRaw 
                            ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-900" 
                            : "bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 border-slate-200 dark:border-slate-700"
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
