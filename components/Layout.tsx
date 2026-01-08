import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import {
    LayoutDashboard, BookOpen, Calendar, Clock, FolderOpen,
    LogOut, Sparkles, Menu, Globe, Bell, ChevronDown,
    Building, User as UserIcon, CheckCircle, Users, ArrowRightLeft, Shield, Settings, CalendarRange, CheckSquare, X, PenTool, School, MapPin, ClipboardList, LibraryBig, Tag,
    Lock, ShieldCheck, Zap, Newspaper, Mail, DatabaseZap
} from 'lucide-react';
import { UserRole, Language, Notification, User } from '../types';
import { collection, query, where, getDocs, db, writeBatch, doc } from '../services/firebase';
import Button from './Button';
import { CoffeeModal } from './CoffeeModal';
import { DbModeIndicator } from './DbModeIndicator';
import { APP_VERSION } from '../src/config/version';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    t: (key: string) => string;
    onClose?: () => void;
}

const SidebarContent = ({ user, onLogout, t, onClose }: SidebarProps) => {
    const location = useLocation();
    const { viewMode, setViewMode } = useGlobal();

    const canSwitchMode = [UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.GPK, UserRole.GPK_1, UserRole.GPK_HEM, UserRole.GPK_KOKO, UserRole.SUPER_ADMIN].includes(user.role);

    const links = [
        { path: '/', label: t('dashboard'), modes: ['admin', 'teacher'], icon: LayoutDashboard },
        { path: '/plans', label: t('my_lesson_plans'), modes: ['teacher'], icon: BookOpen },
        { path: '/tasks', label: t('tasks'), modes: ['teacher'], icon: ClipboardList },
        { path: '/timetable', label: t('timetable'), modes: ['teacher'], icon: Calendar },
        { path: '/records', label: t('leave_management'), modes: ['teacher'], icon: Clock },
        { path: '/references', label: t('references'), modes: ['teacher'], icon: LibraryBig },
        { path: '/dskp', label: t('dskp_management'), modes: ['admin', 'teacher'], icon: DatabaseZap },
        { path: '/schools', label: t('school_list'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN], icon: School },
        { path: '/admin/articles', label: t('article_hub'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN], icon: Newspaper },
        { path: '/reviews', label: t('erph_approval'), modes: ['admin'], excludeRoles: [UserRole.SUPER_ADMIN], icon: CheckSquare },
        { path: '/records', label: t('leave_approvals'), modes: ['admin'], excludeRoles: [UserRole.SUPER_ADMIN], icon: CalendarRange },
        { path: '/users', label: t('manage_users'), modes: ['admin'], icon: Users },
        { path: '/security', label: t('security_center'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN], icon: ShieldCheck },
        { path: '/mailbox', label: t('admin_mailbox'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN], icon: Mail },
        { path: '/newsletter', label: t('broadcast'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN], icon: Zap },
        {
            path: '/settings',
            label: user.role === UserRole.SUPER_ADMIN ? t('system_settings') : t('school_settings'),
            modes: ['admin'],
            icon: Settings
        },
    ];

    const displayLinks = links.filter(l => {
        if (!l.modes.includes(viewMode)) return false;
        if (l.onlyRoles && !l.onlyRoles.includes(user.role)) return false;
        if (l.excludeRoles && l.excludeRoles.includes(user.role)) return false;
        if (l.path === '/settings' && user.role === UserRole.TEACHER) return false;
        return true;
    });

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case UserRole.SUPER_ADMIN: return t('role_super_admin');
            case UserRole.SCHOOL_ADMIN: return t('role_school_admin');
            case UserRole.PRINCIPAL: return t('role_principal');
            case UserRole.GPK_1: return t('role_gpk_1');
            case UserRole.GPK_HEM: return t('role_gpk_hem');
            case UserRole.GPK_KOKO: return t('role_gpk_koko');
            case UserRole.GPK: return t('role_gpk');
            default: return t('role_teacher');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f172a] text-slate-300 font-sans">
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight leading-none">eRPH Pro</h1>
                        <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{getRoleLabel(user.role)}</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* User Profile Summary */}
            <div className="px-5 py-6">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-white truncate">{user.name}</span>
                        <span className="text-[10px] text-slate-400 truncate">{user.email}</span>
                    </div>
                </div>
            </div>

            {/* Role Switcher */}
            {canSwitchMode && (
                <div className="px-5 mb-4">
                    <div className="bg-slate-900 rounded-xl p-1 flex border border-slate-800">
                        <button
                            onClick={() => setViewMode('admin')}
                            className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all truncate
                                ${viewMode === 'admin'
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                        >
                            {t('admin_mode')}
                        </button>
                        <button
                            onClick={() => setViewMode('teacher')}
                            className={`flex-1 py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all truncate
                                ${viewMode === 'teacher'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                        >
                            {t('teacher_mode')}
                        </button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {displayLinks.map((link, idx) => {
                    const isActive = location.pathname === (link.path === '/' ? '/portal' : `/portal${link.path}`);
                    const Icon = link.icon;
                    return (
                        <Link
                            key={`${link.path}-${idx}`}
                            to={`/portal${link.path === '/' ? '' : link.path}`}
                            onClick={onClose}
                            className={`
                                group flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200
                                ${isActive
                                    ? 'bg-blue-600/10 text-blue-400 font-bold shadow-sm border border-blue-600/20'
                                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 hover:border-slate-700/50 border border-transparent'}
                            `}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className="text-[13px] tracking-tight">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="mt-auto p-4 mx-4 mb-4 border-t border-slate-800 space-y-2">
                <DbModeIndicator />
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">{t('sign_out')}</span>
                </button>
                <div className="pt-2 text-center">
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">v{APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, setCurrentUser, schools } = useGlobal();
    const { t, language, setLanguage } = useLanguage();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


    if (!currentUser) return null;



    const currentSchool = schools.find(s => s.id === currentUser.schoolId);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900" dir={language === Language.JV ? 'rtl' : 'ltr'}>
            <div className="w-64 bg-[#0f172a] text-slate-300 h-screen flex-col flex-shrink-0 hidden md:flex sticky top-0">
                <SidebarContent user={currentUser} onLogout={() => setCurrentUser(null)} t={t} />
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[100] flex md:hidden">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
                    <div className="relative bg-[#0f172a] w-72 h-full shadow-2xl animate-in slide-in-from-left duration-300 ease-out">
                        <SidebarContent user={currentUser} onLogout={() => setCurrentUser(null)} t={t} onClose={() => setIsMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 md:px-8 justify-between shrink-0 z-30 sticky top-0">
                    <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-sm md:text-base font-black text-slate-800 tracking-tight">
                                {new Date().getHours() < 12 ? t('good_morning') : new Date().getHours() < 18 ? t('good_afternoon') : t('good_evening')}, {currentUser.name.split(' ')[0]}
                            </h2>
                            {currentSchool && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Building className="w-3 h-3" /> {currentSchool.name}
                                </div>
                            )}
                        </div>
                        <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-blue-50/50 border border-blue-100/50 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('secure_session')}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 md:gap-4 shrink-0">
                        {/* Language Selector */}
                        <div className="relative group">
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
                                        { code: Language.ZH, label: '中文 (简体)' },
                                        { code: Language.TA, label: 'தமிழ்' }
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

                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white">{unreadCount}</span>}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                        <h3 className="font-bold text-slate-800">{t('notifications')}</h3>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{notifications.length} {t('new')}</span>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">{t('no_unread_notifications')}</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {notifications.map((n) => (
                                                    <div key={n.id} className={`p-4 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                                                        <div className="flex gap-3">
                                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-slate-300'}`} />
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-800 leading-snug">{n.title || 'Notification'}</p>
                                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">{new Date(n.timestamp).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                                        <button className="w-full py-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">
                                            {t('mark_all_read')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link to="/portal/security" className="p-2 rounded-xl hover:bg-slate-100 text-slate-600" title="Security Settings">
                            <Shield className="w-6 h-6" />
                        </Link>
                        <Link to="/portal/profile" className="flex items-center gap-3 group ml-1">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm group-hover:ring-4 ring-blue-50 transition-all">
                                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                            </div>
                        </Link>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
                    {children}

                    {/* Support Button (Floating) - Exclude Super Admin */}
                    {currentUser.role !== UserRole.SUPER_ADMIN && (
                        <a
                            href="mailto:support@erphpro.com?subject=Support Request"
                            className="fixed bottom-8 right-8 z-50 p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 group border-4 border-white"
                            title={t('contact_support')}
                        >
                            <Mail className="w-6 h-6" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap px-0 group-hover:px-2">{t('contact_support')}</span>
                        </a>
                    )}
                </main>
            </div>
        </div>
    );
};
