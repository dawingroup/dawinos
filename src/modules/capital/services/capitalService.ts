// ============================================================================
// CAPITAL HUB SERVICE
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase/firestore';
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
  FundFilters,
  StageMetrics,
} from '../types/capital.types';
import {
  DEALS_COLLECTION,
  INVESTORS_COLLECTION,
  COMMITMENTS_COLLECTION,
  DEAL_ACTIVITIES_COLLECTION,
  FUNDS_COLLECTION,
  DEAL_STAGE_PROBABILITY,
  DealStage,
  InvestorType,
  InvestorStatus,
} from '../constants/capital.constants';
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

// ----------------------------------------------------------------------------
// DEALS
// ----------------------------------------------------------------------------

export const createDeal = async (
  companyId: string,
  input: DealInput,
  advisorName: string,
  userId: string
): Promise<Deal> => {
  const collectionRef = collection(db, DEALS_COLLECTION);
  
  const deal: Omit<Deal, 'id'> = {
    companyId,
    name: input.name,
    description: input.description,
    sector: input.sector,
    investmentType: input.investmentType,
    targetAmount: input.targetAmount,
    minimumTicket: input.minimumTicket,
    maximumTicket: input.maximumTicket,
    currency: input.currency,
    preMoneyValuation: input.preMoneyValuation,
    equityOffered: input.equityOffered,
    interestRate: input.interestRate,
    tenor: input.tenor,
    stage: input.stage,
    expectedCloseDate: input.expectedCloseDate,
    leadAdvisorId: input.leadAdvisorId,
    leadAdvisorName: advisorName,
    teamMemberIds: input.teamMemberIds || [],
    targetEntityName: input.targetEntityName,
    targetEntityType: input.targetEntityType,
    location: input.location,
    dealStartDate: input.dealStartDate,
    tags: input.tags,
    notes: input.notes,
    probability: DEAL_STAGE_PROBABILITY[input.stage],
    amountRaised: 0,
    amountCommitted: 0,
    interestedInvestors: [],
    committedInvestors: [],
    isActive: true,
    createdBy: userId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, deal);
  
  // Log activity
  await logDealActivity(docRef.id, {
    dealId: docRef.id,
    type: 'note',
    title: 'Deal created',
    description: `Deal "${input.name}" was created`,
  }, userId, advisorName);
  
  return { id: docRef.id, ...deal };
};

export const getDeal = async (dealId: string): Promise<Deal | null> => {
  const docRef = doc(db, DEALS_COLLECTION, dealId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    dealStartDate: data.dealStartDate?.toDate?.() || data.dealStartDate,
    expectedCloseDate: data.expectedCloseDate?.toDate?.() || data.expectedCloseDate,
    closedDate: data.closedDate?.toDate?.() || data.closedDate,
  } as Deal;
};

export const getDeals = async (
  companyId: string,
  filters: DealFilters = {}
): Promise<Deal[]> => {
  let q = query(
    collection(db, DEALS_COLLECTION),
    where('companyId', '==', companyId),
    orderBy('updatedAt', 'desc')
  );
  
  if (filters.isActive !== undefined) {
    q = query(q, where('isActive', '==', filters.isActive));
  }
  
  if (filters.stage) {
    q = query(q, where('stage', '==', filters.stage));
  }
  
  if (filters.leadAdvisorId) {
    q = query(q, where('leadAdvisorId', '==', filters.leadAdvisorId));
  }
  
  const snapshot = await getDocs(q);
  let deals = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      dealStartDate: data.dealStartDate?.toDate?.() || data.dealStartDate,
      expectedCloseDate: data.expectedCloseDate?.toDate?.() || data.expectedCloseDate,
      closedDate: data.closedDate?.toDate?.() || data.closedDate,
    } as Deal;
  });
  
  // Apply additional filters in memory
  if (filters.stages?.length) {
    deals = deals.filter(d => filters.stages!.includes(d.stage));
  }
  
  if (filters.sector) {
    deals = deals.filter(d => d.sector === filters.sector);
  }
  
  if (filters.investmentType) {
    deals = deals.filter(d => d.investmentType === filters.investmentType);
  }
  
  if (filters.minAmount !== undefined) {
    deals = deals.filter(d => d.targetAmount >= filters.minAmount!);
  }
  
  if (filters.maxAmount !== undefined) {
    deals = deals.filter(d => d.targetAmount <= filters.maxAmount!);
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    deals = deals.filter(d => 
      d.name.toLowerCase().includes(search) ||
      d.targetEntityName.toLowerCase().includes(search) ||
      d.description.toLowerCase().includes(search)
    );
  }
  
  return deals;
};

