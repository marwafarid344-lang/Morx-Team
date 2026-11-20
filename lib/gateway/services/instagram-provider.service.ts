import { UnifiedInstagramReel, UnifiedInstagramPost } from '../types/services';
import { GatewayCache } from '../core/cache';
import { UnifiedError } from '../types';

// =============================================================================
// 1. SEARCH PARAMETERS & RESULT CONTRACTS
// =============================================================================

export interface InstagramReelsSearchParams {
  tag: string;
  limit?: number;
  sort?: 'top' | 'recent';
  bypassCache?: boolean;
}

export interface InstagramReelsResult {
  success: boolean;
  data: UnifiedInstagramReel[];
  provider: 'apify' | 'rapidapi';
  providersUsed: string[];
  cached: boolean;
  latencyMs: number;
  totalReturned: number;
  error?: UnifiedError;
}

export interface InstagramPostSearchParams {
  tag: string;
  limit?: number;
  sort?: 'top' | 'recent';
  bypassCache?: boolean;
}

export interface InstagramPostsResult {
  success: boolean;
  data: UnifiedInstagramPost[];
  provider: 'apify' | 'rapidapi';
  providersUsed: string[];
  cached: boolean;
  latencyMs: number;
  totalReturned: number;
  error?: UnifiedError;
}

// =============================================================================
// 2. PRIMARY PROVIDER ADAPTER: APIFY (apify/instagram-hashtag-scraper)
// =============================================================================

export class ApifyInstagramAdapter {
  readonly name = 'apify' as const;

