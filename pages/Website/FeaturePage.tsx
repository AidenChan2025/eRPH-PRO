
import React from 'react';
import {
    Cpu, ShieldCheck, BarChart3, Users,
    ArrowRight, BookOpen, Layout, Clock, Sparkles
} from 'lucide-react';
import Button from '../../components/Button';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { Link } from 'react-router-dom';

import { useLanguage } from '../../context/LanguageContext';

const FeaturePage = () => {
    const { t } = useLanguage();
    const mainFeatures = [
        {
            icon: BookOpen,
            title: t('feat_1_title'),
            description: t('feat_1_desc'),
            color: "bg-blue-50 text-blue-600"
        },
        {
            icon: ShieldCheck,
            title: t('feat_2_title'),
            description: t('feat_2_desc'),
            color: "bg-emerald-50 text-emerald-600"
        },
        {
            icon: BarChart3,
            title: t('feat_3_title'),
            description: t('feat_3_desc'),
            color: "bg-amber-50 text-amber-600"
        },
        {
            icon: Clock,
            title: t('feat_4_title'),
            description: t('feat_4_desc'),
            color: "bg-indigo-50 text-indigo-600"
        },
        {
            icon: Users,
            title: t('feat_5_title'),
            description: t('feat_5_desc'),
            color: "bg-rose-50 text-rose-600"
        },
        {
            icon: Layout,
            title: t('feat_6_title'),
            description: t('feat_6_desc'),
            color: "bg-slate-50 text-slate-600"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            <header className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">{t('feat_hero_title')} <span className="text-blue-600">{t('feat_hero_highlight')}</span></h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        {t('feat_hero_desc')}
                    </p>
                </div>
            </header>

            <section className="px-6 pb-32">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mainFeatures.map((f, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                            <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                                <f.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Update Logs moved to Knowledge Base */}

                <div className="mt-20 max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Cpu className="w-48 h-48 text-blue-400" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl md:text-5xl font-black text-white">{t('feat_cta_title')}</h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            {t('feat_cta_desc')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link to="/portal/login">
                                <Button size="lg" className="rounded-2xl px-10 h-16 text-lg">{t('feat_cta_start')}</Button>
                            </Link>
                            <Link to="/knowledge">
                                <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 rounded-2xl px-10 h-16 text-lg">{t('feat_cta_sales')}</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default FeaturePage;
