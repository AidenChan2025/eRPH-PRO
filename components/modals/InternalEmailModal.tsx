
import React, { useState } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { sendSupportTicket } from '../../services/emailService';
import { X, Paperclip, Send, Loader2, Mail, CheckCircle, Shield } from 'lucide-react';

export const InternalEmailModal = () => {
    const { isEmailModalOpen, setIsEmailModalOpen, currentUser } = useGlobal();
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isEmailModalOpen) return null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsSending(true);

        const success = await sendSupportTicket({
            senderId: currentUser.id,
            senderName: currentUser.name,
            senderEmail: currentUser.email,
            recipient: 'support@erphpro.com',
            subject,
            messageBody: body,
        });

        setIsSending(false);

        if (success) {
            setIsSuccess(true);
            setTimeout(() => {
                handleClose();
            }, 2000);
        }
    };

    const handleClose = () => {
        setIsEmailModalOpen(false);
        // Reset state after transition
        setTimeout(() => {
            setIsSuccess(false);
            setSubject('');
            setBody('');
        }, 300);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Support Helper</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Internal Ticketing System</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 animate-in fade-in zoom-in">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">Ticket Created!</h3>
                        <p className="text-slate-500 text-center max-w-xs">
                            Your support request has been logged. Our team will review it shortly.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex-1 overflow-y-auto flex flex-col">
                        <div className="p-6 space-y-4">
                            {/* To Field */}
                            <div className="border-b border-slate-100 pb-4">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                                        <Shield className="w-3 h-3" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                        Support Team &lt;support@erphpro.com&gt;
                                    </span>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="space-y-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Briefly describe your issue..."
                                    className="w-full text-lg font-bold text-slate-800 placeholder:text-slate-300 border-none focus:ring-0 p-0"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="border-t border-slate-100 my-2"></div>

                            {/* Body */}
                            <div className="flex-1 min-h-[200px]">
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="Please provide details about your request. Include any error messages or steps to reproduce the issue."
                                    className="w-full h-full resize-none text-slate-600 text-sm leading-relaxed border-none focus:ring-0 p-0 placeholder:text-slate-300"
                                    required
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer / Toolbar */}
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <button type="button" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Attach File">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <span className="text-[10px] text-slate-400 font-medium italic">Attachments coming soon</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!subject || !body || isSending}
                                    className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Ticket
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
