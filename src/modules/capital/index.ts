// ============================================================================
// CAPITAL HUB MODULE INDEX
// DawinOS v2.0 - Capital Hub Module
// Export all capital hub functionality
// ============================================================================

// Constants
export {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_PROBABILITY,
  DEAL_STAGE_COLORS,
  INVESTMENT_TYPES,
  INVESTMENT_TYPE_LABELS,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABELS,
  INVESTMENT_SECTORS,
  SECTOR_LABELS,
  FUND_STATUS,
  FUND_STATUS_LABELS,
  INVESTOR_STATUS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_COLORS,
  COMMITMENT_STATUS,
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_STATUS_COLORS,
  DEAL_DOCUMENT_TYPES,
  DEAL_DOCUMENT_TYPE_LABELS,
  ACTIVITY_TYPES,
  ACTIVITY_TYPE_LABELS,
  KYC_STATUS,
  DEALS_COLLECTION,
  INVESTORS_COLLECTION,
  FUNDS_COLLECTION,
  COMMITMENTS_COLLECTION,
  DEAL_ACTIVITIES_COLLECTION,
  DEAL_DOCUMENTS_COLLECTION,
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  ACTIVE_DEAL_STAGES,
} from './constants/capital.constants';

export type {
  DealStage,
  InvestmentType,
  InvestorType,
  FundStatus,
  InvestorStatus,
  CommitmentStatus,
  DealDocumentType,
  ActivityType,
  KycStatus,
  SupportedCurrency,
} from './constants/capital.constants';

// Types
export type {
  Deal,
  Investor,
  CommitmentTranche,
  InvestorCommitment,
  Fund,
  DealActivity,
  DealDocument,
  StageMetrics,
  SectorMetrics,
  PipelineSummary,
  InvestorSummary,
  DealFilters,
  InvestorFilters,
  CommitmentFilters,
  FundFilters,
} from './types/capital.types';

// Schemas
export {
  dealSchema,
  investorSchema,
  commitmentSchema,
  commitmentStatusUpdateSchema,
  dealActivitySchema,
  fundSchema,
  dealUpdateSchema,
  investorUpdateSchema,
  stageChangeSchema,
} from './schemas/capital.schemas';

export type {
  DealInput,
  InvestorInput,
  CommitmentInput,
  CommitmentStatusUpdateInput,
  DealActivityInput,
  FundInput,
  DealUpdateInput,
  InvestorUpdateInput,
  StageChangeInput,
} from './schemas/capital.schemas';

// Services
export {
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
  getFund,
  getFunds,
  getPipelineSummary,
  getInvestorSummary,
} from './services/capitalService';

// Hooks
export { useCapital } from './hooks/useCapital';
export { useInvestors } from './hooks/useInvestors';

// ============================================================================
// INVESTOR CRM MODULE (6.3)
// ============================================================================

// Investor CRM Constants
export {
  INVESTOR_TYPES as CRM_INVESTOR_TYPES,
  INVESTOR_TYPE_LABELS as CRM_INVESTOR_TYPE_LABELS,
  EAST_AFRICA_DFIS,
  INVESTMENT_STAGES,
  INVESTMENT_STAGE_LABELS,
  STAGE_CHECK_SIZES,
  INVESTMENT_SECTORS as CRM_INVESTMENT_SECTORS,
  INVESTMENT_SECTOR_LABELS,
  RELATIONSHIP_STATUSES,
  RELATIONSHIP_STATUS_LABELS,
  RELATIONSHIP_STATUS_COLORS,
  COMMUNICATION_TYPES,
  COMMUNICATION_TYPE_LABELS,
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  RELATIONSHIP_HEALTH_LEVELS,
  RELATIONSHIP_HEALTH_LABELS,
  RELATIONSHIP_HEALTH_COLORS,
  HEALTH_SCORE_THRESHOLDS,
  HEALTH_FACTORS,
  CONTACT_ROLES,
  CONTACT_ROLE_LABELS,
  INVESTOR_SOURCES,
  INVESTOR_SOURCE_LABELS,
  INVESTORS_COLLECTION as CRM_INVESTORS_COLLECTION,
  INVESTOR_COMMUNICATIONS_COLLECTION,
  INVESTOR_MEETINGS_COLLECTION,
} from './constants/investor.constants';

