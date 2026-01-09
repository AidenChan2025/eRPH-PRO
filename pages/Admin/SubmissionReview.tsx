import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobal } from '../../context/GlobalContext';
import { firebaseService } from '../../services/firebaseService';
import { LessonRecord, WeeklySubmission, User } from '../../types';
import { Page, pdf } from '@react-pdf/renderer';
import { WeeklyPlanPDF } from '../../components/WeeklyPlanPDF';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Printer, MessageSquare } from 'lucide-react';
// import WeekView from '../../components/weekly/WeekView'; // Unused
// import LessonCard from '../../components/weekly/LessonCard'; // Unused 
// Actually WeekView is tied to "CurrentUser" and editing.
// We should probably adapt it or make a ReadOnly component.
// For speed, let's make a ReadOnly Wrapper or simpler view, OR modify WeekView.
// Modifying WeekView to accept "teacherId" overrides and "readOnly" props is best practice.
// But I cannot easily edit WeekView right now without risking regression.
// I will create a simple ReadOnly list here as the Review View to show distinct "Review" UI.
// Wait, the prompt says "Review Tool: Clicking a Pending week opens a read-only view...".
// Reusing the PDF layout logic for on-screen display is sometimes cleaner, but PDF is PDF.
// Let's build a custom ReadOnly view matching the LessonCard style but non-editable.

// To Save Time: I'll use the WeekView component logic but inline here for "SubmissionReview"
// OR better: Just render the `WeeklyPlanPDF` inside a PDFViewer?
// Browsers have good PDF viewers.
// But User wants "Approve Button", "Return Button".
// Let's render the lesson cards in a list.

// Let's just map data to a clean non-editable UI here.

const SubmissionReview = () => {
    const { teacherId, year, week } = useParams();
    const navigate = useNavigate();
    const { currentUser, schools } = useGlobal(); // We are Admin

    const [loading, setLoading] = useState(true);
    const [lessons, setLessons] = useState<LessonRecord[]>([]);
    const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
    const [teacher, setTeacher] = useState<User | null>(null);
    const [feedback, setFeedback] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!teacherId || !year || !week) return;
        const load = async () => {
            setLoading(true);
            try {
                // Fetch Submission
                const sub = await firebaseService.getWeeklySubmission(teacherId, parseInt(year), parseInt(week));
                setSubmission(sub);

                // Fetch Lessons
                const l = await firebaseService.getWeeklyLessons(teacherId, parseInt(year), parseInt(week));
                setLessons(l);

                // Fetch Teacher Info (Need a getUser method, but strict RLS might block if not admin? Admin can read users)
                // We fetched all teachers in dashboard. We can fetch again or cache. 
                // Let's rely on list presence or just display ID if lazy, but we need name for PDF.
                // Hack: We can filter from previously loaded if in context, or add getUser(uid).
                // Let's assumme we have a way. For now, mock name or use Dashboard context if passed (not passed).
                // Let's add getUser to service quickly? Or just Query users collection by ID.
                const teachers = await firebaseService.getAllTeachers(currentUser?.schoolId);
                const t = teachers.find(u => u.id === teacherId);
                setTeacher(t);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [teacherId, year, week, currentUser]);

    const handleApprove = async () => {
        if (!submission || !currentUser) return;
        if (!confirm("Approve this week?")) return;
        setProcessing(true);
        try {
            await firebaseService.reviewSubmission(submission.id, 'Approved', feedback, currentUser.id);
            alert("Approved!");
            navigate(-1);
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!submission || !currentUser) return;
        const reason = prompt("Enter revision feedback:", feedback);
        if (reason === null) return;
        setProcessing(true);
        try {
            await firebaseService.reviewSubmission(submission.id, 'Rejected', reason, currentUser.id);
            alert("Returned for revision.");
            navigate(-1);
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    const handlePrint = async () => {
        if (!teacher || !submission) return;
        const blob = await pdf(
            <WeeklyPlanPDF
                submission={submission}
                lessons={lessons}
                teacher={teacher}
            // school={schools.find(s => s.id === currentUser?.schoolId)} // Admin's school
            />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
    if (!submission || !teacher) return <div>Data not found.</div>;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Main Content: The Plan */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="max-w-4xl mx-auto space-y-8 pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-200 rounded-full">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Reviewing: {teacher.name}</h1>
                            <p className="text-slate-500 font-medium">Week {week} ({year}) • {lessons.length} Lessons</p>
                        </div>
                    </div>

                    {/* Read Only Lessons List */}
                    {lessons.length === 0 ? (
                        <div className="p-10 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-400">
                            No lessons submitted.
                        </div>
                    ) : (
                        lessons.sort((a, b) => (a.day - b.day) || a.startTime.localeCompare(b.startTime)).map(lesson => (
                            <div key={lesson.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{lesson.subjectId.replace(/_/g, ' ')}</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][lesson.day]} • {lesson.startTime} - {lesson.endTime} • {lesson.classId}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded">
                                        {lesson.theme || 'No Theme'}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    {lesson.objectives && (
                                        <div>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Objectives</h4>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.objectives}</p>
                                        </div>
                                    )}
                                    {lesson.activities && (
                                        <div>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Activities</h4>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{lesson.activities}</p>
                                        </div>
                                    )}
                                    {lesson.reflection && (
                                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Reflection</h4>
                                            <p className="text-sm text-amber-900 whitespace-pre-wrap">{lesson.reflection}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Sidebar: Actions */}
            <div className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col shadow-xl z-20">
                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    Review Actions
                </h2>

                <div className="space-y-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Current Status</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-block ${submission.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                            submission.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-200 text-slate-600'
                            }`}>
                            {submission.status}
                        </span>
                    </div>

                    {submission.comments && (
                        <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <h3 className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Previous Comment</h3>
                            <p className="text-sm text-yellow-800 italic">"{submission.comments}"</p>
                        </div>
                    )}
                </div>

                <div className="space-y-3 flex-1">
                    <textarea
                        className="w-full text-sm border-slate-200 rounded-xl p-3 h-32 resize-none focus:ring-2 focus:ring-blue-500 mb-4"
                        placeholder="Add revision feedback (optional)..."
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                    />

                    <button
                        onClick={handleApprove}
                        disabled={processing || submission.status === 'Approved'}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        <CheckCircle className="w-5 h-5" /> Approve Week
                    </button>

                    <button
                        onClick={handleReject}
                        disabled={processing}
                        className="w-full py-3 bg-white border-2 border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <XCircle className="w-5 h-5" /> Return for Revision
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                    <button
                        onClick={handlePrint}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                        <Printer className="w-5 h-5" /> Print Official PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmissionReview;
