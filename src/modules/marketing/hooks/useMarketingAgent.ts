/**
 * useMarketingAgent Hook
 * React hook for the Marketing AI Agent with conversation state
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  AgentMessage,
  MarketingKeyDate,
  ContentGenerationRequest,
  GeneratedContent,
  StrategyContext,
  MarketingAgentConfig,
} from '../types';
import {
  chatWithAgent,
  generateContent,
  discoverKeyDates,
  saveKeyDates,
  getKeyDates,
  acknowledgeKeyDate,
  deleteKeyDate,
  getAgentConfig,
  saveAgentConfig,
} from '../services/marketingAgentService';

interface UseMarketingAgentReturn {
  // Chat
  messages: AgentMessage[];
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  chatLoading: boolean;

  // Content Generation
  generatedContent: GeneratedContent | null;
  generatePostContent: (request: ContentGenerationRequest) => Promise<GeneratedContent | null>;
  generating: boolean;

  // Key Dates
  keyDates: MarketingKeyDate[];
  loadKeyDates: () => Promise<void>;
  discoverDates: (options?: {
    region?: string;
    country?: string;
    industry?: string;
  }) => Promise<MarketingKeyDate[]>;
  saveDates: (dates: MarketingKeyDate[]) => Promise<void>;
  acknowledgeDt: (dateId: string) => Promise<void>;
  removeDt: (dateId: string) => Promise<void>;
  datesLoading: boolean;

  // Config
  config: MarketingAgentConfig | null;
  loadConfig: () => Promise<void>;
  updateConfig: (config: MarketingAgentConfig) => Promise<void>;

  // Strategy
  strategyContext: Partial<StrategyContext>;
  setStrategyContext: (ctx: Partial<StrategyContext>) => void;

  // Error
  error: Error | null;
}

export function useMarketingAgent(companyId?: string): UseMarketingAgentReturn {
  const { user } = useAuth();
  // Firebase User doesn't have companyId — use uid as company identifier
  const effectiveCompanyId = companyId || (user as any)?.companyId || user?.uid || '';

  // Chat state
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your Marketing AI Assistant. I can help you with:\n\n" +
        "🗓️ **Key Dates** — Discover important marketing dates\n" +
        "✍️ **Content Creation** — Draft posts aligned with your strategy\n" +
        "📊 **Campaign Planning** — Plan and optimize campaigns\n\n" +
        "What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Content state
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);

  // Key dates state
  const [keyDates, setKeyDates] = useState<MarketingKeyDate[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Config state
  const [config, setConfig] = useState<MarketingAgentConfig | null>(null);
  const [strategyContext, setStrategyContext] = useState<Partial<StrategyContext>>({});

  // Error
  const [error, setError] = useState<Error | null>(null);

  // Send chat message
  const sendMessage = useCallback(async (content: string) => {
    if (!effectiveCompanyId) return;

    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    setError(null);

    try {
      const response = await chatWithAgent(
        content,
        effectiveCompanyId,
        strategyContext,
        [...messages, userMessage]
      );
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get response'));
      const errorMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  }, [effectiveCompanyId, strategyContext, messages]);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared! How can I help you with your marketing today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Generate content
  const generatePostContent = useCallback(async (
    request: ContentGenerationRequest
  ): Promise<GeneratedContent | null> => {
    if (!effectiveCompanyId) return null;

    setGenerating(true);
    setError(null);

    try {
      const result = await generateContent(
        { ...request, strategyContext },
        effectiveCompanyId
      );
      setGeneratedContent(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Content generation failed'));
      return null;
    } finally {
      setGenerating(false);
    }
  }, [effectiveCompanyId, strategyContext]);

  // Load key dates
  const loadKeyDatesFn = useCallback(async () => {
    if (!effectiveCompanyId) return;

    setDatesLoading(true);
    try {
      const dates = await getKeyDates(effectiveCompanyId);
      setKeyDates(dates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load key dates'));
    } finally {
      setDatesLoading(false);
    }
  }, [effectiveCompanyId]);

  // Discover new key dates
  const discoverDatesFn = useCallback(async (options?: {
    region?: string;
    country?: string;
    industry?: string;
  }): Promise<MarketingKeyDate[]> => {
    if (!effectiveCompanyId) return [];

    setDatesLoading(true);
    try {
      const dates = await discoverKeyDates(effectiveCompanyId, {
        ...options,
        strategyContext,
      });
      return dates;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to discover dates'));
      return [];
    } finally {
      setDatesLoading(false);
    }
  }, [effectiveCompanyId, strategyContext]);

  // Save key dates
  const saveDatesFn = useCallback(async (dates: MarketingKeyDate[]) => {
    try {
      await saveKeyDates(dates);
      await loadKeyDatesFn();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save dates'));
    }
  }, [loadKeyDatesFn]);

  // Acknowledge date
  const acknowledgeDtFn = useCallback(async (dateId: string) => {
    try {
      await acknowledgeKeyDate(dateId);
      setKeyDates((prev) =>
        prev.map((d) => (d.id === dateId ? { ...d, acknowledged: true } : d))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to acknowledge date'));
    }
  }, []);

  // Remove date
  const removeDtFn = useCallback(async (dateId: string) => {
    try {
      await deleteKeyDate(dateId);
      setKeyDates((prev) => prev.filter((d) => d.id !== dateId));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete date'));
    }
  }, []);

  // Load config
  const loadConfigFn = useCallback(async () => {
    if (!effectiveCompanyId) return;
    try {
      const result = await getAgentConfig(effectiveCompanyId);
      if (result) {
        setConfig(result);
        setStrategyContext(result.strategyContext);
      }
    } catch (err) {
      console.warn('Failed to load agent config:', err);
    }
  }, [effectiveCompanyId]);

  // Update config
  const updateConfigFn = useCallback(async (newConfig: MarketingAgentConfig) => {
    try {
      await saveAgentConfig(newConfig);
      setConfig(newConfig);
      setStrategyContext(newConfig.strategyContext);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save config'));
    }
  }, []);

  return {
    messages,
    sendMessage,
    clearChat,
    chatLoading,
    generatedContent,
    generatePostContent,
    generating,
    keyDates,
    loadKeyDates: loadKeyDatesFn,
    discoverDates: discoverDatesFn,
    saveDates: saveDatesFn,
    acknowledgeDt: acknowledgeDtFn,
    removeDt: removeDtFn,
    datesLoading,
    config,
    loadConfig: loadConfigFn,
    updateConfig: updateConfigFn,
    strategyContext,
    setStrategyContext,
    error,
  };
}
