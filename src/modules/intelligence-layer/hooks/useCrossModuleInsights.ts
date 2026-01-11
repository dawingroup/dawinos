// ============================================================================
// USE CROSS MODULE INSIGHTS HOOK
// DawinOS v2.0 - Intelligence Layer
// Manage insights spanning multiple modules
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { CrossModuleInsight } from '../types';

interface UseCrossModuleInsightsReturn {
  insights: CrossModuleInsight[];
  loading: boolean;
  error: string | null;
  updateInsightStatus: (
    insightId: string,
    status: 'new' | 'reviewed' | 'actioned' | 'dismissed'
  ) => Promise<void>;
}

export const useCrossModuleInsights = (): UseCrossModuleInsightsReturn => {
  const [insights, setInsights] = useState<CrossModuleInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual Firestore queries
    const mockInsights: CrossModuleInsight[] = [
      {
        id: '1',
        title: 'Revenue-Headcount Correlation',
        description: 'Strong positive correlation detected between engineering headcount growth and revenue increase over the past 6 months.',
        sourceModules: ['hr_central', 'capital_hub'],
        insightType: 'correlation',
        severity: 'medium',
        confidence: 0.87,
        dataPoints: [
          { module: 'hr_central', metric: 'Engineering Headcount', value: 38, trend: 'up', period: 'Q4 2025' },
          { module: 'capital_hub', metric: 'Quarterly Revenue', value: 2800000, trend: 'up', period: 'Q4 2025' },
        ],
        recommendations: [
          'Consider accelerating engineering hiring to support revenue targets',
          'Monitor productivity metrics to ensure scaling efficiency',
        ],
        status: 'new',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        id: '2',
        title: 'Market Opportunity in Fintech Segment',
        description: 'Competitor analysis combined with pipeline data suggests untapped opportunity in the fintech vertical.',
        sourceModules: ['market_intelligence', 'capital_hub'],
        insightType: 'opportunity',
        severity: 'high',
        confidence: 0.82,
        dataPoints: [
          { module: 'market_intelligence', metric: 'Competitor Coverage', value: 15, trend: 'stable', period: 'Current' },
          { module: 'capital_hub', metric: 'Fintech Pipeline', value: 450000, trend: 'up', period: 'Q1 2026' },
        ],
        recommendations: [
          'Develop fintech-specific marketing materials',
          'Assign dedicated sales resources to fintech vertical',
          'Consider partnership opportunities in the space',
        ],
        status: 'new',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      },
      {
        id: '3',
        title: 'Budget-Performance Optimization',
        description: 'Analysis shows departments with higher training budgets have 23% better performance scores.',
        sourceModules: ['financial', 'staff_performance'],
        insightType: 'optimization',
        severity: 'medium',
        confidence: 0.79,
        dataPoints: [
          { module: 'financial', metric: 'Training Budget', value: 125000, trend: 'stable', period: 'Annual' },
          { module: 'staff_performance', metric: 'Avg Performance Score', value: 4.2, trend: 'up', period: 'Q4 2025' },
        ],
        recommendations: [
          'Increase training budget allocation for underperforming teams',
          'Implement ROI tracking for training investments',
        ],
        status: 'reviewed',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      },
      {
        id: '4',
        title: 'Cash Flow Risk from Deal Delays',
        description: 'Multiple large deals showing signs of delay could impact Q2 cash flow projections.',
        sourceModules: ['capital_hub', 'financial'],
        insightType: 'risk',
        severity: 'high',
        confidence: 0.85,
        dataPoints: [
          { module: 'capital_hub', metric: 'Delayed Deals Value', value: 1200000, trend: 'up', period: 'Current' },
          { module: 'financial', metric: 'Q2 Cash Reserve', value: 850000, trend: 'down', period: 'Projected' },
        ],
        recommendations: [
          'Accelerate deal closure activities',
          'Review payment terms with key prospects',
          'Prepare contingency cash management plan',
        ],
        status: 'new',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
    ];

    setInsights(mockInsights);
    setLoading(false);
  }, []);

  const updateInsightStatus = useCallback(
    async (insightId: string, status: 'new' | 'reviewed' | 'actioned' | 'dismissed') => {
      setInsights(prev =>
        prev.map(i =>
          i.id === insightId ? { ...i, status } : i
        )
      );
    },
    []
  );

  return { insights, loading, error, updateInsightStatus };
};

export default useCrossModuleInsights;
