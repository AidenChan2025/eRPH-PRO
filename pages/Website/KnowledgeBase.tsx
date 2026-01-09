import React, { useState } from 'react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { useLanguage } from '../../context/LanguageContext';
import {
    Book, Search, Info, HelpCircle, FileText,
    ChevronRight, Clock, Star, Shield, Zap, CheckCircle2
} from 'lucide-react';
import Button from '../../components/Button';

import { CHANGELOG } from '../../src/config/changelog';
import { useTranslation } from 'react-i18next';

const KnowledgeBase = () => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'updates' | 'guides' | 'faq'>('updates');

    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    const updateLogs = CHANGELOG;

    const faqs = [
        {
            q: "How do I sync DSKP data from Google Sheets?",
            a: "Go to Admin > DSKP Management, click 'Sync Master DSKP', paste your Google Sheet URL, and follow the mapping wizard."
        },
        {
            q: "Why is my lesson plan not saving?",
            a: "Ensure you have a stable internet connection. eRPH Pro auto-saves drafts locally, but requires connection to sync to the server."
        },
        {
            q: "Can I manage multiple schools?",
            a: "Yes, Super Admins can switch between school contexts via the User Management panel."
        }
    ];

    const [selectedGuide, setSelectedGuide] = useState<{ title: string; content: React.ReactNode } | null>(null);

    // Set default expanded log to the latest one on mount
    React.useEffect(() => {
        if (!expandedLog && updateLogs.length > 0) {
            setExpandedLog(updateLogs[0].version);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicNavbar />

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                            <Book className="w-4 h-4" />
                            <span>{t('knowledgeCenter')}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                            {t('howCanWe')}<span className="text-blue-600">{t('helpYou')}</span>
                        </h1>
                        <div className="max-w-xl mx-auto relative group">
                            <Search className="absolute left-5 top-5 w-6 h-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search definitions, guides, or updates..."
                                className="w-full h-16 pl-14 pr-6 rounded-2xl border-2 border-slate-100 bg-white font-bold text-slate-700 focus:border-blue-500 outline-none shadow-sm transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex justify-center border-b border-slate-200">
                        <div className="flex gap-8">
                            {[
                                { id: 'updates', label: 'System Updates', icon: Clock },
                                { id: 'guides', label: 'User Guides', icon: FileText },
                                { id: 'faq', label: 'Common Questions', icon: HelpCircle },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`pb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide transition-all border-b-4 ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[400px]">
                        {/* UPDATE LOGS */}
                        {activeTab === 'updates' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900">{t('changelogReleaseNotes')}</h3>
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">{t('live')}</span>
                                </div>

                                <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-8 before:h-full before:w-0.5 before:bg-slate-200">
                                    {updateLogs.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.version.includes(searchQuery)).map((log, i) => {
                                        const isExpanded = expandedLog === log.version;
                                        return (
                                            <div key={i} className="relative pl-16 md:pl-24 group">
                                                <div className={`absolute left-0 w-10 h-10 md:w-16 md:h-16 rounded-2xl border-2 flex items-center justify-center shadow-sm z-10 transition-all ${isExpanded ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-blue-200' : 'bg-white border-slate-100 text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500'}`}>
                                                    {i === 0 ? <Star className="w-5 h-5 md:w-8 md:h-8 fill-current" /> : <Zap className="w-5 h-5 md:w-8 md:h-8" />}
                                                </div>

                                                <div
                                                    onClick={() => setExpandedLog(isExpanded ? null : log.version)}
                                                    className={`bg-white rounded-[2rem] border transition-all cursor-pointer overflow-hidden ${isExpanded ? 'p-8 border-blue-200 shadow-xl ring-4 ring-blue-50/50' : 'p-6 border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100'}`}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className={`px-3 py-1 rounded-lg text-xs font-black font-mono tracking-tight ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{log.version}</span>
                                                                <time className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.date}</time>
                                                            </div>
                                                            <h4 className={`font-black text-slate-800 transition-all ${isExpanded ? 'text-xl' : 'text-lg'}`}>{log.title}</h4>
                                                        </div>
                                                        <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-500' : ''}`} />
                                                    </div>

                                                    {/* Collapsible Content */}
                                                    <div className={`grid grid-transition duration-500 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
                                                        <div className="overflow-hidden">
                                                            <ul className="grid grid-cols-1 gap-3">
                                                                {log.items.map((item, idx) => (
                                                                    <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FAQs */}
                        {activeTab === 'faq' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                                <h3 className="text-2xl font-black text-slate-900 mb-8 text-center">{t('frequentlyAskedQuestions')}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {[...faqs,
                                    { q: "Is the system secure for sensitive student data?", a: "Yes, we employ military-grade AES-256 encryption. All databases are isolated per school tenant, ensuring strict data sovereignty." },
                                    { q: "What happens if I lose internet connection?", a: "eRPH Pro has an 'Offline Mode'. You can continue editing existing plans. Once connection is restored, changes sync automatically." }
                                    ].filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase())).map((faq, i) => (
                                        <details key={i} className="group p-6 bg-white border border-slate-100 rounded-3xl open:border-blue-200 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                            <summary className="font-bold text-lg text-slate-800 flex items-center justify-between gap-3 list-none">
                                                <div className="flex items-center gap-3">
                                                    <HelpCircle className="w-5 h-5 text-blue-500" />
                                                    {faq.q}
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform" />
                                            </summary>
                                            <p className="text-slate-500 font-medium leading-relaxed mt-4 pl-8 border-l-2 border-slate-100 group-open:animate-in group-open:fade-in group-open:slide-in-from-top-2">
                                                {faq.a}
                                            </p>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guides Section */}
                        {activeTab === 'guides' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {[
                                    {
                                        title: "Getting Started",
                                        desc: "Setting up your profile and first login.",
                                        icon: Zap,
                                        content: (
                                            <div className="space-y-4 text-slate-600">
                                                <p>{t('welcomeToErphProHeres')}</p>
                                                <ol className="list-decimal pl-5 space-y-2">
                                                    <li><strong>{t('logIn')}</strong> {t('usingYourProvidedCredentialsIc')}</li>
                                                    <li>{t('navigateTo')}<strong>{t('settings')}</strong> {t('toUpdateYourProfilePhoto')}</li>
                                                    <li>{t('ensureYour')}<strong>{t('gradeSubject')}</strong> {t('detailsAreCorrect')}</li>
                                                </ol>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "DSKP Browser",
                                        desc: "Accessing National Standards.",
                                        icon: Book,
                                        content: (
                                            <div className="space-y-4 text-slate-600">
                                                <p>{t('weveDigitizedTheEntireDskp')}</p>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li>{t('useThe')}<strong>{t('dskpManager')}</strong> {t('toFavoriteYourSubjects')}</li>
                                                    <li>{t('browseAndSearchForSpecificStandards')}</li>
                                                    <li>{t('everythingIsDigitized')}</li>
                                                </ul>
                                            </div>
                                        )
                                    }
                                ].map((guide, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedGuide({ title: guide.title, content: guide.content })}
                                        className="p-8 bg-white border border-slate-100 rounded-[2.5rem] hover:border-blue-200 hover:shadow-xl transition-all group cursor-pointer"
                                    >
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <guide.icon className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-2">{guide.title}</h4>
                                        <p className="text-slate-500 font-medium mb-6">{guide.desc}</p>
                                        <Button variant="secondary" size="sm" className="w-full">{t('readGuide')}</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Guide Modal */}
            {selectedGuide && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border-4 border-slate-100">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="text-2xl font-black text-slate-900">{selectedGuide.title}</h3>
                            <button
                                onClick={() => setSelectedGuide(null)}
                                className="p-2 bg-white hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {selectedGuide.content}
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setSelectedGuide(null)}>{t('closeGuide')}</Button>
                        </div>
                    </div>
                </div>
            )}

            <PublicFooter />
        </div>
    );
};

export default KnowledgeBase;
