import crypto from 'crypto';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  provider: string;
}

export class GatewayCache {
  private static store = new Map<string, CacheEntry<unknown>>();
  private static inFlight = new Map<string, Promise<unknown>>();
  private static hits = 0;
  private static misses = 0;

  /**
   * Build a deterministic cache key from parameters
   */
  static generateKey(
    service: string,
    operation: string,
    params: Record<string, unknown>,
    scope = 'global'
  ): string {
    const sortedKeys = Object.keys(params).sort();
    const normalized: Record<string, unknown> = {};
    for (const k of sortedKeys) {
      const val = params[k];
      if (val !== undefined && val !== null && val !== '') {
        normalized[k] = val;
      }
    }

    const payload = JSON.stringify({ service, operation, scope, normalized });
    const hash = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 24);
    return `morx_cache:${scope}:${service}:${operation}:${hash}`;
  }

  /**
   * Get value from cache if valid
   */
  static get<T>(key: string): { hit: boolean; data: T | null; provider?: string } {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      return { hit: false, data: null };
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return { hit: false, data: null };
    }

    this.hits++;
    return { hit: true, data: entry.data, provider: entry.provider };
  }

  /**
   * Put value into cache with specified TTL in seconds
   */
  static set<T>(key: string, data: T, ttlSeconds: number, provider: string): void {
    if (ttlSeconds <= 0) return;

    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      provider,
    });

    // Housekeeping if cache grows excessively
    if (this.store.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.store.entries()) {
        if (now > v.expiresAt) this.store.delete(k);
      }
    }
  }

  /**
   * Request Coalescing (Deduplication):
   * If an identical call is currently in-flight, return the existing promise.
   */
  static async coalesce<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const active = this.inFlight.get(key);
    if (active) {
      return active as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Invalidate specific key or service prefix
   */
  static invalidate(pattern: string): number {
    let count = 0;
    for (const k of this.store.keys()) {
      if (k.includes(pattern)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }

  /**
   * Client-level data isolation purge (User-requested or client deletion)
   */
  static purgeClientData(clientId: string): number {
    return this.invalidate(clientId);
  }

  /**
   * OAuth revocation cleanup for social/connected accounts
   */
  static purgeOAuthData(provider: string, accountId?: string): number {
    const pattern = accountId ? `${provider}:${accountId}` : provider;
    return this.invalidate(pattern);
  }

  /**
   * Scheduled deletion & automatic retention expiration enforcement
   */
  static purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [k, v] of this.store.entries()) {
      if (now > v.expiresAt) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }

  /**
   * Cache statistics
   */
  static getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : '0.00',
    };
  }
}

