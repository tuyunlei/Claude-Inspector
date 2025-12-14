import React, { useRef, useEffect } from 'react';
import { X, FileText } from 'lucide-react';

interface OverflowPopoverProps {
  items: Array<{ id: string; label: string; fullPath?: string; type: string; count: number; meta?: string }>;
  title: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export const OverflowPopover: React.FC<OverflowPopoverProps> = ({ items, title, onClose, triggerRef }) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Simple click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  return (
    <div 
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-40 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 rounded-t-lg">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto p-2 space-y-1">
        {items.map(item => (
            <div key={item.id} className="text-xs px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-2 group">
                <FileText size={12} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                    <div className="truncate font-mono text-slate-700 dark:text-slate-300" title={item.fullPath}>{item.label}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span>{item.type} ×{item.count}</span>
                        {item.meta && <span>• {item.meta}</span>}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};