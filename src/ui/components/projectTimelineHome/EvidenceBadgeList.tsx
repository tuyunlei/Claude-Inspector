
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { cn } from '../../../utils/utils';
import { ChevronDown, FileText, X } from 'lucide-react';

// --- Types ---

export interface EvidenceItem {
  id: string;
  label: string;
  count: number;
  fullPath?: string;
  type: 'read' | 'write' | 'tool' | 'error';
  meta?: string; // e.g. "lines: 12-50" or "failed"
}

interface EvidenceBadgeListProps {
  items: EvidenceItem[];
  maxRows: number;
  title: string; // "Changed Files", "Read Files", etc.
  className?: string;
}

// --- Components ---

const HoverCard: React.FC<{
  item: EvidenceItem;
  children: React.ReactNode;
}> = ({ item, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative group inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      {/* Tooltip Content */}
      <div className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] z-50 pointer-events-none transition-all duration-200",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}>
        <div className="bg-slate-900 text-slate-50 text-xs rounded-lg shadow-xl p-2.5 border border-slate-700 leading-tight">
          {/* Header: Path / Name */}
          <div className="font-mono break-all font-medium border-b border-slate-700 pb-1.5 mb-1.5">
            {item.fullPath || item.label}
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="capitalize font-semibold text-slate-400">
                {item.type} <span className="text-white ml-0.5">×{item.count}</span>
            </span>
            {item.meta && (
                <span className="font-mono opacity-80">{item.meta}</span>
            )}
          </div>
          
          {/* Triangle arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
        </div>
      </div>
    </div>
  );
};

const OverflowPopover: React.FC<{
  items: EvidenceItem[];
  title: string;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}> = ({ items, title, onClose, triggerRef }) => {
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

export const EvidenceBadgeList: React.FC<EvidenceBadgeListProps> = ({ items, maxRows, title, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const [visibleCount, setVisibleCount] = useState(items.length);
  const [showPopover, setShowPopover] = useState(false);
  
  // Measure layout to determine how many items fit within maxRows
  useLayoutEffect(() => {
    if (!containerRef.current || items.length === 0) return;
    
    const container = containerRef.current;
    const children = Array.from(container.children) as HTMLElement[];
    const containerTop = container.offsetTop;
    // Estimate row height from the first item, including margin
    // Default to ~28px (22px height + gap) if measurement fails
    const firstChild = children[0];
    const rowHeight = firstChild ? firstChild.offsetHeight + 6 : 28; 
    
    const maxAllowedHeight = rowHeight * maxRows;

    let visible = 0;
    
    // We iterate to find the first item that breaks the height limit
    for (let i = 0; i < children.length; i++) {
       const child = children[i];
       // Check if this item (bottom edge) is within bounds
       // Using offsetTop relative to container
       const relativeTop = child.offsetTop - containerTop;
       
       // Allow a small buffer (5px) for sub-pixel rendering differences
       if (relativeTop + child.offsetHeight > maxAllowedHeight + 5) {
           break;
       }
       visible++;
    }

    // If we have to hide some, we need to account for the "+N" button taking space.
    // The "+N" button is the last child in the DOM list (rendered conditionally or always present for measurement).
    // Simplification: If visible < total, we reduce visible by 1 to ensure space for +N, 
    // unless +N was already accounted for in the loop (which it isn't, as we render it after).
    if (visible < items.length) {
        setVisibleCount(Math.max(1, visible - 1));
    } else {
        setVisibleCount(items.length);
    }

  }, [items, maxRows, window.innerWidth]); // Re-run on resize

  const renderBadge = (item: EvidenceItem) => {
      const isWrite = item.type === 'write';
      const isError = item.type === 'error';
      
      return (
        <HoverCard key={item.id} item={item}>
            <span className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border max-w-[200px] truncate cursor-default transition-colors select-none",
                isWrite 
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40" 
                    : isError
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
            )}>
                {item.label}
                {item.count > 1 && <span className="opacity-60 ml-0.5">×{item.count}</span>}
            </span>
        </HoverCard>
      );
  };

  const hiddenCount = items.length - visibleCount;
  const overflowItems = items.slice(visibleCount);

  return (
    <div className={cn("relative", className)}>
        {/* Render List */}
        <div ref={containerRef} className="flex flex-wrap gap-1.5 items-start w-full">
            {/* 1. Visible Items */}
            {items.slice(0, visibleCount).map(renderBadge)}
            
            {/* 2. Overflow Trigger */}
            {hiddenCount > 0 && (
                <button
                    ref={triggerRef}
                    onClick={(e) => { e.stopPropagation(); setShowPopover(!showPopover); }}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 border border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
                    title={`Show ${hiddenCount} more items`}
                >
                    +{hiddenCount}
                    <ChevronDown size={10} className="opacity-70" />
                </button>
            )}

            {/* 3. Invisible Render for Measurement (Hidden via CSS but layout-active? No, simple truncation is usually enough for V1) */}
            {/* Note: The useLayoutEffect measures what IS rendered. To be perfectly accurate we might render all and hide via CSS visibility, 
                but dynamically slicing the array based on previous render stats is a common React pattern that settles in 1 frame. 
                For V1, the slice method above is stable enough. */}
        </div>

        {/* Overflow Popover */}
        {showPopover && (
            <OverflowPopover 
                items={overflowItems} 
                title={`${title} (${hiddenCount})`} 
                onClose={() => setShowPopover(false)} 
                triggerRef={triggerRef}
            />
        )}
    </div>
  );
};
