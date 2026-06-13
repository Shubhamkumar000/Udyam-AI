// Storage Utility for Udyan AI
// Supports fallback to LocalStorage for zero-setup demo mode

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
  id: string;
  type: 'GST' | 'FSSAI' | 'Trade License' | 'Shop & Establishment' | 'Fire NOC' | 'Eating House' | 'Pollution Control';
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

export interface Notification {
  id: string;
  license_id: string;
  license_name: string;
  type: 'email' | 'dashboard';
  title: string;
  message: string;
  date: string;
  sent: boolean;
}

// Default preloaded Demo business data
const DEFAULT_PROFILE: BusinessProfile = {
  business_name: "Spice Route Restaurant",
  owner_name: "Rahul Sharma",
  email: "rahul@spiceroute.in",
  mobile: "9876543210",
  gstin: "29ABCDE1234F1Z5",
  fssai_number: "21224009000123",
  trade_license_number: "TL-KAR-2024-8972",
  address: "MG Road, Bengaluru",
  city: "Bengaluru",
  district: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  pan: "ABCDE1234F",
  aadhaar: "1234-5678-9012"
};

// Expiry logic helper relative to Current Time: 2026-06-13
const getRelativeDateStr = (offsetDays: number): string => {
  const baseDate = new Date("2026-06-13T15:10:00");
  baseDate.setDate(baseDate.getDate() + offsetDays);
  return baseDate.toISOString().split('T')[0];
};

const DEFAULT_LICENSES: License[] = [
  {
    id: "lic-1",
    type: "GST",
    license_number: "29ABCDE1234F1Z5",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2021-06-15",
    expiry_date: "2028-06-14",
    authority: "Central Board of Indirect Taxes and Customs (CBIC)",
    confidence_score: 0.98,
    portal_url: "https://services.gst.gov.in/services/login",
    status: "Active"
  },
  {
    id: "lic-2",
    type: "FSSAI",
    license_number: "21224009000123",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2023-01-10",
    expiry_date: "2027-01-09",
    authority: "Food Safety and Standards Authority of India (FSSAI)",
    confidence_score: 0.95,
    portal_url: "https://foscos.fssai.gov.in/",
    status: "Active"
  },
  {
    id: "lic-3",
    type: "Trade License",
    license_number: "TL-KAR-2024-8972",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2024-03-25",
    expiry_date: getRelativeDateStr(15), // June 28, 2026 (Expiring soon)
    authority: "Bruhat Bengaluru Mahanagara Palike (BBMP)",
    confidence_score: 0.92,
    portal_url: "https://bbmp.gov.in",
    status: "Expiring Soon"
  },
  {
    id: "lic-4",
    type: "Shop & Establishment",
    license_number: "SE-KAR-98721",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2022-09-01",
    expiry_date: "2029-08-31",
    authority: "Department of Labour, Government of Karnataka",
    confidence_score: 0.94,
    portal_url: "https://ekarmika.karnataka.gov.in/",
    status: "Active"
  },
  {
    id: "lic-5",
    type: "Fire NOC",
    license_number: "FNOC-BBMP-2022-441",
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    issue_date: "2022-06-03",
    expiry_date: getRelativeDateStr(-10), // June 3, 2026 (Expired)
    authority: "Karnataka State Fire & Emergency Services",
    confidence_score: 0.89,
    portal_url: "https://kfireservices.gov.in/",
    status: "Expired"
  }
];

const API_BASE = "http://localhost:5000/api";

export const getProfile = async (): Promise<BusinessProfile> => {
  try {
    const res = await fetch(`${API_BASE}/business-profile`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Failover
  }
  const cached = localStorage.getItem('udyan_profile');
  if (!cached) {
    localStorage.setItem('udyan_profile', JSON.stringify(DEFAULT_PROFILE));
    return DEFAULT_PROFILE;
  }
  return JSON.parse(cached);
};

export const saveProfile = async (profile: BusinessProfile): Promise<BusinessProfile> => {
  try {
    const res = await fetch(`${API_BASE}/business-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Failover
  }
  localStorage.setItem('udyan_profile', JSON.stringify(profile));
  return profile;
};

export const getLicenses = async (): Promise<License[]> => {
  try {
    const res = await fetch(`${API_BASE}/licenses`);
    if (res.ok) return await res.json();
  } catch (err) {
    // Failover
  }
  const cached = localStorage.getItem('udyan_licenses');
  if (!cached) {
    localStorage.setItem('udyan_licenses', JSON.stringify(DEFAULT_LICENSES));
    return DEFAULT_LICENSES;
  }
  return JSON.parse(cached);
};

export const saveLicense = async (license: Omit<License, 'id' | 'status'>): Promise<License> => {
  const status = getLicenseStatus(license.expiry_date);
  const newLicense: License = {
    ...license,
    id: `lic-${Date.now()}`,
    status
  };

  try {
    const res = await fetch(`${API_BASE}/upload-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLicense)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    // Failover
  }

  const licenses = await getLicenses();
  licenses.push(newLicense);
  localStorage.setItem('udyan_licenses', JSON.stringify(licenses));
  return newLicense;
};

export const deleteLicense = async (id: string): Promise<void> => {
  try {
    await fetch(`${API_BASE}/licenses/${id}`, { method: 'DELETE' });
  } catch (err) {
    // Failover
  }
  const licenses = await getLicenses();
  const filtered = licenses.filter(l => l.id !== id);
  localStorage.setItem('udyan_licenses', JSON.stringify(filtered));
};

// Health score logic: 100 - 10 per expiring - 25 per expired
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
        risks: "Prosecution under state labor acts. Continuous fines for operating without updated employment registrations."
      };
    case 'Fire NOC':
      return {
        type: 'Fire No Objection Certificate (NOC)',
        steps: [
          "Schedule preventive maintenance of fire extinguishers, alarms, and wet risers.",
          "Request a fire audit report from a certified safety engineer.",
          "Submit renewal request on state Fire Services portal.",
          "Fire safety officer inspector visit will be scheduled to check water pressure, alarms, and emergency exits."
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
