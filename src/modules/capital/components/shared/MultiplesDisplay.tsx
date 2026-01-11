// ============================================================================
// MULTIPLES DISPLAY COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Displays investment multiples (MOIC, TVPI, DPI, RVPI)
// ============================================================================

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';

interface MultiplesDisplayProps {
  value: number;
  label?: string;
  showLabel?: boolean;
  benchmark?: number;
  showBenchmark?: boolean;
  className?: string;
}

export const formatMultiple = (value: number): string => {
  return `${value.toFixed(2)}x`;
};

export const getMultipleColor = (value: number): string => {
  if (value >= 2.0) return 'text-green-600';  // Green - excellent
  if (value >= 1.5) return 'text-green-500';  // Light green - good
  if (value >= 1.0) return 'text-amber-500';  // Orange - at cost
  return 'text-red-500';                       // Red - below cost
};

export const MultiplesDisplay: React.FC<MultiplesDisplayProps> = ({
  value,
  label = 'MOIC',
  showLabel = false,
  benchmark,
  showBenchmark = false,
  className,
}) => {
  const colorClass = getMultipleColor(value);
  const formattedValue = formatMultiple(value);

  const tooltipContent = showBenchmark && benchmark 
    ? `${label}: ${formattedValue} (Benchmark: ${formatMultiple(benchmark)})` 
    : `${label}: ${formattedValue}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 ${className || ''}`}>
            {showLabel && (
              <span className="text-xs text-muted-foreground">
                {label}:
              </span>
            )}
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

export default MultiplesDisplay;
