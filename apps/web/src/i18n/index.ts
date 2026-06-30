import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import zh from './locales/zh.json';
import en from './locales/en.json';
import vi from './locales/vi.json';
import th from './locales/th.json';
import my from './locales/my.json';

// i18n configuration
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      zh: zh,
      en: en,
      vi: vi,
      th: th,
      my: my,
    },
    fallbackLng: 'zh',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'soulai_language',
    },
  });

export default i18n;
