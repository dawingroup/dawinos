// ============================================================================
// CAPITAL HUB TYPES
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

import { Timestamp } from 'firebase/firestore';
import {
  DealStage,
  InvestmentType,
  InvestorType,
  InvestorStatus,
  FundStatus,
  CommitmentStatus,
  KycStatus,
  ActivityType,
  SupportedCurrency,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// DEAL / OPPORTUNITY
// ----------------------------------------------------------------------------

export interface Deal {
  id: string;
  companyId: string;
  
  // Basic Info
  name: string;
  description: string;
  sector: string;
  
  // Investment Details
  investmentType: InvestmentType;
  targetAmount: number;
  minimumTicket: number;
  maximumTicket?: number;
  currency: SupportedCurrency;
  
  // Valuation
  preMoneyValuation?: number;
  equityOffered?: number;
  interestRate?: number;
  tenor?: number;
  
  // Pipeline
  stage: DealStage;
  probability: number;
  expectedCloseDate?: Date;
  
  // Assignment
  leadAdvisorId: string;
  leadAdvisorName: string;
  teamMemberIds: string[];
  
  // Target Company/Project
  targetEntityName: string;
  targetEntityType: 'company' | 'project' | 'fund';
  targetEntityId?: string;
  location?: string;
  
  // Amounts
  amountRaised: number;
  amountCommitted: number;
  
  // Linked Investors
  interestedInvestors: string[];
  committedInvestors: string[];
  
  // Dates
  dealStartDate: Date;
  closedDate?: Date;
  
  // Documents
  pitchDeckUrl?: string;
  termSheetUrl?: string;
  
  // Status
  isActive: boolean;
  lostReason?: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// INVESTOR
// ----------------------------------------------------------------------------

export interface Investor {
  id: string;
  companyId: string;
  
  // Basic Info
  name: string;
  type: InvestorType;
  status: InvestorStatus;
  
  // Contact
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone?: string;
  
  // Organization (if institutional)
  organizationName?: string;
  organizationType?: string;
  headquarters?: string;
  website?: string;
  
  // Investment Profile
  investmentFocus: string[];
  sectorPreferences: string[];
  geographicFocus: string[];
  
  // Ticket Size
  minTicketSize: number;
  maxTicketSize: number;
  preferredCurrency: SupportedCurrency;
  
  // Investment Types
  investmentTypesPreferred: InvestmentType[];
  
  // Track Record
  totalInvested?: number;
  dealsCount?: number;
  averageTicketSize?: number;
  
  // Relationship
  relationshipOwnerId: string;
  relationshipOwnerName: string;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  
  // Pipeline
  activeDeals: string[];
  closedDeals: string[];
  
  // KYC
  kycStatus: KycStatus;
  kycDocuments?: string[];
  kycExpiryDate?: Date;
  
  // Metadata
  source: string;
  tags?: string[];
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// INVESTOR COMMITMENT
// ----------------------------------------------------------------------------

export interface CommitmentTranche {
  amount: number;
  date: Date;
  status: 'scheduled' | 'received' | 'missed';
}

export interface InvestorCommitment {
  id: string;
  companyId: string;
  
  // References
  dealId: string;
  dealName: string;
  investorId: string;
  investorName: string;
  
  // Commitment Details
  committedAmount: number;
  currency: SupportedCurrency;
  commitmentDate: Date;
  
  // Terms
  investmentType: InvestmentType;
  equityPercentage?: number;
  interestRate?: number;
  
  // Status
  status: CommitmentStatus;
  
  // Funding
  fundedAmount: number;
  fundingDate?: Date;
  tranches?: CommitmentTranche[];
  
  // Documents
  commitmentLetterUrl?: string;
  agreementUrl?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// FUND
// ----------------------------------------------------------------------------

export interface Fund {
  id: string;
  companyId: string;
  
  // Fund Info
  name: string;
  description: string;
  vintage: number;
  
  // Size
  targetSize: number;
  hardCap?: number;
  minimumCommitment: number;
  currency: SupportedCurrency;
  
  // Status
  status: FundStatus;
  
  // Capital
  totalCommitted: number;
  totalCalled: number;
  totalDistributed: number;
  
  // Performance
  navAmount?: number;
  irr?: number;
  moic?: number;
  
  // Timeline
  fundraisingStartDate: Date;
  fundraisingEndDate?: Date;
  investmentPeriodEnd?: Date;
  fundEndDate?: Date;
  
  // Structure
  managementFeeRate: number;
  carriedInterestRate: number;
  hurdleRate?: number;
  
  // LPs
  lpCount: number;
  
  // Investments
  portfolioCompanyCount: number;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// DEAL ACTIVITY
// ----------------------------------------------------------------------------

export interface DealActivity {
  id: string;
  dealId: string;
  
  // Activity
  type: ActivityType;
  title: string;
  description?: string;
  
  // Participants
  participants?: string[];
  investorIds?: string[];
  
  // Outcome
  outcome?: string;
  nextSteps?: string[];
  
  // Stage change
  previousStage?: DealStage;
  newStage?: DealStage;
  
  // Metadata
  performedBy: string;
  performedByName: string;
  performedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// DEAL DOCUMENT
// ----------------------------------------------------------------------------

export interface DealDocument {
  id: string;
  dealId: string;
  companyId: string;
  
  // Document Info
  name: string;
  type: string;
  url: string;
  size: number;
  mimeType: string;
  
  // Version
  version: number;
  previousVersionId?: string;
  
  // Access
  isConfidential: boolean;
  sharedWithInvestors: string[];
  
  // Metadata
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: Timestamp;
}

// ----------------------------------------------------------------------------
// ANALYTICS
// ----------------------------------------------------------------------------

export interface StageMetrics {
  count: number;
  value: number;
  weightedValue: number;
}

export interface SectorMetrics {
  count: number;
  value: number;
}

export interface PipelineSummary {
  totalDeals: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  
  byStage: Record<DealStage, StageMetrics>;
  
  bySector: Record<string, SectorMetrics>;
  
  byInvestmentType: Record<InvestmentType, SectorMetrics>;
  
  closedThisMonth: number;
  closedThisQuarter: number;
  closedThisYear: number;
  
  averageDealSize: number;
  averageCloseTime: number; // days
  conversionRate: number;
}

export interface InvestorSummary {
  totalInvestors: number;
  activeInvestors: number;
  
  byType: Record<InvestorType, number>;
  byStatus: Record<InvestorStatus, number>;
  
  totalCommitted: number;
  totalInvested: number;
  
  averageTicketSize: number;
}

// ----------------------------------------------------------------------------
// FILTERS
// ----------------------------------------------------------------------------

export interface DealFilters {
  stage?: DealStage;
  stages?: DealStage[];
  investmentType?: InvestmentType;
  sector?: string;
  leadAdvisorId?: string;
  minAmount?: number;
  maxAmount?: number;
  closeDateAfter?: Date;
  closeDateBefore?: Date;
  isActive?: boolean;
  search?: string;
}

export interface InvestorFilters {
  type?: InvestorType;
  status?: InvestorStatus;
  sectors?: string[];
  minTicketSize?: number;
  maxTicketSize?: number;
  relationshipOwnerId?: string;
  kycStatus?: KycStatus;
  search?: string;
}

export interface CommitmentFilters {
  dealId?: string;
  investorId?: string;
  status?: CommitmentStatus;
  minAmount?: number;
  maxAmount?: number;
}

export interface FundFilters {
  status?: FundStatus;
  vintage?: number;
}
