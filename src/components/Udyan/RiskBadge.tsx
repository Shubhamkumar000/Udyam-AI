import React from 'react';
import { getRiskTheme, riskLevelToUrgency } from '../../utils/riskEngine';
import type { RiskLevel } from '../../types/riskEngine';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const sizeClasses = {
  sm: 'text-[9px] px-2 py-0.5',
  md: 'text-[10px] px-2.5 py-1',
  lg: 'text-xs px-3 py-1.5',
};

const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showDot = true }) => {
  const theme = getRiskTheme(level);
  const label = riskLevelToUrgency(level as RiskLevel);

  return (
    <span className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full border ${theme.bg} ${theme.text} ${theme.border} ${sizeClasses[size]}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />}
      {label}
    </span>
  );
};

export default RiskBadge;
