
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { Sparkles, X, Check, Loader2, Key, ShieldCheck, ExternalLink, Wand2, Cpu } from 'lucide-react';
import { suggestFieldContent } from '../services/geminiService';
import { LessonPlan } from '../types';
import GeminiWizard from './GeminiWizard';

declare const window: any;

interface FieldSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  field: string;
  context: Partial<LessonPlan>;
}

const FieldSuggestionModal: React.FC<FieldSuggestionModalProps> = ({ isOpen, onClose, onSelect, field, context }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkKey = async () => {
    const selected = await window.aistudio.hasSelectedApiKey();
    setHasKey(selected);
    return selected;
  };

  useEffect(() => {
    if (isOpen) {
      const loadSuggestions = async () => {
        const keySelected = await checkKey();
        if (!keySelected) return;

        setLoading(true);
        setError(null);
        try {
          const results = await suggestFieldContent(field, context);
          setSuggestions(results);
        } catch (e: any) {
          if (e.message === "API_KEY_NOT_FOUND") {
            setHasKey(false);
          } else {
            setError(e.message || "Gemini engine busy. Please retry.");
          }
        } finally {
          setLoading(false);
        }
      };
      loadSuggestions();
    }
  }, [isOpen, field, hasKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <Card className="w-full max-w-md shadow-2xl flex flex-col max-h-[75vh] border-0 rounded-3xl overflow-hidden">
        <div className="p-5 border-b bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 tracking-tight uppercase text-sm">AI Assist: {field}</h3>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400"/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 custom-scrollbar">
          {!hasKey ? (
            <GeminiWizard onSuccess={() => setHasKey(true)} />
          ) : loading ? (
            <div className="flex flex-col items-center py-16 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <Sparkles className="w-4 h-4 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Consulting Gemini AI...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic text-sm px-6">
              {error || "Gemini couldn't find specific suggestions. Add more context to your lesson plan and try again."}
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => { onSelect(s); onClose(); }}
                  className="w-full text-left p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium hover:border-blue-400 hover:bg-blue-50 transition-all group relative shadow-sm"
                >
                  <span className="block pr-8 text-slate-700 leading-relaxed">{s}</span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                    <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-white flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose} className="font-bold uppercase tracking-widest text-[10px]">Close</Button>
        </div>
      </Card>
    </div>
  );
};

export default FieldSuggestionModal;
