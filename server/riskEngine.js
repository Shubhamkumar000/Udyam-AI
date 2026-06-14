/**
 * AI Compliance Risk Engine
 * Analyzes licenses, estimates penalty exposure, detects missing licenses,
 * and generates actionable compliance audit reports for Indian businesses.
 */

const MS_PER_DAY = 86400000;

// Mock system date aligned with compliance engine
const TODAY = new Date('2026-06-13T00:00:00');

// ==========================================
// SECTOR → REQUIRED LICENSES
// ==========================================

const SECTOR_REQUIRED_LICENSES = {
  'Restaurant / Food Service': ['FSSAI', 'GST', 'Trade License', 'Fire NOC', 'Shop & Establishment'],
  'Pharmacy / Medical Store': ['Drug License', 'GST', 'Trade License'],
  'Hotel / Resort': ['FSSAI', 'Trade License', 'GST', 'Fire NOC'],
  'Hospital / Clinic': ['Clinical Establishment License', 'Fire NOC', 'Biomedical Waste Authorization'],
  'Manufacturing Unit': ['Factory License', 'Pollution Consent', 'Fire NOC', 'GST'],
  'Educational Institution': ['Education Board Affiliation', 'Fire NOC', 'Building Safety Certificate'],
};

// ==========================================
// PENALTY METADATA DATABASE
// ==========================================

const PENALTY_DATABASE = {
  FSSAI: {
    minPenalty: 5000,
    maxPenalty: 100000,
    reasons: ['Operating without valid license', 'Late renewal', 'Non-compliance with food safety standards'],
    legalConsequences: ['Business closure order', 'Seizure of food items', 'Imprisonment up to 6 months'],
    recommendedAction: 'Renew FSSAI license immediately on foodlicenseportal.org and pay late fees.',
  },
  'Trade License': {
    minPenalty: 2000,
    maxPenalty: 50000,
    reasons: ['Operating without municipal trade license', 'Late renewal surcharge', 'Unauthorized commercial activity'],
    legalConsequences: ['Premises sealing', 'Daily compounding fines', 'Revocation of operating permission'],
    recommendedAction: 'Apply or renew Trade License through your local municipal corporation (BBMP/ULB).',
  },
  GST: {
    minPenalty: 10000,
    maxPenalty: 100000,
    reasons: ['Late GST return filing', 'Operating without GST registration', 'Tax evasion penalties'],
    legalConsequences: ['GSTIN suspension', 'E-Way bill blocking', 'Input tax credit denial'],
    recommendedAction: 'File pending returns and renew GST registration on services.gst.gov.in.',
  },
  'Fire NOC': {
    minPenalty: 10000,
    maxPenalty: 200000,
    reasons: ['Operating without Fire Safety Certificate', 'Non-compliance with NBC norms', 'Expired NOC'],
    legalConsequences: ['Immediate closure notice', 'Insurance claim invalidation', 'Criminal liability in fire incidents'],
    recommendedAction: 'Schedule fire safety inspection and apply for NOC renewal with state fire services.',
  },
  'Drug License': {
    minPenalty: 50000,
    maxPenalty: 500000,
    reasons: ['Selling medicines without license', 'Expired drug license', 'Schedule drug violations'],
    legalConsequences: ['Permanent license cancellation', 'Criminal prosecution under Drugs & Cosmetics Act', 'Stock seizure'],
    recommendedAction: 'Apply for Drug License renewal through state drug control department immediately.',
  },
  'Shop & Establishment': {
    minPenalty: 2000,
    maxPenalty: 25000,
    reasons: ['Non-registration under state labour act', 'Late renewal', 'Violation of working hours norms'],
    legalConsequences: ['Labour department prosecution', 'Fine per employee per day', 'Business registration cancellation'],
    recommendedAction: 'Register or renew on state labour portal (e.g. e-Karmika Karnataka).',
  },
  'Factory License': {
    minPenalty: 25000,
    maxPenalty: 300000,
    reasons: ['Operating factory without license', 'Safety non-compliance', 'Expired factory license'],
    legalConsequences: ['Factory shutdown order', 'Prosecution under Factories Act', 'Equipment seizure'],
    recommendedAction: 'Apply for Factory License through state labour department with safety audit report.',
  },
  'Pollution Consent': {
    minPenalty: 10000,
    maxPenalty: 150000,
    reasons: ['Operating without CPCB/SPCB consent', 'Environmental norm violations', 'Expired consent to operate'],
    legalConsequences: ['Closure direction from SPCB', 'Environmental compensation orders', 'Criminal proceedings'],
    recommendedAction: 'Apply for Consent to Operate on state pollution control board portal.',
  },
  'Clinical Establishment License': {
    minPenalty: 25000,
    maxPenalty: 200000,
    reasons: ['Unregistered clinical establishment', 'Non-compliance with CEA norms', 'Expired registration'],
    legalConsequences: ['Facility closure', 'Debarment from government schemes', 'Prosecution under CEA 2010'],
    recommendedAction: 'Register on clinicalestablishments.gov.in and complete state-level verification.',
  },
  'Biomedical Waste Authorization': {
    minPenalty: 15000,
    maxPenalty: 100000,
    reasons: ['Improper biomedical waste disposal', 'Missing BMW authorization', 'Expired authorization'],
    legalConsequences: ['Facility closure', 'Prosecution under BMW Rules 2016', 'SPCB penalties'],
    recommendedAction: 'Obtain BMW authorization from SPCB and tie up with authorized waste handler.',
  },
  'Education Board Affiliation': {
    minPenalty: 10000,
    maxPenalty: 100000,
    reasons: ['Operating unaffiliated institution', 'Expired affiliation', 'Non-compliance with RTE norms'],
    legalConsequences: ['Denial of student certifications', 'Institution derecognition', 'Fee refund orders'],
    recommendedAction: 'Apply for board affiliation renewal and complete fire/building safety compliance.',
  },
  'Building Safety Certificate': {
    minPenalty: 5000,
    maxPenalty: 75000,
    reasons: ['Structural safety non-compliance', 'Missing occupancy certificate', 'Expired safety certificate'],
    legalConsequences: ['Evacuation orders', 'Denial of affiliation', 'Municipal demolition notice in extreme cases'],
    recommendedAction: 'Obtain structural audit and building safety certificate from licensed engineer.',
  },
  'Eating House License': {
    minPenalty: 5000,
    maxPenalty: 50000,
    reasons: ['Operating eating house without police license', 'Expired eating house license'],
    legalConsequences: ['Police closure order', 'Fine and license cancellation'],
    recommendedAction: 'Apply for Eating House License through local police commissioner office.',
  },
};