export const updateDeal = async (
  dealId: string,
  updates: DealUpdateInput
): Promise<void> => {
  const docRef = doc(db, DEALS_COLLECTION, dealId);
  
  const updateData: Record<string, unknown> = {
    ...updates,
    updatedAt: Timestamp.now(),
  };
  
  if (updates.stage) {
    updateData.probability = DEAL_STAGE_PROBABILITY[updates.stage];
  }
  
  await updateDoc(docRef, updateData);
};

export const updateDealStage = async (
  dealId: string,
  input: StageChangeInput,
  userId: string,
  userName: string
): Promise<void> => {
  const deal = await getDeal(dealId);
  if (!deal) throw new Error('Deal not found');
  
  const previousStage = deal.stage;
  const isClosing = ['closed_won', 'closed_lost'].includes(input.newStage);
  
  // Update deal
  const updateData: Record<string, unknown> = {
    stage: input.newStage,
    probability: DEAL_STAGE_PROBABILITY[input.newStage],
    isActive: !isClosing,
    updatedAt: Timestamp.now(),
  };
  
  if (isClosing) {
    updateData.closedDate = new Date();
  }
  
  if (input.newStage === 'closed_lost' && input.lostReason) {
    updateData.lostReason = input.lostReason;
  }
  
  await updateDoc(doc(db, DEALS_COLLECTION, dealId), updateData);
  
  // Log activity
  await logDealActivity(dealId, {
    dealId,
    type: 'stage_change',
    title: `Stage changed: ${previousStage} → ${input.newStage}`,
    description: input.notes,
  }, userId, userName);
};

export const deleteDeal = async (dealId: string): Promise<void> => {
  await deleteDoc(doc(db, DEALS_COLLECTION, dealId));
};

export const addInterestedInvestor = async (
  dealId: string,
  investorId: string
): Promise<void> => {
  const deal = await getDeal(dealId);
  if (!deal) throw new Error('Deal not found');
  
  if (!deal.interestedInvestors.includes(investorId)) {
    await updateDoc(doc(db, DEALS_COLLECTION, dealId), {
      interestedInvestors: [...deal.interestedInvestors, investorId],
      updatedAt: Timestamp.now(),
    });
  }
};

// ----------------------------------------------------------------------------
// INVESTORS
// ----------------------------------------------------------------------------

export const createInvestor = async (
  companyId: string,
  input: InvestorInput,
  ownerName: string
): Promise<Investor> => {
  const collectionRef = collection(db, INVESTORS_COLLECTION);
  
  const investor: Omit<Investor, 'id'> = {
    companyId,
    name: input.name,
    type: input.type,
    status: 'prospect',
    primaryContactName: input.primaryContactName,
    primaryContactEmail: input.primaryContactEmail,
    primaryContactPhone: input.primaryContactPhone,
    organizationName: input.organizationName,
    organizationType: input.organizationType,
    headquarters: input.headquarters,
    website: input.website,
    investmentFocus: input.investmentFocus,
    sectorPreferences: input.sectorPreferences,
    geographicFocus: input.geographicFocus,
    minTicketSize: input.minTicketSize,
    maxTicketSize: input.maxTicketSize,
    preferredCurrency: input.preferredCurrency,
    investmentTypesPreferred: input.investmentTypesPreferred,
    relationshipOwnerId: input.relationshipOwnerId,
    relationshipOwnerName: ownerName,
    source: input.source,
    tags: input.tags,
    notes: input.notes,
    kycStatus: 'pending',
    activeDeals: [],
    closedDeals: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, investor);
  return { id: docRef.id, ...investor };
};

export const getInvestor = async (investorId: string): Promise<Investor | null> => {
  const docRef = doc(db, INVESTORS_COLLECTION, investorId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    lastContactDate: data.lastContactDate?.toDate?.() || data.lastContactDate,
    nextFollowUpDate: data.nextFollowUpDate?.toDate?.() || data.nextFollowUpDate,
    kycExpiryDate: data.kycExpiryDate?.toDate?.() || data.kycExpiryDate,
  } as Investor;
};

