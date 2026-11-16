import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedTikTokUser, UnifiedTikTokVideo } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';

export class TikTokProvider implements IProvider {
  readonly name = 'tiktok';
  readonly service: ServiceCategory = 'tiktok';
  readonly priority = 100;

  private getClientKey(): string | null {
    return process.env.TIKTOK_CLIENT_KEY || null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.getClientKey() && CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const key = this.getClientKey();
    return {
      status: key ? 'healthy' : 'unhealthy',
      latencyMs: 1,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: key ? undefined : 'TIKTOK_CLIENT_KEY is not configured',
      consecutiveFailures: 0,
    };
  }

  async execute<T>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>> {
    const accessToken =
      (params.access_token as string) ||
      (params.token as string) ||
      process.env.TIKTOK_ACCESS_TOKEN;

    if (!accessToken) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'OAUTH_TOKEN_REQUIRED',
          message:
            'TikTok Display API requires an authorized creator OAuth access_token. Provide "access_token" in request params or header.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      // 1. Creator Profile
      if (operation === 'user') {
        const url = 'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,profile_deep_link,is_verified';
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const latencyMs = Date.now() - start;

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.error?.message || `TikTok HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const user = data.data?.user || {};
        const normalized: UnifiedTikTokUser = {
          open_id: user.open_id || '',
          union_id: user.union_id,
          avatar_url: user.avatar_url,
          display_name: user.display_name || 'TikTok Creator',
          profile_deep_link: user.profile_deep_link,
          is_verified: user.is_verified,
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Creator Video List
      if (operation === 'videos') {
        const cursor = params.cursor ? Number(params.cursor) : 0;
        const maxCount = Math.min(Number(params.limit || 20), 50);

        const url = 'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_link,create_time,share_url,like_count,comment_count,share_count,view_count';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            max_count: maxCount,
            cursor,
          }),
        });

        const latencyMs = Date.now() - start;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.error?.message || `TikTok video list HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const videos = data.data?.videos || [];

        const normalized: UnifiedTikTokVideo[] = videos.map((v: any) => ({
          id: v.id,
          provider: 'tiktok',
          title: v.title || v.video_description || 'TikTok Video',
          description: v.video_description || '',
          cover_image_url: v.cover_image_url || null,
          share_url: v.share_url || v.embed_link || '',
          duration_seconds: v.duration ? Math.round(v.duration) : null,
          create_time: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
          statistics: {
            views: v.view_count ?? null,
            likes: v.like_count ?? null,
            comments: v.comment_count ?? null,
            shares: v.share_count ?? null,
          },
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          rawResponse: {
            cursor: data.data?.cursor,
            has_more: data.data?.has_more,
          },
        };
      }

      // 3. Single Video Details
      if (operation === 'video_details') {
        const videoId = String(params.id || '');
        if (!videoId) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Video ID is required.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = 'https://open.tiktokapis.com/v2/video/query/?fields=id,title,video_description,duration,cover_image_url,share_url,like_count,comment_count,share_count,view_count';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: {
              video_ids: [videoId],
            },
          }),
        });

        const latencyMs = Date.now() - start;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'PROVIDER_API_ERROR',
              message: errData.error?.message || `TikTok video query HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const v = data.data?.videos?.[0];
        if (!v) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs,
            error: {
              code: 'NOT_FOUND',
              message: `TikTok video "${videoId}" not found.`,
              provider: this.name,
              retryable: false,
            },
          };
        }

        const normalized: UnifiedTikTokVideo = {
          id: v.id,
          provider: 'tiktok',
          title: v.title || v.video_description || '',
          description: v.video_description || '',
          cover_image_url: v.cover_image_url || null,
          share_url: v.share_url || '',
          duration_seconds: v.duration ? Math.round(v.duration) : null,
          create_time: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
          statistics: {
            views: v.view_count ?? null,
            likes: v.like_count ?? null,
            comments: v.comment_count ?? null,
            shares: v.share_count ?? null,
          },
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: `TikTok operation "${operation}" is not supported.`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}

