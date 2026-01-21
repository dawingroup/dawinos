/**
 * ColoredStatsCard Component
 * Stats card with colored left border following Finishes Design Manager pattern
 */

import { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type StatsCardColor = 'primary' | 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'indigo';

interface ColoredStatsCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: StatsCardColor;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  onClick?: () => void;
  className?: string;
}

const colorClasses: Record<StatsCardColor, { border: string; icon: string; trend: string }> = {
  primary: { border: 'border-l-primary', icon: 'text-primary', trend: 'text-primary' },
  blue: { border: 'border-l-blue-500', icon: 'text-blue-500', trend: 'text-blue-600' },
  amber: { border: 'border-l-amber-500', icon: 'text-amber-500', trend: 'text-amber-600' },
  green: { border: 'border-l-green-500', icon: 'text-green-500', trend: 'text-green-600' },
  red: { border: 'border-l-red-500', icon: 'text-red-500', trend: 'text-red-600' },
  purple: { border: 'border-l-purple-500', icon: 'text-purple-500', trend: 'text-purple-600' },
  indigo: { border: 'border-l-indigo-500', icon: 'text-indigo-500', trend: 'text-indigo-600' },
};

export function ColoredStatsCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  className,
}: ColoredStatsCardProps) {
  const colors = colorClasses[color];

  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", colors.icon)} />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500">{subtitle}</p>
      )}
    </>
  );

  const baseClasses = cn(
    "bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4",
    colors.border,
    onClick && "cursor-pointer hover:shadow-md transition-shadow",
    className
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseClasses, "text-left w-full")}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      {content}
    </div>
  );
}
