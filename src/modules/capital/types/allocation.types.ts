// ============================================================================
// ALLOCATION TYPES
// DawinOS v2.0 - Capital Hub Module
// TypeScript interfaces for Capital Allocation & Fund Management
// ============================================================================

import { Timestamp } from 'firebase/firestore';
import {
  FundType,
  AllocationFundStatus,
  CapitalCallStatus,
  DistributionType,
  PortfolioInvestmentStatus,
  AllocationSector,
  GeographicAllocation,
  FundCurrency,
  LPReportType,
  WaterfallTier,
  LPCommitmentStatus,
  ValuationMethod,
  ExitType,
} from '../constants/allocation.constants';

// ----------------------------------------------------------------------------
// FUND ENTITY
// ----------------------------------------------------------------------------

export interface AllocationFund {
  id: string;
  organizationId: string;
  
  // Basic Information
  name: string;
  shortName: string;
  fundType: FundType;
  status: AllocationFundStatus;
  currency: FundCurrency;
  
  // Size & Structure
  targetSize: number;
  hardCap: number;
  minCommitment: number;
  maxCommitment: number;
  
  // Dates
  inceptionDate: Timestamp;
  firstCloseDate?: Timestamp;
  finalCloseDate?: Timestamp;
  investmentPeriodEndDate?: Timestamp;
  terminationDate?: Timestamp;
  
  // Fund Terms
  terms: FundTerms;
  
  // GP/LP Structure
  gpCommitment: number;
  gpCommitmentPercentage: number;
  generalPartner: GeneralPartner;
  
  // Investment Strategy
  strategy: InvestmentStrategy;
  
  // Allocation Limits
  allocationLimits: AllocationLimits;
  
  // Current Metrics (computed)
  metrics?: FundMetrics;
  
  // Documents
  lpaDocumentUrl?: string;
  ppmDocumentUrl?: string;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface FundTerms {
  managementFeeRate: number;
  managementFeeBasis: 'committed' | 'invested' | 'nav';
  carriedInterestRate: number;
  preferredReturnRate: number;
  gpCatchupRate: number;
  waterfallType: 'american' | 'european';
  clawbackProvision: boolean;
  keyPersonProvision: boolean;
  noFaultDivorce: boolean;
  investmentPeriodYears: number;
  fundLifeYears: number;
  extensionYears: number;
  extensionApprovalThreshold: number;
}

export interface GeneralPartner {
  entityName: string;
  principalNames: string[];
  keyPersons: string[];
  gpCommitmentAmount: number;
  gpCommitmentSource: 'cash' | 'fee_waiver' | 'mixed';
}

export interface InvestmentStrategy {
  description: string;
  targetSectors: AllocationSector[];
  targetGeographies: GeographicAllocation[];
  investmentSizeMin: number;
  investmentSizeMax: number;
  holdingPeriodYears: number;
  targetInvestmentCount: number;
  coInvestmentAllowed: boolean;
  followOnReserve: number;
}

export interface AllocationLimits {
  maxSingleInvestmentPercent: number;
  maxSectorConcentrationPercent: number;
  maxGeographicConcentrationPercent: number;
  minDiversification: number;
}

export interface FundMetrics {
  // Capital
  totalCommitments: number;
  capitalCalled: number;
  capitalCalledPercent: number;
  unfundedCommitments: number;
  distributionsPaid: number;
  recallableCapital: number;
  
  // Performance
  totalInvested: number;
  realizedValue: number;
  unrealizedValue: number;
  totalValue: number;
  dpi: number;      // Distributions to Paid-In
  rvpi: number;     // Residual Value to Paid-In
  tvpi: number;     // Total Value to Paid-In
  irr: number;      // Internal Rate of Return
  moic: number;     // Multiple on Invested Capital
  
  // Portfolio
  activeInvestments: number;
  realizedInvestments: number;
  totalInvestments: number;
  
  // LP Count
  lpCount: number;
  
  // Dates
  calculatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// LP COMMITMENT
// ----------------------------------------------------------------------------

export interface LPCommitment {
  id: string;
  fundId: string;
  investorId: string;
  organizationId: string;
  
  // Commitment Details
  commitmentAmount: number;
  commitmentDate: Timestamp;
  commitmentCurrency: FundCurrency;
  exchangeRate?: number;
  
  // Funding Status
  capitalCalled: number;
  capitalCalledPercent: number;
  unfundedCommitment: number;
  
  // Distributions
  distributionsReceived: number;
  recallableDistributions: number;
  
  // Performance
  nav: number;
  dpi: number;
  tvpi: number;
  irr: number;
  
  // Ownership
  ownershipPercent: number;
  
  // Legal
  subscriptionAgreementUrl?: string;
  sideLetterUrl?: string;
  
  // Investor Details (denormalized for reporting)
  investorName: string;
  investorType: string;
  
  // Status
  status: LPCommitmentStatus;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ----------------------------------------------------------------------------
// CAPITAL CALL
// ----------------------------------------------------------------------------

export interface CapitalCall {
  id: string;
  fundId: string;
  organizationId: string;
  
  // Call Details
  callNumber: number;
  callDate: Timestamp;
  dueDate: Timestamp;
  