const DEFAULT_PENALTY = {
  minPenalty: 5000,
  maxPenalty: 50000,
  reasons: ['Regulatory non-compliance', 'Missing or expired license'],
  legalConsequences: ['Operational restrictions', 'Financial penalties', 'Possible business closure'],
  recommendedAction: 'Contact the issuing authority and begin renewal or fresh application immediately.',
};

// ==========================================
// BUSINESS SIZE MULTIPLIERS
// ==========================================

function getBusinessSizeMultiplier(employeeCountRange, annualRevenueRange) {
  let multiplier = 1.0;

  if (employeeCountRange) {
    if (employeeCountRange.includes('250')) multiplier = 2.5;
    else if (employeeCountRange.includes('101')) multiplier = 2.0;
    else if (employeeCountRange.includes('51')) multiplier = 1.6;
    else if (employeeCountRange.includes('21')) multiplier = 1.3;
    else if (employeeCountRange.includes('6')) multiplier = 1.1;
    else multiplier = 1.0;
  }

  if (annualRevenueRange) {
    if (annualRevenueRange.includes('10 Crores') || annualRevenueRange.includes('Above')) multiplier *= 1.4;
    else if (annualRevenueRange.includes('5 Crores')) multiplier *= 1.2;
  }

  return multiplier;
}

// ==========================================
// DATE & RISK CALCULATIONS
// ==========================================

function daysUntilExpiry(expiryDate, today = TODAY) {
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / MS_PER_DAY);
}

function daysSinceExpiry(expiryDate, today = TODAY) {
  return Math.max(0, -daysUntilExpiry(expiryDate, today));
}

function normalizeStatus(status) {
  if (!status) return 'ACTIVE';
  const s = status.toUpperCase().replace(/\s+/g, '_');
  if (s === 'EXPIRING_SOON') return 'EXPIRING_SOON';
  if (s === 'EXPIRED') return 'EXPIRED';
  return 'ACTIVE';
}

/**
 * Calculate granular risk level per spec.
 * Returns: LOW | MEDIUM | HIGH | VERY_HIGH | CRITICAL
 */
