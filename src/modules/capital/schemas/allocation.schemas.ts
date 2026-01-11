// ============================================================================
// ALLOCATION SCHEMAS
// DawinOS v2.0 - Capital Hub Module
// Zod validation schemas for Capital Allocation & Fund Management
// ============================================================================

import { z } from 'zod';
import {
  FUND_TYPES,
  ALLOCATION_FUND_STATUS,
  DISTRIBUTION_TYPES,
  ALLOCATION_SECTORS,
  GEOGRAPHIC_ALLOCATIONS,
  FUND_CURRENCIES,
  LP_REPORT_TYPES,
  VALUATION_METHODS,
  EXIT_TYPES,
  DEFAULT_FUND_TERMS,
  LP_COMMITMENT_STATUS,
} from '../constants/allocation.constants';

// ----------------------------------------------------------------------------
// HELPER SCHEMAS
// ----------------------------------------------------------------------------

const fundTypeValues = Object.values(FUND_TYPES) as [string, ...string[]];
const fundStatusValues = Object.values(ALLOCATION_FUND_STATUS) as [string, ...string[]];
const currencyValues = Object.values(FUND_CURRENCIES) as [string, ...string[]];
const sectorValues = Object.values(ALLOCATION_SECTORS) as [string, ...string[]];
const geographyValues = Object.values(GEOGRAPHIC_ALLOCATIONS) as [string, ...string[]];
const distributionTypeValues = Object.values(DISTRIBUTION_TYPES) as [string, ...string[]];
const valuationMethodValues = Object.values(VALUATION_METHODS) as [string, ...string[]];
const exitTypeValues = Object.values(EXIT_TYPES) as [string, ...string[]];
const reportTypeValues = Object.values(LP_REPORT_TYPES) as [string, ...string[]];
const lpCommitmentStatusValues = Object.values(LP_COMMITMENT_STATUS) as [string, ...string[]];

// ----------------------------------------------------------------------------
// FUND SCHEMAS
// ----------------------------------------------------------------------------

export const fundTermsSchema = z.object({
  managementFeeRate: z.number().min(0).max(5).default(DEFAULT_FUND_TERMS.managementFeeRate),
  managementFeeBasis: z.enum(['committed', 'invested', 'nav']).default('committed'),
  carriedInterestRate: z.number().min(0).max(50).default(DEFAULT_FUND_TERMS.carriedInterestRate),
  preferredReturnRate: z.number().min(0).max(20).default(DEFAULT_FUND_TERMS.preferredReturnRate),
  gpCatchupRate: z.number().min(0).max(100).default(DEFAULT_FUND_TERMS.gpCatchupRate),
  waterfallType: z.enum(['american', 'european']).default('european'),
  clawbackProvision: z.boolean().default(true),
  keyPersonProvision: z.boolean().default(true),
  noFaultDivorce: z.boolean().default(true),
  investmentPeriodYears: z.number().int().min(1).max(10).default(DEFAULT_FUND_TERMS.investmentPeriodYears),
  fundLifeYears: z.number().int().min(5).max(20).default(DEFAULT_FUND_TERMS.fundLifeYears),
  extensionYears: z.number().int().min(0).max(5).default(DEFAULT_FUND_TERMS.extensionYears),
  extensionApprovalThreshold: z.number().min(50).max(100).default(66.67),
});

export const generalPartnerSchema = z.object({
  entityName: z.string().min(1, 'GP entity name is required'),
  principalNames: z.array(z.string()).min(1, 'At least one principal required'),
  keyPersons: z.array(z.string()).min(1, 'At least one key person required'),
  gpCommitmentAmount: z.number().min(0),
  gpCommitmentSource: z.enum(['cash', 'fee_waiver', 'mixed']).default('cash'),
});

export const investmentStrategySchema = z.object({
  description: z.string().min(10, 'Strategy description required'),
  targetSectors: z.array(z.enum(sectorValues)).min(1),
  targetGeographies: z.array(z.enum(geographyValues)).min(1),
  investmentSizeMin: z.number().min(0),
  investmentSizeMax: z.number().min(0),
  holdingPeriodYears: z.number().int().min(1).max(15),
  targetInvestmentCount: z.number().int().min(1),
  coInvestmentAllowed: z.boolean().default(true),
  followOnReserve: z.number().min(0).max(100).default(30),
}).refine(data => data.investmentSizeMax >= data.investmentSizeMin, {
  message: 'Max investment size must be >= min investment size',
  path: ['investmentSizeMax'],
});

