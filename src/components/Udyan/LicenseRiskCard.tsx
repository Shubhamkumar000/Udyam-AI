import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, FileText, IndianRupee, ShieldAlert } from 'lucide-react';
import RiskBadge from './RiskBadge';
import type { LicenseRiskAssessment, MissingLicenseRisk } from '../../types/riskEngine';

interface LicenseRiskCardProps {
  assessment?: LicenseRiskAssessment;
  missing?: MissingLicenseRisk;
  index?: number;
}

const LicenseRiskCard: React.FC<LicenseRiskCardProps> = ({ assessment, missing, index = 0 }) => {
  const isMissing = !!missing;
  const licenseType = isMissing ? missing!.licenseType : assessment!.licenseType;
  const riskLevel = isMissing ? (missing!.risk === 'HIGH' ? 'HIGH' : 'MEDIUM') : assessment!.riskLevel;
  const penalty = isMissing ? missing!.penaltyEstimate.formatted : assessment!.estimatedPenalty.formatted;
  const action = isMissing ? missing!.recommendedAction : assessment!.recommendedAction;
  const consequence = isMissing ? missing!.potentialImpact : assessment!.legalConsequences[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMissing ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
            {isMissing ? <ShieldAlert className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <Link to={`/udyan/license/${licenseType}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 truncate block">
              {licenseType}
            </Link>
            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
              {isMissing ? 'Missing Required License' : assessment!.licenseNumber || 'Registered'}
            </p>
          </div>
        </div>
        <RiskBadge level={riskLevel} size="sm" />
      </div>

      {!isMissing && assessment && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Status</p>
            <p className="text-xs font-bold text-gray-800 mt-0.5">{assessment.status.replace(/_/g, ' ')}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
              {assessment.daysSinceExpiry > 0 ? 'Days Overdue' : 'Days Left'}
            </p>
            <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-400" />
              {assessment.daysSinceExpiry > 0 ? assessment.daysSinceExpiry : assessment.daysUntilExpiry}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        <div className="flex items-start gap-2 text-xs">
          <IndianRupee className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-gray-400 font-semibold">Est. Penalty: </span>
            <span className="font-bold text-gray-800">{penalty}</span>
            {!isMissing && assessment && (
              <span className="text-gray-400 ml-1">({assessment.estimatedPenalty.confidence}% conf.)</span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-gray-400 font-semibold">Impact: </span>
            <span className="font-semibold text-gray-700">{consequence}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-indigo-600 font-bold leading-relaxed">{action}</p>
      </div>
    </motion.div>
  );
};

export default LicenseRiskCard;
