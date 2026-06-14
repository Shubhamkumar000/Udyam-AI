// Client API & Storage Utility for UdyamAI
// Connects React frontend directly to the MongoDB Express API server
// Gracefully falls back to LocalStorage for zero-dependency testing

export interface BusinessProfile {
  business_name: string;
  owner_name: string;
  email: string;
  mobile: string;
  gstin: string;
  fssai_number: string;
  trade_license_number: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  pan: string;
  aadhaar: string;
}

export interface License {
  id: string; // Maps to _id from MongoDB
  type: 'GST' | 'FSSAI' | 'Trade License' | 'Shop & Establishment' | 'Fire NOC' | 'Eating House' | 'Pollution Control' | 'Drug License' | 'Factory License' | 'Pollution Consent' | 'Clinical Establishment License' | 'Biomedical Waste Authorization' | 'Building Safety Certificate' | 'Education Board Affiliation';
  license_number: string;
  business_name: string;
  owner_name: string;
  issue_date: string;
  expiry_date: string;
  authority: string;
  confidence_score: number;
  portal_url: string;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

export interface OnboardingAnswers {
  business_sector: string;
  employee_count_range: string;
  annual_revenue_range: string;
  location_count: string;
  premises_type: string;
  daily_footfall: string;
  business_operations: string[];
  hazardous_materials: string;
  existing_licenses: string[];
  compliance_priority: string;
}

export interface ComplianceProfile {
  compliance_score: number;
  risk_level: string;
  required_licenses: string[];
  existing_licenses: string[];
  missing_licenses: string[];
  expiring_licenses: string[];
  expired_licenses: string[];
  upcoming_renewals: Array<{
    licenseId: string;
    type: string;
    expiryDate: string;
    status: string;
    daysRemaining: number;
  }>;
  compliance_insights: string[];
  recommended_actions: string[];
}

const API_BASE = "http://localhost:5000/api";

// JWT Helper Functions
export const getToken = (): string | null => localStorage.getItem('udyan_auth_token');
export const setToken = (token: string) => localStorage.setItem('udyan_auth_token', token);
export const removeToken = () => {
  localStorage.removeItem('udyan_auth_token');
  localStorage.removeItem('udyan_profile');
  localStorage.removeItem('udyan_licenses');
};

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

export const apiSignup = async (email: string, password: string, fullName: string) => {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName })
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Signup failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
};

export const apiLogin = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Login failed');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
};

export const getMe = async () => {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
};

// ==========================================
// IDENTITY VERIFICATION API
// ==========================================

export const uploadIdentityDocs = async (
  aadhaarFile: File | null, 
  panFile: File | null, 
  phone: string,
  fullName?: string,
  address?: string,
  panNumber?: string
) => {
  const formData = new FormData();
  if (aadhaarFile) formData.append('aadhaar', aadhaarFile);
  if (panFile) formData.append('pan', panFile);
  formData.append('phone', phone);
  if (fullName) formData.append('fullName', fullName);
  if (address) formData.append('address', address);
  if (panNumber) formData.append('panNumber', panNumber);

  const token = getToken();
  const res = await fetch(`${API_BASE}/identity/upload`, {
    method: 'POST',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    body: formData
  });

  if (!res.ok) {
    const errData = await res.json();
    throw new Error(errData.error || 'Identity upload failed');
  }
  return res.json();
};

// ==========================================
// ONBOARDING WIZARD APIs
// ==========================================

export const saveOnboarding = async (answers: OnboardingAnswers) => {
  const res = await fetch(`${API_BASE}/onboarding`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      businessSector: answers.business_sector,
      employeeCountRange: answers.employee_count_range,
      annualRevenueRange: answers.annual_revenue_range,
      locationCount: answers.location_count,
      premisesType: answers.premises_type,
      dailyFootfall: answers.daily_footfall,
      businessOperations: answers.business_operations,
      hazardousMaterials: answers.hazardous_materials,
      existingLicenses: answers.existing_licenses,
      compliancePriority: answers.compliance_priority
    })
  });
  if (!res.ok) throw new Error('Failed to save onboarding answers');
  return res.json();
};

