import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import {
    LayoutDashboard, BookOpen, Calendar, Clock, FolderOpen,
    LogOut, Sparkles, Menu, Globe, Bell, ChevronDown,
    Building, User as UserIcon, CheckCircle, Users, ArrowRightLeft, Shield, Settings, CalendarRange, CheckSquare, X, PenTool, School, MapPin, ClipboardList, LibraryBig, Tag,
    Lock, ShieldCheck, Zap, Newspaper, Mail
} from 'lucide-react';
import { UserRole, Language, Notification, User } from '../types';
import { collection, query, where, getDocs, db, writeBatch, doc } from '../services/firebase';
import Button from './Button';
import { CoffeeModal } from './CoffeeModal';
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
        { path: '/', label: t('dashboard'), modes: ['admin', 'teacher'] },
        { path: '/plans', label: t('my_lesson_plans'), modes: ['teacher'] },
        { path: '/tasks', label: t('tasks'), modes: ['teacher'] },
        { path: '/timetable', label: t('timetable'), modes: ['teacher'] },
        { path: '/records', label: t('leave_management'), modes: ['teacher'] },
        { path: '/references', label: t('references'), modes: ['teacher'] },
        // DSKP is now accessible to all in both modes (Permissions handled inside component)
        { path: '/dskp', label: t('dskp_management'), modes: ['admin', 'teacher'] },
        { path: '/schools', label: t('school_list'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN] },
        { path: '/admin/articles', label: t('article_hub'), modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN] },
        { path: '/reviews', label: t('erph_approval'), modes: ['admin'], excludeRoles: [UserRole.SUPER_ADMIN] },
        { path: '/records', label: t('leave_approvals'), modes: ['admin'], excludeRoles: [UserRole.SUPER_ADMIN] },
        { path: '/users', label: t('manage_users'), modes: ['admin'] },
        { path: '/security', label: 'Security Center', modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN] },
        { path: '/mailbox', label: 'Admin Mailbox', modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN] },
        { path: '/newsletter', label: 'Broadcast', modes: ['admin'], onlyRoles: [UserRole.SUPER_ADMIN] },
        {
            path: '/settings',
            label: user.role === UserRole.SUPER_ADMIN ? 'System Settings' : t('school') + ' Settings',
            modes: ['admin']
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
            case UserRole.SUPER_ADMIN: return 'Super Admin';
            case UserRole.SCHOOL_ADMIN: return 'School Admin';
            case UserRole.PRINCIPAL: return 'Principal';
            case UserRole.GPK_1: return 'GPK 1';
            case UserRole.GPK_HEM: return 'GPK HEM';
            case UserRole.GPK_KOKO: return 'GPK KOKO';
            case UserRole.GPK: return 'GPK';
            default: return 'Teacher';
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0f172a]">
            <div className="p-6 flex justify-between items-center border-b border-slate-800/50">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">eRPH Pro</h1>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg border border-white/10">
                        {user.name.charAt(0)}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-white truncate">{user.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5 text-blue-400" />
                                <span className="text-[10px] font-black uppercase text-slate-300 tracking-tighter">
                                    {getRoleLabel(user.role)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {canSwitchMode && (
                <div className="px-6 mb-6">
                    <div className="bg-slate-900/50 p-1.5 rounded-2xl flex gap-1.5 border border-slate-800/50">
                        <button
                            onClick={() => setViewMode('admin')}
                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                        >
                            {getRoleLabel(user.role)}
                        </button>
                        <button
                            onClick={() => setViewMode('teacher')}
                            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${viewMode === 'teacher' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
                        >
                            Teacher
                        </button>
                    </div>
                </div>
            )}

            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {displayLinks.map((link, idx) => {
                    const isActive = location.pathname === (link.path === '/' ? '/portal' : `/portal${link.path}`);
                    return (
                        <Link
                            key={`${link.path}-${idx}`}
                            to={`/portal${link.path === '/' ? '' : link.path}`}
                            onClick={onClose}
                            className={`flex items-center px-6 py-4 md:py-3.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-600/10 text-blue-500' : 'text-slate-400 hover:text-white'}`}
                        >
                            <span className={`text-sm md:text-[13px] font-black uppercase tracking-widest ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'} transition-transform duration-300`}>
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800/50">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors w-full px-4 py-4 md:py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400"
                >
                    <LogOut className="w-5 h-5" />
                    <span className="font-bold text-sm">{t('sign_out')}</span>
                </button>
                <div className="mt-4 pt-4 border-t border-slate-800/50 text-center space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Powered by Aiden Chan</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">System v{APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser, setCurrentUser, schools, isLocked, unlock } = useGlobal();
    const { t, language, setLanguage } = useLanguage();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [lockInput, setLockInput] = useState('');
    const [lockError, setLockError] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const fetchNotifications = async () => {
            const q = query(collection(db, 'notifications'), where('recipientId', '==', currentUser.id));
            const snap = await getDocs(q);
            setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Notification)).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (unlock(lockInput)) {
            setLockInput('');
            setLockError(false);
        } else {
            setLockError(true);
            setLockInput('');
        }
    };

    if (!currentUser) return null;

    if (isLocked) {
        return (
            <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="max-w-md w-full space-y-8">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                            <Lock className="w-10 h-10 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Portal Locked</h2>
                        <p className="text-slate-400 mt-2 text-sm">Session locked due to inactivity. Please enter your credential PIN or password to continue.</p>
                    </div>
                    <form onSubmit={handleUnlock} className="space-y-4">
                        <input
                            type="password"
                            className={`w-full bg-white/5 border-2 ${lockError ? 'border-red-500' : 'border-white/10'} rounded-2xl p-4 text-center text-2xl font-mono focus:border-blue-500 outline-none transition-all`}
                            placeholder="••••••"
                            value={lockInput}
                            onChange={e => setLockInput(e.target.value)}
                            autoFocus
                        />
                        {lockError && <p className="text-red-500 text-xs font-bold uppercase tracking-widest">Invalid Credentials</p>}
                        <Button className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20" type="submit">Unlock Workspace</Button>
                    </form>
                    <button onClick={() => setCurrentUser(null)} className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2 mx-auto pt-4">
                        <LogOut className="w-4 h-4" /> Switch Account
                    </button>
                </div>
            </div>
        );
    }

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
                                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {currentUser.name.split(' ')[0]}
                            </h2>
                            {currentSchool && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <Building className="w-3 h-3" /> {currentSchool.name}
                                </div>
                            )}
                        </div>
                        <div className="hidden xl:flex items-center gap-2 px-4 py-1.5 bg-blue-50/50 border border-blue-100/50 rounded-full text-blue-700 text-[10px] font-black uppercase tracking-widest shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5" /> Secure Session
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
                                        <h3 className="font-bold text-slate-800">Notifications</h3>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{notifications.length} New</span>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-xs font-bold uppercase tracking-widest">No Notifications</p>
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
                                            Mark All as Read
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
                            title="Contact Support"
                        >
                            <Mail className="w-6 h-6" />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-bold whitespace-nowrap px-0 group-hover:px-2">Contact Support</span>
                        </a>
                    )}
                </main>
            </div>
        </div>
    );
};
