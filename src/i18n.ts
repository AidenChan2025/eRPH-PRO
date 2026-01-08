import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ms from './locales/ms.json';
import zh from './locales/zh.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ms: { translation: ms },
            zh: { translation: zh },
        },
        fallbackLng: 'en',
        debug: false,
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
    });

export default i18n;
