import React, { memo } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface Option {
    id: string;
    label: string;
}

// --- List Editor Component (Memoized) ---
interface ListEditorProps {
    title: string;
    items: string[];
    onUpdate: (index: number, value: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    placeholder: string;
    icon?: React.ReactNode;
    colorClass: string; // e.g., "blue" -> bg-blue-50 text-blue-600
    emptyMessage?: string;
    isTextArea?: boolean;
    labels?: (index: number, length: number) => string;
}

export const ListEditor = memo(({
    title, items, onUpdate, onAdd, onRemove, placeholder, icon, colorClass, emptyMessage, isTextArea, labels
}: ListEditorProps) => {
    const { t } = useLanguage();

    // Derived classes based on color prop
    const bgSoft = `bg-${colorClass}-50`;
    const textColor = `text-${colorClass}-600`;
    const borderFocus = `focus:border-${colorClass}-500`;
    const shadowColor = `shadow-${colorClass}-100`;
    // For the add button
    const btnBg = `bg-${colorClass}-600`;

    return (
        <div className="pt-6 border-t border-slate-50">
            <div className="flex justify-between items-center mb-5 px-1">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 ${bgSoft} ${textColor} rounded-lg`}>
                        {icon}
                    </div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</label>
                </div>
                <button
                    onClick={onAdd}
                    className={`w-8 h-8 flex items-center justify-center ${btnBg} text-white rounded-xl font-bold shadow-lg ${shadowColor} hover:scale-110 active:scale-95 transition-all`}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            <div className={`space-y-${isTextArea ? 4 : 3}`}>
                {items?.map((item, i) => (
                    <div key={`${title}-${i}`} className="flex gap-3 items-start animate-in slide-in-from-right-4 duration-300">
                        <span className={`pt-3.5 font-black text-slate-200 text-xs w-${labels ? '16 shrink-0 text-right' : '6'}`}>
                            {labels ? labels(i, items.length) : `${i + 1}.`}
                        </span>
                        {isTextArea ? (
                            <textarea
                                className={`flex-1 border-2 border-slate-100 p-4 rounded-3xl text-sm font-medium h-24 ${borderFocus} outline-none transition-all bg-white shadow-sm resize-none`}
                                value={item}
                                onChange={e => onUpdate(i, e.target.value)}
                                placeholder={placeholder}
                            />
                        ) : (
                            <input
                                className={`flex-1 border-2 border-slate-100 p-3.5 rounded-2xl text-sm font-bold ${borderFocus} outline-none transition-all bg-white shadow-sm`}
                                value={item}
                                onChange={e => onUpdate(i, e.target.value)}
                                placeholder={placeholder}
                            />
                        )}
                        <button onClick={() => onRemove(i)} className={`p-3.5 text-slate-300 hover:text-red-500 transition-colors ${isTextArea ? 'mt-4' : ''}`}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ))}
                {(!items || items.length === 0) && (
                    <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                        {isTextArea && <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />}
                        <p className="text-sm font-medium">{emptyMessage || t('add_items_hint')}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

// --- Tag Selector Component (Memoized) ---
interface TagSelectorProps {
    title: string;
    options: Option[];
    selected: string[];
    onToggle: (id: string) => void;
    colorClass: string; // e.g., "blue"
}

export const TagSelector = memo(({ title, options, selected, onToggle, colorClass }: TagSelectorProps) => {
    // Derived classes
    const activeBg = `bg-${colorClass}-600`;
    const activeBorder = `border-${colorClass}-600`;

    return (
        <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{title}</label>
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const isActive = selected?.includes(opt.id);
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onToggle(opt.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isActive ? `${activeBg} text-white ${activeBorder} shadow-md scale-105` : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
});
