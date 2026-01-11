// ============================================================================
// FUND PERFORMANCE CHART COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Displays fund performance over time (simplified without recharts)
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { MODULE_COLOR } from '../../constants';

interface PerformanceDataPoint {
  period: string;
  nav: number;
  irr: number;
  moic: number;
}

interface FundPerformanceChartProps {
  data: PerformanceDataPoint[];
  fundName: string;
}

export const FundPerformanceChart: React.FC<FundPerformanceChartProps> = ({
  data,
  fundName,
}) => {
  const [metric, setMetric] = useState<'nav' | 'irr' | 'moic'>('nav');

  const formatValue = (value: number) => {
    if (metric === 'nav') {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (metric === 'irr') {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `${value.toFixed(2)}x`;
  };

  const maxValue = Math.max(...data.map(d => d[metric]));

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold">Fund Performance</CardTitle>
            <p className="text-sm text-muted-foreground">{fundName}</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={metric === 'nav' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('nav')}
              style={metric === 'nav' ? { backgroundColor: MODULE_COLOR } : {}}
            >
              NAV
            </Button>
            <Button
              variant={metric === 'irr' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('irr')}
              style={metric === 'irr' ? { backgroundColor: MODULE_COLOR } : {}}
            >
              IRR
            </Button>
            <Button
              variant={metric === 'moic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('moic')}
              style={metric === 'moic' ? { backgroundColor: MODULE_COLOR } : {}}
            >
              MOIC
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart representation */}
        <div className="space-y-3 mt-4">
          {data.map((point) => {
            const percentage = maxValue > 0 ? (point[metric] / maxValue) * 100 : 0;
            return (
              <div key={point.period} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20">{point.period}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all flex items-center justify-end pr-2"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: MODULE_COLOR,
                    }}
                  >
                    <span className="text-xs text-white font-medium">
                      {formatValue(point[metric])}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {data.length === 0 && (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No performance data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FundPerformanceChart;