export const getOnboarding = async (): Promise<Partial<OnboardingAnswers>> => {
  try {
    const res = await fetch(`${API_BASE}/onboarding`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        return {
          business_sector: data.businessSector || '',
          employee_count_range: data.employeeCountRange || '',
          annual_revenue_range: data.annualRevenueRange || '',
          location_count: data.locationCount || '',
          premises_type: data.premisesType || '',
          daily_footfall: data.dailyFootfall || '',
          business_operations: data.businessOperations || [],
          hazardous_materials: data.hazardousMaterials || '',
          existing_licenses: data.existingLicenses || [],
          compliance_priority: data.compliancePriority || ''
        };
      }
    }
  } catch (err) {
    // Failover
  }
  const cached = localStorage.getItem('udyan_onboarding');
  return cached ? JSON.parse(cached) : {};
};

// ==========================================
// BUSINESS PROFILE APIs
// ==========================================

export const getProfile = async (): Promise<BusinessProfile> => {
  try {
    const res = await fetch(`${API_BASE}/business-profile`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      // Map schema variables from DB
      return {
        business_name: data.businessName || '',
        owner_name: data.ownerName || '',
        email: data.email || '',
        mobile: data.mobile || '',
        gstin: data.gstin || '',
        fssai_number: data.fssai_number || '',
        trade_license_number: data.trade_license_number || '',
        address: data.address || '',
        city: data.city || '',
        district: data.district || '',
        state: data.state || '',
        pincode: data.pincode || '',
        pan: data.pan || '',
        aadhaar: data.aadhaar || ''
      };
    }
  } catch (err) {
    // Failover
  }
  const cached = localStorage.getItem('udyan_profile');
  return cached ? JSON.parse(cached) : {
    business_name: '', owner_name: '', email: '', mobile: '', gstin: '', fssai_number: '',
    trade_license_number: '', address: '', city: '', district: '', state: '', pincode: '', pan: '', aadhaar: ''
  };
};

