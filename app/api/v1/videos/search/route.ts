import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { FilterEngine } from '@/lib/gateway/core/filter-engine';
import { UnifiedVideo } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Authenticate API Key
  const auth = await AuthGuard.verify(request, 'videos');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'videos',
      statusCode: auth.statusCode || 401,
      errors: [auth.error!],
    });
  }

  // 2. Client Rate Limiting
  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'videos',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  // 3. Parse Query Parameters
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const providers = searchParams.get('providers') || searchParams.get('provider');
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
  const page = searchParams.get('page');
  const sort = searchParams.get('sort');
  const language = searchParams.get('language');
  const region = searchParams.get('region');
  const published_after = searchParams.get('published_after');
  const published_before = searchParams.get('published_before');
  const duration = searchParams.get('duration');
  const minDuration = searchParams.get('min_duration') ? Number(searchParams.get('min_duration')) : undefined;
  const maxDuration = searchParams.get('max_duration') ? Number(searchParams.get('max_duration')) : undefined;
  const bypassCache = searchParams.get('no_cache') === 'true' || request.headers.get('cache-control') === 'no-cache';

  if (!q) {
    return Normalizer.error({
      service: 'videos',
      statusCode: 400,
      errors: [
        {
          code: 'INVALID_QUERY',
          message: 'The query parameter "q" is required for video search.',
          retryable: false,
        },
      ],
    });
  }

  // 4. Orchestrate Providers
  const result = await ProviderOrchestrator.execute<UnifiedVideo[]>(
    'videos',
    'search',
    {
      q,
      limit,
      page,
      sort,
      language,
      region,
      published_after,
      published_before,
      duration,
    },
    {
      specificProvider: providers || undefined,
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/videos/search',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'videos',
      statusCode: result.error?.code === 'QUOTA_EXHAUSTED' ? 429 : 502,
      errors: [result.error || { code: 'SEARCH_FAILED', message: 'Failed to search videos' }],
      provider: result.providerName,
    });
  }

  // 5. Intelligent Local Filtering (post-fetch duration or client-side refinement)
  let finalVideos = result.data;
  if (minDuration !== undefined || maxDuration !== undefined) {
    const filtered = FilterEngine.applyFilters(finalVideos, {
      minDurationSeconds: minDuration,
      maxDurationSeconds: maxDuration,
    });
    finalVideos = filtered.filtered;
  }

  const raw = result.rawResponse as { nextPageToken?: string } | undefined;

  return Normalizer.success({
    service: 'videos',
    data: finalVideos,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
    totalReturned: finalVideos.length,
    nextPage: raw?.nextPageToken || null,
  });
}

