/**
 * Client-side Compliance Risk Engine
 * Mirrors server/riskEngine.js for offline fallback and UI helpers.
 */

import type {
  ComplianceRiskReport,
  LicenseRiskAssessment,
  MissingLicenseRisk,
  RiskLevel,
  SingleLicenseRiskAssessment,
} from '../types/riskEngine';
import type { License, OnboardingAnswers } from './udyanStorage';

const MS_PER_DAY = 86400000;
const TODAY = new Date('2026-06-13T00:00:00');

export const SECTOR_REQUIRED_LICENSES: Record<string, string[]> = {
  'Restaurant / Food Service': ['FSSAI', 'GST', 'Trade License', 'Fire NOC', 'Shop & Establishment'],
  'Pharmacy / Medical Store': ['Drug License', 'GST', 'Trade License'],
  'Hotel / Resort': ['FSSAI', 'Trade License', 'GST', 'Fire NOC'],
  'Hospital / Clinic': ['Clinical Establishment License', 'Fire NOC', 'Biomedical Waste Authorization'],
  'Manufacturing Unit': ['Factory License', 'Pollution Consent', 'Fire NOC', 'GST'],
  'Educational Institution': ['Education Board Affiliation', 'Fire NOC', 'Building Safety Certificate'],
};

export const PENALTY_DATABASE: Record<string, { minPenalty: number; maxPenalty: number; reasons: string[]; legalConsequences: string[]; recommendedAction: string }> = {
  FSSAI: { minPenalty: 5000, maxPenalty: 100000, reasons: ['Operating without valid license', 'Late renewal'], legalConsequences: ['Business closure order', 'Seizure of food items'], recommendedAction: 'Renew FSSAI immediately on foodlicenseportal.org.' },
  'Trade License': { minPenalty: 2000, maxPenalty: 50000, reasons: ['Operating without municipal license'], legalConsequences: ['Premises sealing', 'Daily compounding fines'], recommendedAction: 'Renew Trade License through local municipal corporation.' },
  GST: { minPenalty: 10000, maxPenalty: 100000, reasons: ['Late filing', 'Missing registration'], legalConsequences: ['GSTIN suspension', 'E-Way bill blocking'], recommendedAction: 'File returns on services.gst.gov.in.' },
  'Fire NOC': { minPenalty: 10000, maxPenalty: 200000, reasons: ['Missing Fire Safety Certificate'], legalConsequences: ['Immediate closure notice', 'Insurance invalidation'], recommendedAction: 'Apply for Fire NOC renewal with state fire services.' },
  'Drug License': { minPenalty: 50000, maxPenalty: 500000, reasons: ['Selling without license'], legalConsequences: ['Permanent cancellation', 'Criminal prosecution'], recommendedAction: 'Renew through state drug control department.' },
  'Shop & Establishment': { minPenalty: 2000, maxPenalty: 25000, reasons: ['Non-registration'], legalConsequences: ['Labour prosecution', 'Registration cancellation'], recommendedAction: 'Register on state labour portal.' },
  'Factory License': { minPenalty: 25000, maxPenalty: 300000, reasons: ['Unlicensed factory operation'], legalConsequences: ['Factory shutdown', 'Prosecution under Factories Act'], recommendedAction: 'Apply through state labour department.' },
  'Pollution Consent': { minPenalty: 10000, maxPenalty: 150000, reasons: ['Missing SPCB consent'], legalConsequences: ['Closure direction', 'Environmental compensation'], recommendedAction: 'Apply on state pollution control board portal.' },
  'Clinical Establishment License': { minPenalty: 25000, maxPenalty: 200000, reasons: ['Unregistered facility'], legalConsequences: ['Facility closure', 'Debarment from schemes'], recommendedAction: 'Register on clinicalestablishments.gov.in.' },
  'Biomedical Waste Authorization': { minPenalty: 15000, maxPenalty: 100000, reasons: ['Improper waste disposal'], legalConsequences: ['Facility closure', 'SPCB penalties'], recommendedAction: 'Obtain BMW authorization from SPCB.' },
  'Education Board Affiliation': { minPenalty: 10000, maxPenalty: 100000, reasons: ['Unaffiliated institution'], legalConsequences: ['Denial of certifications', 'Derecognition'], recommendedAction: 'Apply for affiliation renewal.' },
  'Building Safety Certificate': { minPenalty: 5000, maxPenalty: 75000, reasons: ['Structural non-compliance'], legalConsequences: ['Evacuation orders', 'Affiliation denial'], recommendedAction: 'Obtain structural audit certificate.' },
};

