import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { RouteStop, UnifiedRouteOptimization } from '../../types/services';

/**
 * Calculate Haversine distance in meters between two lat/lon points
 */
function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class InternalTspProvider implements IProvider {
  readonly name = 'internal_tsp';
  readonly service: ServiceCategory = 'routing';
  readonly priority = 50; // Fallback / Local heuristic engine

  async isAvailable(): Promise<boolean> {
    return true; // Always available, zero external dependencies
  }

  async healthCheck(): Promise<ProviderHealth> {
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
    const start = Date.now();

    if (operation !== 'optimize') {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `Internal TSP provider does not support "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    }

    const origin = params.origin as { lat: number; lon: number } | undefined;
    const stops = (params.stops || []) as RouteStop[];
    const destination = params.destination as { lat: number; lon: number } | undefined;

    if (!origin || !Array.isArray(stops) || stops.length === 0) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Origin and at least one stop are required for route optimization.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    // Nearest Neighbor Heuristic with 2-opt refinement
    const unvisited = [...stops];
    const orderedStops: RouteStop[] = [];
    let currentPoint = { lat: origin.lat, lon: origin.lon, id: 'ORIGIN' };

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const d = haversineDistanceMeters(
          currentPoint.lat,
          currentPoint.lon,
          unvisited[i].lat,
          unvisited[i].lon
        );
        if (d < minDistance) {
          minDistance = d;
          nearestIdx = i;
        }
      }

      const next = unvisited.splice(nearestIdx, 1)[0];
      orderedStops.push(next);
      currentPoint = next;
    }

    // 2-opt heuristic improvement for order > 3
    if (orderedStops.length > 3) {
      let improved = true;
      let iterations = 0;
      while (improved && iterations < 50) {
        improved = false;
        iterations++;
        for (let i = 0; i < orderedStops.length - 1; i++) {
          for (let k = i + 1; k < orderedStops.length; k++) {
            const d1 = haversineDistanceMeters(
              orderedStops[i].lat,
              orderedStops[i].lon,
              orderedStops[i + 1].lat,
              orderedStops[i + 1].lon
            );
            const d2 = haversineDistanceMeters(
              orderedStops[k].lat,
              orderedStops[k].lon,
              k + 1 < orderedStops.length
                ? orderedStops[k + 1].lat
                : destination?.lat ?? orderedStops[k].lat,
              k + 1 < orderedStops.length
                ? orderedStops[k + 1].lon
                : destination?.lon ?? orderedStops[k].lon
            );

            // Reversal cost check
            const r1 = haversineDistanceMeters(
              orderedStops[i].lat,
              orderedStops[i].lon,
              orderedStops[k].lat,
              orderedStops[k].lon
            );
            const r2 = haversineDistanceMeters(
              orderedStops[i + 1].lat,
              orderedStops[i + 1].lon,
              k + 1 < orderedStops.length
                ? orderedStops[k + 1].lat
                : destination?.lat ?? orderedStops[k].lat,
              k + 1 < orderedStops.length
                ? orderedStops[k + 1].lon
                : destination?.lon ?? orderedStops[k].lon
            );

            if (r1 + r2 < d1 + d2) {
              const sub = orderedStops.slice(i + 1, k + 1).reverse();
              orderedStops.splice(i + 1, sub.length, ...sub);
              improved = true;
            }
          }
        }
      }
    }

    // Calculate legs and total metrics (assume average urban speed 35 km/h = 9.72 m/s)
    let totalDistanceMeters = 0;
    const legs: UnifiedRouteOptimization['legs'] = [];
    let prev = { lat: origin.lat, lon: origin.lon, id: 'ORIGIN' };

    for (const stop of orderedStops) {
      const dist = Math.round(
        haversineDistanceMeters(prev.lat, prev.lon, stop.lat, stop.lon)
      );
      const duration = Math.round(dist / 9.72);
      totalDistanceMeters += dist;
      legs.push({
        from_id: prev.id,
        to_id: stop.id,
        distance_meters: dist,
        duration_seconds: duration,
      });
      prev = stop;
    }

    if (destination) {
      const dist = Math.round(
        haversineDistanceMeters(prev.lat, prev.lon, destination.lat, destination.lon)
      );
      const duration = Math.round(dist / 9.72);
      totalDistanceMeters += dist;
      legs.push({
        from_id: prev.id,
        to_id: 'DESTINATION',
        distance_meters: dist,
        duration_seconds: duration,
      });
    }

    const totalDurationSeconds = Math.round(totalDistanceMeters / 9.72);

    const result: UnifiedRouteOptimization = {
      optimized_order: orderedStops.map((s) => s.id),
      total_distance_meters: totalDistanceMeters,
      total_duration_seconds: totalDurationSeconds,
      algorithm: 'internal_tsp_heuristic',
      provider: this.name,
      legs,
    };

    return {
      success: true,
      data: result as unknown as T,
      providerName: this.name,
      latencyMs: Date.now() - start,
    };
  }
}

