import React, { useMemo, useEffect, useState, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APP_VERSION } from '../src/config/version';
import { useGlobal } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { LessonStatus, UserRole, User, DashboardConfig, LessonPlan, TimetableTemplate, Task, TaskStatus } from '../types';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { collection, query, where, getDocs, db, getCountFromServer, doc, updateDoc, orderBy, limit } from '../services/firebase';
import {
    Building, Users, BookOpen, CheckCircle, Clock, TrendingUp,
    Settings, Layout, Edit, User as UserIcon, Award, Briefcase,
    Calendar, FileText, CheckSquare, X, PieChart as PieChartIcon,
    Quote, LayoutDashboard, Palette, Zap, ArrowRight, Save, Eye, EyeOff, Sparkles,
    ChevronRight, Plus, Database, Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- MOCK ANALYTICS DATA ---
const ANALYTICS_DATA = [
    { name: '00:00', users: 12, hits: 45 },
    { name: '04:00', users: 5, hits: 20 },
    { name: '08:00', users: 154, hits: 450 },
    { name: '12:00', users: 342, hits: 1200 },
    { name: '16:00', users: 289, hits: 980 },
    { name: '20:00', users: 89, hits: 340 },
    { name: '23:59', users: 45, hits: 150 },
];

// --- THEME MAP ---
const THEMES = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-100', ring: 'ring-blue-500/20', light: 'bg-blue-50' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-100', ring: 'ring-purple-500/20', light: 'bg-purple-50' },
    emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100', ring: 'ring-emerald-500/20', light: 'bg-emerald-50' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-100', ring: 'ring-orange-500/20', light: 'bg-orange-50' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-100', ring: 'ring-rose-500/20', light: 'bg-rose-50' },
    slate: { bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-200', ring: 'ring-slate-500/20', light: 'bg-slate-100' },
};


const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className={`bg-white rounded-xl p-6 border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-all`}>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
        </div>
    </div>
);

