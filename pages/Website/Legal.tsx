import React, { useState } from 'react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { Shield, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Legal = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'security'>('privacy');

    const tabs = [
        { id: 'privacy', label: 'Privacy Policy', icon: Lock },
        { id: 'terms', label: 'Terms of Service', icon: FileText },
        { id: 'security', label: 'Security Policy', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">{t('legalCenter')}</h1>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                            {t('transparencyIsOurCoreValue')}</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 max-w-2xl mx-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex px-6 py-3 rounded-2xl items-center gap-2 font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-white shadow-md text-blue-600 scale-105'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/30 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {activeTab === 'privacy' && (
                            <div className="prose prose-slate prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 max-w-none">
                                <h2>{t('privacyPolicy')}</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{t('lastUpdatedJan072026')}</p>

                                <h3>{t('1DataCollection')}</h3>
                                <p>{t('weCollectMinimalDataNecessary')}</p>
                                <ul>
                                    <li>{t('teacherNamesAndEmailAddresses')}</li>
                                    <li>{t('schoolProfileInformation')}</li>
                                </ul>

                                <h3>{t('2DataUsage')}</h3>
                                <p>{t('yourDataIsUsedStrictly')}</p>
                                <ul>
                                    <li>{t('generatingOfficialPdfReportsFor')}</li>
                                    <li>{t('syncingWithTheNationalDskp')}</li>
                                </ul>
                                <p><strong>{t('weDoNotSellYour')}</strong></p>

                                <h3>{t('3UserRights')}</h3>
                                <p>{t('youHaveTheRightTo')}</p>
                            </div>
                        )}

                        {activeTab === 'terms' && (
                            <div className="prose prose-slate prose-headings:font-black prose-p:font-medium prose-p:text-slate-600 max-w-none">
                                <h2>{t('termsOfService')}</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{t('effectiveDateJan012024')}</p>

                                <h3>{t('1UsageLicense')}</h3>
                                <p>{t('byUsingErphProYou')}</p>

                                <h3>{t('2AcceptableUse')}</h3>
                                <p>{t('youAgreeNotTo')}</p>
                                <ul>
                                    <li>{t('misuseTheReportingToolsTo')}</li>
                                    <li>{t('attemptToReverseEngineerThe')}</li>
                                    <li>{t('shareYourAccountCredentialsWith')}</li>
                                </ul>

                                <h3>{t('3Disclaimer')}</h3>
                                <p>{t('erphProIsProvidedAs')}</p>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">{t('securityInfrastructure')}</h2>
                                    <p className="text-slate-600 font-medium leading-relaxed">
                                        {t('weTakeTheSecurityOf')}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { title: "Encryption at Rest", desc: "All database volumes are encrypted using AES-256 standards." },
                                        { title: "TLS 1.3 Transport", desc: "All data in transit is protected by strict HTTPS enforcement." },
                                        { title: "Isolated Tenants", desc: "School data is logically isolated to prevent cross-contamination." },
                                        { title: "Regular Backups", desc: "Automated hourly backups ensure zero data loss." }
                                    ].map((item, i) => (
                                        <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-3 mb-2 text-blue-600">
                                                <CheckCircle2 className="w-5 h-5" />
                                                <h4 className="font-black text-sm uppercase tracking-wider">{item.title}</h4>
                                            </div>
                                            <p className="text-slate-500 font-medium text-sm">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                                    <Shield className="w-8 h-8 text-blue-600 shrink-0" />
                                    <div>
                                        <h4 className="font-black text-blue-800 mb-1">{t('aidenSecuritySubsystem')}</h4>
                                        <p className="text-blue-700/80 text-sm font-medium">
                                            {t('ourProprietaryActiveDefenseSystem')}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main >

            <PublicFooter />
        </div >
    );
};

export default Legal;
