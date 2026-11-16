import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedDirections, UnifiedGeocodingResult } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class MapboxProvider implements IProvider {
  readonly name = 'mapbox';
  readonly service: ServiceCategory = 'maps';
  readonly priority = 80; // Secondary / fallback priority

  private getApiKey(): string | null {
    return process.env.MAPBOX_ACCESS_TOKEN || null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.getApiKey() && CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const token = this.getApiKey();
    if (!token) {
      return {
        status: 'unhealthy',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: 'MAPBOX_ACCESS_TOKEN environment variable is not configured',
        consecutiveFailures: 0,
      };
    }

    const start = Date.now();
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/Alexandria.json?access_token=${token}&limit=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          status: 'degraded',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: `Mapbox HTTP ${res.status}`,
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
    const token = this.getApiKey();
    if (!token) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'PROVIDER_CREDENTIALS_MISSING',
          message: 'MAPBOX_ACCESS_TOKEN is not configured.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      // 1. Geocoding
      if (operation === 'geocode') {
        const address = encodeURIComponent(String(params.address || ''));
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${address}.json?access_token=${token}`;

        const res = await fetch(url);
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: `Mapbox geocode failed with HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const normalized: UnifiedGeocodingResult[] = (data.features || []).map((f: any) => ({
          formatted_address: f.place_name,
          coordinates: {
            latitude: f.center[1],
            longitude: f.center[0],
          },
          place_id: f.id,
          types: f.place_type || [],
          components: {},
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Reverse Geocode
      if (operation === 'reverse_geocode') {
        const lon = Number(params.lon);
        const lat = Number(params.lat);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${token}`;

        const res = await fetch(url);
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: `Mapbox reverse geocode failed with HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const normalized: UnifiedGeocodingResult[] = (data.features || []).map((f: any) => ({
          formatted_address: f.place_name,
          coordinates: {
            latitude: f.center[1],
            longitude: f.center[0],
          },
          place_id: f.id,
          types: f.place_type || [],
          components: {},
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 3. Directions
      if (operation === 'directions') {
        const origin = String(params.origin || '');
        const destination = String(params.destination || '');
        // coordinates formatted as lon,lat;lon,lat
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin};${destination}?geometries=geojson&access_token=${token}`;

        const res = await fetch(url);
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: `Mapbox directions failed with HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const route = data.routes?.[0] || {};

        const normalized: UnifiedDirections = {
          summary: route.legs?.[0]?.summary || 'Mapbox Driving Route',
          origin: { latitude: 0, longitude: 0 },
          destination: { latitude: 0, longitude: 0 },
          distance_meters: Math.round(route.distance || 0),
          duration_seconds: Math.round(route.duration || 0),
          steps: [],
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
          message: `Mapbox provider does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}

