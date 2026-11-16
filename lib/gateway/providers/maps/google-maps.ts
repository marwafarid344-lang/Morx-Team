import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import {
  UnifiedDirections,
  UnifiedDistanceMatrix,
  UnifiedGeocodingResult,
  UnifiedPlace,
} from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class GoogleMapsProvider implements IProvider {
  readonly name = 'google_maps';
  readonly service: ServiceCategory = 'maps';
  readonly priority = 100;

  private getApiKey(): string | null {
    return (
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.YOUTUBE_API_KEY ||
      null
    );
  }

  async isAvailable(): Promise<boolean> {
    return !!this.getApiKey() && CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        status: 'unhealthy',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: 'GOOGLE_MAPS_API_KEY environment variable is not configured',
        consecutiveFailures: 0,
      };
    }

    const start = Date.now();
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Alexandria&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const latencyMs = Date.now() - start;
      const data = await res.json().catch(() => ({}));

      if (data.status === 'REQUEST_DENIED') {
        return {
          status: 'degraded',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: data.error_message || 'API key request denied by Google Maps',
          consecutiveFailures: 1,
        };
      }

      return {
        status: 'healthy',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: err.message,
        consecutiveFailures: 1,
      };
    }
  }

  async execute<T>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'PROVIDER_CREDENTIALS_MISSING',
          message:
            'Google Maps API key is missing. Set GOOGLE_MAPS_API_KEY in your environment.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      // 1. Geocoding
      if (operation === 'geocode') {
        const address = String(params.address || '');
        if (!address) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Address parameter is required for geocoding.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('address', address);
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: data.error_message || `Google Maps Geocode: ${data.status}`,
              provider: this.name,
              retryable: data.status === 'OVER_QUERY_LIMIT',
            },
          };
        }

        const normalized: UnifiedGeocodingResult[] = (data.results || []).map((it: any) => ({
          formatted_address: it.formatted_address,
          coordinates: {
            latitude: it.geometry?.location?.lat || 0,
            longitude: it.geometry?.location?.lng || 0,
          },
          place_id: it.place_id || null,
          types: it.types || [],
          components: (it.address_components || []).reduce((acc: any, c: any) => {
            if (c.types.includes('locality')) acc.locality = c.long_name;
            if (c.types.includes('country')) acc.country = c.long_name;
            if (c.types.includes('route')) acc.route = c.long_name;
            if (c.types.includes('postal_code')) acc.postal_code = c.long_name;
            return acc;
          }, {}),
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Reverse Geocoding
      if (operation === 'reverse_geocode') {
        const lat = params.lat !== undefined ? Number(params.lat) : undefined;
        const lon = params.lon !== undefined ? Number(params.lon) : undefined;

        if (lat === undefined || lon === undefined) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'lat and lon are required for reverse geocoding.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('latlng', `${lat},${lon}`);
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: data.error_message || `Reverse geocode: ${data.status}`,
              provider: this.name,
              retryable: data.status === 'OVER_QUERY_LIMIT',
            },
          };
        }

        const normalized: UnifiedGeocodingResult[] = (data.results || []).map((it: any) => ({
          formatted_address: it.formatted_address,
          coordinates: {
            latitude: it.geometry?.location?.lat || lat,
            longitude: it.geometry?.location?.lng || lon,
          },
          place_id: it.place_id || null,
          types: it.types || [],
          components: {},
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 3. Places Discovery
      if (operation === 'places') {
        const query = String(params.query || params.q || '');
        const lat = params.lat !== undefined ? Number(params.lat) : undefined;
        const lon = params.lon !== undefined ? Number(params.lon) : undefined;
        const radius = params.radius ? Number(params.radius) : 5000;
        const type = params.type ? String(params.type) : undefined;

        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        if (query) url.searchParams.set('query', query);
        if (lat !== undefined && lon !== undefined) {
          url.searchParams.set('location', `${lat},${lon}`);
          url.searchParams.set('radius', String(radius));
        }
        if (type) url.searchParams.set('type', type);
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);
        const data = await res.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: data.error_message || `Places search: ${data.status}`,
              provider: this.name,
              retryable: data.status === 'OVER_QUERY_LIMIT',
            },
          };
        }

        const normalized: UnifiedPlace[] = (data.results || []).map((it: any) => ({
          id: it.place_id,
          name: it.name,
          formatted_address: it.formatted_address || it.vicinity || '',
          coordinates: {
            latitude: it.geometry?.location?.lat || 0,
            longitude: it.geometry?.location?.lng || 0,
          },
          rating: it.rating ?? null,
          user_ratings_total: it.user_ratings_total ?? null,
          types: it.types || [],
          open_now: it.opening_hours?.open_now ?? null,
          photo_reference: it.photos?.[0]?.photo_reference || null,
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 4. Directions
      if (operation === 'directions') {
        const origin = String(params.origin || '');
        const destination = String(params.destination || '');
        const mode = String(params.mode || 'driving').toLowerCase();
        const waypoints = params.waypoints ? String(params.waypoints) : undefined;

        if (!origin || !destination) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'origin and destination parameters are required.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
        url.searchParams.set('origin', origin);
        url.searchParams.set('destination', destination);
        url.searchParams.set('mode', mode);
        if (waypoints) url.searchParams.set('waypoints', waypoints);
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);
        const data = await res.json();

        if (data.status !== 'OK') {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: data.error_message || `Directions API: ${data.status}`,
              provider: this.name,
              retryable: data.status === 'OVER_QUERY_LIMIT',
            },
          };
        }

        const route = data.routes?.[0] || {};
        const leg = route.legs?.[0] || {};

        const steps = (leg.steps || []).map((s: any) => ({
          instruction: (s.html_instructions || '').replace(/<[^>]*>?/gm, ''),
          distance_meters: s.distance?.value || 0,
          duration_seconds: s.duration?.value || 0,
          start_location: {
            latitude: s.start_location?.lat || 0,
            longitude: s.start_location?.lng || 0,
          },
          end_location: {
            latitude: s.end_location?.lat || 0,
            longitude: s.end_location?.lng || 0,
          },
        }));

        const normalized: UnifiedDirections = {
          summary: route.summary || 'Route',
          origin: {
            latitude: leg.start_location?.lat || 0,
            longitude: leg.start_location?.lng || 0,
          },
          destination: {
            latitude: leg.end_location?.lat || 0,
            longitude: leg.end_location?.lng || 0,
          },
          distance_meters: leg.distance?.value || 0,
          duration_seconds: leg.duration?.value || 0,
          duration_in_traffic_seconds: leg.duration_in_traffic?.value || null,
          steps,
          polyline: route.overview_polyline?.points || null,
          bounds: route.bounds
            ? {
                northeast: {
                  latitude: route.bounds.northeast?.lat,
                  longitude: route.bounds.northeast?.lng,
                },
                southwest: {
                  latitude: route.bounds.southwest?.lat,
                  longitude: route.bounds.southwest?.lng,
                },
              }
            : null,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 5. Distance Matrix
      if (operation === 'distance_matrix') {
        const origins = String(params.origins || '');
        const destinations = String(params.destinations || '');

        if (!origins || !destinations) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'origins and destinations are required for distance matrix.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
        url.searchParams.set('origins', origins);
        url.searchParams.set('destinations', destinations);
        url.searchParams.set('key', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);
        const data = await res.json();

        if (data.status !== 'OK') {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: data.error_message || `Distance matrix: ${data.status}`,
              provider: this.name,
              retryable: data.status === 'OVER_QUERY_LIMIT',
            },
          };
        }

        const matrix = (data.rows || []).map((row: any, rIdx: number) =>
          (row.elements || []).map((el: any, cIdx: number) => ({
            origin_index: rIdx,
            destination_index: cIdx,
            distance_meters: el.distance?.value || 0,
            duration_seconds: el.duration?.value || 0,
            status: el.status || 'OK',
          }))
        );

        const normalized: UnifiedDistanceMatrix = {
          origins: data.origin_addresses || origins.split('|'),
          destinations: data.destination_addresses || destinations.split('|'),
          matrix,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `Google Maps provider does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}

