'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import de from './translations/de.json';
import en from './translations/en.json';

export type Language = 'de' | 'en';

type TranslationValue = string | { [key: string]: TranslationValue };
type Translations = typeof de;

const translations: Record<Language, Translations> = { de, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getNestedValue(obj: TranslationValue, path: string): string | undefined {
  const keys = path.split('.');
  let current: TranslationValue = obj;

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, TranslationValue>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('language') as Language;
    if (stored && (stored === 'de' || stored === 'en')) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Update html lang attribute
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(translations[language], key);

      if (!value) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }

      if (!params) {
        return value;
      }

      // Replace placeholders like {name} with actual values
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() ?? `{${paramKey}}`;
      });
    },
    [language]
  );

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'de', setLanguage, t }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook for date-fns locale
export function useDateLocale() {
  const { language } = useTranslation();
  return language === 'de' ? 'de' : 'en-US';
}
