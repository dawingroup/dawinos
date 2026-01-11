// ============================================================================
// USE CAPITAL DASHBOARD HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides dashboard data and state management (mock data for UI development)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface DashboardOverview {
  activeFunds: number;
  totalAUM: number;
  aumGrowth: number;
  activeDeals: number;
  pipelineValue: number;
  dealGrowth: number;
  totalInvestors: number;
  activeCommitments: number;
  portfolioIRR: number;
  portfolioMOIC: number;
  irrChange: number;
  primaryFundName: string;
}

interface StageMetric {
  stage: string;
  count: number;
  value: number;
}

interface PerformanceDataPoint {
  period: string;
  nav: number;
  irr: number;
  moic: number;
}

interface Activity {
  id: string;
  type: 'deal' | 'investment' | 'investor' | 'document';
  title: string;
  subtitle: string;
  timestamp: Date;
  link: string;
}

interface UseCapitalDashboardReturn {
  overview: DashboardOverview | null;
  pipelineMetrics: StageMetric[];
  fundPerformance: PerformanceDataPoint[];
  recentActivities: Activity[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Mock data for UI development
const mockOverview: DashboardOverview = {
  activeFunds: 3,
  totalAUM: 125000000,
  aumGrowth: 5.2,
  activeDeals: 12,
  pipelineValue: 45000000,
  dealGrowth: 12.5,
  totalInvestors: 28,
  activeCommitments: 15,
  portfolioIRR: 0.18,
  portfolioMOIC: 1.45,
  irrChange: 2.1,
  primaryFundName: 'Dawin Capital Fund I',
};

const mockPipelineMetrics: StageMetric[] = [
  { stage: 'sourcing', count: 8, value: 12000000 },
  { stage: 'screening', count: 5, value: 8000000 },
  { stage: 'due_diligence', count: 3, value: 15000000 },
  { stage: 'negotiation', count: 2, value: 7000000 },
  { stage: 'closing', count: 1, value: 3000000 },
];

const mockFundPerformance: PerformanceDataPoint[] = [
  { period: 'Q1 2024', nav: 50000000, irr: 0.12, moic: 1.15 },
  { period: 'Q2 2024', nav: 55000000, irr: 0.14, moic: 1.22 },
  { period: 'Q3 2024', nav: 58000000, irr: 0.16, moic: 1.28 },
  { period: 'Q4 2024', nav: 62000000, irr: 0.18, moic: 1.35 },
  { period: 'Q1 2025', nav: 68000000, irr: 0.19, moic: 1.42 },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'deal',
    title: 'TechStart Uganda - Due Diligence Started',
    subtitle: 'Series A - $2.5M',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    link: '/capital/deals/1',
  },
  {
    id: '2',
    type: 'investor',
    title: 'New LP Commitment',
    subtitle: 'East Africa DFI - $5M',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    link: '/capital/investors/2',
  },
  {
    id: '3',
    type: 'investment',
    title: 'Valuation Update',
    subtitle: 'AgriTech Holdings - +15% NAV',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    link: '/capital/portfolio/3',
  },
  {
    id: '4',
    type: 'document',
    title: 'Q4 LP Report Published',
    subtitle: 'Fund I - Quarterly Report',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    link: '/capital/reports',
  },
  {
    id: '5',
    type: 'deal',
    title: 'Deal Closed',
    subtitle: 'FinServe Ltd - $1.8M',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
    link: '/capital/deals/5',
  },
];

export const useCapitalDashboard = (): UseCapitalDashboardReturn => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [pipelineMetrics, setPipelineMetrics] = useState<StageMetric[]>([]);
  const [fundPerformance, setFundPerformance] = useState<PerformanceDataPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use mock data for now
      setOverview(mockOverview);
      setPipelineMetrics(mockPipelineMetrics);
      setFundPerformance(mockFundPerformance);
      setRecentActivities(mockActivities);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    overview,
    pipelineMetrics,
    fundPerformance,
    recentActivities,
    loading,
    error,
    refresh: fetchDashboardData,
  };
};

export default useCapitalDashboard;
