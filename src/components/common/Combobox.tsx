import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface ComboboxProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    className?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    label,
    disabled = false,
    className = ""
}) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter options based on query
    const filteredOptions = query === ''
        ? options
        : options.filter((option) =>
            option.toLowerCase().includes(query.toLowerCase())
        );

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // If value is empty and we have a query that matches nothing exact, maybe revert? 
                // For now, simple behavior: just close.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync internal query with external value when value changes externally
    // But we strictly want the input to reflect the *value* if selected, or *query* if typing
    useEffect(() => {
        // logic to keep input in sync is tricky. simpler:
        // Input displays: Query if open/typing, Value if closed/selected.
    }, [value]);

    const handleSelect = (option: string) => {
        onChange(option);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-xs font-bold text-slate-600 mb-1">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    className={`w-full text-sm border-slate-200 rounded-lg py-2 pl-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100 ${disabled ? 'cursor-not-allowed' : ''}`}
                    placeholder={placeholder}
                    value={isOpen ? query : value}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => {
                        setQuery(''); // Clear query to show all options initially or start fresh filtering
                        setIsOpen(true);
                    }}
                    disabled={disabled}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    {value && !disabled && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onChange(''); setQuery(''); }}
                            className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-60 overflow-auto py-1 text-sm focus:outline-none animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length === 0 ? (
                        <div className="cursor-default select-none py-2 px-4 text-slate-500 italic text-xs">
                            Nothing found.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option}
                                className={`cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 ${option === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700'}`}
                                onClick={() => handleSelect(option)}
                            >
                                <span className="block truncate">{option}</span>
                                {option === value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                        <Check className="w-4 h-4" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Combobox;
