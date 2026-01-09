import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { firebaseService } from '../../services/firebaseService';
import { Loader2, TrendingUp, Users, CheckCircle } from 'lucide-react';

const MonthlyReport = () => {
    const { currentUser } = useGlobal();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        if (!currentUser?.schoolId) return;
        const load = async () => {
            setLoading(true);
            try {
                const teachers = await firebaseService.getAllTeachers(currentUser.schoolId);
                const submissions = await firebaseService.getAllSubmissions(currentUser.schoolId, new Date().getFullYear());

                // Calculate Stats per Teacher
                const data = teachers.map(t => {
                    const teacherSubs = submissions.filter(s => s.teacherId === t.id);
                    const approved = teacherSubs.filter(s => s.status === 'Approved').length;
                    const pending = teacherSubs.filter(s => s.status === 'Pending').length;
                    const total = teacherSubs.length;
                    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

                    return {
                        id: t.id,
                        name: t.name,
                        email: t.email,
                        approved,
                        pending,
                        total,
                        rate
                    };
                });

                // Sort by Completion Rate Desc
                setStats(data.sort((a, b) => b.rate - a.rate));

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser]);

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Monthly Submission Report</h1>
            <p className="text-slate-500 font-medium mb-8">Overview of eRPH submission rates by teacher.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-500">Total Teachers</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{stats.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-500">Fully Approved</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{stats.reduce((acc, curr) => acc + curr.approved, 0)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                        <h3 className="font-bold text-slate-500">Avg. Completion</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">
                        {stats.length > 0 ? Math.round(stats.reduce((acc, curr) => acc + curr.rate, 0) / stats.length) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 pl-6 text-xs font-black text-slate-400 uppercase tracking-widest">Teacher</th>
                            <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Approved</th>
                            <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Pending</th>
                            <th className="p-4 pr-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Completion Rate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {stats.map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 pl-6 font-bold text-slate-800">{s.name}</td>
                                <td className="p-4 text-center font-bold text-emerald-600">{s.approved}</td>
                                <td className="p-4 text-center font-bold text-amber-600">{s.pending}</td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${s.rate}%` }} className={`h-full rounded-full ${s.rate >= 80 ? 'bg-emerald-500' : s.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                                        </div>
                                        <span className="font-black text-slate-700 w-8">{s.rate}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MonthlyReport;
