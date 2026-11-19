import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/supabase';
import {
  ApiClientRecord,
  ApiKeyRecord,
  ProviderHealth,
  ServiceCategory,
} from '@/lib/gateway/types';
import { generateApiKey } from '@/lib/gateway/security/crypto';

// Path to local disk store cache
const STORE_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(STORE_DIR, 'gateway-store.json');

// In-Memory Storage (synced with permanent disk store + Supabase)
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

// Helper to load store from disk
function loadStoreFromDisk() {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf8');
      if (content.trim()) {
        const data = JSON.parse(content);
        if (Array.isArray(data.clients)) {
          memoryClients.clear();
          data.clients.forEach((c: ApiClientRecord) => {
            if (c.id !== 'client_grad_project_01') {
              memoryClients.set(c.id, c);
            }
          });
        }
        if (Array.isArray(data.keys)) {
          memoryKeys.clear();
          data.keys.forEach((k: ApiKeyRecord) => {
            if (k.clientId !== 'client_grad_project_01') {
              memoryKeys.set(k.keyHash, k);
            }
          });
        }
      }
    } else {
      saveStoreToDisk();
    }
  } catch (err) {
    console.error('Failed to load gateway-store.json:', err);
  }
}

// Helper to save store to disk atomically
function saveStoreToDisk() {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
    const data = {
      clients: Array.from(memoryClients.values()).filter(c => c.id !== 'client_grad_project_01'),
      keys: Array.from(memoryKeys.values()).filter(k => k.clientId !== 'client_grad_project_01'),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save gateway-store.json:', err);
  }
}

// Load on initialization
loadStoreFromDisk();

// Helper to resolve providers and endpoints from service categories
export function resolveProvidersAndEndpointsFromServices(services: (ServiceCategory | '*')[]) {
  if (services.includes('*')) {
    return {
      providers: ['*'],
      endpoints: ['*'],
    };
  }

  const providers: string[] = [];
  const endpoints: string[] = [];

  for (const s of services) {
    switch (s) {
      case 'videos':
        providers.push('youtube');
        endpoints.push('/api/v1/videos/search');
        break;
      case 'weather':
        providers.push('openweather', 'open_meteo');
        endpoints.push('/api/v1/weather/current', '/api/v1/weather/forecast', '/api/v1/weather/air-quality');
        break;
      case 'maps':
        providers.push('google_maps', 'mapbox');
        endpoints.push('/api/v1/maps/geocode', '/api/v1/maps/reverse-geocode', '/api/v1/maps/places', '/api/v1/maps/directions', '/api/v1/maps/isochrone', '/api/v1/maps/distance-matrix');
        break;
      case 'routing':
        providers.push('google_routes', 'internal_tsp', 'osrmroute');
        endpoints.push('/api/v1/routes/directions', '/api/v1/routes/optimize', '/api/v1/routes/matrix');
        break;
      case 'finance':
        providers.push('frankfurter');
        endpoints.push('/api/v1/finance/exchange');
        break;
      case 'news':
        providers.push('gnews');
        endpoints.push('/api/v1/news/search');
        break;
      case 'utils':
        providers.push('ip_geolocation');
        endpoints.push('/api/v1/utils/ip-lookup');
        break;
      case 'tiktok':
        providers.push('tiktok');
        endpoints.push('/api/v1/tiktok/videos', '/api/v1/tiktok/user');
        break;
      case 'instagram':
        providers.push('instagram');
        endpoints.push('/api/v1/instagram/media', '/api/v1/instagram/user');
        break;
    }
  }

  return {
    providers: Array.from(new Set(providers)),
    endpoints: Array.from(new Set(endpoints)),
  };
}

