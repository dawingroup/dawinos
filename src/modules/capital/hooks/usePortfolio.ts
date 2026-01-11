// ============================================================================
// USE PORTFOLIO HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides portfolio investment data (mock data for UI)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface Investment {
  id: string;
  companyName: string;
  sector: string;
  status: string;
  investedAmount: number;
  currentValue: number;
  moic: number;
  irr: number;
  investmentDate: string;
  hasBoardSeat: boolean;
}

interface UsePortfolioOptions {
  search?: string;
  status?: string;
  sector?: string;
}

interface UsePortfolioReturn {
  investments: Investment[] | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Mock portfolio data
const mockInvestments: Investment[] = [
  {
    id: '1',
    companyName: 'TechStart Uganda',
    sector: 'technology',
    status: 'active',
    investedAmount: 2500000,
    currentValue: 4500000,
    moic: 1.8,
    irr: 0.25,
    investmentDate: '2022-06-15',
    hasBoardSeat: true,
  },
  {
    id: '2',
    companyName: 'AgriTech Holdings',
    sector: 'agriculture',
    status: 'active',
    investedAmount: 3000000,
    currentValue: 4200000,
    moic: 1.4,
    irr: 0.18,
    investmentDate: '2021-03-20',
    hasBoardSeat: true,
  },
  {
    id: '3',
    companyName: 'FinServe Ltd',
    sector: 'financial_services',
    status: 'active',
    investedAmount: 1800000,
    currentValue: 2700000,
    moic: 1.5,
    irr: 0.22,
    investmentDate: '2023-01-10',
    hasBoardSeat: false,
  },
  {
    id: '4',
    companyName: 'HealthPlus Medical',
    sector: 'healthcare',
    status: 'monitoring',
    investedAmount: 2000000,
    currentValue: 1800000,
    moic: 0.9,
    irr: -0.05,
    investmentDate: '2022-09-05',
    hasBoardSeat: true,
  },
  {
    id: '5',
    companyName: 'EduTech Solutions',
    sector: 'education',
    status: 'exited',
    investedAmount: 1500000,
    currentValue: 3750000,
    moic: 2.5,
    irr: 0.35,
    investmentDate: '2020-04-15',
    hasBoardSeat: false,
  },
  {
    id: '6',
    companyName: 'Solar Power EA',
    sector: 'energy',
    status: 'active',
    investedAmount: 5000000,
    currentValue: 6500000,
    moic: 1.3,
    irr: 0.15,
    investmentDate: '2023-06-01',
    hasBoardSeat: true,
  },
];

export const usePortfolio = (options: UsePortfolioOptions = {}): UsePortfolioReturn => {
  const [investments, setInvestments] = useState<Investment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvestments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = [...mockInvestments];

      if (options.status) {
        filtered = filtered.filter(i => i.status === options.status);
      }

      if (options.sector) {
        filtered = filtered.filter(i => i.sector === options.sector);
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filtered = filtered.filter(i =>
          i.companyName.toLowerCase().includes(searchLower)
        );
      }

      setInvestments(filtered);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch portfolio'));
    } finally {
      setLoading(false);
    }
  }, [options.search, options.status, options.sector]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  return {
    investments,
    loading,
    error,
    refresh: fetchInvestments,
  };
};

export default usePortfolio;
