import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedDirections } from '@/lib/gateway/types/services';

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
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const mode = searchParams.get('mode') || 'driving';
  const waypoints = searchParams.get('waypoints');
  const provider = searchParams.get('provider');
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (!origin || !destination) {
    return Normalizer.error({
      service: 'maps',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_ROUTE_ENDPOINTS',
          message: '"origin" and "destination" are required for directions.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedDirections>(
    'maps',
    'directions',
    {
      origin,
      destination,
      mode,
      waypoints: waypoints || undefined,
    },
    {
      specificProvider: provider || undefined,
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/maps/directions',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'maps',
      statusCode: result.error?.code === 'PROVIDER_CREDENTIALS_MISSING' ? 503 : 502,
      errors: [result.error || { code: 'DIRECTIONS_FAILED', message: 'Failed to calculate directions' }],
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

