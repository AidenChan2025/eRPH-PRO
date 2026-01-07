
import React, { useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { 
    ShieldCheck, Lock, Smartphone, Globe, AlertCircle, 
    History, Clock, LogOut, CheckCircle, ShieldAlert,
    Eye, Shield, Fingerprint, Mail, Key, Info
} from 'lucide-react';
import { doc, updateDoc, db } from '../../services/firebase';

const SecurityCenter = () => {
    const { t } = useLanguage();
    const { currentUser, setCurrentUser, logout } = useGlobal();
    const [isSaving, setIsSaving] = useState(false);

    const [config, setConfig] = useState(currentUser?.securityConfig || {
        twoFactorEnabled: false,
        sessionTimeoutMinutes: 30,
        lastPasswordChange: new Date().toISOString(),
        loginAlerts: true
    });

    const mockHistory = [
        { id: '1', timestamp: '2025-03-20 14:22', ip: '115.164.12.88', device: 'Chrome / macOS', location: 'Kuala Lumpur, MY', status: 'Success' },
        { id: '2', timestamp: '2025-03-19 09:10', ip: '115.164.12.88', device: 'Chrome / macOS', location: 'Kuala Lumpur, MY', status: 'Success' },
        { id: '3', timestamp: '2025-03-18 22:45', ip: '182.23.44.11', device: 'Safari / iPhone', location: 'Selangor, MY', status: 'Success' },
        { id: '4', timestamp: '2025-03-18 22:40', ip: '182.23.44.11', device: 'Safari / iPhone', location: 'Selangor, MY', status: 'Failed' },
    ];

    const handleSave = async () => {
        if (!currentUser) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', currentUser.id), { securityConfig: config });
            setCurrentUser({ ...currentUser, securityConfig: config });
            alert("Security policy updated.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        Security & Privacy Center
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium">Protect your educational registry and personal data.</p>
                </div>
                <Button onClick={handleSave} isLoading={isSaving} className="rounded-2xl h-12 px-8 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 border-none">
                    <Lock className="w-4 h-4 mr-2" /> Apply Security Policy
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Policy Controls */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-6 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600"/> Advanced Protection
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                                        <Smartphone className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">Two-Factor Authentication</h4>
                                        <p className="text-xs text-slate-500">Add an extra layer of security via mobile app or SMS.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setConfig({...config, twoFactorEnabled: !config.twoFactorEnabled})}
                                    className={`w-14 h-8 rounded-full relative transition-colors ${config.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.twoFactorEnabled ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Auto-Lock Inactivity (Mins)</label>
                                    <select 
                                        className="w-full border-2 border-slate-100 rounded-2xl p-3.5 text-sm font-bold focus:border-blue-500 outline-none bg-white shadow-sm"
                                        value={config.sessionTimeoutMinutes}
                                        onChange={e => setConfig({...config, sessionTimeoutMinutes: Number(e.target.value)})}
                                    >
                                        <option value={5}>5 Minutes (Maximum Security)</option>
                                        <option value={15}>15 Minutes (Standard)</option>
                                        <option value={30}>30 Minutes (Balanced)</option>
                                        <option value={60}>60 Minutes (Convenience)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Account Recovery Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-300" />
                                        <input 
                                            className="w-full border-2 border-slate-100 rounded-2xl p-3 pl-11 text-sm font-bold bg-slate-50 text-slate-500"
                                            value={currentUser?.email}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 rounded-3xl border-slate-100 shadow-xl shadow-slate-200/50">
                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm mb-6 flex items-center gap-2">
                            <History className="w-4 h-4 text-slate-400"/> Audit Trail: Recent Access
                        </h3>
                        <div className="space-y-4">
                            {mockHistory.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {log.status === 'Success' ? <CheckCircle className="w-5 h-5"/> : <ShieldAlert className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{log.device} • {log.ip}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.timestamp} • {log.location}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'Success' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Sidebar / Recommendations */}
                <div className="space-y-6">
                    <Card className="p-6 rounded-3xl bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 opacity-10">
                            <Fingerprint className="w-48 h-48"/>
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-[10px] text-blue-400 mb-4">Security Score</h4>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black">82</span>
                            <span className="text-blue-400 font-bold mb-1">/ 100</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-6">
                            <div className="bg-blue-500 h-full w-[82%]"></div>
                        </div>
                        <ul className="space-y-3 text-xs font-medium text-slate-300">
                            <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/> Strong Password Active</li>
                            <li className="flex gap-2 items-start text-amber-400"><AlertCircle className="w-4 h-4 shrink-0"/> 2FA is currently disabled</li>
                            <li className="flex gap-2 items-start"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0"/> Login alerts enabled</li>
                        </ul>
                    </Card>

                    <Card className="p-6 rounded-3xl border-slate-100 shadow-sm space-y-4">
                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                            <Key className="w-4 h-4 text-amber-500"/> Credentials
                        </h4>
                        <p className="text-xs text-slate-500">Last changed: {config.lastPasswordChange}</p>
                        <Button variant="secondary" className="w-full rounded-xl py-3 font-bold text-xs">Update Master Password</Button>
                        <Button variant="danger" className="w-full rounded-xl py-3 font-bold text-xs" onClick={logout}>Terminate All Sessions</Button>
                    </Card>

                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex gap-3">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-blue-800 leading-normal uppercase">
                            eRPH Pro implements AES-256 encryption for all data at rest. Your digital signature is stored separately in an encrypted vault.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCenter;
