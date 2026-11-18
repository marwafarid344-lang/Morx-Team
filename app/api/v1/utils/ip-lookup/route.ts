import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedIpLookup } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'utils');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'utils',
      statusCode: auth.statusCode || 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'utils',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const ipParam = searchParams.get('ip');
  // If no ip provided, extract client IP from headers (x-forwarded-for or x-real-ip)
  const clientIp = ipParam || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '';
  const bypassCache = searchParams.get('no_cache') === 'true';

  const result = await ProviderOrchestrator.execute<UnifiedIpLookup>(
    'utils',
    'lookup',
    { ip: clientIp },
    {
      specificProvider: 'ip_geolocation',
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/utils/ip-lookup',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'utils',
      statusCode: 502,
      errors: [result.error || { code: 'IP_LOOKUP_FAILED', message: 'Failed to look up IP geolocation' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'utils',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}
