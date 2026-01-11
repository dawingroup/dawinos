// ============================================================================
// NEWS FEED HOOK
// DawinOS v2.0 - Market Intelligence Module
// Hook for news articles and sentiment analysis
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '../types';
import { SentimentLevel } from '../constants';

interface NewsSummary {
  totalArticles: number;
  byCategory: Record<string, number>;
  bySentiment: Record<string, number>;
  topTopics: { topic: string; count: number }[];
  competitorMentions: { competitorId: string; count: number }[];
}

interface UseNewsFeedOptions {
  category?: string;
  sentiment?: string;
  competitorId?: string;
  dateRange?: { start: Date; end: Date };
  pageSize?: number;
}

interface UseNewsFeedReturn {
  articles: NewsArticle[];
  summary: NewsSummary | null;
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (articleId: string) => Promise<void>;
  bookmarkArticle: (articleId: string, bookmarked: boolean) => Promise<void>;
}

// Mock data
const mockArticles: NewsArticle[] = [
  {
    id: '1',
    title: 'Bank of Uganda Announces New Digital Banking Regulations',
    summary: 'New regulations aim to boost financial inclusion through mobile banking and digital payments.',
    sourceName: 'Daily Monitor',
    sourceUrl: 'https://example.com/article1',
    sourceType: 'news',
    category: 'regulatory',
    tags: ['banking', 'regulation', 'fintech', 'digital banking'],
    sectors: ['banking', 'fintech'],
    mentionedCompetitors: [],
    sentiment: 'positive' as SentimentLevel,
    sentimentScore: 0.65,
    relevanceScore: 92,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: false,
    isBookmarked: false,
    isFlagged: false,
  },
  {
    id: '2',
    title: 'MTN Uganda Reports Strong Q3 Mobile Money Growth',
    summary: 'Mobile money transactions up 25% year-over-year as digital adoption accelerates across the country.',
    sourceName: 'New Vision',
    sourceUrl: 'https://example.com/article2',
    sourceType: 'news',
    category: 'competitor_news',
    tags: ['telecom', 'mobile money', 'MTN', 'fintech'],
    sectors: ['technology', 'fintech'],
    mentionedCompetitors: ['mtn-uganda'],
    sentiment: 'positive' as SentimentLevel,
    sentimentScore: 0.72,
    relevanceScore: 88,
    imageUrl: 'https://via.placeholder.com/400x200',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: false,
    isBookmarked: true,
    isFlagged: false,
  },
  {
    id: '3',
    title: 'East African Fintech Startup Raises $10M Series A',
    summary: 'Kampala-based fintech company secures funding to expand digital lending services across the region.',
    sourceName: 'TechCrunch Africa',
    sourceUrl: 'https://example.com/article3',
    sourceType: 'news',
    category: 'funding',
    tags: ['startup', 'funding', 'fintech', 'lending'],
    sectors: ['fintech'],
    mentionedCompetitors: ['chipper-cash'],
    sentiment: 'positive' as SentimentLevel,
    sentimentScore: 0.8,
    relevanceScore: 95,
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: true,
    isBookmarked: false,
    isFlagged: false,
  },
  {
    id: '4',
    title: 'Uganda Revenue Authority Implements New Tax Collection System',
    summary: 'Digital tax collection platform aims to improve compliance and reduce collection costs.',
    sourceName: 'The Observer',
    sourceUrl: 'https://example.com/article4',
    sourceType: 'news',
    category: 'regulatory',
    tags: ['tax', 'government', 'digital transformation'],
    sectors: ['government'],
    mentionedCompetitors: [],
    sentiment: 'neutral' as SentimentLevel,
    sentimentScore: 0.1,
    relevanceScore: 65,
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    fetchedAt: new Date().toISOString(),
    isRead: true,
    isBookmarked: false,
    isFlagged: false,
  },
];

export const useNewsFeed = ({
  category,
  sentiment,
  competitorId,
  pageSize = 20,
}: UseNewsFeedOptions = {}): UseNewsFeedReturn => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [summary, setSummary] = useState<NewsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const calculateSummary = (articleList: NewsArticle[]): NewsSummary => {
    const categoryCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    const competitorCounts: Record<string, number> = {};

    articleList.forEach(article => {
      categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
      sentimentCounts[article.sentiment] = (sentimentCounts[article.sentiment] || 0) + 1;
      
      article.tags?.forEach(tag => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });

      article.mentionedCompetitors?.forEach(comp => {
        competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
      });
    });

    return {
      totalArticles: articleList.length,
      byCategory: categoryCounts,
      bySentiment: sentimentCounts,
      topTopics: Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count })),
      competitorMentions: Object.entries(competitorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([competitorId, count]) => ({ competitorId, count })),
    };
  };

  const fetchArticles = useCallback(async (reset = true) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 400));

      let filtered = [...mockArticles];

      if (category && category !== 'all') {
        filtered = filtered.filter(a => a.category === category);
      }

      if (sentiment && sentiment !== 'all') {
        filtered = filtered.filter(a => a.sentiment === sentiment);
      }

      if (competitorId) {
        filtered = filtered.filter(a => a.mentionedCompetitors?.includes(competitorId));
      }

      if (reset) {
        setArticles(filtered);
        setSummary(calculateSummary(filtered));
      } else {
        const allArticles = [...articles, ...filtered];
        setArticles(allArticles);
        setSummary(calculateSummary(allArticles));
      }

      setHasMore(filtered.length >= pageSize);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch news'));
    } finally {
      setLoading(false);
    }
  }, [category, sentiment, competitorId, pageSize, articles]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchArticles(false);
  }, [hasMore, loading, fetchArticles]);

  const markAsRead = useCallback(async (articleId: string) => {
    setArticles(prev =>
      prev.map(a => (a.id === articleId ? { ...a, isRead: true } : a))
    );
  }, []);

  const bookmarkArticle = useCallback(async (articleId: string, bookmarked: boolean) => {
    setArticles(prev =>
      prev.map(a => (a.id === articleId ? { ...a, isBookmarked: bookmarked } : a))
    );
  }, []);

  useEffect(() => {
    fetchArticles(true);
  }, [category, sentiment, competitorId]);

  return {
    articles,
    summary,
    loading,
    error,
    hasMore,
    loadMore,
    refresh: () => fetchArticles(true),
    markAsRead,
    bookmarkArticle,
  };
};

export default useNewsFeed;
