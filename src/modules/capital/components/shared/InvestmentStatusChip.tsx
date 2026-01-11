// ============================================================================
// INVESTMENT STATUS CHIP COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Displays investment status with appropriate color
// ============================================================================

import React from 'react';
import { Badge } from '@/core/components/ui/badge';
import { INVESTMENT_STATUSES } from '../../constants';

interface InvestmentStatusChipProps {
  status: string;
  className?: string;
}

export const InvestmentStatusChip: React.FC<InvestmentStatusChipProps> = ({ 
  status, 
  className,
}) => {
  const statusConfig = INVESTMENT_STATUSES.find(s => s.id === status);
  const label = statusConfig?.label || status;
  const color = statusConfig?.color || '#9E9E9E';

  return (
    <Badge
      className={className}
      style={{
        backgroundColor: color,
        color: '#fff',
      }}
    >
      {label}
    </Badge>
  );
};

export default InvestmentStatusChip;
