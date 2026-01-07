
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LessonPlan, DSKPStandard } from '../types';
import Button from './Button';
import Card from './Card';
import { useLanguage } from '../context/LanguageContext';
import { useGlobal } from '../context/GlobalContext';
import { X, Search, BookOpen, Check } from 'lucide-react';
import PrintableRPH from './PrintableRPH';
import { db, collection, getDocs } from '../services/firebase';
import { api } from '../services/api';

export const PrintPreviewModal = ({ plans, onClose, schoolName, getWeek }: any) => {
    const container = document.getElementById('print-container');
    if (!container) return null;

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-800/50 backdrop-blur-sm overflow-y-auto print:overflow-visible print:bg-white print:static print:h-auto print:block">
            {/* Header - Hidden on Print */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-md print:hidden z-[10000]">
                <div>
                    <h3 className="font-bold text-lg text-slate-800">Print Preview</h3>
                    <p className="text-xs text-slate-500">{plans.length} Lesson Plan(s) selected</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={onClose}>Close</Button>
                    <Button onClick={() => window.print()}>Print</Button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="min-h-screen pt-24 pb-10 flex flex-col items-center print:p-0 print:block print:min-h-0">
                {plans.map((p: any, index: number) => (
                    <div key={p.id} className="page-break mb-8 last:mb-0 print:mb-0 w-full flex justify-center print:block">
                        <PrintableRPH
                            plan={p}
                            schoolName={schoolName}
                            weekNumber={getWeek ? getWeek(new Date(p.date)) : 1}
                        />
                    </div>
                ))}
            </div>
        </div>,
        container
    );
};

export const HistoryModal = ({ plan, onClose, onRestore }: { plan: LessonPlan, onClose: () => void, onRestore: (version: LessonPlan) => void }) => {
    const { t } = useLanguage();
    const history = plan.history || [];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg">{t('history')}</h3>
                    <button onClick={onClose}><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {history.length === 0 ? <p className="text-center text-slate-500 italic">{t('no_history')}</p> : [...history].reverse().map((v: any, i) => (
                        <div key={i} className="border rounded-lg p-3 flex justify-between items-center hover:bg-slate-50">
                            <div>
                                <div className="font-bold text-sm">Version {v.version}</div>
                                <div className="text-xs text-slate-500">{new Date(v.updatedAt).toLocaleString()}</div>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => onRestore(v as LessonPlan)}>{t('restore')}</Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

interface DskpBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (std: DSKPStandard) => void;
    currentSubject?: string;
    currentGrade?: string;
}

export const DskpBrowserModal = ({ isOpen, onClose, onSelect, currentSubject, currentGrade }: DskpBrowserProps) => {
    const [standards, setStandards] = useState<DSKPStandard[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.dskp.list({}).then(res => {
                if (res.success) {
                    setStandards(res.data);
                }
                setLoading(false);
            });
            // Pre-fill search if subject is available
            if (currentSubject) setSearch(currentSubject);
        } else {
            setSearch('');
        }
    }, [isOpen, currentSubject]);

    // Filter Logic
    const filtered = standards.filter(s => {
        const query = search.toLowerCase();
        const matchText =
            s.contentStandard.toLowerCase().includes(query) ||
            s.learningStandard.toLowerCase().includes(query) ||
            s.subject.toLowerCase().includes(query) ||
            s.grade.toLowerCase().includes(query);

        // If currentSubject/Grade provided, prioritize them but don't strictly hide if user wants to search others
        // However, for best UX, we sort relevant ones to top
        return matchText;
    });

    // Sort to show exact matches for current context first
    const sorted = [...filtered].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (currentSubject && a.subject === currentSubject) scoreA += 2;
        if (currentGrade && a.grade === currentGrade) scoreA += 1;
        if (currentSubject && b.subject === currentSubject) scoreB += 2;
        if (currentGrade && b.grade === currentGrade) scoreB += 1;
        return scoreB - scoreA;
    });

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl">
                <div className="p-4 border-b bg-slate-50 rounded-t-xl flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" /> DSKP Browser
                        </h3>
                        <p className="text-xs text-slate-500">Select a standard to auto-fill your lesson plan.</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                </div>

                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Search by Subject, Grade or Keywords..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    {currentSubject && (
                        <div className="mt-2 flex gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Suggested Context:</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{currentSubject}</span>
                            {currentGrade && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{currentGrade}</span>}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-500">Loading standards...</div>
                    ) : sorted.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                            No standards found. <br />
                            <span className="text-xs">Try verifying your search or import new DSKP in Admin panel.</span>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {sorted.map((s: any) => {
                                const isMatch = currentSubject && s.subject === currentSubject && currentGrade && s.grade === currentGrade;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => onSelect(s)}
                                        className={`p-4 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md hover:border-blue-300 group ${isMatch ? 'ring-1 ring-blue-500 border-blue-500' : 'border-slate-200'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isMatch ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {s.subject}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{s.grade}</span>
                                            </div>
                                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 text-blue-600"><Check className="w-4 h-4 mr-1" /> Select</Button>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Content Standard</div>
                                                <p className="text-sm font-medium text-slate-800">{s.contentStandard}</p>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Learning Standard</div>
                                                <p className="text-sm text-slate-600">{s.learningStandard}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onPrimaryAction?: () => void;
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
}

export const SuccessModal = ({ isOpen, onClose, title, message, onPrimaryAction, primaryActionLabel = "Continue", secondaryActionLabel = "Close" }: SuccessModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-sm shadow-2xl border-0 rounded-[2rem] overflow-hidden text-center p-8 space-y-6 bg-white relative">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-2">
                    <Check className="w-10 h-10 stroke-[3px]" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    {onPrimaryAction && (
                        <Button onClick={onPrimaryAction} className="w-full h-12 rounded-xl text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                            {primaryActionLabel}
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl font-bold text-slate-400 hover:bg-slate-50">
                        {secondaryActionLabel}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
