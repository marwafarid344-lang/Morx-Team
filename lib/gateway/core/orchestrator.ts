import {
  IProvider,
  ProviderResult,
  ProviderSelectionPolicy,
  ServiceCategory,
  UnifiedError,
} from '../types';
import { ProviderRegistry } from './registry';
import { GatewayCache } from './cache';
import { GatewayDatabase } from '../database/gateway-db';
import { ComplianceEngine, ClientContext } from '../compliance/compliance-engine';

interface OrchestratorOptions extends ClientContext {
  policy?: ProviderSelectionPolicy;
  specificProvider?: string;
  bypassCache?: boolean;
  ttlSeconds?: number;
  clientId?: string;
  endpoint?: string;
}

export class ProviderOrchestrator {
  /**
   * Determine default TTL in seconds based on service and operation
   */
  private static getDefaultTtl(service: ServiceCategory, operation: string): number {
    switch (service) {
      case 'weather':
        return operation === 'current' ? 300 : 900; // 5 min / 15 min
      case 'maps':
        if (operation === 'geocode' || operation === 'reverse_geocode') return 86400; // 24 hours
        if (operation === 'places') return 1800; // 30 min
        return 300; // directions: 5 min
      case 'videos':
        return 600; // 10 min
      case 'routing':
        return 900; // 15 min
      case 'tiktok':
      case 'instagram':
        return 600; // 10 min
      default:
        return 300;
    }
  }

