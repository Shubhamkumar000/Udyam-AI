import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  Clock,
  IndianRupee,
  MessageCircle,
  ScanLine,
  ShieldAlert,
  Target,
  TrendingDown,
  User,
} from 'lucide-react';
import RiskBadge from './RiskBadge';
import LicenseRiskCard from './LicenseRiskCard';
import { getRiskTheme } from '../../utils/riskEngine';
import type { ComplianceRiskReport } from '../../types/riskEngine';

interface ComplianceRiskCenterProps {
  report: ComplianceRiskReport | null;
  loading?: boolean;
}

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
  delay?: number;
}> = ({ label, value, sub, icon, accent, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm ${accent}`}
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <p className="text-2xl font-black font-norms text-gray-900">{value}</p>
    {sub && <p className="text-[10px] text-gray-400 font-semibold mt-1">{sub}</p>}
  </motion.div>
);

const ComplianceRiskCenter: React.FC<ComplianceRiskCenterProps> = ({ report, loading }) => {
  if (loading) {
    return (
      <section className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500 font-semibold">Running AI Compliance Risk Engine…</span>
        </div>
      </section>
    );
  }

  if (!report) return null;

  const riskTheme = getRiskTheme(report.overallRisk);
  const atRiskAssessments = report.licenseAssessments.filter((a) => a.riskLevel !== 'LOW');
  const topIssues = report.auditReport.issuesFound;
  const lowRiskCount = report.licenseAssessments.filter((a) => a.riskLevel === 'LOW').length;
  const missingTypes = new Set(report.missingLicenses.map((m) => m.licenseType));
  const coveredCount = report.requiredLicenses.filter((req) => !missingTypes.has(req)).length;
  const coveragePct = report.requiredLicenses.length
    ? Math.round((coveredCount / report.requiredLicenses.length) * 100)
    : 100;

  const penaltyRankings = [
    ...atRiskAssessments.map((a) => ({
      type: a.licenseType,
      penalty: a.estimatedPenalty.formatted,
      max: a.estimatedPenalty.max,
      missing: false,
    })),
    ...report.missingLicenses.map((m) => ({
      type: m.licenseType,
      penalty: m.penaltyEstimate.formatted,
      max: m.penaltyEstimate.max,
      missing: true,
    })),
  ]
    .sort((a, b) => b.max - a.max)
    .slice(0, 6);

  const expiryBands = [
    { key: 'active', label: 'Active', count: report.expiryRiskSummary.active, color: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100 text-emerald-800' },
    { key: 'medium', label: 'Expiring Soon', count: report.expiryRiskSummary.medium, color: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100 text-amber-800' },
    { key: 'high', label: 'High Risk', count: report.expiryRiskSummary.high, color: 'bg-orange-500', bg: 'bg-orange-50 border-orange-100 text-orange-800' },
    { key: 'critical', label: 'Critical', count: report.expiryRiskSummary.critical, color: 'bg-red-500', bg: 'bg-red-50 border-red-100 text-red-800' },
  ];

  return (
    <section className="mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold font-norms text-black flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Compliance Risk Center
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            AI-powered analysis · {report.businessSector || 'All sectors'} · {report.state}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold">
          <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg">
            Updated {new Date(report.generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Compliance Score"
          value={`${report.complianceScore}/100`}
          sub={report.complianceScore >= 80 ? 'Good standing' : report.complianceScore >= 60 ? 'Needs attention' : 'Action required'}
          icon={<Target className="w-4 h-4 text-indigo-500" />}
          accent=""
          delay={0}
        />
        <StatCard
          label="Overall Risk"
          value={report.overallRiskLabel}
          sub={`${report.expiryRiskSummary.critical} critical · ${report.expiryRiskSummary.high} high`}
          icon={<ShieldAlert className={`w-4 h-4 ${riskTheme.text}`} />}
          accent={`ring-1 ${riskTheme.border}`}
          delay={0.05}
        />
        <StatCard
          label="Penalty Exposure"
          value={report.penaltyExposure.formatted}
          sub="Estimated regulatory fines"
          icon={<IndianRupee className="w-4 h-4 text-orange-500" />}
          accent=""
          delay={0.1}
        />
        <StatCard
          label="Licenses At Risk"
          value={String(report.licensesAtRisk)}
          sub={`${report.missingLicenses.length} missing · ${atRiskAssessments.length} expiring/expired`}
          icon={<TrendingDown className="w-4 h-4 text-red-500" />}
          accent=""
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left column — audit + supporting panels */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                AI Audit Report
              </h3>
              <RiskBadge level={report.overallRisk} />
            </div>

            {topIssues.length === 0 ? (
              <div className="text-center py-10 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-sm font-bold text-emerald-700">All clear — no compliance issues detected.</p>
                <p className="text-xs text-emerald-600 mt-1">Your licenses are in good standing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topIssues.map((issue, idx) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.08 + idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-black text-gray-500 shrink-0">
                      {issue.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Link to={`/udyan/license/${issue.licenseType}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600">
                          {issue.description}
                        </Link>
                        <RiskBadge level={issue.riskLevel} size="sm" />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 font-semibold">
                        <span>Penalty: <strong className="text-gray-700">{issue.potentialPenalty}</strong></span>
                        <span>Impact: <strong className="text-gray-700">{issue.potentialConsequence}</strong></span>
                        <span>Urgency: <strong className="text-gray-700">{issue.urgency}</strong></span>
                      </div>
                    </div>
                    <Link to={`/udyan/license/${issue.licenseType}`} className="text-gray-300 hover:text-indigo-600 self-center shrink-0">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {report.auditReport.recommendedActions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Recommended Actions</h4>
                <ul className="space-y-1.5">
                  {report.auditReport.recommendedActions.map((action, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 + idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-2 text-xs text-gray-700 font-semibold leading-snug"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                      {action}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry status overview */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Expiry Status Overview
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {expiryBands.map((band) => (
                  <div key={band.key} className={`rounded-xl border p-3 ${band.bg}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{band.label}</p>
                    <p className="text-2xl font-black font-norms mt-1">{band.count}</p>
                  </div>
                ))}
              </div>
              {lowRiskCount > 0 && (
                <p className="text-[10px] font-semibold text-emerald-700 mt-3 pt-3 border-t border-gray-100">
                  + {lowRiskCount} license{lowRiskCount !== 1 ? 's' : ''} in good standing
                </p>
              )}
            </div>

            {/* Penalty exposure breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <IndianRupee className="w-3.5 h-3.5" />
                Penalty Exposure Breakdown
              </h4>
              {penaltyRankings.length === 0 ? (
                <p className="text-xs text-emerald-700 font-semibold py-4 text-center">No penalty exposure detected.</p>
              ) : (
                <ul className="space-y-2">
                  {penaltyRankings.map((item, idx) => (
                    <li
                      key={item.type}
                      className="flex items-center justify-between gap-2 text-xs p-2.5 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                          {idx + 1}
                        </span>
                        <Link to={`/udyan/license/${item.type}`} className="font-bold text-gray-800 hover:text-indigo-600 truncate">
                          {item.type}
                        </Link>
                        {item.missing && (
                          <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">Missing</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 shrink-0">{item.penalty}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Compliance coverage + quick actions */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2">Sector Compliance Coverage</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                  <span className="text-sm font-black text-gray-900 shrink-0">{coveragePct}%</span>
                </div>
                <p className="text-[10px] text-gray-500 font-semibold mt-1.5">
                  {coveredCount} of {report.requiredLicenses.length} required licenses covered · {report.state}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-4 border-t border-gray-100">
              <Link
                to="/udyan/scanner"
                className="flex items-center gap-2.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-xl px-4 py-3 transition-colors"
              >
                <ScanLine className="w-4 h-4 shrink-0" />
                Scan & Upload License
              </Link>
              <Link
                to="/udyan/chat"
                className="flex items-center gap-2.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-xl px-4 py-3 transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                Ask AI Copilot
              </Link>
              <Link
                to="/udyan/profile"
                className="flex items-center gap-2.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 rounded-xl px-4 py-3 transition-colors"
              >
                <User className="w-4 h-4 shrink-0" />
                Update Business Profile
              </Link>
            </div>
          </div>
        </div>

        {/* License risk cards sidebar */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800 px-1">License Risk Breakdown</h3>

          {atRiskAssessments.map((a, idx) => (
            <LicenseRiskCard key={a.licenseId} assessment={a} index={idx} />
          ))}

          {report.missingLicenses.map((m, idx) => (
            <LicenseRiskCard key={m.licenseType} missing={m} index={atRiskAssessments.length + idx} />
          ))}

          {atRiskAssessments.length === 0 && report.missingLicenses.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
              <p className="text-xs font-bold text-emerald-700">No licenses at risk</p>
            </div>
          )}

          {/* Low risk summary */}
          {report.licenseAssessments.filter((a) => a.riskLevel === 'LOW').length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-emerald-700">
                {report.licenseAssessments.filter((a) => a.riskLevel === 'LOW').length} license(s) in good standing
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ComplianceRiskCenter;
