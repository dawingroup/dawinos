// ============================================================================
// USE COMPETITORS HOOK
// DawinOS v2.0 - Market Intelligence Module
// Competitor data fetching and management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Competitor } from '../types';
import { ThreatLevel } from '../constants';

interface UseCompetitorsOptions {
  search?: string;
  sector?: string;
  threatLevel?: ThreatLevel;
}

interface UseCompetitorsReturn {
  competitors: Competitor[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  toggleTracking: (competitorId: string) => Promise<void>;
  toggleAlerts: (competitorId: string) => Promise<void>;
}

// Mock data
const mockCompetitors: Competitor[] = [
  {
    id: '1',
    name: 'MTN Uganda',
    description: 'Leading telecommunications company with dominant mobile money platform.',
    sector: 'technology',
    threatLevel: 'high',
    competitorType: 'direct',
    headquarters: 'Kampala, Uganda',
    employeeCount: 1500,
    marketShare: 45,
    strengthScore: 85,
    weaknessScore: 25,
    isTracked: true,
    alertsEnabled: true,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: '2',
    name: 'Airtel Uganda',
    description: 'Major telecom operator with growing mobile money services.',
    sector: 'technology',
    threatLevel: 'high',
    competitorType: 'direct',
    headquarters: 'Kampala, Uganda',
    employeeCount: 800,
    marketShare: 35,
    strengthScore: 75,
    weaknessScore: 30,
    isTracked: true,
    alertsEnabled: true,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: '3',
    name: 'Stanbic Bank Uganda',
    description: 'Leading commercial bank with strong corporate banking presence.',
    sector: 'banking',
    threatLevel: 'medium',
    competitorType: 'indirect',
    headquarters: 'Kampala, Uganda',
    employeeCount: 2000,
    marketShare: 20,
    strengthScore: 80,
    weaknessScore: 20,
    isTracked: true,
    alertsEnabled: false,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
  {
    id: '4',
    name: 'Chipper Cash',
    description: 'Fast-growing fintech for cross-border payments.',
    sector: 'fintech',
    threatLevel: 'medium',
    competitorType: 'potential',
    headquarters: 'San Francisco, USA',
    employeeCount: 300,
    fundingTotalUSD: 150000000,
    strengthScore: 70,
    weaknessScore: 40,
    isTracked: true,
    alertsEnabled: true,
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system',
  },
];

export const useCompetitors = (options: UseCompetitorsOptions = {}): UseCompetitorsReturn => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      let filtered = [...mockCompetitors];

      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower)
        );
      }

      if (options.sector) {
        filtered = filtered.filter(c => c.sector === options.sector);
      }

      if (options.threatLevel) {
        filtered = filtered.filter(c => c.threatLevel === options.threatLevel);
      }

      setCompetitors(filtered);
    } catch (err) {
      console.error('Error fetching competitors:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch competitors'));
    } finally {
      setLoading(false);
    }
  }, [options.search, options.sector, options.threatLevel]);

  const toggleTracking = useCallback(async (competitorId: string) => {
    setCompetitors(prev =>
      prev.map(c =>
        c.id === competitorId ? { ...c, isTracked: !c.isTracked } : c
      )
    );
  }, []);

  const toggleAlerts = useCallback(async (competitorId: string) => {
    setCompetitors(prev =>
      prev.map(c =>
        c.id === competitorId ? { ...c, alertsEnabled: !c.alertsEnabled } : c
      )
    );
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  return {
    competitors,
    loading,
    error,
    refresh: fetchCompetitors,
    toggleTracking,
    toggleAlerts,
  };
};

export default useCompetitors;
