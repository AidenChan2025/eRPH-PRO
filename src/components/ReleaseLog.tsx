import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, Plus, RefreshCw, CheckCircle, Trash2 } from 'lucide-react';
import { LogEntry } from '../lib/release_logs';
import { useTranslation } from 'react-i18next';

export const ReleaseLog = ({ logs }: { logs: LogEntry[] }) => {
    const { t } = useTranslation();
    // Default open index to 0 (Latest)
    const [openIndex, setOpenIndex] = useState(0);

    const toggle = (index: number) => {
        setOpenIndex(openIndex === index ? -1 : index);
    };

    return (
        <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <Tag className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">{t('systemUpdates')}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('releaseNotesChangelog')}</p>
                </div>
            </div>

            {logs.map((log, index) => {
                const isOpen = openIndex === index;
                return (
                    <div
                        key={log.version}
                        className={`transition-all duration-300 border rounded-2xl overflow-hidden ${isOpen ? 'shadow-lg border-indigo-100 bg-white' : 'shadow-sm border-slate-100 bg-slate-50 hover:bg-white'}`}
                    >
                        {/* Header */}
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer"
                            onClick={() => toggle(index)}
                        >
                            <div className="flex items-center gap-4">
                                <span className={`text-lg font-black tracking-tight ${isOpen ? 'text-indigo-700' : 'text-slate-700'}`}>v{log.version}</span>
                                {log.isLatest && (
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full shadow-sm">
                                        {t('latest')}</span>
                                )}
                                <span className="text-xs font-bold text-slate-400 border-l border-slate-200 pl-4">{log.date}</span>
                            </div>
                            <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        </div>

                        {/* Content */}
                        {isOpen && (
                            <div className="p-6 pt-0 border-t border-indigo-50/50 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="h-4" /> {/* Spacer */}

                                {log.added && log.added.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-600">
                                            <div className="p-1 bg-emerald-100 rounded text-emerald-700"><Plus className="w-3 h-3" /></div>
                                            {t('newFeatures')}</h4>
                                        <ul className="space-y-2 ml-2">
                                            {log.added.map((item, i) => (
                                                <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {log.changed && log.changed.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600">
                                            <div className="p-1 bg-amber-100 rounded text-amber-700"><RefreshCw className="w-3 h-3" /></div>
                                            {t('improvements')}</h4>
                                        <ul className="space-y-2 ml-2">
                                            {log.changed.map((item, i) => (
                                                <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {log.fixed && log.fixed.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600">
                                            <div className="p-1 bg-blue-100 rounded text-blue-700"><CheckCircle className="w-3 h-3" /></div>
                                            {t('bugFixes')}</h4>
                                        <ul className="space-y-2 ml-2">
                                            {log.fixed.map((item, i) => (
                                                <li key={i} className="text-sm font-medium text-slate-600 flex items-start gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
