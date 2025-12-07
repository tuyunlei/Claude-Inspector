
import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, FileJson, Loader2, AlertTriangle, Command, Info } from 'lucide-react';
import { DataStore } from '../../types';
import { useI18n } from '../../shared/i18n';
import { cn } from '../../shared/utils';
import { useUploadProcessor } from './useUploadProcessor';

interface UploadProps {
  onDataLoaded: (data: DataStore) => void;
}

export const UploadPage: React.FC<UploadProps> = ({ onDataLoaded }) => {
  const { loading, error, detectedConfig, processFiles } = useUploadProcessor(onDataLoaded);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useI18n();
  const dirInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files, 'auto');
    }
  }, [processFiles]);

  const handleManualDirSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files, 'dir');
  };

  const handleManualZipSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files, 'zip');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-2xl w-full">
        
        {/* Main Card */}
        <div 
            className={cn(
                "bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden transition-all duration-300 border-2",
                isDragging 
                    ? "border-orange-500 scale-[1.02] shadow-orange-500/20" 
                    : "border-slate-100 dark:border-slate-800"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
          <div className="p-10 sm:p-14 text-center">
            
            {/* Header Icon */}
            <div className={cn(
                "mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-colors",
                isDragging ? "bg-orange-100 text-orange-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}>
              {loading ? (
                  <Loader2 size={36} className="animate-spin text-orange-500" />
              ) : (
                  <UploadCloud size={36} />
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
              {t('upload.title')}
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
              {t('upload.description')}
              <br />
              <span className="text-xs opacity-70 mt-2 block">{t('upload.localProcessing')}</span>
            </p>

            {/* Config Detected Badge */}
            {detectedConfig && !loading && !error && (
                 <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium rounded-full border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-bottom-2">
                     <FileJson size={14} />
                     Config detected: {detectedConfig.name}
                </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/50 flex items-start gap-3 text-left">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
            )}

            {/* Primary Action Area */}
            <div className="space-y-4">
                {/* Inputs */}
                <input
                  type="file"
                  ref={dirInputRef}
                  onChange={handleManualDirSelect}
                  className="hidden"
                  /* @ts-ignore */
                  directory="" 
                  webkitdirectory="" 
                />
                <input
                  type="file"
                  ref={zipInputRef}
                  onChange={handleManualZipSelect}
                  className="hidden"
                  accept=".zip"
                />

                {/* Main Button */}
                <button
                  onClick={() => dirInputRef.current?.click()}
                  disabled={loading}
                  className="w-full sm:w-auto min-w-[240px] px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                  {loading ? t('upload.processing') : t('upload.selectFolder')}
                </button>

                {/* Subtext / Alternative */}
                <div className="text-sm text-slate-400 dark:text-slate-500 space-y-2 mt-4">
                    <p>
                        {t('upload.or')} <button onClick={() => zipInputRef.current?.click()} className="text-slate-600 dark:text-slate-300 underline decoration-slate-300 hover:text-orange-600 transition-colors">select a .zip archive</button>
                    </p>
                    <p className="text-xs opacity-75">
                        Drag & drop <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">~/.claude</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-300">config.json</code> together
                    </p>
                </div>
            </div>
          </div>
          
          {/* Footer / Hints */}
          <div className="bg-slate-50 dark:bg-slate-950/50 px-8 py-5 border-t border-slate-100 dark:border-slate-800/50 flex flex-col sm:flex-row justify-center items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
             <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                <Command size={12} />
                <span>Mac: Cmd + Shift + . to show hidden files</span>
             </div>
             <div className="hidden sm:block text-slate-300 dark:text-slate-700">•</div>
             <div className="flex items-center gap-2">
                <Info size={12} />
                <span>Parsed locally in browser</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
