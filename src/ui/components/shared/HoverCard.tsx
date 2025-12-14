import React, { useState } from 'react';
import { cn } from '../../../utils/utils';

interface HoverCardProps {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
}

export const HoverCard: React.FC<HoverCardProps> = ({ children, content, className }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className={cn("relative group inline-block", className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      
      <div className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[280px] z-50 pointer-events-none transition-all duration-200",
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}>
        {content}
      </div>
    </div>
  );
};