const DEFAULT_PENALTY = {
  minPenalty: 5000, maxPenalty: 50000,
  reasons: ['Regulatory non-compliance'],
  legalConsequences: ['Operational restrictions', 'Financial penalties'],
  recommendedAction: 'Contact issuing authority immediately.',
};

export function daysUntilExpiry(expiryDate: string, today = TODAY): number {
  const exp = new Date(`${expiryDate}T00:00:00`);
  return Math.ceil((exp.getTime() - today.getTime()) / MS_PER_DAY);
}

export function daysSinceExpiry(expiryDate: string, today = TODAY): number {
  return Math.max(0, -daysUntilExpiry(expiryDate, today));
}

export function calculateRiskLevel(status: string, expiryDate: string, today = TODAY): RiskLevel {
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  const daysLeft = daysUntilExpiry(expiryDate, today);
  const daysOver = daysSinceExpiry(expiryDate, today);

  if ((normalized === 'ACTIVE' || status === 'Active') && daysLeft > 60) return 'LOW';
  if (normalized === 'EXPIRING_SOON' || status === 'Expiring Soon' || (daysLeft >= 0 && daysLeft <= 60)) {
    if (daysLeft > 30) return 'MEDIUM';
    if (daysLeft > 7) return 'HIGH';
    return 'CRITICAL';
  }
  if (normalized === 'EXPIRED' || status === 'Expired' || daysOver > 0) {
    if (daysOver <= 30) return 'HIGH';
    if (daysOver <= 90) return 'VERY_HIGH';
    return 'CRITICAL';
  }
  return 'LOW';
}

function getBusinessSizeMultiplier(employeeCountRange?: string, annualRevenueRange?: string): number {
  let m = 1.0;
  if (employeeCountRange?.includes('250')) m = 2.5;
  else if (employeeCountRange?.includes('101')) m = 2.0;
  else if (employeeCountRange?.includes('51')) m = 1.6;
  else if (employeeCountRange?.includes('21')) m = 1.3;
  else if (employeeCountRange?.includes('6')) m = 1.1;
  if (annualRevenueRange?.includes('Crores')) m *= 1.2;
  return m;
}

export function estimatePenalty(
  licenseType: string,
  daysOver: number,
  employeeCountRange?: string,
  annualRevenueRange?: string
) {
  const meta = PENALTY_DATABASE[licenseType] || DEFAULT_PENALTY;
  const multiplier = getBusinessSizeMultiplier(employeeCountRange, annualRevenueRange);
  let factor = daysOver <= 0 ? 0.15 : daysOver <= 30 ? 0.35 : daysOver <= 90 ? 0.6 : 0.85;
  const range = meta.maxPenalty - meta.minPenalty;
  const min = Math.round((meta.minPenalty + range * factor * 0.3) * multiplier);
  const max = Math.round((meta.minPenalty + range * factor * 0.7) * multiplier);
  const confidence = daysOver > 0 ? Math.min(95, 72 + daysOver) : 65;
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    formatted: `₹${Math.min(min, max).toLocaleString('en-IN')} - ₹${Math.max(min, max).toLocaleString('en-IN')}`,
    confidence: Math.min(95, confidence),
    reasons: meta.reasons,
    legalConsequences: meta.legalConsequences,
    recommendedAction: meta.recommendedAction,
  };
}