  /**
   * Search Instagram Reels ONLY with extreme precision (guaranteed playable video stream)
   */
  async searchReels(params: { tag: string; limit: number; sort: 'top' | 'recent' }): Promise<UnifiedInstagramReel[]> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error('APIFY_API_TOKEN is not configured in environment variables');
    }

    const { tag, limit, sort } = params;
    const url = `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

    const payload = {
      hashtags: [tag],
      resultsLimit: Math.min(limit * 2, 40), // Request slightly more to guarantee limit after precision filter
      resultsType: 'reels',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(65000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Apify Instagram scraper failed with HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Apify response format invalid: expected an array of dataset items');
    }

    // STRICT REELS GATEKEEPER: Zero static photos. Must have playable video stream URL.
    const reelsOnly = data.filter((item: any) => {
      const hasVideoUrl = Boolean(item.videoUrl);
      const isVideoType = item.type === 'Video' || item.productType === 'clips' || item.productType === 'reels';
      return hasVideoUrl && (isVideoType || (item.videoDuration && Number(item.videoDuration) > 0));
    });

    const normalized: UnifiedInstagramReel[] = reelsOnly.map((item: any) => {
      const shortcode = item.shortCode || item.code || '';
      const permalink = item.url || (shortcode ? `https://www.instagram.com/reel/${shortcode}/` : '');
      const thumbnail = item.displayUrl || (Array.isArray(item.images) && item.images[0]) || null;
      const videoUrl = item.videoUrl || null;
      const likes = item.likesCount ?? item.likeCount ?? null;
      const comments = item.commentsCount ?? item.commentCount ?? null;
      const views = item.videoViewCount ?? item.viewCount ?? item.videoPlayCount ?? null;
      const plays = item.videoPlayCount ?? item.igPlayCount ?? null;
      const shares = item.sharesCount ?? null;

      return {
        provider: 'apify',
        id: String(item.id || shortcode || Math.random().toString(36).substring(2)),
        shortcode,
        caption: item.caption || null,
        video_url: videoUrl,
        permalink,
        thumbnail,
        published_at: item.timestamp || null,
        duration: item.videoDuration ? Number(item.videoDuration) : null,
        like_count: likes !== null ? Number(likes) : null,
        comments_count: comments !== null ? Number(comments) : null,
        views_count: views !== null ? Number(views) : null,
        play_count: plays !== null ? Number(plays) : null,
        shares_count: shares !== null ? Number(shares) : null,
        owner: {
          id: item.ownerId ? String(item.ownerId) : undefined,
          username: item.ownerUsername || 'instagram_user',
          full_name: item.ownerFullName || undefined,
          profile_pic_url: item.ownerProfilePicUrl || undefined,
        },
        hashtags: Array.isArray(item.hashtags) ? item.hashtags : [tag],
      };
    });

    if (sort === 'top') {
      normalized.sort((a, b) => (b.like_count || b.views_count || 0) - (a.like_count || a.views_count || 0));
    } else if (sort === 'recent') {
      normalized.sort((a, b) => {
        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });
    }

    return normalized.slice(0, limit);
  }

  /**
   * Search Instagram Posts ONLY with extreme precision (static photos, carousels, zero video reels)
   */
  async searchPosts(params: { tag: string; limit: number; sort: 'top' | 'recent' }): Promise<UnifiedInstagramPost[]> {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error('APIFY_API_TOKEN is not configured in environment variables');
    }

    const { tag, limit, sort } = params;
    const url = `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

    const payload = {
      hashtags: [tag],
      resultsLimit: Math.min(limit * 2, 40),
      resultsType: 'posts',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(65000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Apify Instagram scraper failed with HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error('Apify response format invalid: expected an array of dataset items');
    }

    // STRICT POSTS GATEKEEPER: Zero video reels. Must be static Image or Carousel/Sidecar.
    const postsOnly = data.filter((item: any) => {
      // Strictly reject any video stream or clip
      if (item.videoUrl || item.type === 'Video' || item.productType === 'clips' || item.productType === 'reels') {
        return false;
      }
      const hasImage = Boolean(item.displayUrl || (Array.isArray(item.images) && item.images.length > 0));
      return hasImage;
    });

    const normalized: UnifiedInstagramPost[] = postsOnly.map((item: any) => {
      const shortcode = item.shortCode || item.code || '';
      const permalink = item.url || (shortcode ? `https://www.instagram.com/p/${shortcode}/` : '');
      const displayUrl = item.displayUrl || (Array.isArray(item.images) && item.images[0]) || '';
      const images: string[] = [];
      if (Array.isArray(item.images) && item.images.length > 0) {
        images.push(...item.images);
      } else if (displayUrl) {
        images.push(displayUrl);
      }
      const likes = item.likesCount ?? item.likeCount ?? null;
      const comments = item.commentsCount ?? item.commentCount ?? null;
      const isCarousel = item.type === 'Sidecar' || item.type === 'Carousel' || images.length > 1;

      return {
        provider: 'apify',
        id: String(item.id || shortcode || Math.random().toString(36).substring(2)),
        shortcode,
        type: isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE',
        caption: item.caption || null,
        display_url: displayUrl,
        images,
        permalink,
        published_at: item.timestamp || null,
        like_count: likes !== null ? Number(likes) : null,
        comments_count: comments !== null ? Number(comments) : null,
        owner: {
          id: item.ownerId ? String(item.ownerId) : undefined,
          username: item.ownerUsername || 'instagram_user',
          full_name: item.ownerFullName || undefined,
          profile_pic_url: item.ownerProfilePicUrl || undefined,
        },
        hashtags: Array.isArray(item.hashtags) ? item.hashtags : [tag],
      };
    });

    if (sort === 'top') {
      normalized.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
    } else if (sort === 'recent') {
      normalized.sort((a, b) => {
        const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return timeB - timeA;
      });
    }

    return normalized.slice(0, limit);
  }
}

// =============================================================================
// 3. FALLBACK PROVIDER ADAPTER: RAPIDAPI
// =============================================================================

export class RapidApiInstagramAdapter {
  readonly name = 'rapidapi' as const;

  /**
   * Search Instagram Reels ONLY via RapidAPI fallback
   */
  async searchReels(params: { tag: string; limit: number; sort: 'top' | 'recent' }): Promise<UnifiedInstagramReel[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY is not configured in environment variables');
    }

    const host = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-stable-api.p.rapidapi.com';
    const { tag, limit, sort } = params;

    const candidateEndpoints = [
      `https://${host}/v1.2/posts_by_hashtag?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/v1/hashtag?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/hashtag_medias?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/search?search_query=${encodeURIComponent(tag)}`,
    ];

    let lastError: Error | null = null;

