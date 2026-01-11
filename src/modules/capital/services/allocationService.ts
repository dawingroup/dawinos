// ============================================================================
// ALLOCATION SERVICE
// DawinOS v2.0 - Capital Hub Module
// Firebase service for Capital Allocation & Fund Management
// ============================================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase/firestore';
import {
  AllocationFund,
  FundMetrics,
  LPCommitment,
  CapitalCall,
  CapitalCallLPResponse,
  Distribution,
  DistributionBreakdown,
  DistributionLPAllocation,
  WaterfallCalculation,
  WaterfallTierCalculation,
  PortfolioInvestment,
  ValuationRecord,
  LPReport,
  AllocationAnalytics,
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
  allocationFundSchema,
  lpCommitmentSchema,
  capitalCallSchema,
  distributionSchema,
  portfolioInvestmentSchema,
  valuationRecordSchema,
  lpReportSchema,
  exitRecordSchema,
} from '../schemas/allocation.schemas';
import {
  ALLOCATION_FUND_STATUS,
  CAPITAL_CALL_STATUS,
  PORTFOLIO_INVESTMENT_STATUS,
  WATERFALL_TIERS,
  AllocationFundStatus,
  CapitalCallStatus,
  PortfolioInvestmentStatus,
  AllocationSector,
  GeographicAllocation,
} from '../constants/allocation.constants';

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

