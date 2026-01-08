
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LeaveStatus, LessonStatus, LessonPlan, LeaveRecord, LeaveType, UserRole, User } from '../types';
import { api } from '../services/api';
import PrintableRPH from '../components/PrintableRPH';
import { db, collection, query, where, getDocs, updateDoc, doc, orderBy, deleteDoc } from '../services/firebase';
import {
    Check, X, Calendar, User as UserIcon, ChevronRight,
    ChevronLeft, BookOpen, Clock, Filter, Search,
    RefreshCw, ShieldCheck, Info, MapPin, Briefcase, Plus,
    TrendingUp, Users, Stethoscope, GraduationCap, AlertTriangle, FileText, Printer, Lock, CheckCircle2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LeaveManagement = () => {
        const { t } = useLanguage();
    const { currentUser, schools } = useGlobal();
    const [records, setRecords] = useState<LeaveRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // New Record Form State
    const [newRecord, setNewRecord] = useState({
        type: LeaveType.MEDICAL,
        startDate: '',
        endDate: '',
        reason: '',
        location: '',
        evidenceFile: null as File | null
    });

    const isSchoolAdmin = [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.GPK, UserRole.GPK_1].includes(currentUser?.role || UserRole.TEACHER);

    const fetchRecords = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const params: any = {};
            if (isSchoolAdmin) {
                params.schoolId = currentUser.schoolId;
            } else {
                params.teacherId = currentUser.id;
            }

            const res = await api.leave.list(params);
            if (res.success && res.data) {
                setRecords(res.data);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchRecords(); }, [currentUser]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewRecord({ ...newRecord, evidenceFile: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !newRecord.startDate || !newRecord.endDate) return;

        try {
            // Simulate File Upload
            let evidenceUrl = '';
            if (newRecord.evidenceFile) {
                // In a real app, upload to storage and get URL.
                // For now, we mimic it.
                evidenceUrl = `https://storage.googleapis.com/erph-evidence/${newRecord.evidenceFile.name}`;
            }

            const recordData: any = {
                schoolId: currentUser.schoolId,
                teacherId: currentUser.id,
                teacherName: currentUser.name,
                type: newRecord.type,
                startDate: newRecord.startDate,
                endDate: newRecord.endDate,
                reason: newRecord.reason,
                location: newRecord.location,
                status: LeaveStatus.APPROVED, // Auto-record as 'Approved' / Logged
                evidenceUrl: evidenceUrl
            };

            await api.leave.create(recordData);
            setShowAddModal(false);
            setNewRecord({ type: LeaveType.MEDICAL, startDate: '', endDate: '', reason: '', location: '', evidenceFile: null });
            fetchRecords();
            alert("Leave record saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save record.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteDoc(doc(db, 'leaveRecords', id));
            fetchRecords();
        } catch (e) {
            console.error(e);
            alert("Failed to delete record.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-blue-600" /> {t('leave_management')}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        {isSchoolAdmin ? "Review faculty leave records & evidence." : "Log your leave and upload supporting documents."}
                    </p>
                </div>
                {!isSchoolAdmin && (
                    <Button onClick={() => setShowAddModal(true)} className="rounded-xl shadow-xl shadow-blue-200">
                        <Plus className="w-4 h-4 mr-2" /> {t('newRecord')}</Button>
                )}
            </div>

            <Card className="rounded-[2.5rem] overflow-hidden border-slate-100 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('teacher')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('type')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('timeline')}</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('reasonEvidence')}</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">{t('noLeaveRecordsFound')}</td>
                                </tr>
                            ) : records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {r.teacherName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{r.teacherName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${r.type === LeaveType.MEDICAL ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{r.startDate}</span>
                                            {r.startDate !== r.endDate && <span className="text-[10px] text-slate-400 font-medium">{t('to')}{r.endDate}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-medium text-slate-600 max-w-xs truncate">{r.reason}</p>
                                        {(r as any).evidenceUrl && (
                                            <a href={(r as any).evidenceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-500 hover:underline">
                                                <FileText className="w-3 h-3" /> {t('viewEvidence')}</a>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wide">
                                            <Check className="w-3 h-3" /> {t('recorded')}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
                    <Card className="w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom-4 zoom-in-95">
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800">{t('newLeaveRecord')}</h3>
                                <button type="button" onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('leaveType')}</label>
                                        <select className="w-full border p-2.5 rounded-xl text-sm outline-none" value={newRecord.type} onChange={e => setNewRecord({ ...newRecord, type: e.target.value as any })}>
                                            {Object.values(LeaveType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('location')}<span className="text-slate-300">{t('optional')}</span></label>
                                        <input className="w-full border p-2.5 rounded-xl text-sm outline-none" value={newRecord.location} onChange={e => setNewRecord({ ...newRecord, location: e.target.value })} placeholder="e.g. Hospital" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('startDate')}</label>
                                        <input type="date" className="w-full border p-2.5 rounded-xl text-sm outline-none" value={newRecord.startDate} onChange={e => setNewRecord({ ...newRecord, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('endDate')}</label>
                                        <input type="date" className="w-full border p-2.5 rounded-xl text-sm outline-none" value={newRecord.endDate} onChange={e => setNewRecord({ ...newRecord, endDate: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{t('reason')}</label>
                                    <textarea className="w-full border p-3 rounded-xl text-sm outline-none resize-none h-20" value={newRecord.reason} onChange={e => setNewRecord({ ...newRecord, reason: e.target.value })} placeholder="Briefly describe the reason..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                        {t('evidenceUpload')}<span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded text-[9px]">{t('new')}</span>
                                    </label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                                        <input
                                            type="file"
                                            id="evidence-upload"
                                            className="hidden"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                        />
                                        <label htmlFor="evidence-upload" className="cursor-pointer flex flex-col items-center">
                                            {newRecord.evidenceFile ? (
                                                <>
                                                    <FileText className="w-8 h-8 text-blue-500 mb-2" />
                                                    <span className="text-sm font-bold text-slate-700">{newRecord.evidenceFile.name}</span>
                                                    <span className="text-xs text-green-500 font-bold mt-1">{t('readyToUpload')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-3 bg-slate-100 text-slate-400 rounded-full mb-2">
                                                        <Printer className="w-6 h-6" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">{t('clickToAttachFile')}</span>
                                                    <span className="text-[10px] text-slate-400 mt-1">{t('mcLetterOrPhotoMax')}</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t bg-slate-50 flex gap-3">
                                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">{t('cancel')}</Button>
                                <Button type="submit" isLoading={false} className="flex-1 shadow-lg shadow-blue-500/20">{t('saveRecord')}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

const WeeklyReviewView = ({ teachers, schoolId }: { teachers: User[], schoolId: string }) => {
        const { t } = useLanguage();
    const { getAcademicWeek } = useGlobal();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weeklyPlans, setWeeklyPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isApproving, setIsApproving] = useState<string | null>(null);

    const startOfWeek = useMemo(() => {
        const d = new Date(selectedDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday
        return new Date(d.setDate(diff));
    }, [selectedDate]);

    const endOfWeek = useMemo(() => {
        const d = new Date(startOfWeek);
        return new Date(d.setDate(d.getDate() + 4)); // Friday
    }, [startOfWeek]);

    const fetchPlans = async () => {
        setIsLoading(true);
        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = endOfWeek.toISOString().split('T')[0];

        try {
            const q = query(
                collection(db, 'lessonPlans'),
                where('schoolId', '==', schoolId),
                where('date', '>=', startStr),
                where('date', '<=', endStr),
                orderBy('date', 'asc')
            );
            const snap = await getDocs(q);
            const allPlans = snap.docs.map(d => ({ id: d.id, ...d.data() } as LessonPlan));

            const grouped = teachers.map(teacher => {
                const teacherPlans = allPlans.filter(p => p.teacherId === teacher.id);
                const status = teacherPlans.length === 0 ? 'empty' :
                    teacherPlans.every(p => p.status === LessonStatus.APPROVED) ? 'approved' :
                        teacherPlans.some(p => p.status === LessonStatus.SUBMITTED) ? 'pending' : 'draft';
                return { teacher, plans: teacherPlans, status };
            });

            setWeeklyPlans(grouped);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, [startOfWeek, schoolId, teachers]);

    const handleBatchApprove = async (teacherId: string, plans: LessonPlan[]) => {
        setIsApproving(teacherId);
        try {
            const pendingPlans = plans.filter(p => p.status === LessonStatus.SUBMITTED);
            await Promise.all(pendingPlans.map(p =>
                updateDoc(doc(db, 'lessonPlans', p.id), {
                    status: LessonStatus.APPROVED,
                    updatedAt: new Date().toISOString()
                })
            ));
            await fetchPlans();
        } catch (e) {
            console.error(e);
        } finally {
            setIsApproving(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 7)))}>
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{t('mingguAkademik')}{getAcademicWeek(startOfWeek)}</p>
                        <h4 className="font-bold text-slate-800 text-sm">
                            {startOfWeek.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })} - {endOfWeek.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </h4>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 7)))}>
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
                <Button variant="secondary" size="sm" className="rounded-xl" onClick={() => setSelectedDate(new Date())}>{t('today')}</Button>
            </div>

            {isLoading ? (
                <div className="p-20 text-center text-slate-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">{t('loadingWeeklyRph')}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {weeklyPlans.map(({ teacher, plans, status }) => (
                        <Card key={teacher.id} className="p-6 rounded-[2rem] border-slate-100 hover:shadow-lg transition-all group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm ${status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {teacher.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 tracking-tight">{teacher.name}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{teacher.grade} • {plans.length} {t('lessonsScheduled')}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    {status === 'approved' ? (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase">{t('verified')}</span>
                                        </div>
                                    ) : status === 'pending' ? (
                                        <Button
                                            size="sm"
                                            className="w-full md:w-auto rounded-xl shadow-lg shadow-blue-200"
                                            isLoading={isApproving === teacher.id}
                                            onClick={() => handleBatchApprove(teacher.id, plans)}
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-2" /> {t('batchVerify')}</Button>
                                    ) : (
                                        <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-xs font-bold uppercase">
                                            {status === 'empty' ? 'No Submission' : 'In Progress'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

const MonthlyReportView = ({ teachers, schoolId }: { teachers: User[], schoolId: string }) => {
        const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [reportData, setReportData] = useState<any[]>([]);
    const [verificationData, setVerificationData] = useState<any>(null);

    const fetchReport = async () => {
        const start = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        const end = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

        try {
            const q = query(
                collection(db, 'lessonPlans'),
                where('schoolId', '==', schoolId),
                where('date', '>=', start),
                where('date', '<=', end)
            );
            const snap = await getDocs(q);
            const plans = snap.docs.map(d => d.data() as LessonPlan);
            setReportData(teachers.map(t => ({ id: t.id, name: t.name, grade: t.grade || '-', plans: plans.filter(p => p.teacherId === t.id) })));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => { fetchReport(); }, [selectedMonth, selectedYear, schoolId, teachers]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end gap-4 print:hidden">
                <div className="flex gap-4">
                    <select className="border p-2 rounded" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                    </select>
                </div>
                <Button onClick={() => window.print()} variant="secondary"><Printer className="w-4 h-4 mr-2" /> {t('print')}</Button>
            </div>
            <div className="bg-white p-8 border rounded-xl shadow-sm">
                <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
                    <h2 className="text-2xl font-black uppercase">{t('monthly_pencerapan')}</h2>
                </div>
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead><tr className="bg-slate-50"><th className="border p-3 text-left">{t('name')}</th><th className="border p-3 text-center">{t('grade')}</th><th className="border p-3 text-center">{t('status')}</th></tr></thead>
                    <tbody>{reportData.map(d => <tr key={d.id}><td className="border p-3 font-bold">{d.name}</td><td className="border p-3 text-center">{d.grade}</td><td className="border p-3 text-center">{d.plans.length} {t('rph')}</td></tr>)}</tbody>
                </table>
                <div className="mt-12 flex justify-between items-end">
                    <div className="text-xs text-slate-400">{t('generatedBy')}{t('app_name')}</div>
                    <div className="w-64 text-center border-t border-slate-400 pt-2 text-xs font-bold uppercase">{t('principal_signature')}</div>
                </div>
            </div>
        </div>
    );
};

export const ReviewDashboard = () => {
        const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
    const [allTeachers, setAllTeachers] = useState<User[]>([]);

    useEffect(() => {
        if (!currentUser?.schoolId) return;
        api.admin.getUsers({ schoolId: currentUser.schoolId, role: UserRole.TEACHER }).then(res => {
            if (res.success && res.data) {
                setAllTeachers(res.data);
            }
        });
    }, [currentUser]);

    return (
        <div className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border">
                <button onClick={() => setViewMode('weekly')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'weekly' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>{t('weekly_review')}</button>
                <button onClick={() => setViewMode('monthly')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>{t('monthly_report')}</button>
            </div>
            {viewMode === 'monthly' ? (
                <MonthlyReportView teachers={allTeachers} schoolId={currentUser?.schoolId || ''} />
            ) : (
                <WeeklyReviewView teachers={allTeachers} schoolId={currentUser?.schoolId || ''} />
            )}
        </div>
    );
};
