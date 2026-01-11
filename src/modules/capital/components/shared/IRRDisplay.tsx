// ============================================================================
// IRR DISPLAY COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Displays Internal Rate of Return with color coding
// ============================================================================

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IRRDisplayProps {
  value: number;
  showIcon?: boolean;
  showPercentSign?: boolean;
  benchmark?: number;
  target?: number;
  className?: string;
}

export const formatIRR = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const getIRRColor = (value: number, target?: number): string => {
  const threshold = target || 0.20;  // Default 20% target
  if (value >= threshold) return 'text-green-600';
  if (value >= threshold * 0.5) return 'text-amber-500';
  if (value >= 0) return 'text-yellow-500';
  return 'text-red-500';
};

export const IRRDisplay: React.FC<IRRDisplayProps> = ({
  value,
  showIcon = false,
  showPercentSign = true,
  benchmark,
  target,
  className,
}) => {
  const colorClass = getIRRColor(value, target);
  const formattedValue = showPercentSign 
    ? formatIRR(value)
    : `${(value * 100).toFixed(1)}`;

  const Icon = value >= 0 ? TrendingUp : TrendingDown;

  const tooltipContent = benchmark 
    ? `IRR: ${formatIRR(value)} (Benchmark: ${formatIRR(benchmark)})` 
    : `IRR: ${formatIRR(value)}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${className || ''}`}>
            {showIcon && <Icon className={`h-4 w-4 ${colorClass}`} />}
            <span className={`font-semibold ${colorClass}`}>
              {formattedValue}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IRRDisplay;
