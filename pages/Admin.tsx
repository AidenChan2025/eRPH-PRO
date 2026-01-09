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

import { DSKPStandard, UserRole, School, User, SchoolType, AcademicWeek, DSKPStructure } from '../types';
import { useTranslation } from 'react-i18next';

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

    if (!school) return <div className="p-12 text-center text-slate-400 font-medium">{t('loadingSchoolProfile')}</div>;

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
                    <Button variant="secondary" onClick={() => usePresets('sk')} className="rounded-xl px-4 text-xs font-bold uppercase border-2">{t('skPreset')}</Button>
                    <Button variant="secondary" onClick={() => usePresets('smk')} className="rounded-xl px-4 text-xs font-bold uppercase border-2">{t('smkPreset')}</Button>
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
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('academicCalendarGroup')}</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setSchool({ ...school, settings: { ...school.settings, schoolGroup: 'A' } })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${school.settings?.schoolGroup === 'A' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${school.settings?.schoolGroup === 'A' ? 'text-blue-700' : 'text-slate-700'}`}>{t('kumpulanA')}</span>
                                            {school.settings?.schoolGroup === 'A' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{t('johorKedahKelantanTerengganu')}</p>
                                    </button>
                                    <button
                                        onClick={() => setSchool({ ...school, settings: { ...school.settings, schoolGroup: 'B' } })}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all ${school.settings?.schoolGroup === 'B' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-blue-200'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-sm font-black ${school.settings?.schoolGroup === 'B' ? 'text-blue-700' : 'text-slate-700'}`}>{t('kumpulanB')}</span>
                                            {school.settings?.schoolGroup === 'B' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{t('melakaNegeriSembilanPahangPerak')}</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-8 rounded-[2.5rem] border-slate-100 shadow-xl space-y-6">
                        <div className="flex justify-between items-center border-b pb-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Clock className="w-5 h-5" /></div><h3 className="font-black text-slate-800 uppercase tracking-tight">{t('operatingHours')}</h3></div></div>
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
                        <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-600" /> {t('subjects')}</h3>
                        <div className="flex gap-2"><input className="flex-1 border-2 border-slate-50 p-2.5 rounded-xl text-xs font-bold outline-none" placeholder="Add..." value={newSubject} onChange={e => setNewSubject(e.target.value)} /><button onClick={() => addListValue('customSubjects', newSubject)} className="p-2.5 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button></div>
                        <div className="flex flex-wrap gap-2">{school.settings?.customSubjects?.map(s => <span key={s} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black border flex items-center gap-1">{s}<button onClick={() => removeListValue('customSubjects', s)}><X className="w-3 h-3" /></button></span>)}</div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] border-slate-100 shadow-xl space-y-4">
                        <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2"><Users className="w-4 h-4 text-amber-600" /> {t('classes')}</h3>
                        <div className="flex gap-2"><input className="flex-1 border-2 border-slate-50 p-2.5 rounded-xl text-xs font-bold outline-none" placeholder="Add..." value={newClass} onChange={e => setNewClass(e.target.value)} /><button onClick={() => addListValue('customClasses', newClass)} className="p-2.5 bg-blue-600 text-white rounded-xl"><Plus className="w-4 h-4" /></button></div>
                        <div className="flex flex-wrap gap-2">{school.settings?.customClasses?.map(c => <span key={c} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black border flex items-center gap-1">{c}<button onClick={() => removeListValue('customClasses', c)}><X className="w-3 h-3" /></button></span>)}</div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

// --- NEW HIERARCHICAL DSKP MANAGER ---

export { DSKPContainer as DSKPManager } from '../src/pages/dskp/DSKPContainer';
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
                {isLoading ? <div className="col-span-full p-12 text-center text-slate-400">{t('loadingUsers')}</div> : users.map(user => (
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
            <Card className="p-12 text-center border-dashed text-slate-400"><CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>{t('noRptGeneratedForThis')}</p></Card>
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
                    <h2 className="text-2xl font-bold text-slate-800">{t('newsletterBroadcast')}</h2>
                    <p className="text-slate-500 text-sm">{t('sendUpdatesToYourCommunity')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <Card className="lg:col-span-2 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('subjectLine')}</label>
                        <input className="w-full p-3 border rounded-xl" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Weekly Updates: New Features!" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('template')}</label>
                            <select className="w-full p-3 border rounded-xl" value={form.template} onChange={e => setForm({ ...form, template: e.target.value })}>
                                <option value="modern">{t('modernCleanBright')}</option>
                                <option value="corporate">{t('corporateProfessional')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">{t('targetAudience')}</label>
                            <select className="w-full p-3 border rounded-xl" value={form.targetRole} onChange={e => setForm({ ...form, targetRole: e.target.value })}>
                                <option value="">{t('allUsers')}</option>
                                <option value="SCHOOL_ADMIN">{t('schoolAdminsOnly')}</option>
                                <option value="TEACHER">{t('teachersOnly')}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">{t('messageContentHtmlSupported')}</label>
                        <textarea className="w-full p-3 border rounded-xl font-mono text-sm" rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="<p>Dear Teachers...</p>" />
                        <p className="text-xs text-slate-400 mt-1">{t('basicHtmlTagsAllowedP')}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSend} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                            {t('sendBroadcast')}</Button>
                    </div>
                </Card>

                {/* Preview / Notes */}
                <div className="space-y-6">
                    <Card className="p-6 bg-slate-50 border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-2">{t('templatingTips')}</h4>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                            <li>{t('use')}<b>{t('targetAudience')}</b> {t('toAvoidSpammingTheWrong')}</li>
                            <li><b>{t('modernTemplate')}</b> {t('isBestForGeneralAnnouncements')}</li>
                            <li><b>{t('corporateTemplate')}</b> {t('isBestForOfficialMemos')}</li>
                        </ul>
                    </Card>
                    <Card className="p-6">
                        <h4 className="font-bold text-slate-800 mb-4">{t('quickActions')}</h4>
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
                        <h3 className="text-2xl font-bold text-slate-900">{t('addNewSchool')}</h3>
                        <p className="text-sm text-slate-500">{t('step')}{step} {t('of2')}{step === 1 ? 'School Details' : 'Assign Administrator'}</p>
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
                                <label className="text-sm font-bold text-slate-700">{t('schoolName')}</label>
                                <input className="w-full p-2 border rounded-lg" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. SK Taman Melati" />
                                <div className="flex gap-2">
                                    <input className="flex-1 p-2 border rounded-lg" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="School Code (e.g. ABC1234)" />
                                    <select className="p-2 border rounded-lg" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="SR">{t('srPrimary')}</option>
                                        <option value="SMK">{t('smkSecondary')}</option>
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
                            <h4 className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> {t('schoolAdministrator')}</h4>
                            <p className="mt-1">{t('searchForAnExistingUser')}</p>
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
                                    <p className="text-xs text-green-700">{t('currentRole')}{foundUser.role} • {foundUser.school_id || 'No School'}</p>
                                </div>
                                <CheckCircle className="ml-auto text-green-600" />
                            </div>
                        )}

                        {adminStatus === 'not_found' && (
                            <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl animate-in slide-in-from-top-2">
                                <h5 className="font-bold text-amber-900 flex items-center gap-2"><Mail className="w-4 h-4" /> {t('userNotFound')}</h5>
                                <p className="text-sm text-amber-800 mt-1">
                                    {t('weWillSendA')}<b>{t('registrationInvitation')}</b> {t('toThisEmailWithInstructions')}</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    {step === 2 && <Button variant="ghost" onClick={() => setStep(1)}>{t('back')}</Button>}
                    {step === 1 ? (
                        <Button onClick={() => setStep(2)} disabled={!form.name || !form.code}>{t('nextStep')}</Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={adminStatus === 'idle'}>{t('createSchool')}</Button>
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
                    <Building className="w-4 h-4 mr-2" /> {t('addSchool')}</Button>
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
                                <Button variant="ghost" size="sm" className="text-xs">{t('manageProfile')}</Button>
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
