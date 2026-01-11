// ============================================================================
// USE ANOMALIES HOOK
// DawinOS v2.0 - Intelligence Layer
// Manage detected anomalies
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { Anomaly } from '../types';

interface UseAnomaliesReturn {
  anomalies: Anomaly[];
  loading: boolean;
  error: string | null;
  acknowledgeAnomaly: (anomaly: Anomaly) => Promise<void>;
  investigateAnomaly: (anomaly: Anomaly) => Promise<void>;
  resolveAnomaly: (anomaly: Anomaly, resolution?: string) => Promise<void>;
  markFalsePositive: (anomaly: Anomaly) => Promise<void>;
}

export const useAnomalies = (
  statusFilter?: string[]
): UseAnomaliesReturn => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual Firestore queries
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        type: 'expense_spike',
        severity: 'high',
        title: 'Unusual expense pattern in Marketing',
        description: 'Marketing department expenses are 45% above the historical monthly average. This deviation exceeds the normal variance threshold.',
        sourceModule: 'financial',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        metric: {
          name: 'Monthly Marketing Expenses',
          expectedValue: 125000,
          actualValue: 181250,
          deviation: 45,
          threshold: 20,
          historicalAverage: 118000,
          trend: 'increasing',
        },
        affectedEntities: [
          { type: 'Department', id: 'dept-marketing', name: 'Marketing', impact: 'direct' },
          { type: 'Budget', id: 'budget-q1', name: 'Q1 Operating Budget', impact: 'indirect' },
        ],
        suggestedActions: [
          'Review recent marketing campaign expenditures',
          'Check for any unauthorized purchases',
          'Compare with approved budget allocations',
        ],
        status: 'new',
      },
      {
        id: '2',
        type: 'performance_drop',
        severity: 'medium',
        title: 'Sales team performance decline',
        description: 'Average deal closure rate has dropped by 18% compared to the previous quarter.',
        sourceModule: 'staff_performance',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        metric: {
          name: 'Deal Closure Rate',
          expectedValue: 32,
          actualValue: 26.2,
          deviation: -18.1,
          threshold: 10,
          historicalAverage: 30,
          trend: 'decreasing',
        },
        affectedEntities: [
          { type: 'Team', id: 'team-sales', name: 'Sales Team', impact: 'direct' },
        ],
        suggestedActions: [
          'Review individual sales rep performance',
          'Check for market condition changes',
          'Assess training needs',
        ],
        status: 'acknowledged',
      },
      {
        id: '3',
        type: 'revenue_variance',
        severity: 'critical',
        title: 'Revenue significantly below forecast',
        description: 'Actual revenue is tracking 25% below the Q1 forecast with 6 weeks remaining.',
        sourceModule: 'capital_hub',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
        metric: {
          name: 'Q1 Revenue',
          expectedValue: 2500000,
          actualValue: 1875000,
          deviation: -25,
          threshold: 15,
          historicalAverage: 2200000,
          trend: 'decreasing',
        },
        suggestedActions: [
          'Accelerate pipeline deals',
          'Review pricing strategy',
          'Identify quick-win opportunities',
        ],
        status: 'investigating',
      },
    ];

    const filtered = statusFilter && statusFilter.length > 0
      ? mockAnomalies.filter(a => statusFilter.includes(a.status))
      : mockAnomalies;

    setAnomalies(filtered);
    setLoading(false);
  }, [statusFilter]);

  const acknowledgeAnomaly = useCallback(async (anomaly: Anomaly) => {
    setAnomalies(prev =>
      prev.map(a =>
        a.id === anomaly.id
          ? { ...a, status: 'acknowledged' as const }
          : a
      )
    );
  }, []);

  const investigateAnomaly = useCallback(async (anomaly: Anomaly) => {
    setAnomalies(prev =>
      prev.map(a =>
        a.id === anomaly.id
          ? { ...a, status: 'investigating' as const }
          : a
      )
    );
  }, []);

  const resolveAnomaly = useCallback(async (anomaly: Anomaly, resolution?: string) => {
    setAnomalies(prev =>
      prev.map(a =>
        a.id === anomaly.id
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date(), resolution }
          : a
      )
    );
  }, []);

  const markFalsePositive = useCallback(async (anomaly: Anomaly) => {
    setAnomalies(prev =>
      prev.map(a =>
        a.id === anomaly.id
          ? { ...a, status: 'false_positive' as const, resolvedAt: new Date() }
          : a
      )
    );
  }, []);

  return {
    anomalies,
    loading,
    error,
    acknowledgeAnomaly,
    investigateAnomaly,
    resolveAnomaly,
    markFalsePositive,
  };
};

export default useAnomalies;