const fundsCollection = (orgId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds');

const lpCommitmentsCollection = (orgId: string, fundId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'lp_commitments');

const capitalCallsCollection = (orgId: string, fundId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'capital_calls');

const distributionsCollection = (orgId: string, fundId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'distributions');

const portfolioInvestmentsCollection = (orgId: string, fundId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'portfolio_investments');

const valuationsCollection = (orgId: string, fundId: string, investmentId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'portfolio_investments', investmentId, 'valuations');

const lpReportsCollection = (orgId: string, fundId: string) => 
  collection(db, 'organizations', orgId, 'allocation_funds', fundId, 'lp_reports');

// ============================================================================
// FUND OPERATIONS
// ============================================================================

export async function createAllocationFund(
  organizationId: string,
  data: AllocationFundFormData,
  userId: string
): Promise<string> {
  const validated = allocationFundSchema.parse(data);
  
  const fund: Omit<AllocationFund, 'id'> = {
    organizationId,
    name: validated.name,
    shortName: validated.shortName,
    fundType: validated.fundType as AllocationFund['fundType'],
    status: ALLOCATION_FUND_STATUS.FORMATION,
    currency: validated.currency as AllocationFund['currency'],
    targetSize: validated.targetSize,
    hardCap: validated.hardCap,
    minCommitment: validated.minCommitment,
    maxCommitment: validated.maxCommitment,
    inceptionDate: Timestamp.fromDate(validated.inceptionDate),
    firstCloseDate: validated.firstCloseDate ? Timestamp.fromDate(validated.firstCloseDate) : undefined,
    finalCloseDate: validated.finalCloseDate ? Timestamp.fromDate(validated.finalCloseDate) : undefined,
    investmentPeriodEndDate: validated.investmentPeriodEndDate ? Timestamp.fromDate(validated.investmentPeriodEndDate) : undefined,
    terminationDate: validated.terminationDate ? Timestamp.fromDate(validated.terminationDate) : undefined,
    terms: validated.terms,
    gpCommitment: validated.gpCommitment,
    gpCommitmentPercentage: validated.gpCommitmentPercentage,
    generalPartner: validated.generalPartner,
    strategy: validated.strategy as AllocationFund['strategy'],
    allocationLimits: validated.allocationLimits,
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  const docRef = await addDoc(fundsCollection(organizationId), fund);
  return docRef.id;
}

export async function getAllocationFund(
  organizationId: string,
  fundId: string
): Promise<AllocationFund | null> {
  const docRef = doc(fundsCollection(organizationId), fundId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as AllocationFund;
}

export async function getAllocationFunds(
  organizationId: string,
  filters?: AllocationFundFilters
): Promise<AllocationFund[]> {
  let q = query(fundsCollection(organizationId), orderBy('createdAt', 'desc'));
  
  if (filters?.status) {
    q = query(
      fundsCollection(organizationId),
      where('status', '==', filters.status),
      orderBy('createdAt', 'desc')
    );
  }
  
  if (filters?.fundType) {
    q = query(
      fundsCollection(organizationId),
      where('fundType', '==', filters.fundType),
      orderBy('createdAt', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  let funds = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AllocationFund));
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    funds = funds.filter(f => 
      f.name.toLowerCase().includes(searchLower) ||
      f.shortName.toLowerCase().includes(searchLower)
    );
  }
  
  return funds;
}

export async function updateAllocationFund(
  organizationId: string,
  fundId: string,
  data: Partial<AllocationFundFormData>,
  userId: string
): Promise<void> {
  const docRef = doc(fundsCollection(organizationId), fundId);
  
  const updateData: Record<string, unknown> = {
    ...data,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  // Convert dates if present
  if (data.inceptionDate) updateData.inceptionDate = Timestamp.fromDate(data.inceptionDate);
  if (data.firstCloseDate) updateData.firstCloseDate = Timestamp.fromDate(data.firstCloseDate);
  if (data.finalCloseDate) updateData.finalCloseDate = Timestamp.fromDate(data.finalCloseDate);
  
  await updateDoc(docRef, updateData);
}

export async function updateAllocationFundStatus(
  organizationId: string,
  fundId: string,
  status: AllocationFundStatus,
  userId: string
): Promise<void> {
  const docRef = doc(fundsCollection(organizationId), fundId);
  
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  });
}

export async function calculateFundMetrics(
  organizationId: string,
  fundId: string
): Promise<FundMetrics> {
  // Get all LP commitments
  const commitments = await getLPCommitments(organizationId, fundId);
  
  // Get all capital calls
  const calls = await getCapitalCalls(organizationId, fundId);
  
  // Get all distributions
  const distributions = await getDistributions(organizationId, fundId);
  
  // Get all portfolio investments
  const investments = await getPortfolioInvestments(organizationId, fundId);
  
  // Calculate totals
  const totalCommitments = commitments.reduce((sum, c) => sum + c.commitmentAmount, 0);
  const capitalCalled = calls
    .filter(c => c.status === CAPITAL_CALL_STATUS.FULLY_FUNDED)
    .reduce((sum, c) => sum + c.totalCallAmount, 0);
  const distributionsPaid = distributions
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + d.totalDistributionAmount, 0);
  
  const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
  const realizedValue = investments.reduce((sum, i) => sum + i.realizedValue, 0);
  const unrealizedValue = investments
    .filter(i => i.status === PORTFOLIO_INVESTMENT_STATUS.ACTIVE)
    .reduce((sum, i) => sum + i.unrealizedValue, 0);
  
  const totalValue = realizedValue + unrealizedValue;
  
  const dpi = capitalCalled > 0 ? distributionsPaid / capitalCalled : 0;
  const rvpi = capitalCalled > 0 ? unrealizedValue / capitalCalled : 0;
  const tvpi = capitalCalled > 0 ? totalValue / capitalCalled : 0;
  const moic = totalInvested > 0 ? totalValue / totalInvested : 0;
  
  // Simple IRR approximation
  const irr = calculateSimpleIRR(capitalCalled, distributionsPaid, unrealizedValue, 3);
  
  const metrics: FundMetrics = {
    totalCommitments,
    capitalCalled,
    capitalCalledPercent: totalCommitments > 0 ? (capitalCalled / totalCommitments) * 100 : 0,
    unfundedCommitments: totalCommitments - capitalCalled,
    distributionsPaid,
    recallableCapital: 0,
    
    totalInvested,
    realizedValue,
    unrealizedValue,
    totalValue,
    dpi,
    rvpi,
    tvpi,
    irr,
    moic,
    
    activeInvestments: investments.filter(i => i.status === PORTFOLIO_INVESTMENT_STATUS.ACTIVE).length,
    realizedInvestments: investments.filter(i => i.status === PORTFOLIO_INVESTMENT_STATUS.REALIZED).length,
    totalInvestments: investments.length,
    
    lpCount: commitments.length,
    
    calculatedAt: Timestamp.now(),
  };
  
  // Update fund with metrics
  const fundRef = doc(fundsCollection(organizationId), fundId);
  await updateDoc(fundRef, { metrics });
  
  return metrics;
}

function calculateSimpleIRR(invested: number, distributions: number, unrealized: number, years: number): number {
  const totalReturn = distributions + unrealized;
  const multiple = invested > 0 ? totalReturn / invested : 0;
  const irr = years > 0 ? Math.pow(multiple, 1 / years) - 1 : 0;
  return irr * 100;
}

// ============================================================================
// LP COMMITMENT OPERATIONS
// ============================================================================

export async function createLPCommitment(
  organizationId: string,
  fundId: string,
  data: LPCommitmentFormData,
  userId: string
): Promise<string> {
  const validated = lpCommitmentSchema.parse(data);
  
  return await runTransaction(db, async (transaction) => {
    // Get fund to check limits
    const fundRef = doc(fundsCollection(organizationId), fundId);
    const fundSnap = await transaction.get(fundRef);
    
    if (!fundSnap.exists()) {
      throw new Error('Fund not found');
    }
    
    const fund = fundSnap.data() as AllocationFund;
    
    // Check commitment limits
    if (validated.commitmentAmount < fund.minCommitment) {
      throw new Error(`Minimum commitment is ${fund.minCommitment}`);
    }
    if (validated.commitmentAmount > fund.maxCommitment) {
      throw new Error(`Maximum commitment is ${fund.maxCommitment}`);
    }
    
    // Get existing commitments
    const existingCommitmentsSnap = await getDocs(lpCommitmentsCollection(organizationId, fundId));
    const totalExisting = existingCommitmentsSnap.docs.reduce(
      (sum, d) => sum + ((d.data() as LPCommitment).commitmentAmount || 0), 0
    );
    
    if (totalExisting + validated.commitmentAmount > fund.hardCap) {
      throw new Error('Commitment would exceed fund hard cap');
    }
    
    const commitment: Omit<LPCommitment, 'id'> = {
      fundId,
      organizationId,
      investorId: validated.investorId,
      commitmentAmount: validated.commitmentAmount,
      commitmentDate: Timestamp.fromDate(validated.commitmentDate),
      commitmentCurrency: validated.commitmentCurrency as LPCommitment['commitmentCurrency'],
      exchangeRate: validated.exchangeRate,
      capitalCalled: 0,
      capitalCalledPercent: 0,
      unfundedCommitment: validated.commitmentAmount,
      distributionsReceived: 0,
      recallableDistributions: 0,
      nav: validated.commitmentAmount,
      dpi: 0,
      tvpi: 1,
      irr: 0,
      ownershipPercent: (validated.commitmentAmount / (totalExisting + validated.commitmentAmount)) * 100,
      investorName: validated.investorName,
      investorType: validated.investorType,
      status: 'active',
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };
    
    const docRef = doc(lpCommitmentsCollection(organizationId, fundId));
    transaction.set(docRef, commitment);
    
    return docRef.id;
  });
}

export async function getLPCommitments(
  organizationId: string,
  fundId: string,
  status?: string
): Promise<LPCommitment[]> {
  let q = query(
    lpCommitmentsCollection(organizationId, fundId),
    orderBy('createdAt', 'desc')
  );
  
  if (status) {
    q = query(
      lpCommitmentsCollection(organizationId, fundId),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LPCommitment));
}

export async function getLPCommitment(
  organizationId: string,
  fundId: string,
  commitmentId: string
): Promise<LPCommitment | null> {
  const docRef = doc(lpCommitmentsCollection(organizationId, fundId), commitmentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as LPCommitment;
}

// ============================================================================
// CAPITAL CALL OPERATIONS
// ============================================================================

export async function createCapitalCall(
  organizationId: string,
  fundId: string,
  data: CapitalCallFormData,
  userId: string
): Promise<string> {
  const validated = capitalCallSchema.parse(data);
  
  return await runTransaction(db, async (transaction) => {
    // Get LP commitments
    const commitmentsSnap = await getDocs(lpCommitmentsCollection(organizationId, fundId));
    const commitments = commitmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as LPCommitment));
    
    const totalUnfunded = commitments.reduce((sum, c) => sum + c.unfundedCommitment, 0);
    const totalCallAmount = validated.investmentAmount + validated.managementFeeAmount +
      validated.partnershipExpensesAmount + validated.organizationalCostsAmount;
    
    if (totalCallAmount > totalUnfunded) {
      throw new Error('Call amount exceeds unfunded commitments');
    }
    
    // Get next call number
    const callsSnap = await getDocs(capitalCallsCollection(organizationId, fundId));
    const callNumber = callsSnap.docs.length + 1;
    
    // Create LP responses
    const lpResponses: CapitalCallLPResponse[] = commitments.map(c => ({
      lpCommitmentId: c.id,
      investorId: c.investorId,
      investorName: c.investorName,
      callAmount: (c.ownershipPercent / 100) * totalCallAmount,
      fundedAmount: 0,
      status: 'pending' as const,
    }));
    
    const capitalCall: Omit<CapitalCall, 'id'> = {
      fundId,
      organizationId,
      callNumber,
      callDate: Timestamp.fromDate(validated.callDate),
      dueDate: Timestamp.fromDate(validated.dueDate),
      totalCallAmount,
      investmentAmount: validated.investmentAmount,
      managementFeeAmount: validated.managementFeeAmount,
      partnershipExpensesAmount: validated.partnershipExpensesAmount,
      organizationalCostsAmount: validated.organizationalCostsAmount,
      purpose: validated.purpose,
      investmentIds: validated.investmentIds,
      status: CAPITAL_CALL_STATUS.DRAFT,
      amountReceived: 0,
      amountOutstanding: totalCallAmount,
      percentFunded: 0,
      lpResponses,
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };
    
    const docRef = doc(capitalCallsCollection(organizationId, fundId));
    transaction.set(docRef, capitalCall);
    
    return docRef.id;
  });
}

