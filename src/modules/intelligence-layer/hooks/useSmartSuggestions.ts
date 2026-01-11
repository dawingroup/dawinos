// ============================================================================
// USE SMART SUGGESTIONS HOOK
// DawinOS v2.0 - Intelligence Layer
// Manage AI-generated suggestions
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import type { SmartSuggestion } from '../types';

interface UseSmartSuggestionsReturn {
  suggestions: SmartSuggestion[];
  loading: boolean;
  error: string | null;
  acceptSuggestion: (suggestion: SmartSuggestion) => Promise<void>;
  dismissSuggestion: (suggestion: SmartSuggestion) => Promise<void>;
}

export const useSmartSuggestions = (
  statusFilter?: 'pending' | 'accepted' | 'dismissed'
): UseSmartSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock data - replace with actual Firestore queries
    const mockSuggestions: SmartSuggestion[] = [
      {
        id: '1',
        type: 'task',
        title: 'Review Q1 budget allocations',
        description: 'AI detected potential optimization opportunities in department budgets. Review suggested reallocations to improve efficiency.',
        sourceModule: 'financial',
        priority: 'high',
        confidence: 0.89,
        actionLabel: 'Review Budget',
        actionUrl: '/finance/budgets',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        context: {
          entityType: 'Budget',
          entityId: 'budget-q1-2026',
          entityName: 'Q1 2026 Operating Budget',
        },
      },
      {
        id: '2',
        type: 'approval',
        title: 'Expense report requires attention',
        description: 'An expense report from Marketing department exceeds normal thresholds and requires manager approval.',
        sourceModule: 'financial',
        priority: 'medium',
        confidence: 0.95,
        actionLabel: 'Review Expense',
        actionUrl: '/finance/expenses',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: '3',
        type: 'insight',
        title: 'Employee engagement trend detected',
        description: 'Performance data suggests a correlation between flexible work arrangements and productivity improvements.',
        sourceModule: 'staff_performance',
        priority: 'low',
        confidence: 0.78,
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        id: '4',
        type: 'optimization',
        title: 'Deal pipeline velocity can be improved',
        description: 'AI analysis suggests that deals in the "Proposal" stage are taking 30% longer than optimal. Consider reviewing the proposal process.',
        sourceModule: 'capital_hub',
        priority: 'medium',
        confidence: 0.82,
        actionLabel: 'View Pipeline',
        actionUrl: '/capital/deals',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: '5',
        type: 'alert',
        title: 'Competitor activity spike detected',
        description: 'Market intelligence shows increased activity from key competitor in your primary market segment.',
        sourceModule: 'market_intelligence',
        priority: 'high',
        confidence: 0.91,
        actionLabel: 'View Analysis',
        actionUrl: '/market-intel/competitors',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
      },
    ];

    const filtered = statusFilter
      ? mockSuggestions.filter(s => s.status === statusFilter)
      : mockSuggestions;

    setSuggestions(filtered);
    setLoading(false);
  }, [statusFilter]);

  const acceptSuggestion = useCallback(async (suggestion: SmartSuggestion) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestion.id
          ? { ...s, status: 'accepted' as const, acceptedAt: new Date() }
          : s
      )
    );
  }, []);

  const dismissSuggestion = useCallback(async (suggestion: SmartSuggestion) => {
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestion.id
          ? { ...s, status: 'dismissed' as const, dismissedAt: new Date() }
          : s
      )
    );
  }, []);

  return { suggestions, loading, error, acceptSuggestion, dismissSuggestion };
};

export default useSmartSuggestions;