export const getInvestors = async (
  companyId: string,
  filters: InvestorFilters = {}
): Promise<Investor[]> => {
  let q = query(
    collection(db, INVESTORS_COLLECTION),
    where('companyId', '==', companyId),
    orderBy('name')
  );
  
  if (filters.type) {
    q = query(q, where('type', '==', filters.type));
  }
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters.relationshipOwnerId) {
    q = query(q, where('relationshipOwnerId', '==', filters.relationshipOwnerId));
  }
  
  if (filters.kycStatus) {
    q = query(q, where('kycStatus', '==', filters.kycStatus));
  }
  
  const snapshot = await getDocs(q);
  let investors = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      lastContactDate: data.lastContactDate?.toDate?.() || data.lastContactDate,
      nextFollowUpDate: data.nextFollowUpDate?.toDate?.() || data.nextFollowUpDate,
      kycExpiryDate: data.kycExpiryDate?.toDate?.() || data.kycExpiryDate,
    } as Investor;
  });
  
  // Apply additional filters
  if (filters.minTicketSize !== undefined) {
    investors = investors.filter(i => i.maxTicketSize >= filters.minTicketSize!);
  }
  
  if (filters.maxTicketSize !== undefined) {
    investors = investors.filter(i => i.minTicketSize <= filters.maxTicketSize!);
  }
  
  if (filters.sectors?.length) {
    investors = investors.filter(i => 
      i.sectorPreferences.some(s => filters.sectors!.includes(s))
    );
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    investors = investors.filter(i => 
      i.name.toLowerCase().includes(search) ||
      i.primaryContactName.toLowerCase().includes(search) ||
      i.organizationName?.toLowerCase().includes(search)
    );
  }
  
  return investors;
};

