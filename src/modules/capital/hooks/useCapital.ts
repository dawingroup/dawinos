// ============================================================================
// CAPITAL HUB HOOK
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Deal,
  Investor,
  InvestorCommitment,
  Fund,
  DealActivity,
  PipelineSummary,
  InvestorSummary,
  DealFilters,
  InvestorFilters,
  CommitmentFilters,
} from '../types/capital.types';
import {
  DealInput,
  DealUpdateInput,
  InvestorInput,
  InvestorUpdateInput,
  CommitmentInput,
  CommitmentStatusUpdateInput,
  DealActivityInput,
  FundInput,
  StageChangeInput,
} from '../schemas/capital.schemas';
import {
  createDeal,
  getDeal,
  getDeals,
  updateDeal,
  updateDealStage,
  deleteDeal,
  addInterestedInvestor,
  createInvestor,
  getInvestor,
  getInvestors,
  updateInvestor,
  updateInvestorStatus,
  recordInvestorContact,
  deleteInvestor,
  createCommitment,
  getCommitment,
  getDealCommitments,
  getInvestorCommitments,
  getCommitments,
  updateCommitmentStatus,
  deleteCommitment,
  logDealActivity,
  getDealActivities,
  createFund,
  getFunds,
  getPipelineSummary,
  getInvestorSummary,
} from '../services/capitalService';
import { useAuth } from '@/core/hooks/useAuth';
import { InvestorStatus } from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface UseCapitalOptions {
  companyId: string;
  autoLoad?: boolean;
}

interface UseCapitalReturn {
  // Data
  deals: Deal[];
  investors: Investor[];
  commitments: InvestorCommitment[];
  funds: Fund[];
  activities: DealActivity[];
  pipelineSummary: PipelineSummary | null;
  investorSummary: InvestorSummary | null;
  selectedDeal: Deal | null;
  selectedInvestor: Investor | null;
  
  // State
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Deal actions
  loadDeals: (filters?: DealFilters) => Promise<void>;
  loadDeal: (dealId: string) => Promise<Deal | null>;
  createDealFn: (input: DealInput, advisorName: string) => Promise<Deal | null>;
  updateDealFn: (dealId: string, updates: DealUpdateInput) => Promise<boolean>;
  changeDealStage: (dealId: string, input: StageChangeInput) => Promise<boolean>;
  deleteDealFn: (dealId: string) => Promise<boolean>;
  addInterestedInvestorFn: (dealId: string, investorId: string) => Promise<boolean>;
  
  // Investor actions
  loadInvestors: (filters?: InvestorFilters) => Promise<void>;
  loadInvestor: (investorId: string) => Promise<Investor | null>;
  createInvestorFn: (input: InvestorInput, ownerName: string) => Promise<Investor | null>;
  updateInvestorFn: (investorId: string, updates: InvestorUpdateInput) => Promise<boolean>;
  updateInvestorStatusFn: (investorId: string, status: InvestorStatus) => Promise<boolean>;
  recordContactFn: (investorId: string, nextFollowUp?: Date) => Promise<boolean>;
  deleteInvestorFn: (investorId: string) => Promise<boolean>;
  
  // Commitment actions
  loadCommitments: (filters?: CommitmentFilters) => Promise<void>;
  loadDealCommitments: (dealId: string) => Promise<void>;
  loadInvestorCommitments: (investorId: string) => Promise<void>;
  createCommitmentFn: (
    input: CommitmentInput,
    dealName: string,
    investorName: string
  ) => Promise<InvestorCommitment | null>;
  updateCommitmentStatusFn: (
    commitmentId: string,
    input: CommitmentStatusUpdateInput
  ) => Promise<boolean>;
  deleteCommitmentFn: (commitmentId: string) => Promise<boolean>;
  
  // Activity actions
  loadDealActivities: (dealId: string) => Promise<void>;
  logActivityFn: (input: DealActivityInput) => Promise<DealActivity | null>;
  
  // Fund actions
  loadFunds: () => Promise<void>;
  createFundFn: (input: FundInput) => Promise<Fund | null>;
  
  // Analytics
  loadPipelineSummary: () => Promise<void>;
  loadInvestorSummary: () => Promise<void>;
  
  // Selection
  selectDeal: (deal: Deal | null) => void;
  selectInvestor: (investor: Investor | null) => void;
}

