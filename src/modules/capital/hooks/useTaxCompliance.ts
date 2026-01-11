// ============================================================================
// USE TAX COMPLIANCE HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides Uganda tax compliance data (mock data for UI)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface TaxDeadline {
  id: string;
  type: string;
  period: string;
  dueDate: Date;
  status: 'pending' | 'upcoming' | 'filed' | 'overdue';
}

interface TaxFiling {
  id: string;
  type: string;
  period: string;
  filedDate: string;
  amount: number;
  reference: string;
  status: 'filed' | 'pending' | 'rejected';
}

interface UseTaxComplianceReturn {
  deadlines: TaxDeadline[];
  filings: TaxFiling[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Mock data
const mockDeadlines: TaxDeadline[] = [
  {
    id: '1',
    type: 'WHT Return',
    period: 'Q4 2024',
    dueDate: new Date('2025-01-15'),
    status: 'pending',
  },
  {
    id: '2',
    type: 'CGT Declaration',
    period: 'FY 2024',
    dueDate: new Date('2025-06-30'),
    status: 'upcoming',
  },
  {
    id: '3',
    type: 'Annual Tax Return',
    period: 'FY 2024',
    dueDate: new Date('2025-06-30'),
    status: 'upcoming',
  },
];

const mockFilings: TaxFiling[] = [
  {
    id: '1',
    type: 'WHT Return',
    period: 'Q3 2024',
    filedDate: '2024-10-14',
    amount: 4500000,
    reference: 'URA-2024-WHT-003',
    status: 'filed',
  },
  {
    id: '2',
    type: 'WHT Return',
    period: 'Q2 2024',
    filedDate: '2024-07-12',
    amount: 3200000,
    reference: 'URA-2024-WHT-002',
    status: 'filed',
  },
  {
    id: '3',
    type: 'WHT Return',
    period: 'Q1 2024',
    filedDate: '2024-04-10',
    amount: 2800000,
    reference: 'URA-2024-WHT-001',
    status: 'filed',
  },
];

export const useTaxCompliance = (): UseTaxComplianceReturn => {
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [filings, setFilings] = useState<TaxFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setDeadlines(mockDeadlines);
      setFilings(mockFilings);
    } catch (err) {
      console.error('Error fetching tax data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch tax data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    deadlines,
    filings,
    loading,
    error,
    refresh: fetchData,
  };
};

export default useTaxCompliance;