export const updateInvestor = async (
  investorId: string,
  updates: InvestorUpdateInput
): Promise<void> => {
  await updateDoc(doc(db, INVESTORS_COLLECTION, investorId), {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const updateInvestorStatus = async (
  investorId: string,
  status: InvestorStatus
): Promise<void> => {
  await updateDoc(doc(db, INVESTORS_COLLECTION, investorId), {
    status,
    updatedAt: Timestamp.now(),
  });
};

export const recordInvestorContact = async (
  investorId: string,
  nextFollowUpDate?: Date
): Promise<void> => {
  const updates: Record<string, unknown> = {
    lastContactDate: new Date(),
    updatedAt: Timestamp.now(),
  };
  
  if (nextFollowUpDate) {
    updates.nextFollowUpDate = nextFollowUpDate;
  }
  
  await updateDoc(doc(db, INVESTORS_COLLECTION, investorId), updates);
};

export const deleteInvestor = async (investorId: string): Promise<void> => {
  await deleteDoc(doc(db, INVESTORS_COLLECTION, investorId));
};

// ----------------------------------------------------------------------------
// COMMITMENTS
// ----------------------------------------------------------------------------

export const createCommitment = async (
  companyId: string,
  input: CommitmentInput,
  dealName: string,
  investorName: string
): Promise<InvestorCommitment> => {
  const collectionRef = collection(db, COMMITMENTS_COLLECTION);
  
  const commitment: Omit<InvestorCommitment, 'id'> = {
    companyId,
    dealId: input.dealId,
    dealName,
    investorId: input.investorId,
    investorName,
    committedAmount: input.committedAmount,
    currency: input.currency,
    commitmentDate: input.commitmentDate,
    investmentType: input.investmentType,
    equityPercentage: input.equityPercentage,
    interestRate: input.interestRate,
    status: 'soft',
    fundedAmount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, commitment);
  
  // Update deal amounts
  const deal = await getDeal(input.dealId);
  if (deal) {
    const newCommittedInvestors = deal.committedInvestors.includes(input.investorId)
      ? deal.committedInvestors
      : [...deal.committedInvestors, input.investorId];
    
    await updateDoc(doc(db, DEALS_COLLECTION, input.dealId), {
      amountCommitted: deal.amountCommitted + input.committedAmount,
      committedInvestors: newCommittedInvestors,
      updatedAt: Timestamp.now(),
    });
  }
  
  // Update investor status
  await updateInvestorStatus(input.investorId, 'committed');
  
  return { id: docRef.id, ...commitment };
};

export const getCommitment = async (commitmentId: string): Promise<InvestorCommitment | null> => {
  const docRef = doc(db, COMMITMENTS_COLLECTION, commitmentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    commitmentDate: data.commitmentDate?.toDate?.() || data.commitmentDate,
    fundingDate: data.fundingDate?.toDate?.() || data.fundingDate,
  } as InvestorCommitment;
};

export const getDealCommitments = async (dealId: string): Promise<InvestorCommitment[]> => {
  const q = query(
    collection(db, COMMITMENTS_COLLECTION),
    where('dealId', '==', dealId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      commitmentDate: data.commitmentDate?.toDate?.() || data.commitmentDate,
      fundingDate: data.fundingDate?.toDate?.() || data.fundingDate,
    } as InvestorCommitment;
  });
};

export const getInvestorCommitments = async (investorId: string): Promise<InvestorCommitment[]> => {
  const q = query(
    collection(db, COMMITMENTS_COLLECTION),
    where('investorId', '==', investorId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      commitmentDate: data.commitmentDate?.toDate?.() || data.commitmentDate,
      fundingDate: data.fundingDate?.toDate?.() || data.fundingDate,
    } as InvestorCommitment;
  });
};

export const getCommitments = async (
  companyId: string,
  filters: CommitmentFilters = {}
): Promise<InvestorCommitment[]> => {
  let q = query(
    collection(db, COMMITMENTS_COLLECTION),
    where('companyId', '==', companyId)
  );
  
  if (filters.dealId) {
    q = query(q, where('dealId', '==', filters.dealId));
  }
  
  if (filters.investorId) {
    q = query(q, where('investorId', '==', filters.investorId));
  }
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  const snapshot = await getDocs(q);
  let commitments = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      commitmentDate: data.commitmentDate?.toDate?.() || data.commitmentDate,
      fundingDate: data.fundingDate?.toDate?.() || data.fundingDate,
    } as InvestorCommitment;
  });
  
  if (filters.minAmount !== undefined) {
    commitments = commitments.filter(c => c.committedAmount >= filters.minAmount!);
  }
  
  if (filters.maxAmount !== undefined) {
    commitments = commitments.filter(c => c.committedAmount <= filters.maxAmount!);
  }
  
  return commitments;
};

export const updateCommitmentStatus = async (
  commitmentId: string,
  input: CommitmentStatusUpdateInput
): Promise<void> => {
  const updates: Record<string, unknown> = {
    status: input.status,
    updatedAt: Timestamp.now(),
  };
  
  if (input.fundedAmount !== undefined) {
    updates.fundedAmount = input.fundedAmount;
    if (input.status === 'funded') {
      updates.fundingDate = new Date();
    }
  }
  
  await updateDoc(doc(db, COMMITMENTS_COLLECTION, commitmentId), updates);
  
  // If funded, update deal raised amount and investor status
  if (input.status === 'funded' && input.fundedAmount) {
    const commitment = await getCommitment(commitmentId);
    if (commitment) {
      const deal = await getDeal(commitment.dealId);
      if (deal) {
        await updateDoc(doc(db, DEALS_COLLECTION, commitment.dealId), {
          amountRaised: deal.amountRaised + input.fundedAmount,
          updatedAt: Timestamp.now(),
        });
      }
      await updateInvestorStatus(commitment.investorId, 'invested');
    }
  }
};

export const deleteCommitment = async (commitmentId: string): Promise<void> => {
  const commitment = await getCommitment(commitmentId);
  if (commitment) {
    // Update deal amounts
    const deal = await getDeal(commitment.dealId);
    if (deal) {
      await updateDoc(doc(db, DEALS_COLLECTION, commitment.dealId), {
        amountCommitted: Math.max(0, deal.amountCommitted - commitment.committedAmount),
        amountRaised: Math.max(0, deal.amountRaised - commitment.fundedAmount),
        updatedAt: Timestamp.now(),
      });
    }
  }
  
  await deleteDoc(doc(db, COMMITMENTS_COLLECTION, commitmentId));
};

// ----------------------------------------------------------------------------
// ACTIVITIES
// ----------------------------------------------------------------------------

