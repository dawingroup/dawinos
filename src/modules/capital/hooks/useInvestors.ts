// ============================================================================
// INVESTORS HOOK
// DawinOS v2.0 - Capital Hub Module
// React hook for Investor CRM
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Investor,
  InvestorContact,
  Communication,
  InvestorMeeting,
  RelationshipHealthMetrics,
  InvestorAnalytics,
  InvestorFilters,
  CommunicationFilters,
  MeetingFilters,
} from '../types/investor.types';
import {
  InvestorInput,
  InvestorContactInput,
  CommunicationInput,
  InvestorMeetingInput,
  MeetingOutcomeInput,
} from '../schemas/investor.schemas';
import {
  getInvestors,
  getInvestor,
  createInvestor,
  updateInvestor,
  deleteInvestor,
  addContact,
  updateContact,
  removeContact,
  getCommunications,
  logCommunication,
  getMeetings,
  getMeeting,
  scheduleMeeting,
  updateMeeting,
  completeMeeting,
  cancelMeeting,
  recalculateRelationshipHealth,
  getInvestorAnalytics,
  findMatchingInvestors,
} from '../services/investorService';

interface UseInvestorsOptions {
  companyId: string;
  autoLoad?: boolean;
}

interface UseInvestorsReturn {
  // Data
  investors: Investor[];
  selectedInvestor: Investor | null;
  communications: Communication[];
  meetings: InvestorMeeting[];
  analytics: InvestorAnalytics | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Investor operations
  loadInvestors: (filters?: InvestorFilters) => Promise<void>;
  loadInvestor: (investorId: string) => Promise<Investor | null>;
  addInvestor: (input: InvestorInput, ownerId: string, ownerName: string) => Promise<Investor | null>;
  editInvestor: (investorId: string, updates: Partial<InvestorInput>) => Promise<Investor | null>;
  removeInvestor: (investorId: string) => Promise<boolean>;
  setSelectedInvestor: (investor: Investor | null) => void;
  
  // Contact operations
  addInvestorContact: (investorId: string, input: InvestorContactInput) => Promise<InvestorContact | null>;
  editContact: (investorId: string, contactId: string, updates: Partial<InvestorContactInput>) => Promise<InvestorContact | null>;
  deleteContact: (investorId: string, contactId: string) => Promise<boolean>;
  
  // Communication operations
  loadCommunications: (filters?: CommunicationFilters) => Promise<void>;
  addCommunication: (input: CommunicationInput, loggedBy: string) => Promise<Communication | null>;
  
  // Meeting operations
  loadMeetings: (filters?: MeetingFilters) => Promise<void>;
  addMeeting: (input: InvestorMeetingInput, createdBy: string) => Promise<InvestorMeeting | null>;
  editMeeting: (meetingId: string, updates: Partial<InvestorMeetingInput>) => Promise<InvestorMeeting | null>;
  finishMeeting: (meetingId: string, input: MeetingOutcomeInput) => Promise<InvestorMeeting | null>;
  cancelMeetingById: (meetingId: string, reason?: string) => Promise<boolean>;
  
  // Health and analytics
  refreshHealth: (investorId: string) => Promise<RelationshipHealthMetrics | null>;
  loadAnalytics: () => Promise<void>;
  
  // Matching
  findMatches: (criteria: { sector?: string; stage?: string; amount?: number; geography?: string }) => Promise<Investor[]>;
  
  // Utility
  clearError: () => void;
}

