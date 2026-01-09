import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LessonRecord, DSKPRecord } from '../../../types';
import { ChevronDown, ChevronUp, Copy, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { firebaseService } from '../../../services/firebaseService';
import Combobox from '../common/Combobox';

interface LessonCardProps {
    lesson: LessonRecord;
    dskp?: DSKPRecord | null;
    onUpdate: (updatedLesson: LessonRecord) => void;
    isSaving?: boolean;
    readOnly?: boolean;
}

const DEBOUNCE_DELAY = 3000;

const LessonCard: React.FC<LessonCardProps> = ({ lesson, dskp, onUpdate, isSaving, readOnly = false }) => {
    const { t } = useLanguage();

    // Local State
    const [localLesson, setLocalLesson] = useState<LessonRecord>(lesson);
    const [isExpanded, setIsExpanded] = useState(false);
    const [status, setStatus] = useState<'saved' | 'saving' | 'modified'>('saved');

    // DSKP Cascading Options
    const themes = useMemo(() => {
        if (!dskp) return [];
        return Array.from(new Set(dskp.standards.map(s => s.theme)));
    }, [dskp]);

    const sks = useMemo(() => {
        if (!dskp || !localLesson.theme) return [];
        return Array.from(new Set(
            dskp.standards
                .filter(s => s.theme === localLesson.theme)
                .map(s => s.sk)
        ));
    }, [dskp, localLesson.theme]);

    const sps = useMemo(() => {
        if (!dskp || !localLesson.theme || !localLesson.contentStandard) return [];
        return Array.from(new Set(
            dskp.standards
                .filter(s => s.theme === localLesson.theme && s.sk === localLesson.contentStandard)
                .map(s => s.sp)
        ));
    }, [dskp, localLesson.theme, localLesson.contentStandard]);

    // Handle Changes
    const handleChange = (field: keyof LessonRecord, value: any) => {
        setLocalLesson(prev => ({ ...prev, [field]: value }));
        setStatus('modified');
    };

    // Auto-Save Debounce
    useEffect(() => {
        if (status === 'modified') {
            const timer = setTimeout(() => {
                setStatus('saving');
                onUpdate(localLesson);
                // Optimistic UI update
                setStatus('saved');
            }, DEBOUNCE_DELAY);
            return () => clearTimeout(timer);
        }
    }, [localLesson, status, onUpdate]);

    useEffect(() => {
        if (isSaving) setStatus('saving');
        else if (status === 'saving') setStatus('saved');
    }, [isSaving]);

    // Enhanced Toast
    useEffect(() => {
        if (status === 'saved' && !readOnly) {
            const toast = document.createElement('div');
            toast.className = "fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300";
            toast.innerHTML = `
                <div class="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-xs font-bold">Changes Saved</span>
                    <span class="text-[10px] text-slate-400">Synced to cloud</span>
                </div>
                <div class="absolute bottom-0 left-0 h-0.5 bg-emerald-500 transition-all duration-2000 ease-linear w-full"></div>
            `;

            // Progress Bar Animation
            const progressBar = toast.querySelector('div:last-child') as HTMLElement;
            if (progressBar) {
                // Force reflow
                void progressBar.offsetWidth;
                progressBar.style.width = '0%';
            }

            document.body.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                toast.style.transition = 'all 0.3s ease';
            }, 2000);

            setTimeout(() => document.body.removeChild(toast), 2300);
        }
    }, [status, readOnly]);

    const handleCopyPrevious = async () => {
        if (!confirm("Overwrite current content with previous lesson?")) return;
        const prev = await firebaseService.getPreviousLesson(lesson.teacherId, lesson.subjectId, lesson.classId);
        if (prev) {
            setLocalLesson(curr => ({
                ...curr,
                theme: prev.theme,
                contentStandard: prev.contentStandard,
                learningStandard: prev.learningStandard,
                objectives: prev.objectives,
                activities: prev.activities,
                abm: prev.abm,
                reflection: prev.reflection
            }));
            setStatus('modified');
        } else {
            alert("No previous lesson found.");
        }
    };

    // Determine subject color (simple hash/mapping)
    const getSubjectColor = (subj: string) => {
        const s = subj.toLowerCase();
        if (s.includes('english')) return 'bg-blue-50 text-blue-700 border-blue-100';
        if (s.includes('melayu')) return 'bg-orange-50 text-orange-700 border-orange-100';
        if (s.includes('math')) return 'bg-red-50 text-red-700 border-red-100';
        if (s.includes('science')) return 'bg-green-50 text-green-700 border-green-100';
        if (s.includes('sejarah')) return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const subjectStyle = getSubjectColor(lesson.subjectId);

    return (
        <div className={`group bg-white border border-slate-200/60 rounded-xl shadow-sm hover:shadow-lg hover:border-blue-300/50 transition-all duration-300 mb-4 overflow-hidden ${isExpanded ? 'ring-2 ring-blue-500/10' : ''}`}>
            {/* Header */}
            <div
                className={`p-4 cursor-pointer flex items-center justify-between bg-white transition-colors duration-200 ${isExpanded ? 'bg-slate-50/50' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col gap-1.5 overflow-hidden">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="font-black text-slate-800 text-sm font-mono tracking-tight">{lesson.startTime} - {lesson.endTime}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${subjectStyle}`}>
                                {lesson.subjectId.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500 tracking-wider">
                            {lesson.classId}
                        </span>
                    </div>
                    {!isExpanded && (
                        <p className="text-xs text-slate-400 truncate w-full max-w-md font-medium">
                            {localLesson.theme ? (
                                <span className="text-slate-600">{localLesson.theme}</span>
                            ) : (
                                <span className="italic opacity-50">Drafting...</span>
                            )}
                            {localLesson.learningStandard && (
                                <> <span className="opacity-30 mx-1">/</span> {localLesson.learningStandard} </>
                            )}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <div className="relative">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300
                            ${status === 'modified' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                status === 'saving' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                            {status === 'modified' && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Unsaved
                                </>
                            )}
                            {status === 'saving' && (
                                <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                                    Saving
                                </>
                            )}
                            {status === 'saved' && (
                                <>
                                    <CheckCircle className="w-3 h-3" />
                                    Saved
                                </>
                            )}
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />}
                </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
                <div className="p-5 sm:p-6 space-y-6 border-t border-slate-100 bg-white/50 backdrop-blur-sm animate-in slide-in-from-top-1 duration-200">

                    {/* Toolbar */}
                    <div className="flex justify-end -mt-2 mb-2">
                        {!readOnly && (
                            <button
                                onClick={handleCopyPrevious}
                                className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                            >
                                <Copy className="w-3 h-3" /> Copy Last Lesson
                            </button>
                        )}
                    </div>

                    {/* DSKP Section */}
                    {dskp ? (
                        <div className="grid gap-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                    <Search className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Digital DSKP Selector</h4>
                            </div>

                            <Combobox
                                label="Theme / Bidang"
                                value={localLesson.theme}
                                onChange={(val) => handleChange('theme', val)}
                                options={themes}
                                placeholder="Search or select theme..."
                                disabled={readOnly}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Combobox
                                    label="Standard Kandungan (SK)"
                                    value={localLesson.contentStandard}
                                    onChange={(val) => handleChange('contentStandard', val)}
                                    options={sks}
                                    placeholder="Search SK..."
                                    disabled={!localLesson.theme || readOnly}
                                />
                                <Combobox
                                    label="Standard Pembelajaran (SP)"
                                    value={localLesson.learningStandard}
                                    onChange={(val) => handleChange('learningStandard', val)}
                                    options={sps}
                                    placeholder="Search SP..."
                                    disabled={!localLesson.contentStandard || readOnly}
                                />
                            </div>
                        </div>
                    ) : (
                        // Skeleton / No Data State
                        <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100/60 text-amber-800 text-xs flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-bold">No DSKP Connected</p>
                                <p className="opacity-80">We couldn't match a curriculum standard for {lesson.subjectId}. Please type manually below.</p>
                            </div>
                        </div>
                    )}

                    {/* Editor Fields */}
                    <div className="space-y-5">
                        <div className="group/field focus-within:ring-2 focus-within:ring-blue-500/10 rounded-2xl transition-all">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                Learning Objectives
                            </label>
                            <textarea
                                className="w-full min-h-[100px] text-sm text-slate-700 bg-white border border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all resize-y placeholder:text-slate-300"
                                placeholder="By the end of the lesson, pupils will be able to..."
                                value={localLesson.objectives || ''}
                                onChange={e => handleChange('objectives', e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        <div className="group/field focus-within:ring-2 focus-within:ring-blue-500/10 rounded-2xl transition-all">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                Activities
                            </label>
                            <textarea
                                className="w-full min-h-[120px] text-sm text-slate-700 bg-white border border-slate-200 rounded-2xl p-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all resize-y placeholder:text-slate-300"
                                placeholder="1. Induction..."
                                value={localLesson.activities || ''}
                                onChange={e => handleChange('activities', e.target.value)}
                                disabled={readOnly}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                    Teaching Aids
                                </label>
                                <input
                                    className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    placeholder="Projector, Textbooks..."
                                    value={localLesson.abm || ''}
                                    onChange={e => handleChange('abm', e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">
                                    Reflection
                                </label>
                                <textarea
                                    className="w-full min-h-[50px] text-sm text-slate-700 bg-white border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all resize-y"
                                    placeholder="Impact/Analysis..."
                                    value={localLesson.reflection || ''}
                                    onChange={e => handleChange('reflection', e.target.value)}
                                    disabled={readOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonCard;
