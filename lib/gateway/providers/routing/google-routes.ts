import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { RouteStop, UnifiedRouteOptimization } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class GoogleRoutesProvider implements IProvider {
  readonly name = 'google_routes';
  readonly service: ServiceCategory = 'routing';
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
        errorMessage: 'GOOGLE_MAPS_API_KEY is not configured',
        consecutiveFailures: 0,
      };
    }
    return {
      status: 'healthy',
      latencyMs: 1,
      lastCheckedAt: new Date().toISOString(),
      consecutiveFailures: 0,
    };
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
          message: 'GOOGLE_MAPS_API_KEY is required for Google Routes optimization.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      const origin = params.origin as { lat: number; lon: number } | undefined;
      const stops = (params.stops || []) as RouteStop[];
      const destination = (params.destination as { lat: number; lon: number } | undefined) || origin;

      if (!origin || !Array.isArray(stops) || stops.length === 0) {
        return {
          success: false,
          data: null,
          providerName: this.name,
          latencyMs: 0,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Origin and stops are required for route optimization.',
            provider: this.name,
            retryable: false,
          },
        };
      }

      // Build waypoints string with optimize:true
      const waypointsParam = `optimize:true|${stops.map((s) => `${s.lat},${s.lon}`).join('|')}`;
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.set('origin', `${origin.lat},${origin.lon}`);
      url.searchParams.set('destination', `${destination!.lat},${destination!.lon}`);
      url.searchParams.set('waypoints', waypointsParam);
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
            message: data.error_message || `Google Routes optimize returned ${data.status}`,
            provider: this.name,
            retryable: data.status === 'OVER_QUERY_LIMIT',
          },
        };
      }

      const route = data.routes?.[0] || {};
      const waypointOrder = route.waypoint_order || []; // Array of indices mapping to original stops array
      const optimizedOrder: string[] = waypointOrder.map((idx: number) => stops[idx]?.id || String(idx));

      let totalDistance = 0;
      let totalDuration = 0;
      const legs: UnifiedRouteOptimization['legs'] = [];

      (route.legs || []).forEach((leg: any, idx: number) => {
        totalDistance += leg.distance?.value || 0;
        totalDuration += leg.duration?.value || 0;
        legs.push({
          from_id: idx === 0 ? 'ORIGIN' : optimizedOrder[idx - 1] || `STOP_${idx - 1}`,
          to_id: idx < optimizedOrder.length ? optimizedOrder[idx] : 'DESTINATION',
          distance_meters: leg.distance?.value || 0,
          duration_seconds: leg.duration?.value || 0,
        });
      });

      const result: UnifiedRouteOptimization = {
        optimized_order: optimizedOrder,
        total_distance_meters: totalDistance,
        total_duration_seconds: totalDuration,
        algorithm: 'google_routes',
        provider: this.name,
        legs,
      };

      return {
        success: true,
        data: result as unknown as T,
        providerName: this.name,
        latencyMs,
      };
    });
  }
}