export function riskLevelToUrgency(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', VERY_HIGH: 'VERY HIGH', CRITICAL: 'CRITICAL' };
  return map[level];
}

export function getRiskTheme(level: RiskLevel | string) {
  const l = level.toUpperCase().replace(/\s+/g, '_') as RiskLevel;
  const themes: Record<RiskLevel, { bg: string; text: string; border: string; dot: string; label: string }> = {
    LOW: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', label: 'Low' },
    MEDIUM: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', label: 'Medium' },
    HIGH: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', label: 'High' },
    VERY_HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-600', label: 'Very High' },
    CRITICAL: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', label: 'Critical' },
  };
  return themes[l] || themes.MEDIUM;
}

function analyzeLicenseClient(license: License, onboarding: Partial<OnboardingAnswers>): LicenseRiskAssessment {
  const daysLeft = daysUntilExpiry(license.expiry_date);
  const daysOver = daysSinceExpiry(license.expiry_date);
  const riskLevel = calculateRiskLevel(license.status, license.expiry_date);
  const penalty = estimatePenalty(license.type, daysOver, onboarding.employee_count_range, onboarding.annual_revenue_range);
  const meta = PENALTY_DATABASE[license.type] || DEFAULT_PENALTY;

  return {
    licenseId: license.id,
    licenseType: license.type,
    licenseNumber: license.license_number,
    issueDate: license.issue_date,
    expiryDate: license.expiry_date,
    issuingAuthority: license.authority,
    status: license.status === 'Expired' ? 'EXPIRED' : license.status === 'Expiring Soon' ? 'EXPIRING_SOON' : 'ACTIVE',
    daysUntilExpiry: daysLeft,
    daysSinceExpiry: daysOver,
    riskLevel,
    urgency: riskLevelToUrgency(riskLevel),
    estimatedPenalty: penalty,
    recommendedAction: penalty.recommendedAction,
    legalConsequences: meta.legalConsequences,
    penaltyReasons: meta.reasons,
  };
}

function detectMissingClient(sector: string, uploadedTypes: string[]): MissingLicenseRisk[] {
  const required = SECTOR_REQUIRED_LICENSES[sector] || [];
  return required.filter((t) => !uploadedTypes.includes(t)).map((licenseType) => {
    const meta = PENALTY_DATABASE[licenseType] || DEFAULT_PENALTY;
    const highRisk = ['Fire NOC', 'Drug License', 'FSSAI', 'Clinical Establishment License'].includes(licenseType);
    return {
      licenseType,
      risk: highRisk ? 'HIGH' as const : 'MEDIUM' as const,
      potentialImpact: highRisk ? 'Business Closure Risk' : 'Operational Restriction',
      penaltyEstimate: { min: meta.minPenalty, max: Math.round(meta.maxPenalty * 0.5), formatted: `₹${meta.minPenalty.toLocaleString('en-IN')} - ₹${Math.round(meta.maxPenalty * 0.5).toLocaleString('en-IN')}` },
      recommendedAction: `Apply for ${licenseType} on the official portal immediately.`,
      legalConsequences: meta.legalConsequences,
    };
  });
}

