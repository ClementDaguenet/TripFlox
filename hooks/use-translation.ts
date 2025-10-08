import { useTranslation as useI18nTranslation } from '../contexts/LanguageContext';

// Hook principal pour les traductions
export function useTranslation() {
  return useI18nTranslation();
}

// Hook spécialisé pour les traductions avec interpolation
export function useT() {
  const { t } = useI18nTranslation();
  return t;
}

// Hook pour les traductions avec validation des clés
export function useTypedTranslation() {
  const { t, locale, isRTL } = useI18nTranslation();
  
  // Fonction de traduction typée avec validation
  const translate = (key: string, options?: any): string => {
    try {
      return t(key, options);
    } catch (error) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key; // Retourner la clé si la traduction n'existe pas
    }
  };

  return {
    t: translate,
    locale,
    isRTL,
  };
}

// Hook pour les traductions avec fallback
export function useTranslationWithFallback() {
  const { t, locale, isRTL } = useI18nTranslation();
  
  // Fonction de traduction avec fallback
  const translateWithFallback = (key: string, fallback?: string, options?: any): string => {
    try {
      const translation = t(key, options);
      // Si la traduction retourne la clé (pas trouvée), utiliser le fallback
      if (translation === key && fallback) {
        return fallback;
      }
      return translation;
    } catch (error) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return fallback || key;
    }
  };

  return {
    t: translateWithFallback,
    locale,
    isRTL,
  };
}

// Hook pour les traductions conditionnelles
export function useConditionalTranslation() {
  const { t, locale, isRTL } = useI18nTranslation();
  
  // Fonction de traduction conditionnelle
  const translateConditional = (key: string, condition: boolean, trueKey?: string, falseKey?: string, options?: any): string => {
    try {
      if (condition && trueKey) {
        return t(trueKey, options);
      } else if (!condition && falseKey) {
        return t(falseKey, options);
      }
      return t(key, options);
    } catch (error) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
  };

  return {
    t: translateConditional,
    locale,
    isRTL,
  };
}

// Hook pour les traductions avec pluralisation
export function usePluralTranslation() {
  const { t, locale, isRTL } = useI18nTranslation();
  
  // Fonction de traduction avec pluralisation
  const translatePlural = (key: string, count: number, options?: any): string => {
    try {
      const pluralKey = count === 1 ? key : `${key}_plural`;
      return t(pluralKey, { count, ...options });
    } catch (error) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
  };

  return {
    t: translatePlural,
    locale,
    isRTL,
  };
}

// Hook pour les traductions avec interpolation avancée
export function useInterpolatedTranslation() {
  const { t, locale, isRTL } = useI18nTranslation();
  
  // Fonction de traduction avec interpolation avancée
  const translateInterpolated = (key: string, values: Record<string, any> = {}): string => {
    try {
      let translation = t(key, values);
      
      // Interpolation manuelle pour les cas complexes
      Object.keys(values).forEach(placeholder => {
        const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
        translation = translation.replace(regex, values[placeholder]);
      });
      
      return translation;
    } catch (error) {
      console.warn(`Translation key "${key}" not found for locale "${locale}"`);
      return key;
    }
  };

  return {
    t: translateInterpolated,
    locale,
    isRTL,
  };
}
