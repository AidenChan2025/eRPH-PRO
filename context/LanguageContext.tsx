
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};

const STORAGE_KEY = 'erph_lang_pref';

const getInitialLanguage = (): Language => {
    // 1. Check LocalStorage first (User preference overrides browser)
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && Object.values(Language).includes(saved as Language)) {
            return saved as Language;
        }
    } catch (e) {
        console.warn("LocalStorage access denied");
    }

    // 2. Check Browser Language
    if (typeof navigator !== 'undefined') {
        const lang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
        
        if (lang.startsWith('zh')) return Language.ZH;
        if (lang.startsWith('ms')) return Language.MS;
        if (lang.startsWith('ta')) return Language.TA;
        // Jawi isn't a standard browser language code usually, defaulting others to EN
    }

    // 3. Default Fallback
    return Language.EN; 
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  const setLanguage = (lang: Language) => {
      setLanguageState(lang);
      try {
          localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
          // Ignore storage errors
      }
  };

  useEffect(() => {
    document.body.dir = language === Language.JV ? 'rtl' : 'ltr';
    document.body.className = `bg-slate-50 text-slate-900 antialiased transition-all duration-300 ${
      language === Language.JV ? 'font-jawi text-lg' : 
      language === Language.TA ? 'font-tamil' :
      language === Language.ZH ? 'font-chinese' : 'font-sans'
    }`;
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
