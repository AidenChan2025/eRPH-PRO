import React, { useState } from 'react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { useLanguage } from '../../context/LanguageContext';
import {
    Book, Search, Info, HelpCircle, FileText,
    ChevronRight, Clock, Star, Shield, Zap, CheckCircle2
} from 'lucide-react';
import Button from '../../components/Button';

const KnowledgeBase = () => {
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'updates' | 'guides' | 'faq'>('updates');

    const updateLogs = [
        {
            version: "v0.0.32",
            date: "Jan 07, 2026",
            title: "Performance & Reliability Update",
            items: [
                "Implemented Smart Lazy Loading for DSKP Management to handle 46,000+ records instantly.",
                "Fixed DSKP Sync timeout issues with chunked data processing.",
                "Added granular progress tracking for large data syncs.",
                "Enhanced footer and public pages navigation structure."
            ]
        },
        {
            version: "v0.0.31",
            date: "Jan 06, 2026",
            title: t('faq_log_v31_title'),
            items: [t('faq_log_v31_item1'), t('faq_log_v31_item2'), t('faq_log_v31_item3'), t('faq_log_v31_item4')]
        },
        {
            version: "v0.0.30",
            date: "Jan 06, 2026",
            title: "Content & SEO Overhaul",
            items: ["Premium CTA transformation", "Trilingual Public Language Switcher", "Feature Logs integration", "Article Hub SEO infrastructure"]
        },
        {
            version: "v0.0.29",
            date: "Jan 05, 2026",
            title: "Security & Personalization",
            items: ["AIDEN Security Subsystem v1.1", "Dynamic Role Switcher UI", "Personalized Header Greetings", "Direct School Branding integration"]
        },
        {
            version: "v0.0.28",
            date: "Jan 01, 2026",
            title: "Initial Portal Genesis",
            items: ["Core RPH Engine deployment", "DSKP Live Sync module", "Multi-tenancy school support", "Real-time Approval workflows"]
        }
    ];

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

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <PublicNavbar />

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest">
                            <Book className="w-4 h-4" />
                            <span>Knowledge Center</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
                            How can we <span className="text-blue-600">help you?</span>
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
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900">Changelog & Release Notes</h3>
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-widest">Live</span>
                                </div>

                                <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:ml-8 before:h-full before:w-0.5 before:bg-slate-200">
                                    <div className="relative pl-16 md:pl-24 group">
                                        <div className="absolute left-0 w-10 h-10 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10 group-hover:scale-110 transition-transform group-hover:border-blue-500 text-slate-400 group-hover:text-blue-500">
                                            <Star className="w-5 h-5 md:w-8 md:h-8 fill-current text-amber-400 border-none" />
                                        </div>

                                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black font-mono tracking-tight">v0.0.33</span>
                                                        <time className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jan 07, 2026</time>
                                                    </div>
                                                    <h4 className="text-xl font-black text-slate-800">Knowledge Hub & UI Polish</h4>
                                                </div>
                                            </div>
                                            <ul className="grid grid-cols-1 gap-3">
                                                {[
                                                    "Overhauled Knowledge Base with User Guides",
                                                    "New Interactive FAQ Accordion System",
                                                    "Optimized Login Page Layout",
                                                    "Global Navigation Refinement"
                                                ].map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {updateLogs.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.version.includes(searchQuery)).map((log, i) => (
                                        <div key={i} className="relative pl-16 md:pl-24 group">
                                            <div className="absolute left-0 w-10 h-10 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm z-10 group-hover:scale-110 transition-transform group-hover:border-blue-500 text-slate-400 group-hover:text-blue-500">
                                                <Zap className="w-5 h-5 md:w-8 md:h-8" />
                                            </div>

                                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-black font-mono tracking-tight">{log.version}</span>
                                                            <time className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.date}</time>
                                                        </div>
                                                        <h4 className="text-xl font-black text-slate-800">{log.title}</h4>
                                                    </div>
                                                </div>
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
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* FAQs */}
                        {activeTab === 'faq' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                                <h3 className="text-2xl font-black text-slate-900 mb-8 text-center">Frequently Asked Questions</h3>
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
                                                <p>Welcome to eRPH Pro! Here's how to get started:</p>
                                                <ol className="list-decimal pl-5 space-y-2">
                                                    <li><strong>Log In</strong> using your provided credentials (IC Number).</li>
                                                    <li>Navigate to <strong>Settings</strong> to update your profile photo and signature.</li>
                                                    <li>Ensure your <strong>Grade & Subject</strong> details are correct.</li>
                                                </ol>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "Creating RPH",
                                        desc: "Step-by-step to your first lesson plan.",
                                        icon: FileText,
                                        content: (
                                            <div className="space-y-4 text-slate-600">
                                                <p>Creating a lesson plan is easy:</p>
                                                <ol className="list-decimal pl-5 space-y-2">
                                                    <li>Click <strong>New Plan</strong> in the sidebar.</li>
                                                    <li>Select your <strong>Date, Time, Class, and Subject</strong>.</li>
                                                    <li>Choose standards from the <strong>DSKP Selector</strong>.</li>
                                                    <li>Click <strong>Save Draft</strong> or <strong>Submit</strong>.</li>
                                                </ol>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "DSKP Mapping",
                                        desc: "Linking standards to your lessons.",
                                        icon: Book,
                                        content: (
                                            <div className="space-y-4 text-slate-600">
                                                <p>We've digitized the entire DSKP library for you:</p>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li>Use the <strong>DSKP Manager</strong> to favorite your subjects.</li>
                                                    <li>During RPH creation, simply <strong>click to select</strong> standards.</li>
                                                    <li>Everything is auto-filled!</li>
                                                </ul>
                                            </div>
                                        )
                                    },
                                    {
                                        title: "Submission",
                                        desc: "Sending weekly plans for review.",
                                        icon: CheckCircle2,
                                        content: (
                                            <div className="space-y-4 text-slate-600">
                                                <p>Once you're done, send it for review:</p>
                                                <ul className="list-disc pl-5 space-y-2">
                                                    <li>Go to <strong>My Plans</strong>.</li>
                                                    <li>Select the plans you want to submit.</li>
                                                    <li>Click the <strong>Submit for Review</strong> button on top.</li>
                                                    <li>Your principal will be notified!</li>
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
                                        <Button variant="secondary" size="sm" className="w-full">Read Guide</Button>
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
                            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => setSelectedGuide(null)}>Close Guide</Button>
                        </div>
                    </div>
                </div>
            )}

            <PublicFooter />
        </div>
    );
};

export default KnowledgeBase;
