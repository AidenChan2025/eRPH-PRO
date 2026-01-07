
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LessonPlan, DSKPStandard } from '../types';
import Button from './Button';
import Card from './Card';
import { useLanguage } from '../context/LanguageContext';
import { useGlobal } from '../context/GlobalContext';
import { X, Search, BookOpen, Check, ChevronDown, ChevronUp } from 'lucide-react';
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

export const DskpBrowserModal = ({ isOpen, onClose, onSelect, currentSubject }: DskpBrowserProps) => {
    const [standards, setStandards] = useState<DSKPStandard[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedSubject, setSelectedSubject] = useState(currentSubject || '');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [search, setSearch] = useState('');

    // Selection
    const [expandedContent, setExpandedContent] = useState<string | null>(null);
    const [selectedLearningStandards, setSelectedLearningStandards] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.dskp.list({}).then(res => {
                if (res.success) {
                    setStandards(res.data);
                }
                setLoading(false);
            });
            if (currentSubject) setSelectedSubject(currentSubject);
        } else {
            // Reset state
            setSelectedSubject('');
            setSelectedGrade('');
            setSearch('');
            setExpandedContent(null);
            setSelectedLearningStandards(new Set());
        }
    }, [isOpen, currentSubject]);

    // Derived Data: Unique Subjects and Grades
    const subjects = React.useMemo(() => Array.from(new Set(standards.map(s => s.subject))).sort(), [standards]);
    const grades = React.useMemo(() => {
        if (!selectedSubject) return [];
        return Array.from(new Set(standards.filter(s => s.subject === selectedSubject).map(s => s.grade))).sort();
    }, [standards, selectedSubject]);

    // Group Standards by Content Standard
    const groupedStandards = React.useMemo(() => {
        let filtered = standards;

        if (selectedSubject) filtered = filtered.filter(s => s.subject === selectedSubject);
        if (selectedGrade) filtered = filtered.filter(s => s.grade === selectedGrade);
        if (search) {
            const lowSearch = search.toLowerCase();
            filtered = filtered.filter(s =>
                s.contentStandard.toLowerCase().includes(lowSearch) ||
                s.learningStandard.toLowerCase().includes(lowSearch)
            );
        }

        // Grouping
        const groups: Record<string, DSKPStandard[]> = {};
        filtered.forEach(s => {
            if (!groups[s.contentStandard]) groups[s.contentStandard] = [];
            groups[s.contentStandard].push(s);
        });

        return groups;
    }, [standards, selectedSubject, selectedGrade, search]);

    const handleConfirm = () => {
        // Find the first selected standard (to get subject/grade/content metadata)
        // In a real app, we might need to return a composite object. 
        // For now, we return the base DSKPStandard but with combined learningStandards.

        if (selectedLearningStandards.size === 0) return;

        const firstKey = Array.from(selectedLearningStandards)[0];
        // Find the standard object corresponding to the first key (optimized finding needed in real huge datasets)
        const allFiltered = Object.values(groupedStandards).flat();
        const baseStd = allFiltered.find(s => s.learningStandard === firstKey);

        if (baseStd) {
            // Combine all selected learning standards into one string
            const combinedLS = Array.from(selectedLearningStandards).join('\n');
            onSelect({
                ...baseStd,
                learningStandard: combinedLS
            });
        }
    };

    const toggleSelection = (ls: string) => {
        const newSet = new Set(selectedLearningStandards);
        if (newSet.has(ls)) newSet.delete(ls);
        else newSet.add(ls);
        setSelectedLearningStandards(newSet);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border-0">
                {/* Header */}
                <div className="p-5 border-b bg-white flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-blue-600" /> DSKP Browser
                        </h3>
                        <p className="text-sm font-medium text-slate-500">Select standard to auto-fill lesson plan.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 border-b bg-slate-50/50">
                    <div className="md:col-span-3 p-4 border-r border-slate-200 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                            <select
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedSubject}
                                onChange={(e) => { setSelectedSubject(e.target.value); setSelectedGrade(''); }}
                            >
                                <option value="">All Subjects</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Year / Grade</label>
                            <select
                                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedGrade}
                                onChange={(e) => setSelectedGrade(e.target.value)}
                                disabled={!selectedSubject}
                            >
                                <option value="">All Levels</option>
                                {grades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="pt-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    className="w-full pl-9 p-2 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-blue-500"
                                    placeholder="Search keywords..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="md:col-span-9 bg-slate-50 flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <div className="flex justify-center items-center h-full"><span className="loading loading-spinner text-blue-600">Loading DSKP...</span></div>
                            ) : Object.keys(groupedStandards).length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                    <BookOpen className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No standards found matching your criteria.</p>
                                </div>
                            ) : (
                                Object.entries(groupedStandards).map(([cs, list]: [string, any[]]) => {
                                    const isExpanded = expandedContent === cs;
                                    const selectedCount = list.filter(item => selectedLearningStandards.has(item.learningStandard)).length;

                                    return (
                                        <div key={cs} className={`bg-white rounded-2xl border transition-all ${isExpanded ? 'ring-2 ring-blue-500 shadow-xl z-10' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}>
                                            <div
                                                className="p-4 cursor-pointer flex justify-between items-start gap-4"
                                                onClick={() => setExpandedContent(isExpanded ? null : cs)}
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black uppercase tracking-wider">Content Standard</span>
                                                        {selectedCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-black">{selectedCount} Selected</span>}
                                                    </div>
                                                    <p className="font-bold text-slate-800 leading-snug">{cs}</p>
                                                </div>
                                                <Button size="sm" variant={isExpanded ? "primary" : "ghost"} className={isExpanded ? "" : "text-slate-400"}>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-1">
                                                    {list.map(std => {
                                                        const isSelected = selectedLearningStandards.has(std.learningStandard);
                                                        return (
                                                            <div
                                                                key={std.id}
                                                                onClick={() => toggleSelection(std.learningStandard)}
                                                                className={`p-3 rounded-xl cursor-pointer flex items-start gap-3 transition-all ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-white hover:shadow-sm text-slate-600'}`}
                                                            >
                                                                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-white bg-white/20' : 'border-slate-300 bg-white'}`}>
                                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <span className="text-sm font-medium leading-relaxed">{std.learningStandard}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* Footer / confirm bar */}
                        <div className="p-4 bg-white border-t flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500">{selectedLearningStandards.size} standards selected</span>
                            <div className="flex gap-3">
                                <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancel</Button>
                                <Button onClick={handleConfirm} disabled={selectedLearningStandards.size === 0} className="rounded-xl px-8 shadow-lg shadow-blue-500/20">
                                    Include {selectedLearningStandards.size} Standards
                                </Button>
                            </div>
                        </div>
                    </div>
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
