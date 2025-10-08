import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Import des traductions
import en from '../locales/en.json';
import fr from '../locales/fr.json';

// Types pour les traductions
type Translations = typeof fr;

// Configuration des traductions
const translations: Record<SupportedLocale, Translations> = {
  fr,
  en,
};

export type SupportedLocale = 'fr' | 'en';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, options?: any) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>('en');
  const [isRTL, setIsRTL] = useState(false);

  // Charger la langue sauvegardée au démarrage
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
          setLocaleState(savedLanguage as SupportedLocale);
        } else {
          // Détecter la langue du système
          const systemLocale = Localization.getLocales()[0]?.languageCode;
          const detectedLocale = systemLocale === 'fr' ? 'fr' : 'en';
          setLocaleState(detectedLocale);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
        // Fallback vers anglais
        setLocaleState('en');
      }
    };

    loadSavedLanguage();
  }, []);

  // Fonction pour changer de langue
  const setLocale = async (newLocale: SupportedLocale) => {
    try {
      setLocaleState(newLocale);
      await AsyncStorage.setItem('userLanguage', newLocale);
      
      // Mettre à jour la direction du texte (RTL pour l'arabe, etc.)
      // Pour l'instant, on ne supporte que fr et en, donc toujours LTR
      setIsRTL(false);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Fonction de traduction personnalisée
  const t = (key: string, options?: any): string => {
    const currentTranslations = translations[locale];
    
    // Fonction pour naviguer dans l'objet de traduction
    const getNestedValue = (obj: any, path: string): string => {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
      }, obj);
    };
    
    let translation = getNestedValue(currentTranslations, key);
    
    // Si la traduction n'existe pas, essayer avec la langue par défaut
    if (!translation && locale !== 'en') {
      translation = getNestedValue(translations.en, key);
    }
    
    // Si toujours pas de traduction, retourner la clé
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
      return key;
    }
    
    // Interpolation simple
    if (options && typeof translation === 'string') {
      return translation.replace(/\{(\w+)\}/g, (match, key) => {
        return options[key] !== undefined ? String(options[key]) : match;
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    locale,
    setLocale,
    t,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook pour les traductions avec typage
export function useTranslation() {
  const { t, locale, isRTL } = useLanguage();
  return { t, locale, isRTL };
}

// Fonction utilitaire pour formater les nombres selon la locale
export function formatNumber(number: number, locale: SupportedLocale): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(number);
}

// Fonction utilitaire pour formater les dates selon la locale
export function formatDate(date: Date | number, locale: SupportedLocale, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { ...defaultOptions, ...options }
  ).format(dateObj);
}

// Fonction utilitaire pour formater les devises selon la locale
export function formatCurrency(amount: number, locale: SupportedLocale, currency: string = 'EUR'): string {
  return new Intl.NumberFormat(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { style: 'currency', currency }
  ).format(amount);
}

// Fonction utilitaire pour formater les distances selon la locale
export function formatDistance(distance: number, locale: SupportedLocale, unit: 'metric' | 'imperial' = 'metric'): string {
  const isMetric = unit === 'metric';
  const distanceInKm = isMetric ? distance : distance * 1.60934;
  const distanceInMiles = isMetric ? distance * 0.621371 : distance;
  
  if (isMetric) {
    return new Intl.NumberFormat(
      locale === 'fr' ? 'fr-FR' : 'en-US',
      { style: 'unit', unit: 'kilometer' }
    ).format(distanceInKm);
  } else {
    return new Intl.NumberFormat(
      locale === 'fr' ? 'fr-FR' : 'en-US',
      { style: 'unit', unit: 'mile' }
    ).format(distanceInMiles);
  }
}

// Fonction utilitaire pour formater les températures selon la locale
export function formatTemperature(temperature: number, locale: SupportedLocale, unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
  const tempInCelsius = unit === 'celsius' ? temperature : (temperature - 32) * 5/9;
  const tempInFahrenheit = unit === 'fahrenheit' ? temperature : temperature * 9/5 + 32;
  
  if (unit === 'celsius') {
    return new Intl.NumberFormat(
      locale === 'fr' ? 'fr-FR' : 'en-US',
      { style: 'unit', unit: 'celsius' }
    ).format(tempInCelsius);
  } else {
    return new Intl.NumberFormat(
      locale === 'fr' ? 'fr-FR' : 'en-US',
      { style: 'unit', unit: 'fahrenheit' }
    ).format(tempInFahrenheit);
  }
}
