
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GlobalProvider, useGlobal } from './context/GlobalContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import NotFoundPage from './components/NotFoundPage';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { UserRole } from './types';
import { CookieConsent } from './components/CookieConsent';
import ScrollToTop from './components/ScrollToTop';
import { useTranslation } from 'react-i18next';

// Public Website Pages
import LandingPage from './pages/Website/LandingPage';
import FeaturePage from './pages/Website/FeaturePage';
import KnowledgeBase from './pages/Website/KnowledgeBase';
import ArticleList from './pages/Website/ArticleList';
import ArticleDetail from './pages/Website/ArticleDetail';
import Legal from './pages/Website/Legal';
import Pricing from './pages/Website/Pricing';

// Private Portal Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

import TaskManager from './pages/TaskManager';
import UserProfile from './pages/UserProfile';
import SecurityCenter from './pages/Portal/SecurityCenter';
import TimetableManager from './pages/TimetableManager';
import ReferenceManager from './pages/ReferenceManager';
import CalendarView from './pages/CalendarView';
import { LeaveManagement } from './pages/Approval';
import { SchoolSettings, DSKPManager, UserManagement, SchoolManager, NewsletterManager } from './pages/Admin';
import { Mailbox } from './pages/Admin/Mailbox';
import { SystemConfig } from './pages/Admin/SystemConfig';
import ArticleManager from './pages/Admin/ArticleManager';

// Security Shell
const SecurityShell: React.FC = () => {
    const { t } = useTranslation();
    useEffect(() => {
        if (window.location.hostname !== 'localhost') {
            document.addEventListener('contextmenu', (e) => e.preventDefault());
            console.log("%ceRPH Pro: Security Subsystem Active", "color: #2563eb; font-weight: bold; font-size: 14px;");
        }
    }, []);
    return null;
};

// Global Splash Screen
const SplashScreen = () => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black opacity-60"></div>

            <div className="relative flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                    <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] rotate-12 animate-pulse">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-lg animate-bounce">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black tracking-tight">{t('erph')}<span className="text-blue-500">{t('pro')}</span></h1>
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                            <span>{t('verifyingSession')}</span>
                            <span className="flex gap-1">
                                <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping"></span>
                                <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping [animation-delay:0.2s]"></span>
                                <span className="w-1 h-1 bg-blue-500 rounded-full animate-ping [animation-delay:0.4s]"></span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('protectedByAidenSecuritySubsystem')}</p>
            </div>
        </div>
    );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useTranslation();
    const { currentUser, isLoading } = useGlobal();
    const location = useLocation();

    if (isLoading) return <SplashScreen />;
    if (!currentUser) return <Navigate to="/portal/login" state={{ from: location }} />;
    return <Layout>{children}</Layout>;
};

// Settings Brancher
const SettingsPage = () => {
    const { t } = useTranslation();
    const { currentUser } = useGlobal();
    if (currentUser?.role === UserRole.SUPER_ADMIN) return <SystemConfig />;
    return <SchoolSettings />;
};

const AppRoutes = () => {
    const { t } = useTranslation();
    const { currentUser, isLoading } = useGlobal();

    if (isLoading) return <SplashScreen />;

    return (
        <Routes>
            {/* --- PUBLIC WEBSITE ROUTES --- */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturePage />} />
            <Route path="/knowledge" element={<KnowledgeBase />} />
            <Route path="/faq" element={<KnowledgeBase />} />
            <Route path="/blog" element={<ArticleList />} />
            <Route path="/blog/:slug" element={<ArticleDetail />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/support" element={<Pricing />} />

            {/* --- PRIVATE PORTAL ROUTES --- */}
            <Route path="/portal/login" element={<LoginPage />} />

            <Route path="/portal" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

            <Route path="/portal/tasks" element={<PrivateRoute><TaskManager /></PrivateRoute>} />
            <Route path="/portal/timetable" element={<PrivateRoute><TimetableManager /></PrivateRoute>} />
            <Route path="/portal/records" element={<PrivateRoute><LeaveManagement /></PrivateRoute>} />
            <Route path="/portal/references" element={<PrivateRoute><ReferenceManager /></PrivateRoute>} />
            <Route path="/portal/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/portal/security" element={<PrivateRoute>{currentUser?.role === UserRole.SUPER_ADMIN ? <SecurityCenter /> : <Navigate to="/portal" />}</PrivateRoute>} />
            <Route path="/portal/calendar" element={<PrivateRoute><CalendarView /></PrivateRoute>} />


            {/* Unified Admin/SA Routes */}
            <Route path="/portal/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
            <Route path="/portal/schools" element={<PrivateRoute><SchoolManager /></PrivateRoute>} />
            <Route path="/portal/dskp" element={<PrivateRoute><DSKPManager /></PrivateRoute>} />
            <Route path="/portal/dskp" element={<PrivateRoute><DSKPManager /></PrivateRoute>} />
            <Route path="/portal/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
            <Route path="/portal/mailbox" element={<PrivateRoute><Mailbox /></PrivateRoute>} />
            <Route path="/portal/newsletter" element={<PrivateRoute><NewsletterManager /></PrivateRoute>} />
            <Route path="/portal/admin/articles" element={<PrivateRoute><ArticleManager /></PrivateRoute>} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
};




const App = () => {
    const { t } = useTranslation();
    return (
        <HashRouter>
            <GlobalProvider>
                <LanguageProvider>
                    <SecurityShell />
                    <ScrollToTop />
                    <CookieConsent />
                    <AppRoutes />
                </LanguageProvider>
            </GlobalProvider>
        </HashRouter>
    );
};

export default App;
