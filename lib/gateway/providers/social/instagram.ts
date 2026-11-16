import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedInstagramMedia, UnifiedInstagramProfile } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';

export class InstagramProvider implements IProvider {
  readonly name = 'instagram';
  readonly service: ServiceCategory = 'instagram';
  readonly priority = 100;

  private getAppId(): string | null {
    return process.env.INSTAGRAM_APP_ID || null;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.getAppId() && CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const appId = this.getAppId();
    return {
      status: appId ? 'healthy' : 'unhealthy',
      latencyMs: 1,
      lastCheckedAt: new Date().toISOString(),
      errorMessage: appId ? undefined : 'INSTAGRAM_APP_ID is not configured',
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
      process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      return {
        success: false,
        data: null,
        providerName: this.name,
        latencyMs: 0,
        error: {
          code: 'OAUTH_TOKEN_REQUIRED',
          message:
            'Instagram Graph API requires an authorized access_token. Provide "access_token" in request params or configure INSTAGRAM_ACCESS_TOKEN.',
          provider: this.name,
          retryable: false,
        },
      };
    }

    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      // 1. Profile
      if (operation === 'profile') {
        const url = `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`;
        const res = await fetch(url);
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
              message: errData.error?.message || `Instagram profile HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const profile: UnifiedInstagramProfile = {
          id: data.id,
          username: data.username || 'instagram_user',
          account_type: data.account_type,
          media_count: data.media_count,
        };

        return {
          success: true,
          data: profile as unknown as T,
          providerName: this.name,
          latencyMs,
        };
      }

      // 2. Media List
      if (operation === 'media') {
        const limit = Math.min(Number(params.limit || 20), 50);
        const after = params.after ? String(params.after) : '';

        const url = new URL('https://graph.instagram.com/me/media');
        url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count');
        url.searchParams.set('limit', String(limit));
        if (after) url.searchParams.set('after', after);
        url.searchParams.set('access_token', accessToken);

        const res = await fetch(url.toString());
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
              message: errData.error?.message || `Instagram media HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const data = await res.json();
        const items = data.data || [];

        const normalized: UnifiedInstagramMedia[] = items.map((m: any) => ({
          provider: 'instagram',
          id: m.id,
          type:
            m.media_type === 'IMAGE'
              ? 'IMAGE'
              : m.media_type === 'VIDEO'
              ? 'VIDEO'
              : m.media_type === 'CAROUSEL_ALBUM'
              ? 'CAROUSEL_ALBUM'
              : 'UNKNOWN',
          caption: m.caption || null,
          media_url: m.media_url || null,
          permalink: m.permalink || '',
          thumbnail: m.thumbnail_url || m.media_url || null,
          published_at: m.timestamp || null,
          like_count: m.like_count ?? null,
          comments_count: m.comments_count ?? null,
        }));

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          rawResponse: {
            paging: data.paging,
          },
        };
      }

      // 3. Media Details
      if (operation === 'media_details') {
        const mediaId = String(params.id || '');
        if (!mediaId) {
          return {
            success: false,
            data: null,
            providerName: this.name,
            latencyMs: 0,
            error: {
              code: 'INVALID_PARAMETERS',
              message: 'Media ID is required.',
              provider: this.name,
              retryable: false,
            },
          };
        }

        const url = `https://graph.instagram.com/${mediaId}?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&access_token=${accessToken}`;
        const res = await fetch(url);
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
              message: errData.error?.message || `Instagram media details HTTP ${res.status}`,
              provider: this.name,
              retryable: res.status >= 500,
            },
          };
        }

        const m = await res.json();
        const normalized: UnifiedInstagramMedia = {
          provider: 'instagram',
          id: m.id,
          type:
            m.media_type === 'IMAGE'
              ? 'IMAGE'
              : m.media_type === 'VIDEO'
              ? 'VIDEO'
              : m.media_type === 'CAROUSEL_ALBUM'
              ? 'CAROUSEL_ALBUM'
              : 'UNKNOWN',
          caption: m.caption || null,
          media_url: m.media_url || null,
          permalink: m.permalink || '',
          thumbnail: m.thumbnail_url || m.media_url || null,
          published_at: m.timestamp || null,
          like_count: m.like_count ?? null,
          comments_count: m.comments_count ?? null,
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
          message: `Instagram operation "${operation}" is not supported.`,
          provider: this.name,
          retryable: false,
        },
      };
    });
  }
}

