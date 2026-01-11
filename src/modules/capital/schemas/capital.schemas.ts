// ============================================================================
// CAPITAL HUB SCHEMAS
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

import { z } from 'zod';
import {
  DEAL_STAGES,
  INVESTMENT_TYPES,
  INVESTOR_TYPES,
  SUPPORTED_CURRENCIES,
  ACTIVITY_TYPES,
  FUND_STATUS,
  COMMITMENT_STATUS,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// DEAL SCHEMA
// ----------------------------------------------------------------------------

export const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required').max(200),
  description: z.string().max(2000),
  sector: z.string().min(1, 'Sector is required'),
  
  investmentType: z.enum([
    INVESTMENT_TYPES.EQUITY,
    INVESTMENT_TYPES.DEBT,
    INVESTMENT_TYPES.CONVERTIBLE,
    INVESTMENT_TYPES.GRANT,
    INVESTMENT_TYPES.MEZZANINE,
    INVESTMENT_TYPES.PROJECT_FINANCE,
  ]),
  targetAmount: z.number().positive('Target amount must be positive'),
  minimumTicket: z.number().positive(),
  maximumTicket: z.number().positive().optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).default('UGX'),
  
  preMoneyValuation: z.number().positive().optional(),
  equityOffered: z.number().min(0).max(100).optional(),
  interestRate: z.number().min(0).max(100).optional(),
  tenor: z.number().positive().optional(),
  
  stage: z.enum([
    DEAL_STAGES.LEAD,
    DEAL_STAGES.QUALIFICATION,
    DEAL_STAGES.PROPOSAL,
    DEAL_STAGES.NEGOTIATION,
    DEAL_STAGES.DUE_DILIGENCE,
    DEAL_STAGES.DOCUMENTATION,
    DEAL_STAGES.CLOSING,
    DEAL_STAGES.CLOSED_WON,
    DEAL_STAGES.CLOSED_LOST,
  ]).default('lead'),
  expectedCloseDate: z.date().optional(),
  
  leadAdvisorId: z.string().min(1, 'Lead advisor is required'),
  teamMemberIds: z.array(z.string()).optional(),
  
  targetEntityName: z.string().min(1, 'Target entity is required').max(200),
  targetEntityType: z.enum(['company', 'project', 'fund']),
  location: z.string().max(100).optional(),
  
  dealStartDate: z.date(),
  
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
});

export type DealInput = z.infer<typeof dealSchema>;

// ----------------------------------------------------------------------------
// INVESTOR SCHEMA
// ----------------------------------------------------------------------------

export const investorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum([
    INVESTOR_TYPES.INDIVIDUAL,
    INVESTOR_TYPES.INSTITUTIONAL,
    INVESTOR_TYPES.CORPORATE,
    INVESTOR_TYPES.FAMILY_OFFICE,
    INVESTOR_TYPES.DFI,
    INVESTOR_TYPES.GOVERNMENT,
    INVESTOR_TYPES.FOUNDATION,
  ]),
  
  primaryContactName: z.string().min(1, 'Contact name is required').max(200),
  primaryContactEmail: z.string().email('Valid email required'),
  primaryContactPhone: z.string().max(20).optional(),
  
  organizationName: z.string().max(200).optional(),
  organizationType: z.string().max(100).optional(),
  headquarters: z.string().max(100).optional(),
  website: z.string().url().optional().or(z.literal('')),
  
  investmentFocus: z.array(z.string()).min(1, 'At least one investment focus required'),
  sectorPreferences: z.array(z.string()),
  geographicFocus: z.array(z.string()),
  
  minTicketSize: z.number().positive(),
  maxTicketSize: z.number().positive(),
  preferredCurrency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  
  investmentTypesPreferred: z.array(z.enum([
    INVESTMENT_TYPES.EQUITY,
    INVESTMENT_TYPES.DEBT,
    INVESTMENT_TYPES.CONVERTIBLE,
    INVESTMENT_TYPES.GRANT,
    INVESTMENT_TYPES.MEZZANINE,
    INVESTMENT_TYPES.PROJECT_FINANCE,
  ])),
  
  relationshipOwnerId: z.string().min(1, 'Relationship owner is required'),
  
  source: z.string().max(100),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(5000).optional(),
}).refine(
  (data) => data.maxTicketSize >= data.minTicketSize,
  { message: 'Max ticket must be >= min ticket', path: ['maxTicketSize'] }
);

export type InvestorInput = z.infer<typeof investorSchema>;

// ----------------------------------------------------------------------------
// COMMITMENT SCHEMA
// ----------------------------------------------------------------------------

