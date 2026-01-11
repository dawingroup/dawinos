// ============================================================================
// ALLOCATION HOOK
// DawinOS v2.0 - Capital Hub Module
// React hook for Capital Allocation & Fund Management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  AllocationFund,
  FundMetrics,
  LPCommitment,
  CapitalCall,
  Distribution,
  PortfolioInvestment,
  LPReport,
  AllocationAnalytics,
  WaterfallCalculation,
  AllocationFundFilters,
  PortfolioInvestmentFilters,
} from '../types/allocation.types';
import {
  AllocationFundFormData,
  LPCommitmentFormData,
  CapitalCallFormData,
  DistributionFormData,
  PortfolioInvestmentFormData,
  ValuationRecordFormData,
  LPReportFormData,
  ExitRecordFormData,
} from '../schemas/allocation.schemas';
import {
  AllocationFundStatus,
  CapitalCallStatus,
  PortfolioInvestmentStatus,
} from '../constants/allocation.constants';
import * as allocationService from '../services/allocationService';

interface UseAllocationOptions {
  organizationId: string;
  fundId?: string;
  autoLoad?: boolean;
}

interface UseAllocationReturn {
  // Fund State
  funds: AllocationFund[];
  selectedFund: AllocationFund | null;
  fundMetrics: FundMetrics | null;
  
  // LP State
  lpCommitments: LPCommitment[];
  
  // Capital Calls State
  capitalCalls: CapitalCall[];
  
  // Distributions State
  distributions: Distribution[];
  waterfallCalculation: WaterfallCalculation | null;
  
  // Portfolio State
  portfolioInvestments: PortfolioInvestment[];
  selectedInvestment: PortfolioInvestment | null;
  
  // Reports State
  lpReports: LPReport[];
  
  // Analytics State
  analytics: AllocationAnalytics | null;
  
  // Loading & Error State
  isLoading: boolean;
  error: string | null;
  
  // Fund Operations
  loadFunds: (filters?: AllocationFundFilters) => Promise<void>;
  loadFund: (fundId: string) => Promise<void>;
  createFund: (data: AllocationFundFormData, userId: string) => Promise<string | null>;
  updateFund: (fundId: string, data: Partial<AllocationFundFormData>, userId: string) => Promise<boolean>;
  updateFundStatus: (fundId: string, status: AllocationFundStatus, userId: string) => Promise<boolean>;
  refreshMetrics: () => Promise<void>;
  
  // LP Operations
  loadLPCommitments: (status?: string) => Promise<void>;
  addLPCommitment: (data: LPCommitmentFormData, userId: string) => Promise<string | null>;
  getLPCommitment: (commitmentId: string) => Promise<LPCommitment | null>;
  
  // Capital Call Operations
  loadCapitalCalls: (status?: CapitalCallStatus) => Promise<void>;
  createCapitalCall: (data: CapitalCallFormData, userId: string) => Promise<string | null>;
  issueCapitalCall: (callId: string, userId: string) => Promise<boolean>;
  recordLPFunding: (callId: string, lpCommitmentId: string, amount: number, userId: string) => Promise<boolean>;
  
  // Distribution Operations
  loadDistributions: (status?: string) => Promise<void>;
  createDistribution: (data: DistributionFormData, userId: string) => Promise<string | null>;
  approveDistribution: (distributionId: string, userId: string) => Promise<boolean>;
  payDistribution: (distributionId: string, userId: string) => Promise<boolean>;
  calculateWaterfall: (amount: number) => Promise<void>;
  
  // Portfolio Operations
  loadPortfolioInvestments: (filters?: PortfolioInvestmentFilters) => Promise<void>;
  loadPortfolioInvestment: (investmentId: string) => Promise<void>;
  createPortfolioInvestment: (data: PortfolioInvestmentFormData, userId: string) => Promise<string | null>;
  updateValuation: (investmentId: string, data: ValuationRecordFormData, userId: string) => Promise<boolean>;
  recordFollowOn: (investmentId: string, amount: number, date: Date, userId: string) => Promise<boolean>;
  recordExit: (investmentId: string, data: ExitRecordFormData, userId: string) => Promise<boolean>;
  updateInvestmentStatus: (investmentId: string, status: PortfolioInvestmentStatus, notes: string | undefined, userId: string) => Promise<boolean>;
  
  // Report Operations
  loadLPReports: (status?: string) => Promise<void>;
  createLPReport: (data: LPReportFormData, userId: string) => Promise<string | null>;
  distributeLPReport: (reportId: string, userId: string) => Promise<boolean>;
  
  // Analytics
  loadAnalytics: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  setSelectedFund: (fund: AllocationFund | null) => void;
  setSelectedInvestment: (investment: PortfolioInvestment | null) => void;
}

