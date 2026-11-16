import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedVideo } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class YouTubeProvider implements IProvider {
  readonly name = 'youtube';
  readonly service: ServiceCategory = 'videos';
  readonly priority = 100;

  private getApiKey(): string | null {
    return (
      process.env.YOUTUBE_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      null
    );
  }

  async isAvailable(): Promise<boolean> {
    return !!this.getApiKey() && CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        status: 'unhealthy',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: 'YOUTUBE_API_KEY or GOOGLE_API_KEY environment variable is not configured',
        consecutiveFailures: 0,
      };
    }

    const start = Date.now();
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        return {
          status: 'degraded',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          errorMessage: errorJson?.error?.message || `HTTP ${res.status}`,
          consecutiveFailures: 1,
        };
      }

      return {
        status: 'healthy',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: err.message,
        consecutiveFailures: 1,
      };
    }
  }

  async execute<T = UnifiedVideo[]>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'PROVIDER_CREDENTIALS_MISSING',
          message:
            'YouTube API key is missing. Set YOUTUBE_API_KEY or GOOGLE_API_KEY in your environment.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    if (operation !== 'search') {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `YouTube provider does not support operation "${operation}".`,
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      const q = String(params.q || '');
      const limit = Math.min(Number(params.limit || 20), 50);
      const pageToken = params.page ? String(params.page) : '';
      const order = params.sort ? String(params.sort) : 'relevance';
      const publishedAfter = params.published_after ? String(params.published_after) : '';
      const publishedBefore = params.published_before ? String(params.published_before) : '';
      const regionCode = params.region ? String(params.region) : '';
      const relevanceLanguage = params.language ? String(params.language) : '';
      const videoDuration = params.duration ? String(params.duration) : '';

      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('maxResults', String(limit));
      searchUrl.searchParams.set('q', q);
      searchUrl.searchParams.set('key', apiKey);
      if (pageToken) searchUrl.searchParams.set('pageToken', pageToken);
      if (order) searchUrl.searchParams.set('order', order);
      if (publishedAfter) searchUrl.searchParams.set('publishedAfter', publishedAfter);
      if (publishedBefore) searchUrl.searchParams.set('publishedBefore', publishedBefore);
      if (regionCode) searchUrl.searchParams.set('regionCode', regionCode);
      if (relevanceLanguage) searchUrl.searchParams.set('relevanceLanguage', relevanceLanguage);
      if (videoDuration) searchUrl.searchParams.set('videoDuration', videoDuration);

      const response = await fetch(searchUrl.toString(), {
        headers: { Accept: 'application/json' },
      });

      const latencyMs = Date.now() - start;
      RateLimiter.recordProviderCall(this.name, 100); // YouTube search consumes 100 quota units

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `YouTube API error (HTTP ${response.status})`;
        const isQuota = response.status === 403 && message.toLowerCase().includes('quota');

        return {
          success: false,
          data: null,
          providerName: this.name,
          latencyMs,
          error: {
            code: isQuota ? 'QUOTA_EXHAUSTED' : 'PROVIDER_API_ERROR',
            message,
            provider: this.name,
            retryable: !isQuota && response.status >= 500,
            details: errorData?.error,
          },
        };
      }

      const searchJson = await response.json();
      const items = searchJson.items || [];
      const videoIds = items.map((it: any) => it.id?.videoId).filter(Boolean);

      // Optional metadata enrichment with videos.list (contentDetails, statistics)
      const detailsMap = new Map<string, any>();
      if (videoIds.length > 0) {
        try {
          const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
          detailsUrl.searchParams.set('part', 'contentDetails,statistics');
          detailsUrl.searchParams.set('id', videoIds.join(','));
          detailsUrl.searchParams.set('key', apiKey);

          const detRes = await fetch(detailsUrl.toString());
          if (detRes.ok) {
            const detJson = await detRes.json();
            for (const v of detJson.items || []) {
              detailsMap.set(v.id, v);
            }
            RateLimiter.recordProviderCall(this.name, 1);
          }
        } catch {
          // Graceful fallback: continue with search snippet only
        }
      }

      // Helper to parse ISO 8601 duration (e.g. PT4M13S)
      function parseDuration(isoDuration?: string): number | null {
        if (!isoDuration) return null;
        const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return null;
        const hours = parseInt(matches[1] || '0', 10);
        const minutes = parseInt(matches[2] || '0', 10);
        const seconds = parseInt(matches[3] || '0', 10);
        return hours * 3600 + minutes * 60 + seconds;
      }

      const normalized: UnifiedVideo[] = items.map((item: any) => {
        const videoId = item.id?.videoId || '';
        const snippet = item.snippet || {};
        const details = detailsMap.get(videoId);
        const stats = details?.statistics || {};
        const durationSec = parseDuration(details?.contentDetails?.duration);

        return {
          id: videoId,
          provider: 'youtube',
          title: snippet.title || '',
          description: snippet.description || '',
          thumbnail:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            null,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          creator: {
            id: snippet.channelId || '',
            name: snippet.channelTitle || 'Unknown Creator',
            url: snippet.channelId ? `https://www.youtube.com/channel/${snippet.channelId}` : null,
          },
          published_at: snippet.publishedAt || null,
          duration_seconds: durationSec,
          statistics: {
            views: stats.viewCount ? parseInt(stats.viewCount, 10) : null,
            likes: stats.likeCount ? parseInt(stats.likeCount, 10) : null,
            comments: stats.commentCount ? parseInt(stats.commentCount, 10) : null,
          },
          location: null,
        };
      });

      return {
        success: true,
        data: normalized as unknown as T,
        providerName: this.name,
        latencyMs,
        rawResponse: {
          nextPageToken: searchJson.nextPageToken || null,
          pageInfo: searchJson.pageInfo,
        },
      };
    });
  }
}

