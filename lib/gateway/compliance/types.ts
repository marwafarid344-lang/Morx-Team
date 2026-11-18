import { ServiceCategory } from '../types';

export type ComplianceStatus = 
  | 'APPROVED'
  | 'CONDITIONAL'
  | 'INTERNAL_ONLY'
  | 'BLOCKED_PENDING_APPROVAL'
  | 'DISABLED';

export type ClientEligibility = 
  | 'all'
  | 'internal_only'
  | 'enterprise_only'
  | 'verified_partner';

export type DataRedistributionPolicy = 
  | 'PROHIBITED'
  | 'TRANSFORMED_ONLY'
  | 'INTERNAL_ONLY'
  | 'LICENSED_PERMITTED';

export interface AttributionRequirement {
  required: boolean;
  displayText: string;
  logoUrl?: string;
  linkUrl: string;
  placement: 'header' | 'footer' | 'inline' | 'metadata';
}

export interface CachingCompliancePolicy {
  allowed: boolean;
  maxTtlSeconds: number;
  prohibitedDataTypes: string[];
  mandatoryRefreshHours?: number;
  allowPersistentStorage: boolean;
}

export interface ProviderComplianceConfig {
  providerName: string;
  service: ServiceCategory;
  officialDocumentation: string;
  applicableAgreement: string;
  complianceStatus: ComplianceStatus;
  approvedUseCases: string[];
  allowedOperations: string[];
  prohibitedOperations: string[];
  dataRedistributionPolicy: DataRedistributionPolicy;
  dataRetentionPolicy: {
    maxStorageDays: number;
    allowPermanentStorage: boolean;
    deletionOnRevocationRequired: boolean;
  };
  cachingPolicy: CachingCompliancePolicy;
  attributionRequirements: AttributionRequirement;
  oauthRequirements: {
    required: boolean;
    requiredScopes?: string[];
    appReviewRequired?: boolean;
  };
  geographicRestrictions: string[];
  clientEligibility: ClientEligibility;
  requiredApprovals: string[];
  restrictionReason?: string;
  lastReviewedDate: string;
}

export interface ComplianceEvaluationResult {
  allowed: boolean;
  complianceStatus: ComplianceStatus;
  errorCode?: string;
  errorMessage?: string;
  violationDetails?: string;
  attribution?: AttributionRequirement;
}