    for (const endpointUrl of candidateEndpoints) {
      try {
        const res = await fetch(endpointUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
            'accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) continue;

        const body = await res.json();
        const items = Array.isArray(body)
          ? body
          : Array.isArray(body.data?.items)
          ? body.data.items
          : Array.isArray(body.items)
          ? body.items
          : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.posts)
          ? body.posts
          : [];

        if (items.length === 0) continue;

        // STRICT REELS FILTER: Exclude any static images, carousels, or items without video stream
        const videoOnlyItems = items.filter((m: any) => {
          const isVideoType = m.is_video === true || m.media_type === 2 || m.product_type === 'clips' || m.product_type === 'reels';
          const hasVideoUrl = Boolean(m.video_url || m.video_versions?.[0]?.url);
          return isVideoType || hasVideoUrl;
        });

        if (videoOnlyItems.length === 0) continue;

        const normalized: UnifiedInstagramReel[] = videoOnlyItems.map((m: any) => {
          const shortcode = m.code || m.shortcode || m.id || '';
          const caption = typeof m.caption === 'string' ? m.caption : m.caption?.text || null;
          const thumbnail = m.thumbnail_url || m.display_url || m.image_versions2?.candidates?.[0]?.url || null;
          const videoUrl = m.video_url || m.video_versions?.[0]?.url || null;
          const user = m.user || {};

          return {
            provider: 'rapidapi',
            id: String(m.id || shortcode || Math.random().toString(36).substring(2)),
            shortcode,
            caption,
            video_url: videoUrl,
            permalink: m.permalink || (shortcode ? `https://www.instagram.com/reel/${shortcode}/` : ''),
            thumbnail,
            published_at: m.taken_at_timestamp
              ? new Date(m.taken_at_timestamp * 1000).toISOString()
              : m.taken_at
              ? new Date(m.taken_at * 1000).toISOString()
              : null,
            duration: m.video_duration ? Number(m.video_duration) : null,
            like_count: m.like_count ?? m.likes ?? null,
            comments_count: m.comment_count ?? m.comments ?? null,
            views_count: m.view_count ?? m.play_count ?? null,
            play_count: m.play_count ?? null,
            shares_count: null,
            owner: {
              id: user.pk ? String(user.pk) : undefined,
              username: user.username || 'instagram_user',
              full_name: user.full_name || undefined,
              profile_pic_url: user.profile_pic_url || undefined,
            },
            hashtags: [tag],
          };
        });

        if (sort === 'top') {
          normalized.sort((a, b) => (b.like_count || b.views_count || 0) - (a.like_count || a.views_count || 0));
        } else if (sort === 'recent') {
          normalized.sort((a, b) => {
            const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
            const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
            return timeB - timeA;
          });
        }

        return normalized.slice(0, limit);
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error(`RapidAPI Instagram Scraper host "${host}" returned no valid reels for tag "${tag}".`);
  }

  /**
   * Search Instagram Posts ONLY via RapidAPI fallback
   */
  async searchPosts(params: { tag: string; limit: number; sort: 'top' | 'recent' }): Promise<UnifiedInstagramPost[]> {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY is not configured in environment variables');
    }

    const host = process.env.RAPIDAPI_INSTAGRAM_HOST || 'instagram-scraper-stable-api.p.rapidapi.com';
    const { tag, limit, sort } = params;

    const candidateEndpoints = [
      `https://${host}/v1.2/posts_by_hashtag?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/v1/hashtag?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/hashtag_medias?hashtag=${encodeURIComponent(tag)}`,
      `https://${host}/search?search_query=${encodeURIComponent(tag)}`,
    ];

    let lastError: Error | null = null;

    for (const endpointUrl of candidateEndpoints) {
      try {
        const res = await fetch(endpointUrl, {
          method: 'GET',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': host,
            'accept': 'application/json',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) continue;

        const body = await res.json();
        const items = Array.isArray(body)
          ? body
          : Array.isArray(body.data?.items)
          ? body.data.items
          : Array.isArray(body.items)
          ? body.items
          : Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.posts)
          ? body.posts
          : [];

        if (items.length === 0) continue;

        // STRICT POSTS FILTER: Exclude any video stream or clips
        const postsOnlyItems = items.filter((m: any) => {
          const isVideo = m.is_video === true || m.media_type === 2 || m.product_type === 'clips' || m.product_type === 'reels' || Boolean(m.video_url);
          const hasImage = Boolean(m.display_url || m.thumbnail_url || m.image_versions2?.candidates?.[0]?.url);
          return !isVideo && hasImage;
        });

        if (postsOnlyItems.length === 0) continue;

        const normalized: UnifiedInstagramPost[] = postsOnlyItems.map((m: any) => {
          const shortcode = m.code || m.shortcode || m.id || '';
          const caption = typeof m.caption === 'string' ? m.caption : m.caption?.text || null;
          const displayUrl = m.display_url || m.thumbnail_url || m.image_versions2?.candidates?.[0]?.url || '';
          const images: string[] = [];
          if (Array.isArray(m.carousel_media)) {
            m.carousel_media.forEach((c: any) => {
              const u = c.image_versions2?.candidates?.[0]?.url || c.display_url;
              if (u) images.push(u);
            });
          }
          if (images.length === 0 && displayUrl) {
            images.push(displayUrl);
          }
          const user = m.user || {};
          const isCarousel = images.length > 1 || m.media_type === 8;

          return {
            provider: 'rapidapi',
            id: String(m.id || shortcode || Math.random().toString(36).substring(2)),
            shortcode,
            type: isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE',
            caption,
            display_url: displayUrl,
            images,
            permalink: m.permalink || (shortcode ? `https://www.instagram.com/p/${shortcode}/` : ''),
            published_at: m.taken_at_timestamp
              ? new Date(m.taken_at_timestamp * 1000).toISOString()
              : m.taken_at
              ? new Date(m.taken_at * 1000).toISOString()
              : null,
            like_count: m.like_count ?? m.likes ?? null,
            comments_count: m.comment_count ?? m.comments ?? null,
            owner: {
              id: user.pk ? String(user.pk) : undefined,
              username: user.username || 'instagram_user',
              full_name: user.full_name || undefined,
              profile_pic_url: user.profile_pic_url || undefined,
            },
            hashtags: [tag],
          };
        });

        if (sort === 'top') {
          normalized.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        } else if (sort === 'recent') {
          normalized.sort((a, b) => {
            const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
            const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
            return timeB - timeA;
          });
        }

        return normalized.slice(0, limit);
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error(`RapidAPI Instagram Scraper host "${host}" returned no valid posts for tag "${tag}".`);
  }
}

// Backwards compatibility aliases
export const ApifyInstagramReelsAdapter = ApifyInstagramAdapter;
export const RapidApiInstagramReelsAdapter = RapidApiInstagramAdapter;

// =============================================================================
// 4. UNIFIED INSTAGRAM SERVICE
// =============================================================================

export class InstagramProviderService {
  private static apifyAdapter = new ApifyInstagramAdapter();
  private static rapidApiAdapter = new RapidApiInstagramAdapter();

  /**
   * Search Instagram Reels ONLY (guaranteed playable video clips, zero static images)
   */
  static async searchReels(params: InstagramReelsSearchParams): Promise<InstagramReelsResult> {
    const start = Date.now();

    const rawTag = params.tag ? String(params.tag).trim().replace(/^#+/, '') : '';
    if (!rawTag) {
      return {
        success: false,
        data: [],
        provider: 'apify',
        providersUsed: [],
        cached: false,
        latencyMs: 0,
        totalReturned: 0,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'The "tag" query parameter is required (e.g. ?tag=travel).',
          retryable: false,
        },
      };
    }

    let limit = params.limit !== undefined ? Number(params.limit) : 10;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 30) limit = 30;

    const sort: 'top' | 'recent' = params.sort === 'recent' ? 'recent' : 'top';

    const cacheKey = GatewayCache.generateKey('instagram', 'reels_search', { tag: rawTag.toLowerCase(), limit, sort });
    if (!params.bypassCache) {
      const cached = GatewayCache.get<UnifiedInstagramReel[]>(cacheKey);
      if (cached.hit && cached.data) {
        return {
          success: true,
          data: cached.data,
          provider: (cached.provider as 'apify' | 'rapidapi') || 'apify',
          providersUsed: [(cached.provider as 'apify' | 'rapidapi') || 'apify'],
          cached: true,
          latencyMs: Date.now() - start,
          totalReturned: cached.data.length,
        };
      }
    }

    const providersUsed: string[] = [];

    // Attempt Primary Provider: Apify
    try {
      providersUsed.push('apify');
      const reels = await this.apifyAdapter.searchReels({ tag: rawTag, limit, sort });

      GatewayCache.set(cacheKey, reels, 600, 'apify');

      return {
        success: true,
        data: reels,
        provider: 'apify',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: reels.length,
      };
    } catch (apifyErr: any) {
      console.warn(`[InstagramProviderService] Primary provider (Apify) reels failed: ${apifyErr.message}. Triggering RapidAPI fallback...`);
    }

    // Attempt Fallback Provider: RapidAPI
    try {
      providersUsed.push('rapidapi');
      const reels = await this.rapidApiAdapter.searchReels({ tag: rawTag, limit, sort });

      GatewayCache.set(cacheKey, reels, 600, 'rapidapi');

      return {
        success: true,
        data: reels,
        provider: 'rapidapi',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: reels.length,
      };
    } catch (rapidErr: any) {
      console.error(`[InstagramProviderService] Fallback provider (RapidAPI) reels failed: ${rapidErr.message}`);

      return {
        success: false,
        data: [],
        provider: 'rapidapi',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: 0,
        error: {
          code: 'ALL_PROVIDERS_FAILED',
          message: `All Instagram Reels providers failed for tag "${rawTag}". Apify and RapidAPI were unable to complete the search.`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Search Instagram Posts ONLY (guaranteed static photos / carousels, zero video reels)
   */
  static async searchPosts(params: InstagramPostSearchParams): Promise<InstagramPostsResult> {
    const start = Date.now();

    const rawTag = params.tag ? String(params.tag).trim().replace(/^#+/, '') : '';
    if (!rawTag) {
      return {
        success: false,
        data: [],
        provider: 'apify',
        providersUsed: [],
        cached: false,
        latencyMs: 0,
        totalReturned: 0,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'The "tag" query parameter is required (e.g. ?tag=travel).',
          retryable: false,
        },
      };
    }

    let limit = params.limit !== undefined ? Number(params.limit) : 10;
    if (isNaN(limit) || limit < 1) limit = 10;
    if (limit > 30) limit = 30;

    const sort: 'top' | 'recent' = params.sort === 'recent' ? 'recent' : 'top';

    const cacheKey = GatewayCache.generateKey('instagram', 'posts_search', { tag: rawTag.toLowerCase(), limit, sort });
    if (!params.bypassCache) {
      const cached = GatewayCache.get<UnifiedInstagramPost[]>(cacheKey);
      if (cached.hit && cached.data) {
        return {
          success: true,
          data: cached.data,
          provider: (cached.provider as 'apify' | 'rapidapi') || 'apify',
          providersUsed: [(cached.provider as 'apify' | 'rapidapi') || 'apify'],
          cached: true,
          latencyMs: Date.now() - start,
          totalReturned: cached.data.length,
        };
      }
    }

    const providersUsed: string[] = [];

    // Attempt Primary Provider: Apify
    try {
      providersUsed.push('apify');
      const posts = await this.apifyAdapter.searchPosts({ tag: rawTag, limit, sort });

      GatewayCache.set(cacheKey, posts, 600, 'apify');

      return {
        success: true,
        data: posts,
        provider: 'apify',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: posts.length,
      };
    } catch (apifyErr: any) {
      console.warn(`[InstagramProviderService] Primary provider (Apify) posts failed: ${apifyErr.message}. Triggering RapidAPI fallback...`);
    }

    // Attempt Fallback Provider: RapidAPI
    try {
      providersUsed.push('rapidapi');
      const posts = await this.rapidApiAdapter.searchPosts({ tag: rawTag, limit, sort });

      GatewayCache.set(cacheKey, posts, 600, 'rapidapi');

      return {
        success: true,
        data: posts,
        provider: 'rapidapi',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: posts.length,
      };
    } catch (rapidErr: any) {
      console.error(`[InstagramProviderService] Fallback provider (RapidAPI) posts failed: ${rapidErr.message}`);

      return {
        success: false,
        data: [],
        provider: 'rapidapi',
        providersUsed,
        cached: false,
        latencyMs: Date.now() - start,
        totalReturned: 0,
        error: {
          code: 'ALL_PROVIDERS_FAILED',
          message: `All Instagram Posts providers failed for tag "${rawTag}". Apify and RapidAPI were unable to complete the search.`,
          retryable: true,
        },
      };
    }
  }
}
