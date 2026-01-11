// ============================================================================
// CAPITAL OVERVIEW CARD COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Metric card for the Capital Dashboard
// ============================================================================

import React from 'react';
import { Card, CardContent } from '@/core/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CapitalOverviewCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  trendLabel?: string;
  onClick?: () => void;
}

export const CapitalOverviewCard: React.FC<CapitalOverviewCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendLabel,
  onClick,
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-semibold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(trend)}%
                </span>
                {trendLabel && (
                  <span className="text-xs text-muted-foreground">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CapitalOverviewCard;
