// ============================================================================
// USE INTELLIGENCE DASHBOARD HOOK
// DawinOS v2.0 - Market Intelligence Module
// Dashboard data fetching and management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { IntelligenceDashboard, Insight, NewsArticle, CompetitorActivity } from '../types';
import { SentimentLevel, TrendDirection } from '../constants';

interface UseIntelligenceDashboardReturn {
  dashboard: IntelligenceDashboard | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  lastRefresh: string | null;
}

// Mock data for UI development
const mockInsights: Insight[] = [
  {
    id: '1',
    title: 'Emerging Fintech Competition',
    description: 'Three new fintech startups have entered the Uganda market in the past month, targeting mobile payments.',
    type: 'threat',
    priority: 'high',
    isActionable: true,
    sector: 'fintech',
    recommendations: ['Monitor their pricing strategies', 'Accelerate mobile app features', 'Consider partnership opportunities'],
    confidence: 0.85,
    dataPoints: 12,
    generatedBy: 'ai',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Agricultural Export Growth',
    description: 'Coffee and tea exports showing 15% YoY growth, creating opportunities in agritech sector.',
    type: 'opportunity',
    priority: 'medium',
    isActionable: true,
    sector: 'agriculture',
    recommendations: ['Explore agritech partnerships', 'Consider supply chain financing'],
    confidence: 0.78,
    dataPoints: 8,
    generatedBy: 'ai',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
];

const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Bank of Uganda Announces New Digital Banking Regulations',
    summary: 'New regulations aim to boost financial inclusion through mobile banking.',
    sourceName: 'Daily Monitor',
    sourceUrl: 'https://example.com',
    sourceType: 'news',
    category: 'regulatory',
    tags: ['banking', 'regulation', 'fintech'],
    sectors: ['banking', 'fintech'],
    mentionedCompetitors: [],
    sentiment: 'positive',
    sentimentScore: 0.6,
    relevanceScore: 85,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: false,
    isBookmarked: false,
    isFlagged: false,
  },
  {
    id: '2',
    title: 'MTN Uganda Reports Strong Q3 Results',
    summary: 'Mobile money transactions up 25% as digital adoption accelerates.',
    sourceName: 'New Vision',
    sourceUrl: 'https://example.com',
    sourceType: 'news',
    category: 'competitor_news',
    tags: ['telecom', 'mobile money'],
    sectors: ['technology'],
    mentionedCompetitors: ['mtn'],
    sentiment: 'positive',
    sentimentScore: 0.7,
    relevanceScore: 90,
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: false,
    isBookmarked: false,
    isFlagged: false,
  },
];

const mockCompetitorAlerts: CompetitorActivity[] = [
  {
    id: '1',
    competitorId: 'comp1',
    activityType: 'product_launch',
    title: 'Competitor X Launches New Mobile App',
    description: 'Major competitor launches redesigned mobile banking application.',
    date: new Date().toISOString(),
    source: 'news',
    sentiment: 'neutral',
    impact: 'high',
    tags: ['mobile', 'banking'],
  },
  {
    id: '2',
    competitorId: 'comp2',
    activityType: 'funding',
    title: 'Startup Y Raises $5M Series A',
    description: 'Fintech startup secures funding from international investors.',
    date: new Date().toISOString(),
    source: 'news',
    sentiment: 'neutral',
    impact: 'medium',
    tags: ['funding', 'fintech'],
  },
];

const mockTopicTrends: { topic: string; mentions: number; trend: TrendDirection }[] = [
  { topic: 'Mobile Money', mentions: 45, trend: 'strong_up' },
  { topic: 'Digital Banking', mentions: 38, trend: 'up' },
  { topic: 'Agritech', mentions: 22, trend: 'up' },
  { topic: 'E-commerce', mentions: 18, trend: 'flat' },
  { topic: 'Insurance Tech', mentions: 12, trend: 'down' },
];

export const useIntelligenceDashboard = (): UseIntelligenceDashboardReturn => {
  const [dashboard, setDashboard] = useState<IntelligenceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const dashboardData: IntelligenceDashboard = {
        trackedCompetitors: 12,
        activeInsights: 5,
        unreadNews: 23,
        alertsToday: 3,
        recentInsights: mockInsights,
        recentNews: mockNews,
        competitorAlerts: mockCompetitorAlerts,
        marketTrends: [],
        topicTrends: mockTopicTrends,
        overallSentiment: 'positive' as SentimentLevel,
        sentimentTrend: 'up' as TrendDirection,
        lastRefresh: new Date().toISOString(),
      };

      setDashboard(dashboardData);
      setLastRefresh(new Date().toISOString());
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboard,
    loading,
    error,
    refresh: fetchDashboard,
    lastRefresh,
  };
};

export default useIntelligenceDashboard;