export function useAllocation({
  organizationId,
  fundId,
  autoLoad = true,
}: UseAllocationOptions): UseAllocationReturn {
  // State
  const [funds, setFunds] = useState<AllocationFund[]>([]);
  const [selectedFund, setSelectedFund] = useState<AllocationFund | null>(null);
  const [fundMetrics, setFundMetrics] = useState<FundMetrics | null>(null);
  const [lpCommitments, setLPCommitments] = useState<LPCommitment[]>([]);
  const [capitalCalls, setCapitalCalls] = useState<CapitalCall[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [waterfallCalculation, setWaterfallCalculation] = useState<WaterfallCalculation | null>(null);
  const [portfolioInvestments, setPortfolioInvestments] = useState<PortfolioInvestment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<PortfolioInvestment | null>(null);
  const [lpReports, setLPReports] = useState<LPReport[]>([]);
  const [analytics, setAnalytics] = useState<AllocationAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clearError = useCallback(() => setError(null), []);
  
  // Fund Operations
  const loadFunds = useCallback(async (filters?: AllocationFundFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getAllocationFunds(organizationId, filters);
      setFunds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funds');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);
  
  const loadFund = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fund = await allocationService.getAllocationFund(organizationId, id);
      setSelectedFund(fund);
      if (fund?.metrics) {
        setFundMetrics(fund.metrics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fund');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);
  
  const createFund = useCallback(async (data: AllocationFundFormData, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createAllocationFund(organizationId, data, userId);
      await loadFunds();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fund');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, loadFunds]);
  
  const updateFund = useCallback(async (id: string, data: Partial<AllocationFundFormData>, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.updateAllocationFund(organizationId, id, data, userId);
      await loadFund(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fund');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, loadFund]);
  
  const updateFundStatus = useCallback(async (id: string, status: AllocationFundStatus, userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.updateAllocationFundStatus(organizationId, id, status, userId);
      await loadFund(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update fund status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, loadFund]);
  
  const refreshMetrics = useCallback(async () => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const metrics = await allocationService.calculateFundMetrics(organizationId, fundId);
      setFundMetrics(metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate metrics');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  // LP Operations
  const loadLPCommitments = useCallback(async (status?: string) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getLPCommitments(organizationId, fundId, status);
      setLPCommitments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LP commitments');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const addLPCommitment = useCallback(async (data: LPCommitmentFormData, userId: string) => {
    if (!fundId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createLPCommitment(organizationId, fundId, data, userId);
      await loadLPCommitments();
      await refreshMetrics();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add LP commitment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadLPCommitments, refreshMetrics]);
  
  const getLPCommitment = useCallback(async (commitmentId: string) => {
    if (!fundId) return null;
    try {
      return await allocationService.getLPCommitment(organizationId, fundId, commitmentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get LP commitment');
      return null;
    }
  }, [organizationId, fundId]);
  
  // Capital Call Operations
  const loadCapitalCalls = useCallback(async (status?: CapitalCallStatus) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getCapitalCalls(organizationId, fundId, status);
      setCapitalCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load capital calls');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const createCapitalCall = useCallback(async (data: CapitalCallFormData, userId: string) => {
    if (!fundId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createCapitalCall(organizationId, fundId, data, userId);
      await loadCapitalCalls();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create capital call');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadCapitalCalls]);
  
  const issueCapitalCall = useCallback(async (callId: string, userId: string) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.issueCapitalCall(organizationId, fundId, callId, userId);
      await loadCapitalCalls();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue capital call');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadCapitalCalls]);
  
  const recordLPFunding = useCallback(async (
    callId: string,
    lpCommitmentId: string,
    amount: number,
    userId: string
  ) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.recordLPFunding(organizationId, fundId, callId, lpCommitmentId, amount, userId);
      await loadCapitalCalls();
      await loadLPCommitments();
      await refreshMetrics();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record LP funding');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadCapitalCalls, loadLPCommitments, refreshMetrics]);
  
  // Distribution Operations
  const loadDistributions = useCallback(async (status?: string) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getDistributions(organizationId, fundId, status);
      setDistributions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load distributions');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const createDistribution = useCallback(async (data: DistributionFormData, userId: string) => {
    if (!fundId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createDistribution(organizationId, fundId, data, userId);
      await loadDistributions();
      await refreshMetrics();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create distribution');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadDistributions, refreshMetrics]);
  
  const approveDistribution = useCallback(async (distributionId: string, userId: string) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.approveDistribution(organizationId, fundId, distributionId, userId);
      await loadDistributions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve distribution');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadDistributions]);
  
  const payDistribution = useCallback(async (distributionId: string, userId: string) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.payDistribution(organizationId, fundId, distributionId, userId);
      await loadDistributions();
      await loadLPCommitments();
      await refreshMetrics();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pay distribution');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadDistributions, loadLPCommitments, refreshMetrics]);
  
  const calculateWaterfall = useCallback(async (amount: number) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const calculation = await allocationService.calculateWaterfall(organizationId, fundId, amount);
      setWaterfallCalculation(calculation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate waterfall');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  // Portfolio Operations
  const loadPortfolioInvestments = useCallback(async (filters?: PortfolioInvestmentFilters) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getPortfolioInvestments(organizationId, fundId, filters);
      setPortfolioInvestments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio investments');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const loadPortfolioInvestment = useCallback(async (investmentId: string) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const investment = await allocationService.getPortfolioInvestment(organizationId, fundId, investmentId);
      setSelectedInvestment(investment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investment');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const createPortfolioInvestment = useCallback(async (data: PortfolioInvestmentFormData, userId: string) => {
    if (!fundId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createPortfolioInvestment(organizationId, fundId, data, userId);
      await loadPortfolioInvestments();
      await refreshMetrics();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create investment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadPortfolioInvestments, refreshMetrics]);
  
  const updateValuation = useCallback(async (
    investmentId: string,
    data: ValuationRecordFormData,
    userId: string
  ) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.updateInvestmentValuation(organizationId, fundId, investmentId, data, userId);
      await loadPortfolioInvestments();
      await refreshMetrics();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update valuation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadPortfolioInvestments, refreshMetrics]);
  
  const recordFollowOn = useCallback(async (
    investmentId: string,
    amount: number,
    date: Date,
    userId: string
  ) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.recordFollowOnInvestment(organizationId, fundId, investmentId, amount, date, userId);
      await loadPortfolioInvestments();
      await refreshMetrics();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record follow-on');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadPortfolioInvestments, refreshMetrics]);
  
  const recordExit = useCallback(async (
    investmentId: string,
    data: ExitRecordFormData,
    userId: string
  ) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.recordExit(organizationId, fundId, investmentId, data, userId);
      await loadPortfolioInvestments();
      await refreshMetrics();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record exit');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadPortfolioInvestments, refreshMetrics]);
  
  const updateInvestmentStatus = useCallback(async (
    investmentId: string,
    status: PortfolioInvestmentStatus,
    notes: string | undefined,
    userId: string
  ) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.updateInvestmentStatus(organizationId, fundId, investmentId, status, notes, userId);
      await loadPortfolioInvestments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update investment status');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadPortfolioInvestments]);
  
  // Report Operations
  const loadLPReports = useCallback(async (status?: string) => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.getLPReports(organizationId, fundId, status);
      setLPReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load LP reports');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  const createLPReport = useCallback(async (data: LPReportFormData, userId: string) => {
    if (!fundId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const id = await allocationService.createLPReport(organizationId, fundId, data, userId);
      await loadLPReports();
      return id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create LP report');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadLPReports]);
  
  const distributeLPReport = useCallback(async (reportId: string, userId: string) => {
    if (!fundId) return false;
    setIsLoading(true);
    setError(null);
    try {
      await allocationService.distributeLPReport(organizationId, fundId, reportId, userId);
      await loadLPReports();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to distribute report');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId, loadLPReports]);
  
  // Analytics
  const loadAnalytics = useCallback(async () => {
    if (!fundId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await allocationService.calculateAllocationAnalytics(organizationId, fundId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, fundId]);
  
  // Auto-load on mount
  useEffect(() => {
    if (autoLoad && organizationId) {
      loadFunds();
    }
  }, [autoLoad, organizationId, loadFunds]);
  
  // Auto-load fund data when fundId changes
  useEffect(() => {
    if (autoLoad && fundId) {
      loadFund(fundId);
      loadLPCommitments();
      loadCapitalCalls();
      loadDistributions();
      loadPortfolioInvestments();
      loadLPReports();
    }
  }, [autoLoad, fundId, loadFund, loadLPCommitments, loadCapitalCalls, loadDistributions, loadPortfolioInvestments, loadLPReports]);
  
  return {
    // State
    funds,
    selectedFund,
    fundMetrics,
    lpCommitments,
    capitalCalls,
    distributions,
    waterfallCalculation,
    portfolioInvestments,
    selectedInvestment,
    lpReports,
    analytics,
    isLoading,
    error,
    
    // Fund Operations
    loadFunds,
    loadFund,
    createFund,
    updateFund,
    updateFundStatus,
    refreshMetrics,
    
    // LP Operations
    loadLPCommitments,
    addLPCommitment,
    getLPCommitment,
    
    // Capital Call Operations
    loadCapitalCalls,
    createCapitalCall,
    issueCapitalCall,
    recordLPFunding,
    
    // Distribution Operations
    loadDistributions,
    createDistribution,
    approveDistribution,
    payDistribution,
    calculateWaterfall,
    
    // Portfolio Operations
    loadPortfolioInvestments,
    loadPortfolioInvestment,
    createPortfolioInvestment,
    updateValuation,
    recordFollowOn,
    recordExit,
    updateInvestmentStatus,
    
    // Report Operations
    loadLPReports,
    createLPReport,
    distributeLPReport,
    
    // Analytics
    loadAnalytics,
    
    // Utilities
    clearError,
    setSelectedFund,
    setSelectedInvestment,
  };
}