  /**
   * Execute request through the intelligent provider pipeline
   */
  static async execute<T>(
    service: ServiceCategory,
    operation: string,
    params: Record<string, unknown>,
    options: OrchestratorOptions = {}
  ): Promise<ProviderResult<T>> {
    const policy = options.policy || (options.specificProvider ? 'specific' : 'fallback');
    const providers = ProviderRegistry.getProviders(service);

    if (providers.length === 0) {
      return {
        success: false,
        data: null,
        providerName: 'none',
        latencyMs: 0,
        error: {
          code: 'NO_PROVIDERS_AVAILABLE',
          message: `No registered providers found for service "${service}".`,
          retryable: false,
        },
      };
    }

    // 1. Check Cache
    const ttl = options.ttlSeconds ?? this.getDefaultTtl(service, operation);
    const cacheKey = GatewayCache.generateKey(
      service,
      operation,
      params,
      options.specificProvider || 'auto'
    );

    if (!options.bypassCache && ttl > 0) {
      const cached = GatewayCache.get<T>(cacheKey);
      if (cached.hit && cached.data !== null) {
        // Record cached hit asynchronously
        GatewayDatabase.recordUsage({
          clientId: options.clientId,
          providerId: cached.provider || 'cache',
          service,
          endpoint: options.endpoint || `/api/v1/${service}/${operation}`,
          statusCode: 200,
          latencyMs: 1,
          cached: true,
        }).catch(() => {});

        return {
          success: true,
          data: cached.data,
          providerName: cached.provider || 'cache',
          latencyMs: 1,
          cached: true,
        };
      }
    }

    // 2. Select eligible provider(s)
    let candidateProviders: IProvider[] = [];

    if (policy === 'specific' && options.specificProvider) {
      const specific = ProviderRegistry.getProvider(service, options.specificProvider);
      if (!specific) {
        return {
          success: false,
          data: null,
          providerName: options.specificProvider,
          latencyMs: 0,
          error: {
            code: 'SPECIFIC_PROVIDER_NOT_FOUND',
            message: `Requested provider "${options.specificProvider}" does not exist for service "${service}".`,
            retryable: false,
          },
        };
      }
      candidateProviders = [specific];
    } else {
      // Prioritize capable providers
      candidateProviders = [...providers];
    }

    // 2b. Strictly filter candidate providers by Client's allowable providers list
    if (options.allowedProviders && options.allowedProviders.length > 0 && !options.allowedProviders.includes('*')) {
      const isAllowed = (pName: string) => {
        const norm = pName.toLowerCase().replace(/[-_]/g, '');
        return options.allowedProviders!.some(
          (ap) => ap === pName || ap.toLowerCase().replace(/[-_]/g, '') === norm
        );
      };

      candidateProviders = candidateProviders.filter((p) => isAllowed(p.name));

      if (candidateProviders.length === 0) {
        return {
          success: false,
          data: null,
          providerName: options.specificProvider || 'none',
          latencyMs: 0,
          error: {
            code: 'PROVIDER_NOT_ALLOWED',
            message: `No allowable providers configured for service "${service}". Allowed providers: ${options.allowedProviders.join(', ')}`,
            retryable: false,
          },
        };
      }
    }

    // 3. Execute with Coalescing & Fallback
    return GatewayCache.coalesce(cacheKey, async () => {
      const errorsCollected: UnifiedError[] = [];

      for (let i = 0; i < candidateProviders.length; i++) {
        const provider = candidateProviders[i];

        // A. Runtime Compliance Evaluation
        const compliance = ComplianceEngine.evaluate(provider.name, service, operation, {
          clientId: options.clientId,
          clientTier: options.clientTier,
          isFirstParty: options.isFirstParty,
          requestedCanvas: options.requestedCanvas,
          allowedProviders: options.allowedProviders,
          allowedEndpoints: options.allowedEndpoints,
        });

        if (!compliance.allowed) {
          const complianceError: UnifiedError = {
            code: compliance.errorCode || 'PROVIDER_COMPLIANCE_RESTRICTION',
            message: compliance.errorMessage || 'This provider operation is not enabled for this client.',
            provider: provider.name,
            details: compliance.violationDetails,
            retryable: false,
          };

          // Spec Rule: Never silently bypass a compliance restriction through fallback providers.
          if (
            policy === 'specific' ||
            candidateProviders.length === 1 ||
            compliance.errorCode === 'PROVIDER_OPERATION_PROHIBITED' ||
            compliance.complianceStatus === 'BLOCKED_PENDING_APPROVAL' ||
            service === 'videos' ||
            service === 'tiktok' ||
            service === 'instagram'
          ) {
            return {
              success: false,
              data: null,
              providerName: provider.name,
              latencyMs: 0,
              error: complianceError,
            };
          }

          errorsCollected.push(complianceError);
          continue;
        }

        try {
          const result = await provider.execute<T>(operation, params);

          if (result.success && result.data !== null) {
            // Check caching compliance
            const cacheCompliance = ComplianceEngine.isCacheable(provider.name);
            const effectiveTtl = cacheCompliance.allowed 
              ? Math.min(ttl, cacheCompliance.maxTtlSeconds) 
              : 0;

            // Save to cache
            if (effectiveTtl > 0) {
              GatewayCache.set(cacheKey, result.data, effectiveTtl, provider.name);
            }

            // Inject compliance attribution
            result.meta = {
              ...result.meta,
              attribution: compliance.attribution,
              compliance_status: compliance.complianceStatus,
            };

            // Record successful usage
            GatewayDatabase.recordUsage({
              clientId: options.clientId,
              providerId: provider.name,
              service,
              endpoint: options.endpoint || `/api/v1/${service}/${operation}`,
              statusCode: 200,
              latencyMs: result.latencyMs,
              cached: false,
            }).catch(() => {});

            return result;
          }

          // Provider returned a structured error
          if (result.error) {
            errorsCollected.push(result.error);

            // Record failed usage
            GatewayDatabase.recordUsage({
              clientId: options.clientId,
              providerId: provider.name,
              service,
              endpoint: options.endpoint || `/api/v1/${service}/${operation}`,
              statusCode: 502,
              latencyMs: result.latencyMs,
              cached: false,
            }).catch(() => {});

            // If developer requested a specific provider or error is un-retryable client error, stop
            if (
              policy === 'specific' ||
              result.error.code === 'INVALID_PARAMETERS' ||
              result.error.code === 'NOT_FOUND' ||
              result.error.code === 'OAUTH_TOKEN_REQUIRED'
            ) {
              return result;
            }
          }
        } catch (thrownErr: any) {
          const unifiedErr: UnifiedError = {
            code: thrownErr?.code || 'PROVIDER_EXECUTION_EXCEPTION',
            message: thrownErr?.message || 'Unexpected provider execution error',
            provider: provider.name,
            retryable: true,
          };
          errorsCollected.push(unifiedErr);

          GatewayDatabase.recordUsage({
            clientId: options.clientId,
            providerId: provider.name,
            service,
            endpoint: options.endpoint || `/api/v1/${service}/${operation}`,
            statusCode: 500,
            latencyMs: 10,
            cached: false,
          }).catch(() => {});

          if (policy === 'specific') {
            return {
              success: false,
              data: null,
              providerName: provider.name,
              latencyMs: 10,
              error: unifiedErr,
            };
          }
        }
      }

      // If all candidate providers failed
      const primaryError = errorsCollected[0] || {
        code: 'ALL_PROVIDERS_FAILED',
        message: `All providers for service "${service}" failed to execute operation "${operation}".`,
        retryable: true,
      };

      return {
        success: false,
        data: null,
        providerName: candidateProviders[0]?.name || 'unknown',
        latencyMs: 0,
        error: primaryError,
      };
    });
  }
}

