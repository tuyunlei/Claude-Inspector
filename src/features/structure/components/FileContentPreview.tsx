
import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { useI18n } from '../../../shared/i18n';
import { FileTreeNode, FileEntry } from '../../../types';

export const FileContentPreview: React.FC<{ node: FileTreeNode; fileMap?: Map<string, FileEntry>, sensitive?: boolean }> = ({ node, fileMap, sensitive }) => {
    const { t } = useI18n();
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadContent = async () => {
            if (!fileMap || !fileMap.has(node.path)) {
                setContent(t('structure.contentUnavailable'));
                return;
            }
            if (sensitive) {
                setContent('');
                return;
            }

            setLoading(true);
            try {
                // Peek at first 8KB only for performance
                const entry = fileMap.get(node.path)!;
                const fullText = await entry.text();
                const preview = fullText.slice(0, 8192);
                setContent(preview + (fullText.length > 8192 ? `\n${t('common.truncated')}` : ''));
            } catch (e) {
                setContent(t('structure.errorReading'));
            } finally {
                setLoading(false);
            }
        };

        if (!node.isDir) {
            loadContent();
        }
    }, [node, fileMap, sensitive]);

    if (sensitive) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 gap-3">
                <Lock size={32} className="text-red-300 dark:text-red-900" />
                <p>{t('structure.sensitive')}</p>
            </div>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-400">{t('structure.loading')}</div>;
    }

    return (
        <div className="relative">
             <div className="absolute top-0 right-0 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 dark:text-slate-300 font-mono rounded-bl">
                {t('structure.preview')}
            </div>
            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px] overflow-y-auto border border-slate-700 shadow-inner">
                {content}
            </pre>
        </div>
    );
};
