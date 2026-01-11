// ============================================================================
// USE PREDICTIONS HOOK
// DawinOS v2.0 - Intelligence Layer
// Manage AI predictions
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { Prediction } from '../types';

interface UsePredictionsReturn {
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
  validatePrediction: (prediction: Prediction, actualValue: number) => Promise<void>;
}

export const usePredictions = (
  statusFilter?: 'active' | 'validated' | 'invalidated' | 'expired'
): UsePredictionsReturn => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual Firestore queries
    const mockPredictions: Prediction[] = [
      {
        id: '1',
        type: 'revenue',
        title: 'Q2 2026 Revenue Forecast',
        description: 'Predicted quarterly revenue based on current pipeline and historical trends.',
        sourceModule: 'capital_hub',
        targetDate: new Date('2026-06-30'),
        predictedValue: 3250000,
        confidence: 0.82,
        confidenceInterval: {
          lower: 2925000,
          upper: 3575000,
        },
        factors: [
          { name: 'Pipeline Value', impact: 'positive', weight: 0.35, description: 'Strong pipeline growth' },
          { name: 'Market Conditions', impact: 'neutral', weight: 0.25, description: 'Stable market' },
          { name: 'Seasonal Trends', impact: 'positive', weight: 0.20, description: 'Q2 typically strong' },
          { name: 'Team Capacity', impact: 'negative', weight: 0.20, description: 'Some capacity constraints' },
        ],
        historicalAccuracy: 0.85,
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
      },
      {
        id: '2',
        type: 'headcount',
        title: 'Engineering Team Growth',
        description: 'Predicted headcount needs for engineering department by end of Q2.',
        sourceModule: 'hr_central',
        targetDate: new Date('2026-06-30'),
        predictedValue: 45,
        confidence: 0.78,
        confidenceInterval: {
          lower: 42,
          upper: 48,
        },
        factors: [
          { name: 'Project Pipeline', impact: 'positive', weight: 0.40, description: 'Multiple new projects' },
          { name: 'Attrition Rate', impact: 'negative', weight: 0.30, description: 'Expected turnover' },
          { name: 'Budget Approval', impact: 'neutral', weight: 0.30, description: 'Pending approval' },
        ],
        historicalAccuracy: 0.80,
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      },
      {
        id: '3',
        type: 'deal_closure',
        title: 'Enterprise Deal Closure',
        description: 'Likelihood of closing the TechCorp enterprise deal this quarter.',
        sourceModule: 'capital_hub',
        targetDate: new Date('2026-03-31'),
        predictedValue: 85,
        confidence: 0.88,
        confidenceInterval: {
          lower: 75,
          upper: 92,
        },
        factors: [
          { name: 'Stakeholder Engagement', impact: 'positive', weight: 0.35, description: 'Strong champion' },
          { name: 'Budget Availability', impact: 'positive', weight: 0.30, description: 'Budget confirmed' },
          { name: 'Competition', impact: 'negative', weight: 0.20, description: 'Active competitor' },
          { name: 'Timeline', impact: 'neutral', weight: 0.15, description: 'On track' },
        ],
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
      {
        id: '4',
        type: 'expense',
        title: 'Q1 Operating Expenses',
        description: 'Predicted total operating expenses for Q1 2026.',
        sourceModule: 'financial',
        targetDate: new Date('2026-03-31'),
        predictedValue: 1850000,
        confidence: 0.91,
        confidenceInterval: {
          lower: 1757500,
          upper: 1942500,
        },
        factors: [
          { name: 'Fixed Costs', impact: 'neutral', weight: 0.50, description: 'Stable fixed costs' },
          { name: 'Variable Costs', impact: 'positive', weight: 0.30, description: 'Efficiency gains' },
          { name: 'New Initiatives', impact: 'negative', weight: 0.20, description: 'Planned investments' },
        ],
        historicalAccuracy: 0.92,
        status: 'active',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    ];

    const filtered = statusFilter
      ? mockPredictions.filter(p => p.status === statusFilter)
      : mockPredictions;

    setPredictions(filtered);
    setLoading(false);
  }, [statusFilter]);

  const validatePrediction = useCallback(
    async (prediction: Prediction, actualValue: number) => {
      const isValid =
        actualValue >= prediction.confidenceInterval.lower &&
        actualValue <= prediction.confidenceInterval.upper;

      setPredictions(prev =>
        prev.map(p =>
          p.id === prediction.id
            ? {
                ...p,
                status: isValid ? ('validated' as const) : ('invalidated' as const),
                actualValue,
                validatedAt: new Date(),
              }
            : p
        )
      );
    },
    []
  );

  return { predictions, loading, error, validatePrediction };
};

export default usePredictions;