export type {
  InvestorType as CrmInvestorType,
  InvestmentStage,
  InvestmentSector,
  RelationshipStatus,
  CommunicationType,
  MeetingType,
  RelationshipHealthLevel,
  ContactRole,
  InvestorSource,
} from './constants/investor.constants';

// Investor CRM Types
export type {
  Investor as CrmInvestor,
  InvestmentCriteria,
  InvestorContact,
  Communication,
  CommunicationAttachment,
  InvestorMeeting,
  MeetingAttendee,
  MeetingActionItem,
  RelationshipHealthMetrics,
  RelationshipAlert,
  InvestorAnalytics,
  InvestorFilters as CrmInvestorFilters,
  CommunicationFilters,
  MeetingFilters,
} from './types/investor.types';

// Investor CRM Schemas
export {
  investmentCriteriaSchema,
  investorInputSchema as crmInvestorInputSchema,
  investorUpdateSchema as crmInvestorUpdateSchema,
  investorContactInputSchema,
  communicationInputSchema,
  meetingAttendeeSchema,
  meetingActionItemSchema,
  investorMeetingInputSchema,
  meetingOutcomeInputSchema,
} from './schemas/investor.schemas';

export type {
  InvestmentCriteriaInput,
  InvestorInput as CrmInvestorInput,
  InvestorUpdate as CrmInvestorUpdate,
  InvestorContactInput,
  CommunicationInput,
  MeetingAttendeeInput,
  MeetingActionItemInput,
  InvestorMeetingInput,
  MeetingOutcomeInput,
} from './schemas/investor.schemas';

// Investor CRM Services
export {
  createInvestor as createCrmInvestor,
  getInvestor as getCrmInvestor,
  getInvestors as getCrmInvestors,
  updateInvestor as updateCrmInvestor,
  deleteInvestor as deleteCrmInvestor,
  addContact,
  updateContact,
  removeContact,
  logCommunication,
  getCommunications,
  scheduleMeeting,
  getMeeting,
  getMeetings,
  updateMeeting,
  completeMeeting,
  cancelMeeting,
  recalculateRelationshipHealth,
  getInvestorAnalytics,
  findMatchingInvestors,
} from './services/investorService';

// Components
export {
  DealCard,
  InvestorCard,
  DealPipeline,
  DealPipelineBoard,
  CommitmentTracker,
  InvestorList,
  InvestorProfile,
  DealDetail,
  PipelineChart,
  CapitalDashboard,
} from './components';

// ============================================================================
// CAPITAL ALLOCATION MODULE (6.4)
// ============================================================================

// Allocation Constants
export {
  FUND_TYPES,
  FUND_TYPE_LABELS,
  FUND_TYPE_COLORS,
  ALLOCATION_FUND_STATUS,
  ALLOCATION_FUND_STATUS_LABELS,
  ALLOCATION_FUND_STATUS_COLORS,
  CAPITAL_CALL_STATUS,
  CAPITAL_CALL_STATUS_LABELS,
  CAPITAL_CALL_STATUS_COLORS,
  DISTRIBUTION_TYPES,
  DISTRIBUTION_TYPE_LABELS,
  PORTFOLIO_INVESTMENT_STATUS,
  PORTFOLIO_INVESTMENT_STATUS_LABELS,
  PORTFOLIO_INVESTMENT_STATUS_COLORS,
  WATERFALL_TIERS,
  WATERFALL_TIER_LABELS,
  ALLOCATION_SECTORS,
  ALLOCATION_SECTOR_LABELS,
  ALLOCATION_SECTOR_COLORS,
  GEOGRAPHIC_ALLOCATIONS,
  GEOGRAPHIC_ALLOCATION_LABELS,
  GEOGRAPHIC_ALLOCATION_COLORS,
  FUND_CURRENCIES,
  CURRENCY_LABELS,
  CURRENCY_SYMBOLS,
  LP_REPORT_TYPES,
  LP_REPORT_TYPE_LABELS,
  LP_COMMITMENT_STATUS,
  LP_COMMITMENT_STATUS_LABELS,
  VALUATION_METHODS,
  VALUATION_METHOD_LABELS,
  EXIT_TYPES,
  EXIT_TYPE_LABELS,
  DEFAULT_FUND_TERMS,
  ALLOCATION_LIMITS,
} from './constants/allocation.constants';