export const useInvestors = ({
  companyId,
  autoLoad = true,
}: UseInvestorsOptions): UseInvestorsReturn => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [meetings, setMeetings] = useState<InvestorMeeting[]>([]);
  const [analytics, setAnalytics] = useState<InvestorAnalytics | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // =========================================================================
  // INVESTOR OPERATIONS
  // =========================================================================

  const loadInvestors = useCallback(async (filters?: InvestorFilters) => {
    if (!companyId) return;
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
    if (!companyId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInvestor(companyId, investorId);
      setSelectedInvestor(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investor');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const addInvestor = useCallback(async (
    input: InvestorInput,
    ownerId: string,
    ownerName: string
  ): Promise<Investor | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const investor = await createInvestor(companyId, input, ownerId, ownerName);
      setInvestors(prev => [...prev, investor]);
      return investor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create investor');
      return null;
    }
  }, [companyId]);

  const editInvestor = useCallback(async (
    investorId: string,
    updates: Partial<InvestorInput>
  ): Promise<Investor | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const updated = await updateInvestor(companyId, investorId, updates);
      setInvestors(prev => prev.map(i => i.id === investorId ? updated : i));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(updated);
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update investor');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  const removeInvestor = useCallback(async (investorId: string): Promise<boolean> => {
    if (!companyId) return false;
    setError(null);
    try {
      await deleteInvestor(companyId, investorId);
      setInvestors(prev => prev.filter(i => i.id !== investorId));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(null);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete investor');
      return false;
    }
  }, [companyId, selectedInvestor?.id]);

  // =========================================================================
  // CONTACT OPERATIONS
  // =========================================================================

  const addInvestorContact = useCallback(async (
    investorId: string,
    input: InvestorContactInput
  ): Promise<InvestorContact | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const contact = await addContact(companyId, investorId, input);
      // Refresh investor to get updated contacts
      const updated = await getInvestor(companyId, investorId);
      setInvestors(prev => prev.map(i => i.id === investorId ? updated! : i));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(updated);
      }
      return contact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add contact');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  const editContact = useCallback(async (
    investorId: string,
    contactId: string,
    updates: Partial<InvestorContactInput>
  ): Promise<InvestorContact | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const contact = await updateContact(companyId, investorId, contactId, updates);
      const updated = await getInvestor(companyId, investorId);
      setInvestors(prev => prev.map(i => i.id === investorId ? updated! : i));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(updated);
      }
      return contact;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contact');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  const deleteContact = useCallback(async (
    investorId: string,
    contactId: string
  ): Promise<boolean> => {
    if (!companyId) return false;
    setError(null);
    try {
      await removeContact(companyId, investorId, contactId);
      const updated = await getInvestor(companyId, investorId);
      setInvestors(prev => prev.map(i => i.id === investorId ? updated! : i));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(updated);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
      return false;
    }
  }, [companyId, selectedInvestor?.id]);

  // =========================================================================
  // COMMUNICATION OPERATIONS
  // =========================================================================

  const loadCommunications = useCallback(async (filters?: CommunicationFilters) => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCommunications(companyId, filters);
      setCommunications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load communications');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const addCommunication = useCallback(async (
    input: CommunicationInput,
    loggedBy: string
  ): Promise<Communication | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const comm = await logCommunication(companyId, input, loggedBy);
      setCommunications(prev => [comm, ...prev]);
      // Refresh investor
      const updated = await getInvestor(companyId, input.investorId);
      setInvestors(prev => prev.map(i => i.id === input.investorId ? updated! : i));
      if (selectedInvestor?.id === input.investorId) {
        setSelectedInvestor(updated);
      }
      return comm;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log communication');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  // =========================================================================
  // MEETING OPERATIONS
  // =========================================================================

  const loadMeetings = useCallback(async (filters?: MeetingFilters) => {
    if (!companyId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMeetings(companyId, filters);
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const addMeeting = useCallback(async (
    input: InvestorMeetingInput,
    createdBy: string
  ): Promise<InvestorMeeting | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const meeting = await scheduleMeeting(companyId, input, createdBy);
      setMeetings(prev => [meeting, ...prev]);
      return meeting;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule meeting');
      return null;
    }
  }, [companyId]);

  const editMeeting = useCallback(async (
    meetingId: string,
    updates: Partial<InvestorMeetingInput>
  ): Promise<InvestorMeeting | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const updated = await updateMeeting(companyId, meetingId, updates);
      setMeetings(prev => prev.map(m => m.id === meetingId ? updated : m));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update meeting');
      return null;
    }
  }, [companyId]);

  const finishMeeting = useCallback(async (
    meetingId: string,
    input: MeetingOutcomeInput
  ): Promise<InvestorMeeting | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const updated = await completeMeeting(companyId, meetingId, input);
      setMeetings(prev => prev.map(m => m.id === meetingId ? updated : m));
      // Refresh investor if meeting was completed
      if (input.status === 'completed') {
        const meeting = await getMeeting(companyId, meetingId);
        if (meeting) {
          const investor = await getInvestor(companyId, meeting.investorId);
          if (investor) {
            setInvestors(prev => prev.map(i => i.id === meeting.investorId ? investor : i));
            if (selectedInvestor?.id === meeting.investorId) {
              setSelectedInvestor(investor);
            }
          }
        }
      }
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete meeting');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  const cancelMeetingById = useCallback(async (
    meetingId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!companyId) return false;
    setError(null);
    try {
      await cancelMeeting(companyId, meetingId, reason);
      setMeetings(prev => prev.map(m => 
        m.id === meetingId ? { ...m, status: 'cancelled' as const } : m
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel meeting');
      return false;
    }
  }, [companyId]);

  // =========================================================================
  // HEALTH AND ANALYTICS
  // =========================================================================

  const refreshHealth = useCallback(async (
    investorId: string
  ): Promise<RelationshipHealthMetrics | null> => {
    if (!companyId) return null;
    setError(null);
    try {
      const health = await recalculateRelationshipHealth(companyId, investorId);
      // Refresh investor
      const updated = await getInvestor(companyId, investorId);
      setInvestors(prev => prev.map(i => i.id === investorId ? updated! : i));
      if (selectedInvestor?.id === investorId) {
        setSelectedInvestor(updated);
      }
      return health;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh health');
      return null;
    }
  }, [companyId, selectedInvestor?.id]);

  const loadAnalytics = useCallback(async () => {
    if (!companyId) return;
    setError(null);
    try {
      const data = await getInvestorAnalytics(companyId);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  }, [companyId]);

  // =========================================================================
  // MATCHING
  // =========================================================================

  const findMatches = useCallback(async (
    criteria: { sector?: string; stage?: string; amount?: number; geography?: string }
  ): Promise<Investor[]> => {
    if (!companyId) return [];
    setError(null);
    try {
      return await findMatchingInvestors(companyId, criteria);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find matches');
      return [];
    }
  }, [companyId]);

  // =========================================================================
  // AUTO-LOAD
  // =========================================================================

  useEffect(() => {
    if (autoLoad && companyId) {
      loadInvestors();
      loadAnalytics();
    }
  }, [autoLoad, companyId, loadInvestors, loadAnalytics]);

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    // Data
    investors,
    selectedInvestor,
    communications,
    meetings,
    analytics,
    
    // State
    isLoading,
    error,
    
    // Investor operations
    loadInvestors,
    loadInvestor,
    addInvestor,
    editInvestor,
    removeInvestor,
    setSelectedInvestor,
    
    // Contact operations
    addInvestorContact,
    editContact,
    deleteContact,
    
    // Communication operations
    loadCommunications,
    addCommunication,
    
    // Meeting operations
    loadMeetings,
    addMeeting,
    editMeeting,
    finishMeeting,
    cancelMeetingById,
    
    // Health and analytics
    refreshHealth,
    loadAnalytics,
    
    // Matching
    findMatches,
    
    // Utility
    clearError,
  };
};
