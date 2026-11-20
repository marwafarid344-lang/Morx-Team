/**
 * MORX API GATEWAY - Core Type Definitions
 * Unified envelopes, provider contracts, and common models
 */

export interface UnifiedResponseMeta {
  provider: string;
  providers_used: string[];
  cached: boolean;
  request_id: string;
  timestamp: string;
  latency_ms?: number;
  total_returned?: number;
  next_page?: string | null;
  quota_cost?: number;
  attribution?: {
    required: boolean;
    displayText: string;
    logoUrl?: string;
    linkUrl: string;
    placement?: string;
  };
  compliance_status?: string;
}

export interface UnifiedError {
  code: string;
  message: string;
  provider?: string;
  retryable?: boolean;
  details?: unknown;
}

export interface UnifiedResponse<T = unknown> {
  success: boolean;
  service: string;
  data: T | null;
  meta: UnifiedResponseMeta;
  errors: UnifiedError[];
}

export type ServiceCategory =
  | 'videos'
  | 'weather'
  | 'maps'
  | 'routing'
  | 'instagram'
  | 'finance'
  | 'news'
  | 'utils';

export type ProviderSelectionPolicy =
  | 'primary'
  | 'fallback'
  | 'specific'
  | 'best_available'
  | 'parallel';

export interface ProviderCapability {
  supportedOperations: string[];
  supportedFilters: string[];
  authType: 'api_key' | 'oauth2' | 'bearer' | 'none';
  paginationSupported: boolean;
  maxLimit?: number;
  rateLimitPerMinute?: number;
  geographicCoverage?: string[];
  quotaCostPerCall?: number;
  notes?: string;
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latencyMs: number;
  lastCheckedAt: string;
  errorMessage?: string;
  consecutiveFailures: number;
}

export interface ProviderResult<T = unknown> {
  success: boolean;
  data: T | null;
  providerName: string;
  latencyMs: number;
  cached?: boolean;
  error?: UnifiedError;
  rawResponse?: unknown;
  meta?: Record<string, any>;
}

export interface IProvider {
  readonly name: string;
  readonly service: ServiceCategory;
  readonly priority: number;
  isAvailable(): Promise<boolean>;
  healthCheck(): Promise<ProviderHealth>;
  execute<T = unknown>(
    operation: string,
    params: Record<string, unknown>
  ): Promise<ProviderResult<T>>;
}

export interface ApiClientRecord {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'suspended' | 'revoked';
  rateLimitPerMinute: number;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  allowedServices: (ServiceCategory | '*')[];
  allowedProviders?: (string | '*')[];
  allowedEndpoints?: (string | '*')[];
  createdAt: string;
  rawKey?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  userId?: string;
  userEmail?: string;
}

export interface ApiKeyRecord {
  id: string;
  clientId: string;
  keyPrefix: string;
  keyHash: string;
  status: 'active' | 'revoked';
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  rawKey?: string;
}

export interface AuthenticatedClientContext {
  client: ApiClientRecord;
  keyId: string;
  scopes: string[];
}

