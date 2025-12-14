import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { cn } from '../../../../utils/utils';

export const GuardrailBadge: React.FC<{ guardrails: string[] }> = ({ guardrails }) => {
    const [show, setShow] = useState(false);
    if (!guardrails || guardrails.length === 0) return null;

    return (
        <div 
          className="relative group inline-block"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
             <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 rounded-full text-[10px] font-bold cursor-default select-none">
                 <Shield size={10} />
                 <span>Guardrail</span>
             </div>
             
             {/* Popover */}
             <div className={cn(
                "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[300px] z-50 pointer-events-none transition-all duration-200",
                show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
             )}>
                <div className="bg-slate-900 text-slate-50 text-xs rounded-lg shadow-xl p-3 border border-slate-700 leading-tight">
                   <div className="font-bold mb-2 flex items-center gap-1.5 text-blue-300">
                       <Shield size={12} />
                       <span>System Guardrail / Caveat</span>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto">
                       {guardrails.map((g, i) => (
                           <div key={i} className="bg-slate-950 p-2 rounded text-[10px] font-mono opacity-90 border border-slate-800">
                               {g}
                           </div>
                       ))}
                   </div>
                   <div className="mt-2 text-[10px] opacity-60 italic">
                       These messages were injected by the system to prevent recursion loops or guide model behavior.
                   </div>
                   {/* Arrow */}
                   <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
                </div>
             </div>
        </div>
    );
};