
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LessonPlan, UserRole, LessonStatus } from '../types';
import { PrintPreviewModal } from '../components/Modals';
import { ChevronLeft, ChevronRight, Plus, Printer, Calendar, Users, List, Loader2, RefreshCw, Send } from 'lucide-react';
import { collection, query, where, getDocs, db, orderBy, limit, startAfter, writeBatch, doc } from '../services/firebase';

const LessonPlanList = () => {
    const { t } = useLanguage();
    const { currentUser, schools, getAcademicWeek, isSeeding } = useGlobal();
    const navigate = useNavigate();

    // View State
    const [view, setView] = useState<'list' | 'month' | 'week' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;
    const [pageCursors, setPageCursors] = useState<any[]>([null]);
    const [hasMore, setHasMore] = useState(true);
    const lastVisibleRef = useRef<any>(null);

    // Data State
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [plansToPrint, setPlansToPrint] = useState<LessonPlan[] | null>(null);

    const schoolName = schools.find(s => s.id === currentUser?.schoolId)?.name || 'Sekolah';

    // Reset pagination when view changes
    useEffect(() => {
        setCurrentPage(1);
        setPageCursors([null]);
        setHasMore(true);
        lastVisibleRef.current = null;
    }, [view]);

    // Scroll to top when page changes in list view
    useEffect(() => {
        if (view === 'list') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, view]);

    // --- FETCH DATA (On-Demand) ---
    const fetchData = useCallback(async () => {
        if (!currentUser) return;

        setIsLoadingData(true);
        let q: any;
        const plansRef = collection(db, 'lessonPlans');

        try {
            if (view === 'list') {
                const constraints: any[] = [
                    where('teacherId', '==', currentUser.id),
                    orderBy('date', 'desc')
                ];

                // Use the cursor for the current page start
                const cursor = pageCursors[currentPage - 1];
                if (cursor) {
                    constraints.push(startAfter(cursor));
                }

                constraints.push(limit(ITEMS_PER_PAGE));
                q = query(plansRef, ...constraints);
            } else {
                let startStr = '';
                let endStr = '';
                const y = currentDate.getFullYear();
                const m = currentDate.getMonth();

                if (view === 'month') {
                    const firstDay = new Date(y, m, 1);
                    const lastDay = new Date(y, m + 1, 0);
                    const s = new Date(firstDay); s.setDate(s.getDate() - s.getDay());
                    const e = new Date(lastDay); e.setDate(e.getDate() + (6 - e.getDay()));
                    startStr = s.toISOString().split('T')[0];
                    endStr = e.toISOString().split('T')[0];
                } else if (view === 'week') {
                    const s = new Date(currentDate); s.setDate(s.getDate() - s.getDay());
                    const e = new Date(s); e.setDate(e.getDate() + 6);
                    startStr = s.toISOString().split('T')[0];
                    endStr = e.toISOString().split('T')[0];
                } else {
                    startStr = currentDate.toISOString().split('T')[0];
                    endStr = startStr;
                }

                let constraints: any[] = [
                    where('teacherId', '==', currentUser.id),
                    where('date', '>=', startStr),
                    where('date', '<=', endStr)
                ];
                constraints.push(orderBy('date', 'desc'));
                q = query(plansRef, ...constraints);
            }

            const snap = await getDocs(q);

            // Capture last visible document for next page cursor
            if (snap.docs.length > 0) {
                lastVisibleRef.current = snap.docs[snap.docs.length - 1];
            }

            const fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as LessonPlan));
            setLessonPlans(fetched);

            if (view === 'list') {
                setHasMore(fetched.length === ITEMS_PER_PAGE);
            }

        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setIsLoadingData(false);
        }
    }, [view, currentDate, currentUser, currentPage, pageCursors]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleNextPage = () => {
        if (!hasMore) return;

        const nextCursor = lastVisibleRef.current;
        if (nextCursor) {
            setPageCursors(prev => {
                const newCursors = [...prev];
                newCursors[currentPage] = nextCursor;
                return newCursors;
            });
            setCurrentPage(p => p + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage <= 1) return;
        setCurrentPage(p => p - 1);
    };

    // Group by Date
    const plansByDate = useMemo(() => {
        const map: Record<string, LessonPlan[]> = {};
        lessonPlans.forEach(p => {
            if (!map[p.date]) map[p.date] = [];
            map[p.date].push(p);
        });
        return map;
    }, [lessonPlans]);

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (view === 'month') {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    const handlePrint = () => {
        setPlansToPrint(lessonPlans);
    };

    const handleSubmitWeek = async () => {
        const pendingDrafts = lessonPlans.filter(p => p.status === LessonStatus.DRAFT || p.status === LessonStatus.REJECTED);

        if (pendingDrafts.length === 0) {
            alert("No draft/rejected plans found for this week.");
            return;
        }

        if (!confirm(`Submit ${pendingDrafts.length} plans for review?`)) return;

        try {
            const batch = writeBatch(db);
            pendingDrafts.forEach(p => {
                const ref = doc(db, 'lessonPlans', p.id);
                batch.update(ref, { status: LessonStatus.SUBMITTED });
            });
            await batch.commit();
            alert("Weekly plans submitted successfully!");
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Failed to submit.");
        }
    };

    if (isSeeding && lessonPlans.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Database Optimizing...</h3>
                <p className="text-slate-500 max-w-md mt-2">We are organizing your lesson plans. The new engine handles this in the background.</p>
            </div>
        );
    }

    const renderHeader = () => {
        let title = "";
        if (view === 'month') title = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        else if (view === 'week') {
            const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
            const end = new Date(start); end.setDate(end.getDate() + 6);
            title = `${start.getDate()} - ${end.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        } else if (view === 'day') title = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        else title = "All Plans";

        const draftCount = view === 'week' ? lessonPlans.filter(p => p.status === LessonStatus.DRAFT || p.status === LessonStatus.REJECTED).length : 0;

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        {['month', 'week', 'day', 'list'].map((v) => (
                            <button key={v} onClick={() => setView(v as 'list' | 'month' | 'week' | 'day')} className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => fetchData()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Refresh Data">
                        <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-blue-600' : ''}`} />
                    </button>
                </div>
                {view !== 'list' && (
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigateDate('prev')} className="p-1 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                        <span className="font-bold text-lg min-w-[140px] text-center truncate">{title}</span>
                        <button onClick={() => navigateDate('next')} className="p-1 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                )}
                <div className="flex gap-2 shrink-0">
                    {view === 'week' && currentUser && currentUser.role === UserRole.TEACHER && (
                        <Button
                            variant="primary"
                            size="sm"
                            className={`bg-green-600 hover:bg-green-700 ${draftCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handleSubmitWeek}
                            disabled={draftCount === 0}
                        >
                            <Send className="w-4 h-4 mr-2" /> {t('submit_week')} {draftCount > 0 ? `(${draftCount})` : ''}
                        </Button>
                    )}

                    <Button variant="secondary" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">{t('print')}</span></Button>
                    <Button size="sm" onClick={() => navigate('/portal/plans/new')}><Plus className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">{t('create_plan')}</span></Button>
                </div>
            </div>
        );
    };

    const renderMonth = () => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const startDay = startOfMonth.getDay();
        const days: (number | null)[] = Array(startDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

        return (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden relative min-h-[500px] overflow-x-auto">
                {isLoadingData && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-lg border">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                            <span className="text-xs font-bold text-slate-500">Loading Month...</span>
                        </div>
                    </div>
                )}
                <div className="min-w-[700px]">
                    <div className="grid grid-cols-7 bg-slate-50 border-b">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {days.map((day, i) => {
                            if (!day) return <div key={i} className="min-h-[100px] md:min-h-[120px] bg-slate-50/50 border-b border-r" />;

                            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const plans = plansByDate[dateStr] || [];
                            const isToday = dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <div key={i} onClick={() => { setCurrentDate(new Date(dateStr)); setView('day'); }} className={`min-h-[100px] md:min-h-[120px] p-1 md:p-2 border-b border-r hover:bg-blue-50 cursor-pointer transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                                    <div className={`text-sm font-medium w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{day}</div>
                                    <div className="space-y-1">
                                        {plans.slice(0, 3).map(p => (
                                            <div key={p.id} className="text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 truncate shadow-sm">
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${p.status === 'Approved' ? 'bg-green-500' : p.status === 'Submitted' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                                                {p.subject}
                                            </div>
                                        ))}
                                        {plans.length > 3 && <div className="text-[9px] md:text-[10px] text-slate-400 pl-1 font-medium">+{plans.length - 3} more</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderWeek = () => {
        const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start); d.setDate(start.getDate() + i); return d;
        });

        return (
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto relative min-h-[400px]">
                {isLoadingData && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}
                <div className="grid grid-cols-7 divide-x divide-slate-100 min-w-[800px]">
                    {days.map((d, i) => {
                        const isToday = d.toDateString() === new Date().toDateString();
                        const dateStr = d.toISOString().split('T')[0];
                        const plans = plansByDate[dateStr] || [];

                        return (
                            <div key={i} className="min-h-[400px] md:min-h-[600px] flex flex-col">
                                <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className={`text-xl font-bold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>{d.getDate()}</div>
                                </div>
                                <div className="flex-1 p-2 space-y-2 bg-slate-50/10">
                                    {plans.map(p => (
                                        <Link to={`/portal/plans/${p.id}`} key={p.id} className="block p-2 bg-white rounded border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group">
                                            <div className="text-xs font-bold text-slate-700 truncate">{p.subject}</div>
                                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{p.className}</div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-[10px] font-mono text-slate-400">{(p.time || '').split('-')[0]}</span>
                                                <div className={`w-2 h-2 rounded-full ${p.status === 'Approved' ? 'bg-green-500' : p.status === 'Submitted' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDay = () => {
        const dateStr = currentDate.toISOString().split('T')[0];
        const plans = (plansByDate[dateStr] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        return (
            <div className="max-w-3xl mx-auto space-y-4 relative">
                {isLoadingData && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center h-32">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                )}
                {plans.length === 0 && !isLoadingData ? (
                    <div className="bg-white p-12 rounded-xl border shadow-sm text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                            <Calendar className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700">No Lesson Plans</h3>
                        <p className="text-slate-500">You don't have any classes scheduled for this day.</p>
                        <Button className="mt-4" onClick={() => navigate('/portal/plans/new')}>Create Plan</Button>
                    </div>
                ) : (
                    plans.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex">
                                <div className="w-24 bg-slate-50 border-r flex flex-col items-center justify-center p-4">
                                    <span className="text-sm font-bold text-slate-600">{(p.time || '').split('-')[0]}</span>
                                    <span className="text-xs text-slate-400 mt-1">{(p.time || '').split('-')[1]}</span>
                                </div>
                                <div className="flex-1 p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-1">{p.subject}</span>
                                            <h3 className="font-bold text-lg text-slate-800">{p.topic}</h3>
                                            <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                <Users className="w-3 h-3" /> {p.className} • {p.grade}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${p.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : p.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                        <Link to={`/portal/plans/${p.id}`} className="flex-1 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 py-1.5 rounded transition-colors">View Details</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    const renderList = () => {
        return (
            <div className="space-y-4">
                {isLoadingData ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {lessonPlans.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-500">
                                No lesson plans found.
                            </div>
                        ) : (
                            lessonPlans.map(p => (
                                <Card key={p.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 transition-colors">
                                    <div>
                                        <h4 className="font-bold text-slate-800">{p.subject}</h4>
                                        <p className="text-sm text-slate-500">{p.topic}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                            <span>{p.date}</span>
                                            <span>•</span>
                                            <span>{p.className}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${p.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : p.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                            {p.status}
                                        </span>
                                        <Link to={`/portal/plans/${p.id}`} className="flex-1 sm:flex-none">
                                            <Button size="sm" variant="secondary" className="w-full sm:w-auto">{t('view_details')}</Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
                    <div className="text-sm text-slate-500">
                        Page {currentPage}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1 || isLoadingData}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!hasMore || isLoadingData}
                        >
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">{t('my_lesson_plans')}</h2>
            </div>

            {renderHeader()}

            <div className="animate-in fade-in duration-300">
                {view === 'month' && renderMonth()}
                {view === 'week' && renderWeek()}
                {view === 'day' && renderDay()}
                {view === 'list' && renderList()}
            </div>

            {plansToPrint && <PrintPreviewModal plans={plansToPrint} onClose={() => setPlansToPrint(null)} schoolName={schoolName} getWeek={getAcademicWeek} />}
        </div>
    );
};

export default LessonPlanList;