export const allocationLimitsSchema = z.object({
  maxSingleInvestmentPercent: z.number().min(1).max(50).default(15),
  maxSectorConcentrationPercent: z.number().min(10).max(100).default(40),
  maxGeographicConcentrationPercent: z.number().min(20).max(100).default(60),
  minDiversification: z.number().int().min(1).max(50).default(8),
});

export const allocationFundSchema = z.object({
  name: z.string().min(1, 'Fund name is required').max(200),
  shortName: z.string().min(1).max(50),
  fundType: z.enum(fundTypeValues),
  status: z.enum(fundStatusValues).default('formation'),
  currency: z.enum(currencyValues).default('USD'),
  
  targetSize: z.number().min(100000, 'Target size must be at least $100K'),
  hardCap: z.number().min(100000),
  minCommitment: z.number().min(1000).default(DEFAULT_FUND_TERMS.minCommitment),
  maxCommitment: z.number().min(1000).default(DEFAULT_FUND_TERMS.maxCommitment),
  
  inceptionDate: z.date(),
  firstCloseDate: z.date().optional(),
  finalCloseDate: z.date().optional(),
  investmentPeriodEndDate: z.date().optional(),
  terminationDate: z.date().optional(),
  
  terms: fundTermsSchema,
  gpCommitment: z.number().min(0),
  gpCommitmentPercentage: z.number().min(0).max(100),
  generalPartner: generalPartnerSchema,
  strategy: investmentStrategySchema,
  allocationLimits: allocationLimitsSchema,
}).refine(data => data.hardCap >= data.targetSize, {
  message: 'Hard cap must be >= target size',
  path: ['hardCap'],
}).refine(data => data.maxCommitment >= data.minCommitment, {
  message: 'Max commitment must be >= min commitment',
  path: ['maxCommitment'],
});

export const allocationFundUpdateSchema = allocationFundSchema.partial();

// ----------------------------------------------------------------------------
// LP COMMITMENT SCHEMA
// ----------------------------------------------------------------------------

export const lpCommitmentSchema = z.object({
  fundId: z.string().min(1),
  investorId: z.string().min(1),
  commitmentAmount: z.number().min(1000, 'Minimum commitment is $1,000'),
  commitmentDate: z.date(),
  commitmentCurrency: z.enum(currencyValues).default('USD'),
  exchangeRate: z.number().optional(),
  investorName: z.string().min(1),
  investorType: z.string().min(1),
  status: z.enum(lpCommitmentStatusValues).default('active'),
});

export const lpCommitmentUpdateSchema = lpCommitmentSchema.partial().omit({ fundId: true, investorId: true });

// ----------------------------------------------------------------------------
// CAPITAL CALL SCHEMA
// ----------------------------------------------------------------------------

export const capitalCallSchema = z.object({
  fundId: z.string().min(1),
  callDate: z.date(),
  dueDate: z.date(),
  investmentAmount: z.number().min(0),
  managementFeeAmount: z.number().min(0),
  partnershipExpensesAmount: z.number().min(0).default(0),
  organizationalCostsAmount: z.number().min(0).default(0),
  purpose: z.string().min(1, 'Purpose is required'),
  investmentIds: z.array(z.string()).optional(),
}).refine(data => data.dueDate > data.callDate, {
  message: 'Due date must be after call date',
  path: ['dueDate'],
}).refine(data => {
  const total = data.investmentAmount + data.managementFeeAmount + 
                data.partnershipExpensesAmount + data.organizationalCostsAmount;
  return total > 0;
}, {
  message: 'Total call amount must be greater than zero',
});

// ----------------------------------------------------------------------------
// DISTRIBUTION SCHEMA
// ----------------------------------------------------------------------------

export const distributionBreakdownSchema = z.object({
  type: z.enum(distributionTypeValues),
  amount: z.number().min(0),
  taxWithheld: z.number().min(0).optional(),
});

export const distributionSchema = z.object({
  fundId: z.string().min(1),
  distributionDate: z.date(),
  recordDate: z.date(),
  breakdown: z.array(distributionBreakdownSchema).min(1, 'At least one distribution type required'),
  sourceInvestmentIds: z.array(z.string()).optional(),
  sourceDescription: z.string().min(1, 'Source description required'),
}).refine(data => data.recordDate <= data.distributionDate, {
  message: 'Record date must be on or before distribution date',
  path: ['recordDate'],
});

