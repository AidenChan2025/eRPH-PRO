
import React, { useState } from 'react';
import Button from './Button';
import { Sparkles, Key, ExternalLink, ShieldCheck, ChevronRight, ChevronLeft, Cpu, Globe, CheckCircle2, Info } from 'lucide-react';

declare const window: any;

interface GeminiWizardProps {
  onSuccess: () => void;
}

const GeminiWizard: React.FC<GeminiWizardProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);

  const handleFinalConnect = async () => {
    await window.aistudio.openSelectKey();
    onSuccess();
  };

  const renderStep1 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
        <Sparkles className="w-8 h-8" />
      </div>
      <div className="text-center space-y-3 px-2">
        <h4 className="text-lg font-bold text-slate-800">Sustainable AI for Teachers</h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          Traditional AI tools often charge high monthly fees. eRPH Pro stays <span className="font-bold text-blue-600">low-cost</span> by letting you use your own official Google Gemini quota.
        </p>
        <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-2 border border-slate-100">
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Google offers a generous FREE tier for personal use.</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>No middle-man markups on your AI usage.</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Complete privacy: Your data stays in your account.</span>
            </div>
        </div>
      </div>
      <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-blue-200" onClick={() => setStep(2)}>
        Show me how to get a key <ChevronRight className="ml-2 w-4 h-4"/>
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
        <Globe className="w-8 h-8" />
      </div>
      <div className="text-center space-y-2">
        <h4 className="text-lg font-bold text-slate-800">Getting Your Private Key</h4>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Follow these 3 simple sub-steps:</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
            <div className="text-xs text-slate-600 leading-normal">
                Click the <span className="font-bold text-blue-600">Blue Button</span> below to open Google's AI Studio (opens in a new tab).
            </div>
        </div>
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
            <div className="text-xs text-slate-600 leading-normal">
                Sign in with your Google Account and click <span className="font-bold text-slate-800">"Get API key"</span> in the sidebar.
            </div>
        </div>
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
            <div className="text-xs text-slate-600 leading-normal">
                Click <span className="font-bold text-indigo-600">"Create API key"</span>. Once created, come back here and click Next.
            </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-sm transition-all border-2 border-blue-100 shadow-sm"
        >
          1. Go to Google AI Studio <ExternalLink className="w-4 h-4" />
        </a>
        <div className="flex gap-2">
           <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setStep(1)}><ChevronLeft className="mr-1 w-4 h-4"/> Back</Button>
           <Button className="flex-[2] rounded-xl font-bold shadow-lg shadow-blue-100" onClick={() => setStep(3)}>2. I have my key <ChevronRight className="ml-1 w-4 h-4"/></Button>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
        <Key className="w-8 h-8" />
      </div>
      <div className="text-center space-y-3 px-2">
        <h4 className="text-lg font-bold text-slate-800">Final Step: Secure Link</h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          When you click finish, a Google window will ask for your key. Simply paste the key you copied into that window.
        </p>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Safety & Privacy</p>
            <p className="text-[10px] font-bold text-emerald-600 leading-normal uppercase">
                YOUR KEY IS NEVER STORED ON OUR SERVERS. IT STAYS INSIDE YOUR BROWSER SESSION ONLY.
            </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
         <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 h-14 font-black text-lg rounded-2xl" onClick={handleFinalConnect}>
           <Cpu className="mr-2 w-6 h-6"/> Finish & Connect
         </Button>
         <Button variant="ghost" className="w-full rounded-xl text-slate-400" onClick={() => setStep(2)}>Go Back to Instructions</Button>
      </div>
    </div>
  );

  return (
    <div className="py-2">
      {/* Stepper Header */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-10 h-1 rounded-full transition-all ${step > s ? 'bg-blue-600' : 'bg-slate-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="min-h-[320px] flex flex-col justify-center">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      <div className="mt-8 pt-6 border-t flex items-center gap-3 px-2">
        <div className="p-1.5 bg-slate-100 rounded-lg">
            <Info className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-[10px] font-medium text-slate-400 leading-tight">
            Having trouble? Most teachers use a personal @gmail.com account for the easiest setup.
        </p>
      </div>
    </div>
  );
};

export default GeminiWizard;
