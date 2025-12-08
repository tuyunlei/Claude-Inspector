
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './locales';

type Language = 'en' | 'zh';

// Helper to access nested keys
function getNested(obj: any, path: string) {
  return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
}

const I18nContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, args?: Record<string, string>) => any;
}>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Auto-detect
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language;
        if (lang.startsWith('zh')) return 'zh';
    }
    return 'en';
  });

  const t = (key: string, args?: Record<string, string>) => {
    let text = getNested(translations[language], key);
    if (!text) return key;
    if (args) {
        Object.entries(args).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, v);
        });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};
