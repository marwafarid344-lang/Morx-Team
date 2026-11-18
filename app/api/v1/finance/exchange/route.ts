import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedExchangeRate } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'finance');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'finance',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'finance',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const base = searchParams.get('base') || searchParams.get('from') || 'USD';
  const target = searchParams.get('target') || searchParams.get('to') || searchParams.get('symbols') || undefined;
  const amount = searchParams.get('amount') ? Number(searchParams.get('amount')) : 1;
  const bypassCache = searchParams.get('no_cache') === 'true';

  const result = await ProviderOrchestrator.execute<UnifiedExchangeRate>(
    'finance',
    'rates',
    {
      base,
      target,
      amount,
    },
    {
      specificProvider: 'frankfurter',
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/finance/exchange',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'finance',
      statusCode: 502,
      errors: [result.error || { code: 'EXCHANGE_FAILED', message: 'Failed to fetch currency exchange rates' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'finance',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}
