/**
 * Stage Badge Component
 * Visual badge showing current design stage
 */

import { cn } from '@/shared/lib/utils';
import type { DesignStage } from '../../types';
import { STAGE_LABELS, STAGE_SHORT_LABELS, STAGE_ICONS } from '../../utils/formatting';

export interface StageBadgeProps {
  stage: DesignStage;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
  className?: string;
}

const stageColors: Record<DesignStage, string> = {
  'concept': 'bg-purple-100 text-purple-700 border-purple-200',
  'preliminary': 'bg-blue-100 text-blue-700 border-blue-200',
  'technical': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'pre-production': 'bg-amber-100 text-amber-700 border-amber-200',
  'production-ready': 'bg-green-100 text-green-700 border-green-200',
};

const sizeClasses = {
  xs: 'text-[10px] px-1.5 py-0.5',
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function StageBadge({ 
  stage, 
  size = 'md',
  showIcon = true,
  showLabel = true,
  className 
}: StageBadgeProps) {
  const label = size === 'xs' || size === 'sm' 
    ? STAGE_SHORT_LABELS[stage] 
    : STAGE_LABELS[stage];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        stageColors[stage],
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <span>{STAGE_ICONS[stage]}</span>}
      {showLabel && <span>{label}</span>}
    </span>
  );
}

export default StageBadge;