export const logDealActivity = async (
  dealId: string,
  input: DealActivityInput,
  userId: string,
  userName: string
): Promise<DealActivity> => {
  const collectionRef = collection(db, DEAL_ACTIVITIES_COLLECTION);
  
  const activity: Omit<DealActivity, 'id'> = {
    dealId,
    type: input.type,
    title: input.title,
    description: input.description,
    participants: input.participants,
    investorIds: input.investorIds,
    outcome: input.outcome,
    nextSteps: input.nextSteps,
    performedBy: userId,
    performedByName: userName,
    performedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, activity);
  return { id: docRef.id, ...activity };
};

export const getDealActivities = async (dealId: string): Promise<DealActivity[]> => {
  const q = query(
    collection(db, DEAL_ACTIVITIES_COLLECTION),
    where('dealId', '==', dealId),
    orderBy('performedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DealActivity[];
};

// ----------------------------------------------------------------------------
// FUNDS
// ----------------------------------------------------------------------------

export const createFund = async (
  companyId: string,
  input: FundInput
): Promise<Fund> => {
  const collectionRef = collection(db, FUNDS_COLLECTION);
  
  const fund: Omit<Fund, 'id'> = {
    companyId,
    name: input.name,
    description: input.description,
    vintage: input.vintage,
    targetSize: input.targetSize,
    hardCap: input.hardCap,
    minimumCommitment: input.minimumCommitment,
    currency: input.currency,
    status: input.status,
    fundraisingStartDate: input.fundraisingStartDate,
    fundraisingEndDate: input.fundraisingEndDate,
    investmentPeriodEnd: input.investmentPeriodEnd,
    fundEndDate: input.fundEndDate,
    managementFeeRate: input.managementFeeRate,
    carriedInterestRate: input.carriedInterestRate,
    hurdleRate: input.hurdleRate,
    totalCommitted: 0,
    totalCalled: 0,
    totalDistributed: 0,
    lpCount: 0,
    portfolioCompanyCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collectionRef, fund);
  return { id: docRef.id, ...fund };
};

export const getFund = async (fundId: string): Promise<Fund | null> => {
  const docRef = doc(db, FUNDS_COLLECTION, fundId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    fundraisingStartDate: data.fundraisingStartDate?.toDate?.() || data.fundraisingStartDate,
    fundraisingEndDate: data.fundraisingEndDate?.toDate?.() || data.fundraisingEndDate,
    investmentPeriodEnd: data.investmentPeriodEnd?.toDate?.() || data.investmentPeriodEnd,
    fundEndDate: data.fundEndDate?.toDate?.() || data.fundEndDate,
  } as Fund;
};

export const getFunds = async (
  companyId: string,
  filters: FundFilters = {}
): Promise<Fund[]> => {
  let q = query(
    collection(db, FUNDS_COLLECTION),
    where('companyId', '==', companyId),
    orderBy('vintage', 'desc')
  );
  
  if (filters.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  if (filters.vintage) {
    q = query(q, where('vintage', '==', filters.vintage));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      fundraisingStartDate: data.fundraisingStartDate?.toDate?.() || data.fundraisingStartDate,
      fundraisingEndDate: data.fundraisingEndDate?.toDate?.() || data.fundraisingEndDate,
      investmentPeriodEnd: data.investmentPeriodEnd?.toDate?.() || data.investmentPeriodEnd,
      fundEndDate: data.fundEndDate?.toDate?.() || data.fundEndDate,
    } as Fund;
  });
};

// ----------------------------------------------------------------------------
// ANALYTICS
// ----------------------------------------------------------------------------

export const getPipelineSummary = async (companyId: string): Promise<PipelineSummary> => {
  const deals = await getDeals(companyId, { isActive: true });
  const allDeals = await getDeals(companyId);
  
  const summary: PipelineSummary = {
    totalDeals: deals.length,
    totalPipelineValue: 0,
    weightedPipelineValue: 0,
    byStage: {} as Record<DealStage, StageMetrics>,
    bySector: {},
    byInvestmentType: {} as Record<string, { count: number; value: number }>,
    closedThisMonth: 0,
    closedThisQuarter: 0,
    closedThisYear: 0,
    averageDealSize: 0,
    averageCloseTime: 0,
    conversionRate: 0,
  };
  
  // Initialize stages
  const stages: DealStage[] = [
    'lead', 'qualification', 'proposal', 'negotiation',
    'due_diligence', 'documentation', 'closing', 'closed_won', 'closed_lost'
  ];
  stages.forEach(stage => {
    summary.byStage[stage] = { count: 0, value: 0, weightedValue: 0 };
  });
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  for (const deal of deals) {
    summary.totalPipelineValue += deal.targetAmount;
    summary.weightedPipelineValue += deal.targetAmount * (deal.probability / 100);
    
    // By stage
    summary.byStage[deal.stage].count++;
    summary.byStage[deal.stage].value += deal.targetAmount;
    summary.byStage[deal.stage].weightedValue += deal.targetAmount * (deal.probability / 100);
    
    // By sector
    if (!summary.bySector[deal.sector]) {
      summary.bySector[deal.sector] = { count: 0, value: 0 };
    }
    summary.bySector[deal.sector].count++;
    summary.bySector[deal.sector].value += deal.targetAmount;
    
    // By type
    if (!summary.byInvestmentType[deal.investmentType]) {
      summary.byInvestmentType[deal.investmentType] = { count: 0, value: 0 };
    }
    summary.byInvestmentType[deal.investmentType].count++;
    summary.byInvestmentType[deal.investmentType].value += deal.targetAmount;
  }
  
  // Closed deals stats
  const closedWonDeals = allDeals.filter(d => d.stage === 'closed_won');
  let totalCloseTime = 0;
  
  for (const deal of closedWonDeals) {
    if (deal.closedDate) {
      const closedDate = deal.closedDate instanceof Date ? deal.closedDate : new Date(deal.closedDate);
      
      if (closedDate >= startOfMonth) summary.closedThisMonth++;
      if (closedDate >= startOfQuarter) summary.closedThisQuarter++;
      if (closedDate >= startOfYear) summary.closedThisYear++;
      
      const dealStart = deal.dealStartDate instanceof Date ? deal.dealStartDate : new Date(deal.dealStartDate);
      totalCloseTime += (closedDate.getTime() - dealStart.getTime()) / (1000 * 60 * 60 * 24);
    }
  }
  
  summary.averageDealSize = deals.length > 0 ? summary.totalPipelineValue / deals.length : 0;
  summary.averageCloseTime = closedWonDeals.length > 0 ? totalCloseTime / closedWonDeals.length : 0;
  
  const totalClosed = allDeals.filter(d => ['closed_won', 'closed_lost'].includes(d.stage)).length;
  summary.conversionRate = totalClosed > 0 ? (closedWonDeals.length / totalClosed) * 100 : 0;
  
  return summary;
};

export const getInvestorSummary = async (companyId: string): Promise<InvestorSummary> => {
  const investors = await getInvestors(companyId);
  const commitments = await getCommitments(companyId);
  
  const summary: InvestorSummary = {
    totalInvestors: investors.length,
    activeInvestors: investors.filter(i => ['interested', 'in_discussion', 'committed', 'invested'].includes(i.status)).length,
    byType: {} as Record<InvestorType, number>,
    byStatus: {} as Record<InvestorStatus, number>,
    totalCommitted: 0,
    totalInvested: 0,
    averageTicketSize: 0,
  };
  
  // Initialize types and statuses
  const types: InvestorType[] = ['individual', 'institutional', 'corporate', 'family_office', 'dfi', 'government', 'foundation'];
  types.forEach(t => { summary.byType[t] = 0; });
  
  const statuses: InvestorStatus[] = ['prospect', 'contacted', 'interested', 'in_discussion', 'committed', 'invested', 'dormant'];
  statuses.forEach(s => { summary.byStatus[s] = 0; });
  
  for (const investor of investors) {
    summary.byType[investor.type]++;
    summary.byStatus[investor.status]++;
  }
  
  for (const commitment of commitments) {
    summary.totalCommitted += commitment.committedAmount;
    summary.totalInvested += commitment.fundedAmount;
  }
  
  const fundedCommitments = commitments.filter(c => c.fundedAmount > 0);
  summary.averageTicketSize = fundedCommitments.length > 0 
    ? summary.totalInvested / fundedCommitments.length 
    : 0;
  
  return summary;
};
