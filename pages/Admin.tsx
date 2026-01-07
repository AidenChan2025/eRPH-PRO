import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import {
    Save, Book, ArrowRightLeft, Calendar as CalendarIcon,
    Database, Shield, Globe, AlertCircle, Lock, Search,
    Upload, Filter, Plus, FileText, MapPin, Phone, Mail,
    Building, Layers, Download, Sparkles, X, School as SchoolIcon, GraduationCap,
    RefreshCw, CheckCircle, Link as LinkIcon, FileSpreadsheet, Loader2, Check, Info,
    ChevronRight, ChevronDown, BookOpen, Clock, Users, Trash2, ListChecks, Tag,
    Settings, ShieldCheck, DatabaseZap, TableProperties, Eye, Zap, Edit2
} from 'lucide-react';
import {
    collection, query, where, getDocs, db,
    doc, setDoc, writeBatch
} from '../services/firebase';
import { api } from '../services/api';
import { dskpService } from '../services/dskpService';
import { DSKPStandard, UserRole, School, User, SchoolType, AcademicWeek, LessonStatus, DSKPStructure } from '../types';

// --- DSKP SYNC MODAL WITH DATA MAPPING ---
const GoogleSheetSyncModal = ({ isOpen, onClose, onSynced }: { isOpen: boolean, onClose: () => void, onSynced: () => void }) => {
    const { t } = useLanguage();

    // Default URL provided by user
    const REQUESTED_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mW401zSgjPLjtahPCaeiLFpv3Zpk3AL-2Dgc6s5sDAA/edit?usp=sharing';

    const [sheetUrl, setSheetUrl] = useState(REQUESTED_SHEET_URL);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isFetching, setIsFetching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [rawRows, setRawRows] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, number>>({
        schoolType: 0,
        subject: 1,
        grade: 2,
        contentStandard: 3,
        learningStandard: 4,
        temaBidang: 5,
        tema: 6,
        tajukKemahiran: 7,
        tajuk: 8
    });
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');

    const parseCsv = (csvText: string) => {
        const lines = csvText.split(/\r?\n/);
        const results: string[][] = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            // Handle quoted CSV values correctly
            const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
            results.push(cols);
        }
        return results;
    };

    const handleFetch = async () => {
        setError('');
        setIsFetching(true);
        try {
            const match = sheetUrl.match(/\/d\/(.*?)(\/|$)/);
            if (!match) throw new Error("Invalid Google Sheet URL format.");
            const sheetId = match[1];
            const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            const response = await fetch(exportUrl);
            if (!response.ok) throw new Error("Could not fetch sheet. Ensure 'Anyone with link can view' is enabled.");
            const text = await response.text();
            const data = parseCsv(text);
            if (data.length < 2) throw new Error("Sheet is empty or has no data rows.");

            setHeaders(data[0]);
            setRawRows(data.slice(1));
            setStep(2); // Move to mapping step
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsFetching(false);
        }
    };

    const mappedData = useMemo(() => {
        return rawRows.map((row, idx) => ({
            id: `dskp-mapped-${Date.now()}-${idx}`,
            schoolType: row[mapping.schoolType] || '',
            subject: row[mapping.subject] || '',
            grade: row[mapping.grade] || '',
            contentStandard: row[mapping.contentStandard] || '',
            learningStandard: row[mapping.learningStandard] || '',
            temaBidang: row[mapping.temaBidang] || '',
            tema: row[mapping.tema] || '',
            tajukKemahiran: row[mapping.tajukKemahiran] || '',
            tajuk: row[mapping.tajuk] || ''
        }));
    }, [rawRows, mapping]);

    // Helper for delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper for robust batch sync
    const syncBatch = async (batch: any[], mode: 'replace' | 'append', retryCount = 0): Promise<void> => {
        try {
            const res = await dskpService.sync({ mode, data: batch });
            if (!res.success) throw new Error(res.message);
        } catch (err: any) {
            if (retryCount < 3) {
                console.warn(`Batch sync failed (attempt ${retryCount + 1}), retrying in 1s...`, err);
                await sleep(1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
                return syncBatch(batch, mode, retryCount + 1);
            }
            throw err; // Give up after 3 retries
        }
    };

    const handleSync = async () => {
        setIsSaving(true);
        setProgress(0);
        setError(""); // Clear previous errors

        try {
            const BATCH_SIZE = 2000; // Maximum speed batch size
            const total = mappedData.length;
            const startTime = Date.now();

            // First batch with mode='replace' to clear table
            const firstBatch = mappedData.slice(0, BATCH_SIZE);
            await syncBatch(firstBatch, 'replace');

            // Initial progress
            let processed = firstBatch.length;
            setProgress(Math.round((processed / total) * 100));
            await sleep(100); // 100ms delay

            // Subsequent batches
            for (let i = BATCH_SIZE; i < total; i += BATCH_SIZE) {
                const batch = mappedData.slice(i, i + BATCH_SIZE);
                await syncBatch(batch, 'append');

                processed += batch.length;
                setProgress(Math.round((processed / total) * 100));

                // Minimal delay
                await sleep(100);
            }

            setProgress(100);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            onSynced();
            onClose();
            alert(`✅ Sync Successful!\n\n• Records: ${total}\n• Time: ${duration}s\n• Status: All batches verified.`);

        } catch (e: any) {
            console.error(e);
            const errorDetails = {
                message: e.message,
                stack: e.stack,
                progress_at_failure: progress,
                timestamp: new Date().toISOString()
            };
            setError(JSON.stringify(errorDetails, null, 2));
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
            <Card className="w-full max-w-5xl shadow-2xl overflow-hidden border-0 rounded-[2.5rem] max-h-[90vh] flex flex-col bg-white">
                {/* Modal Header */}
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                            <DatabaseZap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl text-slate-800 tracking-tight">DSKP Master Sync</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Super Admin Data Integrator</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-8 h-2 rounded-full transition-all ${step === s ? 'bg-blue-600 w-12' : step > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        ))}
                        <button onClick={onClose} className="ml-4 p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                    {/* Step 1: Connect Source */}
                    {step === 1 && (
                        <div className="max-w-2xl mx-auto py-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <h4 className="text-lg font-black text-slate-800">1. Connect Data Source</h4>
                                <p className="text-sm text-slate-500 font-medium">Link the official curriculum Google Sheet for indexing.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                                    <input
                                        className="w-full border-2 border-slate-100 rounded-[1.5rem] p-4 pl-12 text-sm font-bold focus:border-blue-500 outline-none transition-all shadow-inner bg-slate-50/50"
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        value={sheetUrl}
                                        onChange={e => setSheetUrl(e.target.value)}
                                    />
                                </div>
                                <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                                    <Info className="w-6 h-6 text-amber-600 shrink-0" />
                                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase tracking-tight">
                                        Verification Required: Ensure the Google Sheet "Share" settings are set to "Anyone with the link can view" for the system to access the content.
                                    </p>
                                </div>
                                {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
                                <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-200" onClick={handleFetch} isLoading={isFetching} disabled={!sheetUrl}>
                                    Validate & Continue <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Data Mapping */}
                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h4 className="text-lg font-black text-slate-800">2. Configure Data Mapping</h4>
                                    <p className="text-sm text-slate-500 font-medium">Match spreadsheet columns to the internal DSKP fields.</p>
                                </div>
                                <Button variant="secondary" onClick={() => setStep(1)} className="rounded-xl h-10 px-4 text-xs font-bold">Change Source</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-8 rounded-[2rem] border-slate-100 shadow-sm bg-slate-50/30 space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TableProperties className="w-5 h-5 text-blue-600" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Field Association</span>
                                    </div>
                                    <div className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2">
                                        {[
                                            { label: 'School Type', key: 'schoolType' },
                                            { label: 'Subject / Mata Pelajaran', key: 'subject' },
                                            { label: 'Grade / Tahun', key: 'grade' },
                                            { label: 'Content Standard (SK)', key: 'contentStandard' },
                                            { label: 'Learning Standard (SP)', key: 'learningStandard' },
                                            { label: 'Tema / Bidang / Teras', key: 'temaBidang' },
                                            { label: 'Tema', key: 'tema' },
                                            { label: 'Tajuk / Kemahiran / Nilai Teras', key: 'tajukKemahiran' },
                                            { label: 'Tajuk', key: 'tajuk' },
                                        ].map(field => (
                                            <div key={field.key} className="space-y-1.5">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                                <select
                                                    className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-bold bg-white outline-none focus:border-blue-500"
                                                    value={mapping[field.key]}
                                                    onChange={e => setMapping({ ...mapping, [field.key]: parseInt(e.target.value) })}
                                                >
                                                    {headers.map((h, i) => <option key={i} value={i}>Column {i + 1}: {h || '(Empty Header)'}</option>)}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Eye className="w-5 h-5 text-slate-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Mapping Preview</span>
                                    </div>
                                    <div className="space-y-3">
                                        {mappedData.slice(0, 3).map((item, i) => (
                                            <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 p-3 bg-blue-50 text-blue-600 text-[8px] font-black uppercase rounded-bl-xl">Sample {i + 1}</div>
                                                <div className="flex gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-tighter">{item.schoolType}</span>
                                                    <span className="text-[10px] font-bold text-blue-600">{item.subject} • {item.grade}</span>
                                                </div>
                                                <div className="text-xs font-bold text-slate-800 line-clamp-1">SK: {item.contentStandard}</div>
                                                <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">SP: {item.learningStandard}</div>
                                            </div>
                                        ))}
                                        <div className="p-4 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">+{mappedData.length - 3} more records detected</p>
                                        </div>
                                    </div>
                                    <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-200" onClick={() => setStep(3)}>
                                        Verify Mapping <ChevronRight className="ml-2 w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div className="max-w-2xl mx-auto py-10 space-y-8 animate-in zoom-in-95 duration-500 text-center">
                            {isSaving ? (
                                <div className="space-y-6 text-center">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="48" cy="48" r="40" fill="transparent" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
                                            <circle cx="48" cy="48" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`} className="transition-all duration-300 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-blue-600">{progress}%</div>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800 animate-pulse">Synchronizing DSKP...</h4>
                                        <p className="text-sm font-bold text-slate-400 mt-2">Uploading 2000 records at a time<br />Please do not close this window.</p>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="space-y-6 text-center">
                                    <div className="p-6 bg-red-50 rounded-3xl border border-red-100 mb-6">
                                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-8 h-8" />
                                        </div>
                                        <h4 className="text-xl font-black text-red-600 mb-2">Sync Process Failed</h4>
                                        <p className="text-sm font-bold text-red-400 mb-4">
                                            The process was interrupted. Please check your internet connection or try again later.
                                        </p>
                                        <div className="text-left">
                                            <label className="text-[10px] uppercase font-black text-red-400 tracking-widest pl-2 mb-1 block">Error Log (Copy for Support)</label>
                                            <textarea
                                                readOnly
                                                className="w-full h-48 p-4 rounded-xl bg-white border-2 border-red-100 text-xs font-mono text-slate-600 focus:outline-none resize-none shadow-inner"
                                                value={error}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-bold" onClick={onClose}>Cancel Sync</Button>
                                        <Button className="flex-1 h-14 rounded-2xl font-black shadow-xl shadow-blue-200" onClick={handleSync}>Retry Sync</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10 mb-6">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-slate-800">Final Verification</h3>
                                        <p className="text-slate-500 font-medium">
                                            You are about to overwrite the Master DSKP registry with <span className="text-blue-600 font-black">{mappedData.length}</span> new records. This action will update content for all teachers in the system.
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="secondary" onClick={() => setStep(2)} disabled={isSaving} className="flex-1 h-14 rounded-2xl font-bold">Go Back</Button>
                                        <Button onClick={handleSync} isLoading={isSaving} disabled={isSaving} className="flex-1 h-14 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                                            Sync Now <Zap className="ml-2 w-5 h-5" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

// --- SCHOOL SETTINGS COMPONENT ---
export const SchoolSettings = () => {
    const { t } = useLanguage();
    const { currentUser, schools, refreshGlobalData } = useGlobal();
    const [isSaving, setIsSaving] = useState(false);
    const [school, setSchool] = useState<School | null>(null);

    const [newSubject, setNewSubject] = useState('');
    const [newClass, setNewClass] = useState('');
    const [newTime, setNewTime] = useState('');

    useEffect(() => {
        const current = schools.find(s => s.id === currentUser?.schoolId);
        if (current) {
            setSchool(JSON.parse(JSON.stringify(current)));
        }
    }, [schools, currentUser]);

    const handleSave = async () => {
        if (!school) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'schools', school.id), school);
            await refreshGlobalData();
            alert("School settings updated successfully!");
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const addListValue = (field: 'customSubjects' | 'customClasses' | 'customTimeSlots', value: string) => {
        if (!value.trim() || !school) return;
        const currentList = school.settings?.[field] || [];
        if (currentList.includes(value)) return;
        setSchool({ ...school, settings: { ...school.settings, [field]: [...currentList, value] } });
        if (field === 'customSubjects') setNewSubject('');
        if (field === 'customClasses') setNewClass('');
        if (field === 'customTimeSlots') setNewTime('');
    };

    const removeListValue = (field: 'customSubjects' | 'customClasses' | 'customTimeSlots', value: string) => {
        if (!school) return;
        const currentList = school.settings?.[field] || [];
        setSchool({ ...school, settings: { ...school.settings, [field]: currentList.filter(v => v !== value) } });
    };

    const usePresets = (type: 'sk' | 'smk') => {
        if (!school) return;
        const subjects = type === 'sk'
            ? ['Bahasa Melayu', 'English', 'Matematik', 'Sains', 'Sejarah', 'Pendidikan Islam', 'Pendidikan Moral', 'Pendidikan Jasmani', 'Pendidikan Seni Visual']
            : ['Bahasa Melayu', 'English', 'Matematik', 'Sains', 'Sejarah', 'Geografi', 'Pendidikan Islam', 'Pendidikan Moral', 'Reka Bentuk dan Teknologi', 'Asas Sains Komputer'];
        const classes = type === 'sk' ? ['1 Amanah', '2 Amanah', '3 Amanah', '4 Amanah', '5 Amanah', '6 Amanah'] : ['1 Bestari', '2 Bestari', '3 Bestari', '4 Bestari', '5 Bestari'];
        const times = ['07:30 - 08:30', '08:30 - 09:30', '09:45 - 10:45', '10:45 - 11:45', '11:45 - 12:45', '12:45 - 13:45'];
        setSchool({ ...school, settings: { ...school.settings, customSubjects: subjects, customClasses: classes, customTimeSlots: times } });
    };

    if (!school) return <div className="p-12 text-center text-slate-400 font-medium">Loading School Profile...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200"><Settings className="w-6 h-6" /></div>
                        {t('settings_title')}
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">{t('manage_school_profile')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => usePresets('sk')} className="rounded-xl px-4 text-xs font-bold uppercase border-2">SK Preset</Button>
                    <Button variant="secondary" onClick={() => usePresets('smk')} className="rounded-xl px-4 text-xs font-bold uppercase border-2">SMK Preset</Button>
                    <Button onClick={handleSave} isLoading={isSaving} className="rounded-xl px-8 shadow-xl shadow-blue-500/20 font-bold h-12"><Save className="w-4 h-4 mr-2" /> {t('save_settings')}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl space-y-8">
                        <div className="flex items-center gap-3 border-b pb-4"><div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Building className="w-5 h-5" /></div><h3 className="font-black text-slate-800 uppercase tracking-tight">{t('general_profile')}</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('school_name')}</label><input className="w-full border-2 border-slate-50 bg-slate-50/50 p-3.5 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" value={school.name} onChange={e => setSchool({ ...school, name: e.target.value })} /></div>
                            <div className="space-y-2"><label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('school_code')}</label><input className="w-full border-2 border-slate-50 bg-slate-50/50 p-3.5 rounded-2xl text-sm font-bold focus:border-blue-500 outline-none transition-all" value={school.code} onChange={e => setSchool({ ...school, code: e.target.value })} /></div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Calendar Group</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSchool({ ...school, settings: { ...school.settings, schoolGroup: 'A' } })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${school.settings?.schoolGroup === 'A' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${school.settings?.schoolGroup === 'A' ? 'text-blue-700' : 'text-slate-700'}`}>Kumpulan A</span>
                                            {school.settings?.schoolGroup === 'A' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Johor, Kedah, Kelantan & Terengganu</p>
                                    </button>
                                    <button
                                        onClick={() => setSchool({ ...school, settings: { ...school.settings, schoolGroup: 'B' } })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${school.settings?.schoolGroup === 'B' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${school.settings?.schoolGroup === 'B' ? 'text-blue-700' : 'text-slate-700'}`}>Kumpulan B</span>
                                            {school.settings?.schoolGroup === 'B' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Melaka, Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak, Selangor, WP</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl space-y-6">
                        <div className="flex justify-between items-center border-b pb-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Clock className="w-5 h-5" /></div><h3 className="font-black text-slate-800 uppercase tracking-tight">Operating Hours</h3></div></div>
                        <div className="space-y-4">
                            <div className="flex gap-3"><input className="flex-1 border-2 border-slate-50 bg-slate-50/50 p-3.5 rounded-2xl text-sm font-bold outline-none" placeholder="e.g. 07:30 - 08:30" value={newTime} onChange={e => setNewTime(e.target.value)} /><Button onClick={() => addListValue('customTimeSlots', newTime)}><Plus className="w-4 h-4" /></Button></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {school.settings?.customTimeSlots?.map(time => (
                                    <div key={time} className="flex items-center justify-between p-3 bg-white border-2 border-slate-50 rounded-2xl shadow-sm group hover:border-emerald-200 transition-all">
                                        <span className="text-xs font-black text-slate-700">{time}</span>
                                        <button onClick={() => removeListValue('customTimeSlots', time)} className="text-slate-200 hover:text-red-500"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-xl space-y-4">
                        <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" /> Subjects</h3>
                        <div className="flex gap-2"><input className="flex-1 border-2 border-slate-50 p-2.5 rounded-xl text-xs font-bold outline-none" placeholder="Add..." value={newSubject} onChange={e => setNewSubject(e.target.value)} /><button onClick={() => addListValue('customSubjects', newSubject)} className="p-2.5 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button></div>
                        <div className="flex flex-wrap gap-2">{school.settings?.customSubjects?.map(s => <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black border flex items-center gap-1">{s}<button onClick={() => removeListValue('customSubjects', s)}><X className="w-3 h-3" /></button></span>)}</div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-xl space-y-4">
                        <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" /> Classes</h3>
                        <div className="flex gap-2"><input className="flex-1 border-2 border-slate-50 p-2.5 rounded-xl text-xs font-bold outline-none" placeholder="Add..." value={newClass} onChange={e => setNewClass(e.target.value)} /><button onClick={() => addListValue('customClasses', newClass)} className="p-2.5 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button></div>
                        <div className="flex flex-wrap gap-2">{school.settings?.customClasses?.map(c => <span key={c} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black border flex items-center gap-1">{c}<button onClick={() => removeListValue('customClasses', c)}><X className="w-3 h-3" /></button></span>)}</div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- DSKP MANAGER COMPONENT ---
// --- DSKP MANAGER COMPONENT ---
export const DSKPManager = () => {
    const { t } = useLanguage();
    const { currentUser } = useGlobal();

    // Data State
    const [structure, setStructure] = useState<DSKPStructure>(() => {
        try {
            const cached = localStorage.getItem('dskp_structure');
            return cached ? JSON.parse(cached) : {};
        } catch { return {}; }
    });
    const [expandedTypes, setExpandedTypes] = useState<string[]>([]);
    const [expandedGrades, setExpandedGrades] = useState<string[]>([]);
    const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
    const [loadedData, setLoadedData] = useState<Record<string, DSKPStandard[]>>({});
    const [loadingNode, setLoadingNode] = useState<string | null>(null);
    const [isLoadingStructure, setIsLoadingStructure] = useState(false);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<DSKPStandard[]>([]);

    // Edit State
    const [editingNode, setEditingNode] = useState<DSKPStandard | null>(null);

    // Sync Modal State
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;

    // Fetch Hierarchy (Cached)
    const fetchStructure = async (forceRefresh = false) => {
        if (!forceRefresh) {
            const cached = localStorage.getItem('dskp_structure');
            if (cached) {
                try {
                    setStructure(JSON.parse(cached));
                    return; // Use Cache
                } catch (e) {
                    localStorage.removeItem('dskp_structure');
                }
            }
        }

        try {
            setIsLoadingStructure(true);
            const res = await dskpService.listStructure();
            if (res.success) {
                setStructure(res.data);
                localStorage.setItem('dskp_structure', JSON.stringify(res.data));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingStructure(false);
        }
    };

    // Sync History State
    const [lastSync, setLastSync] = useState<{ date: string, count: number, user: string } | null>(null);

    // Sorting Logic
    const sortKeys = (keys: string[], type: 'schoolType' | 'grade' | 'subject') => {
        return keys.sort((a, b) => {
            if (type === 'schoolType') {
                // Priority: SR -> SK -> SJKC -> SJKT -> SMK -> SMA -> SBP -> KV
                const priority = ['SR', 'SK', 'SJKC', 'SJKT', 'SMK', 'SMA', 'SBP', 'KV'];
                const idxA = priority.indexOf(a);
                const idxB = priority.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            }
            if (type === 'grade') {
                // Numeric extraction: "Tahun 1" -> 1
                const getNum = (str: string) => {
                    const match = str.match(/\d+/);
                    return match ? parseInt(match[0]) : 999;
                };
                const numA = getNum(a);
                const numB = getNum(b);
                if (numA !== numB) return numA - numB;
                return a.localeCompare(b);
            }
            // Subject: Alphabetical
            return a.localeCompare(b);
        });
    };

    const sortedTypes = useMemo(() => sortKeys(Object.keys(structure), 'schoolType'), [structure]);

    const fetchSyncHistory = async () => {
        const res = await dskpService.getSyncHistory();
        if (res.success && res.data && res.data.length > 0) {
            const latest = res.data[0];
            setLastSync({
                date: latest.timestamp,
                count: latest.recordCount,
                user: latest.userName
            });
        }
    };

    useEffect(() => {
        fetchStructure();
        fetchSyncHistory();
    }, []);

    const handleSynced = () => {
        localStorage.removeItem('dskp_structure');
        fetchStructure(true);
        fetchSyncHistory(); // Refresh history
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const res = await dskpService.list({ search: searchQuery });
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this standard? This action cannot be undone.")) return;

        try {
            const res = await dskpService.delete(id);
            if (res.success) {
                // Refresh list if we are searching
                if (searchQuery) {
                    setSearchResults(prev => prev.filter(item => item.id !== id));
                }
                // Refresh hierarchy
                handleSynced();
            } else {
                alert("Failed to delete: " + res.message);
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const handleUpdate = async (updatedData: Partial<DSKPStandard>) => {
        if (!editingNode) return;

        try {
            const res = await dskpService.updateNode(editingNode.id, updatedData);
            if (res.success) {
                // Update local state results if searching
                if (searchQuery) {
                    setSearchResults(prev => prev.map(item =>
                        item.id === editingNode.id ? { ...item, ...updatedData } : item
                    ));
                }
                // Refresh hierarchy
                handleSynced();
                setEditingNode(null); // Close modal
            } else {
                alert("Failed to update: " + res.message);
            }
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const toggleType = (type: string) => {
        setExpandedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const toggleGrade = (type: string, grade: string) => {
        const key = `${type}-${grade}`;
        setExpandedGrades(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const toggleSubject = async (type: string, grade: string, subject: string) => {
        const key = `${type}-${grade}-${subject}`;

        // Toggle expansion
        const isExpanding = !expandedSubjects.includes(key);
        setExpandedSubjects(prev => isExpanding ? [...prev, key] : prev.filter(k => k !== key));

        // Lazy Load Data
        if (isExpanding && !loadedData[key]) {
            setLoadingNode(key);
            try {
                // Fetch specific data for this hierarchy from Firebase
                const res = await dskpService.list({ schoolType: type, grade: grade, subject: subject });
                if (res.success) {
                    setLoadedData(prev => ({ ...prev, [key]: res.data }));
                }
            } catch (e) {
                console.error("Failed to load subject data", e);
            } finally {
                setLoadingNode(null);
            }
        }
    };

    const renderTable = (data: DSKPStandard[]) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="p-3 w-1/3">Content Standard</th>
                        <th className="p-3 w-1/3">Learning Standard</th>
                        <th className="p-3 w-1/3">Metadata</th>
                        {isSuperAdmin && <th className="p-3 w-10">Actions</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {data.map((std, i) => (
                        <tr key={std.id || i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 align-top font-bold text-slate-700 text-xs">{std.contentStandard}</td>
                            <td className="p-3 align-top text-slate-600 text-xs">{std.learningStandard}</td>
                            <td className="p-3 align-top text-xs">
                                <div className="space-y-1">
                                    {std.tema && <div className="text-slate-500"><span className="font-bold text-blue-600">Tema:</span> {std.tema}</div>}
                                    {std.tajuk && <div className="text-slate-500"><span className="font-bold text-emerald-600">Tajuk:</span> {std.tajuk}</div>}
                                    <div className="text-[10px] text-slate-400 mt-1">{std.grade} • {std.subject}</div>
                                </div>
                            </td>
                            {isSuperAdmin && (
                                <td className="p-3 align-top">
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingNode(std)} className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors" title="Edit">
                                            <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button onClick={() => handleDelete(std.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors" title="Delete">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{t('dskp_management')}</h2>
                        <p className="text-slate-500 text-sm font-medium">Full Registry Hierarchy</p>
                    </div>
                    {isSuperAdmin && (
                        <Button onClick={() => setIsSyncModalOpen(true)} className="rounded-xl shadow-lg shadow-blue-500/20 px-8">
                            <Upload className="w-4 h-4 mr-2" /> Map & Sync Registry
                        </Button>
                    )}
                </div>

                {/* Search Bar */}
                {isSuperAdmin && (
                    <form onSubmit={handleSearch} className="relative w-full max-w-2xl">
                        <input
                            type="text"
                            placeholder="Search content, learning standards or subjects..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (!e.target.value) setSearchResults([]); // Clear results on clear
                            }}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-600 placeholder:text-slate-400"
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setSearchResults([]); }} // Clear
                                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <button type="submit" className="hidden">Search</button>
                    </form>
                )}
            </div>

            {/* Content: Search Results OR Hierarchy */}
            {searchQuery ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <h3 className="font-bold text-slate-800 text-lg">Search Results</h3>
                    {isSearching ? (
                        <div className="p-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                            <p className="text-xs font-bold text-slate-400">Searching...</p>
                        </div>
                    ) : searchResults.length > 0 ? (
                        <Card className="overflow-hidden border-slate-100 rounded-3xl shadow-sm bg-white">
                            {renderTable(searchResults)}
                        </Card>
                    ) : (
                        <div className="p-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl">
                            No results for "{searchQuery}"
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Sync Status Header */}
                    {lastSync && (
                        <div className="flex justify-end animate-in fade-in slide-in-from-top-2">
                            <div className="bg-slate-100 px-4 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 shadow-sm">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                    Last Synced: <span className="text-blue-600">{new Date(lastSync.date).toLocaleString()}</span>
                                    <span className="text-slate-300 mx-2">|</span>
                                    {lastSync.user} ({lastSync.count} records)
                                </span>
                            </div>
                        </div>
                    )}

                    {isLoadingStructure ? (
                        <div className="p-20 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
                            <p className="text-xs font-bold text-slate-400 animate-pulse">Building Hierarchy...</p>
                        </div>
                    ) : Object.keys(structure).length === 0 ? (
                        <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/50">
                            <Database className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Registry Empty</h3>
                            <p className="text-sm font-medium text-slate-400 mt-2">No DSKP standards found in the system.<br />{isSuperAdmin && "Click 'Map & Sync Registry' to import data."}</p>
                        </div>
                    ) : (
                        sortedTypes.map(type => {
                            const grades = structure[type];
                            // Sort Grades
                            const sortedGrades = sortKeys(Object.keys(grades), 'grade');

                            return (
                                <Card key={type} className="overflow-hidden border-slate-100 rounded-3xl shadow-sm">
                                    {/* LEVEL 1: School Type (SR / SMK) */}
                                    <div
                                        onClick={() => toggleType(type)}
                                        className="p-6 bg-slate-50 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors select-none"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl transition-colors ${expandedTypes.includes(type) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                                                <SchoolIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-slate-800">{type} DSKP</h3>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{Object.keys(grades).length} Grades Available</p>
                                            </div>
                                        </div>
                                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${expandedTypes.includes(type) ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* LEVEL 2: Grades */}
                                    {expandedTypes.includes(type) && (
                                        <div className="bg-white border-t border-slate-100 divide-y divide-slate-100">
                                            {sortedGrades.map(grade => {
                                                const subjects = grades[grade];
                                                const sortedSubjects = sortKeys([...subjects], 'subject');
                                                const gradeKey = `${type}-${grade}`;
                                                const isGradeExpanded = expandedGrades.includes(gradeKey);

                                                return (
                                                    <div key={gradeKey}>
                                                        <div
                                                            onClick={() => toggleGrade(type, grade)}
                                                            className="p-4 pl-10 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors select-none"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <GraduationCap className={`w-5 h-5 ${isGradeExpanded ? 'text-blue-500' : 'text-slate-300'}`} />
                                                                <span className={`text-sm font-bold ${isGradeExpanded ? 'text-blue-600' : 'text-slate-600'}`}>{grade}</span>
                                                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-md">{subjects.length} Subjects</span>
                                                            </div>
                                                            <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isGradeExpanded ? 'rotate-180' : ''}`} />
                                                        </div>

                                                        {/* LEVEL 3: Subjects */}
                                                        {isGradeExpanded && (
                                                            <div className="bg-slate-50/50 pl-16 pr-4 py-2 space-y-2 border-t border-slate-100">
                                                                {subjects.map(subject => {
                                                                    const subjectKey = `${type}-${grade}-${subject}`;
                                                                    const isSubjectExpanded = expandedSubjects.includes(subjectKey);
                                                                    const data = loadedData[subjectKey] || [];
                                                                    const isLoading = loadingNode === subjectKey;

                                                                    return (
                                                                        <div key={subjectKey} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                                                                            <div
                                                                                onClick={() => toggleSubject(type, grade, subject)}
                                                                                className="p-3 pl-4 flex justify-between items-center cursor-pointer hover:bg-blue-50/30 transition-colors select-none"
                                                                            >
                                                                                <div className="flex items-center gap-3">
                                                                                    <Book className={`w-4 h-4 ${isSubjectExpanded ? 'text-blue-500' : 'text-slate-300'}`} />
                                                                                    <span className={`text-sm font-bold ${isSubjectExpanded ? 'text-slate-800' : 'text-slate-600'}`}>{subject}</span>
                                                                                </div>
                                                                                {isLoading ? (
                                                                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                                                ) : (
                                                                                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isSubjectExpanded ? 'rotate-180' : ''}`} />
                                                                                )}
                                                                            </div>

                                                                            {/* LEVEL 4: Content Table */}
                                                                            {isSubjectExpanded && (
                                                                                <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                                                                    {isLoading ? (
                                                                                        <div className="p-10 text-center">
                                                                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
                                                                                            <span className="text-xs font-bold text-slate-400">Loading Standards...</span>
                                                                                        </div>
                                                                                    ) : data.length === 0 ? (
                                                                                        <div className="p-8 text-center text-xs text-slate-400 italic">No standards found.</div>
                                                                                    ) : renderTable(data)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {isSuperAdmin && (
                <>
                    <GoogleSheetSyncModal
                        isOpen={isSyncModalOpen}
                        onClose={() => setIsSyncModalOpen(false)}
                        onSynced={handleSynced}
                    />

                    {/* Lazy Edit Modal */}
                    {editingNode && (
                        <EditDSKPModal
                            node={editingNode}
                            onClose={() => setEditingNode(null)}
                            onUpdate={handleUpdate}
                        />
                    )}
                </>
            )}
        </div>
    );
};

// --- EDIT MODAL ---
const EditDSKPModal = ({ node, onClose, onUpdate }: { node: DSKPStandard, onClose: () => void, onUpdate: (data: any) => void }) => {
    const [form, setForm] = useState({
        contentStandard: node.contentStandard || '',
        learningStandard: node.learningStandard || '',
        tema: node.tema || '',
        tajuk: node.tajuk || ''
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Edit Standard</h3>
                        <p className="text-xs text-slate-400 font-mono">ID: {node.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Content Standard</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            rows={3}
                            value={form.contentStandard}
                            onChange={e => setForm({ ...form, contentStandard: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Learning Standard</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            rows={3}
                            value={form.learningStandard}
                            onChange={e => setForm({ ...form, learningStandard: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tema</label>
                            <input
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none"
                                value={form.tema}
                                onChange={e => setForm({ ...form, tema: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Tajuk</label>
                            <input
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none"
                                value={form.tajuk}
                                onChange={e => setForm({ ...form, tajuk: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onUpdate(form)}>Save Changes</Button>
                </div>
            </div>
        </div>
    )
};



// --- USER MANAGEMENT COMPONENT ---
export const UserManagement = () => {
    const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!currentUser?.schoolId) return;
        setIsLoading(true);
        getDocs(query(collection(db, 'users'), where('schoolId', '==', currentUser.schoolId)))
            .then(snap => setUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User))))
            .finally(() => setIsLoading(false));
    }, [currentUser]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-slate-800">{t('manage_users')}</h2><p className="text-slate-500 text-sm">{t('registered_teachers')}</p></div>
                <Button><Plus className="w-4 h-4 mr-2" /> {t('add_user')}</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? <div className="col-span-full p-12 text-center text-slate-400">Loading Users...</div> : users.map(user => (
                    <Card key={user.id} className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">{user.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate">{user.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{user.role}</span>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- REMAINING ADMIN COMPONENTS ---
export const TransferMarketplace = () => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
                <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 opacity-10 text-slate-900" />
                <h3 className="text-xl font-bold text-slate-800">{t('open_exchange')}</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">{t('mutual_transfers')}</p>
                <div className="mt-8 flex justify-center gap-4"><Button variant="secondary">{t('browse_listings')}</Button><Button>{t('new_application')}</Button></div>
            </div>
        </div>
    );
};

export const YearlyPlanManager = () => {
    const { t } = useLanguage();
    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold text-slate-800">{t('yearly_plan')}</h2><p className="text-slate-500 text-sm">{t('rpt_generator')}</p></div>
                <Button><Plus className="w-4 h-4 mr-2" /> {t('regenerate')}</Button>
            </div>
            <Card className="p-12 text-center border-dashed text-slate-400"><CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No RPT generated for this session yet.</p></Card>
        </div>
    );
};

export const NewsletterManager = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        subject: '',
        content: '',
        template: 'modern',
        targetRole: '',
        actionText: 'Read More',
        actionLink: ''
    });

    const handleSend = async () => {
        if (!form.subject || !form.content) return alert('Subject and Content are required');
        if (!confirm(`Send this newsletter to ${form.targetRole || 'ALL USERS'}?`)) return;

        setLoading(true);
        try {
            const res = await api.admin.sendNewsletter(form);
            if (res.success) {
                alert(`Newsletter sent successfully to ${res.count} users!`);
                setForm({ ...form, subject: '', content: '' });
            } else {
                alert('Failed: ' + res.message);
            }
        } catch (e) { alert('Error sending newsletter'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Newsletter Broadcast</h2>
                    <p className="text-slate-500 text-sm">Send updates to your community.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <Card className="lg:col-span-2 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Subject Line</label>
                        <input className="w-full p-3 border rounded-xl" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Weekly Updates: New Features!" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Template</label>
                            <select className="w-full p-3 border rounded-xl" value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}>
                                <option value="modern">Modern (Clean & Bright)</option>
                                <option value="corporate">Corporate (Professional)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Target Audience</label>
                            <select className="w-full p-3 border rounded-xl" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                                <option value="">All Users</option>
                                <option value="SCHOOL_ADMIN">School Admins Only</option>
                                <option value="TEACHER">Teachers Only</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Message Content (HTML Supported)</label>
                        <textarea className="w-full p-3 border rounded-xl font-mono text-sm" rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="<p>Dear Teachers...</p>" />
                        <p className="text-xs text-slate-400 mt-1">Basic HTML tags allowed: p, b, i, ul, li, br.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSend} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send Broadcast
                        </Button>
                    </div>
                </Card>

                {/* Preview / Notes */}
                <div className="space-y-6">
                    <Card className="p-6 bg-slate-50 border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2">Templating Tips</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                            <li>Use <b>Target Audience</b> to avoid spamming the wrong users.</li>
                            <li><b>Modern Template</b> is best for general announcements.</li>
                            <li><b>Corporate Template</b> is best for official memos.</li>
                        </ul>
                    </Card>
                    <Card className="p-6">
                        <h4 className="font-bold text-slate-800 mb-4">Quick Actions</h4>
                        <div className="space-y-3">
                            <input className="w-full p-2 border rounded text-xs" placeholder="Button Text (e.g. Read More)" value={form.actionText} onChange={e => setForm({ ...form, actionText: e.target.value })} />
                            <input className="w-full p-2 border rounded text-xs" placeholder="Button Link (e.g. https://...)" value={form.actionLink} onChange={e => setForm({ ...form, actionLink: e.target.value })} />
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
const AddSchoolModal = ({ isOpen, onClose, onAdded }: { isOpen: boolean, onClose: () => void, onAdded: () => void }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [isAdminCheckLoading, setIsAdminCheckLoading] = useState(false);
    const [adminStatus, setAdminStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
    const [foundUser, setFoundUser] = useState<any>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '', code: '', district: '', type: 'SR',
        email: '', phone: '', address: '',
        adminEmail: '',
        logo: null as File | null
    });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setForm({ ...form, logo: file });
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const checkAdminEmail = async () => {
        if (!form.adminEmail) return;
        setIsAdminCheckLoading(true);
        try {
            const res = await api.users.check(form.adminEmail);
            if (res.exists) {
                setAdminStatus('found');
                setFoundUser(res.user);
            } else {
                setAdminStatus('not_found');
                setFoundUser(null);
            }
        } catch (e) { console.error(e); }
        finally { setIsAdminCheckLoading(false); }
    };

    const handleSubmit = async () => {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null) formData.append(key, value);
        });

        try {
            const res = await api.admin.createSchool(formData);
            if (res.success) {
                alert(res.invitationSent
                    ? `School created! Invitation sent to ${form.adminEmail}`
                    : `School created! ${foundUser?.name} assigned as Admin.`);
                onAdded();
                onClose();
            } else {
                alert('Error: ' + res.message);
            }
        } catch (e) { alert('Failed to create school'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">Add New School</h3>
                        <p className="text-sm text-slate-500">Step {step} of 2: {step === 1 ? 'School Details' : 'Assign Administrator'}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center border-2 border-dashed border-slate-300 relative overflow-hidden group">
                                {logoPreview ? <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="text-slate-400" />}
                                <input type="file" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-bold text-slate-700">School Name</label>
                                <input className="w-full p-2 border rounded-lg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SK Taman Melati" />
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 border rounded-lg" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="School Code (e.g. ABC1234)" />
                                    <select className="p-2 border rounded-lg" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="SR">SR (Primary)</option>
                                        <option value="SMK">SMK (Secondary)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input className="p-2 border rounded-lg" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="District" />
                            <input className="p-2 border rounded-lg" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone Number" />
                        </div>
                        <input className="w-full p-2 border rounded-lg" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Official Email" />
                        <textarea className="w-full p-2 border rounded-lg" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full Address" rows={2} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm">
                            <h4 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> School Administrator</h4>
                            <p className="mt-1">Search for an existing user to assign as the School Admin. If they don't exist, we'll send them an invitation.</p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 p-3 border rounded-xl"
                                value={form.adminEmail}
                                onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                                placeholder="Enter Admin Email Address"
                            />
                            <Button onClick={checkAdminEmail} disabled={isAdminCheckLoading}>
                                {isAdminCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Check'}
                            </Button>
                        </div>

                        {adminStatus === 'found' && (
                            <div className="p-4 border border-green-200 bg-green-50 rounded-xl flex items-center gap-4 animate-in slide-in-from-top-2">
                                <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center font-bold">{foundUser.name.charAt(0)}</div>
                                <div>
                                    <h5 className="font-bold text-green-900">{foundUser.name}</h5>
                                    <p className="text-xs text-green-700">Current Role: {foundUser.role} • {foundUser.school_id || 'No School'}</p>
                                </div>
                                <CheckCircle className="ml-auto text-green-600" />
                            </div>
                        )}

                        {adminStatus === 'not_found' && (
                            <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl animate-in slide-in-from-top-2">
                                <h5 className="font-bold text-amber-900 flex items-center gap-2"><Mail className="w-4 h-4" /> User Not Found</h5>
                                <p className="text-sm text-amber-800 mt-1">
                                    We will send a <b>Registration Invitation</b> to this email with instructions on how to set up their School Admin account.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    {step === 2 && <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>}
                    {step === 1 ? (
                        <Button onClick={() => setStep(2)} disabled={!form.name || !form.code}>Next Step</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={adminStatus === 'idle'}>Create School</Button>
                    )}
                </div>
            </div>
        </div>
    );
};
export const SchoolManager = () => {
    const { t } = useLanguage();
    const { schools } = useGlobal();
    // Wait, useGlobal typically exposes schools. refresh might need implementation or local fetch. 
    // Let's implement local fetch for now to be safe, or just accept global update lag.

    // Quick Fix: Local refresh or rely on GlobalContext to update? 
    // Let's assume GlobalContext will eventually sync. For now, forcing a reload callback is better.
    // Actually, I'll just trigger window.location.reload() on success to be lazy but safe for this "Phase 1".

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('school_list')}</h2>
                    <p className="text-slate-500 text-sm">{t('manage_schools')}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Building className="w-4 h-4 mr-2" /> Add School
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schools.map(school => (
                    <Card key={school.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                            <div className="absolute -bottom-6 left-6 w-16 h-16 bg-white rounded-xl shadow-lg p-1">
                                {school.logoUrl ? (
                                    <img src={school.logoUrl} alt={school.name} className="w-full h-full object-contain rounded-lg" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                        <SchoolIcon className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-8 px-6 pb-6">
                            <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{school.name}</h4>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{school.code}</span>
                                <span className="text-xs text-slate-500">{school.district}</span>
                            </div>

                            <div className="space-y-2 text-sm text-slate-500">
                                {school.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {school.phone}</div>}
                                {school.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {school.email}</div>}
                                {school.address && <div className="flex items-start gap-2"><MapPin className="w-3.5 h-3.5 mt-0.5" /> <span className="line-clamp-1">{school.address}</span></div>}
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                                <Button variant="ghost" size="sm" className="text-xs">Manage Profile</Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <AddSchoolModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdded={() => window.location.reload()}
            />
        </div>
    );
};