  // Amounts
  totalCallAmount: number;
  investmentAmount: number;
  managementFeeAmount: number;
  partnershipExpensesAmount: number;
  organizationalCostsAmount: number;
  
  // Purpose
  purpose: string;
  investmentIds?: string[];
  
  // Status
  status: CapitalCallStatus;
  
  // Funding Progress
  amountReceived: number;
  amountOutstanding: number;
  percentFunded: number;
  
  // LP Responses
  lpResponses: CapitalCallLPResponse[];
  
  // Documents
  callNoticeUrl?: string;
  wireInstructionsUrl?: string;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface CapitalCallLPResponse {
  lpCommitmentId: string;
  investorId: string;
  investorName: string;
  
  callAmount: number;
  fundedAmount: number;
  fundedDate?: Timestamp;
  
  status: 'pending' | 'partial' | 'funded' | 'overdue' | 'defaulted';
  
  notes?: string;
}

// ----------------------------------------------------------------------------
// DISTRIBUTION
// ----------------------------------------------------------------------------

export interface Distribution {
  id: string;
  fundId: string;
  organizationId: string;
  
  // Distribution Details
  distributionNumber: number;
  distributionDate: Timestamp;
  recordDate: Timestamp;
  
  // Amounts
  totalDistributionAmount: number;
  breakdown: DistributionBreakdown[];
  
  // Source
  sourceInvestmentIds?: string[];
  sourceDescription: string;
  
  // Waterfall
  waterfallCalculation?: WaterfallCalculation;
  
  // LP Allocations
  lpAllocations: DistributionLPAllocation[];
  
  // Status
  status: 'draft' | 'approved' | 'paid' | 'cancelled';
  
  // Documents
  distributionNoticeUrl?: string;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface DistributionBreakdown {
  type: DistributionType;
  amount: number;
  taxWithheld?: number;
}

export interface DistributionLPAllocation {
  lpCommitmentId: string;
  investorId: string;
  investorName: string;
  
  ownershipPercent: number;
  grossAmount: number;
  taxWithheld: number;
  netAmount: number;
  
  breakdown: DistributionBreakdown[];
  
  paidDate?: Timestamp;
  status: 'pending' | 'paid' | 'held';
}

export interface WaterfallCalculation {
  tiers: WaterfallTierCalculation[];
  totalToLP: number;
  totalToGP: number;
  gpCarriedInterest: number;
  effectiveCarry: number;
  calculatedAt: Timestamp;
}

export interface WaterfallTierCalculation {
  tier: WaterfallTier;
  label: string;
  lpShare: number;
  gpShare: number;
  lpPercent: number;
  gpPercent: number;
  tierComplete: boolean;
}

// ----------------------------------------------------------------------------
// PORTFOLIO INVESTMENT
// ----------------------------------------------------------------------------

export interface PortfolioInvestment {
  id: string;
  fundId: string;
  organizationId: string;
  
  // Company Information
  companyName: string;
  companyDescription: string;
  sector: AllocationSector;
  geography: GeographicAllocation;
  website?: string;
  
  // Investment Details
  investmentDate: Timestamp;
  initialInvestment: number;
  followOnInvestments: number;
  totalInvested: number;
  
  // Ownership
  ownershipPercent: number;
  fullyDilutedOwnership?: number;
  boardSeats: number;
  
  // Valuation
  currentValuation: number;
  valuationDate: Timestamp;
  valuationMethod: ValuationMethod;
  valuationNotes?: string;
  
  // Returns
  realizedValue: number;
  unrealizedValue: number;
  totalValue: number;
  moic: number;
  irr: number;
  
  // Status
  status: PortfolioInvestmentStatus;
  impairmentNotes?: string;
  
  // Exit Information (if realized)
  exitDate?: Timestamp;
  exitType?: ExitType;
  exitProceeds?: number;
  exitMultiple?: number;
  
  // Deal Link
  dealId?: string;
  
  // Documents
  investmentMemoUrl?: string;
  termSheetUrl?: string;
  shareholdersAgreementUrl?: string;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ----------------------------------------------------------------------------
// VALUATION RECORD
// ----------------------------------------------------------------------------

export interface ValuationRecord {
  id: string;
  investmentId: string;
  fundId: string;
  organizationId: string;
  
  valuationDate: Timestamp;
  previousValuation: number;
  newValuation: number;
  changePercent: number;
  
  method: ValuationMethod;
  methodology: string;
  
  supportingMetrics?: {
    revenue?: number;
    ebitda?: number;
    netIncome?: number;
    employeeCount?: number;
    customMetrics?: Record<string, number>;
  };
  
  approvedBy?: string;
  approvedAt?: Timestamp;
  
  notes?: string;
  
  createdAt: Timestamp;
  createdBy: string;
}

// ----------------------------------------------------------------------------
// LP REPORT
// ----------------------------------------------------------------------------

export interface LPReport {
  id: string;
  fundId: string;
  organizationId: string;
  
  reportType: LPReportType;
  reportPeriodStart: Timestamp;
  reportPeriodEnd: Timestamp;
  