const CustomizationDrawer = ({ isOpen, onClose, config, onSave }: { isOpen: boolean, onClose: () => void, config: DashboardConfig, onSave: (newConfig: DashboardConfig) => void }) => {
        const { t } = useLanguage();
    const [localConfig, setLocalConfig] = useState<DashboardConfig>(config);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => { setLocalConfig(config); }, [config]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(localConfig);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-600" /> {t('personalize')}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dashboard_widgets')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-slate-200"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('color_essence')}</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map(color => (
                                <button
                                    key={color}
                                    onClick={() => setLocalConfig({ ...localConfig, themeColor: color })}
                                    className={`h-12 rounded-xl border-4 transition-all ${localConfig.themeColor === color ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent shadow-sm'}`}
                                >
                                    <div className={`${THEMES[color].bg} w-full h-full rounded-md`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('active_widgets')}</label>
                        <div className="space-y-2">
                            {[
                                { id: 'showStats', label: t('rph_stats_widget'), icon: PieChartIcon },
                                { id: 'showRecentPlans', label: t('recent_plans_widget'), icon: BookOpen },
                                { id: 'showTodaySchedule', label: t('daily_schedule_widget'), icon: Clock },
                                { id: 'showTasks', label: t('task_mgmt_widget'), icon: CheckSquare },
                                { id: 'showQuickLinks', label: t('quick_links_widget'), icon: Zap },
                            ].map(widget => (
                                <button
                                    key={widget.id}
                                    onClick={() => setLocalConfig({ ...localConfig, [widget.id]: !(localConfig as any)[widget.id] })}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${(localConfig as any)[widget.id] ? 'border-blue-100 bg-blue-50/50' : 'border-slate-50 bg-white opacity-60'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${(localConfig as any)[widget.id] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <widget.icon className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{widget.label}</span>
                                    </div>
                                    {(localConfig as any)[widget.id] ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t('greeting_style')}</label>
                        <div className="flex gap-2">
                            {['minimal', 'formal', 'casual'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setLocalConfig({ ...localConfig, greetingType: type as any })}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg border-2 transition-all ${localConfig.greetingType === type ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t bg-slate-50">
                    <Button
                        className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-blue-200"
                        onClick={handleSave}
                        isLoading={isSaving}
                    >
                        <Save className="mr-2 w-5 h-5" /> {t('save_workspace')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const SuperAdminDashboard = ({ stats }: { stats: any }) => {
        const { t } = useLanguage();
    const navigate = useNavigate();

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
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">{t('system_overview')}</h1>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{t('role_super_admin')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title={t('total_schools')} value={stats.totalSchools} icon={Building} color="bg-blue-600" />
                <StatCard title={t('active_users')} value={stats.totalUsers} icon={Users} color="bg-purple-600" />
                <StatCard title={t('total_plans')} value={stats.totalPlans} icon={FileText} color="bg-emerald-600" />
                <StatCard title="Storage Eng." value="Google Firestore" icon={Database} color="bg-orange-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" /> {t('systemTrafficAnalytics')}</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t('realtimeSessionDataGoogleAnalytics')}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('activeUsers')}</div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {t('pageHits')}</div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <Area type="monotone" dataKey="hits" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorHits)" />
                                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" /> {t('action')}
                    </h3>
                    <div className="space-y-4">
                        <Button className="w-full justify-start rounded-xl h-12" variant="secondary" onClick={() => navigate('/portal/schools')}>
                            <Building className="w-4 h-4 mr-2 text-blue-600" /> {t('manage_schools')}
                        </Button>
                        <Button className="w-full justify-start rounded-xl h-12" variant="secondary" onClick={() => navigate('/portal/users')}>
                            <Users className="w-4 h-4 mr-2 text-indigo-600" /> {t('manage_users')}
                        </Button>
                        <Button className="w-full justify-start rounded-xl h-12" variant="secondary" onClick={() => navigate('/portal/admin/articles')}>
                            <BookOpen className="w-4 h-4 mr-2 text-emerald-600" /> {t('manage_articles')}
                        </Button>
                        <Button className="w-full justify-start rounded-xl h-12" variant="secondary" onClick={() => navigate('/portal/settings')}>
                            <Settings className="w-4 h-4 mr-2 text-slate-600" /> {t('settings_title')}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const SchoolAdminDashboard = () => {
        const { t } = useLanguage();
    const { currentUser, schools } = useGlobal();
    const navigate = useNavigate();
    const [schoolStats, setSchoolStats] = useState({ teachers: 0, plans: 0, approved: 0, pending: 0, rejected: 0 });
    const [statusData, setStatusData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchoolData = async () => {
            if (!currentUser?.schoolId) return;
            setLoading(true);
            try {
                const teachersSnap = await getCountFromServer(query(collection(db, 'users'), where('schoolId', '==', currentUser.schoolId), where('role', '==', UserRole.TEACHER)));
                const plansQ = query(collection(db, 'lessonPlans'), where('schoolId', '==', currentUser.schoolId));
                const plansSnap = await getDocs(plansQ);
                let approved = 0, pending = 0, rejected = 0;
                plansSnap.docs.forEach((d: any) => {
                    const s = d.data().status;
                    if (s === LessonStatus.APPROVED) approved++;
                    else if (s === LessonStatus.SUBMITTED) pending++;
                    else if (s === LessonStatus.REJECTED) rejected++;
                });
                setSchoolStats({ teachers: teachersSnap.data().count, plans: plansSnap.docs.length, approved, pending, rejected });
                setStatusData([
                    { name: t('approved'), value: approved, color: '#22c55e' },
                    { name: t('pending_review'), value: pending, color: '#3b82f6' },
                    { name: t('reject'), value: rejected, color: '#ef4444' }
                ].filter(d => d.value > 0));
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        fetchSchoolData();
    }, [currentUser, t]);

    const schoolName = schools.find(s => s.id === currentUser?.schoolId)?.name || t('school');

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">{t('loading_plans')}</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Building className="w-6 h-6 text-blue-600" /> {schoolName}</h1>
                    <p className="text-slate-500 text-sm">{t('admin_view')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('total_teachers')} value={schoolStats.teachers} icon={Users} color="bg-indigo-500" />
                <StatCard title={t('total_plans')} value={schoolStats.plans} icon={FileText} color="bg-blue-500" />
                <StatCard title={t('pending_review')} value={schoolStats.pending} icon={Clock} color="bg-amber-500" />
                <StatCard title={t('approved')} value={schoolStats.approved} icon={CheckCircle} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 flex flex-col" style={{ minHeight: '400px' }}>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-slate-400" /> {t('approved_plans_trend')}</h3>
                    <div className="flex-1 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('action')}</h3>
                    <div className="space-y-3">
                        <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/portal/users')}><Users className="w-4 h-4 mr-2" /> {t('manage_users')}</Button>
                        <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/portal/reviews')}><CheckCircle className="w-4 h-4 mr-2" /> {t('erph_approval')}</Button>
                        <Button className="w-full justify-start" variant="secondary" onClick={() => navigate('/portal/calendar')}><Calendar className="w-4 h-4 mr-2" /> {t('calendar')}</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const PersonalDashboard = () => {
        const { currentUser, setCurrentUser } = useGlobal();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [config, setConfig] = useState<DashboardConfig>(currentUser?.dashboardConfig || {
        showQuote: true,
        showQuickLinks: true,
        showTasks: true,
        showCalendar: false,
        showStats: true,
        showRecentPlans: true,
        showTodaySchedule: true,
        themeColor: 'blue',
        greetingType: 'formal'
    });

    const [isConfiguring, setIsConfiguring] = useState(false);
    const [myStats, setMyStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [recentPlans, setRecentPlans] = useState<LessonPlan[]>([]);
    const [todayClasses, setTodayClasses] = useState<any[]>([]);
    const [myTasks, setMyTasks] = useState<Task[]>([]);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!currentUser) return;
            const statsQ = query(collection(db, 'lessonPlans'), where('teacherId', '==', currentUser.id));
            const statsSnap = await getDocs(statsQ);
            let p = 0, a = 0;
            statsSnap.docs.forEach((d: any) => {
                const s = d.data().status;
                if (s === LessonStatus.SUBMITTED) p++;
                if (s === LessonStatus.APPROVED) a++;
            });
            setMyStats({ total: statsSnap.docs.length, pending: p, approved: a });

            const recentQ = query(collection(db, 'lessonPlans'), where('teacherId', '==', currentUser.id), orderBy('updatedAt', 'desc'), limit(3));
            const recentSnap = await getDocs(recentQ);
            setRecentPlans(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as LessonPlan)));

            const ttQ = query(collection(db, 'timetableTemplates'), where('teacherId', '==', currentUser.id), where('isActive', '==', true));
            const ttSnap = await getDocs(ttQ);
            if (!ttSnap.empty) {
                const activeTt = ttSnap.docs[0].data() as TimetableTemplate;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const today = days[new Date().getDay()];
                setTodayClasses(activeTt.slots.filter(s => s.day === today).sort((a, b) => a.startTime.localeCompare(b.startTime)));
            }

            const taskQ = query(collection(db, 'tasks'), where('assigneeId', '==', currentUser.id), where('status', '!=', TaskStatus.COMPLETED), limit(3));
            const taskSnap = await getDocs(taskQ);
            setMyTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        };
        fetchTeacherData();
    }, [currentUser]);

    const handleUpdateConfig = async (newConfig: DashboardConfig) => {
        if (!currentUser) return;
        setConfig(newConfig);
        try {
            await updateDoc(doc(db, 'users', currentUser.id), { dashboardConfig: newConfig });
            setCurrentUser({ ...currentUser, dashboardConfig: newConfig });
        } catch (e) {
            console.error("Config save failed", e);
        }
    };

    const currentTheme = THEMES[config.themeColor || 'blue'];

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
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            <div className={`rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-white group`}>
                <div className={`absolute top-0 left-0 w-full h-2.5 ${currentTheme.bg}`}></div>
                <div className={`absolute -right-12 -top-12 w-48 h-48 rounded-full ${currentTheme.light} opacity-50 blur-3xl group-hover:scale-110 transition-transform duration-700`}></div>

                <div className="relative z-10">
                    <div className={`w-28 h-28 rounded-3xl ${currentTheme.bg} text-white flex items-center justify-center font-black text-5xl shadow-2xl shadow-${config.themeColor}-200 ring-8 ring-white rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
                        {currentUser?.name.charAt(0)}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full ${currentTheme.light} ${currentTheme.text} text-[10px] font-black uppercase tracking-widest border ${currentTheme.border}`}>
                            {t('welcome_back')}
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{currentUser?.grade || '-'}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {config.greetingType === 'formal' ? `${t('greeting_formal')}, ${currentUser?.name.split(' ')[0]}` :
                            config.greetingType === 'casual' ? `${t('greeting_casual')} ${currentUser?.name.split(' ')[0]}!` :
                                currentUser?.name}
                    </h1>
                    <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mt-2">
                        <Building className={`w-4 h-4 ${currentTheme.text}`} /> {getRoleLabel(currentUser?.role || UserRole.TEACHER)} {t('malaysianEducator')}</p>
                </div>

                <div className="flex gap-3 z-10">
                    <button
                        onClick={() => setIsConfiguring(true)}
                        className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all group/btn`}
                        title="Customize Workspace"
                    >
                        <Palette className={`w-6 h-6 text-slate-400 group-hover/btn:${currentTheme.text} transition-colors`} />
                    </button>
                    <Button className={`rounded-2xl h-14 px-8 shadow-lg shadow-${config.themeColor}-200/50 ${currentTheme.bg} border-none`} onClick={() => navigate('/portal/profile')}>
                        <Edit className="w-5 h-5 mr-2" /> {t('profile')}
                    </Button>
                </div>
            </div>

            {config.showStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="p-6 border-slate-100 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('my_total_plans')}</p>
                                <h3 className="text-4xl font-black text-slate-900">{myStats.total}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
                        </div>
                    </Card>
                    <Card className="p-6 border-slate-100 hover:border-amber-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('pending_review')}</p>
                                <h3 className="text-4xl font-black text-amber-500">{myStats.pending}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock className="w-6 h-6" /></div>
                        </div>
                    </Card>
                    <Card className="p-6 border-slate-100 hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('approved')}</p>
                                <h3 className="text-4xl font-black text-emerald-600">{myStats.approved}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-6 h-6" /></div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {config.showRecentPlans && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                    <TrendingUp className={`w-5 h-5 ${currentTheme.text}`} /> {t('recent_activity')}
                                </h3>
                                <Link to="/portal/plans" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">{t('view_all')} <ArrowRight className="w-3 h-3" /></Link>
                            </div>
                            <div className="grid gap-3">
                                {recentPlans.length === 0 ? (
                                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400 italic text-sm">{t('no_plans_found')}</div>
                                ) : recentPlans.map(plan => (
                                    <Link key={plan.id} to={`/portal/plans/${plan.id}`} className="group block bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${currentTheme.light} ${currentTheme.text} border ${currentTheme.border}`}>
                                                        {plan.subject}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plan.date}</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{plan.topic}</h4>
                                                <p className="text-xs text-slate-400 font-medium">{plan.className} • {plan.time}</p>
                                            </div>
                                            <div className={`p-2 rounded-xl bg-slate-50 group-hover:${currentTheme.light} group-hover:${currentTheme.text} transition-colors`}>
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {config.showTasks && (
                        <Card className="p-6 rounded-3xl border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                    <CheckSquare className="w-5 h-5 text-indigo-500" /> {t('action_required')}
                                </h3>
                                <Button variant="ghost" size="sm" className="font-bold text-blue-600" onClick={() => navigate('/portal/tasks')}>{t('manage_tasks')}</Button>
                            </div>
                            <div className="space-y-3">
                                {myTasks.length === 0 ? (
                                    <div className="p-10 border-2 border-dashed border-slate-50 rounded-2xl text-sm text-slate-400 italic text-center">{t('workspace_clear')}</div>
                                ) : myTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 group hover:bg-white hover:shadow-sm hover:border-blue-100 transition-all">
                                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-600 transition-colors">
                                            <Briefcase className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('due')}: {task.dueDate}</p>
                                        </div>
                                        <button onClick={() => navigate('/portal/tasks')} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-600"><ArrowRight className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-8">
                    {config.showTodaySchedule && (
                        <Card className={`p-6 rounded-3xl border-none shadow-xl ${currentTheme.bg} relative overflow-hidden text-white`}>
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Clock className="w-24 h-24 rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black uppercase tracking-widest text-[10px] mb-4 flex items-center gap-2 opacity-80">
                                    <Calendar className="w-3.5 h-3.5" /> {t('today_class_queue')}
                                </h3>
                                <div className="space-y-4">
                                    {todayClasses.length === 0 ? (
                                        <p className="text-sm font-medium italic opacity-70">{t('no_classes_today')}</p>
                                    ) : todayClasses.map((slot, idx) => (
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="w-16 text-[10px] font-black uppercase text-right opacity-60 leading-tight">
                                                {slot.startTime}
                                            </div>
                                            <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                                <p className="text-sm font-black truncate">{slot.subject}</p>
                                                <p className="text-[10px] font-bold opacity-60 uppercase">{slot.class}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    className="w-full mt-6 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest h-12"
                                    onClick={() => navigate('/portal/timetable')}
                                >
                                    {t('full_schedule')}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {config.showQuickLinks && (
                        <div className="space-y-4">
                            <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 px-1">
                                <Zap className="w-5 h-5 text-amber-500" /> {t('core_shortcuts')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: t('new_rph'), path: '/portal/plans/new', icon: Plus, color: 'bg-blue-600', shadow: 'shadow-blue-100' },
                                    { label: t('records'), path: '/portal/records', icon: ClipboardList, color: 'bg-indigo-600', shadow: 'shadow-indigo-100' },
                                    { label: t('dskp'), path: '/portal/dskp', icon: BookOpen, color: 'bg-emerald-600', shadow: 'shadow-emerald-100' },
                                    { label: t('calendar'), path: '/portal/calendar', icon: Calendar, color: 'bg-rose-600', shadow: 'shadow-rose-100' },
                                ].map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => navigate(link.path)}
                                        className="flex flex-col items-center gap-3 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl ${link.color} text-white flex items-center justify-center shadow-lg ${link.shadow} group-hover:scale-110 transition-transform`}>
                                            <link.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">{link.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {config.showQuote && (
                        <div className="p-8 bg-slate-900 rounded-3xl relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-3"><Sparkles className="w-5 h-5 text-amber-400 opacity-40" /></div>
                            <Quote className="w-8 h-8 text-blue-500 mb-4 opacity-40" />
                            <p className="text-slate-100 font-bold leading-relaxed text-sm italic relative z-10">
                                "{t('education_quote')}"
                            </p>
                            <div className="mt-6 flex items-center gap-3 opacity-60">
                                <div className="w-5 h-0.5 bg-blue-500"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('quote_author')}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <CustomizationDrawer
                isOpen={isConfiguring}
                onClose={() => setIsConfiguring(false)}
                config={config}
                onSave={handleUpdateConfig}
            />
        </div>
    );
};

const Dashboard = () => {
        const { t } = useLanguage();
    const { currentUser, viewMode } = useGlobal();
    const [saStats, setSaStats] = useState({ totalSchools: 0, totalUsers: 0, totalPlans: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            if (currentUser?.role === UserRole.SUPER_ADMIN && viewMode === 'admin') {
                const s = await getCountFromServer(collection(db, 'schools'));
                const u = await getCountFromServer(collection(db, 'users'));
                const p = await getCountFromServer(collection(db, 'lessonPlans'));
                setSaStats({ totalSchools: s.data().count, totalUsers: u.data().count, totalPlans: p.data().count });
            }
        };
        fetchStats();
    }, [currentUser, viewMode]);

    if (!currentUser) return null;

    if (currentUser.role === UserRole.SUPER_ADMIN && viewMode === 'admin')
        return <div className="p-6"><SuperAdminDashboard stats={saStats} /></div>;

    if ([UserRole.SCHOOL_ADMIN, UserRole.PRINCIPAL, UserRole.GPK].includes(currentUser.role) && viewMode === 'admin')
        return <div className="p-6"><SchoolAdminDashboard /></div>;

    return <div className="p-6"><PersonalDashboard /></div>;
};

const ClipboardList = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-clipboard-list ${props.className}`}><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></svg>
);

export default Dashboard;
