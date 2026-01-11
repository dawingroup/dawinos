// ============================================================================
// MARKET DATA HOOK
// DawinOS v2.0 - Market Intelligence Module
// Hook for market analysis and industry data
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { MarketData, IndustryTrend } from '../types';
import { TrendDirection, SentimentLevel } from '../constants';

interface MarketSegment {
  id: string;
  name: string;
  description?: string;
  sizeUSD: number;
  growthRate: number;
  share: number;
  competitorCount: number;
  concentration: 'high' | 'medium' | 'low';
  attractivenessScore: number;
  entryBarriers: 'high' | 'medium' | 'low';
}

interface UgandaIndicator {
  id: string;
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  unit: string;
  date: string;
}

interface UseMarketDataOptions {
  sector?: string;
  timeRange?: '30d' | '90d' | '1y' | '3y';
}

interface UseMarketDataReturn {
  marketData: MarketData | null;
  segments: MarketSegment[];
  trends: IndustryTrend[];
  ugandaIndicators: UgandaIndicator[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Mock data
const mockMarketData: MarketData = {
  id: '1',
  sector: 'fintech',
  region: 'East Africa',
  marketSizeUSD: 2500000000,
  marketSizeUGX: 9250000000000,
  growthRate: 15.5,
  projectedGrowthRate: 18.2,
  trend: 'up' as TrendDirection,
  sentiment: 'positive' as SentimentLevel,
  period: '2024',
  periodStart: '2024-01-01',
  periodEnd: '2024-12-31',
  sources: ['industry', 'financial'],
  confidence: 0.82,
  updatedAt: new Date().toISOString(),
};

const mockSegments: MarketSegment[] = [
  {
    id: '1',
    name: 'Mobile Money',
    description: 'Mobile-based financial transactions',
    sizeUSD: 1200000000,
    growthRate: 22.5,
    share: 48,
    competitorCount: 8,
    concentration: 'high',
    attractivenessScore: 85,
    entryBarriers: 'high',
  },
  {
    id: '2',
    name: 'Digital Lending',
    description: 'Online and mobile lending platforms',
    sizeUSD: 450000000,
    growthRate: 35.2,
    share: 18,
    competitorCount: 25,
    concentration: 'low',
    attractivenessScore: 78,
    entryBarriers: 'medium',
  },
  {
    id: '3',
    name: 'Digital Payments',
    description: 'Online payment processing',
    sizeUSD: 380000000,
    growthRate: 28.1,
    share: 15.2,
    competitorCount: 15,
    concentration: 'medium',
    attractivenessScore: 72,
    entryBarriers: 'medium',
  },
];

const mockTrends: IndustryTrend[] = [
  {
    id: '1',
    title: 'AI-Powered Credit Scoring',
    description: 'Machine learning models for alternative credit assessment using mobile data.',
    sector: 'fintech',
    direction: 'strong_up' as TrendDirection,
    strength: 85,
    maturity: 'emerging',
    impactLevel: 'transformative',
    affectedSegments: ['Digital Lending', 'Mobile Money'],
    timeframe: 'medium_term',
    sources: [{ type: 'industry' as const, title: 'Fintech Africa Report 2024' }],
    identifiedAt: new Date().toISOString(),
    confidence: 0.88,
  },
  {
    id: '2',
    title: 'Cross-Border Mobile Payments',
    description: 'Growing demand for seamless cross-border transactions in East Africa.',
    sector: 'fintech',
    direction: 'up' as TrendDirection,
    strength: 72,
    maturity: 'growing',
    impactLevel: 'significant',
    affectedSegments: ['Mobile Money', 'Digital Payments'],
    timeframe: 'short_term',
    sources: [{ type: 'news' as const, title: 'EAC Financial Integration Report' }],
    identifiedAt: new Date().toISOString(),
    confidence: 0.75,
  },
];

const mockIndicators: UgandaIndicator[] = [
  { id: '1', key: 'gdp_growth', label: 'GDP Growth Rate', value: 5.3, previousValue: 4.8, change: 0.5, unit: '%', date: '2024-Q3' },
  { id: '2', key: 'inflation', label: 'Inflation Rate', value: 4.2, previousValue: 5.1, change: -0.9, unit: '%', date: '2024-Q3' },
  { id: '3', key: 'interest_rate', label: 'Central Bank Rate', value: 10.25, previousValue: 10.0, change: 0.25, unit: '%', date: '2024-Q3' },
  { id: '4', key: 'exchange_rate', label: 'USD/UGX Rate', value: 3720, previousValue: 3680, change: 40, unit: 'UGX', date: '2024-Q3' },
  { id: '5', key: 'fdi', label: 'Foreign Direct Investment', value: 1250, previousValue: 1100, change: 150, unit: 'USD M', date: '2024-Q3' },
];

export const useMarketData = ({
  sector,
  timeRange = '1y',
}: UseMarketDataOptions = {}): UseMarketDataReturn => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [segments, setSegments] = useState<MarketSegment[]>([]);
  const [trends, setTrends] = useState<IndustryTrend[]>([]);
  const [ugandaIndicators, setUgandaIndicators] = useState<UgandaIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setMarketData(mockMarketData);
      setSegments(mockSegments);
      setTrends(mockTrends);
      setUgandaIndicators(mockIndicators);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
    } finally {
      setLoading(false);
    }
  }, [sector, timeRange]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    marketData,
    segments,
    trends,
    ugandaIndicators,
    loading,
    error,
    refresh: fetchMarketData,
  };
};

export default useMarketData;
