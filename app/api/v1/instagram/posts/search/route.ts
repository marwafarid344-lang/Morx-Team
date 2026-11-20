import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { InstagramProviderService } from '@/lib/gateway/services/instagram-provider.service';

export const dynamic = 'force-dynamic';

/**
 * Gateway v1 Instagram Posts Search Endpoint (Static Photos / Carousels ONLY)
 * Route: GET /api/v1/instagram/posts/search
 */
export async function GET(request: NextRequest) {
  // 1. Authenticate with Gateway AuthGuard
  const auth = await AuthGuard.verify(request, 'instagram');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: auth.statusCode || 401,
      errors: [auth.error!],
    });
  }

  // 2. Client Rate Limiting
  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  // 3. Extract & Validate Query Parameters
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag') || searchParams.get('hashtag') || searchParams.get('q') || '';
  const limitParam = searchParams.get('limit');
  const sortParam = searchParams.get('sort');
  const bypassCache = searchParams.get('no_cache') === 'true';

  if (!tag.trim()) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_PARAM',
          message: 'Parameter "tag" is required. Provide a hashtag without "#" (e.g. ?tag=travel).',
          retryable: false,
        },
      ],
    });
  }

  const limit = limitParam ? Number(limitParam) : 10;
  const sort = sortParam === 'recent' ? 'recent' : 'top';

  // 4. Execute Multi-Provider Fallback Strategy (Apify -> RapidAPI)
  const result = await InstagramProviderService.searchPosts({
    tag,
    limit,
    sort,
    bypassCache,
  });

  if (!result.success) {
    return Normalizer.error({
      service: 'instagram',
      statusCode: 502,
      errors: [result.error || { code: 'POSTS_SEARCH_FAILED', message: 'Failed to search Instagram Posts' }],
      provider: result.provider,
    });
  }

  // 5. Track Gateway Usage
  RateLimiter.recordProviderCall(result.provider, 1);

  return Normalizer.success({
    service: 'instagram',
    data: result.data,
    provider: result.provider,
    providersUsed: result.providersUsed,
    cached: result.cached,
    latencyMs: result.latencyMs,
    totalReturned: result.totalReturned,
  });
}
