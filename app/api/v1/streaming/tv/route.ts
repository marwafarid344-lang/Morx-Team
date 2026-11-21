import { NextRequest } from 'next/server';
import { AuthGuard } from '@/lib/gateway/security/auth-guard';
import { RateLimiter } from '@/lib/gateway/core/rate-limiter';
import { ProviderOrchestrator } from '@/lib/gateway/core/orchestrator';
import { Normalizer } from '@/lib/gateway/core/normalizer';
import { UnifiedStreamingEmbed } from '@/lib/gateway/types/services';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await AuthGuard.verify(request, 'streaming');
  if (!auth.authenticated || !auth.context) {
    return Normalizer.error({
      service: 'streaming',
      statusCode: auth.statusCode || 401,
      errors: [auth.error!],
    });
  }

  const rate = RateLimiter.checkClientLimit(auth.context.client);
  if (!rate.allowed) {
    return Normalizer.error({
      service: 'streaming',
      statusCode: 429,
      errors: [rate.error!],
    });
  }

  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdb_id') || searchParams.get('id');
  const season = searchParams.get('season') ? Number(searchParams.get('season')) : 1;
  const episode = searchParams.get('episode') ? Number(searchParams.get('episode')) : 1;

  if (!tmdbId) {
    return Normalizer.error({
      service: 'streaming',
      statusCode: 400,
      errors: [
        {
          code: 'MISSING_TMDB_ID',
          message: 'Missing required query parameter "tmdb_id" or "id" (TMDB TV Show ID, e.g. ?tmdb_id=94997&season=1&episode=1)',
          retryable: false,
        },
      ],
    });
  }

  const bypassCache = searchParams.get('no_cache') === 'true';

  const params: Record<string, unknown> = {
    tmdb_id: tmdbId,
    season,
    episode,
    primaryColor: searchParams.get('primaryColor') || searchParams.get('primary_color') || undefined,
    secondaryColor: searchParams.get('secondaryColor') || searchParams.get('secondary_color') || undefined,
    iconColor: searchParams.get('iconColor') || searchParams.get('icon_color') || undefined,
    title: searchParams.get('title') || undefined,
    poster: searchParams.get('poster') || undefined,
    autoplay: searchParams.get('autoplay') || undefined,
    nextbutton: searchParams.get('nextbutton') || searchParams.get('next_button') || undefined,
    startAt: searchParams.get('startAt') || searchParams.get('start_at') || undefined,
    sub_file: searchParams.get('sub_file') || undefined,
    sub_label: searchParams.get('sub_label') || undefined,
    fallback_url: searchParams.get('fallback_url') || undefined,
  };

  const result = await ProviderOrchestrator.execute<UnifiedStreamingEmbed>(
    'streaming',
    'tv',
    params,
    {
      specificProvider: 'vidora',
      allowedProviders: auth.context.client.allowedProviders,
      allowedEndpoints: auth.context.client.allowedEndpoints,
      bypassCache,
      clientId: auth.context.client.id,
      endpoint: '/api/v1/streaming/tv',
    }
  );

  if (!result.success || !result.data) {
    return Normalizer.error({
      service: 'streaming',
      statusCode: 502,
      errors: [result.error || { code: 'VIDORA_STREAM_FAILED', message: 'Failed to generate Vidora TV streaming embed player' }],
      provider: result.providerName,
    });
  }

  return Normalizer.success({
    service: 'streaming',
    data: result.data,
    provider: result.providerName,
    cached: result.cached,
    latencyMs: result.latencyMs,
  });
}