export class GatewayDatabase {
  /**
   * Lookup client and key by SHA-256 hash
   */
  static async getClientByKeyHash(
    keyHash: string
  ): Promise<{ client: ApiClientRecord; key: ApiKeyRecord } | null> {
    loadStoreFromDisk();

    // 1. Try local disk-backed memory
    const memKey = memoryKeys.get(keyHash);
    if (memKey && memKey.status === 'active') {
      const memClient = memoryClients.get(memKey.clientId);
      if (memClient && memClient.status === 'active') {
        return { client: memClient, key: memKey };
      }
    }

    // 2. Query Supabase
    try {
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
          const meta = clientData.metadata || {};
          const client: ApiClientRecord = {
            id: clientData.id,
            name: clientData.name,
            description: clientData.description,
            status: clientData.status,
            rateLimitPerMinute: clientData.rate_limit_per_minute || 120,
            rateLimitPerHour: clientData.rate_limit_per_hour || 2000,
            rateLimitPerDay: clientData.rate_limit_per_day || 20000,
            allowedServices: clientData.allowed_services || ['*'],
            allowedProviders: meta.allowedProviders || ['*'],
            allowedEndpoints: meta.allowedEndpoints || ['*'],
            createdAt: clientData.created_at,
            rawKey: clientData.raw_key || keyData.raw_key,
            expiresAt: keyData.expires_at,
            lastUsedAt: keyData.last_used_at,
            userId: meta.userId,
            userEmail: meta.userEmail,
          };
          const key: ApiKeyRecord = {
            id: keyData.id,
            clientId: keyData.client_id,
            keyPrefix: keyData.key_prefix,
            keyHash: keyData.key_hash,
            status: keyData.status,
            expiresAt: keyData.expires_at,
            createdAt: keyData.created_at,
            lastUsedAt: keyData.last_used_at,
            rawKey: keyData.raw_key,
          };
          memoryClients.set(client.id, client);
          memoryKeys.set(keyHash, key);
          saveStoreToDisk();
          return { client, key };
        }
      }
    } catch {
      // Supabase unavailable
    }

    return null;
  }

  /**
   * Register a new API Client and generate an API key
   */
  static async createClient(params: {
    name: string;
    description?: string;
    allowedServices?: (ServiceCategory | '*')[];
    allowedProviders?: (string | '*')[];
    allowedEndpoints?: (string | '*')[];
    rateLimitPerMinute?: number;
    userId?: string;
    userEmail?: string;
    expiresInDays?: number;
  }): Promise<{ client: ApiClientRecord; rawKey: string }> {
    loadStoreFromDisk();

    const { rawKey, keyPrefix, keyHash } = generateApiKey('live');
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresInDays = params.expiresInDays || 365;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const createdAt = new Date().toISOString();

    const allowedServices: (ServiceCategory | '*')[] = params.allowedServices && params.allowedServices.length > 0 ? params.allowedServices : ['*'];
    const resolved = resolveProvidersAndEndpointsFromServices(allowedServices);
    const allowedProviders = params.allowedProviders && params.allowedProviders.length > 0 ? params.allowedProviders : resolved.providers;
    const allowedEndpoints = params.allowedEndpoints && params.allowedEndpoints.length > 0 ? params.allowedEndpoints : resolved.endpoints;

    const newClient: ApiClientRecord = {
      id: clientId,
      name: params.name,
      description: params.description || '',
      status: 'active',
      rateLimitPerMinute: params.rateLimitPerMinute || 120,
      rateLimitPerHour: 2000,
      rateLimitPerDay: 20000,
      allowedServices,
      allowedProviders,
      allowedEndpoints,
      createdAt,
      rawKey,
      expiresAt,
      lastUsedAt: undefined,
      userId: params.userId,
      userEmail: params.userEmail,
    };

    const newKey: ApiKeyRecord = {
      id: keyId,
      clientId,
      keyPrefix,
      keyHash,
      status: 'active',
      createdAt,
      expiresAt,
      rawKey,
    };

    // Save to memory and disk cache
    memoryClients.set(clientId, newClient);
    memoryKeys.set(keyHash, newKey);
    saveStoreToDisk();

    // Persist directly to Supabase
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
        raw_key: rawKey,
        metadata: {
          userId: params.userId,
          userEmail: params.userEmail,
          allowedProviders: newClient.allowedProviders,
          allowedEndpoints: newClient.allowedEndpoints,
        },
      });

      await supabaseAdmin.from('api_keys').insert({
        id: newKey.id,
        client_id: newKey.clientId,
        key_prefix: newKey.keyPrefix,
        key_hash: newKey.keyHash,
        raw_key: rawKey,
        status: newKey.status,
        expires_at: expiresAt,
        last_used_at: null,
      });
    } catch (err) {
      console.error('Failed to persist new client/key to Supabase:', err);
    }

    return { client: newClient, rawKey };
  }

  /**
   * Update an existing API Client (name, description, providers/services, rateLimit, status)
   */
  static async updateClient(
    id: string,
    updates: {
      name?: string;
      description?: string;
      allowedServices?: (ServiceCategory | '*')[];
      allowedProviders?: (string | '*')[];
      allowedEndpoints?: (string | '*')[];
      rateLimitPerMinute?: number;
      status?: 'active' | 'suspended' | 'revoked';
    }
  ): Promise<ApiClientRecord | null> {
    loadStoreFromDisk();

    let client = memoryClients.get(id);
    if (!client) {
      try {
        const { data: dbClient } = await supabaseAdmin
          .from('api_clients')
          .select('*')
          .eq('id', id)
          .single();

        if (dbClient) {
          const meta = dbClient.metadata || {};
          client = {
            id: dbClient.id,
            name: dbClient.name,
            description: dbClient.description || '',
            status: dbClient.status,
            rateLimitPerMinute: dbClient.rate_limit_per_minute || 120,
            rateLimitPerHour: dbClient.rate_limit_per_hour || 2000,
            rateLimitPerDay: dbClient.rate_limit_per_day || 20000,
            allowedServices: dbClient.allowed_services || ['*'],
            allowedProviders: meta.allowedProviders || ['*'],
            allowedEndpoints: meta.allowedEndpoints || ['*'],
            createdAt: dbClient.created_at,
            rawKey: dbClient.raw_key,
            userId: meta.userId,
            userEmail: meta.userEmail,
          };
          memoryClients.set(id, client);
        }
      } catch (err) {
        console.error('Failed to load client from Supabase in updateClient:', err);
      }
    }

    if (!client) return null;

    if (updates.name !== undefined) client.name = updates.name;
    if (updates.description !== undefined) client.description = updates.description;
    if (updates.allowedServices !== undefined) {
      client.allowedServices = updates.allowedServices;
      const resolved = resolveProvidersAndEndpointsFromServices(updates.allowedServices);
      client.allowedProviders = updates.allowedProviders !== undefined ? updates.allowedProviders : resolved.providers;
      client.allowedEndpoints = updates.allowedEndpoints !== undefined ? updates.allowedEndpoints : resolved.endpoints;
    } else {
      if (updates.allowedProviders !== undefined) client.allowedProviders = updates.allowedProviders;
      if (updates.allowedEndpoints !== undefined) client.allowedEndpoints = updates.allowedEndpoints;
    }
    if (updates.rateLimitPerMinute !== undefined) client.rateLimitPerMinute = updates.rateLimitPerMinute;
    if (updates.status !== undefined) {
      client.status = updates.status;
      for (const [hash, key] of memoryKeys.entries()) {
        if (key.clientId === id) {
          key.status = updates.status === 'active' ? 'active' : 'revoked';
        }
      }
    }

    memoryClients.set(id, client);
    saveStoreToDisk();

    try {
      await supabaseAdmin
        .from('api_clients')
        .update({
          name: client.name,
          description: client.description,
          allowed_services: client.allowedServices,
          rate_limit_per_minute: client.rateLimitPerMinute,
          status: client.status,
          metadata: {
            userId: client.userId,
            userEmail: client.userEmail,
            allowedProviders: client.allowedProviders,
            allowedEndpoints: client.allowedEndpoints,
          },
        })
        .eq('id', id);

      if (updates.status !== undefined) {
        await supabaseAdmin
          .from('api_keys')
          .update({
            status: updates.status === 'active' ? 'active' : 'revoked',
          })
          .eq('client_id', id);
      }
    } catch {}

    return client;
  }

  /**
   * Delete / Revoke an API Client and its keys permanently
   */
  static async deleteClient(id: string): Promise<boolean> {
    loadStoreFromDisk();

    // Remove client and associated keys from memory
    memoryClients.delete(id);
    for (const [hash, key] of memoryKeys.entries()) {
      if (key.clientId === id) {
        memoryKeys.delete(hash);
      }
    }
    saveStoreToDisk();

    // Delete permanently from Supabase
    try {
      await supabaseAdmin.from('api_keys').delete().eq('client_id', id);
      await supabaseAdmin.from('api_clients').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete client from Supabase:', err);
    }

    return true;
  }

  /**
   * List registered API Clients (synchronized with Supabase and optionally filtered by user)
   */
  static async listClients(filter?: { userId?: string; userEmail?: string }): Promise<ApiClientRecord[]> {
    loadStoreFromDisk();

    // 1. Fetch from Supabase
    try {
      const { data: clientsData, error: clientsError } = await supabaseAdmin
        .from('api_clients')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: keysData } = await supabaseAdmin
        .from('api_keys')
        .select('*');

      if (!clientsError && clientsData) {
        // Synchronize memory from Supabase
        memoryClients.clear();
        memoryKeys.clear();

        const keysByClientId = new Map<string, any>();
        if (keysData) {
          keysData.forEach((k: any) => {
            keysByClientId.set(k.client_id, k);
            const keyRecord: ApiKeyRecord = {
              id: k.id,
              clientId: k.client_id,
              keyPrefix: k.key_prefix,
              keyHash: k.key_hash,
              status: k.status,
              expiresAt: k.expires_at,
              createdAt: k.created_at,
              lastUsedAt: k.last_used_at,
              rawKey: k.raw_key,
            };
            memoryKeys.set(k.key_hash, keyRecord);
          });
        }

        clientsData.forEach((c: any) => {
          const associatedKey = keysByClientId.get(c.id);
          const meta = c.metadata || {};
          const clientRecord: ApiClientRecord = {
            id: c.id,
            name: c.name,
            description: c.description || '',
            status: c.status,
            rateLimitPerMinute: c.rate_limit_per_minute || 120,
            rateLimitPerHour: c.rate_limit_per_hour || 2000,
            rateLimitPerDay: c.rate_limit_per_day || 20000,
            allowedServices: c.allowed_services || ['*'],
            allowedProviders: meta.allowedProviders || ['*'],
            allowedEndpoints: meta.allowedEndpoints || ['*'],
            createdAt: c.created_at,
            rawKey: c.raw_key || associatedKey?.raw_key,
            expiresAt: associatedKey?.expires_at,
            lastUsedAt: associatedKey?.last_used_at,
            userId: meta.userId,
            userEmail: meta.userEmail,
          };
          memoryClients.set(c.id, clientRecord);
        });

        saveStoreToDisk();
      }
    } catch (err) {
      console.error('Failed to sync clients from Supabase:', err);
    }

    let clients = Array.from(memoryClients.values())
      .filter((c) => c.id !== 'client_grad_project_01')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // If userId or userEmail filter is provided, return only user's clients
    if (filter?.userId || filter?.userEmail) {
      clients = clients.filter((c) => {
        if (filter.userId && c.userId === filter.userId) return true;
        if (filter.userEmail && c.userEmail === filter.userEmail) return true;
        return false;
      });
    }

    return clients;
  }

  /**
   * Record API usage asynchronously and update last_used_at
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
    const now = new Date().toISOString();
    const record = {
      id: `use_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      clientId: params.clientId,
      providerId: params.providerId,
      service: params.service,
      endpoint: params.endpoint,
      statusCode: params.statusCode,
      latencyMs: params.latencyMs,
      cached: params.cached,
      createdAt: now,
    };

    memoryUsage.push(record);
    if (memoryUsage.length > 5000) memoryUsage.shift();

    // Update last_used_at on the key and client in memory
    if (params.clientId) {
      const client = memoryClients.get(params.clientId);
      if (client) {
        client.lastUsedAt = now;
      }
      for (const key of memoryKeys.values()) {
        if (key.clientId === params.clientId) {
          key.lastUsedAt = now;
        }
      }
      saveStoreToDisk();
    }

    try {
      if (params.clientId) {
        await supabaseAdmin
          .from('api_keys')
          .update({ last_used_at: now })
          .eq('client_id', params.clientId);
      }

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
   * List all providers from the database (or catalog)
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
      { id: 'open_meteo', name: 'Open-Meteo Weather API', service: 'weather', priority: 90, status: 'active' },
      { id: 'google_maps', name: 'Google Maps Platform', service: 'maps', priority: 100, status: 'active' },
      { id: 'mapbox', name: 'Mapbox API (Geocoding & Isochrone)', service: 'maps', priority: 80, status: 'active' },
      { id: 'osrmroute', name: 'OSRM Route Engine', service: 'routing', priority: 100, status: 'active' },
      { id: 'google_routes', name: 'Google Routes Optimizer', service: 'routing', priority: 90, status: 'active' },
      { id: 'internal_tsp', name: 'Internal 2-opt TSP Solver', service: 'routing', priority: 50, status: 'active' },
      { id: 'frankfurter', name: 'Frankfurter (ECB Currency Rates)', service: 'finance', priority: 100, status: 'active' },
      { id: 'gnews', name: 'GNews World News API', service: 'news', priority: 100, status: 'active' },
      { id: 'ip_geolocation', name: 'IP Geolocation & Network API', service: 'utils', priority: 100, status: 'active' },
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
