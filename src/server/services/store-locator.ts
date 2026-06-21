/**
 * Geolocation Service
 * Finds nearest stores using GPS coordinates and IP-based location fallback
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface StoreLocation {
  id: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates: Coordinates;
  phone: string;
  openingHours: string;
  acceptsVouchers: boolean;
  distance?: number;
  merchantId?: string;
}

export interface IPLocationData {
  city: string;
  region: string;
  country: string;
  coordinates: Coordinates;
  timezone: string;
}

// Major South African grocery store chains with locations
const STORE_LOCATIONS: StoreLocation[] = [
  // Johannesburg - Shoprite
  {
    id: 'shoprite-sandton-city',
    name: 'Shoprite Sandton City',
    brand: 'Shoprite',
    address: '83 Rivonia Rd, Sandhurst',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2196',
    coordinates: { latitude: -26.1076, longitude: 28.0567 },
    phone: '011 783 8500',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  {
    id: 'shoprite-fourways',
    name: 'Shoprite Fourways',
    brand: 'Shoprite',
    address: 'Fourways Mall, Witkoppen Rd',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2055',
    coordinates: { latitude: -26.0123, longitude: 28.0068 },
    phone: '011 465 1800',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  // Johannesburg - Pick n Pay
  {
    id: 'pnp-rosebank',
    name: 'Pick n Pay Rosebank',
    brand: 'Pick n Pay',
    address: 'Rosebank Mall, Bath Ave',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2196',
    coordinates: { latitude: -26.1463, longitude: 28.0417 },
    phone: '011 788 5660',
    openingHours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM',
    acceptsVouchers: true,
  },
  {
    id: 'pnp-mall-of-africa',
    name: 'Pick n Pay Mall of Africa',
    brand: 'Pick n Pay',
    address: 'Mall of Africa, Lone Creek',
    city: 'Midrand',
    province: 'Gauteng',
    postalCode: '1685',
    coordinates: { latitude: -25.9487, longitude: 28.1158 },
    phone: '010 001 6420',
    openingHours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM',
    acceptsVouchers: true,
  },
  // Pretoria - Shoprite
  {
    id: 'shoprite-menlyn',
    name: 'Shoprite Menlyn Park',
    brand: 'Shoprite',
    address: 'Menlyn Park, Atterbury Rd',
    city: 'Pretoria',
    province: 'Gauteng',
    postalCode: '0181',
    coordinates: { latitude: -25.7847, longitude: 28.2773 },
    phone: '012 368 0600',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  // Cape Town - Shoprite
  {
    id: 'shoprite-v&a-waterfront',
    name: 'Shoprite V&A Waterfront',
    brand: 'Shoprite',
    address: 'Victoria Wharf, V&A Waterfront',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    coordinates: { latitude: -33.9054, longitude: 18.4191 },
    phone: '021 418 5843',
    openingHours: 'Mon-Sat: 8AM-9PM, Sun: 8AM-7PM',
    acceptsVouchers: true,
  },
  {
    id: 'shoprite-canal-walk',
    name: 'Shoprite Canal Walk',
    brand: 'Shoprite',
    address: 'Canal Walk Shopping Centre',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '7441',
    coordinates: { latitude: -33.8909, longitude: 18.5123 },
    phone: '021 555 3725',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  // Cape Town - Pick n Pay
  {
    id: 'pnp-cavendish',
    name: 'Pick n Pay Cavendish Square',
    brand: 'Pick n Pay',
    address: 'Cavendish Square, Claremont',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '7708',
    coordinates: { latitude: -33.9774, longitude: 18.4631 },
    phone: '021 657 5300',
    openingHours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM',
    acceptsVouchers: true,
  },
  // Durban - Shoprite
  {
    id: 'shoprite-gateway',
    name: 'Shoprite Gateway',
    brand: 'Shoprite',
    address: 'Gateway Theatre of Shopping, Umhlanga',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '4319',
    coordinates: { latitude: -29.7308, longitude: 31.0669 },
    phone: '031 566 1800',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  // Durban - Pick n Pay
  {
    id: 'pnp-pavilion',
    name: 'Pick n Pay Pavilion',
    brand: 'Pick n Pay',
    address: 'The Pavilion, Jack Martens Drive',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '3629',
    coordinates: { latitude: -29.8194, longitude: 30.9786 },
    phone: '031 265 0300',
    openingHours: 'Mon-Sat: 7AM-9PM, Sun: 8AM-7PM',
    acceptsVouchers: true,
  },
  // Port Elizabeth - Shoprite
  {
    id: 'shoprite-walmer-park',
    name: 'Shoprite Walmer Park',
    brand: 'Shoprite',
    address: 'Walmer Park Shopping Centre',
    city: 'Port Elizabeth',
    province: 'Eastern Cape',
    postalCode: '6070',
    coordinates: { latitude: -33.9699, longitude: 25.5823 },
    phone: '041 581 1800',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
  // Bloemfontein - Shoprite
  {
    id: 'shoprite-mimosa-mall',
    name: 'Shoprite Mimosa Mall',
    brand: 'Shoprite',
    address: 'Mimosa Mall, Kellner Street',
    city: 'Bloemfontein',
    province: 'Free State',
    postalCode: '9301',
    coordinates: { latitude: -29.0852, longitude: 26.1596 },
    phone: '051 436 1800',
    openingHours: 'Mon-Sat: 8AM-8PM, Sun: 8AM-6PM',
    acceptsVouchers: true,
  },
];

/**
 * Get user's location using browser Geolocation API (GPS)
 */
