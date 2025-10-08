import { getAddressFromCoordinates, getFallbackLocation } from './geocoding';

// Cache pour éviter les appels API répétés
const locationCache = new Map<string, string>();
const failedRequests = new Set<string>(); // Cache des requêtes échouées
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 secondes

// Option pour désactiver complètement le géocodage en cas de problème
let GEOCODING_DISABLED = true; // Désactivé par défaut pour éviter les erreurs
const MAX_CONSECUTIVE_FAILURES = 5;
let consecutiveFailures = 0;

export const getLocationDisplay = async (lat: number | null, lng: number | null): Promise<string> => {
  if (!lat || !lng) return 'No location';
  
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  
  // Vérifier le cache d'abord
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }
  
  // Si le géocodage est désactivé, utiliser directement le fallback
  if (GEOCODING_DISABLED) {
    const fallback = getFallbackLocation(lat, lng);
    locationCache.set(cacheKey, fallback);
    return fallback;
  }
  
  // Si cette requête a déjà échoué plusieurs fois, ne pas réessayer
  if (failedRequests.has(cacheKey)) {
    const fallback = getFallbackLocation(lat, lng);
    locationCache.set(cacheKey, fallback);
    return fallback;
  }
  
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      // Utiliser le service OpenStreetMap pour obtenir l'adresse réelle
      const addressResult = await getAddressFromCoordinates(lat, lng);
      
      if (addressResult) {
        // Réinitialiser le compteur d'échecs consécutifs
        consecutiveFailures = 0;
        
        // Préférer la ville si disponible, sinon l'adresse complète
        const displayName = addressResult.city || addressResult.fullAddress;
        locationCache.set(cacheKey, displayName);
        return displayName;
      } else {
        // Si pas de résultat, essayer une fois de plus
        retryCount++;
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    } catch (error) {
      console.error(`Error getting location name (attempt ${retryCount + 1}):`, error);
      retryCount++;
      consecutiveFailures++;
      
      // Si trop d'échecs consécutifs, désactiver le géocodage temporairement
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn('Too many consecutive geocoding failures, disabling geocoding temporarily');
        GEOCODING_DISABLED = true;
        
        // Réactiver après 5 minutes
        setTimeout(() => {
          GEOCODING_DISABLED = false;
          consecutiveFailures = 0;
          console.log('Geocoding re-enabled');
        }, 5 * 60 * 1000);
      }
      
      if (retryCount < MAX_RETRIES) {
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
      } else {
        // Marquer cette requête comme échouée
        failedRequests.add(cacheKey);
        break;
      }
    }
  }
  
  // Fallback vers les coordonnées si le géocodage échoue
  const fallback = getFallbackLocation(lat, lng);
  locationCache.set(cacheKey, fallback);
  return fallback;
};

// Fonction synchrone pour les cas où on ne peut pas attendre
export const getLocationDisplaySync = (lat: number | null, lng: number | null): string => {
  if (!lat || !lng) return 'No location';
  
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  
  // Vérifier le cache d'abord
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey)!;
  }
  
  // Retourner les coordonnées en attendant le géocodage
  return getFallbackLocation(lat, lng);
};

// Fonctions pour contrôler le géocodage
export const enableGeocoding = () => {
  GEOCODING_DISABLED = false;
  console.log('Geocoding enabled');
};

export const disableGeocoding = () => {
  GEOCODING_DISABLED = true;
  console.log('Geocoding disabled');
};

export const isGeocodingEnabled = () => {
  return !GEOCODING_DISABLED;
};