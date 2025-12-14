
import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { MarkdownRenderer } from '../../MarkdownRenderer';

function normalizeMarkdownForPreview(text: string): string {
    if (!text) return '';
    return text
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/&nbsp;/g, ' ');
}

export const MarkdownPreviewText: React.FC<{
    text: string;
    maxHeightClass?: string;
    className?: string;
    label?: React.ReactNode;
    isCommand?: boolean;
}> = ({ text, maxHeightClass = 'max-h-32', className, label, isCommand }) => {
    const processed = normalizeMarkdownForPreview(text);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            if (!containerRef.current) return;
            const { scrollHeight, clientHeight } = containerRef.current;
            setIsTruncated(scrollHeight > clientHeight + 1);
        };
        checkTruncation();
        const observer = new ResizeObserver(() => checkTruncation());
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [text, maxHeightClass]); 

    return (
        <div className={cn("group", className)}>
             {label && <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">{label}</div>}
             <div className={cn("relative overflow-hidden", maxHeightClass)} ref={containerRef}>
                 <div className={cn(
                     "text-sm leading-relaxed", 
                     isCommand ? "font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"
                 )}>
                     {isCommand ? (
                         // Simple text render for commands to preserve spacing/formatting exactly
                         <div className="whitespace-pre-wrap">{text}</div>
                     ) : (
                        <MarkdownRenderer
                            content={processed}
                            className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_hr]:my-2"
                        />
                     )}
                 </div>
                 {isTruncated && !isCommand && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-slate-900 to-transparent pointer-events-none" />
                 )}
             </div>
        </div>
    );
};