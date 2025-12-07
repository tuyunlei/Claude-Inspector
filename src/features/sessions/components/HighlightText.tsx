
import React from 'react';

export const HighlightText: React.FC<{ text: string; query: string; className?: string }> = ({ text, query, className }) => {
  const safeText = text || '';
  if (!query) return <span className={className}>{safeText}</span>;

  const parts = safeText.split(new RegExp(`(${query})`, 'gi'));
  return (
    <span className={className}>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 dark:bg-yellow-800 text-slate-900 dark:text-yellow-100 rounded-sm px-0.5">{part}</span>
        ) : (
          part
        )
      )}
    </span>
  );
};
