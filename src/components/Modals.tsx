import React from 'react';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {children}
            </div>
        </div>
    );
};

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: string;
    title?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, message, title = "Success" }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                <p className="text-slate-500 mb-8">{message}</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
                >
                    Continue
                </button>
            </div>
        </Modal>
    );
};
