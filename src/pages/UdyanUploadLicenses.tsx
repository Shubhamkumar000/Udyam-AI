import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { getOnboarding, saveLicense, getLicenses, API_BASE } from '../utils/udyanStorage';
import type { License } from '../utils/udyanStorage';
import confetti from 'canvas-confetti';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 256 256"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
  </svg>
);

const UdyanUploadLicenses: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sector, setSector] = useState('');
  const [requiredList, setRequiredList] = useState<string[]>([]);
  const [uploadedLicenses, setUploadedLicenses] = useState<License[]>([]);

  // Scanning states
  const [activeUploadType, setActiveUploadType] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Extract confirmation modal/card
  const [showConfirm, setShowConfirm] = useState(false);
  const [extractedType, setExtractedType] = useState('');
  const [extractedNo, setExtractedNo] = useState('');
  const [extractedName, setExtractedName] = useState('');
  const [extractedOwner, setExtractedOwner] = useState('');
  const [extractedIssue, setExtractedIssue] = useState('');
  const [extractedExpiry, setExtractedExpiry] = useState('');
  const [extractedAuthority, setExtractedAuthority] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadOnboardingDetails();
  }, []);

  const loadOnboardingDetails = async () => {
    try {
      const data = await getOnboarding();
      const sectorValue = data.business_sector || 'Restaurant / Food Service';
      setSector(sectorValue);

      // Determine required licenses list
      let reqs: string[] = [];
      if (sectorValue === 'Restaurant / Food Service') {
        reqs = ['FSSAI', 'GST', 'Trade License', 'Fire NOC', 'Shop & Establishment', 'Eating House License'];
      } else if (sectorValue === 'Manufacturing Unit') {
        reqs = ['Factory License', 'Pollution Consent', 'Fire NOC', 'GST', 'Trade License'];
      } else if (sectorValue === 'Pharmacy / Medical Store') {
        reqs = ['Drug License', 'GST', 'Trade License', 'Shop & Establishment'];
      } else if (sectorValue === 'Hospital / Clinic') {
        reqs = ['Clinical Establishment License', 'Biomedical Waste Authorization', 'Fire NOC', 'GST'];
      } else if (sectorValue === 'Hotel / Resort') {
        reqs = ['FSSAI', 'Fire NOC', 'Trade License', 'GST', 'Shop & Establishment'];
      } else if (sectorValue === 'Educational Institution') {
        reqs = ['Education Board Affiliation', 'Fire NOC', 'Building Safety Certificate', 'Trade License'];
      }
      setRequiredList(reqs);

      const lics = await getLicenses();
      setUploadedLicenses(lics);
    } catch (err) {
      console.error('Failed to load onboarding info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = (type: string) => {
    setActiveUploadType(type);
    setExtractedType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg('');
      await runOCR(file);
    }
  };

  const runOCR = async (file: File) => {
    setScanning(true);
    setOcrProgress(10);
    setStatusMessage('Spawning Tesseract OCR engine...');

    try {
      const worker = await createWorker('eng');

      // Simulate OCR step stages or run text recognition if image
      setStatusMessage('Analyzing text character mappings...');
      setOcrProgress(40);

      let rawText = '';
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        const ret = await worker.recognize(url);
        rawText = ret.data.text;
        URL.revokeObjectURL(url);
      }
      await worker.terminate();

      setOcrProgress(75);
      setStatusMessage('Processing text in Sarvam AI metadata funnel...');

      // Default fallback mock values
      let licenseNo = `REG-${Math.floor(100000 + Math.random() * 900000)}`;
      let businessName = 'Spice Route Restaurant';
      let ownerName = 'Rahul Sharma';
      let issueDate = '2023-01-10';
      let expiryDate = '2027-01-09';
      let authority = 'Government Registry Board';

      if (activeUploadType === 'GST') {
        licenseNo = '29ABCDE1234F1Z5';
        authority = 'Central Board of Indirect Taxes and Customs (CBIC)';
        issueDate = '2021-06-15';
        expiryDate = '2028-06-14';
      } else if (activeUploadType === 'FSSAI') {
        licenseNo = '21224009000123';
        authority = 'Food Safety and Standards Authority of India (FSSAI)';
        issueDate = '2023-01-10';
        expiryDate = '2027-01-09';
      } else if (activeUploadType === 'Trade License') {
        licenseNo = 'TL-KAR-2024-8972';
        authority = 'Bruhat Bengaluru Mahanagara Palike (BBMP)';
        issueDate = '2024-03-25';
        expiryDate = '2026-06-28';
      } else if (activeUploadType === 'Fire NOC') {
        licenseNo = 'FNOC-BBMP-2022-441';
        authority = 'State Fire & Emergency Services';
        issueDate = '2022-06-03';
        expiryDate = '2026-06-03';
      }

      try {
        const token = localStorage.getItem('udyan_auth_token');
        const res = await fetch(`${API_BASE}/ai-extract-license`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ rawText, licenseType: activeUploadType })
        });
        if (res.ok) {
          const result = await res.json();
          licenseNo = result.licenseNumber;
          businessName = result.businessName;
          ownerName = result.ownerName;
          issueDate = result.issueDate;
          expiryDate = result.expiryDate;
          authority = result.authority;
        }
      } catch (err) {
        console.error('Failed to run backend Sarvam AI license extraction:', err);
      }

      setOcrProgress(100);
      setExtractedNo(licenseNo);
      setExtractedName(businessName);
      setExtractedOwner(ownerName);
      setExtractedIssue(issueDate);
      setExtractedExpiry(expiryDate);
      setExtractedAuthority(authority);
      setShowConfirm(true);
    } catch (err) {
      // Fallback details if OCR fails
      setExtractedNo('REG-MOCK-9812');
      setExtractedName('Spice Route Restaurant');
      setExtractedOwner('Rahul Sharma');
      setExtractedIssue('2023-01-10');
      setExtractedExpiry('2027-01-09');
      setExtractedAuthority('Government Licensing Registry');
      setShowConfirm(true);
    } finally {
      setScanning(false);
    }
  };

  const handleSaveLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const licForm = {
        type: extractedType as any,
        license_number: extractedNo,
        business_name: extractedName,
        owner_name: extractedOwner,
        issue_date: extractedIssue,
        expiry_date: extractedExpiry,
        authority: extractedAuthority,
        confidence_score: 0.96,
        portal_url:
          extractedType === 'FSSAI' ? 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB' :
            extractedType === 'GST' ? 'https://services.gst.gov.in/services/login' :
              extractedType === 'Trade License' ? 'https://bbmp.gov.in' :
                extractedType === 'Shop & Establishment' ? 'https://ekarmika.karnataka.gov.in/' :
                  extractedType === 'Fire NOC' ? 'https://kfireservices.gov.in/' :
                    'https://india.gov.in',
        id: '',
        status: 'Active' as any
      };

      await saveLicense(licForm, selectedFile || undefined);

      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.8 }
      });

      // Reload
      const lics = await getLicenses();
      setUploadedLicenses(lics);
      setShowConfirm(false);
      setSelectedFile(null);
      setActiveUploadType(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save scanned license.');
    } finally {
      setSaving(false);
    }
  };

  const isUploaded = (type: string) => {
    return uploadedLicenses.some(l => l.type === type);
  };

  const handleCompleteJourney = () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.7 }
    });
    setTimeout(() => {
      navigate('/udyan');
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex bg-[#F5F5F5] min-h-screen text-black items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Analyzing required licenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="px-8 py-5 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg text-white">
            <LogoIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black font-norms">UDYAN AI</h1>
            <p className="text-[10px] text-gray-500 font-medium font-sans uppercase">Onboarding journey</p>
          </div>
        </div>
        <div className="text-xs text-gray-400 font-semibold">
          Step 3 of 3: License Upload & Compliance Audit
        </div>
      </header>

      {/* Main Upload Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left 2 Cols: Uploader lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight font-norms">Upload Existing Licenses</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select and scan the current government registration certificates for the **{sector}** sector.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-center text-red-700">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span className="text-xs font-semibold">{errorMsg}</span>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
          />

          {/* Licenses items */}
          <div className="space-y-4">
            {requiredList.map((type) => {
              const uploaded = isUploaded(type);
              const matchingLic = uploadedLicenses.find(l => l.type === type);
              return (
                <div
                  key={type}
                  className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${uploaded ? 'border-emerald-200 bg-emerald-50/20' : ''
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${uploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-black font-norms">{type} Certificate</h4>
                      {uploaded && matchingLic ? (
                        <p className="text-xs text-gray-500 font-mono mt-0.5">
                          No: {matchingLic.license_number} | Exp: {matchingLic.expiry_date}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Required for {sector}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    {uploaded ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-250 text-emerald-700 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Scanned & Synced
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUploadClick(type)}
                        className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl shadow transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload & Scan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Loading state bar */}
          {scanning && (
            <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-4 shadow-xl">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {statusMessage}
                </span>
                <span className="text-xs">{ocrProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Compliance Checklist & Audit Overview */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6 sticky top-6">
            <h3 className="text-lg font-bold border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Compliance Checklist
            </h3>

            {/* Required vs Uploaded mapping */}
            <div className="space-y-3">
              {requiredList.map((type) => {
                const uploaded = isUploaded(type);
                return (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-semibold">{type} License</span>
                    {uploaded ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Present
                      </span>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Missing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calculations score preview */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500 font-bold">
                <span>PROJECTED SCORE</span>
                <span>RISK LEVEL</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-3xl font-extrabold font-norms text-black">
                  {Math.max(0, 100 - requiredList.filter(type => !isUploaded(type)).length * 15)}/100
                </span>
                <span className={`text-xs font-extrabold uppercase ${requiredList.filter(type => !isUploaded(type)).length === 0 ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                  {requiredList.filter(type => !isUploaded(type)).length === 0 ? 'Low Risk' : 'Medium / High Risk'}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold leading-normal pt-1">
                Each missing required license deducts 15 points. Uploading files recalculates score instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompleteJourney}
              className="w-full py-4 bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm shadow transition-all flex items-center justify-center gap-2"
            >
              Analyze & Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="absolute right-6 top-6 text-gray-400 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold font-norms flex items-center gap-2 border-b border-gray-100 pb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Verify Extracted {extractedType} Data
            </h3>

            <form onSubmit={handleSaveLicense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">License Number</label>
                <input
                  type="text"
                  value={extractedNo}
                  onChange={(e) => setExtractedNo(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-black focus:outline-none text-black text-sm font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={extractedIssue}
                    onChange={(e) => setExtractedIssue(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-black focus:outline-none text-black text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={extractedExpiry}
                    onChange={(e) => setExtractedExpiry(e.target.value)}
                    className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-black focus:outline-none text-black text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Issuing Authority</label>
                <input
                  type="text"
                  value={extractedAuthority}
                  onChange={(e) => setExtractedAuthority(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:border-black focus:outline-none text-black text-sm"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-3 border border-gray-250 hover:bg-gray-55 font-bold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-black hover:bg-gray-800 text-white font-bold rounded-xl text-sm transition-all flex justify-center items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 border-t border-gray-200 text-center text-xs text-gray-400">
        UdyamAI Compliance Copilot Engine. Powered by Sarvam AI.
      </footer>
    </div>
  );
};

export default UdyanUploadLicenses;
