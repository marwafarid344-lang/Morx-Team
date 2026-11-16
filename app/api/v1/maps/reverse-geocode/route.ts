import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedGeocodingResult } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'maps');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const provider = searchParams.get('provider');
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (lat === null || lon === null) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_COORDINATES',
          message: '"lat" and "lon" are required for reverse geocoding.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedGeocodingResult[]>(
    'maps',
    'reverse_geocode',
    {
      lat: Number(lat),
      lon: Number(lon),
    },
    {
      specificProvider: provider || undefined,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/maps/reverse-geocode',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'maps',
      statusCode: result.error?.code === 'PROVIDER_CREDENTIALS_MISSING' ? 503 : 502,
      errors: [result.error || { code: 'REVERSE_GEOCODING_FAILED', message: 'Reverse geocoding failed' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'maps',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
    totalReturned: result.data.length,
  });
}

