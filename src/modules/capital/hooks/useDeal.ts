// ============================================================================
// USE DEAL HOOK
// DawinOS v2.0 - Capital Hub Module
// Provides single deal data with update capabilities (mock data for UI)
// ============================================================================

import { useState, useEffect, useCallback } from 'react';

interface DealActivity {
  id: string;
  type: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

interface Deal {
  id: string;
  name: string;
  companyName: string;
  companyDescription?: string;
  companyFounded?: number;
  companyEmployees?: number;
  companyLocation?: string;
  companyWebsite?: string;
  stage: string;
  dealType: string;
  sector: string;
  dealSize: number;
  targetInvestment: number;
  probability: number;
  targetCloseDate: string;
  investmentThesis?: string;
  highlights?: string[];
  risks?: string[];
  teamMembers?: { id: string; name: string; role: string }[];
  contacts?: { id: string; name: string; title: string; email: string }[];
  dueDiligenceChecklist?: { id: string; item: string; completed: boolean; category?: string }[];
  documents?: { id: string; name: string; url: string; type: string }[];
  activities?: DealActivity[];
  financials?: Record<string, number>;
  updatedAt: string;
  createdAt: string;
}

interface UseDealReturn {
  deal: Deal | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateDeal: (updates: Partial<Deal>) => Promise<void>;
  addActivity: (activity: Omit<DealActivity, 'id' | 'userId' | 'userName' | 'timestamp'>) => Promise<void>;
}

// Mock deal data
const mockDeal: Deal = {
  id: '1',
  name: 'TechStart Uganda Series A',
  companyName: 'TechStart Uganda Ltd',
  companyDescription: 'Leading fintech company providing mobile payment solutions across East Africa.',
  companyFounded: 2019,
  companyEmployees: 85,
  companyLocation: 'Kampala, Uganda',
  companyWebsite: 'https://techstart.ug',
  stage: 'due_diligence',
  dealType: 'equity',
  sector: 'technology',
  dealSize: 5000000,
  targetInvestment: 2500000,
  probability: 65,
  targetCloseDate: '2026-03-15',
  investmentThesis: 'TechStart has demonstrated strong product-market fit with 150% YoY growth in transaction volume. The company is well-positioned to capture the growing mobile payments market in East Africa.',
  highlights: [
    'Strong revenue growth (150% YoY)',
    'Experienced management team',
    'Clear path to profitability',
    'Strategic partnerships with major banks',
  ],
  risks: [
    'Regulatory uncertainty in key markets',
    'Competition from established players',
    'Currency volatility exposure',
  ],
  teamMembers: [
    { id: 'tm1', name: 'John Mukasa', role: 'Deal Lead' },
    { id: 'tm2', name: 'Sarah Nambi', role: 'Financial Analyst' },
    { id: 'tm3', name: 'Peter Ochieng', role: 'Legal Counsel' },
  ],
  contacts: [
    { id: 'c1', name: 'James Ssemakula', title: 'CEO', email: 'james@techstart.ug' },
    { id: 'c2', name: 'Mary Nakato', title: 'CFO', email: 'mary@techstart.ug' },
  ],
  dueDiligenceChecklist: [
    { id: 'dd1', item: 'Review historical financials (3 years)', completed: true, category: 'financial' },
    { id: 'dd2', item: 'Analyze revenue breakdown', completed: true, category: 'financial' },
    { id: 'dd3', item: 'Review cash flow statements', completed: false, category: 'financial' },
    { id: 'dd4', item: 'Review corporate documents', completed: true, category: 'legal' },
    { id: 'dd5', item: 'Check litigation history', completed: false, category: 'legal' },
    { id: 'dd6', item: 'Analyze customer concentration', completed: true, category: 'commercial' },
    { id: 'dd7', item: 'Review organizational structure', completed: false, category: 'operational' },
  ],
  documents: [
    { id: 'd1', name: 'Financial Statements 2024.pdf', url: '#', type: 'financial' },
    { id: 'd2', name: 'Pitch Deck.pdf', url: '#', type: 'presentation' },
    { id: 'd3', name: 'Term Sheet Draft.docx', url: '#', type: 'legal' },
  ],
  activities: [
    {
      id: 'a1',
      type: 'stage_change',
      description: 'Deal moved to Due Diligence stage',
      userId: 'user1',
      userName: 'John Mukasa',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'a2',
      type: 'note',
      description: 'Initial meeting with CEO went well. Strong vision and execution capability.',
      userId: 'user1',
      userName: 'John Mukasa',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'a3',
      type: 'document',
      description: 'Uploaded Financial Statements 2024',
      userId: 'user2',
      userName: 'Sarah Nambi',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ],
  financials: {
    revenue2024: 2500000,
    revenue2023: 1000000,
    revenue2022: 400000,
    ebitda2024: 250000,
    ebitda2023: -100000,
    grossMargin: 0.65,
    burnRate: 150000,
    runway: 18,
  },
  updatedAt: new Date().toISOString(),
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

export const useDeal = (dealId: string | undefined): UseDealReturn => {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDeal = useCallback(async () => {
    if (!dealId) {
      setDeal(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Return mock deal (in production, fetch from Firestore)
      setDeal({ ...mockDeal, id: dealId });
    } catch (err) {
      console.error('Error fetching deal:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch deal'));
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  const updateDeal = useCallback(async (updates: Partial<Deal>) => {
    if (!deal) return;

    // Update local state (in production, update Firestore)
    setDeal(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
  }, [deal]);

  const addActivity = useCallback(async (
    activity: Omit<DealActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => {
    if (!deal) return;

    const newActivity: DealActivity = {
      id: `activity_${Date.now()}`,
      ...activity,
      userId: 'current_user',
      userName: 'Current User',
      timestamp: new Date(),
    };

    setDeal(prev => prev ? {
      ...prev,
      activities: [newActivity, ...(prev.activities || [])],
      updatedAt: new Date().toISOString(),
    } : null);
  }, [deal]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  return {
    deal,
    loading,
    error,
    refresh: fetchDeal,
    updateDeal,
    addActivity,
  };
};

export default useDeal;
