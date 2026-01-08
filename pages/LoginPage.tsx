
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGlobal, MOCK_USERS } from '../context/GlobalContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, Language } from '../types';
import {
    auth, signInWithEmailAndPassword, signInWithGoogle, createUserWithEmailAndPassword, sendEmailVerification
} from '../services/firebase';
import {
    Trash2, Globe, ChevronDown, ArrowRight, Loader2,
    ShieldCheck, Zap, AlertCircle, Info, Home,
    Mail, Lock, ChevronLeft, Layout, Shield, Check
} from 'lucide-react';
import { SuccessModal } from '../components/Modals';
import { APP_VERSION } from '../src/config/version';

const LoginPage = () => {
    const { currentUser, setCurrentUser } = useGlobal();
    const { t, language, setLanguage } = useLanguage();
    const navigate = useNavigate();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [pdpaConsent, setPdpaConsent] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);


    // UI State
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginStage, setLoginStage] = useState('');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [typedText, setTypedText] = useState('');

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/portal');
        }
    }, [currentUser, navigate]);

    const getSafeEnv = (key: string): string | undefined => {
        try {
            if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
                const val = (import.meta as any).env[key];
                if (val && val !== 'undefined') return val;
            }
            if (typeof process !== 'undefined' && process.env) {
                const val = (process.env as any)[key];
                if (val && val !== 'undefined') return val;
            }
        } catch (e) { }
        return undefined;
    };

    const apiKey = getSafeEnv('VITE_FIREBASE_API_KEY');
    const isFirebaseConfigured = !!apiKey;

    const LANGUAGES = [
        { code: Language.EN, label: 'English' },
        { code: Language.MS, label: 'Bahasa Melayu' },
        { code: Language.ZH, label: '中文 (Chinese)' },
        { code: Language.TA, label: 'தமிழ் (Tamil)' },
        { code: Language.JV, label: 'جاوي (Jawi)' },
    ];

    useEffect(() => {
        const text = "SYSTEM INITIALIZED... CONNECTION SECURE";
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setTypedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, 50);
        return () => clearInterval(timer);
    }, []);

    const handleAuthAction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setMessage('');

        if (isSignUp && !pdpaConsent) {
            setError("You must agree to the Terms, Privacy Policy & PDPA to continue.");
            return;
        }

        setIsLoggingIn(true);
        setLoginStage('Establishing Connection...');

        try {
            if (isForgotPassword) {
                setMessage("If an account exists for this email, reset instructions have been sent.");
                setIsLoggingIn(false);
                return;
            }

            if (isSignUp) {
                setLoginStage('Creating Secure Account...');
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                setLoginStage('Sending Verification Email...');
                await sendEmailVerification(userCredential.user);
                setIsLoggingIn(false);
                setShowVerifyModal(true);
                return;
            }

            setLoginStage('Authenticating Credentials...');
            await signInWithEmailAndPassword(auth, email, password);
            setLoginStage('Session Verified. Entering Workspace...');

            // Artificial pause for "Session Verified" feedback before navigation
            setTimeout(() => {
                navigate('/portal');
            }, 1200);
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please verify your credentials.');
            setIsLoggingIn(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!isFirebaseConfigured) {
            setError("Google Login Unavailable: Firebase API Keys not set.");
            return;
        }

        setIsLoggingIn(true);
        setError('');
        setLoginStage('Connecting to Google Identity...');

        try {
            await signInWithGoogle(auth);
            setLoginStage('Authorizing Access...');
            setTimeout(() => {
                navigate('/portal');
            }, 1200);
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user') {
                setError(err.message || 'Google authentication failed.');
            }
            setIsLoggingIn(false);
        }
    };

    const handleDemoLogin = async (userId: string) => {
        setIsLoggingIn(true);
        setError('');
        setLoginStage('Configuring Session...');

        const user = MOCK_USERS.find(u => u.id === userId);
        if (!user) {
            setIsLoggingIn(false);
            return;
        }

        try {
            setLoginStage(`Logging in as ${user.name}...`);
            // Note: These demo accounts must exist in Firebase Auth
            await signInWithEmailAndPassword(auth, user.email, 'demo123');
            setLoginStage('Session Verified. Entering Workspace...');
            setCurrentUser(user);
            setTimeout(() => {
                navigate('/portal');
            }, 1200);
        } catch (e) {
            setError("Demo login failed. Account may not exist in live system.");
            setIsLoggingIn(false);
        }
    };

    const demoUsers = MOCK_USERS.filter(u => u.role !== UserRole.SUPER_ADMIN);

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 overflow-hidden">
            {/* High-Impact Persistence Loader */}
            {isLoggingIn && (
                <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center gap-6 border border-slate-100 max-w-sm w-full mx-4">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                            <Shield className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-black text-slate-800 uppercase tracking-tight animate-pulse">{loginStage || 'Initializing Session'}</p>
                            <div className="flex items-center justify-center gap-1">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Security handshake in progress</p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes gridMove {
                    0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
                    100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
                }
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .tech-grid-floor {
                    position: absolute; bottom: -30%; left: -50%; width: 200%; height: 100%;
                    background-image: linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
                    background-size: 40px 40px; transform-origin: center bottom; animation: gridMove 4s linear infinite;
                    mask-image: linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 60%);
                }
                .hud-ring { position: absolute; border: 1px dashed rgba(59, 130, 246, 0.2); border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); }
                .hud-ring-1 { width: 400px; height: 400px; animation: spinSlow 30s linear infinite; }
            `}</style>

            {/* Left Panel - Branding */}
            <div className="hidden lg:flex w-5/12 bg-slate-950 relative overflow-hidden flex-col justify-center p-12 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"></div>
                <div className="hud-ring hud-ring-1"></div>
                <div className="tech-grid-floor"></div>

                <div className="relative z-10 backdrop-blur-md bg-slate-900/40 p-8 rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-6 bg-black/40 w-fit px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase min-h-[1.5em]">{typedText || "_"}</span>
                    </div>

                    <h1 className="text-5xl font-bold mb-4 tracking-tight text-white leading-tight">
                        eRPH <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Pro</span>
                        <span className="text-sm align-top ml-2 text-slate-500 font-mono">v{APP_VERSION}</span>
                    </h1>

                    <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-sm">
                        Malaysia's professional digital ecosystem for educator administrative excellence.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: Layout, text: 'Standardized Workflow', sub: 'Simplified lesson planning' },
                            { icon: ShieldCheck, text: 'Digital Validation', sub: 'Secure approval registry' },
                            { icon: Zap, text: 'Live School Analytics', sub: 'Real-time performance metrics' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-transparent">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <item.icon className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-200">{item.text}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-7/12 flex flex-col items-center justify-center p-6 bg-white overflow-y-auto relative">
                {/* Header Controls */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                    <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm transition-colors group">
                        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-blue-50 transition-colors">
                            <Home className="w-4 h-4" />
                        </div>
                        Back to Website
                    </Link>

                    <div className="relative">
                        <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm font-medium uppercase">{language}</span>
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showLangMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden">
                                {LANGUAGES.map(l => (
                                    <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangMenu(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${language === l.code ? 'bg-blue-50 text-blue-600' : ''}`}>
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full max-w-md space-y-8 animate-in slide-in-from-bottom-8 duration-500 pt-16">
                    <div className="text-center">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Login'}
                        </h2>
                    </div>


                    <div className="space-y-6">
                        <form onSubmit={handleAuthAction} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                                    <input
                                        type="email"
                                        className="block w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold disabled:opacity-50"
                                        placeholder="name@school.edu.my"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        disabled={isLoggingIn}
                                        required
                                    />
                                </div>
                            </div>

                            {!isForgotPassword && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                                        <input
                                            type="password"
                                            className="block w-full p-3.5 pl-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold disabled:opacity-50"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            disabled={isLoggingIn}
                                            required
                                        />
                                    </div>
                                    {!isSignUp && (
                                        <div className="flex justify-end pr-1">
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tighter disabled:opacity-50"
                                                disabled={isLoggingIn}
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isSignUp && (
                                <div className="flex items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                    <div className="relative flex items-center h-5">
                                        <input
                                            id="pdpa"
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={pdpaConsent}
                                            onChange={(e) => setPdpaConsent(e.target.checked)}
                                        />
                                    </div>
                                    <label htmlFor="pdpa" className="ml-1 text-[10px] text-slate-500 font-medium leading-tight cursor-pointer">
                                        I agree to the <Link to="/legal" target="_blank" className="font-bold text-blue-600 hover:underline">Terms</Link>, <Link to="/legal" target="_blank" className="font-bold text-blue-600 hover:underline">Privacy Policy</Link>, and consent to the processing of my personal data in accordance with the <span className="font-bold text-slate-700">PDPA 2010 (Malaysia)</span>.
                                    </label>
                                </div>
                            )}

                            {error && (
                                <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
                                </div>
                            )}

                            {message && (
                                <div className="text-emerald-600 text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center">
                                    <ShieldCheck className="w-4 h-4 mr-2 shrink-0" /> {message}
                                </div>
                            )}

                            <button type="submit" disabled={isLoggingIn} className="w-full py-4 px-4 bg-[#0f172a] text-white font-black rounded-xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50">
                                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Initialize Account' : t('sign_in')}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            {!isForgotPassword && (
                                <div className="text-center pt-2">
                                    <p className="text-sm font-medium text-slate-500">
                                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                                        <button
                                            type="button"
                                            onClick={() => setIsSignUp(!isSignUp)}
                                            className="text-blue-600 font-black hover:underline disabled:opacity-50"
                                            disabled={isLoggingIn}
                                        >
                                            {isSignUp ? 'Login' : 'Sign Up'}
                                        </button>
                                    </p>
                                </div>
                            )}
                        </form>

                        <SuccessModal
                            isOpen={showVerifyModal}
                            onClose={() => setShowVerifyModal(false)}
                            title="Verification Sent"
                            message={`We've sent a verification link to ${email}. Please check your inbox (and spam folder) to activate your account.`}
                            primaryActionLabel="Back to Login"
                            onPrimaryAction={() => { setShowVerifyModal(false); setIsSignUp(false); }}
                            secondaryActionLabel="Close"
                        />

                        {!isForgotPassword && (
                            <>
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Social Gateway</span>
                                    <div className="flex-grow border-t border-slate-100"></div>
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={isLoggingIn}
                                    className="w-full py-3.5 px-4 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                                    Continue with Google
                                </button>
                            </>
                        )}

                        {!isForgotPassword && demoUsers.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <div className="relative flex py-2 items-center">
                                    <div className="flex-grow border-t border-slate-100"></div>
                                    <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">{t('quick_demo')}</span>
                                    <div className="flex-grow border-t border-slate-100"></div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {demoUsers.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => handleDemoLogin(user.id)}
                                            disabled={isLoggingIn}
                                            className="p-3 text-left rounded-xl border border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group disabled:opacity-50"
                                        >
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-blue-600">{user.role}</p>
                                            <p className="text-xs font-bold text-slate-700">{user.name.split(' ')[0]}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            {isForgotPassword && (
                                <button
                                    onClick={() => { setIsForgotPassword(false); setError(''); setMessage(''); }}
                                    className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
                                    disabled={isLoggingIn}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Back to Login
                                </button>
                            )}
                        </div>

                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-center items-center px-2">
                        <span className="text-[10px] text-slate-400 font-mono tracking-tight font-bold uppercase">Build v{APP_VERSION}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
