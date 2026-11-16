import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedRouteOptimization } from '@/lib/gateway/types/services';

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

  const { origin, stops, destination, provider, no_cache } = body;

  if (!origin || !Array.isArray(stops) || stops.length === 0) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 400,
      errors: [
        {
          code: 'INVALID_OPTIMIZATION_INPUT',
          message: '"origin" and an array of "stops" with lat & lon are required.',
          retryable: false,
        },
      ],
    });
  }

  const result = await ProviderOrchestrator.execute<UnifiedRouteOptimization>(
    'routing',
    'optimize',
    {
      origin,
      stops,
      destination: destination || origin,
    },
    {
      specificProvider: provider || undefined,
      bypassCache: !!no_cache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/routes/optimize',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'routing',
      statusCode: 502,
      errors: [result.error || { code: 'OPTIMIZATION_FAILED', message: 'Route optimization failed' }],
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

