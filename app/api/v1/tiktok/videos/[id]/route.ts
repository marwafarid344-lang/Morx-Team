import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedTikTokVideo } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await AuthGuard.verify(request, 'tiktok');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'tiktok',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'tiktok',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('access_token') || request.headers.get('x-tiktok-token');

  const result = await ProviderOrchestrator.execute<UnifiedTikTokVideo>(
    'tiktok',
    'video_details',
    {
      id: params.id,
      access_token: accessToken,
    },
    {
      clientId: auth.context.client.id,
      endpoint: `/api/v1/tiktok/videos/${params.id}`,
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'tiktok',
      statusCode:
        result.error?.code === 'OAUTH_TOKEN_REQUIRED'
          ? 401
          : result.error?.code === 'NOT_FOUND'
          ? 404
          : 502,
      errors: [result.error || { code: 'VIDEO_FETCH_FAILED', message: 'Failed to fetch video details' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'tiktok',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}

