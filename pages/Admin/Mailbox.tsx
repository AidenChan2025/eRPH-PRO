
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import {
    Inbox, Send, Mail, Trash2, Search, Filter,
    MoreVertical, RotateCcw, Reply, Star,
    ChevronLeft, User, Clock, ShieldCheck,
    CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { getEmails } from '../../services/emailService';
import { Email } from '../../types';
import { useTranslation } from 'react-i18next';

export const Mailbox = () => {
        const { t } = useLanguage();
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMail = async () => {
            const data = await getEmails();
            setEmails(data as Email[]);
            setIsLoading(false);
        };
        fetchMail();
    }, []);

    const filteredEmails = emails.filter(e =>
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.fromName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleReply = () => {
        if (!replyText.trim()) return;
        alert("Reply sent successfully to " + selectedEmail?.from);
        setIsReplying(false);
        setReplyText('');
    };

    return (
        <div className="h-[calc(100vh-140px)] flex gap-6 animate-in fade-in duration-500">
            {/* Sidebar List */}
            <Card className={`w-full lg:w-[450px] flex flex-col overflow-hidden rounded-[2rem] border-slate-200/60 shadow-xl shadow-slate-200/50 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-6 border-b border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                                <Inbox className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">{t('adminMailbox')}</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors">
                                <RotateCcw className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            placeholder="Search correspondence..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="p-12 text-center space-y-4">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('hydratingSubsystem')}</p>
                        </div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-400">{t('noMessagesFound')}</p>
                        </div>
                    ) : filteredEmails.map(email => (
                        <button
                            key={email.id}
                            onClick={() => setSelectedEmail(email)}
                            className={`w-full p-6 text-left border-b border-slate-50 transition-all hover:bg-blue-50/30 relative group ${selectedEmail?.id === email.id ? 'bg-blue-50/50' : ''}`}
                        >
                            {email.status === 'unread' && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full" />
                            )}
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm tracking-tight truncate pr-4 ${email.status === 'unread' ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                                    {email.fromName || email.from}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase shrink-0">
                                    {new Date(email.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h4 className={`text-sm line-clamp-1 mb-2 ${email.status === 'unread' ? 'font-black text-blue-600' : 'font-bold text-slate-800'}`}>
                                {email.subject}
                            </h4>
                            <p className="text-xs font-semibold text-slate-500 line-clamp-2">
                                {email.body}
                            </p>
                        </button>
                    ))}
                </div>
            </Card>

            {/* Content Area */}
            <Card className={`flex-1 flex flex-col overflow-hidden rounded-[2rem] border-slate-200/60 shadow-xl shadow-slate-200/50 ${!selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
                {!selectedEmail ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                            <Mail className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">{t('selectAConversation')}</h3>
                        <p className="text-sm font-bold text-slate-400 max-w-xs">{t('pickAMessageFromThe')}</p>
                    </div>
                ) : (
                    <>
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedEmail(null)} className="lg:hidden p-2 -ml-2 hover:bg-slate-50 rounded-xl transition-colors">
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center font-black text-blue-600 text-lg">
                                    {selectedEmail.fromName?.charAt(0) || 'U'}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="font-black text-slate-800 truncate">{selectedEmail.fromName || 'System User'}</h3>
                                    <p className="text-xs font-bold text-slate-400 truncate">{selectedEmail.from}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors">
                                    <Star className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button className="p-2 hover:bg-slate-50 text-slate-400 rounded-xl transition-colors">
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <span>{t('subject_2')}{selectedEmail.subject}</span>
                                    <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] text-slate-700 leading-relaxed font-semibold whitespace-pre-wrap">
                                    {selectedEmail.body}
                                </div>
                            </div>

                            {isReplying && (
                                <div className="space-y-4 p-8 border-2 border-blue-100 rounded-[2rem] bg-blue-50/20 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Reply className="w-4 h-4" />
                                            <span className="text-xs font-black uppercase tracking-widest">{t('draftingReply')}</span>
                                        </div>
                                        <button onClick={() => setIsReplying(false)} className="text-slate-400 hover:text-slate-600">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none min-h-[150px] shadow-sm shadow-blue-500/5 placeholder:text-slate-300"
                                        placeholder="Type your message here..."
                                        autoFocus
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <Button variant="ghost" onClick={() => setIsReplying(false)}>{t('cancel')}</Button>
                                        <Button onClick={handleReply} className="px-8 rounded-xl shadow-lg shadow-blue-500/10">{t('sendMessage')}</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions Footer */}
                        {!isReplying && (
                            <div className="p-6 border-t border-slate-100 flex gap-4 shrink-0">
                                <Button onClick={() => setIsReplying(true)} className="flex-1 rounded-2xl h-14 font-black shadow-xl shadow-blue-500/10">
                                    <Reply className="w-5 h-5 mr-2" /> {t('quickReply')}</Button>
                                <Button variant="secondary" className="px-8 rounded-2xl h-14 font-black">
                                    {t('forward')}</Button>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};
