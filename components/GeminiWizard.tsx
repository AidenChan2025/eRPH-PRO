
import React, { useState } from 'react';
import Button from './Button';
import { Sparkles, Key, ExternalLink, ShieldCheck, ChevronRight, ChevronLeft, Cpu, Globe, CheckCircle2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

declare const window: any;

interface GeminiWizardProps {
  onSuccess: () => void;
}

const GeminiWizard: React.FC<GeminiWizardProps> = ({ onSuccess }) => {
    const { t } = useTranslation();
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
        <h4 className="text-lg font-bold text-slate-800">{t('sustainableAiForTeachers')}</h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t('traditionalAiToolsOftenCharge')}<span className="font-bold text-blue-600">{t('lowcost')}</span> {t('byLettingYouUseYour')}</p>
        <div className="bg-slate-50 p-4 rounded-2xl text-left space-y-2 border border-slate-100">
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('googleOffersAGenerousFree')}</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('noMiddlemanMarkupsOnYour')}</span>
            </div>
            <div className="flex gap-2 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('completePrivacyYourDataStays')}</span>
            </div>
        </div>
      </div>
      <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-blue-200" onClick={() => setStep(2)}>
        {t('showMeHowToGet')}<ChevronRight className="ml-2 w-4 h-4"/>
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
        <Globe className="w-8 h-8" />
      </div>
      <div className="text-center space-y-2">
        <h4 className="text-lg font-bold text-slate-800">{t('gettingYourPrivateKey')}</h4>
        <p className="text-xs text-slate-500 uppercase font-black tracking-widest">{t('followThese3SimpleSubsteps')}</p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
            <div className="text-xs text-slate-600 leading-normal">
                {t('clickThe')}<span className="font-bold text-blue-600">{t('blueButton')}</span> {t('belowToOpenGooglesAi')}</div>
        </div>
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
            <div className="text-xs text-slate-600 leading-normal">
                {t('signInWithYourGoogle')}<span className="font-bold text-slate-800">{t('getApiKey')}</span> {t('inTheSidebar')}</div>
        </div>
        <div className="flex gap-4 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
            <div className="text-xs text-slate-600 leading-normal">
                {t('click')}<span className="font-bold text-indigo-600">{t('createApiKey')}</span>{t('onceCreatedComeBackHere')}</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-sm transition-all border-2 border-blue-100 shadow-sm"
        >
          {t('1GoToGoogleAi')}<ExternalLink className="w-4 h-4" />
        </a>
        <div className="flex gap-2">
           <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setStep(1)}><ChevronLeft className="mr-1 w-4 h-4"/> {t('back')}</Button>
           <Button className="flex-[2] rounded-xl font-bold shadow-lg shadow-blue-100" onClick={() => setStep(3)}>{t('2IHaveMyKey')}<ChevronRight className="ml-1 w-4 h-4"/></Button>
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
        <h4 className="text-lg font-bold text-slate-800">{t('finalStepSecureLink')}</h4>
        <p className="text-sm text-slate-500 leading-relaxed">
          {t('whenYouClickFinishA')}</p>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">{t('safetyPrivacy')}</p>
            <p className="text-[10px] font-bold text-emerald-600 leading-normal uppercase">
                {t('yourKeyIsNeverStored')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
         <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 h-14 font-black text-lg rounded-2xl" onClick={handleFinalConnect}>
           <Cpu className="mr-2 w-6 h-6"/> {t('finishConnect')}</Button>
         <Button variant="ghost" className="w-full rounded-xl text-slate-400" onClick={() => setStep(2)}>{t('goBackToInstructions')}</Button>
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
            {t('havingTroubleMostTeachersUse')}</p>
      </div>
    </div>
  );
};

export default GeminiWizard;
