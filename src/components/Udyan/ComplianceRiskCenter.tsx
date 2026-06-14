import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Brain,
  ChevronRight,
  IndianRupee,
  ShieldAlert,
  Target,
  TrendingDown,
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
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', stiffness: 240, damping: 22 }}
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
  const topIssues = report.auditReport.issuesFound.slice(0, 5);

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* AI Audit Report */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
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
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.06 }}
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

          {/* Recommended Actions */}
          {report.auditReport.recommendedActions.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">Recommended Actions</h4>
              <ul className="space-y-2">
                {report.auditReport.recommendedActions.map((action, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.05 }}
                    className="flex items-start gap-2 text-xs text-gray-700 font-semibold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                    {action}
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
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