export type {
  FundType,
  AllocationFundStatus,
  CapitalCallStatus,
  DistributionType,
  PortfolioInvestmentStatus,
  WaterfallTier,
  AllocationSector,
  GeographicAllocation,
  FundCurrency,
  LPReportType,
  LPCommitmentStatus,
  ValuationMethod,
  ExitType,
} from './constants/allocation.constants';

// Allocation Types
export type {
  AllocationFund,
  FundTerms,
  GeneralPartner,
  InvestmentStrategy,
  AllocationLimits as AllocationLimitsType,
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
  FundFormInput,
  LPCommitmentFormInput,
  CapitalCallFormInput,
  DistributionFormInput,
  PortfolioInvestmentFormInput,
  ValuationRecordFormInput,
  LPReportFormInput,
  AllocationFundFilters,
  PortfolioInvestmentFilters,
  CapitalCallFilters,
  DistributionFilters,
} from './types/allocation.types';

// Allocation Schemas
export {
  fundTermsSchema,
  generalPartnerSchema,
  investmentStrategySchema,
  allocationLimitsSchema,
  allocationFundSchema,
  allocationFundUpdateSchema,
  lpCommitmentSchema,
  lpCommitmentUpdateSchema,
  capitalCallSchema,
  distributionBreakdownSchema,
  distributionSchema,
  portfolioInvestmentSchema,
  portfolioInvestmentUpdateSchema,
  valuationRecordSchema,
  exitRecordSchema,
  lpReportSchema,
} from './schemas/allocation.schemas';

export type {
  AllocationFundFormData,
  AllocationFundUpdateData,
  FundTermsFormData,
  GeneralPartnerFormData,
  InvestmentStrategyFormData,
  AllocationLimitsFormData,
  LPCommitmentFormData,
  LPCommitmentUpdateData,
  CapitalCallFormData,
  DistributionBreakdownFormData,
  DistributionFormData,
  PortfolioInvestmentFormData,
  PortfolioInvestmentUpdateData,
  ValuationRecordFormData,
  ExitRecordFormData,
  LPReportFormData,
} from './schemas/allocation.schemas';

// Allocation Services
export {
  createAllocationFund,
  getAllocationFund,
  getAllocationFunds,
  updateAllocationFund,
  updateAllocationFundStatus,
  calculateFundMetrics,
  createLPCommitment,
  getLPCommitments,
  getLPCommitment,
  createCapitalCall,
  getCapitalCalls,
  getCapitalCall,
  issueCapitalCall,
  recordLPFunding,
  createDistribution,
  getDistributions,
  getDistribution,
  approveDistribution,
  payDistribution,
  calculateWaterfall,
  createPortfolioInvestment,
  getPortfolioInvestments,
  getPortfolioInvestment,
  updateInvestmentValuation,
  recordFollowOnInvestment,
  recordExit,
  updateInvestmentStatus,
  createLPReport,
  getLPReports,
  getLPReport,
  updateLPReportStatus,
  distributeLPReport,
  calculateAllocationAnalytics,
} from './services/allocationService';

// Allocation Hooks
export { useAllocation } from './hooks/useAllocation';

// Allocation Components
export {
  FundCard,
  PortfolioAllocation,
  WaterfallCalculator,
  AllocationDashboard,
} from './components/allocation';
