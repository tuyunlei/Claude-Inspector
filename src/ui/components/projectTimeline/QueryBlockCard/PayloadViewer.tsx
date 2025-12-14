
import React, { useState } from 'react';

export const PayloadViewer: React.FC<{ data: any; label?: string; maxLines?: number }> = ({ data, label, maxLines = 5 }) => {
    const [expanded, setExpanded] = useState(false);
    let content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    if (!content) return null;
    const lines = content.split('\n');
    const isLong = lines.length > maxLines;
    const preview = isLong ? lines.slice(0, maxLines).join('\n') + `\n... (${lines.length - maxLines} more lines)` : content;

    return (
        <div className="mt-2 text-xs font-mono bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 overflow-hidden">
            {label && <div className="px-2 py-1 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[10px] uppercase">{label}</div>}
            <div className="p-2 overflow-x-auto text-slate-700 dark:text-slate-300">
                <pre className="whitespace-pre-wrap break-all">{expanded ? content : preview}</pre>
            </div>
            {isLong && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                    className="w-full text-center py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] text-slate-500 transition-colors"
                >
                    {expanded ? "Collapse" : "Show Full Payload"}
                </button>
            )}
        </div>
    );
};