export const commitmentSchema = z.object({
  dealId: z.string().min(1, 'Deal is required'),
  investorId: z.string().min(1, 'Investor is required'),
  
  committedAmount: z.number().positive('Amount must be positive'),
  currency: z.enum(SUPPORTED_CURRENCIES),
  commitmentDate: z.date(),
  
  investmentType: z.enum([
    INVESTMENT_TYPES.EQUITY,
    INVESTMENT_TYPES.DEBT,
    INVESTMENT_TYPES.CONVERTIBLE,
    INVESTMENT_TYPES.GRANT,
    INVESTMENT_TYPES.MEZZANINE,
    INVESTMENT_TYPES.PROJECT_FINANCE,
  ]),
  equityPercentage: z.number().min(0).max(100).optional(),
  interestRate: z.number().min(0).max(100).optional(),
});

export type CommitmentInput = z.infer<typeof commitmentSchema>;

// ----------------------------------------------------------------------------
// COMMITMENT STATUS UPDATE SCHEMA
// ----------------------------------------------------------------------------

export const commitmentStatusUpdateSchema = z.object({
  status: z.enum([
    COMMITMENT_STATUS.SOFT,
    COMMITMENT_STATUS.FIRM,
    COMMITMENT_STATUS.DOCUMENTED,
    COMMITMENT_STATUS.FUNDED,
    COMMITMENT_STATUS.CANCELLED,
  ]),
  fundedAmount: z.number().min(0).optional(),
});

export type CommitmentStatusUpdateInput = z.infer<typeof commitmentStatusUpdateSchema>;

// ----------------------------------------------------------------------------
// ACTIVITY SCHEMA
// ----------------------------------------------------------------------------

export const dealActivitySchema = z.object({
  dealId: z.string().min(1, 'Deal is required'),
  type: z.enum([
    ACTIVITY_TYPES.CALL,
    ACTIVITY_TYPES.MEETING,
    ACTIVITY_TYPES.EMAIL,
    ACTIVITY_TYPES.DOCUMENT,
    ACTIVITY_TYPES.STAGE_CHANGE,
    ACTIVITY_TYPES.NOTE,
    ACTIVITY_TYPES.TASK,
  ]),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  participants: z.array(z.string()).optional(),
  investorIds: z.array(z.string()).optional(),
  outcome: z.string().max(1000).optional(),
  nextSteps: z.array(z.string()).optional(),
});

export type DealActivityInput = z.infer<typeof dealActivitySchema>;

// ----------------------------------------------------------------------------
// FUND SCHEMA
// ----------------------------------------------------------------------------

export const fundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').max(200),
  description: z.string().max(2000),
  vintage: z.number().min(2000).max(2100),
  
  targetSize: z.number().positive(),
  hardCap: z.number().positive().optional(),
  minimumCommitment: z.number().positive(),
  currency: z.enum(SUPPORTED_CURRENCIES).default('USD'),
  
  status: z.enum([
    FUND_STATUS.RAISING,
    FUND_STATUS.DEPLOYING,
    FUND_STATUS.INVESTED,
    FUND_STATUS.HARVESTING,
    FUND_STATUS.CLOSED,
  ]).default('raising'),
  
  fundraisingStartDate: z.date(),
  fundraisingEndDate: z.date().optional(),
  investmentPeriodEnd: z.date().optional(),
  fundEndDate: z.date().optional(),
  
  managementFeeRate: z.number().min(0).max(10),
  carriedInterestRate: z.number().min(0).max(50),
  hurdleRate: z.number().min(0).max(20).optional(),
});

export type FundInput = z.infer<typeof fundSchema>;

// ----------------------------------------------------------------------------
// DEAL UPDATE SCHEMA
// ----------------------------------------------------------------------------

export const dealUpdateSchema = dealSchema.partial();

export type DealUpdateInput = z.infer<typeof dealUpdateSchema>;

// ----------------------------------------------------------------------------
// INVESTOR UPDATE SCHEMA
// ----------------------------------------------------------------------------

export const investorUpdateSchema = investorSchema.partial();

export type InvestorUpdateInput = z.infer<typeof investorUpdateSchema>;

// ----------------------------------------------------------------------------
// STAGE CHANGE SCHEMA
// ----------------------------------------------------------------------------

export const stageChangeSchema = z.object({
  newStage: z.enum([
    DEAL_STAGES.LEAD,
    DEAL_STAGES.QUALIFICATION,
    DEAL_STAGES.PROPOSAL,
    DEAL_STAGES.NEGOTIATION,
    DEAL_STAGES.DUE_DILIGENCE,
    DEAL_STAGES.DOCUMENTATION,
    DEAL_STAGES.CLOSING,
    DEAL_STAGES.CLOSED_WON,
    DEAL_STAGES.CLOSED_LOST,
  ]),
  notes: z.string().max(1000).optional(),
  lostReason: z.string().max(500).optional(),
});

export type StageChangeInput = z.infer<typeof stageChangeSchema>;
