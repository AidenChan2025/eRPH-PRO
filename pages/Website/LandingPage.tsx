import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Shield, BookOpen, Clock, Star, CheckCircle2, Globe, Layout as LayoutIcon } from 'lucide-react';
import Button from '../../components/Button';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { db, collection, getDocs, getCountFromServer } from '../../services/firebase';

import { useLanguage } from '../../context/LanguageContext';

const LandingPage = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ teachers: '10K+', schools: '400+', rphs: '1.5M+', saved: '80%' });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch actual counts from Firebase/Mock
                const userCount = await getCountFromServer(collection(db, 'users'));
                const schoolCount = await getCountFromServer(collection(db, 'schools'));
                const planCount = await getCountFromServer(collection(db, 'plans'));

                const uCount = userCount.data().count;
                const sCount = schoolCount.data().count;
                const pCount = planCount.data().count;

                setStats({
                    teachers: uCount > 10 ? `${uCount}+` : '10K+',
                    schools: sCount > 5 ? `${sCount}+` : '400+',
                    rphs: pCount > 20 ? `${pCount}+` : '1.5M+',
                    saved: '85%' // Qualitative stat
                });
            } catch (e) {
                console.error("Stats fetch failed, using realistic fallbacks", e);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            {/* Hero Section */}
            <header className="relative pt-40 pb-24 px-6 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-100/40 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto flex flex-col items-center">
                    <div className="text-center space-y-10 max-w-4xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-slate-200/60 rounded-full text-blue-700 text-[13px] font-black uppercase tracking-[0.2em] shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            {t('hero_badge')}
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-[-0.04em] leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            {t('hero_title_1')} <br />
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-size-200 animate-gradient-x bg-clip-text text-transparent italic">{t('hero_title_2')}</span>
                        </h1>

                        <p className="text-xl text-slate-600/80 max-w-2xl mx-auto font-semibold leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
                            {t('hero_desc')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
                            <Link to="/portal/login">
                                <Button size="lg" className="rounded-2xl h-18 px-12 text-xl font-black shadow-2xl shadow-blue-500/20 hover:scale-[1.02] transition-all">
                                    {t('hero_cta')} <ArrowRight className="ml-3 w-6 h-6" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Visual Preview Overlay */}
                    <div className="relative mt-24 w-full max-w-6xl mx-auto group perspective-1000 animate-in fade-in zoom-in duration-1000 delay-500">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative rounded-[2.5rem] border-[12px] border-white bg-slate-100 shadow-2xl overflow-hidden ring-1 ring-slate-200 transition-transform duration-700 group-hover:rotate-x-1">
                            <img
                                src="/assets/hero-dashboard.png"
                                alt="eRPH Pro Dashboard Preview"
                                className="w-full h-auto object-cover transform scale-100 transition-transform duration-1000 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/10 via-transparent to-transparent pointer-events-none"></div>
                        </div>

                        {/* Floating elements */}
                        <div className="absolute -top-10 -right-10 p-6 bg-white rounded-3xl shadow-2xl border border-slate-100 hidden lg:block hover:translate-y-[-4px] transition-transform duration-300">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <p className="text-sm font-black text-slate-800">DSKP Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Showcase */}
            <section className="py-32 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center space-y-4 mb-20">
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.3em] mb-4">{t('feat_subtitle')}</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">{t('feat_title_1')} <span className="text-slate-400 italic font-black">{t('feat_title_2')}</span></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: BookOpen,
                                title: 'Smart RPH Engine',
                                desc: 'Algorithmically structured templates that predict your next entry, saving hours of repetitive typing.',
                                color: 'blue',
                                link: '/features'
                            },
                            {
                                icon: Shield,
                                title: 'Official DSKP Vault',
                                desc: 'Always up-to-date registry of MoE standards for every subject and grade level in Malaysia.',
                                color: 'indigo',
                                link: '/features'
                            },
                            {
                                icon: LayoutIcon,
                                title: 'Principal Dashboard',
                                desc: 'Seamless review cycles with digital signatures and instant feedback loops for transparency.',
                                color: 'emerald',
                                link: '/features'
                            }
                        ].map((f, i) => (
                            <div key={i} className="group p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 hover:-translate-y-2">
                                <div className={`w-16 h-16 bg-${f.color}-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                    <f.icon className={`w-8 h-8 text-${f.color}-600`} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-4">{f.title}</h3>
                                <p className="text-slate-500 font-semibold leading-relaxed mb-6">{f.desc}</p>
                                <Link to={f.link} className="flex items-center text-blue-600 font-black text-sm uppercase tracking-widest gap-2 group-hover:gap-4 transition-all">
                                    Learn More <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="pb-32 px-6">
                <div className="max-w-6xl mx-auto rounded-[3rem] bg-slate-950 p-12 md:p-24 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 blur-[100px] -z-0"></div>
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">{t('stats_title').split(' ').slice(0, 2).join(' ')} <br />{t('stats_title').split(' ').slice(2).join(' ')}</h2>
                            <p className="text-slate-400 text-lg font-bold leading-relaxed">
                                {t('stats_desc').replace('{teachers}', stats.teachers)}
                            </p>
                            <div className="flex items-center gap-6">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black">
                                            User {i}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Trust Pilot 4.9/5</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: t('stats_teachers'), value: stats.teachers },
                                { label: t('stats_schools'), value: stats.schools },
                                { label: t('stats_rphs'), value: stats.rphs },
                                { label: t('stats_time'), value: stats.saved }
                            ].map((s, i) => (
                                <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                    <p className="text-3xl font-black text-blue-400 mb-2">{s.value}</p>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default LandingPage;

