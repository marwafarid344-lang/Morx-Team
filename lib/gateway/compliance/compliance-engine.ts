import { ComplianceRegistry } from './compliance-registry';
import { ComplianceEvaluationResult, ClientEligibility } from './types';
import { ServiceCategory } from '../types';

export interface ClientContext {
  clientId?: string;
  clientTier?: 'internal' | 'enterprise_partner' | 'third_party_developer';
  isFirstParty?: boolean;
  requestedCanvas?: 'google_maps' | 'mapbox' | 'none';
  origin?: string;
  allowedProviders?: (string | '*')[];
  allowedEndpoints?: (string | '*')[];
}

export class ComplianceEngine {
  /**
   * Evaluates whether an operation on a provider is permitted for a given client context.
   * Never assumes possessing an API key grants permission to redistribute or proxy.
   */
  static evaluate(
    providerName: string,
    service: ServiceCategory,
    operation: string,
    clientContext: ClientContext = {}
  ): ComplianceEvaluationResult {
    const config = ComplianceRegistry.getConfig(providerName);

    // 1. Unknown Provider Check
    if (!config) {
      return {
        allowed: false,
        complianceStatus: 'BLOCKED_PENDING_APPROVAL',
        errorCode: 'PROVIDER_COMPLIANCE_RESTRICTION',
        errorMessage: `Provider "${providerName}" has not undergone mandatory compliance review.`,
        violationDetails: 'No compliance configuration found in ComplianceRegistry.',
      };
    }

    // 2. Disabled Provider Check
    if (config.complianceStatus === 'DISABLED') {
      return {
        allowed: false,
        complianceStatus: 'DISABLED',
        errorCode: 'PROVIDER_DISABLED',
        errorMessage: `Provider "${providerName}" has been disabled due to contractual, policy, or operational constraints.`,
        violationDetails: config.restrictionReason || 'Provider is currently disabled.',
      };
    }

    // 3. Blocked Pending Approval (e.g. YouTube proxying, TikTok, Instagram)
    if (config.complianceStatus === 'BLOCKED_PENDING_APPROVAL') {
      // Internal first-party UI can access under strictly verified internal terms if permitted
      const isInternalWhitelisted = clientContext.isFirstParty && config.approvedUseCases.length > 0;

      if (!isInternalWhitelisted) {
        return {
          allowed: false,
          complianceStatus: 'BLOCKED_PENDING_APPROVAL',
          errorCode: 'PROVIDER_COMPLIANCE_RESTRICTION',
          errorMessage: `This provider operation is not enabled for this client. External redistribution or proxying is blocked pending mandatory legal approval.`,
          violationDetails: config.restrictionReason || `Provider "${providerName}" is flagged BLOCKED_PENDING_APPROVAL under applicable developer terms.`,
        };
      }
    }

    // 4. Internal Only Check
    if (config.complianceStatus === 'INTERNAL_ONLY' || config.clientEligibility === 'internal_only') {
      if (!clientContext.isFirstParty && clientContext.clientTier !== 'internal') {
        return {
          allowed: false,
          complianceStatus: 'INTERNAL_ONLY',
          errorCode: 'PROVIDER_COMPLIANCE_RESTRICTION',
          errorMessage: `This provider operation is not enabled for this client. Provider "${providerName}" is restricted to internal first-party services only.`,
          violationDetails: 'Third-party developer API proxying is prohibited by applicable terms of service.',
        };
      }
    }

    // 5. Enterprise Only Check
    if (config.clientEligibility === 'enterprise_only') {
      if (clientContext.clientTier === 'third_party_developer') {
        return {
          allowed: false,
          complianceStatus: 'CONDITIONAL',
          errorCode: 'PROVIDER_COMPLIANCE_RESTRICTION',
          errorMessage: `Provider "${providerName}" requires a contracted Enterprise compliance agreement.`,
          violationDetails: 'Standard third-party developer access is restricted.',
        };
      }
    }

    // 5b. Client Allowable Providers Check
    if (clientContext.allowedProviders && clientContext.allowedProviders.length > 0 && !clientContext.allowedProviders.includes('*')) {
      const norm = providerName.toLowerCase().replace(/[-_]/g, '');
      const isAllowed = clientContext.allowedProviders.some(
        (p) => p === providerName || p.toLowerCase().replace(/[-_]/g, '') === norm
      );
      if (!isAllowed) {
        return {
          allowed: false,
          complianceStatus: config.complianceStatus,
          errorCode: 'PROVIDER_NOT_ALLOWED',
          errorMessage: `Provider "${providerName}" is not on the allowable providers list for this client.`,
          violationDetails: `Client allowable providers: ${clientContext.allowedProviders.join(', ')}`,
        };
      }
    }

    // 6. Prohibited Operation Check
    if (config.prohibitedOperations.includes(operation)) {
      return {
        allowed: false,
        complianceStatus: config.complianceStatus,
        errorCode: 'PROVIDER_OPERATION_PROHIBITED',
        errorMessage: `Operation "${operation}" is explicitly prohibited under ${config.applicableAgreement}.`,
        violationDetails: `Prohibited operation requested on provider "${providerName}".`,
      };
    }

    // 7. Allowed Operations Check
    if (config.allowedOperations.length > 0 && !config.allowedOperations.includes(operation)) {
      return {
        allowed: false,
        complianceStatus: config.complianceStatus,
        errorCode: 'PROVIDER_OPERATION_NOT_PERMITTED',
        errorMessage: `Operation "${operation}" is not in the approved operations list for provider "${providerName}".`,
        violationDetails: `Approved operations: ${config.allowedOperations.join(', ')}`,
      };
    }

    // 8. Canvas Co-mingling check for Google Maps Content (Terms §3.2.3)
    if (providerName === 'google_maps' && clientContext.requestedCanvas === 'mapbox') {
      return {
        allowed: false,
        complianceStatus: 'CONDITIONAL',
        errorCode: 'PROVIDER_COMPLIANCE_RESTRICTION',
        errorMessage: 'Displaying Google Maps Content on a non-Google map canvas violates Google Maps Platform Terms §3.2.3.',
        violationDetails: 'Co-mingling restricted content across competing map canvases is strictly prohibited.',
      };
    }

    // Passed All Compliance Checks
    return {
      allowed: true,
      complianceStatus: config.complianceStatus,
      attribution: config.attributionRequirements,
    };
  }

  /**
   * Validate if data can be cached based on provider retention compliance
   */
  static isCacheable(providerName: string, dataType?: string): { allowed: boolean; maxTtlSeconds: number; reason?: string } {
    const config = ComplianceRegistry.getConfig(providerName);
    if (!config || !config.cachingPolicy.allowed) {
      return { allowed: false, maxTtlSeconds: 0, reason: 'Provider caching is not permitted.' };
    }

    if (dataType && config.cachingPolicy.prohibitedDataTypes.includes(dataType)) {
      return {
        allowed: false,
        maxTtlSeconds: 0,
        reason: `Caching of data type "${dataType}" is explicitly prohibited under ${config.applicableAgreement}.`,
      };
    }

    return {
      allowed: true,
      maxTtlSeconds: config.cachingPolicy.maxTtlSeconds,
    };
  }
}
