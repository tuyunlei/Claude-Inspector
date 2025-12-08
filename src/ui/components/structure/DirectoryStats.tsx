
import React from 'react';
import { useI18n } from '../../i18n';
import { FileTreeNode } from '../../../model/files';

export const DirectoryStats: React.FC<{ node: FileTreeNode }> = ({ node }) => {
    const { t } = useI18n();

    if (!node.children) return null;

    const counts = node.children.reduce((acc, child) => {
        // Group files by kind, folders by 'folder' unless specific kind
        const key = child.isDir && child.kind === 'other' ? 'folder' : child.kind;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {Object.entries(counts).map(([kind, count]) => {
                 const label = (t(`structure.kinds.${kind}.label`) as string) || kind;
                 return (
                    <div key={kind} className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-semibold mb-1 truncate" title={label}>{label}</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{count}</div>
                    </div>
                 );
             })}
        </div>
    );
};