// ----------------------------------------------------------------------------
// HOOK
// ----------------------------------------------------------------------------

export const useCapital = ({
  companyId,
  autoLoad = true,
}: UseCapitalOptions): UseCapitalReturn => {
  const { user } = useAuth();
  
  // Data state
  const [deals, setDeals] = useState<Deal[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [commitments, setCommitments] = useState<InvestorCommitment[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [investorSummary, setInvestorSummary] = useState<InvestorSummary | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // -------------------- DEALS --------------------
  
  const loadDeals = useCallback(async (filters: DealFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDeals(companyId, filters);
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  const loadDeal = useCallback(async (dealId: string): Promise<Deal | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const deal = await getDeal(dealId);
      if (deal) setSelectedDeal(deal);
      return deal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deal');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createDealFn = useCallback(async (
    input: DealInput,
    advisorName: string
  ): Promise<Deal | null> => {
    if (!user) return null;
    setIsSubmitting(true);
    setError(null);
    try {
      const deal = await createDeal(companyId, input, advisorName, user.uid);
      setDeals(prev => [deal, ...prev]);
      return deal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deal');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [companyId, user]);
  
  const updateDealFn = useCallback(async (
    dealId: string,
    updates: DealUpdateInput
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateDeal(dealId, updates);
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        await loadDeal(dealId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadDeals, loadDeal, selectedDeal]);
  
  const changeDealStage = useCallback(async (
    dealId: string,
    input: StageChangeInput
  ): Promise<boolean> => {
    if (!user) return false;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateDealStage(dealId, input, user.uid, user.displayName || 'Unknown');
      await loadDeals();
      if (selectedDeal?.id === dealId) {
        await loadDeal(dealId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, loadDeals, loadDeal, selectedDeal]);
  
  const deleteDealFn = useCallback(async (dealId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteDeal(dealId);
      setDeals(prev => prev.filter(d => d.id !== dealId));
      if (selectedDeal?.id === dealId) setSelectedDeal(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deal');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDeal]);
  
  const addInterestedInvestorFn = useCallback(async (
    dealId: string,
    investorId: string
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await addInterestedInvestor(dealId, investorId);
      if (selectedDeal?.id === dealId) {
        await loadDeal(dealId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add investor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadDeal, selectedDeal]);
  
  // -------------------- INVESTORS --------------------
  
  const loadInvestors = useCallback(async (filters: InvestorFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvestors(companyId, filters);
      setInvestors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investors');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  const loadInvestor = useCallback(async (investorId: string): Promise<Investor | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const investor = await getInvestor(investorId);
      if (investor) setSelectedInvestor(investor);
      return investor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createInvestorFn = useCallback(async (
    input: InvestorInput,
    ownerName: string
  ): Promise<Investor | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const investor = await createInvestor(companyId, input, ownerName);
      setInvestors(prev => [...prev, investor].sort((a, b) => a.name.localeCompare(b.name)));
      return investor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create investor');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [companyId]);
  
  const updateInvestorFn = useCallback(async (
    investorId: string,
    updates: InvestorUpdateInput
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateInvestor(investorId, updates);
      await loadInvestors();
      if (selectedInvestor?.id === investorId) {
        await loadInvestor(investorId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update investor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadInvestors, loadInvestor, selectedInvestor]);
  
  const updateInvestorStatusFn = useCallback(async (
    investorId: string,
    status: InvestorStatus
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateInvestorStatus(investorId, status);
      await loadInvestors();
      if (selectedInvestor?.id === investorId) {
        await loadInvestor(investorId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadInvestors, loadInvestor, selectedInvestor]);
  
  const recordContactFn = useCallback(async (
    investorId: string,
    nextFollowUp?: Date
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await recordInvestorContact(investorId, nextFollowUp);
      if (selectedInvestor?.id === investorId) {
        await loadInvestor(investorId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record contact');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [loadInvestor, selectedInvestor]);
  
  const deleteInvestorFn = useCallback(async (investorId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteInvestor(investorId);
      setInvestors(prev => prev.filter(i => i.id !== investorId));
      if (selectedInvestor?.id === investorId) setSelectedInvestor(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete investor');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedInvestor]);
  
  // -------------------- COMMITMENTS --------------------
  
  const loadCommitments = useCallback(async (filters: CommitmentFilters = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCommitments(companyId, filters);
      setCommitments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commitments');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  const loadDealCommitments = useCallback(async (dealId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDealCommitments(dealId);
      setCommitments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commitments');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadInvestorCommitments = useCallback(async (investorId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvestorCommitments(investorId);
      setCommitments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load commitments');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const createCommitmentFn = useCallback(async (
    input: CommitmentInput,
    dealName: string,
    investorName: string
  ): Promise<InvestorCommitment | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const commitment = await createCommitment(companyId, input, dealName, investorName);
      setCommitments(prev => [...prev, commitment]);
      // Refresh deal if selected
      if (selectedDeal?.id === input.dealId) {
        await loadDeal(input.dealId);
      }
      return commitment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create commitment');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [companyId, selectedDeal, loadDeal]);
  
  const updateCommitmentStatusFn = useCallback(async (
    commitmentId: string,
    input: CommitmentStatusUpdateInput
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await updateCommitmentStatus(commitmentId, input);
      const commitment = await getCommitment(commitmentId);
      if (commitment && selectedDeal?.id === commitment.dealId) {
        await loadDeal(commitment.dealId);
        await loadDealCommitments(commitment.dealId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update commitment');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDeal, loadDeal, loadDealCommitments]);
  
  const deleteCommitmentFn = useCallback(async (commitmentId: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const commitment = await getCommitment(commitmentId);
      await deleteCommitment(commitmentId);
      setCommitments(prev => prev.filter(c => c.id !== commitmentId));
      if (commitment && selectedDeal?.id === commitment.dealId) {
        await loadDeal(commitment.dealId);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete commitment');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedDeal, loadDeal]);
  
  // -------------------- ACTIVITIES --------------------
  
  const loadDealActivities = useCallback(async (dealId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDealActivities(dealId);
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const logActivityFn = useCallback(async (
    input: DealActivityInput
  ): Promise<DealActivity | null> => {
    if (!user) return null;
    setIsSubmitting(true);
    setError(null);
    try {
      const activity = await logDealActivity(
        input.dealId,
        input,
        user.uid,
        user.displayName || 'Unknown'
      );
      setActivities(prev => [activity, ...prev]);
      return activity;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);
  
  // -------------------- FUNDS --------------------
  
  const loadFunds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFunds(companyId);
      setFunds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funds');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  const createFundFn = useCallback(async (input: FundInput): Promise<Fund | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const fund = await createFund(companyId, input);
      setFunds(prev => [fund, ...prev]);
      return fund;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fund');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [companyId]);
  
  // -------------------- ANALYTICS --------------------
  
  const loadPipelineSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await getPipelineSummary(companyId);
      setPipelineSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pipeline summary');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  const loadInvestorSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await getInvestorSummary(companyId);
      setInvestorSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor summary');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);
  
  // -------------------- SELECTION --------------------
  
  const selectDeal = useCallback((deal: Deal | null) => {
    setSelectedDeal(deal);
  }, []);
  
  const selectInvestor = useCallback((investor: Investor | null) => {
    setSelectedInvestor(investor);
  }, []);
  
  // -------------------- AUTO LOAD --------------------
  
  useEffect(() => {
    if (autoLoad && companyId) {
      loadDeals();
      loadInvestors();
      loadPipelineSummary();
    }
  }, [autoLoad, companyId, loadDeals, loadInvestors, loadPipelineSummary]);
  
  return {
    deals,
    investors,
    commitments,
    funds,
    activities,
    pipelineSummary,
    investorSummary,
    selectedDeal,
    selectedInvestor,
    isLoading,
    isSubmitting,
    error,
    loadDeals,
    loadDeal,
    createDealFn,
    updateDealFn,
    changeDealStage,
    deleteDealFn,
    addInterestedInvestorFn,
    loadInvestors,
    loadInvestor,
    createInvestorFn,
    updateInvestorFn,
    updateInvestorStatusFn,
    recordContactFn,
    deleteInvestorFn,
    loadCommitments,
    loadDealCommitments,
    loadInvestorCommitments,
    createCommitmentFn,
    updateCommitmentStatusFn,
    deleteCommitmentFn,
    loadDealActivities,
    logActivityFn,
    loadFunds,
    createFundFn,
    loadPipelineSummary,
    loadInvestorSummary,
    selectDeal,
    selectInvestor,
  };
};
