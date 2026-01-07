
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LessonPlan, LessonStatus, DSKPStandard } from '../types';
import {
    Loader2, BookOpen, Save, Printer, ArrowLeft, Check,
    ChevronDown, Clock, Users, Plus, X,
    ListChecks, Zap, Layers, Target, MessageSquareText, Search, GraduationCap
} from 'lucide-react';
import {
    TEACHING_AIDS, PAK21, ASSESSMENTS,
    getLocalizedOptions, SupportedLanguage
} from '../utils/smartConstants';
import {
    generateObjectives, generateSuccessCriteria,
    generateActivities, detectSubjectLanguage
} from '../utils/smartParser';
import { PrintPreviewModal, DskpBrowserModal, SuccessModal } from '../components/Modals';
import { ListEditor, TagSelector } from '../components/LessonPlanComponents';
import { doc, getDoc, db, setDoc } from '../services/firebase';

const LessonPlanEditor = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { currentUser, schools, getAcademicWeek } = useGlobal();

    const currentSchool = schools.find(s => s.id === currentUser?.schoolId);
    const settings = currentSchool?.settings;

    const [plan, setPlan] = useState<Partial<LessonPlan>>({
        subject: '', grade: '', className: '', time: '08:00 - 09:00', topic: '', date: new Date().toISOString().split('T')[0],
        objectives: [], successCriteria: [], activities: [],
        teachingAids: [], pak21: [], assessment: [], status: LessonStatus.DRAFT,
        reflection: '',
        version: 1, updatedAt: new Date().toISOString(), history: []
    });
    const [loading, setLoading] = useState(!!id);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [showDskpBrowser, setShowDskpBrowser] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Smart Engine State
    const [isSubjectOpen, setIsSubjectOpen] = useState(false);
    const [subjectSearch, setSubjectSearch] = useState('');
    const [currentLang, setCurrentLang] = useState<SupportedLanguage>('ms');

    // Default Subjects List (Fallback) - Memoized
    const DEFAULT_SUBJECTS = useMemo(() => ["Bahasa Melayu", "English", "Matematik", "Sains", "Sejarah", "Reka Bentuk dan Teknologi", "Pendidikan Islam", "Pendidikan Moral", "Pendidikan Jasmani dan Kesihatan", "Pendidikan Seni Visual", "Pendidikan Muzik", "Bahasa Arab", "Bahasa Cina", "Bahasa Tamil", "Bahasa Iban", "Bahasa Kadazandusun", "Bahasa Semai"], []);

    const allSubjects = useMemo(() => Array.from(new Set([...(settings?.customSubjects || []), ...DEFAULT_SUBJECTS])).sort(), [settings?.customSubjects, DEFAULT_SUBJECTS]);

    // Memoized Filtering
    const filteredSubjects = useMemo(() => {
        const query = subjectSearch.toLowerCase();
        return allSubjects.filter(s => s.toLowerCase().includes(query));
    }, [allSubjects, subjectSearch]);

    useEffect(() => {
        if (id) {
            getDoc(doc(db, 'lessonPlans', id)).then(snap => {
                if (snap.exists()) {
                    const data = snap.data() as LessonPlan;
                    setPlan(data);
                    if (data.subject) setCurrentLang(detectSubjectLanguage(data.subject));
                }
                setLoading(false);
            });
        }
    }, [id]);

    // Smart Auto-Fill
    // Smart Generation Logic
    // Smart Generation Logic
    const generateSmartContent = useCallback((std: string, lang: SupportedLanguage) => {
        if (!std) return;

        setPlan(prev => ({
            ...prev,
            objectives: (prev.objectives?.length === 0) ? generateObjectives(std, lang) : prev.objectives,
            successCriteria: (prev.successCriteria?.length === 0) ? generateSuccessCriteria(std, lang) : prev.successCriteria,
            activities: (prev.activities?.length === 0) ? generateActivities(std, lang) : prev.activities
        }));
    }, []);

    useEffect(() => {
        if (plan.subject) {
            setCurrentLang(detectSubjectLanguage(plan.subject));
        }
    }, [plan.subject]);

    const handleSave = async (status: LessonStatus) => {
        const now = new Date().toISOString();
        const planId = id || `lp-${Date.now()}`;
        const newPlan = { ...plan, id: planId, teacherId: currentUser?.id, teacherName: currentUser?.name, schoolId: currentUser?.schoolId || '', status, updatedAt: now };
        await setDoc(doc(db, 'lessonPlans', planId), newPlan);
        setShowSuccess(true);
    };

    const handleDskpSelect = useCallback((std: DSKPStandard) => {
        const lang = detectSubjectLanguage(std.subject);
        setPlan(prev => ({ ...prev, contentStandard: std.contentStandard, learningStandard: std.learningStandard, subject: prev.subject || std.subject, grade: prev.grade || std.grade }));
        setCurrentLang(lang);
        generateSmartContent(std.learningStandard, lang);
        setShowDskpBrowser(false);
    }, [generateSmartContent]);

    const updateList = useCallback((f: string, i: number, v: string) => {
        setPlan(prev => {
            const list = [...(prev as any)[f] || []];
            list[i] = v;
            return { ...prev, [f]: list };
        });
    }, []);

    const addList = useCallback((f: string) => {
        setPlan(prev => ({ ...prev, [f]: [...(prev as any)[f] || [], ''] }));
    }, []);

    const removeList = useCallback((f: string, i: number) => {
        setPlan(prev => {
            const list = [...(prev as any)[f] || []];
            list.splice(i, 1);
            return { ...prev, [f]: list };
        });
    }, []);

    const toggleTag = useCallback((field: keyof LessonPlan, value: string) => {
        setPlan(prev => {
            const current = (prev[field] as string[]) || [];
            return {
                ...prev,
                [field]: current.includes(value) ? current.filter(i => i !== value) : [...current, value]
            };
        });
    }, []);

    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 p-4 md:p-0 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white p-4 border rounded-2xl shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/portal/plans')} className="rounded-xl">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{id ? t('edit_plan_title') : t('new_plan_title')}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowPrintPreview(true)} className="rounded-xl font-bold">
                        <Printer className="w-4 h-4 mr-2" /> {t('print')}
                    </Button>
                    <Button onClick={() => handleSave(LessonStatus.SUBMITTED)} size="sm" className="rounded-xl font-bold shadow-lg shadow-blue-200">
                        <Save className="w-4 h-4 mr-2" /> {t('save')}
                    </Button>
                </div>
            </div>

            <Card className="p-8 space-y-8 rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Subject Combobox */}
                    <div className="space-y-1.5 relative z-30">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('subject')}</label>
                        <div className="relative group">
                            <button
                                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                                className="w-full text-left border-2 border-slate-100 p-3 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:border-blue-500 transition-all pr-10 truncate"
                            >
                                {plan.subject || "Select Subject"}
                            </button>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />

                            {isSubjectOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 border-b border-slate-50">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input
                                                autoFocus
                                                className="w-full pl-9 p-2 text-sm font-bold bg-slate-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                                placeholder="Search subject..."
                                                value={subjectSearch}
                                                onChange={e => setSubjectSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                                        {filteredSubjects.map(s => (
                                            <button
                                                key={s}
                                                onClick={() => { setPlan({ ...plan, subject: s }); setIsSubjectOpen(false); }}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all ${plan.subject === s ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {isSubjectOpen && <div className="fixed inset-0 z-[-1]" onClick={() => setIsSubjectOpen(false)} />}
                    </div>

                    {/* Year/Grade Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year / Grade</label>
                        <div className="relative group">
                            <select
                                className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold appearance-none bg-slate-50/50 outline-none focus:border-blue-500 transition-all pr-10"
                                value={plan.grade}
                                onChange={e => setPlan({ ...plan, grade: e.target.value })}
                            >
                                <option value="">Level</option>
                                <optgroup label="Primary School">
                                    {[1, 2, 3, 4, 5, 6].map(y => <option key={`y${y}`} value={`Tahun ${y}`}>Tahun {y}</option>)}
                                    <option value="Pra Sekolah">Pra Sekolah</option>
                                </optgroup>
                                <optgroup label="Secondary School">
                                    {[1, 2, 3, 4, 5].map(f => <option key={`f${f}`} value={`Tingkatan ${f}`}>Tingkatan {f}</option>)}
                                    <option value="Peralihan">Peralihan</option>
                                </optgroup>
                            </select>
                            <GraduationCap className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-blue-600 transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('class_label')}</label>
                        <div className="relative group">
                            <select
                                className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold appearance-none bg-slate-50/50 outline-none focus:border-blue-500 transition-all pr-10"
                                value={plan.className}
                                onChange={e => setPlan({ ...plan, className: e.target.value })}
                            >
                                <option value="">Select Class</option>
                                {settings?.customClasses?.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <Users className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-blue-600 transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('time')}</label>
                        <div className="relative group">
                            <select
                                className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold appearance-none bg-slate-50/50 outline-none focus:border-blue-500 transition-all pr-10"
                                value={plan.time}
                                onChange={e => setPlan({ ...plan, time: e.target.value })}
                            >
                                {settings?.customTimeSlots?.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <Clock className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-blue-600 transition-colors" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('date')}</label>
                        <input type="date" className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold bg-slate-50/50 outline-none focus:border-blue-500 transition-all" value={plan.date} onChange={e => setPlan({ ...plan, date: e.target.value })} />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-3 px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('topic')}</label>
                        <button onClick={() => setShowDskpBrowser(true)} className="text-[9px] font-black uppercase bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-100 hover:bg-blue-100 flex items-center gap-2 transition-all shadow-sm">
                            <BookOpen className="w-3.5 h-3.5" /> {t('browse_dskp')}
                        </button>
                    </div>
                    <input
                        className="w-full text-2xl font-black border-b-2 border-slate-100 pb-3 outline-none focus:border-blue-500 transition-all bg-transparent placeholder:text-slate-200"
                        value={plan.topic}
                        onChange={e => setPlan({ ...plan, topic: e.target.value })}
                        placeholder="Describe your lesson focus..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('content_standard')}</label>
                        <textarea className="w-full border-2 border-slate-100 p-5 rounded-3xl text-sm font-medium h-32 focus:border-blue-500 outline-none transition-all shadow-inner bg-slate-50/30" value={plan.contentStandard} onChange={e => setPlan({ ...plan, contentStandard: e.target.value })} placeholder="Paste or browse standard..." />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('learning_standard')}</label>
                            <button
                                onClick={() => generateSmartContent(plan.learningStandard || '', currentLang)}
                                className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors uppercase tracking-tight"
                            >
                                <Zap className="w-3 h-3" /> Auto-Generate
                            </button>
                        </div>
                        <textarea
                            className="w-full border-2 border-slate-100 p-5 rounded-3xl text-sm font-medium h-32 focus:border-blue-500 outline-none transition-all shadow-inner bg-slate-50/30"
                            value={plan.learningStandard}
                            onChange={e => setPlan({ ...plan, learningStandard: e.target.value })}
                            onBlur={() => generateSmartContent(plan.learningStandard || '', currentLang)}
                            placeholder="Paste or browse standard..."
                        />
                    </div>
                </div>

                <ListEditor
                    title={t('objectives')}
                    items={plan.objectives || []}
                    onUpdate={(i, v) => updateList('objectives', i, v)}
                    onAdd={() => addList('objectives')}
                    onRemove={(i) => removeList('objectives', i)}
                    placeholder="e.g. Students can identify at least 3 types of..."
                    icon={<Target className="w-4 h-4" />}
                    colorClass="blue"
                    emptyMessage="Click '+' to define lesson objectives."
                />

                <ListEditor
                    title={t('success_criteria')}
                    items={plan.successCriteria || []}
                    onUpdate={(i, v) => updateList('successCriteria', i, v)}
                    onAdd={() => addList('successCriteria')}
                    onRemove={(i) => removeList('successCriteria', i)}
                    placeholder="e.g. I can describe the process of..."
                    icon={<CheckSquare className="w-4 h-4" />}
                    colorClass="emerald"
                    emptyMessage="Define measurable success criteria."
                />

                <ListEditor
                    title={t('learning_activities')}
                    items={plan.activities || []}
                    onUpdate={(i, v) => updateList('activities', i, v)}
                    onAdd={() => addList('activities')}
                    onRemove={(i) => removeList('activities', i)}
                    placeholder="Describe interaction..."
                    icon={<Layers className="w-4 h-4" />}
                    colorClass="indigo"
                    isTextArea
                    labels={(i, len) => i === 0 ? 'Induction' : i === len - 1 ? 'Closure' : `Step ${i}`}
                    emptyMessage="Break down the lesson into manageable steps."
                />
            </Card>

            <Card className="p-8 rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <TagSelector
                        title={t('resources_bbm')}
                        options={getLocalizedOptions(TEACHING_AIDS, currentLang)}
                        selected={plan.teachingAids || []}
                        onToggle={(v) => toggleTag('teachingAids', v)}
                        colorClass="blue"
                    />

                    <TagSelector
                        title={t('pak21_elements')}
                        options={getLocalizedOptions(PAK21, currentLang)}
                        selected={plan.pak21 || []}
                        onToggle={(v) => toggleTag('pak21', v)}
                        colorClass="indigo"
                    />

                    <TagSelector
                        title={t('assessment_pbd')}
                        options={getLocalizedOptions(ASSESSMENTS, currentLang)}
                        selected={plan.assessment || []}
                        onToggle={(v) => toggleTag('assessment', v)}
                        colorClass="emerald"
                    />
                </div>
            </Card>

            <Card className="p-8 border-l-8 border-l-blue-600 shadow-2xl bg-white rounded-3xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><MessageSquareText className="w-6 h-6" /></div>
                        <div>
                            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{t('impact_reflection')}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('impact_assessment')}</p>
                        </div>
                    </div>
                </div>
                <textarea
                    className="w-full border-2 border-slate-100 p-6 rounded-[2.5rem] text-sm font-bold h-44 outline-none transition-all shadow-inner bg-slate-50/30 focus:bg-white focus:border-blue-400 placeholder:text-slate-200"
                    value={plan.reflection}
                    onChange={e => setPlan({ ...plan, reflection: e.target.value })}
                    placeholder="Record the impact of the lesson. What worked? Who needed extra help?"
                />
            </Card>

            {showPrintPreview && <PrintPreviewModal plans={[plan as LessonPlan]} onClose={() => setShowPrintPreview(false)} schoolName={currentSchool?.name || "eRPH Pro"} getWeek={getAcademicWeek} />}
            <DskpBrowserModal isOpen={showDskpBrowser} onClose={() => setShowDskpBrowser(false)} onSelect={handleDskpSelect} currentSubject={plan.subject} />
            <SuccessModal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title="Lesson Plan Saved!"
                message="Your RPH has been securely stored. What would you like to do next?"
                primaryActionLabel="Return to Dashboard"
                onPrimaryAction={() => navigate('/portal/plans')}
                secondaryActionLabel="Keep Editing"
            />
        </div>
    );
};

const CheckSquare = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-check-square ${props.className}`}>
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
);

export default LessonPlanEditor;