// ----------------------------------------------------------------------------
// PORTFOLIO INVESTMENT SCHEMA
// ----------------------------------------------------------------------------

export const portfolioInvestmentSchema = z.object({
  fundId: z.string().min(1),
  companyName: z.string().min(1, 'Company name is required').max(200),
  companyDescription: z.string().min(10, 'Description required').max(2000),
  sector: z.enum(sectorValues),
  geography: z.enum(geographyValues),
  website: z.string().url().optional().or(z.literal('')),
  
  investmentDate: z.date(),
  initialInvestment: z.number().min(1, 'Initial investment is required'),
  ownershipPercent: z.number().min(0.01).max(100),
  fullyDilutedOwnership: z.number().min(0).max(100).optional(),
  boardSeats: z.number().int().min(0).default(0),
  
  currentValuation: z.number().min(0),
  valuationMethod: z.enum(valuationMethodValues),
  valuationNotes: z.string().optional(),
  
  dealId: z.string().optional(),
});

export const portfolioInvestmentUpdateSchema = portfolioInvestmentSchema.partial().omit({ fundId: true });

// ----------------------------------------------------------------------------
// VALUATION RECORD SCHEMA
// ----------------------------------------------------------------------------

export const valuationRecordSchema = z.object({
  investmentId: z.string().min(1),
  valuationDate: z.date(),
  newValuation: z.number().min(0),
  method: z.enum(valuationMethodValues),
  methodology: z.string().min(10, 'Methodology description required'),
  supportingMetrics: z.object({
    revenue: z.number().optional(),
    ebitda: z.number().optional(),
    netIncome: z.number().optional(),
    employeeCount: z.number().int().optional(),
    customMetrics: z.record(z.string(), z.number()).optional(),
  }).optional(),
  notes: z.string().optional(),
});

// ----------------------------------------------------------------------------
// EXIT SCHEMA
// ----------------------------------------------------------------------------

export const exitRecordSchema = z.object({
  investmentId: z.string().min(1),
  exitDate: z.date(),
  exitType: z.enum(exitTypeValues),
  exitProceeds: z.number().min(0),
  notes: z.string().optional(),
});

// ----------------------------------------------------------------------------
// LP REPORT SCHEMA
// ----------------------------------------------------------------------------

export const lpReportSchema = z.object({
  fundId: z.string().min(1),
  reportType: z.enum(reportTypeValues),
  reportPeriodStart: z.date(),
  reportPeriodEnd: z.date(),
  title: z.string().min(1, 'Report title required'),
  recipientInvestorIds: z.array(z.string()).default([]),
}).refine(data => data.reportPeriodEnd > data.reportPeriodStart, {
  message: 'Report period end must be after start',
  path: ['reportPeriodEnd'],
});

// ----------------------------------------------------------------------------
// TYPE EXPORTS
// ----------------------------------------------------------------------------

export type AllocationFundFormData = z.infer<typeof allocationFundSchema>;
export type AllocationFundUpdateData = z.infer<typeof allocationFundUpdateSchema>;
export type FundTermsFormData = z.infer<typeof fundTermsSchema>;
export type GeneralPartnerFormData = z.infer<typeof generalPartnerSchema>;
export type InvestmentStrategyFormData = z.infer<typeof investmentStrategySchema>;
export type AllocationLimitsFormData = z.infer<typeof allocationLimitsSchema>;
export type LPCommitmentFormData = z.infer<typeof lpCommitmentSchema>;
export type LPCommitmentUpdateData = z.infer<typeof lpCommitmentUpdateSchema>;
export type CapitalCallFormData = z.infer<typeof capitalCallSchema>;
export type DistributionBreakdownFormData = z.infer<typeof distributionBreakdownSchema>;
export type DistributionFormData = z.infer<typeof distributionSchema>;
export type PortfolioInvestmentFormData = z.infer<typeof portfolioInvestmentSchema>;
export type PortfolioInvestmentUpdateData = z.infer<typeof portfolioInvestmentUpdateSchema>;
export type ValuationRecordFormData = z.infer<typeof valuationRecordSchema>;
export type ExitRecordFormData = z.infer<typeof exitRecordSchema>;
export type LPReportFormData = z.infer<typeof lpReportSchema>;
