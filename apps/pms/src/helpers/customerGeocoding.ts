import { type Customer } from '@trinserhof/types';

export type LatLng = { lat: number; lng: number };

// Cached geocoding results, keyed by the normalized address string. A `null`
// value records a negative result (address geocoded but returned nothing) so we
// don't keep re-querying addresses that Google can't resolve.
export type GeocodeCache = Record<string, LatLng | null>;

const CACHE_KEY = 'customer-geocode-cache-v1';

// Builds a human-readable, comma-separated address from a customer's address
// fields, skipping the ones that are empty. Returns '' when there's nothing
// location-bearing to geocode.
export const buildAddress = (customer: Customer): string => {
  const street = [customer.street, customer.streetNumber]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const cityLine = [customer.postcode, customer.city]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  const country = customer.country?.trim();

  return [street, cityLine, country].filter((part) => part && part.length > 0).join(', ');
};

// A stable cache key: lowercased, whitespace-collapsed address so trivial
// formatting differences still hit the same cache entry.
export const addressCacheKey = (address: string): string =>
  address.toLowerCase().replace(/\s+/g, ' ').trim();

export const loadGeocodeCache = (): GeocodeCache => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeocodeCache) : {};
  } catch {
    return {};
  }
};

export const saveGeocodeCache = (cache: GeocodeCache): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota / serialization errors - the cache is only an optimization.
  }
};

// Collapses points that share a coordinate into a single weighted point, so a
// city that many customers come from shows up as a brighter hot-spot.
export const toWeightedPoints = (points: LatLng[]): Array<LatLng & { weight: number }> => {
  const byKey = new Map<string, LatLng & { weight: number }>();
  for (const point of points) {
    // ~11m precision - enough to merge identical geocodes without lumping
    // distinct addresses together.
    const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      byKey.set(key, { ...point, weight: 1 });
    }
  }
  return Array.from(byKey.values());
};
