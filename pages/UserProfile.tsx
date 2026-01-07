import React, { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, ServiceRecord } from '../types';
import {
    User as UserIcon, Mail, Phone, Award, Briefcase,
    Calendar, Save, Plus, Trash2, Camera, MapPin,
    FileText, CheckCircle, ChevronRight, PenTool, Sparkles, X, Loader2
} from 'lucide-react';
import { doc, updateDoc, db } from '../services/firebase';
import { api } from '../services/api';

const UserProfile = () => {
    const { t } = useLanguage();
    const { currentUser, setCurrentUser } = useGlobal();
    const [activeTab, setActiveTab] = useState<'personal' | 'service' | 'cloud'>('personal');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Editable State
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        phone: '',
        grade: '',
        bio: '',
        avatar: '',
    });
    const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);

    useEffect(() => {
        if (currentUser) {
            setFormData({
                name: currentUser.name || '',
                email: currentUser.email || '',
                phone: currentUser.phone || '',
                grade: currentUser.grade || '',
                bio: currentUser.bio || '',
                avatar: currentUser.avatar || '',
            });
            setServiceHistory(currentUser.serviceHistory || []);
        }
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser) {
            console.error("No current user found to save.");
            return;
        }

        setIsSaving(true);

        try {
            const updatedUser = {
                ...currentUser,
                ...formData,
                serviceHistory
            };

            await updateDoc(doc(db, 'users', currentUser.id), {
                name: formData.name,
                phone: formData.phone,
                grade: formData.grade,
                bio: formData.bio,
                avatar: formData.avatar,
                serviceHistory: serviceHistory
            });

            setCurrentUser(updatedUser);
            alert("Profile updated successfully!");
        } catch (e) {
            console.error("Save Error:", e);
            alert("Failed to update profile. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addServiceRecord = () => {
        const newRecord: ServiceRecord = {
            id: `sr - ${ Date.now() } `,
            schoolName: '',
            startDate: '',
            endDate: 'Present',
            position: 'Teacher'
        };
        setServiceHistory([newRecord, ...serviceHistory]);
    };

    const updateServiceRecord = (id: string, field: keyof ServiceRecord, value: string) => {
        setServiceHistory(prev => prev.map(sr => sr.id === id ? { ...sr, [field]: value } : sr));
    };

    const removeServiceRecord = (id: string) => {
        setServiceHistory(prev => prev.filter(sr => sr.id !== id));
    };

    // --- Cloud Backup Tab ---
    const handleConnectDrive = async () => {
        try {
            const res = await api.cms.auth.getGoogleUrl();
            window.location.href = res.url; // Trigger OAuth flow
        } catch (e) { alert("Failed to start Google Auth"); }
    };

    const handleBackup = async () => {
        if (!confirm("Start backup to Google Drive?")) return;
        setIsSaving(true);
        try {
            const res = await api.cms.user.backupToDrive(currentUser?.id || '');
            if (res.success) alert("Backup Successful! File ID: " + res.fileId);
            else alert("Backup Failed: " + res.message);
        } catch (e) { alert("Error during backup"); }
        finally { setIsSaving(false); }
    };

    // Check for OAuth Code on Mount
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        if (code && currentUser) {
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Exchange code
            api.cms.auth.connectGoogle(code, currentUser.id).then(res => {
                if (res.success) alert("Connected to Google Drive successfully!");
                else alert("Failed to connect: " + res.message);
            });
        }
    }, [currentUser]);


    if (!currentUser) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            {/* Hidden File Input for Avatar */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
            />

            {/* Header / Banner */}
            <div className="relative h-64 md:h-56 rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 overflow-visible shadow-2xl">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none rounded-3xl"></div>

                <div className="relative h-full w-full p-8 flex flex-col md:flex-row items-center md:items-end justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden">
                                <div className="w-full h-full rounded-2xl bg-blue-600 flex items-center justify-center font-black text-4xl text-white overflow-hidden">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        currentUser.name ? currentUser.name.charAt(0) : '?'
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleAvatarClick}
                                className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-slate-100 hover:text-blue-600 transition-colors z-20"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-center md:text-left md:mb-2">
                            <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-md">{formData.name || 'User Profile'}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest border border-blue-400">
                                    {formData.grade || 'Grade Not Set'}
                                </span>
                                <span className="text-blue-200 text-sm font-medium flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> Malaysia
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-2 shrink-0">
                        <Button variant="secondary" className="rounded-2xl h-12 px-6 bg-white border-none shadow-xl shadow-black/20 font-bold" onClick={() => window.history.back()}>
                            {t('cancel')}
                        </Button>
                        <Button className="rounded-2xl h-12 px-8 shadow-xl shadow-blue-500/20 font-bold" onClick={handleSave} isLoading={isSaving}>
                            <Save className="w-4 h-4 mr-2" /> {t('save')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                {/* Left: Bio & Status */}
                <div className="space-y-6">
                    <Card className="p-6 rounded-3xl border-slate-100 shadow-sm overflow-visible">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-4 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" /> {t('personal_details')}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Professional Bio</label>
                                <textarea
                                    className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-4 text-sm font-medium h-32 focus:border-blue-500 outline-none transition-all resize-none shadow-inner"
                                    placeholder="Tell us about your teaching philosophy..."
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 relative overflow-hidden">
                                <Sparkles className="absolute top-0 right-0 p-2 w-10 h-10 text-blue-200 opacity-50" />
                                <p className="text-xs font-bold text-blue-700 leading-relaxed relative z-10">
                                    Your profile is visible to school administrators for validation and placement records.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 rounded-3xl border-slate-100 shadow-sm bg-slate-900 text-white">
                        <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-500 mb-4 flex items-center gap-2">
                            <PenTool className="w-3.5 h-3.5" /> Digital Signature
                        </h3>
                        <div className="aspect-video rounded-2xl bg-white/5 border border-white/10 border-dashed flex flex-col items-center justify-center gap-3 group hover:border-blue-400 transition-colors cursor-pointer">
                            <div className="p-3 rounded-full bg-white/10 text-slate-400 group-hover:text-blue-400 transition-colors">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-500">Register Signature</span>
                        </div>
                    </Card>
                </div>

                {/* Right: Detailed Info Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex bg-white p-1 rounded-2xl border shadow-sm w-fit">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${ activeTab === 'personal' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50' } `}
                        >
                            <UserIcon className="w-4 h-4" /> Account Info
                        </button>
                        <button
                            onClick={() => setActiveTab('service')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${ activeTab === 'service' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50' } `}
                        >
                            <Briefcase className="w-4 h-4" /> {t('service_history')}
                        </button>
                        <button
                            onClick={() => setActiveTab('cloud')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${ activeTab === 'cloud' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50' } `}
                        >
                            <Sparkles className="w-4 h-4" /> Cloud Backup
                        </button>
                    </div>

                    {activeTab === 'personal' && (
                        <Card className="p-8 rounded-3xl border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input
                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3.5 pl-11 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Professional Grade</label>
                                    <div className="relative">
                                        <Award className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input
                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3.5 pl-11 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                            value={formData.grade}
                                            placeholder="e.g. DG 10"
                                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input
                                            className="w-full border-2 border-slate-100 bg-slate-100 rounded-2xl p-3.5 pl-11 text-sm font-bold text-slate-500 cursor-not-allowed"
                                            value={formData.email}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                                        <input
                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3.5 pl-11 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'service' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center px-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience Timeline</p>
                                <button onClick={addServiceRecord} className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Record
                                </button>
                            </div>

                            <div className="space-y-4">
                                {serviceHistory.length === 0 ? (
                                    <div className="p-12 text-center bg-white rounded-3xl border border-dashed text-slate-400 italic text-sm">
                                        No service history recorded yet.
                                    </div>
                                ) : (
                                    serviceHistory.map((sr, idx) => (
                                        <Card key={sr.id} className="p-6 rounded-3xl border-slate-100 hover:border-blue-200 transition-colors shadow-sm relative group">
                                            <button
                                                onClick={() => removeServiceRecord(sr.id)}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">School Name</label>
                                                        <input
                                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                                            value={sr.schoolName}
                                                            onChange={e => updateServiceRecord(sr.id, 'schoolName', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Position / Role</label>
                                                        <input
                                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                                            value={sr.position}
                                                            onChange={e => updateServiceRecord(sr.id, 'position', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                                                        <input
                                                            type="date"
                                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                                            value={sr.startDate}
                                                            onChange={e => updateServiceRecord(sr.id, 'startDate', e.target.value)}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                                                        <input
                                                            className="w-full border-2 border-slate-50 bg-slate-50/30 rounded-2xl p-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                                            value={sr.endDate}
                                                            placeholder="e.g. Present"
                                                            onChange={e => updateServiceRecord(sr.id, 'endDate', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'cloud' && (
                        <div className="animate-in slide-in-from-right-4 duration-300">
                            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                                {/* Wizard Header */}
                                <div className="bg-emerald-50/50 p-8 border-b border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100 text-emerald-600">
                                            <Sparkles className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800">Cloud Backup Setup</h3>
                                            <p className="text-slate-500 text-sm font-medium mt-1">
                                                Protect your work by syncing daily lesson plan backups to your Google Drive.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-8 space-y-8">
                                    {/* Step 1: Connect */}
                                    <div className={`relative flex gap-6 ${ currentUser.google_token ? 'opacity-50' : '' } `}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 
                                                ${ currentUser.google_token ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-200' } `}>
                                                {currentUser.google_token ? <CheckCircle className="w-5 h-5"/> : '1'}
                                            </div>
                                            <div className="w-0.5 flex-1 bg-slate-100 my-2"></div>
                                        </div>
                                        <div className="pb-8">
                                            <h4 className="font-bold text-slate-800 text-lg mb-2">Connect Google Account</h4>
                                            <p className="text-slate-500 text-sm mb-4 leading-relaxed max-w-lg">
                                                Authorize eRPH Pro to create a secure "eRPH Pro Backups" folder in your Google Drive. We only access files we create.
                                            </p>
                                            {!currentUser.google_token && (
                                                <Button onClick={handleConnectDrive} className="rounded-xl shadow-lg shadow-blue-500/20">
                                                    Grant Permission
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 2: Confirmation / Action */}
                                    <div className={`relative flex gap-6 ${ !currentUser.google_token ? 'opacity-50 pointer-events-none' : '' } `}>
                                        <div className="flex flex-col items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm z-10 
                                                ${ currentUser.google_token ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-400' } `}>
                                                2
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg mb-2">Start Backup Service</h4>
                                            <p className="text-slate-500 text-sm mb-4 leading-relaxed max-w-lg">
                                                Your account is connected! You can now trigger an immediate backup or configure automated daily schedules (coming soon).
                                            </p>
                                            
                                            {currentUser.google_token && (
                                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full max-w-lg">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                            System Connected
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border">
                                                            Drive Status: Active
                                                        </span>
                                                    </div>
                                                    <Button onClick={handleBackup} disabled={isSaving} className="w-full rounded-xl" variant="primary">
                                                        {isSaving ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                                Uploading Backup...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Save className="w-4 h-4 mr-2" />
                                                                Run Backup Now
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
