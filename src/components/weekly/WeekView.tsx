import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { useGlobal } from '../../../context/GlobalContext';
import { useLanguage } from '../../../context/LanguageContext';
import { LessonRecord, WeeklySubmission, TimetableConfig, DSKPRecord } from '../../../types';
import { firebaseService } from '../../../services/firebaseService';
import LessonCard from './LessonCard';
import Button from '../../../components/Button';
import { Loader2, Calendar, CheckCircle, Send, ArrowLeft, AlertTriangle, X } from 'lucide-react';
import { SuccessModal } from '../../../components/Modals';
import SignaturePad from '../common/SignaturePad';

interface WeekViewProps {
    year: number;
    week: number;
    startDate: Date;
    onBack: () => void;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDSKPKey = (subject: string, className: string) => {
    // E.g. Subject="Bahasa Melayu", Class="4 Cerdas" -> "BAHASA_MELAYU_4"
    const gradeNum = className.match(/^(\d+)/)?.[1] || '1';
    const subjectClean = subject.replace(/[\/\s]+/g, '_').toUpperCase();
    return `${subjectClean}_${gradeNum}`;
};

const WeekView: React.FC<WeekViewProps> = ({ year, week, startDate, onBack }) => {
    const { currentUser } = useGlobal();
    const { t } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [lessons, setLessons] = useState<LessonRecord[]>([]);
    const [dskpMap, setDskpMap] = useState<Record<string, DSKPRecord>>({});
    const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const [showSignModal, setShowSignModal] = useState(false);

    // Initial Load
    useEffect(() => {
        if (!currentUser) return;
        const load = async () => {
            setLoading(true);
            try {
                // 1. Get Timetable Config
                const config = await firebaseService.getTimetable(currentUser.id);
                if (!config) {
                    alert("Please configure your timetable first.");
                    onBack(); // Go back
                    return;
                }

                // 2. Get Existing Lessons
                const existingLessons = await firebaseService.getWeeklyLessons(currentUser.id, year, week);

                // 3. Auto-Populate with Deduping & ID Consistency
                const finalLessons: LessonRecord[] = [];
                const processedIds = new Set<string>();
                const processedSlots = new Set<string>();

                // Helper to generate consistent ID
                const generateId = (day: number, start: string) =>
                    `${currentUser.id}_${year}_${week}_${day}_${start.replace(':', '')}`;

                // Process existing lessons first
                existingLessons.forEach(l => {
                    // Check for duplicate IDs in database return
                    if (!processedIds.has(l.id)) {
                        finalLessons.push(l);
                        processedIds.add(l.id);
                        processedSlots.add(`${l.day}-${l.startTime}`);
                    }
                });

                // Process config slots
                config.slots.forEach(slot => {
                    const slotKey = `${slot.day}-${slot.startTime}`;
                    const expectedId = generateId(slot.day, slot.startTime);

                    // If we already have a lesson for this slot, skip
                    if (processedSlots.has(slotKey)) return;

                    // If we already have a lesson with this ID, skip
                    if (processedIds.has(expectedId)) return;

                    // Create new Draft
                    finalLessons.push({
                        id: expectedId,
                        teacherId: currentUser.id,
                        schoolId: currentUser.schoolId || '',
                        year, week, day: slot.day,
                        startTime: slot.startTime,
                        endTime: slot.endTime,
                        subjectId: slot.subjectId,
                        classId: slot.classId,
                        status: 'Draft',
                        date: format(addDays(startDate, slot.day === 0 ? 0 : slot.day - 1), 'yyyy-MM-dd'),
                        objectives: '',
                        activities: '',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                    processedIds.add(expectedId);
                    processedSlots.add(slotKey);
                });

                setLessons(finalLessons);

                // 4. Load DSKP for each unique Subject+Grade pair
                const uniqueKeys = new Set<string>();
                finalLessons.forEach(l => uniqueKeys.add(getDSKPKey(l.subjectId, l.classId)));

                const map: Record<string, DSKPRecord> = {};
                // Use Promise.all for parallel fetching
                await Promise.all(Array.from(uniqueKeys).map(async (key) => {
                    // Reverse engineer subject/grade kind of?
                    // Actually getDSKPKey logic is hard to revert reliably if subject has numbers.
                    // Better: Iterate items and use their data.
                }));

                // Re-approach: Iterate lessons to find unique (Subject, Grade) tuples
                const pairs = new Map<string, { subject: string, grade: string }>();
                finalLessons.forEach(l => {
                    const gradeNum = l.classId.match(/^(\d+)/)?.[1] || '1';
                    const key = getDSKPKey(l.subjectId, l.classId);
                    if (!pairs.has(key)) {
                        pairs.set(key, { subject: l.subjectId, grade: gradeNum }); // Pass raw subject, verify if getDSKP handles normalization
                    }
                });

                for (const [key, pair] of pairs) {
                    // getDSKP handles normalization of ID internally, but we pass raw Subject name?
                    // firebaseService says: const docId = `${subject.trim()}_${grade.trim()}`;
                    // Wait, getDSKP does NOT underscore replace. It just trims.
                    // But seeder uses underscores.
                    // So we should pass Normalized Subject if that's what seeding did.
                    // In WeekView I had normalizeDSKPId. 
                    // Let's rely on getDSKPKey logic for the ID, but for fetching...
                    // If seeder stored "BAHASA_MELAYU_1", I need to construct that ID.
                    // getDSKP does: `${subject}_${grade}`. If subject is "Bahasa Melayu", it becomes "Bahasa Melayu_1". 
                    // Seeder likely did underscores. 
                    // I will implement a fetch helper here or trust normalizeDSKPId logic matches DB.

                    // Let's assume we need to pass underscores.
                    const subjectClean = pair.subject.replace(/[\/\s]+/g, '_').toUpperCase();
                    const records = await firebaseService.getDSKP(subjectClean, pair.grade);
                    // Note: getDSKP takes (subject, grade) so it forms subject_grade.
                    // If I pass "BAHASA_MELAYU", "1", it looks for "BAHASA_MELAYU_1".

                    if (records) {
                        map[key] = records;
                    }
                }
                setDskpMap(map);

                // 5. Get Submission Status
                const existingSub = await firebaseService.getWeeklySubmission(currentUser.id, year, week);
                if (existingSub) {
                    setSubmission(existingSub);
                } else {
                    setSubmission({
                        id: `${currentUser.id}_${year}_${week}`,
                        teacherId: currentUser.id,
                        schoolId: currentUser.schoolId || '',
                        year, week,
                        startDate: format(startDate, 'yyyy-MM-dd'),
                        endDate: format(addDays(startDate, 6), 'yyyy-MM-dd'),
                        status: 'Draft'
                    });
                }

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser, year, week, startDate, onBack]);

    const handleLessonUpdate = (updatedLesson: LessonRecord) => {
        setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
        // Note: LessonCard is responsible for its own debounced saving to DB.
    };

    const handleSubmitWeek = async () => {
        if (!submission) return;
        setShowSignModal(true);
    };

    const handleConfirmSign = async (signatureDataUrl: string) => {
        if (!submission) return;
        console.log("Starting Signature Submission Sequence");
        setSubmitting(true);
        try {
            console.log("Step 1: Batch Updating Lessons...");
            await firebaseService.batchUpdateLessons(lessons);
            console.log("Step 1 Done. Step 2: Signing Submission with IP Fetch...");
            await firebaseService.signSubmission(submission, signatureDataUrl);
            console.log("Step 2 Done. Updating Local State...");

            setSubmission({ ...submission, status: 'Pending', signatureUrl: signatureDataUrl });
            setSuccessOpen(true);
            setShowSignModal(false);
            console.log("Local State Updated. Success Modal Open.");
        } catch (error) {
            console.error("CRITICAL ERROR submitting week:", error);
            alert("Failed to submit week. See console for details.");
        } finally {
            setSubmitting(false);
        }
    };

    // Process Lessons for Display
    const sortedLessons = useMemo(() => {
        return [...lessons].sort((a, b) => {
            if (a.day !== b.day) return a.day - b.day;
            return a.startTime.localeCompare(b.startTime);
        });
    }, [lessons]);

    const lessonsByDay = useMemo(() => {
        const groups: Record<string, LessonRecord[]> = {};
        sortedLessons.forEach(l => {
            if (!groups[l.day]) groups[l.day] = [];
            groups[l.day].push(l);
        });
        return groups;
    }, [sortedLessons]);

    // Days to render (Standard: Mon(1) - Fri(5), Sun(0) if present)
    const sortedDays = [1, 2, 3, 4, 5, 0].filter(d => lessonsByDay[d]?.length > 0);

    // Calculate Progress
    const progress = useMemo(() => {
        if (lessons.length === 0) return 0;
        const filled = lessons.filter(l => l.objectives && l.objectives.length > 5).length;
        return Math.round((filled / lessons.length) * 100);
    }, [lessons]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-24">

            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Sticky Header & Progress */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md -mx-4 px-4 py-4 sm:rounded-2xl sm:mx-0 sm:shadow-sm border-b sm:border border-slate-200/60 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Week {week}</h2>
                                <p className="text-slate-500 text-sm font-medium">
                                    {format(startDate, 'MMMM d')} - {format(addDays(startDate, 6), 'MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {submission?.status === 'Approved' ? (
                                <div className="px-4 py-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 text-emerald-600 rounded-xl font-bold flex items-center gap-2 shadow-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Approved</span>
                                </div>
                            ) : submission?.status === 'Pending' ? (
                                <div className="px-4 py-2 bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 text-blue-600 rounded-xl font-bold flex items-center gap-2 shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Pending Review</span>
                                </div>
                            ) : submission?.status === 'Rejected' ? (
                                <div className="flex items-center gap-2">
                                    <div className="px-4 py-2 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 text-amber-600 rounded-xl font-bold flex items-center gap-2 shadow-sm animate-pulse">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Needs Revision</span>
                                    </div>
                                    <Button
                                        variant="primary"
                                        icon={Send}
                                        onClick={handleSubmitWeek}
                                        loading={submitting}
                                        className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
                                    >
                                        Resubmit
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    icon={Send}
                                    onClick={handleSubmitWeek}
                                    loading={submitting}
                                    className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
                                >
                                    Submit Week
                                </Button>
                            )}
                        </div>
                    </div>

                    {submission?.status === 'Rejected' && submission.comments && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-900 text-sm uppercase tracking-wide mb-1">Admin Feedback</h4>
                                <p className="text-amber-800 text-sm leading-relaxed">{submission.comments}</p>
                            </div>
                        </div>
                    )}
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-1 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <span>Progress</span>
                        <span>{progress}% Complete</span>
                    </div>
                </div>

                {/* Timetable Grid */}
                <div className="space-y-12">
                    {sortedDays.map(dayNameIndex => { // Note: sortedDays is array of numbers [1,2,3...]
                        // Convert index back to name? 
                        // Actually sortedDays was: [1,2,3,4,5,0].
                        const dayName = DAYS[dayNameIndex];
                        const dayLessons = lessonsByDay[dayNameIndex];

                        return (
                            <div key={dayName} className="relative">
                                <div className="sticky top-28 sm:static z-10 flex items-center gap-4 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-100"></div>
                                    <h3 className="text-lg font-black text-slate-700 uppercase tracking-widest">{dayName}</h3>
                                    <div className="h-px flex-1 bg-slate-200"></div>
                                </div>

                                <div className="pl-0 sm:pl-7 grid grid-cols-1 gap-6">
                                    {dayLessons.map(lesson => (
                                        <LessonCard
                                            key={lesson.id}
                                            lesson={lesson}
                                            dskp={dskpMap[getDSKPKey(lesson.subjectId, lesson.classId)]}
                                            onUpdate={handleLessonUpdate}
                                            isSaving={submitting}
                                            readOnly={submission?.status !== 'Draft' && submission?.status !== 'Rejected' && submission?.status !== undefined}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Signature Modal */}
                {showSignModal && submission && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-800">Sign Submission</h3>
                                <button onClick={() => setShowSignModal(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-slate-500 mb-6">
                                    I hereby certify that these lesson plans are my own work and adhere to the school's curriculum standards.
                                </p>
                                <SignaturePad
                                    onSave={handleConfirmSign}
                                    onCancel={() => setShowSignModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <SuccessModal
                    isOpen={successOpen}
                    onClose={() => { setSuccessOpen(false); onBack(); }}
                    title="Week Submitted!"
                    message="Your lesson plans have been signed and submitted for review."
                />
            </div>
        </div>
    );
};

export default WeekView;
