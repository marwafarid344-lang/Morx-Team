import { IProvider, ProviderHealth, ProviderResult, ServiceCategory } from '../../types';
import { UnifiedStreamingCustomization, UnifiedStreamingEmbed } from '../../types/services';
import { CircuitBreaker } from '../../core/circuit-breaker';
import { RateLimiter } from '../../core/rate-limiter';

export class VidoraProvider implements IProvider {
  readonly name = 'vidora';
  readonly service: ServiceCategory = 'streaming';
  readonly priority = 100;

  async isAvailable(): Promise<boolean> {
    return CircuitBreaker.isAllowed(this.name);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://vidora.ac', {
        headers: { 'User-Agent': 'Morx-Gateway/2026' },
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return {
          status: 'healthy',
          latencyMs,
          lastCheckedAt: new Date().toISOString(),
          consecutiveFailures: 0,
        };
      }
      return {
        status: 'degraded',
        latencyMs,
        lastCheckedAt: new Date().toISOString(),
        errorMessage: `HTTP ${res.status}`,
        consecutiveFailures: 1,
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

  /**
   * Helper to format and serialize customization query parameters
   */
  private buildQueryString(params: Record<string, unknown>, extraParams?: Record<string, string | boolean | undefined>): {
    query: string;
    customization: UnifiedStreamingCustomization;
  } {
    const query = new URLSearchParams();
    const customization: UnifiedStreamingCustomization = {};

    const cleanHex = (val: unknown): string | undefined => {
      if (typeof val !== 'string') return undefined;
      const cleaned = val.replace(/^#/, '').trim();
      return /^[0-9a-fA-F]{3,8}$/.test(cleaned) ? cleaned : undefined;
    };

    const parseBool = (val: unknown): boolean | undefined => {
      if (typeof val === 'boolean') return val;
      if (typeof val === 'string') {
        const v = val.toLowerCase().trim();
        if (v === 'true' || v === '1') return true;
        if (v === 'false' || v === '0') return false;
      }
      return undefined;
    };

    // Color customizations
    const primaryColor = cleanHex(params.primaryColor || params.primary_color);
    if (primaryColor) {
      query.set('primaryColor', primaryColor);
      customization.primaryColor = primaryColor;
    }

    const secondaryColor = cleanHex(params.secondaryColor || params.secondary_color);
    if (secondaryColor) {
      query.set('secondaryColor', secondaryColor);
      customization.secondaryColor = secondaryColor;
    }

    const iconColor = cleanHex(params.iconColor || params.icon_color);
    if (iconColor) {
      query.set('iconColor', iconColor);
      customization.iconColor = iconColor;
    }

    // Boolean display switches
    const title = parseBool(params.title);
    if (title !== undefined) {
      query.set('title', String(title));
      customization.title = title;
    }

    const poster = parseBool(params.poster);
    if (poster !== undefined) {
      query.set('poster', String(poster));
      customization.poster = poster;
    }

    const autoplay = parseBool(params.autoplay);
    if (autoplay !== undefined) {
      query.set('autoplay', String(autoplay));
      customization.autoplay = autoplay;
    }

    const nextbutton = parseBool(params.nextbutton || params.next_button);
    if (nextbutton !== undefined) {
      query.set('nextbutton', String(nextbutton));
      customization.nextbutton = nextbutton;
    }

    // Video start timestamp
    if (params.startAt || params.start_at) {
      const sec = Number(params.startAt || params.start_at);
      if (!isNaN(sec) && sec >= 0) {
        query.set('startAt', String(sec));
        customization.startAt = sec;
      }
    }

    // External Subtitle VTT
    if (typeof params.sub_file === 'string' && params.sub_file.trim()) {
      query.set('sub_file', params.sub_file.trim());
      customization.sub_file = params.sub_file.trim();
    }
    if (typeof params.sub_label === 'string' && params.sub_label.trim()) {
      query.set('sub_label', params.sub_label.trim());
      customization.sub_label = params.sub_label.trim();
    }

    // Fallback URL
    if (typeof params.fallback_url === 'string' && params.fallback_url.trim()) {
      query.set('fallback_url', params.fallback_url.trim());
      customization.fallback_url = params.fallback_url.trim();
    }

    // Extra operation-specific params
    if (extraParams) {
      for (const [key, val] of Object.entries(extraParams)) {
        if (val !== undefined) {
          query.set(key, String(val));
        }
      }
    }

    const qs = query.toString();
    return {
      query: qs ? `?${qs}` : '',
      customization,
    };
  }

  async execute<T>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>> {
    const start = Date.now();

    return CircuitBreaker.execute(this.name, async () => {
      // ─── 1. MOVIE EMBED ─────────────────────────────────────────────
      if (operation === 'movie' || operation === 'embed_movie') {
        const tmdbId = params.tmdb_id || params.id || params.tmdbId;
        if (!tmdbId) {
          throw new Error('Missing required parameter: "tmdb_id" or "id" (TMDB Movie ID e.g. 786892)');
        }

        const { query, customization } = this.buildQueryString(params);
        const embedUrl = `https://vidora.ac/movie/${encodeURIComponent(String(tmdbId))}${query}`;
        const iframeTag = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;

        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        const normalized: UnifiedStreamingEmbed = {
          provider: 'vidora',
          type: 'movie',
          id: String(tmdbId),
          embed_url: embedUrl,
          iframe_tag: iframeTag,
          customization: Object.keys(customization).length > 0 ? customization : undefined,
          supported_features: {
            resolutions: ['4K Ultra HD', '1080p Full HD', '720p HD', 'Auto Adaptation'],
            dubs: true,
            subtitles: true,
            postmessage_events: true,
            localstorage_progress_sync: true,
          },
          documentation_url: 'https://vidora.ac',
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          cached: false,
        };
      }

      // ─── 2. TV SERIES EMBED ─────────────────────────────────────────
      if (operation === 'tv' || operation === 'series' || operation === 'embed_tv') {
        const tmdbId = params.tmdb_id || params.id || params.tmdbId;
        const season = params.season ? Number(params.season) : 1;
        const episode = params.episode ? Number(params.episode) : 1;

        if (!tmdbId) {
          throw new Error('Missing required parameter: "tmdb_id" or "id" (TMDB Series ID e.g. 94997)');
        }
        if (isNaN(season) || season < 1) {
          throw new Error('Parameter "season" must be a positive integer');
        }
        if (isNaN(episode) || episode < 1) {
          throw new Error('Parameter "episode" must be a positive integer');
        }

        const { query, customization } = this.buildQueryString(params);
        const embedUrl = `https://vidora.ac/tv/${encodeURIComponent(String(tmdbId))}/${season}/${episode}${query}`;
        const iframeTag = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;

        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        const normalized: UnifiedStreamingEmbed = {
          provider: 'vidora',
          type: 'tv',
          id: String(tmdbId),
          season,
          episode,
          embed_url: embedUrl,
          iframe_tag: iframeTag,
          customization: Object.keys(customization).length > 0 ? customization : undefined,
          supported_features: {
            resolutions: ['4K Ultra HD', '1080p Full HD', '720p HD', 'Auto Adaptation'],
            dubs: true,
            subtitles: true,
            postmessage_events: true,
            localstorage_progress_sync: true,
          },
          documentation_url: 'https://vidora.ac',
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          cached: false,
        };
      }

      // ─── 3. ANIME EMBED ─────────────────────────────────────────────
      if (operation === 'anime' || operation === 'embed_anime') {
        const malId = params.mal_id || params.id || params.malId;
        const number = params.number || params.episode ? Number(params.number || params.episode) : 1;
        const rawType = String(params.sub_or_dub || params.subOrDub || params.type || 'sub').toLowerCase().trim();
        const subOrDub = rawType === 'dub' ? 'dub' : 'sub';
        const fallback = params.fallback !== false && params.fallback !== 'false';

        if (!malId) {
          throw new Error('Missing required parameter: "mal_id" or "id" (MyAnimeList ID e.g. 5)');
        }
        if (isNaN(number) || number < 1) {
          throw new Error('Parameter "number" or "episode" must be a positive integer');
        }

        const extraParams: Record<string, string | boolean | undefined> = {};
        if (fallback) {
          extraParams['fallback'] = 'true';
        }

        const { query, customization } = this.buildQueryString(params, extraParams);
        const embedUrl = `https://vidora.ac/anime/${encodeURIComponent(String(malId))}/${number}/${subOrDub}${query}`;
        const iframeTag = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;

        const latencyMs = Date.now() - start;
        RateLimiter.recordProviderCall(this.name, 1);

        const normalized: UnifiedStreamingEmbed = {
          provider: 'vidora',
          type: 'anime',
          id: String(malId),
          episode: number,
          subOrDub,
          fallback,
          embed_url: embedUrl,
          iframe_tag: iframeTag,
          customization: Object.keys(customization).length > 0 ? customization : undefined,
          supported_features: {
            resolutions: ['1080p Full HD', '720p HD', 'Auto Adaptation'],
            dubs: true,
            subtitles: true,
            postmessage_events: true,
            localstorage_progress_sync: true,
          },
          documentation_url: 'https://vidora.ac',
        };

        return {
          success: true,
          data: normalized as unknown as T,
          providerName: this.name,
          latencyMs,
          cached: false,
        };
      }

      throw new Error(`Unsupported Vidora streaming operation: "${operation}". Supported: movie, tv, anime.`);
    });
  }
}
