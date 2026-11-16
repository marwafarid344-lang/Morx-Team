import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedInstagramMedia } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'instagram');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access_token') || request.headers.get('x-instagram-token');
  const limit = searchParams.get('limit');
  const after = searchParams.get('after');

  const result = await ProviderOrchestrator.execute<UnifiedInstagramMedia[]>(
    'instagram',
    'media',
    {
      access_token: accessToken,
      limit: limit ? Number(limit) : 20,
      after,
    },
    {
      clientId: auth.context.client.id,
      endpoint: '/api/v1/instagram/media',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: result.error?.code === 'OAUTH_TOKEN_REQUIRED' ? 401 : 502,
      errors: [result.error || { code: 'INSTAGRAM_MEDIA_FAILED', message: 'Failed to fetch Instagram media' }],
      provider: result.providerName,
    });
  }

  const raw = result.rawResponse as { paging?: { cursors?: { after?: string } } } | undefined;

  return Normalizer.success({
    service: 'instagram',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
    totalReturned: result.data.length,
    nextPage: raw?.paging?.cursors?.after || null,
  });
}

