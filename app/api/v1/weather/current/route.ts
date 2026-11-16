import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedWeatherCurrent } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'weather');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'weather',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'weather',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const city = searchParams.get('city');
  const unit = searchParams.get('unit') || 'celsius';
  const provider = searchParams.get('provider');
  const bypassCache = searchParams.get('no_cache') === 'true' || request.headers.get('cache-control') === 'no-cache';

  if (!city && (lat === null || lon === null)) {
    return Normalizer.error({
      service: 'weather',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_LOCATION',
          message: 'Either "city" or "lat" and "lon" coordinates must be provided.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedWeatherCurrent>(
    'weather',
    'current',
    {
      lat: lat ? Number(lat) : undefined,
      lon: lon ? Number(lon) : undefined,
      city: city || undefined,
      unit,
    },
    {
      specificProvider: provider || undefined,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/weather/current',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'weather',
      statusCode: result.error?.code === 'PROVIDER_CREDENTIALS_MISSING' ? 503 : 502,
      errors: [result.error || { code: 'WEATHER_FETCH_FAILED', message: 'Failed to fetch weather' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'weather',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}

