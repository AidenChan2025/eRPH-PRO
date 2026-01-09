
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LeaveStatus, LeaveRecord, LeaveType, UserRole, User } from '../types';
import { api } from '../services/api';
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


