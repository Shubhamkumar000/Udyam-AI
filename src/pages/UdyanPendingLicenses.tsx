import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ScanLine,
  ShieldAlert,
} from 'lucide-react';
import Sidebar from '../components/Udyan/Sidebar';
import {
  getComplianceProfile,
  getComplianceRiskReport,
  getLicenses,
  getOnboarding,
} from '../utils/udyanStorage';
import type { ComplianceProfile, License } from '../utils/udyanStorage';
import type { ComplianceRiskReport, MissingLicenseRisk } from '../types/riskEngine';
import { getLicenseAuthority, getLicensePortalUrl } from '../utils/licensePortals';
import { fadeInUp, hoverLift, staggerContainer } from '../utils/animations';

const UdyanPendingLicenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [compliance, setCompliance] = useState<ComplianceProfile | null>(null);
  const [riskReport, setRiskReport] = useState<ComplianceRiskReport | null>(null);
  const [businessSector, setBusinessSector] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [licData, compData, riskData, onboarding] = await Promise.all([
        getLicenses(),
        getComplianceProfile(),
        getComplianceRiskReport(),
        getOnboarding(),
      ]);
      setLicenses(licData);
      setCompliance(compData);
      setRiskReport(riskData);
      setBusinessSector(onboarding.business_sector || '');
    } catch (err) {
      console.error('Failed to load pending licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingItems = useMemo(() => {
    const registeredTypes = new Set<string>(licenses.map((l) => l.type));
    const required = compliance?.required_licenses || [];
    const missingSet = new Set([
      ...(compliance?.missing_licenses || []),
      ...required.filter((req) => !registeredTypes.has(req)),
    ]);

    const riskByType = new Map<string, MissingLicenseRisk>(
      (riskReport?.missingLicenses || []).map((m) => [m.licenseType, m])
    );

    return [...missingSet].map((type) => {
      const risk = riskByType.get(type);
      const declaredOnly =
        (compliance?.existing_licenses || []).includes(type) && !registeredTypes.has(type);

      return {
        type,
        risk,
        declaredOnly,
        authority: getLicenseAuthority(type),
        portalUrl: getLicensePortalUrl(type),
        penalty: risk?.penaltyEstimate.formatted || 'Varies by violation',
        impact: risk?.potentialImpact || 'Non-compliance may lead to penalties or closure orders.',
        action: risk?.recommendedAction || `Apply for ${type} on the official government portal.`,
        riskLevel: risk?.risk === 'HIGH' ? 'HIGH' : 'MEDIUM',
      };
    });
  }, [licenses, compliance, riskReport]);

  const filteredPending = pendingItems.filter((item) =>
    item.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8F9FB]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Link
            to="/udyan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-norms text-black">Pending Licenses</h1>
              <p className="text-sm text-gray-500 mt-1">
                Required for <span className="font-bold text-gray-800">{businessSector || 'your sector'}</span>
                {' · '}
                {pendingItems.length} license{pendingItems.length !== 1 ? 's' : ''} awaiting registration or upload
              </p>
            </div>
            <Link
              to="/udyan/scanner"
              className="inline-flex items-center gap-2 bg-black text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
            >
              <ScanLine className="w-4 h-4" />
              Scan & Upload
            </Link>
          </div>

          {pendingItems.length === 0 ? (
            <div className="bg-white border border-emerald-200 rounded-2xl p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-gray-900 font-norms">All required licenses are covered</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
                Every license required for your business sector has a registered document on file.
              </p>
              <Link
                to="/udyan"
                className="inline-block mt-6 text-sm font-bold text-indigo-600 hover:underline"
              >
                Return to dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search pending licenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-300 text-black text-sm px-4 py-2.5 rounded-xl focus:outline-none focus:border-black w-full md:w-80"
                />
              </div>

              <motion.section
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {filteredPending.map((item) => (
                  <motion.div
                    key={item.type}
                    variants={fadeInUp}
                    whileHover={hoverLift}
                    className="bg-white border border-amber-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-sm"
                  >
                    <div className="mb-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="bg-amber-50 border border-amber-200 text-amber-900 font-norms font-bold text-xs px-3 py-1.5 rounded-lg">
                          {item.type}
                        </span>
                        <span className="flex items-center gap-1.5 border border-amber-200 bg-amber-50/50 text-amber-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Pending
                        </span>
                      </div>

                      {item.declaredOnly && (
                        <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1.5 mb-3">
                          Declared during onboarding — document not yet uploaded
                        </p>
                      )}

                      <div className="space-y-2.5 text-black">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Issuing Authority
                          </label>
                          <span className="text-xs text-gray-700 font-semibold leading-normal">{item.authority}</span>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Est. Penalty Exposure
                          </label>
                          <span className="text-sm font-bold text-gray-900">{item.penalty}</span>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Regulatory Impact
                          </label>
                          <span className="text-xs text-gray-600 font-semibold leading-snug line-clamp-2">
                            {item.impact}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/udyan/license/${encodeURIComponent(item.type)}`}
                        className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-indigo-600 font-semibold px-3 py-2 rounded-xl transition-all"
                      >
                        View Details
                      </Link>
                      <Link
                        to="/udyan/scanner"
                        className="text-xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-semibold px-3 py-2 rounded-xl transition-all"
                      >
                        Upload
                      </Link>
                      <a
                        href={item.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 bg-black hover:bg-gray-800 text-white shadow-sm transition-all ml-auto"
                      >
                        Apply
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.section>

              {filteredPending.length === 0 && searchTerm && (
                <p className="text-center text-sm text-gray-500 py-12">No pending licenses match your search.</p>
              )}

              <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-gray-800 font-norms flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Recommended Next Steps
                </h2>
                <ul className="space-y-2">
                  {(compliance?.recommended_actions || riskReport?.auditReport.recommendedActions || [])
                    .slice(0, 6)
                    .map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default UdyanPendingLicenses;