function calculateRiskLevel(status, expiryDate, today = TODAY) {
  const normalized = normalizeStatus(status);
  const daysLeft = daysUntilExpiry(expiryDate, today);
  const daysOver = daysSinceExpiry(expiryDate, today);

  if (normalized === 'ACTIVE' || daysLeft > 60) {
    return 'LOW';
  }

  if (normalized === 'EXPIRING_SOON' || (daysLeft >= 0 && daysLeft <= 60)) {
    if (daysLeft > 30) return 'MEDIUM';
    if (daysLeft > 7) return 'HIGH';
    return 'CRITICAL';
  }

  if (normalized === 'EXPIRED' || daysOver > 0) {
    if (daysOver <= 30) return 'HIGH';
    if (daysOver <= 90) return 'VERY_HIGH';
    return 'CRITICAL';
  }

  return 'LOW';
}

function riskLevelToUrgency(riskLevel) {
  const map = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    VERY_HIGH: 'VERY HIGH',
    CRITICAL: 'CRITICAL',
  };
  return map[riskLevel] || 'MEDIUM';
}

function riskLevelToScore(riskLevel) {
  const map = { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3, CRITICAL: 4 };
  return map[riskLevel] ?? 1;
}

function scoreToOverallRisk(score) {
  if (score >= 90) return 'LOW';
  if (score >= 75) return 'MEDIUM';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'VERY_HIGH';
  return 'CRITICAL';
}

function worstRiskLevel(levels) {
  const order = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
  let worst = 'LOW';
  for (const level of levels) {
    if (order.indexOf(level) > order.indexOf(worst)) worst = level;
  }
  return worst;
}

