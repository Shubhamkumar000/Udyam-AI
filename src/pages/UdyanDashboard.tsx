import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  FileText, 
  Download, 
  ExternalLink,
  Clock,
  RefreshCw,
  Bell,
  Sparkles,
  Search,
  ShieldCheck,
  Building,
  User,
  ShieldAlert
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getLicenses, 
  getProfile, 
  getComplianceProfile,
  deleteLicense,
  getChecklist,
  getMe,
  removeToken,
  getOnboarding,
  getComplianceRiskReport
} from '../utils/udyanStorage';
import type { License, BusinessProfile, ComplianceProfile } from '../utils/udyanStorage';
import type { ComplianceRiskReport } from '../types/riskEngine';
import Sidebar from '../components/Udyan/Sidebar';
import LicenseTimeline from '../components/Udyan/LicenseTimeline';
import ComplianceRiskCenter from '../components/Udyan/ComplianceRiskCenter';
import RegulatoryOfficeMap from '../components/Udyan/RegulatoryOfficeMap';
import AnimatedCounter from '../components/Udyan/AnimatedCounter';
import { fadeInUp, staggerContainer, hoverLift, tapScale } from '../utils/animations';

const UdyanDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<{ fullName: string; email: string } | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [businessSector, setBusinessSector] = useState<string>('');
  const [compliance, setCompliance] = useState<ComplianceProfile | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [riskReport, setRiskReport] = useState<ComplianceRiskReport | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);
  
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expiring Soon' | 'Expired'>('All');
  
  // States for Modals
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [redirectingLicense, setRedirectingLicense] = useState<License | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setRiskLoading(true);
    try {
      // Fire ALL independent API calls in parallel instead of sequentially
      const [user, profData, licData, compData, onboardingData] = await Promise.all([
        getMe(),
        getProfile(),
        getLicenses(),
        getComplianceProfile(),
        getOnboarding()
      ]);

      setCurrentUser(user);
      setProfile(profData);
      setLicenses(licData);
      setCompliance(compData);
      setBusinessSector(onboardingData.business_sector || '');
    } catch (err) {
      console.error('Failed to load database records:', err);
    } finally {
      setLoading(false);
    }

    // Load risk report separately so dashboard renders without waiting for it
    try {
      const riskData = await getComplianceRiskReport();
      setRiskReport(riskData);
    } catch (err) {
      console.error('Failed to load risk report:', err);
    } finally {
      setRiskLoading(false);
    }
  };

  const handleOpenChecklist = (lic: License) => {
    setSelectedLicense(lic);
    setIsChecklistOpen(true);
  };

  const handleRenewRedirect = (lic: License) => {
    setRedirectingLicense(lic);
    setIsRedirectModalOpen(true);
    setCountdown(3);

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          window.open(lic.portal_url, '_blank');
          setIsRedirectModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this license document from the database? This will recalculate compliance score.")) {
      await deleteLicense(id);
      await loadAllData();
    }
  };

  const downloadChecklistPDF = (lic: License) => {
    const checklist = getChecklist(lic.type);
    const docText = `
==================================================
UDYAM AI - RENEWAL COMPLIANCE CHECKLIST
==================================================
License Type: ${checklist.type}
License Number: ${lic.license_number}
Business Name: ${lic.business_name}
Authorized Owner: ${lic.owner_name}
Authority: ${lic.authority}
Expiry Date: ${lic.expiry_date}
Compliance Status: ${lic.status.toUpperCase()}

--------------------------------------------------
COMPLIANCE RISK WARNING:
--------------------------------------------------
${checklist.risks}

--------------------------------------------------
REQUIRED SUPPORTING DOCUMENTS:
--------------------------------------------------
${checklist.documents.map((doc, idx) => `[ ] ${idx + 1}. ${doc}`).join('\n')}

--------------------------------------------------
STEP-BY-STEP RENEWAL WORKFLOW:
--------------------------------------------------
${checklist.steps.map((step, idx) => `Step ${idx + 1}: ${step}`).join('\n')}

--------------------------------------------------
Official Portal for Renewal:
URL: ${lic.portal_url}
Use the "Udyam AI" portal redirect to automatically map 
and populate forms using the active business profile.
--------------------------------------------------
Generated by Udyam AI
"Never Miss a Business License Renewal Again"
==================================================
    `;

    const blob = new Blob([docText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Renewal_Checklist_${lic.type.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/');
  };

  // Filtered licenses list
  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch = lic.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lic.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lic.authority.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Medium Risk': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'High Risk': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Critical Risk': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-750 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex bg-[#F5F5F5] min-h-screen text-black items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <motion.div
            className="w-12 h-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          />
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 font-medium font-norms"
          >
            Synchronizing compliance profile...
          </motion.p>
          <motion.div
            className="flex gap-1.5 justify-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-black/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const complianceScore = compliance?.compliance_score ?? 100;
  const riskLevel = compliance?.risk_level ?? 'Low Risk';

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen text-black font-sans">
      <Sidebar />

      {/* Main Workspace */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex-1 overflow-y-auto p-8"
      >
        
        {/* Top Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold font-norms tracking-tight text-black flex items-center gap-3">
              Compliance Dashboard
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                className="text-xs bg-black text-white px-2.5 py-1 rounded-full font-sans uppercase font-bold tracking-wide"
              >
                Live DB Connected
              </motion.span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-400" />
              Active: <span className="font-semibold text-black">{profile?.business_name || "Spice Route Restaurant"}</span> (GSTIN: {profile?.gstin || 'N/A'})
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>User: {currentUser?.fullName}</span>
            </div>
            
            <button 
              onClick={loadAllData}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <motion.span
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
              >
                <RefreshCw className="w-4 h-4 text-gray-500" />
              </motion.span>
              Sync
            </button>

            <motion.button
              whileHover={hoverLift}
              whileTap={tapScale}
              onClick={handleLogout}
              className="bg-black hover:bg-gray-800 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow transition-all"
            >
              Logout
            </motion.button>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <LicenseTimeline licenses={licenses} />
        </motion.div>

        {/* 6 CARD CORE LAYOUT */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          
          {/* Card 1: Compliance Health Score */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Compliance Health Score</h2>
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Aggregated rating computed based on uploaded and missing required licenses.
              </p>
            </div>

            <div className="flex items-center justify-center py-6">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    strokeWidth="8"
                    stroke="#F1F5F9"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="52"
                    strokeWidth="8"
                    stroke={complianceScore >= 90 ? '#10B981' : complianceScore >= 70 ? '#F59E0B' : '#EF4444'}
                    strokeDasharray={2 * Math.PI * 52}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - complianceScore / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <AnimatedCounter value={complianceScore} className="text-3xl font-black text-black font-norms" />
                  <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Score</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-4">
              <span className="text-gray-400 font-semibold">Min: 0</span>
              <span className="text-gray-400 font-semibold">Max: 100</span>
            </div>
          </motion.div>

          {/* Card 2: Risk Level */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Risk Standing</h2>
                <ShieldAlert className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Active business risk parameter based on regulatory compliance.
              </p>
            </div>

            <div className="my-6 text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
                className={`inline-block px-5 py-3 rounded-2xl border text-lg font-black font-norms ${getRiskColor(riskLevel)}`}
              >
                {riskLevel}
              </motion.div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed px-4">
                {riskLevel === 'Low Risk' && 'Your compliance status is secure. Keep tracking renewals.'}
                {riskLevel === 'Medium Risk' && 'Minor action required. Plan upcoming renewals.'}
                {riskLevel === 'High Risk' && 'Warning: Missing required documents. Apply soon.'}
                {riskLevel === 'Critical Risk' && 'Immediate action required. Expired documents detected.'}
              </p>
            </div>

            <div className="text-xs text-gray-400 text-center border-t border-gray-100 pt-4">
              Level based on official MSME bands
            </div>
          </motion.div>

          {/* Card 3: Required Licenses */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Required Licenses</h2>
                <FileText className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Required for: <span className="text-black font-bold">{businessSector || 'Selected Sector'}</span>
              </p>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-1">
              {compliance?.required_licenses && compliance.required_licenses.length > 0 ? (
                compliance.required_licenses.map((lic: string) => {
                  const hasIt = compliance.existing_licenses.includes(lic);
                  const portalUrl = 
                    lic === 'FSSAI' ? 'https://foodlicenseportal.org/Home/renew?gad_source=1&gad_campaignid=23038392925&gbraid=0AAAAACzocouD9ojWtNfBiCtpWM2iev4Kp&gclid=Cj0KCQjw_7PRBhDcARIsAMjV7jnDkAkl_H_guWUD_Spud_xBdQ1LIoXh2ZWCh0R9HprCRjXePuHlHIcaAj4YEALw_wcB' :
                    lic === 'GST' ? 'https://services.gst.gov.in/services/login' :
                    lic === 'Trade License' ? 'https://bbmp.gov.in' :
                    lic === 'Shop & Establishment' ? 'https://ekarmika.karnataka.gov.in/' :
                    lic === 'Fire NOC' ? 'https://kfireservices.gov.in/' :
                    lic === 'Drug License' ? 'https://cdsco.gov.in/' :
                    lic === 'Factory License' ? 'https://labour.gov.in/' :
                    lic === 'Pollution Consent' ? 'https://kspcb.karnataka.gov.in/' :
                    lic === 'Clinical Establishment License' ? 'https://clinicalestablishments.gov.in/' :
                    lic === 'Education Board Affiliation' ? 'https://cbse.gov.in/' :
                    'https://india.gov.in';

                  return (
                    <div key={lic} className="flex items-center justify-between text-xs font-semibold p-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                      <div className="flex items-center gap-2">
                        {hasIt ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-md shrink-0" />
                        )}
                        <Link to={`/udyan/license/${lic}`} className={`hover:underline ${hasIt ? 'text-gray-400 line-through' : 'text-gray-700 font-bold'}`}>
                          {lic}
                        </Link>
                        <a 
                          href={portalUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-gray-400 hover:text-black transition-colors"
                          title="Official Registration Portal"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <span className={`text-[10px] font-bold ${hasIt ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {hasIt ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 font-semibold italic text-center py-4">No sector requirements loaded.</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-3 flex justify-between text-xs text-gray-500 font-semibold">
              <span>Required: {compliance?.required_licenses?.length || 0}</span>
              <span>Matched: {compliance?.existing_licenses?.length || 0}</span>
            </div>
          </motion.div>

          {/* Card 4: Existing Licenses */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Existing Licenses</h2>
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Licenses active and registered in the database.
              </p>
            </div>

            <div className="my-4 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {compliance?.existing_licenses && compliance.existing_licenses.length > 0 ? (
                compliance.existing_licenses.map((lic: string) => {
                  const match = licenses.find(l => l.type === lic);
                  return (
                    <div key={lic} className="flex justify-between items-center text-xs font-semibold p-1.5 bg-emerald-50/20 border border-emerald-100/50 rounded-lg">
                      <Link to={`/udyan/license/${lic}`} className="text-gray-800 hover:text-indigo-600 hover:underline">
                        {lic}
                      </Link>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {match ? match.license_number : 'Declared (No doc)'}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-6">No licenses active yet.</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex justify-between font-semibold">
              <span>Total existing: {compliance?.existing_licenses?.length || 0}</span>
              <Link to="/udyan/scanner" className="text-blue-600 hover:underline">Scan More</Link>
            </div>
          </motion.div>

          {/* Card 5: Missing Licenses */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Missing Licenses</h2>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Statutory documents currently missing from database.
              </p>
            </div>

            <div className="my-4 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {compliance?.missing_licenses && compliance.missing_licenses.length > 0 ? (
                compliance.missing_licenses.map((lic: string) => (
                  <div key={lic} className="flex justify-between items-center text-xs font-semibold p-1.5 bg-amber-50/20 border border-amber-100/50 rounded-lg">
                    <Link to={`/udyan/license/${lic}`} className="text-amber-800 hover:text-indigo-650 hover:underline">
                      {lic}
                    </Link>
                    <Link to="/udyan/scanner" className="text-[10px] text-indigo-650 hover:underline font-bold">Upload</Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-emerald-700 font-bold">All requirements met!</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex justify-between font-semibold">
              <span>Missing count: {compliance?.missing_licenses?.length || 0}</span>
              <span className="text-gray-400">Total deficit</span>
            </div>
          </motion.div>

          {/* Card 6: Upcoming Renewals */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider font-sans">Upcoming Renewals</h2>
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Licenses expiring within the next 60 days.
              </p>
            </div>

            <div className="my-4 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
              {compliance?.upcoming_renewals && compliance.upcoming_renewals.length > 0 ? (
                compliance.upcoming_renewals.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-semibold p-1.5 bg-red-50/20 border border-red-100/50 rounded-lg">
                    <span className="text-red-750 font-bold">{item.type}</span>
                    <span className="text-[10px] text-gray-500">{item.daysRemaining < 0 ? 'Expired' : `${item.daysRemaining} days left`}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-6">No renewals upcoming.</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex justify-between font-semibold">
              <span>Alert count: {compliance?.upcoming_renewals?.length || 0}</span>
              <span className="text-gray-400">Active reminders</span>
            </div>
          </motion.div>

        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
        >
          <ComplianceRiskCenter report={riskReport} loading={riskLoading} />
        </motion.div>

        {/* Regulatory Office Map + AI Insights */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="flex flex-col gap-6 mb-8"
        >
          <motion.div variants={fadeInUp}>
            <RegulatoryOfficeMap profile={profile} />
          </motion.div>

          {/* Compliance Insights & AI Suggestions */}
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Advisory Insights
              </h2>
              
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {compliance?.compliance_insights && compliance.compliance_insights.length > 0 ? (
                  compliance.compliance_insights.map((insight: string, idx: number) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-700 leading-normal">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      <span>{insight}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-8">Insights will generate automatically once onboarding answers are saved.</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 text-center">
              <Link
                to="/udyan/chat"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold inline-flex items-center gap-1"
              >
                Discuss with AI Copilot &rarr;
              </Link>
            </div>
          </motion.div>

        </motion.div>

        {/* Registered Licenses Table */}
        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold font-norms text-black">Registered License Documents</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-initial">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search registered..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-300 text-black text-sm pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-black w-full md:w-60"
                />
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                {(['All', 'Active', 'Expiring Soon', 'Expired'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      statusFilter === f 
                        ? 'bg-white text-black shadow-sm font-bold' 
                        : 'text-gray-500 hover:text-black'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredLicenses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-505 text-sm font-semibold">No active licenses stored matching your filter.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
              {filteredLicenses.map((lic, idx) => {
                const statusColor = 
                  lic.status === 'Active' 
                    ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700' 
                    : lic.status === 'Expiring Soon'
                    ? 'border-amber-200 bg-amber-50/50 text-amber-700'
                    : 'border-red-200 bg-red-50/50 text-red-700';

                const badgeDot = 
                  lic.status === 'Active' 
                    ? 'bg-emerald-500' 
                    : lic.status === 'Expiring Soon'
                    ? 'bg-amber-500'
                    : 'bg-red-500';

                return (
                  <motion.div
                    key={lic.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.05, type: 'spring', stiffness: 280, damping: 24 }}
                    whileHover={hoverLift}
                    className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 flex flex-col justify-between group transition-all duration-200 shadow-sm"
                  >
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <Link 
                          to={`/udyan/license/${lic.type}`}
                          className="bg-gray-100 border border-gray-200 text-black hover:bg-gray-200 font-norms font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {lic.type}
                        </Link>
                        <span className={`flex items-center gap-1.5 border text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                          {lic.status}
                        </span>
                      </div>

                      <div className="space-y-2.5 mt-4 text-black">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">License Number</label>
                          <span className="text-sm font-mono text-black font-semibold">{lic.license_number}</span>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Authority</label>
                          <span className="text-xs text-gray-700 font-semibold leading-normal">{lic.authority}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Issue Date</label>
                            <span className="text-[11px] font-semibold text-gray-500">{lic.issue_date}</span>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Expiry Date</label>
                            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {lic.expiry_date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span>Scan Score:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {(lic.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/udyan/license/${lic.type}`}
                          className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-indigo-600 font-semibold px-3 py-2 rounded-xl transition-all"
                        >
                          Details
                        </Link>
                        <button
                          onClick={() => handleOpenChecklist(lic)}
                          className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-xl transition-all"
                        >
                          Checklist
                        </button>
                        
                        <button
                          onClick={() => handleRenewRedirect(lic)}
                          className={`text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all ${
                            lic.status === 'Active' 
                              ? 'bg-gray-100 hover:bg-gray-250 text-gray-500' 
                              : 'bg-black hover:bg-gray-800 text-white shadow-sm'
                          }`}
                        >
                          Renew
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button 
                          onClick={() => handleDelete(lic.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-650 p-1 transition-all rounded"
                          title="Delete license"
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.section>

        {/* Smart Reminders Alert Feed */}
        <motion.section
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={fadeInUp} whileHover={hoverLift} className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Active Reminders Log
              </h2>
              <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md font-mono">
                System (GMT+5:30)
              </span>
            </div>

            <div className="space-y-4">
              {compliance?.upcoming_renewals && compliance.upcoming_renewals.length > 0 ? (
                compliance.upcoming_renewals.map((alert: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl items-start">
                    <div className="p-2 rounded-xl mt-0.5 bg-red-50 text-red-600 animate-pulse">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-xs font-bold text-gray-800 font-norms">{alert.type} Expiry Notice</h3>
                        <span className="text-[9px] text-gray-400 font-mono whitespace-nowrap">{alert.expiryDate}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                        {alert.daysRemaining < 0 
                          ? `Critical breach: ${alert.type} expired. System is retrying email notifications.`
                          : `Warning: ${alert.type} expires in ${alert.daysRemaining} days. Submit renewal form checklist.`}
                      </p>
                      <span className="inline-block text-[9px] font-semibold px-2 py-0.5 mt-2 bg-white border border-gray-200 rounded-md text-gray-500">
                        Alert Channel: Email & Dashboard log
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-gray-400 font-semibold italic border border-dashed border-gray-200 rounded-xl">
                  No active warnings. All compliance standings are in good order.
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} whileHover={hoverLift} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Quick Portal Access
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                UdyamAI maps your business data directly to official registration portals for faster submissions.
              </p>
              
              <ul className="text-xs space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">1</span>
                  <span>Select any license card and click <b>Renew</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">2</span>
                  <span>Get redirected automatically to the government portal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">3</span>
                  <span>Your <b>business profile data</b> is ready for quick copy & paste into forms.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <Link
                to="/udyan/profile"
                className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                Manage Business Profile &rarr;
              </Link>
            </div>
          </motion.div>
        </motion.section>

      </motion.main>

      {/* DRAWER / SLIDE OVER MODAL FOR CHECKLISTS */}
      {isChecklistOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            onClick={() => setIsChecklistOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
          />

          <div className="relative w-full max-w-lg bg-white border-l border-gray-200 text-black h-full flex flex-col justify-between shadow-2xl p-6 relative z-10">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-sans uppercase font-bold">
                    Renewal Assistant
                  </span>
                  <h3 className="text-xl font-bold font-norms text-black mt-1.5">
                    {getChecklist(selectedLicense.type).type}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">License: {selectedLicense.license_number}</p>
                </div>
                <button 
                  onClick={() => setIsChecklistOpen(false)}
                  className="text-gray-400 hover:text-black bg-gray-100 p-2 rounded-xl border border-gray-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-start text-red-700">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800 font-norms">Regulatory Expiry Risks</h4>
                    <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                      {getChecklist(selectedLicense.type).risks}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 font-sans">
                    Required Supporting Documents
                  </h4>
                  <div className="space-y-2">
                    {getChecklist(selectedLicense.type).documents.map((doc, i) => (
                      <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                        <input
                          type="checkbox"
                          id={`doc-${i}`}
                          className="rounded border-gray-300 text-black focus:ring-black bg-white w-4 h-4 mt-0.5"
                        />
                        <label htmlFor={`doc-${i}`} className="text-xs font-semibold text-gray-700 leading-normal select-none cursor-pointer">
                          {doc}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 font-sans">
                    Step-By-Step Renewal Flowchart
                  </h4>
                  <div className="space-y-4 pl-4 border-l border-gray-200">
                    {getChecklist(selectedLicense.type).steps.map((step, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-6.5 top-0.5 w-5 h-5 bg-gray-100 border border-gray-200 text-[10px] text-gray-650 rounded-full flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <p className="text-xs text-gray-700 leading-relaxed pl-1.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => downloadChecklistPDF(selectedLicense)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-sm font-semibold py-3 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              <button
                onClick={() => {
                  setIsChecklistOpen(false);
                  handleRenewRedirect(selectedLicense);
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white text-sm font-bold py-3 rounded-xl shadow transition-all"
              >
                Renew License
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL REDIRECTION MODAL */}
      {isRedirectModalOpen && redirectingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" />

          <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 text-center text-black">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold font-norms text-black">Redirecting to Government Portal</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              You are being securely redirected to the official <strong className="text-black">{redirectingLicense.type}</strong> renewal page.
            </p>

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl my-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: '#4338CA' }}>
                Business Profile Data:
              </span>
              <div className="space-y-1 text-[11px] text-gray-600 font-mono">
                <div>Firm Name &rarr; <span className="text-black font-semibold">{profile?.business_name}</span></div>
                <div>License No &rarr; <span className="text-black font-semibold">{redirectingLicense.license_number}</span></div>
                <div>Authorized Signatory &rarr; <span className="text-black font-semibold">{profile?.owner_name}</span></div>
                <div>Mobile Number &rarr; <span className="text-black font-semibold">{profile?.mobile}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <span>Opening in</span>
              <span className="text-blue-600 font-bold text-sm w-4 inline-block">{countdown}</span>
              <span>seconds...</span>
            </div>

            <div className="mt-6 flex gap-2">
              <button 
                onClick={() => setIsRedirectModalOpen(false)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <a 
                href={redirectingLicense.portal_url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsRedirectModalOpen(false)}
                className="flex-1 bg-black hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center"
              >
                Open Now
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UdyanDashboard;
