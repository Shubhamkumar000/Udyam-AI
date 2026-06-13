import React, { useEffect, useState, useRef } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  FileText, 
  Download, 
  ExternalLink,
  MapPin,
  Clock,
  RefreshCw,
  Bell,
  Sparkles,
  Search,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getLicenses, 
  getProfile, 
  calculateHealthScore, 
  getChecklist,
  deleteLicense
} from '../utils/udyanStorage';
import type { License, BusinessProfile } from '../utils/udyanStorage';
import Sidebar from '../components/Udyan/Sidebar';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet default icon fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const UdyanDashboard: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Expiring Soon' | 'Expired'>('All');
  
  // States for Modals
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isRedirectModalOpen, setIsRedirectModalOpen] = useState(false);
  const [redirectingLicense, setRedirectingLicense] = useState<License | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Map reference
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const licData = await getLicenses();
    const profData = await getProfile();
    setLicenses(licData);
    setProfile(profData);
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainer.current && !mapInstance.current) {
      // Coordinate of MG Road, Bengaluru: 12.974, 77.608
      const map = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([12.974, 77.608], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      L.marker([12.974, 77.608])
        .addTo(map)
        .bindPopup('<b>Spice Route Restaurant</b><br>MG Road, Bengaluru')
        .openPopup();

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [licenses]); // Re-draw map if licenses update

  const healthScore = calculateHealthScore(licenses);

  // Filtered licenses
  const filteredLicenses = licenses.filter(lic => {
    const matchesSearch = lic.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lic.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lic.authority.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = licenses.filter(l => l.status === 'Active').length;
  const expiringCount = licenses.filter(l => l.status === 'Expiring Soon').length;
  const expiredCount = licenses.filter(l => l.status === 'Expired').length;

  const handleOpenChecklist = (lic: License) => {
    setSelectedLicense(lic);
    setIsChecklistOpen(true);
  };

  const handleRenewRedirect = (lic: License) => {
    setRedirectingLicense(lic);
    setIsRedirectModalOpen(true);
    setCountdown(3);

    // Dynamic timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Trigger redirect
          window.open(lic.portal_url, '_blank');
          setIsRedirectModalOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this license from Udyan AI?")) {
      await deleteLicense(id);
      loadData();
    }
  };

  // Generate downloadable renewal checklist PDF
  const downloadChecklistPDF = (lic: License) => {
    const checklist = getChecklist(lic.type);
    const docText = `
==================================================
UDYAN AI - RENEWAL COMPLIANCE CHECKLIST
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
Use the "Udyan Autofill" Chrome Extension to automatically map 
and populate forms using the active business profile.
--------------------------------------------------
Generated by Udyan AI on ${new Date().toLocaleString()}
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

  // Automated notification list (Simulated smart alerts)
  const simulatedAlerts = [
    {
      days: 60,
      sent: true,
      date: "2026-04-14",
      title: "60-Day Expiry Notice: Trade License",
      msg: "System triggered email for Trade License renewal checklist generation.",
      channel: "Resend Email API"
    },
    {
      days: 30,
      sent: true,
      date: "2026-05-14",
      title: "30-Day Critical Warning: Trade License",
      msg: "Alert sent to rahul@spiceroute.in with direct portal login redirection.",
      channel: "Resend Email API"
    },
    {
      days: 7,
      sent: true,
      date: "2026-06-06",
      title: "7-Day Overdue Warning: Trade License",
      msg: "High priority notification: BBMP Portal fees verification checklist attached.",
      channel: "Resend Email & SMS"
    },
    {
      days: 1,
      sent: false,
      date: "2026-06-02",
      title: "1-Day Critical Breach: Fire NOC Overdue",
      msg: "CRITICAL warning: Fire NOC expired on June 3, 2026. Surcharge penalty is active.",
      channel: "Resend API / Retrying"
    }
  ];

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen text-black font-sans">
      {/* Sidebar Layout */}
      <Sidebar />

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto p-8">
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-norms tracking-tight text-black flex items-center gap-2">
              Compliance Dashboard 
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-sans uppercase font-bold">
                Demo Mode
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Active Business: <span className="font-semibold text-black">{profile?.business_name || "Spice Route Restaurant"}</span> (GSTIN: {profile?.gstin})
            </p>
          </div>
          
          <button 
            onClick={loadData}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-750 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Health Score Gauge */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-gray-800 font-norms">Compliance Health Score</h2>
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 max-w-[180px] leading-relaxed">
                Aggregated safety rating. Points deducted for expired and expiring licenses.
              </p>
            </div>

            <div className="flex items-center justify-center py-6 relative">
              {/* SVG Ring Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    strokeWidth="10"
                    stroke="#E2E8F0"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    strokeWidth="10"
                    stroke={healthScore >= 80 ? '#10B981' : healthScore >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - healthScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-black font-norms">{healthScore}</span>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Rating</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-gray-100 pt-4">
              <span className={`font-semibold ${healthScore >= 80 ? 'text-emerald-600' : healthScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {healthScore >= 80 ? 'Excellent Standing' : healthScore >= 50 ? 'Moderate Alert' : 'Critical Action Required'}
              </span>
              <span className="text-gray-400">Goal: 100/100</span>
            </div>
          </div>

          {/* Quick Metrics & Counter Cards */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-gray-800 font-norms">License Statistics</h2>
              <Clock className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-gray-500">Total Licenses</span>
                <span className="text-2xl font-bold text-black mt-2 font-norms">{licenses.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between" style={{ backgroundColor: 'rgba(16,185,129,0.08)' }}>
                <span className="text-xs font-semibold text-emerald-700">Active</span>
                <span className="text-2xl font-bold text-emerald-700 mt-2 font-norms">{activeCount}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col justify-between" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
                <span className="text-xs font-semibold text-amber-750" style={{ color: '#B45309' }}>Expiring Soon</span>
                <span className="text-2xl font-bold mt-2 font-norms" style={{ color: '#B45309' }}>{expiringCount}</span>
              </div>
              <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex flex-col justify-between" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <span className="text-xs font-semibold text-red-700">Expired</span>
                <span className="text-2xl font-bold text-red-700 mt-2 font-norms">{expiredCount}</span>
              </div>
            </div>
          </div>

          {/* Location Compliance Map */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Physical Coordinates
              </h2>
              <span className="text-[10px] text-gray-500 font-mono">12.974° N, 77.608° E</span>
            </div>
            
            {/* Map wrapper */}
            <div className="flex-1 w-full min-h-[160px] bg-gray-100 rounded-xl relative overflow-hidden border border-gray-200">
              <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-xl" />
            </div>

            <div className="text-[11px] text-gray-500 mt-3 leading-relaxed">
              Mapped address: <span className="text-black font-semibold">{profile?.address}, {profile?.city}</span>. Region local rules loaded for BBMP Karnataka.
            </div>
          </div>

        </div>

        {/* Search, Filter, and License List */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold font-norms text-black">Registered Licenses</h2>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 md:flex-initial">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search code, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-300 text-black text-sm pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-black w-full md:w-60"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
                {(['All', 'Active', 'Expiring Soon', 'Expired'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
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

          {/* Table / Card List */}
          {filteredLicenses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-semibold">No licenses found matching your parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLicenses.map((lic) => {
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
                  <div 
                    key={lic.id}
                    className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 flex flex-col justify-between group transition-all duration-200 shadow-sm"
                  >
                    <div className="mb-4">
                      {/* Top Row: Type and Status */}
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="bg-gray-100 border border-gray-200 text-black font-norms font-bold text-xs px-3 py-1.5 rounded-lg">
                          {lic.type}
                        </span>
                        <span className={`flex items-center gap-1.5 border text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeDot}`} />
                          {lic.status}
                        </span>
                      </div>

                      {/* License Metadata */}
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

                    {/* OCR Score & Actions */}
                    <div className="border-t border-gray-100 pt-4 mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <span>AI Score:</span>
                        <span className={`font-mono font-bold ${lic.confidence_score >= 0.9 ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {(lic.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
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
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' 
                              : 'bg-black hover:bg-gray-800 text-white shadow-sm'
                          }`}
                        >
                          Renew
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button 
                          onClick={() => handleDelete(lic.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 p-1 transition-all rounded"
                          title="Delete license"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Smart Reminders Alert Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reminder Alert Feed */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Resend API Automated Notifications
              </h2>
              <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md font-mono">
                Log (GMT+5:30)
              </span>
            </div>

            <div className="space-y-4">
              {simulatedAlerts.map((alert, idx) => (
                <div key={idx} className="flex gap-4 p-3.5 bg-gray-50 border border-gray-100 rounded-xl items-start">
                  <div className={`p-2 rounded-xl mt-0.5 ${
                    alert.sent ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600 animate-pulse'
                  }`} style={{ backgroundColor: alert.sent ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}>
                    {alert.sent ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-xs font-bold text-gray-850 font-norms">{alert.title}</h3>
                      <span className="text-[9px] text-gray-400 font-mono whitespace-nowrap">{alert.date}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{alert.msg}</p>
                    <span className="inline-block text-[9px] font-semibold px-2 py-0.5 mt-2 bg-white border border-gray-200 rounded-md text-gray-500">
                      Channel: {alert.channel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guide to autofill */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 font-norms flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Autofill Integration
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Udyan AI redirects you to official registration forms and communicates credentials seamlessly.
              </p>
              
              <ul className="text-xs space-y-2.5 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">1</span>
                  <span>Select any overdue license card and click <b>Renew</b>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">2</span>
                  <span>Get redirected automatically to the verified government portal link.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-black shrink-0 mt-0.5">3</span>
                  <span>Our <b>Autofill extension</b> maps fields like Firm Name or Mobile and types them instantly.</span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <Link
                to="/udyan/extension"
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1.5"
              >
                Inspect Chrome Extension Source Code &rarr;
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* DRAWER / SLIDE OVER MODAL FOR CHECKLISTS */}
      {isChecklistOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay */}
          <div 
            onClick={() => setIsChecklistOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-lg bg-white border-l border-gray-200 text-black h-full flex flex-col justify-between shadow-2xl p-6 relative z-10">
            {/* Header */}
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

              {/* Scrollable checklists content */}
              <div className="space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {/* Risk alert box */}
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-start text-red-700">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-red-800 font-norms">Regulatory Expiry Risks</h4>
                    <p className="text-[11px] text-red-700 mt-1 leading-relaxed">
                      {getChecklist(selectedLicense.type).risks}
                    </p>
                  </div>
                </div>

                {/* Documents checklist */}
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

                {/* Steps flowchart */}
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

            {/* Sticky Actions */}
            <div className="border-t border-gray-100 pt-4 mt-4 flex gap-3">
              <button
                onClick={() => downloadChecklistPDF(selectedLicense)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-sm font-semibold py-3 rounded-xl transition-all"
              >
                <Download className="w-4 h-4" />
                Download Checklist PDF
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

      {/* PORTAL REDIRECTION TIMER MODAL */}
      {isRedirectModalOpen && redirectingLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" />

          {/* Modal Card */}
          <div className="relative bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative z-10 text-center text-black">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold font-norms text-black">Redirecting to Government Portal</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              You are being securely redirected to the official <strong className="text-black">{redirectingLicense.type}</strong> renewal page.
            </p>

            {/* Form Fields mapping block */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl my-5 text-left">
              <span className="text-[10px] text-indigo-750 font-bold uppercase tracking-wider block mb-2" style={{ color: '#4338CA' }}>
                Udyan Autofill Extension Active mapping:
              </span>
              <div className="space-y-1 text-[11px] text-gray-600 font-mono">
                <div>Firm/Business Name &rarr; <span className="text-black font-semibold">{profile?.business_name}</span></div>
                <div>FSSAI/GSTIN Code &rarr; <span className="text-black font-semibold">{redirectingLicense.license_number}</span></div>
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
