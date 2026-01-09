
import React from 'react';
import Button from './Button';
import Card from './Card';
import { Check } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    onPrimaryAction?: () => void;
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
}

export const SuccessModal = ({ isOpen, onClose, title, message, onPrimaryAction, primaryActionLabel = "Continue", secondaryActionLabel = "Close" }: SuccessModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="w-full max-w-sm shadow-2xl border-0 rounded-[2rem] overflow-hidden text-center p-8 space-y-6 bg-white relative">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-2">
                    <Check className="w-10 h-10 stroke-[3px]" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{message}</p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    {onPrimaryAction && (
                        <Button onClick={onPrimaryAction} className="w-full h-12 rounded-xl text-lg font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200">
                            {primaryActionLabel}
                        </Button>
                    )}
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-xl font-bold text-slate-400 hover:bg-slate-50">
                        {secondaryActionLabel}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
