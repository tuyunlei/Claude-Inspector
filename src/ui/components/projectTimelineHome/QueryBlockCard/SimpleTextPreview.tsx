import React from 'react';
import { cn } from '../../../../utils/utils';

export const SimpleTextPreview: React.FC<{
    text: string;
    maxLines?: number;
    className?: string;
}> = ({ text, maxLines = 3, className }) => {
    return (
        <div
            className={cn("whitespace-pre-wrap overflow-hidden", className)}
            style={{
                display: '-webkit-box',
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: 'vertical'
            }}
        >
            {text}
        </div>
    );
};