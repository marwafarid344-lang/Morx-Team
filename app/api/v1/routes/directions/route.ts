import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedDirections } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'routing');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const coordinates = searchParams.get('coordinates');
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const profile = searchParams.get('profile') || searchParams.get('mode') || 'driving';
  const overview = searchParams.get('overview') || 'full';
  const geometries = searchParams.get('geometries') || 'geojson';
  const steps = searchParams.get('steps') !== 'false';
  const provider = searchParams.get('provider') || 'osrmroute';
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (!coordinates && (!origin || !destination)) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_ROUTE_PARAMETERS',
          message: 'Either "coordinates" (lon1,lat1;lon2,lat2) or both "origin" and "destination" are required.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedDirections>(
    'routing',
    'directions',
    {
      coordinates: coordinates || undefined,
      origin: origin || undefined,
      destination: destination || undefined,
      profile,
      overview,
      geometries,
      steps,
    },
    {
      specificProvider: provider,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/routes/directions',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'routing',
      statusCode: result.error?.code?.includes('NOT_FOUND') ? 404 : 502,
      errors: [result.error!],
      provider: result.providerName,
    });
  }

  return Normalizer.success<UnifiedDirections>({
    service: 'routing',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
    attribution: result.meta?.attribution,
    complianceStatus: result.meta?.compliance_status,
  });
}