export async function getCapitalCalls(
  organizationId: string,
  fundId: string,
  status?: CapitalCallStatus
): Promise<CapitalCall[]> {
  let q = query(
    capitalCallsCollection(organizationId, fundId),
    orderBy('callNumber', 'desc')
  );
  
  if (status) {
    q = query(
      capitalCallsCollection(organizationId, fundId),
      where('status', '==', status),
      orderBy('callNumber', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CapitalCall));
}

export async function getCapitalCall(
  organizationId: string,
  fundId: string,
  callId: string
): Promise<CapitalCall | null> {
  const docRef = doc(capitalCallsCollection(organizationId, fundId), callId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as CapitalCall;
}

export async function issueCapitalCall(
  organizationId: string,
  fundId: string,
  callId: string,
  userId: string
): Promise<void> {
  const docRef = doc(capitalCallsCollection(organizationId, fundId), callId);
  
  await updateDoc(docRef, {
    status: CAPITAL_CALL_STATUS.ISSUED,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  });
}

export async function recordLPFunding(
  organizationId: string,
  fundId: string,
  callId: string,
  lpCommitmentId: string,
  amount: number,
  userId: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const callRef = doc(capitalCallsCollection(organizationId, fundId), callId);
    const callSnap = await transaction.get(callRef);
    
    if (!callSnap.exists()) {
      throw new Error('Capital call not found');
    }
    
    const call = callSnap.data() as CapitalCall;
    
    // Update LP response
    const lpResponses = call.lpResponses.map(r => {
      if (r.lpCommitmentId === lpCommitmentId) {
        const newFunded = r.fundedAmount + amount;
        return {
          ...r,
          fundedAmount: newFunded,
          fundedDate: Timestamp.now(),
          status: (newFunded >= r.callAmount ? 'funded' : 'partial') as CapitalCallLPResponse['status'],
        };
      }
      return r;
    });
    
    const newAmountReceived = call.amountReceived + amount;
    const newPercentFunded = (newAmountReceived / call.totalCallAmount) * 100;
    
    let newStatus: CapitalCallStatus = call.status;
    if (newPercentFunded >= 100) {
      newStatus = CAPITAL_CALL_STATUS.FULLY_FUNDED;
    } else if (newAmountReceived > 0) {
      newStatus = CAPITAL_CALL_STATUS.PARTIALLY_FUNDED;
    }
    
    transaction.update(callRef, {
      lpResponses,
      amountReceived: newAmountReceived,
      amountOutstanding: call.totalCallAmount - newAmountReceived,
      percentFunded: newPercentFunded,
      status: newStatus,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
    
    // Update LP commitment
    const commitmentRef = doc(lpCommitmentsCollection(organizationId, fundId), lpCommitmentId);
    const commitmentSnap = await transaction.get(commitmentRef);
    
    if (commitmentSnap.exists()) {
      const commitment = commitmentSnap.data() as LPCommitment;
      const newCapitalCalled = commitment.capitalCalled + amount;
      
      transaction.update(commitmentRef, {
        capitalCalled: newCapitalCalled,
        capitalCalledPercent: (newCapitalCalled / commitment.commitmentAmount) * 100,
        unfundedCommitment: commitment.commitmentAmount - newCapitalCalled,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });
    }
  });
}

// ============================================================================
// DISTRIBUTION OPERATIONS
// ============================================================================

export async function createDistribution(
  organizationId: string,
  fundId: string,
  data: DistributionFormData,
  userId: string
): Promise<string> {
  const validated = distributionSchema.parse(data);
  
  return await runTransaction(db, async (transaction) => {
    // Get LP commitments
    const commitmentsSnap = await getDocs(lpCommitmentsCollection(organizationId, fundId));
    const commitments = commitmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as LPCommitment));
    
    // Get distributions count for numbering
    const distributionsSnap = await getDocs(distributionsCollection(organizationId, fundId));
    const distributionNumber = distributionsSnap.docs.length + 1;
    
    const totalDistributionAmount = validated.breakdown.reduce((sum, b) => sum + b.amount, 0);
    
    // Create LP allocations
    const lpAllocations: DistributionLPAllocation[] = commitments.map(c => {
      const grossAmount = (c.ownershipPercent / 100) * totalDistributionAmount;
      const taxWithheld = 0;
      
      return {
        lpCommitmentId: c.id,
        investorId: c.investorId,
        investorName: c.investorName,
        ownershipPercent: c.ownershipPercent,
        grossAmount,
        taxWithheld,
        netAmount: grossAmount - taxWithheld,
        breakdown: validated.breakdown.map(b => ({
          type: b.type as DistributionBreakdown['type'],
          amount: (c.ownershipPercent / 100) * b.amount,
          taxWithheld: b.taxWithheld,
        })),
        status: 'pending' as const,
      };
    });
    
    const distribution: Omit<Distribution, 'id'> = {
      fundId,
      organizationId,
      distributionNumber,
      distributionDate: Timestamp.fromDate(validated.distributionDate),
      recordDate: Timestamp.fromDate(validated.recordDate),
      totalDistributionAmount,
      breakdown: validated.breakdown.map(b => ({
        type: b.type as DistributionBreakdown['type'],
        amount: b.amount,
        taxWithheld: b.taxWithheld,
      })),
      sourceInvestmentIds: validated.sourceInvestmentIds,
      sourceDescription: validated.sourceDescription,
      lpAllocations,
      status: 'draft',
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };
    
    const docRef = doc(distributionsCollection(organizationId, fundId));
    transaction.set(docRef, distribution);
    
    return docRef.id;
  });
}

