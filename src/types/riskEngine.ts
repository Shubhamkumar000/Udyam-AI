export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' | 'CRITICAL';

export type LicenseStatusNormalized = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';

export interface PenaltyEstimate {
  min: number;
  max: number;
  formatted: string;
  confidence: number;
}

export interface LicenseRiskAssessment {
  licenseId: string;
  licenseType: string;
  licenseNumber: string;
  issueDate: string;
  expiryDate: string;
  issuingAuthority: string;
  status: LicenseStatusNormalized;
  daysUntilExpiry: number;
  daysSinceExpiry: number;
  riskLevel: RiskLevel;
  urgency: string;
  estimatedPenalty: PenaltyEstimate;
  recommendedAction: string;
  legalConsequences: string[];
  penaltyReasons: string[];
}

export interface MissingLicenseRisk {
  licenseType: string;
  risk: 'HIGH' | 'MEDIUM';
  potentialImpact: string;
  penaltyEstimate: { min: number; max: number; formatted: string };
  recommendedAction: string;
  legalConsequences: string[];
}

export interface AuditIssue {
  id: number;
  type: 'LICENSE_RISK' | 'MISSING_LICENSE';
  licenseType: string;
  description: string;
  riskLevel: RiskLevel;
  urgency: string;
  potentialPenalty: string;
  potentialConsequence: string;
}

export interface ComplianceRiskReport {
  complianceScore: number;
  overallRisk: RiskLevel;
  overallRiskLabel: string;
  penaltyExposure: { min: number; max: number; formatted: string };
  licensesAtRisk: number;
  businessSector: string;
  state: string;
  requiredLicenses: string[];
  licenseAssessments: LicenseRiskAssessment[];
  missingLicenses: MissingLicenseRisk[];
  expiryRiskSummary: {
    active: number;
    medium: number;
    high: number;
    critical: number;
  };
  auditReport: {
    complianceScore: number;
    overallRisk: string;
    issuesFound: AuditIssue[];
    recommendedActions: string[];
  };
  generatedAt: string;
}

export interface SingleLicenseRiskAssessment {
  licenseId?: string;
  licenseType: string;
  licenseNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  status: LicenseStatusNormalized;
  daysUntilExpiry: number | null;
  daysSinceExpiry: number | null;
  riskLevel: RiskLevel;
  urgency: string;
  estimatedPenalty: PenaltyEstimate;
  recommendedAction: string;
  legalConsequences: string[];
  penaltyReasons?: string[];
  potentialImpact?: string;
}