export const saveProfile = async (profile: BusinessProfile): Promise<BusinessProfile> => {
  try {
    const res = await fetch(`${API_BASE}/business-profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        businessName: profile.business_name,
        ownerName: profile.owner_name,
        email: profile.email,
        mobile: profile.mobile,
        gstin: profile.gstin,
        fssai_number: profile.fssai_number,
        trade_license_number: profile.trade_license_number,
        address: profile.address,
        city: profile.city,
        district: profile.district,
        state: profile.state,
        pincode: profile.pincode,
        pan: profile.pan,
        aadhaar: profile.aadhaar
      })
    });
    if (res.ok) {
      await res.json();
      return profile;
    }
  } catch (err) {
    // Failover
  }
  localStorage.setItem('udyan_profile', JSON.stringify(profile));
  return profile;
};

// ==========================================
// LICENSES APIs
// ==========================================

export const getLicenses = async (): Promise<License[]> => {
  try {
    const res = await fetch(`${API_BASE}/licenses`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.map((l: any) => ({
        id: l._id,
        type: l.type,
        license_number: l.licenseNumber,
        business_name: l.businessName,
        owner_name: l.ownerName,
        issue_date: l.issueDate?.split('T')[0] || '',
        expiry_date: l.expiryDate?.split('T')[0] || '',
        authority: l.authority,
        confidence_score: l.confidenceScore,
        portal_url: l.portalUrl,
        status: l.status
      }));
    }
  } catch (err) {
    // Failover
  }
  const cached = localStorage.getItem('udyan_licenses');
  return cached ? JSON.parse(cached) : [];
};

export const saveLicense = async (license: Omit<License, 'id' | 'status'>, file?: File): Promise<License> => {
  try {
    const formData = new FormData();
    if (file) formData.append('licenseFile', file);
    formData.append('type', license.type);
    formData.append('licenseNumber', license.license_number);
    formData.append('businessName', license.business_name);
    formData.append('ownerName', license.owner_name);
    formData.append('issueDate', license.issue_date);
    formData.append('expiryDate', license.expiry_date);
    formData.append('authority', license.authority);
    formData.append('confidenceScore', String(license.confidence_score));
    formData.append('portalUrl', license.portal_url);

    const token = getToken();
    const res = await fetch(`${API_BASE}/upload-license`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data._id,
        type: data.type,
        license_number: data.licenseNumber,
        business_name: data.businessName,
        owner_name: data.ownerName,
        issue_date: data.issueDate?.split('T')[0] || '',
        expiry_date: data.expiryDate?.split('T')[0] || '',
        authority: data.authority,
        confidence_score: data.confidenceScore,
        portal_url: data.portalUrl,
        status: data.status
      };
    }
  } catch (err) {
    // Failover
  }

  // Local Storage Failover Mode
  const status = getLicenseStatus(license.expiry_date);
  const newLicense: License = {
    ...license,
    id: `lic-${Date.now()}`,
    status
  };
  const licenses = await getLicenses();
  licenses.push(newLicense);
  localStorage.setItem('udyan_licenses', JSON.stringify(licenses));
  return newLicense;
};

export const deleteLicense = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_BASE}/licenses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
  } catch (err) {
    // Failover
  }
  const licenses = await getLicenses();
  const filtered = licenses.filter(l => l.id !== id);
  localStorage.setItem('udyan_licenses', JSON.stringify(filtered));
};

// ==========================================
// COMPLIANCE ANALYSIS PROFILE API
// ==========================================

export const getComplianceProfile = async (): Promise<ComplianceProfile> => {
  try {
    const res = await fetch(`${API_BASE}/compliance-profile`, {
      headers: getHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return {
        compliance_score: data.complianceScore ?? 100,
        risk_level: data.riskLevel || 'Low Risk',
        required_licenses: data.requiredLicenses || [],
        existing_licenses: data.existingLicenses || [],
        missing_licenses: data.missingLicenses || [],
        expiring_licenses: data.expiringLicenses || [],
        expired_licenses: data.expiredLicenses || [],
        upcoming_renewals: (data.upcomingRenewals || []).map((item: any) => ({
          licenseId: item.licenseId,
          type: item.type,
          expiryDate: item.expiryDate,
          status: item.status,
          daysRemaining: item.daysRemaining
        })),
        compliance_insights: data.complianceInsights || [],
        recommended_actions: data.recommendedActions || []
      };
    }
  } catch (err) {
    // Failover
  }

  // Local Storage Failover calculations
  const licenses = await getLicenses();
  const score = calculateHealthScore(licenses);
  
  let riskLevel = 'Low Risk';
  if (score >= 90) riskLevel = 'Low Risk';
  else if (score >= 70) riskLevel = 'Medium Risk';
  else if (score >= 50) riskLevel = 'High Risk';
  else riskLevel = 'Critical Risk';

  return {
    compliance_score: score,
    risk_level: riskLevel,
    required_licenses: ['FSSAI', 'GST', 'Trade License', 'Fire NOC', 'Shop & Establishment'],
    existing_licenses: licenses.map(l => l.type),
    missing_licenses: [],
    expiring_licenses: licenses.filter(l => l.status === 'Expiring Soon').map(l => l.type),
    expired_licenses: licenses.filter(l => l.status === 'Expired').map(l => l.type),
    upcoming_renewals: licenses
      .filter(l => l.status === 'Expired' || l.status === 'Expiring Soon')
      .map(l => ({
        licenseId: l.id,
        type: l.type,
        expiryDate: l.expiry_date,
        status: l.status,
        daysRemaining: 15 // Mock
      })),
    compliance_insights: ["Local storage offline backup analysis is running."],
    recommended_actions: ["Connect to MongoDB server for full analysis."]
  };
};

export const getDashboardData = async () => {
  try {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: getHeaders()
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Failover
  }
  const licenses = await getLicenses();
  const score = calculateHealthScore(licenses);
  return {
    total_licenses: licenses.length,
    active_licenses: licenses.filter(l => l.status === 'Active').length,
    expiring_soon: licenses.filter(l => l.status === 'Expiring Soon').length,
    expired_licenses: licenses.filter(l => l.status === 'Expired').length,
    score,
    riskLevel: score >= 90 ? 'Low Risk' : score >= 70 ? 'Medium Risk' : score >= 50 ? 'High Risk' : 'Critical Risk'
  };
};

// ==========================================
// CHAT BOT SERVICE
// ==========================================

export const sendChatMessage = async (question: string, language: string) => {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ question, language })
  });
  if (!res.ok) throw new Error('Chat API returned an error');
  return res.json();
};

// ==========================================
// UTILITIES AND HELPERS
// ==========================================

export const calculateHealthScore = (licenses: License[]): number => {
  let score = 100;
  licenses.forEach(lic => {
    if (lic.status === 'Expiring Soon') score -= 10;
    if (lic.status === 'Expired') score -= 25;
  });
  return Math.max(0, score);
};

const getLicenseStatus = (expiryDateStr: string): 'Active' | 'Expiring Soon' | 'Expired' => {
  const expiry = new Date(expiryDateStr);
  const today = new Date("2026-06-13"); // Mock today
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 60) return 'Expiring Soon';
  return 'Active';
};

// Generates dynamic compliance checklists
export const getChecklist = (licenseType: string) => {
  switch (licenseType) {
    case 'FSSAI':
      return {
        type: 'FSSAI Food Safety License',
        steps: [
          "Complete Form A (Basic registration) or Form B (State/Central License).",
          "Upload FSMS (Food Safety Management System) plan declaration.",
          "Pay the renewal fee on the FoSCoS portal (starts from ₹100/year up to ₹7,500/year depending on scale).",
          "Respond to inspections if scheduled by the food safety officer."
        ],
        documents: [
          "Latest FSSAI Certificate copy",
          "Photo Identity Proof (Aadhaar or PAN of Owner)",
          "Proof of Possession of Premises (Rent Agreement/Utility Bill)",
          "List of Food Categories / Menu layout",
          "Water Analysis Report (chemical & bacteriological)"
        ],
        risks: "Severe penalties up to ₹5,00,000 and business closure orders. Daily penalty of ₹100 starts from the date of expiry."
      };
    case 'GST':
      return {
        type: 'GST Registration',
        steps: [
          "Ensure all pending GSTR-1 and GSTR-3B filings are submitted.",
          "Log into the GST portal and navigate to Services > Registration > Application for Amendment.",
          "Validate core business fields, update address or PAN if needed.",
          "Verify the amendment with DSC (Digital Signature) or EVC (Aadhaar OTP)."
        ],
        documents: [
          "GST Registration Certificate (REG-06)",
          "PAN Card of the Business",
          "Updated Bank Passbook / Cancelled Cheque",
          "Authorized Signatory Resolution",
          "Principal Place of Business proof"
        ],
        risks: "Deactivation of GSTIN. Blockage of E-Way Bills, invalidation of Input Tax Credit (ITC) for buyers, and flat penalty of ₹10,000 or 10% of tax due."
      };
    case 'Trade License':
      return {
        type: 'Trade License (BBMP / Local Body)',
        steps: [
          "Retrieve previous year Trade License number on municipal portal.",
          "Upload latest property tax payment receipt.",
          "Fill self-declaration of business operations and sanitary conditions.",
          "Make online payment of renewal fee based on square footage and staff size."
        ],
        documents: [
          "Previous Trade License Copy",
          "Latest Property Tax Paid Receipt",
          "Lease Deed or NOC from Building Owner",
          "Occupancy Certificate (OC) of building",
          "Sanitary & Health Fitness declaration"
        ],
        risks: "Sealing of restaurant premises by municipal health inspectors. Penalties up to 50% surcharge on license fees."
      };
    case 'Shop & Establishment':
      return {
        type: 'Shop & Establishment Registration',
        steps: [
          "Submit renewal application on e-Karmika or state Labour department portal.",
          "Update total headcount, worker wages, and weekly holiday declarations.",
          "Pay the statutory government fee calculated based on employee bands."
        ],
        documents: [
          "Original Registration Certificate (Form C)",
          "Panchayat / Trade License copy",
          "Employee Register (Form F)",
          "Wages / Attendance sheets",
          "Partnership Deed or Incorporation Certificate"
        ],
        risks: "Prosecution under state labor acts. Fines continue for operating without updated employment registrations."
      };
    case 'Fire NOC':
      return {
        type: 'Fire No Objection Certificate (NOC)',
        steps: [
          "Schedule preventive maintenance of fire extinguishers, alarms, and wet risers.",
          "Request a fire audit report from a certified safety engineer.",
          "Submit renewal request on state Fire Services portal.",
          "Fire safety officer inspector visit will be scheduled to check safety systems."
        ],
        documents: [
          "Original Fire Safety NOC Certificate",
          "Compliance report of previous recommendations",
          "Layout Plan showing firefighting installations",
          "Refilling certificates of fire extinguishers",
          "Electrical safety certificate from licensed contractor"
        ],
        risks: "Instant withdrawal of eating house or business license. Cancellation of insurance coverage in case of mishaps. Criminal liability for owners."
      };
    default:
      return {
        type: 'General Government Compliance',
        steps: [
          "Check renewal rules on official authority website.",
          "Confirm checklist requirements and fees.",
          "Submit application online."
        ],
        documents: [
          "Original Certificate Copy",
          "Business Pan & Address proof",
          "Aadhaar Card of the Applicant"
        ],
        risks: "Potential penalties, legal notices, and temporary suspension of operations."
      };
  }
};
