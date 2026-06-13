import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  UploadCloud, 
  Calendar, 
  ShieldCheck, 
  Info,
  Clock,
  Download,
  Flame,
  User,
  Building,
  Bookmark
} from 'lucide-react';
import Sidebar from '../components/Udyan/Sidebar';
import { 
  getLicenses, 
  getProfile, 
  getComplianceProfile, 
  getChecklist, 
  getMe,
  removeToken
} from '../utils/udyanStorage';
import type { License, BusinessProfile, ComplianceProfile } from '../utils/udyanStorage';

const licensePortalUrls: Record<string, string> = {
  'FSSAI': 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB',
  'GST': 'https://services.gst.gov.in/services/login',
  'Trade License': 'https://bbmp.gov.in',
  'Shop & Establishment': 'https://ekarmika.karnataka.gov.in/',
  'Fire NOC': 'https://kfireservices.gov.in/',
  'Drug License': 'https://cdsco.gov.in/',
  'Factory License': 'https://labour.gov.in/',
  'Pollution Consent': 'https://kspcb.karnataka.gov.in/',
  'Clinical Establishment License': 'https://clinicalestablishments.gov.in/',
  'Education Board Affiliation': 'https://cbse.gov.in/'
};

const UdyanLicenseDetail: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string } | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [compliance, setCompliance] = useState<ComplianceProfile | null>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [type]);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await getMe();
      setCurrentUser(user);

      const profData = await getProfile();
      const licData = await getLicenses();
      const compData = await getComplianceProfile();

      setProfile(profData);
      setCompliance(compData);

      const foundLic = licData.find(l => l.type === type);
      if (foundLic) {
        setLicense(foundLic);
      } else {
        setLicense(null);
      }
    } catch (err) {
      console.error('Failed to load license details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const licType = type || 'FSSAI';
  const checklist = getChecklist(licType);
  const portalUrl = licensePortalUrls[licType] || 'https://india.gov.in';

  // Determine actual status
  let currentStatus: 'Active' | 'Expiring Soon' | 'Expired' | 'Declared (No Doc)' | 'Missing' = 'Missing';
  
  if (license) {
    currentStatus = license.status;
  } else if (compliance?.existing_licenses.includes(licType)) {
    currentStatus = 'Declared (No Doc)';
  } else if (compliance?.required_licenses.includes(licType)) {
    currentStatus = 'Missing';
  }

  const statusColors: Record<typeof currentStatus, string> = {
    'Active': 'border-emerald-200 bg-emerald-50 text-emerald-700',
    'Expiring Soon': 'border-amber-200 bg-amber-50 text-amber-700',
    'Expired': 'border-red-200 bg-red-50 text-red-700',
    'Declared (No Doc)': 'border-blue-200 bg-blue-50 text-blue-700',
    'Missing': 'border-gray-200 bg-gray-100 text-gray-500'
  };

  const statusDots: Record<typeof currentStatus, string> = {
    'Active': 'bg-emerald-500',
    'Expiring Soon': 'bg-amber-500',
    'Expired': 'bg-red-500',
    'Declared (No Doc)': 'bg-blue-500',
    'Missing': 'bg-gray-400'
  };

  return (
    <div className="min-h-screen bg-[#F8F7FA] text-black font-norms flex">
      {/* Sidebar */}
      <Sidebar 
        currentUser={currentUser} 
        onLogout={() => {
          removeToken();
          navigate('/login');
        }} 
      />

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/udyan" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* License Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-gray-100 border border-gray-200 text-black font-norms font-bold text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider">
                {licType}
              </span>
              <span className={`flex items-center gap-1.5 border text-xs font-bold px-3 py-1 rounded-full ${statusColors[currentStatus]}`}>
                <span className={`w-2 h-2 rounded-full ${statusDots[currentStatus]}`} />
                {currentStatus}
              </span>
            </div>
            <h1 className="text-3xl font-bold font-norms text-black mt-3">{checklist.type}</h1>
            <p className="text-sm text-gray-500 mt-1">Manage compliance status, details, and renew options for this statutory license.</p>
          </div>

          <div className="flex gap-3">
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
            >
              Open Renewal Portal
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* License Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Document details / Upload block */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card: Document Details */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black font-norms mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                License Properties & Details
              </h2>

              {license ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">License Number</label>
                    <span className="text-base font-mono text-black font-semibold">{license.license_number}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Issuing Authority</label>
                    <span className="text-sm text-gray-800 font-semibold">{license.authority}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Owner Name</label>
                    <span className="text-sm text-gray-800 font-semibold">{license.owner_name || profile?.owner_name || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Business / Firm Name</label>
                    <span className="text-sm text-gray-800 font-semibold">{license.business_name || profile?.business_name || 'N/A'}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Issue Date</label>
                    <span className="text-sm text-gray-800 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {license.issue_date}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Expiry Date</label>
                    <span className="text-sm text-gray-800 font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-500" />
                      {license.expiry_date}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Scan Accuracy Score</label>
                    <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      {(license.confidence_score * 100).toFixed(0)}% Match accuracy
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-gray-500 font-semibold">No uploaded document found in database.</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    {currentStatus === 'Declared (No Doc)' 
                      ? 'You declared having this license during onboarding, but a valid document has not been uploaded/scanned yet.'
                      : 'This license is required for your business sector but is currently missing from your dashboard.'}
                  </p>
                </div>
              )}
            </div>

            {/* Card: Document Upload / Upload PDF/Image scanner link */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black font-norms mb-4 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                Upload / Scan Document Copy
              </h2>
              <p className="text-xs text-gray-400 mb-6">
                Uploading a scanned copy automatically runs OCR text extraction to index and verify your license data.
              </p>

              <div className="border border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer" onClick={() => navigate('/udyan/scanner')}>
                <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-black">Scan & Upload Document</h3>
                <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto">
                  Click to open our smart OCR scanner. Select your {licType} image or document to extract license numbers and renewal schedules automatically.
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                >
                  Launch OCR Scanner
                </button>
              </div>
            </div>

            {/* Card: Chrome Autofill details mapping */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-black font-norms mb-4 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-500" />
                Chrome Extension Integration Profile
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                The UdyamAI browser extension automatically detects when you visit official government portals for <strong className="text-black">{licType}</strong> and maps the following details to inputs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Extension Mapped Fields</span>
                  <div className="space-y-1 text-xs text-gray-600 font-mono">
                    <div>Firm Name &rarr; <span className="text-black font-semibold">{profile?.business_name || 'N/A'}</span></div>
                    <div>License No &rarr; <span className="text-black font-semibold">{license?.license_number || 'N/A'}</span></div>
                    <div>Authorized Signatory &rarr; <span className="text-black font-semibold">{profile?.owner_name || 'N/A'}</span></div>
                    <div>Mobile Number &rarr; <span className="text-black font-semibold">{profile?.mobile || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Status check link</span>
                    <p className="text-xs text-gray-500">Redirect targets this license directly for fast form submissions.</p>
                  </div>
                  <a 
                    href={portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline font-bold mt-3 inline-flex items-center gap-1"
                  >
                    View Portal Registry &rarr;
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Checklist & Risks */}
          <div className="space-y-6">
            
            {/* Card: Compliance Checklist */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Compliance Checklist
              </h2>
              <p className="text-xs text-gray-400 mb-4">Steps required to register or renew this license certificate:</p>
              
              <div className="space-y-3">
                {checklist.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-700 leading-normal">
                    <div className="w-4 h-4 bg-indigo-55 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 mt-5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Required Documents</span>
                <div className="space-y-2">
                  {checklist.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 font-semibold p-2 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card: Penalty & Risk Warnings */}
            <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-red-800 font-norms flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-650" />
                Regulatory & Penalty Risks
              </h2>
              <p className="text-xs text-red-700 leading-relaxed mb-4">
                Operating without an active and verified <strong>{licType}</strong> license carries severe legal and financial risks in India:
              </p>

              <div className="bg-white border border-red-100 p-4 rounded-xl">
                <p className="text-xs text-gray-700 leading-relaxed italic font-medium">
                  "{checklist.risks}"
                </p>
              </div>

              <div className="text-[10px] text-red-500 mt-4 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Compliance standing: {currentStatus === 'Active' ? 'Safe (Document verified)' : 'Critical / Deficit warning active'}
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default UdyanLicenseDetail;
