import { ApiClientRecord, UnifiedError } from '../types';

interface ClientUsageBucket {
  minuteWindowStart: number;
  minuteCount: number;
  hourWindowStart: number;
  hourCount: number;
  dayWindowStart: number;
  dayCount: number;
}

interface ProviderQuotaMetrics {
  totalCalls: number;
  quotaUnitsConsumed: number;
  lastResetDay: string;
  maxDailyQuota?: number;
}

export class RateLimiter {
  private static clientBuckets = new Map<string, ClientUsageBucket>();
  private static providerQuotas = new Map<string, ProviderQuotaMetrics>();

  /**
   * Check if a client has exceeded their configured rate limits
   */
  static checkClientLimit(client: ApiClientRecord): {
    allowed: boolean;
    remainingMinute: number;
    error?: UnifiedError;
  } {
    const now = Date.now();
    let bucket = this.clientBuckets.get(client.id);

    if (!bucket) {
      bucket = {
        minuteWindowStart: now,
        minuteCount: 0,
        hourWindowStart: now,
        hourCount: 0,
        dayWindowStart: now,
        dayCount: 0,
      };
      this.clientBuckets.set(client.id, bucket);
    }

    // Reset minute window (60,000ms)
    if (now - bucket.minuteWindowStart > 60_000) {
      bucket.minuteWindowStart = now;
      bucket.minuteCount = 0;
    }

    // Reset hour window (3,600,000ms)
    if (now - bucket.hourWindowStart > 3_600_000) {
      bucket.hourWindowStart = now;
      bucket.hourCount = 0;
    }

    // Reset day window (86,400,000ms)
    if (now - bucket.dayWindowStart > 86_400_000) {
      bucket.dayWindowStart = now;
      bucket.dayCount = 0;
    }

    // Check minute limit
    if (bucket.minuteCount >= client.rateLimitPerMinute) {
      return {
        allowed: false,
        remainingMinute: 0,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Client "${client.name}" exceeded limit of ${client.rateLimitPerMinute} requests per minute.`,
          retryable: true,
        },
      };
    }

    // Check hour limit
    if (bucket.hourCount >= client.rateLimitPerHour) {
      return {
        allowed: false,
        remainingMinute: 0,
        error: {
          code: 'RATE_LIMIT_EXCEEDED_HOUR',
          message: `Client "${client.name}" exceeded limit of ${client.rateLimitPerHour} requests per hour.`,
          retryable: true,
        },
      };
    }

    // Increment
    bucket.minuteCount++;
    bucket.hourCount++;
    bucket.dayCount++;

    return {
      allowed: true,
      remainingMinute: Math.max(0, client.rateLimitPerMinute - bucket.minuteCount),
    };
  }

  /**
   * Track external provider quota consumption
   */
  static recordProviderCall(providerName: string, quotaUnits = 1): void {
    const today = new Date().toISOString().split('T')[0];
    let metrics = this.providerQuotas.get(providerName);

    if (!metrics || metrics.lastResetDay !== today) {
      metrics = {
        totalCalls: 0,
        quotaUnitsConsumed: 0,
        lastResetDay: today,
      };
      this.providerQuotas.set(providerName, metrics);
    }

    metrics.totalCalls++;
    metrics.quotaUnitsConsumed += quotaUnits;
  }

  /**
   * Get provider quota usage
   */
  static getProviderMetrics(providerName: string) {
    const today = new Date().toISOString().split('T')[0];
    const metrics = this.providerQuotas.get(providerName);
    if (!metrics || metrics.lastResetDay !== today) {
      return {
        totalCalls: 0,
        quotaUnitsConsumed: 0,
        today,
      };
    }
    return {
      totalCalls: metrics.totalCalls,
      quotaUnitsConsumed: metrics.quotaUnitsConsumed,
      today: metrics.lastResetDay,
    };
  }
}

