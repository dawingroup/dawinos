// ============================================================================
// INSIGHTS HOOK
// DawinOS v2.0 - Market Intelligence Module
// Hook for AI-generated insights management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Insight } from '../types';

interface UseInsightsOptions {
  type?: string;
  priority?: string;
  status?: string;
  pageSize?: number;
}

interface UseInsightsReturn {
  insights: Insight[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateInsightStatus: (insightId: string, status: Insight['status']) => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  actionInsight: (insightId: string) => Promise<void>;
}

// Mock data
const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Emerging Fintech Competition in Mobile Payments',
    description: 'Three new fintech startups have entered the Uganda market in the past month, targeting mobile payments. This represents increased competitive pressure in the core mobile money segment.',
    type: 'threat',
    priority: 'high',
    isActionable: true,
    sector: 'fintech',
    competitorIds: ['chipper-cash', 'wave'],
    recommendations: [
      'Monitor their pricing strategies closely',
      'Accelerate mobile app feature development',
      'Consider strategic partnership opportunities',
      'Review customer retention programs',
    ],
    confidence: 0.85,
    dataPoints: 15,
    generatedBy: 'ai',
    modelVersion: 'gpt-4-turbo',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Agricultural Export Growth Creates Agritech Opportunity',
    description: 'Coffee and tea exports showing 15% YoY growth, creating significant opportunities in the agritech sector for supply chain financing and farmer payment solutions.',
    type: 'opportunity',
    priority: 'medium',
    isActionable: true,
    sector: 'agriculture',
    recommendations: [
      'Explore agritech partnerships with cooperatives',
      'Consider supply chain financing products',
      'Develop farmer-focused mobile solutions',
    ],
    confidence: 0.78,
    dataPoints: 12,
    generatedBy: 'ai',
    status: 'new',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'Digital Banking Regulation Changes',
    description: 'Bank of Uganda is expected to release new digital banking guidelines in Q1 2025, which may impact licensing requirements and operational frameworks.',
    type: 'trend',
    priority: 'medium',
    isActionable: false,
    sector: 'banking',
    recommendations: [
      'Engage with regulatory affairs team',
      'Monitor BOU announcements',
      'Prepare compliance assessment',
    ],
    confidence: 0.72,
    dataPoints: 8,
    generatedBy: 'ai',
    status: 'reviewed',
    reviewedBy: 'user-1',
    reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Unusual Transaction Volume Spike',
    description: 'Competitor X showing 40% increase in transaction volume over the past week, significantly above normal patterns. This may indicate a new product launch or promotional campaign.',
    type: 'anomaly',
    priority: 'high',
    isActionable: true,
    competitorIds: ['competitor-x'],
    recommendations: [
      'Investigate competitor marketing activities',
      'Check for new product announcements',
      'Analyze potential customer migration',
    ],
    confidence: 0.91,
    dataPoints: 25,
    generatedBy: 'ai',
    status: 'new',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
];

export const useInsights = ({
  type,
  priority,
  status,
  pageSize = 50,
}: UseInsightsOptions = {}): UseInsightsReturn => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 400));

      let filtered = [...mockInsights];

      if (type && type !== 'all') {
        filtered = filtered.filter(i => i.type === type);
      }

      if (priority && priority !== 'all') {
        filtered = filtered.filter(i => i.priority === priority);
      }

      if (status && status !== 'all') {
        filtered = filtered.filter(i => i.status === status);
      }

      setInsights(filtered.slice(0, pageSize));
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch insights'));
    } finally {
      setLoading(false);
    }
  }, [type, priority, status, pageSize]);

  const updateInsightStatus = useCallback(async (insightId: string, newStatus: Insight['status']) => {
    setInsights(prev =>
      prev.map(i => (i.id === insightId ? { ...i, status: newStatus, reviewedAt: new Date().toISOString() } : i))
    );
  }, []);

  const dismissInsight = useCallback(async (insightId: string) => {
    await updateInsightStatus(insightId, 'dismissed');
  }, [updateInsightStatus]);

  const actionInsight = useCallback(async (insightId: string) => {
    await updateInsightStatus(insightId, 'actioned');
  }, [updateInsightStatus]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    error,
    refresh: fetchInsights,
    updateInsightStatus,
    dismissInsight,
    actionInsight,
  };
};

export default useInsights;
