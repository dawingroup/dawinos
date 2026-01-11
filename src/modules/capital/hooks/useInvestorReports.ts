// ============================================================================
// USE INVESTOR REPORTS HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides LP reporting data (mock data for UI)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface Fund {
  id: string;
  name: string;
}

interface PerformanceDataPoint {
  period: string;
  irr: number;
  tvpi: number;
  dpi: number;
}

interface SectorAllocation {
  name: string;
  value: number;
  invested: number;
  moic: number;
}

interface CashFlowData {
  period: string;
  contributions: number;
  distributions: number;
  cumulative: number;
}

interface UseInvestorReportsOptions {
  fundId?: string;
  period?: string;
  year?: number;
}

interface UseInvestorReportsReturn {
  funds: Fund[];
  performanceData: PerformanceDataPoint[] | null;
  sectorAllocation: SectorAllocation[] | null;
  cashFlowData: CashFlowData[] | null;
  loading: boolean;
  error: Error | null;
  generateReport: (options: { format: 'pdf' | 'excel'; period: string; year: number; fundId?: string }) => Promise<void>;
}

// Mock data
const mockFunds: Fund[] = [
  { id: 'fund1', name: 'Dawin Capital Fund I' },
  { id: 'fund2', name: 'Dawin Growth Fund' },
];

const mockPerformanceData: PerformanceDataPoint[] = [
  { period: 'Q1 2023', irr: 0.12, tvpi: 1.15, dpi: 0.10 },
  { period: 'Q2 2023', irr: 0.14, tvpi: 1.22, dpi: 0.12 },
  { period: 'Q3 2023', irr: 0.15, tvpi: 1.28, dpi: 0.15 },
  { period: 'Q4 2023', irr: 0.16, tvpi: 1.35, dpi: 0.18 },
  { period: 'Q1 2024', irr: 0.17, tvpi: 1.42, dpi: 0.22 },
  { period: 'Q2 2024', irr: 0.18, tvpi: 1.50, dpi: 0.25 },
  { period: 'Q3 2024', irr: 0.185, tvpi: 1.58, dpi: 0.28 },
  { period: 'Q4 2024', irr: 0.186, tvpi: 1.61, dpi: 0.29 },
];

const mockSectorAllocation: SectorAllocation[] = [
  { name: 'Technology', value: 45000000, invested: 30000000, moic: 1.5 },
  { name: 'Financial Services', value: 28000000, invested: 20000000, moic: 1.4 },
  { name: 'Healthcare', value: 22000000, invested: 18000000, moic: 1.22 },
  { name: 'Agriculture', value: 18000000, invested: 15000000, moic: 1.2 },
  { name: 'Energy', value: 12000000, invested: 12000000, moic: 1.0 },
];

const mockCashFlowData: CashFlowData[] = [
  { period: 'Q1 2023', contributions: 15000000, distributions: 2000000, cumulative: -13000000 },
  { period: 'Q2 2023', contributions: 12000000, distributions: 3000000, cumulative: -22000000 },
  { period: 'Q3 2023', contributions: 10000000, distributions: 4000000, cumulative: -28000000 },
  { period: 'Q4 2023', contributions: 8000000, distributions: 5000000, cumulative: -31000000 },
  { period: 'Q1 2024', contributions: 5000000, distributions: 6000000, cumulative: -30000000 },
  { period: 'Q2 2024', contributions: 3000000, distributions: 8000000, cumulative: -25000000 },
  { period: 'Q3 2024', contributions: 2000000, distributions: 10000000, cumulative: -17000000 },
  { period: 'Q4 2024', contributions: 0, distributions: 12000000, cumulative: -5000000 },
];

export const useInvestorReports = (options: UseInvestorReportsOptions = {}): UseInvestorReportsReturn => {
  const [performanceData, setPerformanceData] = useState<PerformanceDataPoint[] | null>(null);
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[] | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      setPerformanceData(mockPerformanceData);
      setSectorAllocation(mockSectorAllocation);
      setCashFlowData(mockCashFlowData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch reports'));
    } finally {
      setLoading(false);
    }
  }, []);

  const generateReport = useCallback(async (reportOptions: { format: 'pdf' | 'excel'; period: string; year: number; fundId?: string }) => {
    console.log('Generating report:', reportOptions);
    // In production, this would trigger report generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Report generated in ${reportOptions.format.toUpperCase()} format`);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    funds: mockFunds,
    performanceData,
    sectorAllocation,
    cashFlowData,
    loading,
    error,
    generateReport,
  };
};

export default useInvestorReports;
