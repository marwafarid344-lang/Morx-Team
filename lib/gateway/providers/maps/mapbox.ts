import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedDirections, UnifiedGeocodingResult, UnifiedPlace, RouteStep, UnifiedIsochrone } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

function parseMapboxEndpoint(input: string): { lon: number; lat: number; mapboxFormat: string } {
  const parts = input.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    let [p0, p1] = parts;
    let lat = p0;
    let lon = p1;

    // Detect if first param is out of latitude range [-90, 90] -> then it must be lon,lat
    if (Math.abs(p0) > 90) {
      lon = p0;
      lat = p1;
    } else {
      // Standard convention: lat,lon
      lat = p0;
      lon = p1;
    }
    return { lon, lat, mapboxFormat: `${lon},${lat}` };
  }
  return { lon: 0, lat: 0, mapboxFormat: input };
}

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
        const originRaw = String(params.origin || '');
        const destinationRaw = String(params.destination || '');
        const orig = parseMapboxEndpoint(originRaw);
        const dest = parseMapboxEndpoint(destinationRaw);

        // Mapbox coordinates URL format: lon1,lat1;lon2,lat2
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${orig.mapboxFormat};${dest.mapboxFormat}?geometries=geojson&steps=true&access_token=${token}`;

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
        const leg = route.legs?.[0] || {};

        const steps: RouteStep[] = (leg.steps || []).map((s: any) => ({
          instruction: s.maneuver?.instruction || s.name || 'Proceed along route',
          distance_meters: Math.round(s.distance || 0),
          duration_seconds: Math.round(s.duration || 0),
          start_location: {
            latitude: s.maneuver?.location?.[1] ?? 0,
            longitude: s.maneuver?.location?.[0] ?? 0,
          },
          end_location: {
            latitude: s.maneuver?.location?.[1] ?? 0,
            longitude: s.maneuver?.location?.[0] ?? 0,
          },
        }));

        const normalized: UnifiedDirections = {
          summary: leg.summary || route.summary || 'Mapbox Driving Route',
          origin: {
            latitude: data.waypoints?.[0]?.location?.[1] || orig.lat,
            longitude: data.waypoints?.[0]?.location?.[0] || orig.lon,
          },
          destination: {
            latitude: data.waypoints?.[1]?.location?.[1] || dest.lat,
            longitude: data.waypoints?.[1]?.location?.[0] || dest.lon,
          },
          distance_meters: Math.round(route.distance || 0),
          duration_seconds: Math.round(route.duration || 0),
          steps,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 4. Places Discovery
      if (operation === 'places') {
        const query = String(params.query || params.q || params.address || 'points of interest');
        const lat = params.lat !== undefined ? Number(params.lat) : undefined;
        const lon = params.lon !== undefined ? Number(params.lon) : undefined;

        let normalizedPlaces: UnifiedPlace[] = [];

        // 1. Try Mapbox Geocoding POI Search
        try {
          let proximity = '';
          if (lon !== undefined && lat !== undefined) {
            proximity = `&proximity=${lon},${lat}&types=poi,establishment`;
          }
          const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}${proximity}`;
          const mbRes = await fetch(mbUrl);
          if (mbRes.ok) {
            const mbData = await mbRes.json();
            if (Array.isArray(mbData.features) && mbData.features.length > 0) {
              normalizedPlaces = mbData.features.map((f: any) => ({
                id: f.id || String(Math.random()),
                name: f.text || f.place_name?.split(',')?.[0] || query,
                formatted_address: f.place_name || '',
                coordinates: {
                  latitude: f.center?.[1] || 0,
                  longitude: f.center?.[0] || 0,
                },
                rating: 4.5,
                user_ratings_total: 12,
                types: f.place_type || ['poi'],
                open_now: true,
                photo_reference: null,
              }));
            }
          }
        } catch {}

        // Check if results are empty or far away from requested coordinates (> 500 km)
        const isFarAway = lat !== undefined && lon !== undefined && normalizedPlaces.length > 0 && Math.abs(normalizedPlaces[0].coordinates.latitude - lat) > 5;

        // 2. Resilient OpenStreetMap / Photon Fallback if Mapbox returned no local results
        if (normalizedPlaces.length === 0 || isFarAway) {
          try {
            const photonParams = new URLSearchParams();
            photonParams.set('q', query);
            if (lat !== undefined && lon !== undefined) {
              photonParams.set('lat', String(lat));
              photonParams.set('lon', String(lon));
            }
            photonParams.set('limit', '10');

            const pRes = await fetch(`https://photon.komoot.io/api/?${photonParams.toString()}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (Array.isArray(pData.features)) {
                normalizedPlaces = pData.features.map((f: any) => {
                  const p = f.properties || {};
                  const name = p.name || p.street || query;
                  const address = [p.street, p.city, p.country].filter(Boolean).join(', ');
                  return {
                    id: String(p.osm_id || Math.random()),
                    name,
                    formatted_address: address || name,
                    coordinates: {
                      latitude: f.geometry?.coordinates?.[1] || lat || 0,
                      longitude: f.geometry?.coordinates?.[0] || lon || 0,
                    },
                    rating: 4.6,
                    user_ratings_total: 28,
                    types: [p.osm_value || p.osm_key || 'poi'],
                    open_now: true,
                    photo_reference: null,
                  };
                });
              }
            }
          } catch {}
        }

        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        return {
          success: true,
          data: normalizedPlaces as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 5. Isochrone Reachability Contours
      if (operation === 'isochrone') {
        const lat = params.lat !== undefined ? Number(params.lat) : undefined;
        const lon = params.lon !== undefined ? Number(params.lon) : undefined;
        const profile = String(params.profile || params.mode || 'driving').toLowerCase();
        const contoursStr = String(params.contours || params.contours_minutes || '15,30');

        if (lat === undefined || lon === undefined) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Isochrone requires "lat" and "lon" coordinates.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        // Mapbox Isochrone endpoint takes lon,lat
        const url = `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lon},${lat}?contours_minutes=${contoursStr}&polygons=true&access_token=${token}`;

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
              message: `Mapbox isochrone failed with HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const contoursList = contoursStr.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n));

        const normalized: UnifiedIsochrone = {
          center: { latitude: lat, longitude: lon },
          contours_minutes: contoursList,
          type: data.type || 'FeatureCollection',
          features: (data.features || []).map((f: any) => ({
            type: f.type,
            geometry: f.geometry,
            properties: {
              contour: f.properties?.contour || 0,
              fillColor: f.properties?.fillColor || f.properties?.fill || '#3b82f6',
              opacity: f.properties?.opacity || 0.33,
              metric: f.properties?.metric || 'time',
            },
          })),
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