function formatCurrency(amount) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatRange(min, max) {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

// ==========================================
// PENALTY ESTIMATION ENGINE
// ==========================================

function estimatePenalty(licenseType, daysOver, employeeCountRange, annualRevenueRange) {
  const meta = PENALTY_DATABASE[licenseType] || DEFAULT_PENALTY;
  const multiplier = getBusinessSizeMultiplier(employeeCountRange, annualRevenueRange);

  let severityFactor = 0.15;
  if (daysOver > 0) {
    if (daysOver <= 7) severityFactor = 0.2;
    else if (daysOver <= 30) severityFactor = 0.35;
    else if (daysOver <= 90) severityFactor = 0.6;
    else severityFactor = 0.85;
  }

  const range = meta.maxPenalty - meta.minPenalty;
  const estimatedMin = Math.round((meta.minPenalty + range * severityFactor * 0.3) * multiplier);
  const estimatedMax = Math.round((meta.minPenalty + range * severityFactor * 0.7) * multiplier);

  const min = Math.min(estimatedMin, estimatedMax);
  const max = Math.max(estimatedMin, estimatedMax);

  let confidence = 72;
  if (daysOver > 0 && daysOver <= 30) confidence = 78;
  else if (daysOver > 30 && daysOver <= 90) confidence = 85;
  else if (daysOver > 90) confidence = 90;
  else if (daysOver === 0) confidence = 65;

  confidence = Math.min(95, Math.round(confidence * (multiplier > 1.5 ? 1.05 : 1)));

  return {
    min,
    max,
    formatted: formatRange(min, max),
    confidence,
    reasons: meta.reasons,
    legalConsequences: meta.legalConsequences,
    recommendedAction: meta.recommendedAction,
  };
}

function estimateMissingLicenseImpact(licenseType) {
  const meta = PENALTY_DATABASE[licenseType] || DEFAULT_PENALTY;
  const min = meta.minPenalty;
  const max = Math.round(meta.maxPenalty * 0.5);

  const highRiskTypes = ['Fire NOC', 'Drug License', 'FSSAI', 'Clinical Establishment License'];
  const risk = highRiskTypes.includes(licenseType) ? 'HIGH' : 'MEDIUM';

  let potentialImpact = 'Operational Restriction';
  if (['Fire NOC', 'Drug License'].includes(licenseType)) {
    potentialImpact = 'Business Closure Risk';
  } else if (licenseType === 'GST') {
    potentialImpact = 'Tax & Banking Disruption';
  } else if (licenseType === 'FSSAI') {
    potentialImpact = 'Food Business Closure Risk';
  }

  return {
    licenseType,
    risk,
    potentialImpact,
    penaltyEstimate: { min, max, formatted: formatRange(min, max) },
    recommendedAction: `Apply for ${licenseType} on the official portal immediately.`,
    legalConsequences: meta.legalConsequences,
  };
}

// ==========================================
// COMPLIANCE SCORE
// ==========================================

function calculateComplianceScore(licenses, missingLicenses, requiredLicenses) {
  let score = 100;
  score -= missingLicenses.length * 15;

  for (const lic of licenses) {
    const risk = calculateRiskLevel(lic.status, lic.expiryDate);
    if (risk === 'MEDIUM') score -= 8;
    else if (risk === 'HIGH') score -= 15;
    else if (risk === 'VERY_HIGH') score -= 22;
    else if (risk === 'CRITICAL') score -= 30;
  }

  if (requiredLicenses.length > 0) {
    const coverage = (requiredLicenses.length - missingLicenses.length) / requiredLicenses.length;
    score = Math.round(score * (0.7 + coverage * 0.3));
  }

  return Math.max(0, Math.min(100, score));
}

// ==========================================
// MAIN ANALYSIS ENGINE
// ==========================================

function analyzeLicense(license, onboarding = {}) {
  const expiryDate = license.expiryDate || license.expiry_date;
  const issueDate = license.issueDate || license.issue_date;
  const licenseType = license.type || license.license_type;
  const status = license.status || 'Active';

  const daysLeft = daysUntilExpiry(expiryDate);
  const daysOver = daysSinceExpiry(expiryDate);
  const riskLevel = calculateRiskLevel(status, expiryDate);
  const penalty = estimatePenalty(
    licenseType,
    daysOver,
    onboarding.employeeCountRange,
    onboarding.annualRevenueRange
  );

  const meta = PENALTY_DATABASE[licenseType] || DEFAULT_PENALTY;

  return {
    licenseId: license._id?.toString() || license.id || '',
    licenseType,
    licenseNumber: license.licenseNumber || license.license_number || '',
    issueDate: issueDate instanceof Date ? issueDate.toISOString().split('T')[0] : issueDate,
    expiryDate: expiryDate instanceof Date ? expiryDate.toISOString().split('T')[0] : expiryDate,
    issuingAuthority: license.authority || license.issuing_authority || '',
    status: normalizeStatus(status),
    daysUntilExpiry: daysLeft,
    daysSinceExpiry: daysOver,
    riskLevel,
    urgency: riskLevelToUrgency(riskLevel),
    estimatedPenalty: {
      min: penalty.min,
      max: penalty.max,
      formatted: penalty.formatted,
      confidence: penalty.confidence,
    },
    recommendedAction: penalty.recommendedAction,
    legalConsequences: penalty.legalConsequences,
    penaltyReasons: penalty.reasons,
  };
}

function detectMissingLicenses(sector, uploadedTypes) {
  const required = SECTOR_REQUIRED_LICENSES[sector] || [];
  return required
    .filter((type) => !uploadedTypes.includes(type))
    .map((type) => estimateMissingLicenseImpact(type));
}

function buildAuditIssues(licenseAssessments, missingLicenses) {
  const issues = [];
  let issueNum = 1;

  for (const lic of licenseAssessments) {
    if (lic.riskLevel === 'LOW') continue;

    let description = '';
    if (lic.status === 'EXPIRED') {
      description = `${lic.licenseType} expired ${lic.daysSinceExpiry} days ago`;
    } else if (lic.status === 'EXPIRING_SOON' || lic.daysUntilExpiry <= 60) {
      description = `${lic.licenseType} expiring in ${lic.daysUntilExpiry} days`;
    } else {
      description = `${lic.licenseType} requires attention`;
    }

    issues.push({
      id: issueNum++,
      type: 'LICENSE_RISK',
      licenseType: lic.licenseType,
      description,
      riskLevel: lic.riskLevel,
      urgency: lic.urgency,
      potentialPenalty: lic.estimatedPenalty.formatted,
      potentialConsequence: lic.legalConsequences[0] || 'Regulatory action',
    });
  }

  for (const missing of missingLicenses) {
    issues.push({
      id: issueNum++,
      type: 'MISSING_LICENSE',
      licenseType: missing.licenseType,
      description: `${missing.licenseType} missing`,
      riskLevel: missing.risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
      urgency: missing.risk,
      potentialPenalty: missing.penaltyEstimate.formatted,
      potentialConsequence: missing.potentialImpact,
    });
  }

  return issues.sort((a, b) => riskLevelToScore(b.riskLevel) - riskLevelToScore(a.riskLevel));
}

function buildRecommendedActions(licenseAssessments, missingLicenses) {
  const actions = new Set();

  for (const lic of licenseAssessments) {
    if (lic.riskLevel !== 'LOW') {
      if (lic.status === 'EXPIRED') {
        actions.add(`Renew ${lic.licenseType} immediately — expired ${lic.daysSinceExpiry} days ago`);
      } else if (lic.daysUntilExpiry <= 60) {
        actions.add(`Renew ${lic.licenseType} before expiry (${lic.daysUntilExpiry} days left)`);
      }
    }
  }

  for (const missing of missingLicenses) {
    actions.add(`Apply for ${missing.licenseType} — ${missing.potentialImpact}`);
  }

  return Array.from(actions);
}

/**
 * Full compliance risk analysis for a business.
 */
function analyzeComplianceRisk({ licenses = [], onboarding = {}, businessProfile = {} }) {
  const sector = onboarding.businessSector || onboarding.business_sector || '';
  const state = businessProfile.state || 'Karnataka';

  const uploadedTypes = licenses.map((l) => l.type);
  const requiredLicenses = SECTOR_REQUIRED_LICENSES[sector] || [];
  const missingLicenses = detectMissingLicenses(sector, uploadedTypes);
  const licenseAssessments = licenses.map((l) => analyzeLicense(l, onboarding));

  const allRiskLevels = [
    ...licenseAssessments.map((l) => l.riskLevel),
    ...missingLicenses.map((m) => (m.risk === 'HIGH' ? 'HIGH' : 'MEDIUM')),
  ];

  const complianceScore = calculateComplianceScore(licenses, missingLicenses, requiredLicenses);
  const overallRisk = worstRiskLevel(allRiskLevels.length ? allRiskLevels : ['LOW']);

  const penaltyMins = [
    ...licenseAssessments.filter((l) => l.riskLevel !== 'LOW').map((l) => l.estimatedPenalty.min),
    ...missingLicenses.map((m) => m.penaltyEstimate.min),
  ];
  const penaltyMaxs = [
    ...licenseAssessments.filter((l) => l.riskLevel !== 'LOW').map((l) => l.estimatedPenalty.max),
    ...missingLicenses.map((m) => m.penaltyEstimate.max),
  ];

  const totalPenaltyMin = penaltyMins.reduce((a, b) => a + b, 0);
  const totalPenaltyMax = penaltyMaxs.reduce((a, b) => a + b, 0);

  const licensesAtRisk = licenseAssessments.filter((l) => l.riskLevel !== 'LOW').length + missingLicenses.length;
  const issues = buildAuditIssues(licenseAssessments, missingLicenses);
  const recommendedActions = buildRecommendedActions(licenseAssessments, missingLicenses);

  return {
    complianceScore,
    overallRisk,
    overallRiskLabel: riskLevelToUrgency(overallRisk),
    penaltyExposure: {
      min: totalPenaltyMin,
      max: totalPenaltyMax,
      formatted: totalPenaltyMin > 0 ? formatRange(totalPenaltyMin, totalPenaltyMax) : '₹0',
    },
    licensesAtRisk,
    businessSector: sector,
    state,
    requiredLicenses,
    licenseAssessments,
    missingLicenses,
    expiryRiskSummary: {
      active: licenseAssessments.filter((l) => l.riskLevel === 'LOW').length,
      medium: licenseAssessments.filter((l) => l.riskLevel === 'MEDIUM').length,
      high: licenseAssessments.filter((l) => ['HIGH', 'VERY_HIGH'].includes(l.riskLevel)).length,
      critical: licenseAssessments.filter((l) => l.riskLevel === 'CRITICAL').length,
    },
    auditReport: {
      complianceScore,
      overallRisk: riskLevelToUrgency(overallRisk),
      issuesFound: issues,
      recommendedActions,
    },
    generatedAt: new Date().toISOString(),
  };
}

function analyzeSingleLicense(license, onboarding = {}) {
  return analyzeLicense(license, onboarding);
}

module.exports = {
  TODAY,
  SECTOR_REQUIRED_LICENSES,
  PENALTY_DATABASE,
  daysUntilExpiry,
  daysSinceExpiry,
  calculateRiskLevel,
  estimatePenalty,
  estimateMissingLicenseImpact,
  detectMissingLicenses,
  calculateComplianceScore,
  analyzeLicense,
  analyzeComplianceRisk,
  analyzeSingleLicense,
  formatCurrency,
  formatRange,
  riskLevelToUrgency,
};
