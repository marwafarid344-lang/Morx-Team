import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedDistanceMatrix } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Normalizer.error({
      service: 'routing',
      statusCode: 400,
      errors: [
        {
          code: 'INVALID_JSON_BODY',
          message: 'Request body must be a valid JSON object.',
          retryable: false,
        },
      ],
    });
  }

  const { origins, destinations, provider, no_cache } = body;

  if (!origins || !destinations) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_POINTS',
          message: '"origins" and "destinations" are required.',
          retryable: false,
        },
      ],
    });
  }

  const originsStr = Array.isArray(origins)
    ? origins.map((p) => (typeof p === 'string' ? p : `${p.lat},${p.lon}`)).join('|')
    : String(origins);

  const destsStr = Array.isArray(destinations)
    ? destinations.map((p) => (typeof p === 'string' ? p : `${p.lat},${p.lon}`)).join('|')
    : String(destinations);

  const result = await ProviderOrchestrator.execute<UnifiedDistanceMatrix>(
    'maps',
    'distance_matrix',
    {
      origins: originsStr,
      destinations: destsStr,
    },
    {
      specificProvider: provider || undefined,
      bypassCache: !!no_cache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/routes/matrix',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 502,
      errors: [result.error || { code: 'ROUTING_MATRIX_FAILED', message: 'Failed to compute route matrix' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'routing',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}

