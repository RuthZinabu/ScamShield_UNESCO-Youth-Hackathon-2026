import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';
import so from './locales/so.json';
import ti from './locales/ti.json';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
  { code: 'om', label: 'Oromiffa', nativeLabel: 'Afaan Oromoo' },
  { code: 'so', label: 'Somali', nativeLabel: 'Soomaali' },
  { code: 'ti', label: 'Tigrinya', nativeLabel: 'ትግርኛ' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const LANG_KEY = 'Tebaqi_lang';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
    om: { translation: om },
    so: { translation: so },
    ti: { translation: ti },
  },
  lng: (() => {
    try {
      return localStorage.getItem(LANG_KEY) || 'en';
    } catch {
      return 'en';
    }
  })(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_KEY, lng);
  } catch {}
});

export default i18n;
