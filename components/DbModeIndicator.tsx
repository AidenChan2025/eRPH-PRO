import React, { useEffect, useState } from 'react';
import { isInitialized } from '../services/firebase';
import { Zap, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DbModeIndicator: React.FC = () => {
    const { t } = useTranslation();
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        setConnected(isInitialized());
    }, []);

    return (
        <div className={`flex flex-col gap-2 p-3 rounded-2xl border ${connected ? 'bg-slate-900/40 border-slate-800/50' : 'bg-red-500/10 border-red-500/50'}`}>
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${connected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-red-500/10 text-red-500'}`}>
                    <Zap className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('systemStatus')}</span>
                    <span className={`text-[11px] font-bold ${connected ? 'text-indigo-400' : 'text-red-500'} uppercase flex items-center gap-1.5`}>
                        {connected ? (
                            <>
                                <Wifi className="w-3 h-3" /> {t('online')}</>
                        ) : (
                            <>
                                <WifiOff className="w-3 h-3" /> {t('error')}</>
                        )}
                    </span>
                </div>
            </div>

            {connected ? (
                <div className="mt-1 flex items-start gap-1.5 px-2 py-1 bg-indigo-500/5 rounded-md border border-indigo-500/10">
                    <p className="text-[8px] leading-tight text-indigo-400/80 font-medium">{t('connectedToFirebaseStorage')}</p>
                </div>
            ) : (
                <div className="mt-1 flex items-start gap-1.5 px-2 py-1 bg-red-500/10 rounded-md border border-red-500/20">
                    <p className="text-[8px] leading-tight text-red-500 font-bold">{t('configMissingCheckConsole')}</p>
                </div>
            )}
        </div>
    );
};
