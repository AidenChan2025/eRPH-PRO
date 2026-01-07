
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { Sparkles, X, Wand2, Loader2, AlertCircle, Key, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { generateLessonPlan } from '../services/geminiService';
import { LessonPlan } from '../types';
import GeminiWizard from './GeminiWizard';

declare const window: any;

interface AIPlanGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (plan: Partial<LessonPlan>) => void;
  defaultSubject?: string;
  defaultGrade?: string;
}

const AIPlanGeneratorModal: React.FC<AIPlanGeneratorModalProps> = ({ isOpen, onClose, onGenerated, defaultSubject, defaultGrade }) => {
  const [subject, setSubject] = useState(defaultSubject || '');
  const [grade, setGrade] = useState(defaultGrade || '');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      checkKey();
    }
  }, [isOpen]);

  const checkKey = async () => {
    const selected = await window.aistudio.hasSelectedApiKey();
    setHasKey(selected);
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!subject || !grade || !topic) return;
    setLoading(true);
    setError(null);
    try {
      const generated = await generateLessonPlan(subject, grade, topic);
      onGenerated(generated);
      onClose();
    } catch (e: any) {
      if (e.message === "API_KEY_NOT_FOUND") {
        setHasKey(false);
        setError("Gemini connection lost. Please reconnect your quota.");
      } else {
        setError(e.message || "Failed to communicate with Gemini.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg shadow-2xl overflow-hidden border-blue-100 rounded-3xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative shadow-lg">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">AI Lesson Assistant</h3>
              <p className="text-blue-100 text-sm opacity-90 font-medium">Generate high-quality RPH in seconds.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!hasKey ? (
            <GeminiWizard onSuccess={() => setHasKey(true)} />
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex gap-2 text-sm text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                  <input 
                    className="w-full border-2 border-slate-100 p-2.5 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Grade</label>
                  <input 
                    className="w-full border-2 border-slate-100 p-2.5 rounded-xl text-sm font-bold focus:border-blue-500 outline-none transition-all" 
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    placeholder="e.g. Year 4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Lesson Topic / Focus</label>
                <textarea 
                  className="w-full border-2 border-slate-100 p-3 rounded-xl text-sm font-medium h-24 resize-none focus:border-blue-500 outline-none transition-all" 
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Addition within 1000"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-xl h-11" onClick={onClose} disabled={loading}>Cancel</Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-200 rounded-xl h-11" 
                  onClick={handleGenerate} 
                  disabled={loading || !topic}
                  isLoading={loading}
                >
                  {!loading && <Sparkles className="w-4 h-4 mr-2" />}
                  Generate with Gemini
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AIPlanGeneratorModal;
