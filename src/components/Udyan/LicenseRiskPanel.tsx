import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Brain, Clock, FileText, Gavel, IndianRupee, ShieldAlert } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { getRiskTheme } from '../../utils/riskEngine';
import type { SingleLicenseRiskAssessment } from '../../types/riskEngine';

interface LicenseRiskPanelProps {
  assessment: SingleLicenseRiskAssessment | null;
  loading?: boolean;
  licenseType: string;
}

const LicenseRiskPanel: React.FC<LicenseRiskPanelProps> = ({ assessment, loading }) => {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Analyzing compliance risk…
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const theme = getRiskTheme(assessment.riskLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-2xl p-6 shadow-sm ${theme.bg} ${theme.border}`}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-gray-900 font-norms flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-600" />
          AI Compliance Risk Analysis
        </h2>
        <RiskBadge level={assessment.riskLevel} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/80 rounded-xl p-3 border border-white">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">License Status</p>
          <p className="text-sm font-black text-gray-900 mt-1">{assessment.status.replace(/_/g, ' ')}</p>
        </div>
        <div className="bg-white/80 rounded-xl p-3 border border-white">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Urgency</p>
          <p className={`text-sm font-black mt-1 ${theme.text}`}>{assessment.urgency}</p>
        </div>

        {assessment.daysUntilExpiry !== null && assessment.daysSinceExpiry !== null && (
          <>
            <div className="bg-white/80 rounded-xl p-3 border border-white">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="w-3 h-3" /> Days Until Expiry
              </p>
              <p className="text-sm font-black text-gray-900 mt-1">
                {assessment.daysUntilExpiry > 0 ? assessment.daysUntilExpiry : '—'}
              </p>
            </div>
            <div className="bg-white/80 rounded-xl p-3 border border-white">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Days Since Expiry
              </p>
              <p className="text-sm font-black text-gray-900 mt-1">
                {assessment.daysSinceExpiry > 0 ? assessment.daysSinceExpiry : '—'}
              </p>
            </div>
          </>
        )}

        {assessment.status === 'MISSING' && assessment.potentialImpact && (
          <div className="col-span-2 bg-white/80 rounded-xl p-3 border border-white">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Potential Impact</p>
            <p className="text-sm font-black text-red-700 mt-1">{assessment.potentialImpact}</p>
          </div>
        )}
      </div>

      <div className="bg-white/90 rounded-xl p-4 border border-white mb-4">
        <div className="flex items-start gap-2 mb-3">
          <IndianRupee className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Estimated Penalty Exposure</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{assessment.estimatedPenalty.formatted}</p>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              Confidence: {assessment.estimatedPenalty.confidence}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 rounded-xl p-4 border border-white mb-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-2">
          <FileText className="w-3 h-3" /> Recommended Action
        </p>
        <p className="text-xs font-bold text-indigo-700 leading-relaxed">{assessment.recommendedAction}</p>
      </div>

      <div className="bg-white/90 rounded-xl p-4 border border-white">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-3">
          <Gavel className="w-3 h-3" /> Legal Consequences
        </p>
        <ul className="space-y-2">
          {assessment.legalConsequences.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default LicenseRiskPanel;
