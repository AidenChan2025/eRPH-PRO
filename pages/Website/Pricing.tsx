import React from 'react';
import PublicNavbar from '../../components/PublicNavbar';
import PublicFooter from '../../components/PublicFooter';
import { Coffee, Heart, Check, Sparkles, X } from 'lucide-react';
import Button from '../../components/Button';

const Pricing = () => {
    const [showQR, setShowQR] = React.useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
            <PublicNavbar />

            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 text-amber-600 font-black text-xs uppercase tracking-widest animate-in zoom-in duration-500">
                        <Coffee className="w-4 h-4" />
                        <span>Support Development</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
                        Fuel the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Revolution.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                        eRPH Pro is built by a single passionate developer dedicated to improving Malaysian education. Your support keeps the servers running and the caffeine flowing.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto pt-12">
                        {/* Free Tier */}
                        <div className="p-8 rounded-[2.5rem] border-2 border-slate-100 text-left hover:border-slate-200 transition-all">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Community</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900">Free</span>
                                <span className="text-slate-400 font-bold">/ forever</span>
                            </div>
                            <p className="text-slate-500 font-medium mb-8">For schools just getting started with digitalization.</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Standard RPH Templates',
                                    'Access to Public Knowledge Base',
                                    'Basic PDF Exports',
                                    'Community Support'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-slate-500" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button variant="secondary" className="w-full rounded-2xl h-12 font-black">Current Plan</Button>
                        </div>

                        {/* Supporter Tier */}
                        <div className="relative p-8 rounded-[2.5rem] border-2 border-amber-500 bg-amber-50/10 text-left shadow-2xl shadow-amber-500/10 flex flex-col">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Heart className="w-3 h-3 fill-current" /> Most Popular
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 mb-2">Supporter</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-slate-900">RM 10</span>
                                <span className="text-slate-400 font-bold">/ coffee</span>
                            </div>

                            <p className="text-slate-500 font-medium mb-8 flex-1">Show your appreciation and help speed up development!</p>
                            <ul className="space-y-4 mb-8">
                                {[
                                    'Priority Feature Requests',
                                    'Direct Dev Support Chat',
                                    'Early Access to Beta Features',
                                    'Good Karma Points ✨'
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-amber-600" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => setShowQR(true)}
                                className="w-full rounded-2xl h-12 font-black bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 text-white border-none"
                            >
                                <Coffee className="w-4 h-4 mr-2" /> Treat a Coffee
                            </Button>
                        </div>
                    </div>
                </div>
            </main>

            {/* QR Modal */}
            {showQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border-4 border-amber-100 select-none">
                        <div className="relative">
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="bg-amber-50 p-8 text-center border-b border-amber-100">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
                                    <Coffee className="w-8 h-8 text-amber-600 animate-bounce" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Buy Aiden a Coffee</h3>
                                <p className="text-xs text-amber-800 font-bold uppercase tracking-wide mt-1">Thank you for your support!</p>
                            </div>
                            <div className="p-6 bg-white space-y-6">
                                <div className="bg-slate-900 p-4 rounded-3xl shadow-inner flex flex-col items-center gap-4">
                                    <div className="bg-white p-2 rounded-xl">
                                        <img src="/assets/img/tng_qr.png" alt="Touch 'n Go QR" className="w-48 h-auto object-contain rounded-lg" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg">RM 10.00</p>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">+ Any Tips You Like!</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowQR(false)}
                                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/30 rounded-2xl"
                                >
                                    Done!
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PublicFooter />
        </div>
    );
};

export default Pricing;
