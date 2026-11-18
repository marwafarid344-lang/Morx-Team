import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedNewsArticle } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'news');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'news',
      statusCode: 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'news',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || searchParams.get('query') || 'technology';
  const category = searchParams.get('category') || undefined;
  const lang = searchParams.get('lang') || 'en';
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;
  const bypassCache = searchParams.get('no_cache') === 'true';

  const result = await ProviderOrchestrator.execute<UnifiedNewsArticle[]>(
    'news',
    'search',
    {
      q,
      category,
      lang,
      limit,
    },
    {
      specificProvider: 'gnews',
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/news/search',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'news',
      statusCode: 502,
      errors: [result.error || { code: 'NEWS_SEARCH_FAILED', message: 'Failed to search news articles' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'news',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}
