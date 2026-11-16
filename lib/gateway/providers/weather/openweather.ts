import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import {
  UnifiedAirQuality,
  UnifiedForecastItem,
  UnifiedWeatherCurrent,
  UnifiedWeatherForecast,
} from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class OpenWeatherProvider implements IProvider {
  readonly name = 'openweather';
  readonly service: ServiceCategory = 'weather';
  readonly priority = 100;

  private getApiKey(): string | null {
    return process.env.OPENWEATHER_API_KEY || null;
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
        errorMessage: 'OPENWEATHER_API_KEY environment variable is not configured',
        consecutiveFailures: 0,
      };
    }

    const start = Date.now();
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=31.2&lon=29.9&appid=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
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
            'OpenWeather API key is missing. Set OPENWEATHER_API_KEY in your environment.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();
    const lat = params.lat !== undefined ? Number(params.lat) : undefined;
    const lon = params.lon !== undefined ? Number(params.lon) : undefined;
    const city = params.city ? String(params.city) : undefined;
    const unitParam = String(params.unit || 'celsius').toLowerCase();

    const units =
      unitParam === 'fahrenheit' ? 'imperial' : unitParam === 'kelvin' ? 'standard' : 'metric';
    const normalizedUnit =
      unitParam === 'fahrenheit' ? 'fahrenheit' : unitParam === 'kelvin' ? 'kelvin' : 'celsius';

    return CircuitBreaker.execute(this.name, async () => {
      // 1. Current Weather
      if (operation === 'current') {
        const url = new URL('https://api.openweathermap.org/data/2.5/weather');
        if (lat !== undefined && lon !== undefined) {
          url.searchParams.set('lat', String(lat));
          url.searchParams.set('lon', String(lon));
        } else if (city) {
          url.searchParams.set('q', city);
        } else {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Weather current requires either lat & lon coordinates or city parameter.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        url.searchParams.set('units', units);
        url.searchParams.set('appid', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.message || `OpenWeather returned HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const normalized: UnifiedWeatherCurrent = {
          location: {
            latitude: data.coord?.lat || lat || 0,
            longitude: data.coord?.lon || lon || 0,
            name: data.name || city || 'Unknown Location',
            country: data.sys?.country,
          },
          temperature: Math.round(data.main?.temp ?? 0),
          feels_like: Math.round(data.main?.feels_like ?? 0),
          humidity: data.main?.humidity ?? 0,
          pressure: data.main?.pressure ?? 0,
          wind: {
            speed: data.wind?.speed ?? 0,
            direction: data.wind?.deg ?? 0,
          },
          condition: {
            main: data.weather?.[0]?.main || 'Unknown',
            description: data.weather?.[0]?.description || '',
            icon: data.weather?.[0]?.icon || null,
          },
          cloud_coverage_percent: data.clouds?.all ?? 0,
          visibility_meters: data.visibility ?? 10000,
          sunrise: data.sys?.sunrise
            ? new Date(data.sys.sunrise * 1000).toISOString()
            : null,
          sunset: data.sys?.sunset
            ? new Date(data.sys.sunset * 1000).toISOString()
            : null,
          unit: normalizedUnit,
          source: this.name,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Weather Forecast (5-day / 3-hour)
      if (operation === 'forecast') {
        const url = new URL('https://api.openweathermap.org/data/2.5/forecast');
        if (lat !== undefined && lon !== undefined) {
          url.searchParams.set('lat', String(lat));
          url.searchParams.set('lon', String(lon));
        } else if (city) {
          url.searchParams.set('q', city);
        } else {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Weather forecast requires lat & lon or city parameter.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        url.searchParams.set('units', units);
        url.searchParams.set('appid', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.message || `OpenWeather forecast returned HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const items: UnifiedForecastItem[] = (data.list || []).map((it: any) => ({
          timestamp: new Date(it.dt * 1000).toISOString(),
          temperature: Math.round(it.main?.temp ?? 0),
          feels_like: Math.round(it.main?.feels_like ?? 0),
          temp_min: Math.round(it.main?.temp_min ?? 0),
          temp_max: Math.round(it.main?.temp_max ?? 0),
          humidity: it.main?.humidity ?? 0,
          precipitation_probability_percent:
            it.pop !== undefined ? Math.round(it.pop * 100) : null,
          condition: {
            main: it.weather?.[0]?.main || 'Unknown',
            description: it.weather?.[0]?.description || '',
            icon: it.weather?.[0]?.icon || null,
          },
          wind_speed: it.wind?.speed ?? 0,
        }));

        const forecast: UnifiedWeatherForecast = {
          location: {
            latitude: data.city?.coord?.lat || lat || 0,
            longitude: data.city?.coord?.lon || lon || 0,
            name: data.city?.name || city || 'Unknown Location',
            country: data.city?.country,
          },
          unit: normalizedUnit,
          source: this.name,
          items,
        };

        return {
          success: true,
          data: forecast as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 3. Air Quality
      if (operation === 'air_quality') {
        if (lat === undefined || lon === undefined) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Air quality requires lat & lon coordinates.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = new URL('https://api.openweathermap.org/data/2.5/air_pollution');
        url.searchParams.set('lat', String(lat));
        url.searchParams.set('lon', String(lon));
        url.searchParams.set('appid', apiKey);

        const res = await fetch(url.toString());
        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.message || `OpenWeather air pollution HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const mainItem = data.list?.[0] || {};
        const aqiNum = mainItem.main?.aqi || 0;
        const labels: Record<number, UnifiedAirQuality['aqi_label']> = {
          1: 'Good',
          2: 'Fair',
          3: 'Moderate',
          4: 'Poor',
          5: 'Very Poor',
        };

        const airQuality: UnifiedAirQuality = {
          location: {
            latitude: lat,
            longitude: lon,
            name: city || 'Coordinates Location',
          },
          aqi: aqiNum,
          aqi_label: labels[aqiNum] || 'Unknown',
          pollutants: mainItem.components || {},
          source: this.name,
        };

        return {
          success: true,
          data: airQuality as unknown as T,
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
          message: `OpenWeather does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}