/** Offline fallback — mirrors server analyzeComplianceRisk */
export function analyzeComplianceRiskOffline(
  licenses: License[],
  onboarding: Partial<OnboardingAnswers> = {},
  state = 'Telangana'
): ComplianceRiskReport {
  const sector = onboarding.business_sector || '';
  const uploadedTypes = licenses.map((l) => l.type);
  const requiredLicenses = SECTOR_REQUIRED_LICENSES[sector] || [];
  const missingLicenses = detectMissingClient(sector, uploadedTypes);
  const licenseAssessments = licenses.map((l) => analyzeLicenseClient(l, onboarding));

  let score = 100;
  score -= missingLicenses.length * 15;
  for (const a of licenseAssessments) {
    if (a.riskLevel === 'MEDIUM') score -= 8;
    else if (a.riskLevel === 'HIGH') score -= 15;
    else if (a.riskLevel === 'VERY_HIGH') score -= 22;
    else if (a.riskLevel === 'CRITICAL') score -= 30;
  }
  score = Math.max(0, Math.min(100, score));

  const allLevels = [...licenseAssessments.map((a) => a.riskLevel), ...missingLicenses.map((m) => m.risk === 'HIGH' ? 'HIGH' as RiskLevel : 'MEDIUM' as RiskLevel)];
  const order: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
  const overallRisk = allLevels.reduce((w, l) => (order.indexOf(l) > order.indexOf(w) ? l : w), 'LOW' as RiskLevel);

  const atRisk = licenseAssessments.filter((a) => a.riskLevel !== 'LOW');
  const penaltyMin = [...atRisk.map((a) => a.estimatedPenalty.min), ...missingLicenses.map((m) => m.penaltyEstimate.min)].reduce((a, b) => a + b, 0);
  const penaltyMax = [...atRisk.map((a) => a.estimatedPenalty.max), ...missingLicenses.map((m) => m.penaltyEstimate.max)].reduce((a, b) => a + b, 0);

  const issues = [
    ...atRisk.map((a, i) => ({
      id: i + 1,
      type: 'LICENSE_RISK' as const,
      licenseType: a.licenseType,
      description: a.status === 'EXPIRED' ? `${a.licenseType} expired ${a.daysSinceExpiry} days ago` : `${a.licenseType} expiring in ${a.daysUntilExpiry} days`,
      riskLevel: a.riskLevel,
      urgency: a.urgency,
      potentialPenalty: a.estimatedPenalty.formatted,
      potentialConsequence: a.legalConsequences[0] || 'Regulatory action',
    })),
    ...missingLicenses.map((m, i) => ({
      id: atRisk.length + i + 1,
      type: 'MISSING_LICENSE' as const,
      licenseType: m.licenseType,
      description: `${m.licenseType} missing`,
      riskLevel: (m.risk === 'HIGH' ? 'HIGH' : 'MEDIUM') as RiskLevel,
      urgency: m.risk,
      potentialPenalty: m.penaltyEstimate.formatted,
      potentialConsequence: m.potentialImpact,
    })),
  ];

  const recommendedActions = [
    ...atRisk.filter((a) => a.status === 'EXPIRED').map((a) => `Renew ${a.licenseType} immediately`),
    ...atRisk.filter((a) => a.status !== 'EXPIRED').map((a) => `Renew ${a.licenseType} before expiry`),
    ...missingLicenses.map((m) => `Apply for ${m.licenseType}`),
  ];

  return {
    complianceScore: score,
    overallRisk,
    overallRiskLabel: riskLevelToUrgency(overallRisk),
    penaltyExposure: { min: penaltyMin, max: penaltyMax, formatted: penaltyMin > 0 ? `₹${penaltyMin.toLocaleString('en-IN')} - ₹${penaltyMax.toLocaleString('en-IN')}` : '₹0' },
    licensesAtRisk: atRisk.length + missingLicenses.length,
    businessSector: sector,
    state,
    requiredLicenses,
    licenseAssessments,
    missingLicenses,
    expiryRiskSummary: {
      active: licenseAssessments.filter((a) => a.riskLevel === 'LOW').length,
      medium: licenseAssessments.filter((a) => a.riskLevel === 'MEDIUM').length,
      high: licenseAssessments.filter((a) => ['HIGH', 'VERY_HIGH'].includes(a.riskLevel)).length,
      critical: licenseAssessments.filter((a) => a.riskLevel === 'CRITICAL').length,
    },
    auditReport: { complianceScore: score, overallRisk: riskLevelToUrgency(overallRisk), issuesFound: issues, recommendedActions },
    generatedAt: new Date().toISOString(),
  };
}

export function analyzeSingleLicenseOffline(license: License, onboarding: Partial<OnboardingAnswers> = {}): SingleLicenseRiskAssessment {
  const a = analyzeLicenseClient(license, onboarding);
  return { ...a, potentialImpact: undefined };
}
