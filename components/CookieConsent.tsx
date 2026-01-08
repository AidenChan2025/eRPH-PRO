import React, { useState, useEffect } from 'react';
import Button from './Button';
import { ShieldCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const COOKIE_CONSENT_KEY = 'erph_cookie_consent';

export const CookieConsent = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Delay slightly to not overwhelm
            setTimeout(() => setIsVisible(true), 1500);
        }
    }, []);

    const handleAccept = () => {
        setIsVisible(false);
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-3xl shadow-2xl border border-slate-700 md:flex items-center gap-6">
                <div className="flex bg-slate-800/50 p-3 rounded-2xl items-start gap-4 flex-1">
                    <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-sm">{t('weValueYourPrivacy')}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            {t('weUseCookiesToEnhance')}<a href="/legal" className="text-blue-400 hover:underline">{t('privacyPolicy')}</a> & <a href="/legal" className="text-blue-400 hover:underline">{t('pdpaTerms')}</a>.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                    <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={handleAccept}>
                        {t('close')}</Button>
                    <Button onClick={handleAccept} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl px-8 shadow-lg shadow-emerald-500/20">
                        {t('acceptAll')}</Button>
                </div>
            </div>
        </div>
    );
};
