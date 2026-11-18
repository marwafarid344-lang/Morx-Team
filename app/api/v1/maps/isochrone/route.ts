import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedIsochrone } from '@/lib/gateway/types/services';

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
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');
  const profile = searchParams.get('profile') || searchParams.get('mode') || 'driving';
  const contours = searchParams.get('contours') || '15,30';
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (!latStr || !lonStr) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_COORDINATES',
          message: '"lat" and "lon" parameters are required for isochrone calculations.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedIsochrone>(
    'maps',
    'isochrone',
    {
      lat: Number(latStr),
      lon: Number(lonStr),
      profile,
      contours,
    },
    {
      specificProvider: 'mapbox',
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/maps/isochrone',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'maps',
      statusCode: result.error?.code === 'PROVIDER_CREDENTIALS_MISSING' ? 503 : 502,
      errors: [result.error || { code: 'ISOCHRONE_FAILED', message: 'Failed to compute reachability contours' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'maps',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}
