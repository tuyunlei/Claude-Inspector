
import React, { useState } from 'react';
import { FolderGit2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { ClaudeEvent } from '../../../model/events';
import { useI18n } from '../../i18n';

export const FileSnapshotBlock: React.FC<{ event: ClaudeEvent }> = ({ event }) => {
    const { t } = useI18n();
    const [expanded, setExpanded] = useState(false);
    const snapshot = event.raw?.snapshot;
    const files = snapshot?.trackedFileBackups ? Object.keys(snapshot.trackedFileBackups) : [];
    const fileCount = files.length;

    // Preview: first 2 files
    const previewFiles = files.slice(0, 2);
    const remaining = Math.max(0, fileCount - 2);

    return (
        <div className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-900/30 rounded-lg shadow-sm overflow-hidden">
            <div 
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded text-purple-600 dark:text-purple-300">
                        <FolderGit2 size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t('sessions.fileSnapshot')}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-medium">{fileCount} files</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            {previewFiles.map(f => (
                                <span key={f} className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px] truncate max-w-[150px]">{f}</span>
                            ))}
                            {remaining > 0 && <span className="text-[10px] opacity-70">+{remaining} more</span>}
                        </div>
                    </div>
                </div>
                <div className="text-slate-400">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-purple-100 dark:border-purple-900/30 bg-purple-50/30 dark:bg-purple-900/10 p-4">
                    <div className="flex flex-col gap-3">
                        <details className="group/raw">
                            <summary className="text-[10px] text-slate-400 hover:text-purple-600 cursor-pointer select-none flex items-center gap-1 w-fit mb-2">
                                <FileText size={12} />
                                {t('sessions.viewRawSnapshot')}
                            </summary>
                            <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto max-h-60 overflow-y-auto">
                                {JSON.stringify(snapshot, null, 2)}
                            </pre>
                        </details>
                        
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('sessions.trackedFiles')}</div>
                            {files.length > 0 ? files.map((f, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-2 py-1.5 rounded">
                                    <FileText size={12} className="text-slate-400" />
                                    {f}
                                </div>
                            )) : (
                                <div className="text-xs text-slate-400 italic">{t('sessions.noFilesListed')}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
