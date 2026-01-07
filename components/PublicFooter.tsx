import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Facebook, Coffee } from 'lucide-react';
import { APP_VERSION } from '../src/config/version';

const PublicFooter = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-900/50">
                                e
                            </div>
                            <span className="text-xl font-black text-white tracking-tight">eRPH<span className="text-blue-500">PRO</span></span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            The advanced cloud-based lesson planning system designed for high-performance Malaysian educators.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Support</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-400">
                            <li><Link to="/features" className="hover:text-blue-400 transition-colors">Features</Link></li>
                            <li><Link to="/support" className="hover:text-amber-400 transition-colors flex items-center gap-2"><Coffee className="w-3 h-3" /> Support Me</Link></li>
                            <li><Link to="/knowledge" className="hover:text-blue-400 transition-colors">Knowledge Base</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm font-medium text-slate-400">
                            <li><Link to="/legal" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/legal" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/legal" className="hover:text-blue-400 transition-colors">Security</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        © 2026 eRPH Pro. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-emerald-500 text-xs font-bold uppercase tracking-widest">System Operational</span>
                        </span>
                        <span className="text-slate-400 text-xs font-mono">v{APP_VERSION} (Stable)</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
