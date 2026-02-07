/**
 * Strategy Research Hook
 * Manages strategy research state and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

const API_BASE = 'https://api-okekivpl2a-uc.a.run.app';

export interface ProjectStrategy {
  id: string;
  projectId: string;
  challenges: {
    painPoints: string[];
    goals: string[];
    constraints: string[];
  };
  spaceParameters: {
    totalArea: number;
    areaUnit: 'sqm' | 'sqft';
    spaceType: string;
    circulationPercent: number;
    calculatedCapacity?: {
      minimum: number;
      optimal: number;
      maximum: number;
    };
  };
  budgetFramework: {
    tier: 'economy' | 'standard' | 'premium' | 'luxury';
    priorities: string[];
  };
  researchFindings: ResearchFinding[];
  updatedAt?: Date;
}

export interface ResearchFinding {
  id: string;
  title: string;
  content: string;
  sources: string[];
  category: 'trend' | 'benchmark' | 'recommendation' | 'insight';
  createdAt: Date;
}

export interface ResearchMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ url: string; title: string; domain: string }>;
  timestamp: Date;
}

interface UseStrategyResearchReturn {
  strategy: ProjectStrategy | null;
  messages: ResearchMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  updateStrategy: (updates: Partial<ProjectStrategy>) => Promise<void>;
  sendQuery: (query: string, enableWebSearch?: boolean) => Promise<void>;
  saveFinding: (finding: Omit<ResearchFinding, 'id' | 'createdAt'>) => Promise<void>;
  deleteFinding: (findingId: string) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_STRATEGY: Omit<ProjectStrategy, 'id' | 'projectId'> = {
  challenges: { painPoints: [], goals: [], constraints: [] },
  spaceParameters: {
    totalArea: 0,
    areaUnit: 'sqm',
    spaceType: 'restaurant',
    circulationPercent: 30,
  },
  budgetFramework: { tier: 'standard', priorities: [] },
  researchFindings: [],
};

export function useStrategyResearch(projectId: string, userId?: string): UseStrategyResearchReturn {
  const [strategy, setStrategy] = useState<ProjectStrategy | null>(null);
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load strategy from Firestore
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    const strategyRef = doc(db, 'projectStrategy', projectId);
    
    const unsubscribe = onSnapshot(strategyRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setStrategy({
          id: snapshot.id,
          projectId,
          ...data,
          updatedAt: data.updatedAt?.toDate(),
          researchFindings: (data.researchFindings || []).map((f: any) => ({
            ...f,
            createdAt: f.createdAt?.toDate() || new Date(),
          })),
        } as ProjectStrategy);
      } else {
        // Initialize with defaults
        setStrategy({
          id: projectId,
          projectId,
          ...DEFAULT_STRATEGY,
        });
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error loading strategy:', err);
      setError('Failed to load project strategy');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  const updateStrategy = useCallback(async (updates: Partial<ProjectStrategy>) => {
    if (!projectId) return;

    try {
      const strategyRef = doc(db, 'projectStrategy', projectId);
      await setDoc(strategyRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      }, { merge: true });
    } catch (err) {
      console.error('Error updating strategy:', err);
      setError('Failed to save changes');
    }
  }, [projectId]);

  const sendQuery = useCallback(async (query: string, enableWebSearch = false) => {
    if (!query.trim()) return;

    setIsSending(true);
    setError(null);

    // Add user message
    const userMessage: ResearchMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`${API_BASE}/ai/strategy-research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          projectId,
          projectContext: strategy ? {
            challenges: strategy.challenges,
            spaceParameters: strategy.spaceParameters,
            budgetFramework: strategy.budgetFramework,
          } : undefined,
          enableWebSearch,
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Research query failed');
      }

      // Add assistant response
      const assistantMessage: ResearchMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        sources: result.sources,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err: any) {
      console.error('Error sending query:', err);
      setError(err.message || 'Failed to process research query');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  }, [projectId, strategy, userId]);

  const saveFinding = useCallback(async (finding: Omit<ResearchFinding, 'id' | 'createdAt'>) => {
    if (!projectId || !strategy) return;

    const newFinding: ResearchFinding = {
      ...finding,
      id: `finding-${Date.now()}`,
      createdAt: new Date(),
    };

    const updatedFindings = [...(strategy.researchFindings || []), newFinding];
    await updateStrategy({ researchFindings: updatedFindings });
  }, [projectId, strategy, updateStrategy]);

  const deleteFinding = useCallback(async (findingId: string) => {
    if (!projectId || !strategy) return;

    const updatedFindings = strategy.researchFindings.filter(f => f.id !== findingId);
    await updateStrategy({ researchFindings: updatedFindings });
  }, [projectId, strategy, updateStrategy]);

  const clearError = useCallback(() => setError(null), []);

  return {
    strategy,
    messages,
    isLoading,
    isSending,
    error,
    updateStrategy,
    sendQuery,
    saveFinding,
    deleteFinding,
    clearError,
  };
}
