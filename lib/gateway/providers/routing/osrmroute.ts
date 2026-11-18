import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedDirections } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class OSRMRouteProvider implements IProvider {
  readonly name = 'osrmroute';
  readonly service: ServiceCategory = 'routing';
  readonly priority = 95; // High priority fast routing engine

  private getApiKey(): string | null {
    return process.env.OSRMROUTE_API_KEY || null;
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
        errorMessage: 'OSRMROUTE_API_KEY environment variable is not configured',
        consecutiveFailures: 0,
      };
    }

    const start = Date.now();
    try {
      // Test route across Alexandria coordinates (lon,lat format: 29.9187,31.2001;29.9500,31.2200)
      const url = 'https://osrmroute.com/api/v1/osrm/route/v1/driving/29.9187,31.2001;29.9500,31.2200?steps=false&overview=simplified';
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(6000),
      });

      const latencyMs = Date.now() - start;
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        return {
          status: 'degraded',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: errorJson?.message || `HTTP ${res.status}`,
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

  /**
   * Helper to normalize coordinate inputs into OSRM's required "lon,lat;lon,lat" string
   */
  private normalizeCoordinates(params: Record<string, unknown>): string | null {
    if (params.coordinates && typeof params.coordinates === 'string') {
      return params.coordinates.trim();
    }

    const origin = params.origin as string | undefined;
    const destination = params.destination as string | undefined;

    if (origin && destination) {
      const parsePoint = (pt: string): string => {
        const parts = pt.split(',').map((p) => p.trim());
        if (parts.length === 2) {
          const p1 = parseFloat(parts[0]);
          const p2 = parseFloat(parts[1]);
          // If first number is around 25-35 (Egypt lat), and second is around 25-35 (Egypt lon)
          // OSRM expects: lon,lat
          if (p1 > 20 && p1 < 35 && p2 > 25 && p2 < 40) {
            // Provided as lat,lon -> convert to lon,lat
            return `${p2},${p1}`;
          }
          // Otherwise assume already provided as lon,lat or raw
          return `${p1},${p2}`;
        }
        return pt;
      };

      const startCoord = parsePoint(origin);
      const endCoord = parsePoint(destination);
      return `${startCoord};${endCoord}`;
    }

    return null;
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
          message: 'OSRMROUTE_API_KEY is not configured in .env.local',
          provider: this.name,
          retryable: false,
        },
      };
    }

    // Circuit Breaker Guard
    if (!CircuitBreaker.isAllowed(this.name)) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'CIRCUIT_BREAKER_OPEN',
          message: `Circuit breaker is OPEN for provider "${this.name}".`,
          provider: this.name,
          retryable: true,
        },
      };
    }

    RateLimiter.recordProviderCall(this.name, 1);

    const start = Date.now();

    try {
      if (operation === 'directions' || operation === 'route') {
        const coords = this.normalizeCoordinates(params);
        if (!coords) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'OSRMRoute requires "coordinates" (lon1,lat1;lon2,lat2) or "origin" and "destination".',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const profile = (params.profile as string) || (params.mode as string) || 'driving';
        const overview = (params.overview as string) || 'full';
        const geometries = (params.geometries as string) || 'geojson';
        const steps = params.steps !== undefined ? Boolean(params.steps) : true;
        const alternatives = params.alternatives ? `&alternatives=${params.alternatives}` : '';

        const url = `https://osrmroute.com/api/v1/osrm/route/v1/${profile}/${coords}?overview=${overview}&geometries=${geometries}&steps=${steps}${alternatives}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });

        const latencyMs = Date.now() - start;

        if (!res.ok) {
          CircuitBreaker.recordFailure(this.name);
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: `OSRM_HTTP_${res.status}`,
              message: errData.message || `OSRMRoute returned status ${res.status}`,
              provider: this.name,
              details: errData,
              retryable: res.status >= 500,
            },
          };
        }

        const rawData = await res.json();

        if (rawData.code !== 'Ok' || !rawData.routes || rawData.routes.length === 0) {
          CircuitBreaker.recordFailure(this.name);
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'ROUTE_NOT_FOUND',
              message: rawData.message || 'No feasible route found between provided coordinates.',
              provider: this.name,
              details: rawData,
              retryable: false,
            },
          };
        }

        CircuitBreaker.recordSuccess(this.name);

        const primaryRoute = rawData.routes[0];
        const distanceMeters = Math.round(primaryRoute.distance || 0);
        const durationSeconds = Math.round(primaryRoute.duration || 0);

        // Format into Morx UnifiedDirections envelope
        const unifiedSteps: any[] = [];
        if (primaryRoute.legs) {
          for (const leg of primaryRoute.legs) {
            if (leg.steps) {
              for (const s of leg.steps) {
                unifiedSteps.push({
                  instruction: s.maneuver?.type 
                    ? `${s.maneuver.type} ${s.maneuver.modifier || ''} ${s.name ? 'onto ' + s.name : ''}`.trim()
                    : s.name || 'Continue on route',
                  distanceMeters: Math.round(s.distance || 0),
                  durationSeconds: Math.round(s.duration || 0),
                  name: s.name || '',
                  mode: s.mode || profile,
                });
              }
            }
          }
        }

        const normalized: UnifiedDirections = {
          origin: (params.origin as string) || rawData.waypoints?.[0]?.name || coords.split(';')[0],
          destination: (params.destination as string) || rawData.waypoints?.[1]?.name || coords.split(';')[1],
          distance_meters: distanceMeters,
          duration_seconds: durationSeconds,
          distanceMeters,
          distanceFormatted: distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`,
          durationSeconds,
          durationFormatted: durationSeconds >= 3600 
            ? `${Math.floor(durationSeconds / 3600)}h ${Math.round((durationSeconds % 3600) / 60)}m`
            : `${Math.round(durationSeconds / 60)} mins`,
          polyline: typeof primaryRoute.geometry === 'string' ? primaryRoute.geometry : undefined,
          geometry: primaryRoute.geometry,
          steps: unifiedSteps,
          waypoints: rawData.waypoints || [],
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          meta: {
            profile,
            waypoints_count: rawData.waypoints?.length || 2,
            engine: 'OSRMRoute Hosted',
            license: 'ODbL OpenStreetMap',
          },
        };
      }

      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: Date.now() - start,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `Operation "${operation}" is not supported by provider "${this.name}".`,
          provider: this.name,
          retryable: false,
        },
      };
    } catch (err: any) {
      CircuitBreaker.recordFailure(this.name);
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: Date.now() - start,
        error: {
          code: 'PROVIDER_NETWORK_ERROR',
          message: err.message || 'Network timeout or connection failure communicating with OSRMRoute.',
          provider: this.name,
          retryable: true,
        },
      };
    }
  }
}
