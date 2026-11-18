import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import {
  UnifiedAirQuality,
  UnifiedForecastItem,
  UnifiedWeatherCurrent,
  UnifiedWeatherForecast,
} from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

function mapWmoCode(code: number): { main: string; description: string; icon: string } {
  if (code === 0) return { main: 'Clear', description: 'Clear sky', icon: '01d' };
  if (code === 1) return { main: 'Mainly Clear', description: 'Mainly clear', icon: '02d' };
  if (code === 2) return { main: 'Partly Cloudy', description: 'Partly cloudy', icon: '03d' };
  if (code === 3) return { main: 'Overcast', description: 'Overcast', icon: '04d' };
  if (code === 45 || code === 48) return { main: 'Fog', description: 'Fog or rime fog', icon: '50d' };
  if (code >= 51 && code <= 55) return { main: 'Drizzle', description: 'Light or dense drizzle', icon: '09d' };
  if (code >= 61 && code <= 65) return { main: 'Rain', description: 'Rain showers', icon: '10d' };
  if (code >= 71 && code <= 77) return { main: 'Snow', description: 'Snowfall', icon: '13d' };
  if (code >= 80 && code <= 82) return { main: 'Showers', description: 'Rain showers', icon: '09d' };
  if (code >= 95) return { main: 'Thunderstorm', description: 'Thunderstorm', icon: '11d' };
  return { main: 'Clear', description: 'Clear sky', icon: '01d' };
}

export class OpenMeteoProvider implements IProvider {
  readonly name = 'open_meteo';
  readonly service: ServiceCategory = 'weather';
  readonly priority = 95; // High priority alongside OpenWeather

  private getApiKey(): string | null {
    return process.env.OPEN_METEO_API_KEY || null;
  }

  private getBaseUrl(): string {
    const key = this.getApiKey();
    if (key && key !== 'free_tier') {
      return 'https://customer-api.open-meteo.com/v1';
    }
    return 'https://api.open-meteo.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    return CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const url = `${this.getBaseUrl()}/forecast?latitude=31.2&longitude=29.9&current=temperature_2m`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        return {
          status: 'degraded',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: `Open-Meteo returned HTTP ${res.status}`,
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
    const start = Date.now();
    let lat = params.lat !== undefined ? Number(params.lat) : undefined;
    let lon = params.lon !== undefined ? Number(params.lon) : undefined;
    let city = params.city ? String(params.city).trim() : undefined;
    const unitParam = String(params.unit || 'celsius').toLowerCase();
    const isFahrenheit = unitParam === 'fahrenheit';
    const tempUnitParam = isFahrenheit ? '&temperature_unit=fahrenheit' : '';

    return CircuitBreaker.execute(this.name, async () => {
      // Step 1: Resolve city to lat/lon if coordinates not provided directly
      let countryName: string | undefined = undefined;
      let resolvedCityName = city;

      if ((lat === undefined || lon === undefined) && city) {
        try {
          const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
          const geoRes = await fetch(geoUrl);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (Array.isArray(geoData.results) && geoData.results.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
              resolvedCityName = geoData.results[0].name || city;
              countryName = geoData.results[0].country;
            }
          }
        } catch {}
      }

      if (lat === undefined || lon === undefined) {
        return {
          success: false,
          data: null,
          providerName: this.name,
          latencyMs: 0,
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Open-Meteo requires either coordinates (lat & lon) or a resolvable city name.',
            provider: this.name,
            retryable: false,
          },
        };
      }

      // 1. Current Weather Operation
      if (operation === 'current') {
        const url = `${this.getBaseUrl()}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset&timezone=auto${tempUnitParam}`;

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
              message: `Open-Meteo forecast HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const current = data.current || {};
        const wmo = mapWmoCode(current.weather_code ?? 0);

        const normalized: UnifiedWeatherCurrent = {
          location: {
            latitude: lat,
            longitude: lon,
            name: resolvedCityName || 'Location',
            country: countryName,
          },
          temperature: Math.round(current.temperature_2m ?? 0),
          feels_like: Math.round(current.apparent_temperature ?? current.temperature_2m ?? 0),
          humidity: Math.round(current.relative_humidity_2m ?? 0),
          pressure: Math.round(current.surface_pressure ?? 1013),
          wind: {
            speed: current.wind_speed_10m ?? 0,
            direction: current.wind_direction_10m ?? 0,
          },
          condition: {
            main: wmo.main,
            description: wmo.description,
            icon: wmo.icon,
          },
          cloud_coverage_percent: 0,
          visibility_meters: 10000,
          sunrise: data.daily?.sunrise?.[0] || null,
          sunset: data.daily?.sunset?.[0] || null,
          unit: isFahrenheit ? 'fahrenheit' : 'celsius',
          source: this.name,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Multi-day Forecast Operation
      if (operation === 'forecast') {
        const url = `${this.getBaseUrl()}/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto${tempUnitParam}`;

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
              message: `Open-Meteo forecast HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const daily = data.daily || {};
        const times: string[] = daily.time || [];
        const maxTemps: number[] = daily.temperature_2m_max || [];
        const minTemps: number[] = daily.temperature_2m_min || [];
        const codes: number[] = daily.weather_code || [];
        const pop: number[] = daily.precipitation_probability_max || [];

        const items: UnifiedForecastItem[] = times.map((t, idx) => {
          const wmo = mapWmoCode(codes[idx] ?? 0);
          return {
            timestamp: `${t}T12:00:00Z`,
            temperature: Math.round(maxTemps[idx] ?? 0),
            feels_like: Math.round(maxTemps[idx] ?? 0),
            temp_min: Math.round(minTemps[idx] ?? 0),
            temp_max: Math.round(maxTemps[idx] ?? 0),
            humidity: 50,
            precipitation_probability_percent: pop[idx] ?? 0,
            condition: {
              main: wmo.main,
              description: wmo.description,
              icon: wmo.icon,
            },
            wind_speed: 10,
          };
        });

        const forecast: UnifiedWeatherForecast = {
          location: {
            latitude: lat,
            longitude: lon,
            name: resolvedCityName || 'Location',
            country: countryName,
          },
          unit: isFahrenheit ? 'fahrenheit' : 'celsius',
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

      // 3. Air Quality Operation
      if (operation === 'air_quality') {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone`;

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
              message: `Open-Meteo air quality HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const cur = data.current || {};
        const usAqi = cur.us_aqi || 50;

        let aqiNum = 1;
        let aqiLabel: UnifiedAirQuality['aqi_label'] = 'Good';

        if (usAqi > 300) { aqiNum = 5; aqiLabel = 'Very Poor'; }
        else if (usAqi > 150) { aqiNum = 4; aqiLabel = 'Poor'; }
        else if (usAqi > 100) { aqiNum = 3; aqiLabel = 'Moderate'; }
        else if (usAqi > 50) { aqiNum = 2; aqiLabel = 'Fair'; }

        const normalizedAqi: UnifiedAirQuality = {
          location: {
            latitude: lat,
            longitude: lon,
            name: resolvedCityName || 'Location',
            country: countryName,
          },
          aqi: aqiNum,
          aqi_label: aqiLabel,
          pollutants: {
            co: cur.carbon_monoxide,
            no2: cur.nitrogen_dioxide,
            o3: cur.ozone,
            pm2_5: cur.pm2_5,
            pm10: cur.pm10,
          },
          source: this.name,
        };

        return {
          success: true,
          data: normalizedAqi as unknown as T,
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
          message: `Open-Meteo does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}
