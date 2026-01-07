import React, { useEffect, useState } from 'react';
import { Coffee, X, Heart } from 'lucide-react';
import Button from './Button';
import { Link } from 'react-router-dom';

const COFFEE_POPUP_KEY = 'erph_coffee_last_shown';
const POPUP_INTERVAL_DAYS = 45;

export const CoffeeModal = () => {
    const [showQR, setShowQR] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkPopup = () => {
            const lastShown = localStorage.getItem(COFFEE_POPUP_KEY);
            const now = new Date().getTime();

            if (!lastShown) {
                // Check if we have an "install date" (first time seen)
                const installDate = localStorage.getItem('erph_install_date');
                if (!installDate) {
                    // First time ever seeing this user on this device
                    localStorage.setItem('erph_install_date', now.toString());
                    return;
                }

                // Check if 7 days have passed since first use
                const daysSinceInstall = (now - parseInt(installDate)) / (1000 * 60 * 60 * 24);
                if (daysSinceInstall < 7) return;

                setIsOpen(true);
            } else {
                const daysSince = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
                // Default check, but specific logic will override local storage on button click
                if (daysSince >= 1) {
                    const nextShow = localStorage.getItem('erph_coffee_next_show');
                    if (nextShow) {
                        if (now >= parseInt(nextShow)) setIsOpen(true);
                    } else if (daysSince >= POPUP_INTERVAL_DAYS) {
                        setIsOpen(true);
                    }
                }
            }
        };

        const timer = setTimeout(checkPopup, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = (daysToSnooze: number) => {
        setIsOpen(false);
        const nextShow = new Date().getTime() + (daysToSnooze * 24 * 60 * 60 * 1000);
        localStorage.setItem('erph_coffee_next_show', nextShow.toString());
        localStorage.setItem(COFFEE_POPUP_KEY, new Date().getTime().toString());
    };

    const handleTreat = () => {
        setShowQR(true);
    };

    const handleDoneTreating = () => {
        handleClose(30); // Validated for 30 days
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border-4 border-amber-100">
                <button
                    onClick={() => handleClose(1)} // Close without choice = 1 day reminder? Or 20? Let's say 5 for dismiss.
                    className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="bg-amber-50 p-8 text-center border-b border-amber-100">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                        <Coffee className="w-10 h-10 text-amber-600 animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Fuel the Developer!</h3>
                    <p className="text-amber-800 font-bold text-sm uppercase tracking-wide">eRPH Pro is 100% Indie Built</p>
                </div>

                <div className="p-8 space-y-6">
                    {!showQR ? (
                        <>
                            <p className="text-center text-slate-600 font-medium leading-relaxed">
                                Hi! I'm <span className="font-black text-slate-900">Aiden</span>.
                                I built this system alone to help teachers like you manage RPH easier.
                                <br /><br />
                                If eRPH Pro saved your time, consider treating me to a coffee <span className="font-black text-slate-900">(RM10)</span>.
                                <br />
                                <span className="text-xs italic text-slate-400 mt-2 block">(Extra tips for my hard work are deeply appreciated! ❤️)</span>
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleTreat}
                                    className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white font-black shadow-xl shadow-amber-500/30 text-lg rounded-2xl"
                                >
                                    Sure, I'll treat you! ☕
                                </Button>
                                <Button
                                    onClick={() => handleClose(20)}
                                    variant="ghost"
                                    className="w-full font-bold text-slate-400 hover:text-slate-600"
                                >
                                    Maybe next time
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="text-center">
                                <h4 className="text-xl font-black text-slate-800 mb-1">Pass the Coffee!</h4>
                                <p className="text-sm text-slate-500 font-bold">Scan with TnG eWallet</p>
                            </div>

                            <div className="bg-slate-900 p-4 rounded-3xl shadow- inner flex flex-col items-center gap-4">
                                <div className="bg-white p-2 rounded-xl">
                                    <img src="/assets/img/tng_qr.png" alt="Touch 'n Go QR" className="w-48 h-auto object-contain rounded-lg" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-black text-lg">RM 10.00</p>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">+ Any Tips You Like!</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleDoneTreating}
                                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30 rounded-2xl"
                            >
                                Done! (Remind me in 30 days)
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
