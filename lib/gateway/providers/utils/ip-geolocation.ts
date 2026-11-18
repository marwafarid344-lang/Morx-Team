import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedIpLookup } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class IpGeolocationProvider implements IProvider {
  readonly name = 'ip_geolocation';
  readonly service: ServiceCategory = 'utils';
  readonly priority = 100;

  async isAvailable(): Promise<boolean> {
    return CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://ipwho.is/8.8.8.8', { signal: AbortSignal.timeout(5000) });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          status: 'healthy',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
        };
      }
      return {
        status: 'degraded',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: `HTTP ${res.status}`,
        consecutiveFailures: 1,
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

    return CircuitBreaker.execute(this.name, async () => {
      if (operation === 'lookup' || operation === 'ip_lookup') {
        const ip = String(params.ip || '').trim();
        const targetIp = ip && ip !== 'me' && ip !== 'self' ? ip : '';

        // Try primary provider: ipwho.is (Free, HTTPS, No key required)
        try {
          const res = await fetch(`https://ipwho.is/${targetIp}`, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(6000),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success !== false) {
              const latencyMs = Date.now() - start;
              RateLimiter.recordProviderCall(this.name, 1);

              const normalized: UnifiedIpLookup = {
                ip: data.ip || targetIp || '127.0.0.1',
                city: data.city || 'Unknown',
                region: data.region || '',
                country: data.country || 'Unknown',
                country_code: data.country_code || '',
                coordinates: {
                  latitude: data.latitude || 0,
                  longitude: data.longitude || 0,
                },
                timezone: data.timezone?.id || data.timezone?.abbr || '',
                isp: data.connection?.isp || data.connection?.org || '',
                org: data.connection?.org || data.connection?.asn ? `AS${data.connection?.asn}` : '',
              };

              return {
                success: true,
                data: normalized as unknown as T,
                providerName: this.name,
                latencyMs,
                meta: {
                  engine: 'ipwho.is',
                },
              };
            }
          }
        } catch {}

        // Fallback: ip-api.com
        try {
          const fbRes = await fetch(`http://ip-api.com/json/${targetIp}?fields=status,message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,query`, {
            signal: AbortSignal.timeout(6000),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            if (fbData.status === 'success') {
              const latencyMs = Date.now() - start;
              RateLimiter.recordProviderCall(this.name, 1);

              const normalized: UnifiedIpLookup = {
                ip: fbData.query || targetIp || '127.0.0.1',
                city: fbData.city || 'Unknown',
                region: fbData.regionName || '',
                country: fbData.country || 'Unknown',
                country_code: fbData.countryCode || '',
                coordinates: {
                  latitude: fbData.lat || 0,
                  longitude: fbData.lon || 0,
                },
                timezone: fbData.timezone || '',
                isp: fbData.isp || '',
                org: fbData.org || '',
              };

              return {
                success: true,
                data: normalized as unknown as T,
                providerName: this.name,
                latencyMs,
                meta: {
                  engine: 'ip-api.com',
                },
              };
            }
          }
        } catch {}

        return {
          success: false,
          data: null,
          providerName: this.name,
          latencyMs: Date.now() - start,
          error: {
            code: 'IP_LOOKUP_FAILED',
            message: 'Unable to resolve IP geolocation through upstream providers.',
            provider: this.name,
            retryable: true,
          },
        };
      }

      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `IP Geolocation provider does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}
