
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe, ChevronDown, Coffee } from 'lucide-react';
import Button from './Button';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';

const PublicNavbar = () => {
    const { language, setLanguage, t } = useLanguage();
    const [showLangMenu, setShowLangMenu] = React.useState(false);
    const location = useLocation();

    const navLinks = [
        { path: '/', label: t('nav_home') },
        { path: '/features', label: t('nav_features') },
        { path: '/blog', label: t('nav_blog') },
        { path: '/knowledge', label: t('nav_kb') },
    ];

    return (
        <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl border-b border-white/20 z-[60] transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">eRPH <span className="text-blue-600">Pro</span></span>
                </Link>

                <div className="hidden md:flex items-center gap-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-[15px] font-bold tracking-tight transition-all relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full ${location.pathname.endsWith(link.path)
                                ? 'text-blue-600 after:w-full'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    <Link to="/support">
                        <button className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-colors font-bold text-sm tracking-tight border border-amber-100">
                            <Coffee className="w-4 h-4" />
                            <span>Support Me</span>
                        </button>
                    </Link>

                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-slate-600"
                        >
                            <Globe className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">{language}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showLangMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {[
                                    { code: Language.EN, label: 'English' },
                                    { code: Language.MS, label: 'Bahasa Melayu' },
                                    { code: Language.ZH, label: '中文 (简体)' }
                                ].map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            setLanguage(lang.code);
                                            setShowLangMenu(false);
                                        }}
                                        className={`w-full px-5 py-3.5 text-left text-sm font-bold transition-colors hover:bg-blue-50 ${language === lang.code ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}
                                    >
                                        {lang.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/portal/login">
                        <Button size="md" className="rounded-2xl px-6 font-black tracking-tight">
                            {t('nav_login')} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default PublicNavbar;
