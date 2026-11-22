
import React, { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Shield, Globe, Mail, BarChart3, Database, Save, Server, Info, Search, BookOpen, Settings, Zap, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import { sendTestEmail } from '../../services/emailService';
import { ReleaseLog } from '../../src/components/ReleaseLog';
import { RELEASE_LOGS } from '../../src/lib/release_logs';
import { useTranslation } from 'react-i18next';

export const SystemConfig = () => {
        const { t } = useLanguage();
    const { currentUser } = useGlobal();
    const [isSaving, setIsSaving] = useState(false);

    const [config, setConfig] = useState({
        googleAnalyticsId: 'UA-XXXXX-Y',
        googleSearchConsoleId: 'sc-domain-token',
        googleAdsenseId: 'ca-pub-XXXXXXXXXXXXXX',
        cmsConfig: {
            autoCrawlEnabled: true,
            authorName: 'Aiden Chan',
            articlesPerDay: 1
        },
        smtp: {
            host: 'erphpro.com',
            port: 465,
            user: 'admin@erphpro.com',
            pass: '',
            fromEmail: 'admin@erphpro.com',
            pop3Port: 995,
            imapPort: 993,
            autoReplyEnabled: true,
            autoReplyTemplate: 'Thank you for contacting eRPH Pro Support. We have received your inquiry and will get back to you shortly.'
        }
    });

    const handleSave = async () => {
        setIsSaving(true);
        // Simulation of MySQL update
        setTimeout(() => {
            setIsSaving(false);
            alert("System configuration synced with MySQL master database.");
        }, 1000);
    };

    const handleSendTest = async () => {
        const success = await sendTestEmail(config.smtp);
        if (success) {
            alert("Test email sent to " + config.smtp.user);
        } else {
            alert("Failed to send test email. Check console for details.");
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('systemConfiguration')}</h2>
                    <p className="text-slate-500 text-sm">{t('controlErphProsGlobalInfrastructure')}</p>
                </div>
                <Button onClick={handleSave} isLoading={isSaving} className="rounded-xl px-8 shadow-lg shadow-blue-500/20">
                    <Save className="w-4 h-4 mr-2" /> {t('syncMasterConfig')}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* CMS & Article Hub */}
                <Card className="p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><BookOpen className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('cms_settings')}</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('editorialAuthorName')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.cmsConfig.authorName}
                                onChange={e => setConfig({ ...config, cmsConfig: { ...config.cmsConfig, authorName: e.target.value } })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-700">{t('autocrawlTrends')}</span>
                            <button
                                onClick={() => setConfig({ ...config, cmsConfig: { ...config.cmsConfig, autoCrawlEnabled: !config.cmsConfig.autoCrawlEnabled } })}
                                className={`w-10 h-5 rounded-full relative transition-colors ${config.cmsConfig.autoCrawlEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.cmsConfig.autoCrawlEnabled ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex gap-3">
                            <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-indigo-800 leading-normal uppercase">{t('theCmsUsesAidensAi')}</p>
                        </div>
                    </div>
                </Card>

                {/* Search & Analytics */}
                <Card className="p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><BarChart3 className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('marketingTracking')}</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('googleAnalyticsId')}</label>
                            <input className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" value={config.googleAnalyticsId} onChange={e => setConfig({ ...config, googleAnalyticsId: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('searchConsoleToken')}</label>
                            <input className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" value={config.googleSearchConsoleId} onChange={e => setConfig({ ...config, googleSearchConsoleId: e.target.value })} />
                        </div>
                    </div>
                </Card>

                {/* Monetization */}
                <Card className="p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600"><Globe className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('monetizationAdsense')}</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('adsensePublisherId')}</label>
                            <input className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-amber-500 outline-none" value={config.googleAdsenseId} onChange={e => setConfig({ ...config, googleAdsenseId: e.target.value })} />
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-amber-800 leading-normal uppercase">{t('adUnitsAreStrictlyLimited')}</p>
                        </div>
                    </div>
                </Card>

                {/* Database Tools */}
                <Card className="p-8 rounded-3xl space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><Database className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('databaseDemoTools')}</h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">{t('populateTheSystemWithFresh')}</p>
                        <Button
                            variant="secondary"
                            className="w-full border-rose-100 text-rose-600 hover:bg-rose-50 h-12 rounded-xl"
                            onClick={async () => {
                                if (confirm("This will overwrite existing demo records for u-teacher, u-principal, and u-admin. Continue?")) {
                                    const { seed2026Data } = await import('../../utils/seeder');
                                    await seed2026Data();
                                    alert("Demo data re-seeded successfully!");
                                }
                            }}
                        >
                            <Zap className="w-4 h-4 mr-2" /> {t('reseedDemoData')}</Button>
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-rose-800 leading-normal uppercase">{t('useWithCautionOnlyAffects')}</p>
                        </div>
                    </div>
                </Card>

                {/* SMTP / Email */}
                <Card className="p-8 rounded-3xl space-y-6 lg:col-span-3">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Server className="w-5 h-5" /></div>
                            <h3 className="font-black text-slate-800 uppercase tracking-tight">{t('mailInfrastructureEnterprise')}</h3>
                        </div>
                        <Button onClick={handleSendTest} variant="ghost" size="sm" className="text-emerald-600 hover:bg-emerald-50 rounded-xl font-black">
                            <Send className="w-4 h-4 mr-2" /> {t('sendTestMail')}</Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('mailServerHostIncomingoutgoing')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.host}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, host: e.target.value } })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('smtpPortSsl')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.port}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, port: parseInt(e.target.value) || 465 } })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('usernamePrimaryAdmin')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.user}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, user: e.target.value } })}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('pop3Port995')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.pop3Port}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, pop3Port: parseInt(e.target.value) || 995 } })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('imapPort993')}</label>
                            <input
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.imapPort}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, imapPort: parseInt(e.target.value) || 993 } })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('mailboxPassword')}</label>
                            <input
                                type="password"
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-3 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                                value={config.smtp.pass}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, pass: e.target.value } })}
                            />
                        </div>

                        <div className="md:col-span-4 border-t border-slate-100 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <RefreshCw className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('autoreplyConfiguration')}</span>
                                </div>
                                <button
                                    onClick={() => setConfig({ ...config, smtp: { ...config.smtp, autoReplyEnabled: !config.smtp.autoReplyEnabled } })}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.smtp.autoReplyEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.smtp.autoReplyEnabled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <textarea
                                className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-xl text-sm font-bold focus:border-blue-500 outline-none min-h-[100px]"
                                value={config.smtp.autoReplyTemplate}
                                onChange={e => setConfig({ ...config, smtp: { ...config.smtp, autoReplyTemplate: e.target.value } })}
                                placeholder="Enter auto-reply message template..."
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* RELEASE LOGS */}
            <div className="pt-8 border-t border-slate-200">
                <ReleaseLog logs={RELEASE_LOGS} />
            </div>
        </div>
    );
};
