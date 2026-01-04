/**
 * ProgressBar Component
 * Display progress with optional label and color schemes
 */

import { Progress } from '@/core/components/ui/progress';
import { cn } from '@/shared/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorClasses = {
  default: '[&>div]:bg-primary',
  success: '[&>div]:bg-green-500',
  warning: '[&>div]:bg-yellow-500',
  danger: '[&>div]:bg-red-500',
};

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  colorScheme = 'default',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn('space-y-1', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          {showLabel && <span className="font-medium">{percentage}%</span>}
        </div>
      )}
      <Progress
        value={percentage}
        className={cn(sizeClasses[size], colorClasses[colorScheme])}
      />
    </div>
  );
}
