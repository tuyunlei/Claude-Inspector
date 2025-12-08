
import React, { useState } from 'react';
import { useData } from '../../app/App';
import { Settings, Server, Terminal, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '../../shared/i18n';

export const ConfigPage: React.FC = () => {
  const { data } = useData();
  const { t } = useI18n();
  const [showWarnings, setShowWarnings] = useState(true);

  const mcpServers = data.config.mcpServers || {};
  const settings = data.config.settings || {};
  const warnings = data.warnings || [];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
            <Settings className="text-orange-600" /> {t('config.title')}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">{t('config.subtitle')}</p>
      </div>

      {/* Warnings Section */}
      {warnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900 overflow-hidden">
             <div 
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
                onClick={() => setShowWarnings(!showWarnings)}
             >
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle size={18} />
                    <h3 className="font-semibold">{t('config.parseWarnings')} ({warnings.length})</h3>
                </div>
                {showWarnings ? <ChevronUp size={18} className="text-amber-700 dark:text-amber-400"/> : <ChevronDown size={18} className="text-amber-700 dark:text-amber-400"/>}
             </div>
             
             {showWarnings && (
                <div className="border-t border-amber-200 dark:border-amber-900 max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-amber-100/50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 font-semibold">
                            <tr>
                                <th className="px-6 py-2 w-1/3">{t('config.file')}</th>
                                <th className="px-6 py-2 w-20">{t('config.line')}</th>
                                <th className="px-6 py-2">{t('config.message')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100 dark:divide-amber-900/50">
                            {warnings.map((w, idx) => (
                                <tr key={idx} className="hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                    <td className="px-6 py-2 font-mono text-amber-900 dark:text-amber-200 truncate max-w-[200px]" title={w.file}>{w.file}</td>
                                    <td className="px-6 py-2 text-amber-700 dark:text-amber-300">{w.line || '-'}</td>
                                    <td className="px-6 py-2 text-amber-800 dark:text-amber-200">{w.message}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
          </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-750 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Server size={18} className="text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('config.mcpServers')}</h3>
        </div>
        <div className="p-0">
            {Object.keys(mcpServers).length === 0 ? (
                <div className="p-6 text-slate-400 italic">{t('config.noMcp')}</div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {Object.entries(mcpServers).map(([name, config]: [string, any]) => (
                        <div key={name} className="p-6">
                            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                {name}
                            </h4>
                            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-x-auto border border-slate-800">
                                <div className="flex gap-2">
                                    <span className="text-pink-400">$</span>
                                    <span>{config.command} {(config.args || []).join(' ')}</span>
                                </div>
                                {config.env && (
                                    <div className="mt-2 text-slate-500">
                                        # {t('config.envVars')}: {Object.keys(config.env).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
         <div className="bg-slate-50 dark:bg-slate-750 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Terminal size={18} className="text-slate-600 dark:text-slate-400" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">{t('config.globalSettings')}</h3>
        </div>
        <div className="p-6">
             {settings.hooks ? (
                 <pre className="text-sm font-mono bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto text-slate-700 dark:text-slate-300">
                     {JSON.stringify(settings.hooks, null, 2)}
                 </pre>
             ) : (
                 <div className="text-slate-400 italic">{t('config.noHooks')}</div>
             )}
        </div>
      </div>
    </div>
  );
};
