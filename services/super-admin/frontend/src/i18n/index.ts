import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

export const LANGUAGE_STORAGE_KEY = 'decoration_admin_lang';

const storedLanguage = (() => {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: storedLanguage === 'ar' || storedLanguage === 'en' ? storedLanguage : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Keep the choice for next visit, and persist it under the same key the
// language switcher reads on mount.
i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // best-effort only — a private-browsing tab or blocked storage just
    // means the choice doesn't survive a refresh, not a broken app
  }
});

export default i18n;