  title: string;
  status: 'draft' | 'review' | 'approved' | 'distributed';
  
  // Performance Summary
  performanceSummary?: {
    nav: number;
    navPerUnit: number;
    dpi: number;
    rvpi: number;
    tvpi: number;
    irr: number;
    quartile: 1 | 2 | 3 | 4;
  };
  
  // Portfolio Summary
  portfolioSummary?: {
    totalInvestments: number;
    activeInvestments: number;
    newInvestmentsInPeriod: number;
    realizedInPeriod: number;
  };
  
  // Capital Summary
  capitalSummary?: {
    totalCommitments: number;
    capitalCalled: number;
    distributionsPaid: number;
    unfundedCommitments: number;
  };
  
  // Recipients
  recipientInvestorIds: string[];
  distributedAt?: Timestamp;
  
  // Documents
  reportDocumentUrl?: string;
  attachmentUrls?: string[];
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ----------------------------------------------------------------------------
// ALLOCATION ANALYTICS
// ----------------------------------------------------------------------------

export interface AllocationAnalytics {
  fundId: string;
  calculatedAt: Timestamp;
  
  // Sector Allocation
  sectorAllocation: {
    sector: AllocationSector;
    invested: number;
    percent: number;
    investments: number;
  }[];
  
  // Geographic Allocation
  geographicAllocation: {
    geography: GeographicAllocation;
    invested: number;
    percent: number;
    investments: number;
  }[];
  
  // Vintage Analysis
  vintageAnalysis: {
    year: number;
    invested: number;
    currentValue: number;
    moic: number;
    irr: number;
  }[];
  
  // Concentration Risk
  concentrationRisk: {
    largestInvestmentPercent: number;
    top5InvestmentsPercent: number;
    herfindahlIndex: number;
  };
  
  // Diversification Score
  diversificationScore: number;
  diversificationNotes: string[];
}

// ----------------------------------------------------------------------------
// FORM INPUTS
// ----------------------------------------------------------------------------

export interface FundFormInput {
  name: string;
  shortName: string;
  fundType: FundType;
  currency: FundCurrency;
  targetSize: number;
  hardCap: number;
  minCommitment: number;
  maxCommitment: number;
  inceptionDate: Date;
  firstCloseDate?: Date;
  finalCloseDate?: Date;
  terms: Partial<FundTerms>;
  gpCommitment: number;
  gpCommitmentPercentage: number;
  generalPartner: Partial<GeneralPartner>;
  strategy: Partial<InvestmentStrategy>;
  allocationLimits?: Partial<AllocationLimits>;
}

export interface LPCommitmentFormInput {
  fundId: string;
  investorId: string;
  commitmentAmount: number;
  commitmentDate: Date;
  commitmentCurrency: FundCurrency;
  exchangeRate?: number;
  investorName: string;
  investorType: string;
}

export interface CapitalCallFormInput {
  fundId: string;
  callDate: Date;
  dueDate: Date;
  investmentAmount: number;
  managementFeeAmount: number;
  partnershipExpensesAmount: number;
  organizationalCostsAmount: number;
  purpose: string;
  investmentIds?: string[];
}

export interface DistributionFormInput {
  fundId: string;
  distributionDate: Date;
  recordDate: Date;
  breakdown: DistributionBreakdown[];
  sourceInvestmentIds?: string[];
  sourceDescription: string;
}

export interface PortfolioInvestmentFormInput {
  fundId: string;
  companyName: string;
  companyDescription: string;
  sector: AllocationSector;
  geography: GeographicAllocation;
  website?: string;
  investmentDate: Date;
  initialInvestment: number;
  ownershipPercent: number;
  fullyDilutedOwnership?: number;
  boardSeats?: number;
  currentValuation: number;
  valuationMethod: ValuationMethod;
  valuationNotes?: string;
  dealId?: string;
}

export interface ValuationRecordFormInput {
  investmentId: string;
  valuationDate: Date;
  newValuation: number;
  method: ValuationMethod;
  methodology: string;
  supportingMetrics?: {
    revenue?: number;
    ebitda?: number;
    netIncome?: number;
    employeeCount?: number;
    customMetrics?: Record<string, number>;
  };
  notes?: string;
}

export interface LPReportFormInput {
  fundId: string;
  reportType: LPReportType;
  reportPeriodStart: Date;
  reportPeriodEnd: Date;
  title: string;
  recipientInvestorIds?: string[];
}

// ----------------------------------------------------------------------------
// FILTER TYPES
// ----------------------------------------------------------------------------

export interface AllocationFundFilters {
  status?: AllocationFundStatus;
  fundType?: FundType;
  currency?: FundCurrency;
  search?: string;
}

export interface PortfolioInvestmentFilters {
  fundId?: string;
  status?: PortfolioInvestmentStatus;
  sector?: AllocationSector;
  geography?: GeographicAllocation;
  search?: string;
}

export interface CapitalCallFilters {
  fundId?: string;
  status?: CapitalCallStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface DistributionFilters {
  fundId?: string;
  status?: 'draft' | 'approved' | 'paid' | 'cancelled';
  fromDate?: Date;
  toDate?: Date;
}
