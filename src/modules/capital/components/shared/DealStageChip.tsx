// ============================================================================
// DEAL STAGE CHIP COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Displays deal stage with appropriate color
// ============================================================================

import React from 'react';
import { Badge } from '@/core/components/ui/badge';
import { DEAL_STAGES } from '../../constants';

interface DealStageChipProps {
  stage: string;
  className?: string;
}

export const DealStageChip: React.FC<DealStageChipProps> = ({ stage, className }) => {
  const stageConfig = DEAL_STAGES.find(s => s.id === stage);
  const label = stageConfig?.label || stage;
  const color = stageConfig?.color || '#9E9E9E';

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

export default DealStageChip;
