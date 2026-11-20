import { ServiceCategory } from '../types';

/**
 * Official registry of all authorized gateway providers.
 */
export const MORX_ALLOWABLE_PROVIDERS = [
  'youtube',
  'openweather',
  'open_meteo',
  'google_maps',
  'mapbox',
  'google_routes',
  'internal_tsp',
  'osrmroute',
  'ip_geolocation',
  'frankfurter',
  'gnews',
  'instagram',
  'apify',
  'rapidapi',
] as const;

export type MorxAllowableProvider = (typeof MORX_ALLOWABLE_PROVIDERS)[number];

/**
 * Official registry of all authorized gateway endpoints.
 */
export const MORX_ALLOWABLE_ENDPOINTS = [
  '/api/v1/videos/search',
  '/api/v1/weather/current',
  '/api/v1/weather/forecast',
  '/api/v1/weather/air-quality',
  '/api/v1/maps/geocode',
  '/api/v1/maps/reverse-geocode',
  '/api/v1/maps/places',
  '/api/v1/maps/directions',
  '/api/v1/maps/isochrone',
  '/api/v1/maps/distance-matrix',
  '/api/v1/routes/directions',
  '/api/v1/routes/optimize',
  '/api/v1/routes/matrix',
  '/api/v1/utils/ip-lookup',
  '/api/v1/finance/exchange',
  '/api/v1/news/search',
  '/api/v1/instagram/media',
  '/api/v1/instagram/user',
  '/api/v1/instagram/reels/search',
  '/api/instagram/reels/search',
  '/api/v1/instagram/posts/search',
  '/api/instagram/posts/search',
  '/api/v1/gateway/clients',
  '/api/v1/gateway/metrics',
  '/api/v1/gateway/health',
] as const;

export type MorxAllowableEndpoint = (typeof MORX_ALLOWABLE_ENDPOINTS)[number];

export class AllowableCatalog {
  /**
   * Check if a given provider name is in the allowable list
   */
  static isAllowableProvider(provider: string, clientAllowedList?: (string | '*')[]): boolean {
    const normalized = provider.toLowerCase().replace(/[-_]/g, '');

    // 1. If client has an explicit allowable list
    if (clientAllowedList && clientAllowedList.length > 0) {
      if (clientAllowedList.includes('*')) return true;
      return clientAllowedList.some(
        (p) => p === provider || p.toLowerCase().replace(/[-_]/g, '') === normalized
      );
    }

    // 2. Default check against gateway allowable providers
    return MORX_ALLOWABLE_PROVIDERS.some(
      (p) => p === provider || p.toLowerCase().replace(/[-_]/g, '') === normalized
    );
  }

  /**
   * Check if a given request endpoint path is in the allowable list
   */
  static isAllowableEndpoint(endpointPath: string, clientAllowedList?: (string | '*')[]): boolean {
    const cleanPath = endpointPath.split('?')[0].replace(/\/+$/, '');

    // 1. If client has an explicit allowable list
    if (clientAllowedList && clientAllowedList.length > 0) {
      if (clientAllowedList.includes('*')) return true;
      return clientAllowedList.some((pattern) => {
        const cleanPattern = pattern.split('?')[0].replace(/\/+$/, '');
        if (cleanPattern === cleanPath) return true;
        if (cleanPattern.endsWith('/*') && cleanPath.startsWith(cleanPattern.slice(0, -2))) return true;
        if (cleanPattern.endsWith('*') && cleanPath.startsWith(cleanPattern.slice(0, -1))) return true;
        return false;
      });
    }

    // 2. Default check against gateway allowable endpoints
    return MORX_ALLOWABLE_ENDPOINTS.some((ep) => ep === cleanPath);
  }

  /**
   * Returns list of all allowable providers
   */
  static getAllAllowableProviders(): string[] {
    return [...MORX_ALLOWABLE_PROVIDERS];
  }

  /**
   * Returns list of all allowable endpoints
   */
  static getAllAllowableEndpoints(): string[] {
    return [...MORX_ALLOWABLE_ENDPOINTS];
  }
}