export async function getUserLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

/**
 * Get approximate location based on IP address (fallback)
 */
export async function getLocationByIP(): Promise<IPLocationData> {
  try {
    // Using ipapi.co free tier (no API key needed, 30k requests/month)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country_name || 'South Africa',
      coordinates: {
        latitude: data.latitude || -26.2041,
        longitude: data.longitude || 28.0473,
      },
      timezone: data.timezone || 'Africa/Johannesburg',
    };
  } catch (error) {
    // Fallback to Johannesburg coordinates
    return {
      city: 'Johannesburg',
      region: 'Gauteng',
      country: 'South Africa',
      coordinates: {
        latitude: -26.2041,
        longitude: 28.0473,
      },
      timezone: 'Africa/Johannesburg',
    };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest stores to given coordinates
 */
export function findNearestStores(
  userLocation: Coordinates,
  maxResults: number = 10,
  maxDistance: number = 50 // km
): StoreLocation[] {
  const storesWithDistance = STORE_LOCATIONS.map((store) => ({
    ...store,
    distance: calculateDistance(userLocation, store.coordinates),
  }))
    .filter((store) => store.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);

  return storesWithDistance;
}

/**
 * Get stores by province
 */
export function getStoresByProvince(province: string): StoreLocation[] {
  return STORE_LOCATIONS.filter((store) => store.province.toLowerCase() === province.toLowerCase());
}

/**
 * Get stores by city
 */
export function getStoresByCity(city: string): StoreLocation[] {
  return STORE_LOCATIONS.filter((store) => store.city.toLowerCase() === city.toLowerCase());
}

/**
 * Get stores by brand
 */
export function getStoresByBrand(brand: string): StoreLocation[] {
  return STORE_LOCATIONS.filter((store) => store.brand.toLowerCase() === brand.toLowerCase());
}

/**
 * Search stores by name or address
 */
export function searchStores(query: string): StoreLocation[] {
  const lowerQuery = query.toLowerCase();
  return STORE_LOCATIONS.filter(
    (store) =>
      store.name.toLowerCase().includes(lowerQuery) ||
      store.address.toLowerCase().includes(lowerQuery) ||
      store.city.toLowerCase().includes(lowerQuery) ||
      store.brand.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all unique provinces
 */
export function getAllProvinces(): string[] {
  return Array.from(new Set(STORE_LOCATIONS.map((store) => store.province))).sort();
}

/**
 * Get all unique cities
 */
export function getAllCities(): string[] {
  return Array.from(new Set(STORE_LOCATIONS.map((store) => store.city))).sort();
}

/**
 * Get all unique brands
 */
export function getAllBrands(): string[] {
  return Array.from(new Set(STORE_LOCATIONS.map((store) => store.brand))).sort();
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`;
  }
  return `${km.toFixed(1)}km away`;
}

/**
 * Get directions URL (Google Maps)
 */
export function getDirectionsUrl(destination: Coordinates, origin?: Coordinates): string {
  const baseUrl = 'https://www.google.com/maps/dir/';
  if (origin) {
    return `${baseUrl}${origin.latitude},${origin.longitude}/${destination.latitude},${destination.longitude}`;
  }
  return `${baseUrl}/${destination.latitude},${destination.longitude}`;
}

/**
 * Main function: Find stores near user with automatic location detection
 */
export async function findStoresNearMe(
  maxResults: number = 10
): Promise<{ stores: StoreLocation[]; userLocation: Coordinates; method: 'gps' | 'ip' }> {
  try {
    // Try GPS first
    const gpsLocation = await getUserLocation();
    const stores = findNearestStores(gpsLocation, maxResults);

    return {
      stores,
      userLocation: gpsLocation,
      method: 'gps',
    };
  } catch (gpsError) {
    console.warn('GPS location failed, falling back to IP location:', gpsError);

    // Fallback to IP-based location
    const ipLocation = await getLocationByIP();
    const stores = findNearestStores(ipLocation.coordinates, maxResults);

    return {
      stores,
      userLocation: ipLocation.coordinates,
      method: 'ip',
    };
  }
}
