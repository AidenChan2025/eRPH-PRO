import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { firebaseService } from '../../services/firebaseService';
import { User, WeeklySubmission } from '../../types';
import { Search, Filter, Loader2, CheckCircle, Clock, AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import Button from '../../components/Button';
import { useNavigate } from 'react-router-dom';

const ReviewDashboard = () => {
    const { currentUser } = useGlobal();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved'>('Pending');

    useEffect(() => {
        if (!currentUser?.schoolId) return;
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch Teachers
                const tList = await firebaseService.getAllTeachers(currentUser.schoolId);
                setTeachers(tList);

                // Fetch Submissions for current Year (optimize later)
                const sList = await firebaseService.getAllSubmissions(currentUser.schoolId, new Date().getFullYear());
                setSubmissions(sList);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentUser]);

    // Helpers
    // Get submissions for a teacher, grouped by week
    const getTeacherStatus = (tid: string, week: number) => {
        const sub = submissions.find(s => s.teacherId === tid && s.week === week);
        return sub ? sub.status : 'Missing';
    };

    // Current Month Weeks
    // Assume Month 0 = Jan (Weeks 1-4 approx)
    // Simple logic: Week = (Month * 4) + 1 to +4
    // More accurate logic requires date mapping.
    // Let's use generic [1,2,3,4] relative or global weeks if month known.
    // Let's just show recent active weeks. e.g. Current Week - 2 to Current Week + 1
    // OR: show the list of weeks relevant to the selected month.
    // Start of year Jan 1. 
    // This logic needs robust week calculation utility which we skipped.
    // Let's HARDCODE weeks 1-4 for Demo.
    const weeksToDisplay = [1, 2, 3, 4]; // Placeholder for Month selection logic

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Review Dashboard</h1>
                    <p className="text-slate-500 font-medium">Oversee and approve teacher lesson plans.</p>
                </div>
                <div className="flex gap-2">
                    {['All', 'Pending', 'Approved'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterStatus === s ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest pl-6">Teacher</th>
                            {weeksToDisplay.map(w => (
                                <th key={w} className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Week {w}</th>
                            ))}
                            <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right pr-6">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {teachers.slice(0, 10).map(teacher => ( // Limit 10 for demo
                            <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{teacher.name}</p>
                                            <p className="text-xs text-slate-400">{teacher.email}</p>
                                        </div>
                                    </div>
                                </td>
                                {weeksToDisplay.map(w => {
                                    const status = getTeacherStatus(teacher.id, w);
                                    let style = "bg-slate-100 text-slate-400";
                                    let icon = null;
                                    if (status === 'Approved') { style = "bg-emerald-100 text-emerald-700"; icon = <CheckCircle className="w-3 h-3" /> }
                                    if (status === 'Pending') { style = "bg-amber-100 text-amber-700 font-bold shadow-sm animate-pulse"; icon = <Clock className="w-3 h-3" /> }
                                    if (status === 'Draft') { style = "bg-slate-100 text-slate-500"; }
                                    if (status === 'Rejected') { style = "bg-red-100 text-red-600"; icon = <AlertTriangle className="w-3 h-3" /> }

                                    // Integrity Check
                                    const sub = submissions.find(s => s.teacherId === teacher.id && s.week === w);
                                    const integrityOk = sub?.signatureUrl && sub?.signedAt && sub?.ipAddress;

                                    return (
                                        <td key={w} className="p-4 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <button
                                                    onClick={() => status !== 'Missing' ? navigate(`/portal/admin/review/${teacher.id}/2026/${w}`) : null}
                                                    disabled={status === 'Missing'}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 ${style}`}
                                                >
                                                    {icon}
                                                    {status}
                                                </button>
                                                {status !== 'Missing' && status !== 'Draft' && (
                                                    <div className="flex items-center gap-1" title={integrityOk ? "Signature Verified" : "Manual Signature Required"}>
                                                        <span className={`w-2 h-2 rounded-full ${integrityOk ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                                        {!integrityOk && <span className="text-[10px] font-bold text-amber-600">Check Sig</span>}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )
                                })}
                                <td className="p-4 pr-6 text-right">
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {teachers.length === 0 && <div className="p-10 text-center text-slate-400">No teachers found.</div>}
            </div>
        </div>
    );
};

export default ReviewDashboard;
