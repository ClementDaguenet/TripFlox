export interface AddressResult {
  address: string;
  city: string;
  country: string;
  fullAddress: string;
}

// Cache pour éviter les appels répétés
const geocodingCache = new Map<string, AddressResult | null>();
const lastRequestTime = new Map<string, number>();
const REQUEST_DELAY = 1000; // 1 seconde entre les requêtes

// Fonction utilitaire pour fetch avec timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, timeoutMs);

    fetch(url, options)
      .then(response => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<AddressResult | null> => {
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  // Vérifier le cache d'abord
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey)!;
  }
  
  // Vérifier le délai entre les requêtes
  const now = Date.now();
  const lastRequest = lastRequestTime.get('global') || 0;
  if (now - lastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - (now - lastRequest)));
  }
  
  try {
    lastRequestTime.set('global', Date.now());
    
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`,
      {
        headers: {
          'User-Agent': 'WoxTripFlox/1.0 (Travel App)',
        },
      },
      10000 // 10 secondes de timeout
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit - attendre plus longtemps
        console.warn('OpenStreetMap rate limit hit, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.address) {
      geocodingCache.set(cacheKey, null);
      return null;
    }

    const address = data.address;
    
    // Extraction des informations d'adresse
    const streetNumber = address.house_number || '';
    const street = address.road || address.pedestrian || address.footway || '';
    const city = address.city || address.town || address.village || address.hamlet || address.municipality || '';
    const country = address.country || '';
    
    // Construction de l'adresse complète
    const streetAddress = `${streetNumber} ${street}`.trim();
    const fullAddress = [streetAddress, city, country]
      .filter(part => part && part.trim())
      .join(', ');

    const result = {
      address: streetAddress,
      city,
      country,
      fullAddress
    };
    
    // Mettre en cache le résultat
    geocodingCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('OpenStreetMap geocoding error:', error);
    // Mettre en cache l'échec pour éviter les appels répétés
    geocodingCache.set(cacheKey, null);
    return null;
  }
};

export interface CoordinatesResult {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export const getCoordinatesFromAddress = async (
  address: string
): Promise<CoordinatesResult | null> => {
  const cacheKey = `forward:${address}`;
  
  // Vérifier le cache d'abord
  if (geocodingCache.has(cacheKey)) {
    const cached = geocodingCache.get(cacheKey);
    if (cached) {
      return {
        latitude: parseFloat(cached.address.split(',')[0]) || 0,
        longitude: parseFloat(cached.address.split(',')[1]) || 0,
        address: cached.fullAddress,
        city: cached.city,
        country: cached.country
      };
    }
    return null;
  }
  
  // Vérifier le délai entre les requêtes
  const now = Date.now();
  const lastRequest = lastRequestTime.get('global') || 0;
  if (now - lastRequest < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - (now - lastRequest)));
  }
  
  try {
    lastRequestTime.set('global', Date.now());
    
    const encodedAddress = encodeURIComponent(address);
    const response = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&addressdetails=1&accept-language=fr&limit=1`,
      {
        headers: {
          'User-Agent': 'WoxTripFlox/1.0 (Travel App)',
        },
      },
      10000 // 10 secondes de timeout
    );
    
    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit - attendre plus longtemps
        console.warn('OpenStreetMap rate limit hit, waiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      geocodingCache.set(cacheKey, null);
      return null;
    }

    const result = data[0];
    const addressDetails = result.address || {};
    
    const coordinatesResult = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
      city: addressDetails.city || addressDetails.town || addressDetails.village || '',
      country: addressDetails.country || ''
    };
    
    // Mettre en cache le résultat
    geocodingCache.set(cacheKey, {
      address: `${coordinatesResult.latitude},${coordinatesResult.longitude}`,
      city: coordinatesResult.city,
      country: coordinatesResult.country,
      fullAddress: coordinatesResult.address
    });
    
    return coordinatesResult;
  } catch (error) {
    console.error('OpenStreetMap forward geocoding error:', error);
    // Mettre en cache l'échec pour éviter les appels répétés
    geocodingCache.set(cacheKey, null);
    return null;
  }
};

export const getFallbackLocation = (lat: number, lng: number): string => {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};