import {
  IProvider,
  ProviderCapability,
  ServiceCategory,
} from '../types';
import { YouTubeProvider } from '../providers/videos/youtube';
import { OpenWeatherProvider } from '../providers/weather/openweather';
import { OpenMeteoProvider } from '../providers/weather/open-meteo';
import { GoogleMapsProvider } from '../providers/maps/google-maps';
import { MapboxProvider } from '../providers/maps/mapbox';
import { GoogleRoutesProvider } from '../providers/routing/google-routes';
import { InternalTspProvider } from '../providers/routing/internal-tsp';
import { OSRMRouteProvider } from '../providers/routing/osrmroute';
import { InstagramProvider } from '../providers/social/instagram';
import { IpGeolocationProvider } from '../providers/utils/ip-geolocation';
import { FrankfurterProvider } from '../providers/finance/frankfurter';
import { GNewsProvider } from '../providers/news/gnews';
import { VidoraProvider } from '../providers/streaming/vidora';

export class ProviderRegistry {
  private static providers: Map<ServiceCategory, IProvider[]> = new Map();
  private static capabilities: Map<string, ProviderCapability> = new Map();

  static {
    // 1. Register Providers
    this.register(new YouTubeProvider());
    this.register(new OpenWeatherProvider());
    this.register(new OpenMeteoProvider());
    this.register(new GoogleMapsProvider());
    this.register(new MapboxProvider());
    this.register(new GoogleRoutesProvider());
    this.register(new InternalTspProvider());
    this.register(new OSRMRouteProvider());
    this.register(new InstagramProvider());
    this.register(new IpGeolocationProvider());
    this.register(new FrankfurterProvider());
    this.register(new GNewsProvider());
    this.register(new VidoraProvider());

    // 2. Define Capabilities
    this.capabilities.set('youtube', {
      supportedOperations: ['search'],
      supportedFilters: [
        'q',
        'limit',
        'page',
        'sort',
        'published_after',
        'published_before',
        'region',
        'language',
        'duration',
      ],
      authType: 'api_key',
      paginationSupported: true,
      maxLimit: 50,
      quotaCostPerCall: 100,
      notes: 'YouTube Data API v3 search endpoint with video enrichment',
    });

    this.capabilities.set('openweather', {
      supportedOperations: ['current', 'forecast', 'air_quality'],
      supportedFilters: ['lat', 'lon', 'city', 'unit'],
      authType: 'api_key',
      paginationSupported: false,
      quotaCostPerCall: 1,
      notes: 'OpenWeather 2.5 API with metric, imperial, and standard units',
    });

    this.capabilities.set('open_meteo', {
      supportedOperations: ['current', 'forecast', 'air_quality'],
      supportedFilters: ['lat', 'lon', 'city', 'unit'],
      authType: 'api_key',
      paginationSupported: false,
      quotaCostPerCall: 0,
      notes: 'Open-Meteo open weather API (WMO compliant, no rate limits on standard tier)',
    });

    this.capabilities.set('google_maps', {
      supportedOperations: [
        'geocode',
        'reverse_geocode',
        'places',
        'directions',
        'distance_matrix',
      ],
      supportedFilters: [
        'address',
        'lat',
        'lon',
        'query',
        'radius',
        'type',
        'origin',
        'destination',
        'mode',
        'waypoints',
        'origins',
        'destinations',
      ],
      authType: 'api_key',
      paginationSupported: true,
      quotaCostPerCall: 1,
      notes: 'Google Maps Platform full geocoding, directions, and places suite',
    });

    this.capabilities.set('mapbox', {
      supportedOperations: ['geocode', 'reverse_geocode', 'directions', 'places', 'isochrone'],
      supportedFilters: ['address', 'lat', 'lon', 'origin', 'destination', 'query', 'profile', 'contours'],
      authType: 'bearer',
      paginationSupported: false,
      quotaCostPerCall: 1,
      notes: 'Mapbox Places v5, Directions v5, and Isochrone APIs for geocoding, routing, and reachability contours',
    });

    this.capabilities.set('google_routes', {
      supportedOperations: ['optimize'],
      supportedFilters: ['origin', 'destination', 'stops', 'travel_mode'],
      authType: 'api_key',
      paginationSupported: false,
      quotaCostPerCall: 1,
      notes: 'Google Directions with optimizeWaypoints:true algorithm',
    });

    this.capabilities.set('internal_tsp', {
      supportedOperations: ['optimize'],
      supportedFilters: ['origin', 'destination', 'stops'],
      authType: 'none',
      paginationSupported: false,
      quotaCostPerCall: 0,
      notes: 'Zero-cost local 2-opt Traveling Salesperson heuristic optimizer',
    });

    this.capabilities.set('osrmroute', {
      supportedOperations: ['directions', 'route'],
      supportedFilters: ['coordinates', 'origin', 'destination', 'profile', 'overview', 'geometries', 'steps'],
      authType: 'bearer',
      paginationSupported: false,
      quotaCostPerCall: 1,
      notes: 'OSRMRoute high-performance hosted turn-by-turn routing with OpenStreetMap road networks',
    });

    this.capabilities.set('instagram', {
      supportedOperations: ['profile', 'media', 'media_details'],
      supportedFilters: ['access_token', 'limit', 'after', 'id'],
      authType: 'oauth2',
      paginationSupported: true,
      maxLimit: 50,
      quotaCostPerCall: 1,
      notes: 'Official Meta Instagram Platform / Instagram Login for authorized profiles',
    });

    this.capabilities.set('ip_geolocation', {
      supportedOperations: ['lookup'],
      supportedFilters: ['ip'],
      authType: 'none',
      paginationSupported: false,
      quotaCostPerCall: 0,
      notes: 'High-speed IP geolocation lookup returning ISP, coordinates, timezone, and country',
    });

    this.capabilities.set('frankfurter', {
      supportedOperations: ['rates', 'convert', 'exchange'],
      supportedFilters: ['base', 'target', 'amount'],
      authType: 'none',
      paginationSupported: false,
      quotaCostPerCall: 0,
      notes: 'Official European Central Bank open financial foreign exchange and currency converter',
    });

    this.capabilities.set('gnews', {
      supportedOperations: ['search', 'top_headlines'],
      supportedFilters: ['q', 'category', 'lang', 'limit'],
      authType: 'api_key',
      paginationSupported: false,
      maxLimit: 10,
      quotaCostPerCall: 1,
      notes: 'Global news search and real-time top headlines indexing',
    });

    this.capabilities.set('vidora', {
      supportedOperations: ['movie', 'tv', 'anime'],
      supportedFilters: [
        'id',
        'tmdb_id',
        'mal_id',
        'season',
        'episode',
        'number',
        'sub_or_dub',
        'fallback',
        'primaryColor',
        'secondaryColor',
        'iconColor',
        'title',
        'poster',
        'autoplay',
        'nextbutton',
        'startAt',
        'sub_file',
        'sub_label',
        'fallback_url',
      ],
      authType: 'none',
      paginationSupported: false,
      quotaCostPerCall: 0,
      notes: 'Vidora high-speed streaming embed API for movies (TMDB), TV series (TMDB), and anime (MyAnimeList)',
    });
  }

  static register(provider: IProvider): void {
    const list = this.providers.get(provider.service) || [];
    // prevent duplicates
    const filtered = list.filter((p) => p.name !== provider.name);
    filtered.push(provider);
    // sort by priority descending
    filtered.sort((a, b) => b.priority - a.priority);
    this.providers.set(provider.service, filtered);
  }

  static getProviders(service: ServiceCategory): IProvider[] {
    return this.providers.get(service) || [];
  }

  static getProvider(service: ServiceCategory, name: string): IProvider | undefined {
    const list = this.providers.get(service) || [];
    const normalized = name.toLowerCase().replace(/[-_]/g, '');
    return list.find((p) => p.name === name || p.name.toLowerCase().replace(/[-_]/g, '') === normalized);
  }

  static getCapabilities(providerName: string): ProviderCapability | undefined {
    return this.capabilities.get(providerName);
  }

  static getAllCapabilities(): Record<string, ProviderCapability> {
    const result: Record<string, ProviderCapability> = {};
    for (const [k, v] of this.capabilities.entries()) {
      result[k] = v;
    }
    return result;
  }
}