export async function getDistributions(
  organizationId: string,
  fundId: string,
  status?: string
): Promise<Distribution[]> {
  let q = query(
    distributionsCollection(organizationId, fundId),
    orderBy('distributionNumber', 'desc')
  );
  
  if (status) {
    q = query(
      distributionsCollection(organizationId, fundId),
      where('status', '==', status),
      orderBy('distributionNumber', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Distribution));
}

export async function getDistribution(
  organizationId: string,
  fundId: string,
  distributionId: string
): Promise<Distribution | null> {
  const docRef = doc(distributionsCollection(organizationId, fundId), distributionId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Distribution;
}

export async function approveDistribution(
  organizationId: string,
  fundId: string,
  distributionId: string,
  userId: string
): Promise<void> {
  const docRef = doc(distributionsCollection(organizationId, fundId), distributionId);
  
  await updateDoc(docRef, {
    status: 'approved',
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  });
}

export async function payDistribution(
  organizationId: string,
  fundId: string,
  distributionId: string,
  userId: string
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const distRef = doc(distributionsCollection(organizationId, fundId), distributionId);
    const distSnap = await transaction.get(distRef);
    
    if (!distSnap.exists()) {
      throw new Error('Distribution not found');
    }
    
    const distribution = distSnap.data() as Distribution;
    
    // Update LP commitments with distribution amounts
    for (const allocation of distribution.lpAllocations) {
      const commitmentRef = doc(lpCommitmentsCollection(organizationId, fundId), allocation.lpCommitmentId);
      const commitmentSnap = await transaction.get(commitmentRef);
      
      if (commitmentSnap.exists()) {
        const commitment = commitmentSnap.data() as LPCommitment;
        transaction.update(commitmentRef, {
          distributionsReceived: commitment.distributionsReceived + allocation.netAmount,
          updatedAt: Timestamp.now(),
          updatedBy: userId,
        });
      }
    }
    
    // Update distribution status
    const updatedAllocations = distribution.lpAllocations.map(a => ({
      ...a,
      status: 'paid' as const,
      paidDate: Timestamp.now(),
    }));
    
    transaction.update(distRef, {
      status: 'paid',
      lpAllocations: updatedAllocations,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
  });
}

export async function calculateWaterfall(
  organizationId: string,
  fundId: string,
  distributionAmount: number
): Promise<WaterfallCalculation> {
  const fund = await getAllocationFund(organizationId, fundId);
  if (!fund) throw new Error('Fund not found');
  
  const metrics = fund.metrics;
  if (!metrics) throw new Error('Fund metrics not calculated');
  
  const terms = fund.terms;
  const capitalCalled = metrics.capitalCalled;
  const distributionsPaid = metrics.distributionsPaid;
  const preferredReturn = capitalCalled * (terms.preferredReturnRate / 100);
  
  const tiers: WaterfallTierCalculation[] = [];
  let remaining = distributionAmount;
  let totalToLP = 0;
  let totalToGP = 0;
  
  // Tier 1: Return of Capital
  const rocNeeded = Math.max(0, capitalCalled - distributionsPaid);
  const rocAmount = Math.min(remaining, rocNeeded);
  tiers.push({
    tier: WATERFALL_TIERS.RETURN_OF_CAPITAL,
    label: 'Return of Capital',
    lpShare: rocAmount,
    gpShare: 0,
    lpPercent: 100,
    gpPercent: 0,
    tierComplete: rocAmount >= rocNeeded,
  });
  totalToLP += rocAmount;
  remaining -= rocAmount;
  
  // Tier 2: Preferred Return
  const prefReturnNeeded = Math.max(0, preferredReturn - Math.max(0, distributionsPaid - capitalCalled));
  const prefReturnAmount = Math.min(remaining, prefReturnNeeded);
  tiers.push({
    tier: WATERFALL_TIERS.PREFERRED_RETURN,
    label: `Preferred Return (${terms.preferredReturnRate}%)`,
    lpShare: prefReturnAmount,
    gpShare: 0,
    lpPercent: 100,
    gpPercent: 0,
    tierComplete: prefReturnAmount >= prefReturnNeeded,
  });
  totalToLP += prefReturnAmount;
  remaining -= prefReturnAmount;
  
  // Tier 3: GP Catch-up
  if (remaining > 0 && terms.gpCatchupRate > 0) {
    const catchupTarget = (totalToLP * terms.carriedInterestRate) / (100 - terms.carriedInterestRate);
    const catchupAmount = Math.min(remaining, catchupTarget);
    const gpCatchup = catchupAmount * (terms.gpCatchupRate / 100);
    const lpCatchup = catchupAmount - gpCatchup;
    
    tiers.push({
      tier: WATERFALL_TIERS.GP_CATCHUP,
      label: `GP Catch-up (${terms.gpCatchupRate}%)`,
      lpShare: lpCatchup,
      gpShare: gpCatchup,
      lpPercent: 100 - terms.gpCatchupRate,
      gpPercent: terms.gpCatchupRate,
      tierComplete: catchupAmount >= catchupTarget,
    });
    totalToLP += lpCatchup;
    totalToGP += gpCatchup;
    remaining -= catchupAmount;
  }
  
  // Tier 4: Carried Interest Split
  if (remaining > 0) {
    const gpCarry = remaining * (terms.carriedInterestRate / 100);
    const lpCarry = remaining - gpCarry;
    
    tiers.push({
      tier: WATERFALL_TIERS.CARRIED_INTEREST,
      label: `Carried Interest (${terms.carriedInterestRate}% GP)`,
      lpShare: lpCarry,
      gpShare: gpCarry,
      lpPercent: 100 - terms.carriedInterestRate,
      gpPercent: terms.carriedInterestRate,
      tierComplete: true,
    });
    totalToLP += lpCarry;
    totalToGP += gpCarry;
  }
  
  return {
    tiers,
    totalToLP,
    totalToGP,
    gpCarriedInterest: totalToGP,
    effectiveCarry: distributionAmount > 0 ? (totalToGP / distributionAmount) * 100 : 0,
    calculatedAt: Timestamp.now(),
  };
}

// ============================================================================
// PORTFOLIO INVESTMENT OPERATIONS
// ============================================================================

export async function createPortfolioInvestment(
  organizationId: string,
  fundId: string,
  data: PortfolioInvestmentFormData,
  userId: string
): Promise<string> {
  const validated = portfolioInvestmentSchema.parse(data);
  
  const investment: Omit<PortfolioInvestment, 'id'> = {
    fundId,
    organizationId,
    companyName: validated.companyName,
    companyDescription: validated.companyDescription,
    sector: validated.sector as AllocationSector,
    geography: validated.geography as GeographicAllocation,
    website: validated.website || undefined,
    investmentDate: Timestamp.fromDate(validated.investmentDate),
    initialInvestment: validated.initialInvestment,
    followOnInvestments: 0,
    totalInvested: validated.initialInvestment,
    ownershipPercent: validated.ownershipPercent,
    fullyDilutedOwnership: validated.fullyDilutedOwnership,
    boardSeats: validated.boardSeats || 0,
    currentValuation: validated.currentValuation,
    valuationDate: Timestamp.fromDate(validated.investmentDate),
    valuationMethod: validated.valuationMethod as PortfolioInvestment['valuationMethod'],
    valuationNotes: validated.valuationNotes,
    realizedValue: 0,
    unrealizedValue: validated.currentValuation,
    totalValue: validated.currentValuation,
    moic: validated.currentValuation / validated.initialInvestment,
    irr: 0,
    status: PORTFOLIO_INVESTMENT_STATUS.FUNDED,
    dealId: validated.dealId,
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  const docRef = await addDoc(portfolioInvestmentsCollection(organizationId, fundId), investment);
  return docRef.id;
}

export async function getPortfolioInvestments(
  organizationId: string,
  fundId: string,
  filters?: PortfolioInvestmentFilters
): Promise<PortfolioInvestment[]> {
  let q = query(
    portfolioInvestmentsCollection(organizationId, fundId),
    orderBy('investmentDate', 'desc')
  );
  
  if (filters?.status) {
    q = query(
      portfolioInvestmentsCollection(organizationId, fundId),
      where('status', '==', filters.status),
      orderBy('investmentDate', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  let investments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PortfolioInvestment));
  
  if (filters?.sector) {
    investments = investments.filter(i => i.sector === filters.sector);
  }
  
  if (filters?.geography) {
    investments = investments.filter(i => i.geography === filters.geography);
  }
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    investments = investments.filter(i => 
      i.companyName.toLowerCase().includes(searchLower) ||
      i.companyDescription.toLowerCase().includes(searchLower)
    );
  }
  
  return investments;
}

export async function getPortfolioInvestment(
  organizationId: string,
  fundId: string,
  investmentId: string
): Promise<PortfolioInvestment | null> {
  const docRef = doc(portfolioInvestmentsCollection(organizationId, fundId), investmentId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as PortfolioInvestment;
}

export async function updateInvestmentValuation(
  organizationId: string,
  fundId: string,
  investmentId: string,
  data: ValuationRecordFormData,
  userId: string
): Promise<void> {
  const validated = valuationRecordSchema.parse(data);
  
  await runTransaction(db, async (transaction) => {
    const investmentRef = doc(portfolioInvestmentsCollection(organizationId, fundId), investmentId);
    const investmentSnap = await transaction.get(investmentRef);
    
    if (!investmentSnap.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentSnap.data() as PortfolioInvestment;
    const previousValuation = investment.currentValuation;
    
    // Create valuation record
    const valuationRecord: Omit<ValuationRecord, 'id'> = {
      investmentId,
      fundId,
      organizationId,
      valuationDate: Timestamp.fromDate(validated.valuationDate),
      previousValuation,
      newValuation: validated.newValuation,
      changePercent: previousValuation > 0 
        ? ((validated.newValuation - previousValuation) / previousValuation) * 100 
        : 0,
      method: validated.method as ValuationRecord['method'],
      methodology: validated.methodology,
      supportingMetrics: validated.supportingMetrics,
      notes: validated.notes,
      createdAt: Timestamp.now(),
      createdBy: userId,
    };
    
    const valuationRef = doc(valuationsCollection(organizationId, fundId, investmentId));
    transaction.set(valuationRef, valuationRecord);
    
    // Update investment
    const unrealizedValue = validated.newValuation;
    const totalValue = investment.realizedValue + unrealizedValue;
    const moic = investment.totalInvested > 0 ? totalValue / investment.totalInvested : 0;
    
    transaction.update(investmentRef, {
      currentValuation: validated.newValuation,
      valuationDate: Timestamp.fromDate(validated.valuationDate),
      valuationMethod: validated.method,
      valuationNotes: validated.notes,
      unrealizedValue,
      totalValue,
      moic,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
  });
}

export async function recordFollowOnInvestment(
  organizationId: string,
  fundId: string,
  investmentId: string,
  amount: number,
  _date: Date,
  userId: string
): Promise<void> {
  const investmentRef = doc(portfolioInvestmentsCollection(organizationId, fundId), investmentId);
  
  await runTransaction(db, async (transaction) => {
    const investmentSnap = await transaction.get(investmentRef);
    
    if (!investmentSnap.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentSnap.data() as PortfolioInvestment;
    const newFollowOn = investment.followOnInvestments + amount;
    const newTotalInvested = investment.totalInvested + amount;
    const moic = newTotalInvested > 0 ? investment.totalValue / newTotalInvested : 0;
    
    transaction.update(investmentRef, {
      followOnInvestments: newFollowOn,
      totalInvested: newTotalInvested,
      moic,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
  });
}

export async function recordExit(
  organizationId: string,
  fundId: string,
  investmentId: string,
  data: ExitRecordFormData,
  userId: string
): Promise<void> {
  const validated = exitRecordSchema.parse(data);
  const investmentRef = doc(portfolioInvestmentsCollection(organizationId, fundId), investmentId);
  
  await runTransaction(db, async (transaction) => {
    const investmentSnap = await transaction.get(investmentRef);
    
    if (!investmentSnap.exists()) {
      throw new Error('Investment not found');
    }
    
    const investment = investmentSnap.data() as PortfolioInvestment;
    const exitMultiple = investment.totalInvested > 0 ? validated.exitProceeds / investment.totalInvested : 0;
    
    transaction.update(investmentRef, {
      status: PORTFOLIO_INVESTMENT_STATUS.REALIZED,
      exitDate: Timestamp.fromDate(validated.exitDate),
      exitType: validated.exitType,
      exitProceeds: validated.exitProceeds,
      exitMultiple,
      realizedValue: validated.exitProceeds,
      unrealizedValue: 0,
      totalValue: validated.exitProceeds,
      moic: exitMultiple,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    });
  });
}

export async function updateInvestmentStatus(
  organizationId: string,
  fundId: string,
  investmentId: string,
  status: PortfolioInvestmentStatus,
  notes: string | undefined,
  userId: string
): Promise<void> {
  const investmentRef = doc(portfolioInvestmentsCollection(organizationId, fundId), investmentId);
  
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  if (status === PORTFOLIO_INVESTMENT_STATUS.IMPAIRED && notes) {
    updateData.impairmentNotes = notes;
  }
  
  await updateDoc(investmentRef, updateData);
}

// ============================================================================
// LP REPORT OPERATIONS
// ============================================================================

export async function createLPReport(
  organizationId: string,
  fundId: string,
  data: LPReportFormData,
  userId: string
): Promise<string> {
  const validated = lpReportSchema.parse(data);
  
  // Get fund metrics for summary
  const metrics = await calculateFundMetrics(organizationId, fundId);
  const investments = await getPortfolioInvestments(organizationId, fundId);
  
  const report: Omit<LPReport, 'id'> = {
    fundId,
    organizationId,
    reportType: validated.reportType as LPReport['reportType'],
    reportPeriodStart: Timestamp.fromDate(validated.reportPeriodStart),
    reportPeriodEnd: Timestamp.fromDate(validated.reportPeriodEnd),
    title: validated.title,
    status: 'draft',
    performanceSummary: {
      nav: metrics.totalValue,
      navPerUnit: 0,
      dpi: metrics.dpi,
      rvpi: metrics.rvpi,
      tvpi: metrics.tvpi,
      irr: metrics.irr,
      quartile: getQuartile(metrics.tvpi),
    },
    portfolioSummary: {
      totalInvestments: investments.length,
      activeInvestments: investments.filter(i => i.status === PORTFOLIO_INVESTMENT_STATUS.ACTIVE).length,
      newInvestmentsInPeriod: 0,
      realizedInPeriod: 0,
    },
    capitalSummary: {
      totalCommitments: metrics.totalCommitments,
      capitalCalled: metrics.capitalCalled,
      distributionsPaid: metrics.distributionsPaid,
      unfundedCommitments: metrics.unfundedCommitments,
    },
    recipientInvestorIds: validated.recipientInvestorIds,
    createdAt: Timestamp.now(),
    createdBy: userId,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  const docRef = await addDoc(lpReportsCollection(organizationId, fundId), report);
  return docRef.id;
}

function getQuartile(tvpi: number): 1 | 2 | 3 | 4 {
  if (tvpi >= 2.0) return 1;
  if (tvpi >= 1.5) return 2;
  if (tvpi >= 1.0) return 3;
  return 4;
}

export async function getLPReports(
  organizationId: string,
  fundId: string,
  status?: string
): Promise<LPReport[]> {
  let q = query(
    lpReportsCollection(organizationId, fundId),
    orderBy('reportPeriodEnd', 'desc')
  );
  
  if (status) {
    q = query(
      lpReportsCollection(organizationId, fundId),
      where('status', '==', status),
      orderBy('reportPeriodEnd', 'desc')
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LPReport));
}

export async function getLPReport(
  organizationId: string,
  fundId: string,
  reportId: string
): Promise<LPReport | null> {
  const docRef = doc(lpReportsCollection(organizationId, fundId), reportId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as LPReport;
}

export async function updateLPReportStatus(
  organizationId: string,
  fundId: string,
  reportId: string,
  status: 'draft' | 'review' | 'approved' | 'distributed',
  userId: string
): Promise<void> {
  const reportRef = doc(lpReportsCollection(organizationId, fundId), reportId);
  
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
  
  if (status === 'distributed') {
    updateData.distributedAt = Timestamp.now();
  }
  
  await updateDoc(reportRef, updateData);
}

export async function distributeLPReport(
  organizationId: string,
  fundId: string,
  reportId: string,
  userId: string
): Promise<void> {
  await updateLPReportStatus(organizationId, fundId, reportId, 'distributed', userId);
  // In production: trigger email/notification to LPs
}

// ============================================================================
// ANALYTICS
// ============================================================================

export async function calculateAllocationAnalytics(
  organizationId: string,
  fundId: string
): Promise<AllocationAnalytics> {
  const investments = await getPortfolioInvestments(organizationId, fundId);
  
  const totalInvested = investments.reduce((sum, i) => sum + i.totalInvested, 0);
  
  // Sector allocation
  const sectorMap = new Map<string, { invested: number; count: number }>();
  investments.forEach(i => {
    const existing = sectorMap.get(i.sector) || { invested: 0, count: 0 };
    sectorMap.set(i.sector, {
      invested: existing.invested + i.totalInvested,
      count: existing.count + 1,
    });
  });
  
  const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, data]) => ({
    sector: sector as AllocationSector,
    invested: data.invested,
    percent: totalInvested > 0 ? (data.invested / totalInvested) * 100 : 0,
    investments: data.count,
  }));
  
  // Geographic allocation
  const geoMap = new Map<string, { invested: number; count: number }>();
  investments.forEach(i => {
    const existing = geoMap.get(i.geography) || { invested: 0, count: 0 };
    geoMap.set(i.geography, {
      invested: existing.invested + i.totalInvested,
      count: existing.count + 1,
    });
  });
  
  const geographicAllocation = Array.from(geoMap.entries()).map(([geography, data]) => ({
    geography: geography as GeographicAllocation,
    invested: data.invested,
    percent: totalInvested > 0 ? (data.invested / totalInvested) * 100 : 0,
    investments: data.count,
  }));
  
  // Concentration risk
  const sortedInvestments = [...investments].sort((a, b) => b.totalInvested - a.totalInvested);
  const largestInvestmentPercent = totalInvested > 0 && sortedInvestments.length > 0
    ? (sortedInvestments[0].totalInvested / totalInvested) * 100
    : 0;
  
  const top5Invested = sortedInvestments.slice(0, 5).reduce((sum, i) => sum + i.totalInvested, 0);
  const top5InvestmentsPercent = totalInvested > 0 ? (top5Invested / totalInvested) * 100 : 0;
  
  // Herfindahl Index
  const herfindahlIndex = investments.reduce((sum, i) => {
    const share = totalInvested > 0 ? i.totalInvested / totalInvested : 0;
    return sum + Math.pow(share, 2);
  }, 0);
  
  // Diversification score (0-100, higher is better)
  const diversificationScore = Math.min(100, Math.max(0,
    100 - (largestInvestmentPercent * 2) + 
    (investments.length * 5) - 
    (herfindahlIndex * 100)
  ));
  
  const diversificationNotes: string[] = [];
  if (largestInvestmentPercent > 20) {
    diversificationNotes.push(`Largest investment (${largestInvestmentPercent.toFixed(1)}%) exceeds 20% threshold`);
  }
  if (sectorAllocation.some(s => s.percent > 40)) {
    diversificationNotes.push('Sector concentration exceeds 40% threshold');
  }
  if (investments.length < 8) {
    diversificationNotes.push(`Only ${investments.length} investments - target minimum 8`);
  }
  
  return {
    fundId,
    calculatedAt: Timestamp.now(),
    sectorAllocation,
    geographicAllocation,
    vintageAnalysis: [],
    concentrationRisk: {
      largestInvestmentPercent,
      top5InvestmentsPercent,
      herfindahlIndex,
    },
    diversificationScore,
    diversificationNotes,
  };
}
