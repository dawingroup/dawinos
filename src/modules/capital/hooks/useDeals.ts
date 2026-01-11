// ============================================================================
// USE DEALS HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides deal list data with filtering and pagination (mock data for UI)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface Deal {
  id: string;
  name: string;
  companyName: string;
  stage: string;
  dealType: string;
  sector: string;
  dealSize: number;
  targetInvestment: number;
  probability: number;
  targetCloseDate: string;
  leadName: string;
  leadId: string;
  updatedAt: string;
  createdAt: string;
}

interface UseDealsOptions {
  search?: string;
  stage?: string;
  type?: string;
  sector?: string;
}

interface UseDealsReturn {
  deals: Deal[] | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Mock deals data
const mockDeals: Deal[] = [
  {
    id: '1',
    name: 'TechStart Uganda Series A',
    companyName: 'TechStart Uganda Ltd',
    stage: 'due_diligence',
    dealType: 'equity',
    sector: 'technology',
    dealSize: 5000000,
    targetInvestment: 2500000,
    probability: 65,
    targetCloseDate: '2026-03-15',
    leadName: 'John Mukasa',
    leadId: 'user1',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'AgriTech Holdings Expansion',
    companyName: 'AgriTech Holdings',
    stage: 'negotiation',
    dealType: 'equity',
    sector: 'agriculture',
    dealSize: 8000000,
    targetInvestment: 3000000,
    probability: 75,
    targetCloseDate: '2026-02-28',
    leadName: 'Sarah Nambi',
    leadId: 'user2',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'FinServe Ltd Debt Facility',
    companyName: 'FinServe Ltd',
    stage: 'closing',
    dealType: 'debt',
    sector: 'financial_services',
    dealSize: 3000000,
    targetInvestment: 1800000,
    probability: 90,
    targetCloseDate: '2026-01-31',
    leadName: 'Peter Ochieng',
    leadId: 'user3',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'HealthPlus Clinics',
    companyName: 'HealthPlus Medical',
    stage: 'screening',
    dealType: 'equity',
    sector: 'healthcare',
    dealSize: 4500000,
    targetInvestment: 2000000,
    probability: 40,
    targetCloseDate: '2026-04-30',
    leadName: 'Grace Auma',
    leadId: 'user4',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'EduTech Solutions',
    companyName: 'EduTech Solutions Ltd',
    stage: 'sourcing',
    dealType: 'convertible',
    sector: 'education',
    dealSize: 2000000,
    targetInvestment: 1000000,
    probability: 25,
    targetCloseDate: '2026-06-30',
    leadName: 'David Kato',
    leadId: 'user5',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    name: 'Solar Power East Africa',
    companyName: 'Solar Power EA',
    stage: 'due_diligence',
    dealType: 'infrastructure',
    sector: 'energy',
    dealSize: 12000000,
    targetInvestment: 5000000,
    probability: 55,
    targetCloseDate: '2026-05-15',
    leadName: 'John Mukasa',
    leadId: 'user1',
    updatedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const useDeals = (options: UseDealsOptions = {}): UseDealsReturn => {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      let filteredDeals = [...mockDeals];

      // Apply filters
      if (options.stage) {
        filteredDeals = filteredDeals.filter(d => d.stage === options.stage);
      }

      if (options.type) {
        filteredDeals = filteredDeals.filter(d => d.dealType === options.type);
      }

      if (options.sector) {
        filteredDeals = filteredDeals.filter(d => d.sector === options.sector);
      }

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredDeals = filteredDeals.filter(deal =>
          deal.name.toLowerCase().includes(searchLower) ||
          deal.companyName.toLowerCase().includes(searchLower)
        );
      }

      setDeals(filteredDeals);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch deals'));
    } finally {
      setLoading(false);
    }
  }, [options.search, options.stage, options.type, options.sector]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return {
    deals,
    loading,
    error,
    refresh: fetchDeals,
  };
};

export default useDeals;
