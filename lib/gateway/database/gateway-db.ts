import { supabaseAdmin } from '@/lib/supabase';
import {
  ApiClientRecord,
  ApiKeyRecord,
  ProviderHealth,
  ServiceCategory,
} from '@/lib/gateway/types';
import { generateApiKey } from '@/lib/gateway/security/crypto';

// In-Memory Fallback Storage (activates automatically if Supabase migration is pending)
const memoryClients: Map<string, ApiClientRecord> = new Map();
const memoryKeys: Map<string, ApiKeyRecord> = new Map();
const memoryUsage: Array<{
  id: string;
  clientId?: string;
  providerId: string;
  service: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  cached: boolean;
  createdAt: string;
}> = [];
const memoryHealth: Map<string, ProviderHealth> = new Map();

// Seed a default Graduation Project demo client for immediate testing
(function seedDemoClient() {
  const demoClientId = 'client_grad_project_01';
  const demoRawKey = 'morx_live_grad_project_2026_demo_key';
  const crypto = require('crypto');
  const demoHash = crypto.createHash('sha256').update(demoRawKey).digest('hex');

  const client: ApiClientRecord = {
    id: demoClientId,
    name: 'Graduation Project Core Client',
    description: 'Unified Integration Layer for Graduation Project',
    status: 'active',
    rateLimitPerMinute: 300,
    rateLimitPerHour: 5000,
    rateLimitPerDay: 50000,
    allowedServices: ['*'],
    createdAt: new Date().toISOString(),
  };

  const key: ApiKeyRecord = {
    id: 'key_grad_demo_01',
    clientId: demoClientId,
    keyPrefix: 'morx_live_grad_',
    keyHash: demoHash,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  memoryClients.set(demoClientId, client);
  memoryKeys.set(demoHash, key);
})();

export class GatewayDatabase {
  /**
   * Lookup client and key by SHA-256 hash
   */
  static async getClientByKeyHash(
    keyHash: string
  ): Promise<{ client: ApiClientRecord; key: ApiKeyRecord } | null> {
    try {
      // 1. Try Supabase
      const { data: keyData, error: keyError } = await supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .single();

      if (!keyError && keyData) {
        const { data: clientData, error: clientError } = await supabaseAdmin
          .from('api_clients')
          .select('*')
          .eq('id', keyData.client_id)
          .eq('status', 'active')
          .single();

        if (!clientError && clientData) {
          return {
            client: {
              id: clientData.id,
              name: clientData.name,
              description: clientData.description,
              status: clientData.status,
              rateLimitPerMinute: clientData.rate_limit_per_minute || 120,
              rateLimitPerHour: clientData.rate_limit_per_hour || 2000,
              rateLimitPerDay: clientData.rate_limit_per_day || 20000,
              allowedServices: clientData.allowed_services || ['*'],
              createdAt: clientData.created_at,
            },
            key: {
              id: keyData.id,
              clientId: keyData.client_id,
              keyPrefix: keyData.key_prefix,
              keyHash: keyData.key_hash,
              status: keyData.status,
              expiresAt: keyData.expires_at,
              createdAt: keyData.created_at,
              lastUsedAt: keyData.last_used_at,
            },
          };
        }
      }
    } catch {
      // Supabase tables might not exist yet; fall back gracefully
    }

    // 2. In-Memory fallback
    const memKey = memoryKeys.get(keyHash);
    if (memKey && memKey.status === 'active') {
      const memClient = memoryClients.get(memKey.clientId);
      if (memClient && memClient.status === 'active') {
        return { client: memClient, key: memKey };
      }
    }

    return null;
  }

  /**
   * Register a new API Client and generate an API key
   */
  static async createClient(params: {
    name: string;
    description?: string;
    allowedServices?: ServiceCategory[] | ['*'];
    rateLimitPerMinute?: number;
  }): Promise<{ client: ApiClientRecord; rawKey: string }> {
    const { rawKey, keyPrefix, keyHash } = generateApiKey('live');
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newClient: ApiClientRecord = {
      id: clientId,
      name: params.name,
      description: params.description,
      status: 'active',
      rateLimitPerMinute: params.rateLimitPerMinute || 120,
      rateLimitPerHour: 2000,
      rateLimitPerDay: 20000,
      allowedServices: params.allowedServices || ['*'],
      createdAt: new Date().toISOString(),
    };

    const newKey: ApiKeyRecord = {
      id: keyId,
      clientId,
      keyPrefix,
      keyHash,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Attempt Supabase insert
    try {
      await supabaseAdmin.from('api_clients').insert({
        id: newClient.id,
        name: newClient.name,
        description: newClient.description,
        status: newClient.status,
        rate_limit_per_minute: newClient.rateLimitPerMinute,
        rate_limit_per_hour: newClient.rateLimitPerHour,
        rate_limit_per_day: newClient.rateLimitPerDay,
        allowed_services: newClient.allowedServices,
      });

      await supabaseAdmin.from('api_keys').insert({
        id: newKey.id,
        client_id: newKey.clientId,
        key_prefix: newKey.keyPrefix,
        key_hash: newKey.keyHash,
        status: newKey.status,
      });
    } catch {
      // Fall back to memory
    }

    // Always mirror to memory for instant availability
    memoryClients.set(clientId, newClient);
    memoryKeys.set(keyHash, newKey);

    return { client: newClient, rawKey };
  }

  /**
   * List all registered API Clients
   */
  static async listClients(): Promise<ApiClientRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('api_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          status: d.status,
          rateLimitPerMinute: d.rate_limit_per_minute,
          rateLimitPerHour: d.rate_limit_per_hour,
          rateLimitPerDay: d.rate_limit_per_day,
          allowedServices: d.allowed_services,
          createdAt: d.created_at,
        }));
      }
    } catch {}

    return Array.from(memoryClients.values());
  }

  /**
   * Record API usage asynchronously
   */
  static async recordUsage(params: {
    clientId?: string;
    providerId: string;
    service: string;
    endpoint: string;
    statusCode: number;
    latencyMs: number;
    cached: boolean;
  }): Promise<void> {
    const record = {
      id: `use_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: params.clientId,
      providerId: params.providerId,
      service: params.service,
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      latencyMs: params.latencyMs,
      cached: params.cached,
      createdAt: new Date().toISOString(),
    };

    memoryUsage.push(record);
    if (memoryUsage.length > 5000) memoryUsage.shift(); // retain last 5000 in memory

    try {
      await supabaseAdmin.from('api_usage').insert({
        client_id: params.clientId || null,
        provider_id: params.providerId,
        service: params.service,
        endpoint: params.endpoint,
        status_code: params.statusCode,
        latency_ms: params.latencyMs,
        cached: params.cached,
      });
    } catch {}
  }

  /**
   * Update and record Provider health metrics
   */
  static async updateProviderHealth(
    providerName: string,
    health: ProviderHealth
  ): Promise<void> {
    memoryHealth.set(providerName, health);

    try {
      await supabaseAdmin.from('provider_health').upsert({
        provider_id: providerName,
        status: health.status,
        latency_ms: health.latencyMs,
        error_message: health.errorMessage || null,
        last_checked_at: health.lastCheckedAt,
      });
    } catch {}
  }

  /**
   * Get provider health
   */
  static getProviderHealth(providerName: string): ProviderHealth {
    return (
      memoryHealth.get(providerName) || {
        status: 'unknown',
        latencyMs: 0,
        lastCheckedAt: new Date().toISOString(),
        consecutiveFailures: 0,
      }
    );
  }

  /**
   * List all providers from the database (or fallback catalog)
   */
  static async listProviders() {
    try {
      const { data, error } = await supabaseAdmin
        .from('providers')
        .select('*')
        .order('priority', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {}

    return [
      { id: 'youtube', name: 'YouTube Data API v3', service: 'videos', priority: 100, status: 'active' },
      { id: 'openweather', name: 'OpenWeather API', service: 'weather', priority: 100, status: 'active' },
      { id: 'google_maps', name: 'Google Maps Platform', service: 'maps', priority: 100, status: 'active' },
      { id: 'mapbox', name: 'Mapbox API', service: 'maps', priority: 80, status: 'active' },
      { id: 'google_routes', name: 'Google Routes Optimizer', service: 'routing', priority: 100, status: 'active' },
      { id: 'internal_tsp', name: 'Internal 2-opt TSP Solver', service: 'routing', priority: 50, status: 'active' },
      { id: 'tiktok', name: 'TikTok Display API', service: 'tiktok', priority: 100, status: 'active' },
      { id: 'instagram', name: 'Meta Instagram Graph API', service: 'instagram', priority: 100, status: 'active' },
    ];
  }

  /**
   * Update provider status or priority in the database
   */
  static async updateProvider(
    id: string,
    updates: { status?: 'active' | 'disabled' | 'maintenance'; priority?: number; configuration?: any }
  ) {
    try {
      const { data, error } = await supabaseAdmin
        .from('providers')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (!error) return data;
    } catch {}

    return null;
  }

  /**
   * Fetch aggregated analytics
   */
  static getAnalytics(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    cacheHitRate: number;
    averageLatencyMs: number;
    byService: Record<string, number>;
    byProvider: Record<string, number>;
    recentRequests: Array<any>;
  } {
    const total = memoryUsage.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        cacheHitRate: 0,
        averageLatencyMs: 0,
        byService: {},
        byProvider: {},
        recentRequests: [],
      };
    }

    let success = 0;
    let cached = 0;
    let totalLatency = 0;
    const byService: Record<string, number> = {};
    const byProvider: Record<string, number> = {};

    for (const item of memoryUsage) {
      if (item.statusCode >= 200 && item.statusCode < 400) success++;
      if (item.cached) cached++;
      totalLatency += item.latencyMs;

      byService[item.service] = (byService[item.service] || 0) + 1;
      byProvider[item.providerId] = (byProvider[item.providerId] || 0) + 1;
    }

    return {
      totalRequests: total,
      successfulRequests: success,
      failedRequests: total - success,
      cacheHitRate: Math.round((cached / total) * 100),
      averageLatencyMs: Math.round(totalLatency / total),
      byService,
      byProvider,
      recentRequests: memoryUsage.slice(-20).reverse(),
    };
  }
}

