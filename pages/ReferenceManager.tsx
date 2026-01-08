
import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { ReferenceItem, ReferenceSource, UserRole } from '../types';
import { collection, query, where, getDocs, db, setDoc, doc, deleteDoc } from '../services/firebase';
import {
    Plus, Search, ExternalLink, Trash2, Shield, Globe,
    BookOpen, Share2, X, Link as LinkIcon,
    FileText, Info, HardDrive, RefreshCw, UserCheck, ShieldAlert, Database
} from 'lucide-react';
import { syncDskpFromSheet } from '../services/dskpSync';
import { useTranslation } from 'react-i18next';

const ReferenceManager = () => {
        const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [references, setReferences] = useState<ReferenceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSource, setActiveSource] = useState<ReferenceSource>(ReferenceSource.PUBLIC);
    const [showModal, setShowModal] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    // Form State
    const [formData, setForm] = useState<Partial<ReferenceItem>>({
        title: '',
        description: '',
        link: '',
        source: ReferenceSource.SCHOOL,
        category: 'General'
    });

    const fetchReferences = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const refsList: ReferenceItem[] = [];

            // 1. Fetch Public References
            const publicQ = query(collection(db, 'references'), where('source', '==', ReferenceSource.PUBLIC));
            const publicSnap = await getDocs(publicQ);
            publicSnap.docs.forEach(d => refsList.push({ id: d.id, ...d.data() } as ReferenceItem));

            // 2. Fetch School References (if user belongs to a school)
            if (currentUser.schoolId) {
                const schoolQ = query(collection(db, 'references'), where('source', '==', ReferenceSource.SCHOOL), where('schoolId', '==', currentUser.schoolId));
                const schoolSnap = await getDocs(schoolQ);
                schoolSnap.docs.forEach(d => refsList.push({ id: d.id, ...d.data() } as ReferenceItem));
            }

            setReferences(refsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        } catch (e) {
            console.error("Reference fetch error", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReferences();
    }, [currentUser]);

    const handleCreate = async () => {
        if (!formData.title || !formData.link || !currentUser) return;

        const id = `ref-${Date.now()}`;
        const newRef: ReferenceItem = {
            id,
            title: formData.title,
            description: formData.description || '',
            link: formData.link,
            source: formData.source || ReferenceSource.SCHOOL,
            // Strictly bind to school if not public
            schoolId: formData.source === ReferenceSource.SCHOOL ? (currentUser.schoolId || '') : '',
            uploadedBy: currentUser.id,
            uploaderName: currentUser.name,
            category: formData.category || 'General',
            createdAt: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, 'references', id), newRef);
            setReferences(prev => [newRef, ...prev]);
            setShowModal(false);
            setForm({ title: '', description: '', link: '', source: ReferenceSource.SCHOOL, category: 'General' });
        } catch (e) {
            console.error(e);
            alert("Upload failed.");
        }
    };

    const handleDelete = async (ref: ReferenceItem) => {
        if (!confirm(`Are you sure you want to remove "${ref.title}"?`)) return;
        try {
            await deleteDoc(doc(db, 'references', ref.id));
            setReferences(prev => prev.filter(r => r.id !== ref.id));
        } catch (e) {
            console.error(e);
            alert("Could not delete reference.");
        }
    };

    const handleSyncDskp = async () => {
        if (!confirm("Are you sure you want to sync DSKP master data? This will overwrite existing records.")) return;
        setIsSyncing(true);
        const res = await syncDskpFromSheet((msg) => setSyncMsg(msg));
        if (res.success) {
            alert(`Successfully synced ${res.count} standards!`);
        } else {
            alert("Sync failed. Check console.");
        }
        setIsSyncing(false);
        setSyncMsg('');
    };

    // --- SOP PERMISSION LOGIC ---
    const canManageRef = (ref: ReferenceItem): { can: boolean, reason?: string } => {
        if (!currentUser) return { can: false };

        // 1. Super Admin can manage everything
        if (currentUser.role === UserRole.SUPER_ADMIN) return { can: true, reason: 'System Administrator' };

        // 2. Original Creator (Owner) can always manage their own uploads
        if (ref.uploadedBy === currentUser.id) return { can: true, reason: 'Owner' };

        // 3. School Vault Management (Principal/School Admin)
        if (ref.source === ReferenceSource.SCHOOL && ref.schoolId === currentUser.schoolId) {
            if (currentUser.role === UserRole.PRINCIPAL || currentUser.role === UserRole.SCHOOL_ADMIN) {
                return { can: true, reason: 'School Management' };
            }
        }

        return { can: false };
    };

    const filteredRefs = useMemo(() => {
        return references
            .filter(r => r.source === activeSource)
            .filter(r =>
                r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [references, activeSource, searchQuery]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('references')}</h2>
                    <p className="text-slate-500 text-sm">{t('centralizedRepositoryForEducationalResources')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchReferences}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    {currentUser.role === UserRole.SUPER_ADMIN && (
                        <Button
                            variant="secondary"
                            onClick={handleSyncDskp}
                            disabled={isSyncing}
                            className="border-blue-200 text-blue-700 bg-blue-50/50"
                        >
                            <Database className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync DSKP Master'}
                        </Button>
                    )}
                    <Button onClick={() => setShowModal(true)} className="shadow-lg shadow-blue-500/20">
                        <Share2 className="w-4 h-4 mr-2" /> {t('upload_reference')}
                    </Button>
                </div>
            </div>

            {isSyncing && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl animate-pulse">
                    <p className="text-blue-700 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> {syncMsg || 'Initializing Sync...'}
                    </p>
                </div>
            )}

            {/* View Toggle */}
            <div className="flex bg-white p-1 rounded-2xl border shadow-sm w-fit mb-4">
                <button
                    onClick={() => setActiveSource(ReferenceSource.PUBLIC)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSource === ReferenceSource.PUBLIC ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Globe className="w-4 h-4" /> {t('public_references')}
                </button>
                <button
                    onClick={() => setActiveSource(ReferenceSource.SCHOOL)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeSource === ReferenceSource.SCHOOL ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Shield className="w-4 h-4" /> {t('school_references')}
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="p-20 text-center text-slate-400">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 opacity-20" />
                    <p className="font-medium">{t('syncingResourceDatabase')}</p>
                </div>
            ) : filteredRefs.length === 0 ? (
                <div className="p-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
                    <HardDrive className="w-16 h-16 mx-auto mb-4 opacity-10 text-slate-900" />
                    <h3 className="text-xl font-bold text-slate-800">{t('ref_no_data')}</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto mt-2">{t('noItemsSharedHereYet')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRefs.map(ref => {
                        const permission = canManageRef(ref);
                        return (
                            <Card key={ref.id} className="group hover:border-blue-400 transition-all shadow-sm rounded-3xl overflow-hidden flex flex-col h-full border-slate-100 bg-white">
                                <div className="p-6 flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-2xl ${ref.source === ReferenceSource.PUBLIC ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {ref.link.includes('drive.google.com') ? <HardDrive className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        {permission.can && (
                                            <button
                                                onClick={() => handleDelete(ref)}
                                                className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"
                                                title={`Remove Resource (${permission.reason})`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 bg-slate-50 border rounded-md">{ref.category}</span>
                                            {permission.can && (
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md flex items-center gap-1">
                                                    <UserCheck className="w-3 h-3" /> {permission.reason}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{ref.title}</h4>
                                        <p className="text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed">{ref.description || "No description provided."}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                            {ref.uploaderName.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase leading-none">{t('sharedBy')}</span>
                                            <span className="text-[11px] font-bold text-slate-600 truncate max-w-[120px]">{ref.uploaderName}</span>
                                        </div>
                                    </div>
                                    <a
                                        href={ref.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${ref.source === ReferenceSource.PUBLIC ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'} shadow-lg`}
                                    >
                                        {t('open')}<ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Share Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-0 rounded-3xl">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200"><Share2 className="w-5 h-5 text-white" /></div>
                                <h3 className="font-bold text-lg text-slate-800">{t('upload_reference')}</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="hover:bg-slate-200 p-2 rounded-full transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>

                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('ref_title')}</label>
                                <input
                                    className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold focus:border-blue-500 focus:ring-0 outline-none transition-all bg-slate-50/30"
                                    placeholder="e.g. Sesi 2024 DSKP Matematik Y4"
                                    value={formData.title}
                                    onChange={e => setForm({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('ref_link')}</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                                    <input
                                        className="w-full border-2 border-slate-100 rounded-2xl p-3.5 pl-11 text-sm font-medium focus:border-blue-500 focus:ring-0 outline-none transition-all bg-slate-50/30"
                                        placeholder="Paste Google Drive or external URL here..."
                                        value={formData.link}
                                        onChange={e => setForm({ ...formData, link: e.target.value })}
                                    />
                                </div>
                                <p className="text-[10px] text-amber-600 mt-2 ml-1 italic flex items-center gap-1 font-bold"><ShieldAlert className="w-3 h-3" /> {t('verifyLinkAccessSettingsAre')}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('ref_category')}</label>
                                    <select
                                        className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none bg-slate-50"
                                        value={formData.category}
                                        onChange={e => setForm({ ...formData, category: e.target.value })}
                                    >
                                        <option>{t('general')}</option>
                                        <option>{t('dskpSyllabus')}</option>
                                        <option>{t('rphTemplates')}</option>
                                        <option>{t('schoolCircular')}</option>
                                        <option>{t('mediaResources')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('ref_source')}</label>
                                    <select
                                        className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold focus:border-blue-500 outline-none appearance-none bg-slate-50"
                                        value={formData.source}
                                        onChange={e => setForm({ ...formData, source: e.target.value as ReferenceSource })}
                                    >
                                        <option value={ReferenceSource.SCHOOL}>{t('schoolRepositoryOnly')}</option>
                                        <option value={ReferenceSource.PUBLIC}>{t('publicHubAllSchools')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('ref_description')}</label>
                                <textarea
                                    className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-medium h-24 resize-none focus:border-blue-500 outline-none bg-slate-50/30"
                                    placeholder="Brief summary of the material..."
                                    value={formData.description}
                                    onChange={e => setForm({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t bg-slate-50/50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowModal(false)} className="rounded-xl px-6">{t('cancel')}</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!formData.title || !formData.link}
                                className="rounded-xl px-8 shadow-lg shadow-blue-500/20"
                            >
                                {t('submit')}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const Loader2 = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-loader-2 ${props.className}`}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default ReferenceManager;
