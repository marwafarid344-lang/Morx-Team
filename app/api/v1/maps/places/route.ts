import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedPlace } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'maps');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'maps',
      statusCode: auth.statusCode || 401,
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
  const query = searchParams.get('query') || searchParams.get('q');
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const radius = searchParams.get('radius');
  const type = searchParams.get('type');
  const provider = searchParams.get('provider');
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (!query && (lat === null || lon === null)) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_SEARCH_INPUT',
          message: 'Either "query" or "lat" & "lon" must be provided for places discovery.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedPlace[]>(
    'maps',
    'places',
    {
      query: query || undefined,
      lat: lat ? Number(lat) : undefined,
      lon: lon ? Number(lon) : undefined,
      radius: radius ? Number(radius) : undefined,
      type: type || undefined,
    },
    {
      specificProvider: provider || undefined,
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/maps/places',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'maps',
      statusCode: result.error?.code === 'PROVIDER_CREDENTIALS_MISSING' ? 503 : 502,
      errors: [result.error || { code: 'PLACES_SEARCH_FAILED', message: 'Places discovery failed' }],
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

