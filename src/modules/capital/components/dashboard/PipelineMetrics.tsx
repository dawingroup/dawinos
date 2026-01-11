// ============================================================================
// PIPELINE METRICS COMPONENT
// DawinOS v2.0 - Capital Hub Module
// Shows deal pipeline funnel with stage counts and values
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/core/components/ui/tooltip';
import { DEAL_STAGES } from '../../constants';
import { formatCurrency } from '../shared/CurrencyDisplay';

interface StageMetric {
  stage: string;
  count: number;
  value: number;
}

interface PipelineMetricsProps {
  metrics: StageMetric[];
  totalValue: number;
}

export const PipelineMetrics: React.FC<PipelineMetricsProps> = ({
  metrics,
  totalValue,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Deal Pipeline</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total Pipeline: {formatCurrency(totalValue, 'USD', true)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {DEAL_STAGES.filter(s => s.id !== 'closed' && s.id !== 'lost').map(stage => {
            const metric = metrics.find(m => m.stage === stage.id);
            const count = metric?.count || 0;
            const value = metric?.value || 0;
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

            return (
              <div key={stage.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{stage.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} deals · {formatCurrency(value, 'USD', true)}
                  </span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: stage.color,
                          }}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{percentage.toFixed(1)}% of pipeline</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PipelineMetrics;
