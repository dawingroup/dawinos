// ============================================================================
// ALLOCATION CONSTANTS
// DawinOS v2.0 - Capital Hub Module
// Constants for Capital Allocation & Fund Management
// ============================================================================

// ----------------------------------------------------------------------------
// FUND TYPES
// ----------------------------------------------------------------------------

export const FUND_TYPES = {
  PRIVATE_EQUITY: 'private_equity',
  VENTURE_CAPITAL: 'venture_capital',
  INFRASTRUCTURE: 'infrastructure',
  REAL_ESTATE: 'real_estate',
  DEBT: 'debt',
  MEZZANINE: 'mezzanine',
  FUND_OF_FUNDS: 'fund_of_funds',
  IMPACT: 'impact',
  GROWTH_EQUITY: 'growth_equity',
  SEARCH_FUND: 'search_fund',
} as const;

export type FundType = typeof FUND_TYPES[keyof typeof FUND_TYPES];

export const FUND_TYPE_LABELS: Record<FundType, string> = {
  [FUND_TYPES.PRIVATE_EQUITY]: 'Private Equity',
  [FUND_TYPES.VENTURE_CAPITAL]: 'Venture Capital',
  [FUND_TYPES.INFRASTRUCTURE]: 'Infrastructure',
  [FUND_TYPES.REAL_ESTATE]: 'Real Estate',
  [FUND_TYPES.DEBT]: 'Debt / Credit',
  [FUND_TYPES.MEZZANINE]: 'Mezzanine',
  [FUND_TYPES.FUND_OF_FUNDS]: 'Fund of Funds',
  [FUND_TYPES.IMPACT]: 'Impact',
  [FUND_TYPES.GROWTH_EQUITY]: 'Growth Equity',
  [FUND_TYPES.SEARCH_FUND]: 'Search Fund',
};

export const FUND_TYPE_COLORS: Record<FundType, string> = {
  [FUND_TYPES.PRIVATE_EQUITY]: '#1976D2',
  [FUND_TYPES.VENTURE_CAPITAL]: '#9C27B0',
  [FUND_TYPES.INFRASTRUCTURE]: '#FF9800',
  [FUND_TYPES.REAL_ESTATE]: '#4CAF50',
  [FUND_TYPES.DEBT]: '#607D8B',
  [FUND_TYPES.MEZZANINE]: '#795548',
  [FUND_TYPES.FUND_OF_FUNDS]: '#00BCD4',
  [FUND_TYPES.IMPACT]: '#E91E63',
  [FUND_TYPES.GROWTH_EQUITY]: '#3F51B5',
  [FUND_TYPES.SEARCH_FUND]: '#009688',
};

// ----------------------------------------------------------------------------
// FUND STATUS
// ----------------------------------------------------------------------------

export const ALLOCATION_FUND_STATUS = {
  FORMATION: 'formation',
  FUNDRAISING: 'fundraising',
  INVESTING: 'investing',
  HARVEST: 'harvest',
  LIQUIDATION: 'liquidation',
  CLOSED: 'closed',
} as const;

export type AllocationFundStatus = typeof ALLOCATION_FUND_STATUS[keyof typeof ALLOCATION_FUND_STATUS];

export const ALLOCATION_FUND_STATUS_LABELS: Record<AllocationFundStatus, string> = {
  [ALLOCATION_FUND_STATUS.FORMATION]: 'Formation',
  [ALLOCATION_FUND_STATUS.FUNDRAISING]: 'Fundraising',
  [ALLOCATION_FUND_STATUS.INVESTING]: 'Investing',
  [ALLOCATION_FUND_STATUS.HARVEST]: 'Harvest',
  [ALLOCATION_FUND_STATUS.LIQUIDATION]: 'Liquidation',
  [ALLOCATION_FUND_STATUS.CLOSED]: 'Closed',
};

export const ALLOCATION_FUND_STATUS_COLORS: Record<AllocationFundStatus, string> = {
  [ALLOCATION_FUND_STATUS.FORMATION]: '#9E9E9E',
  [ALLOCATION_FUND_STATUS.FUNDRAISING]: '#2196F3',
  [ALLOCATION_FUND_STATUS.INVESTING]: '#4CAF50',
  [ALLOCATION_FUND_STATUS.HARVEST]: '#FF9800',
  [ALLOCATION_FUND_STATUS.LIQUIDATION]: '#F44336',
  [ALLOCATION_FUND_STATUS.CLOSED]: '#607D8B',
};

// ----------------------------------------------------------------------------
// CAPITAL CALL STATUS
// ----------------------------------------------------------------------------

export const CAPITAL_CALL_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  PARTIALLY_FUNDED: 'partially_funded',
  FULLY_FUNDED: 'fully_funded',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

export type CapitalCallStatus = typeof CAPITAL_CALL_STATUS[keyof typeof CAPITAL_CALL_STATUS];

export const CAPITAL_CALL_STATUS_LABELS: Record<CapitalCallStatus, string> = {
  [CAPITAL_CALL_STATUS.DRAFT]: 'Draft',
  [CAPITAL_CALL_STATUS.ISSUED]: 'Issued',
  [CAPITAL_CALL_STATUS.PARTIALLY_FUNDED]: 'Partially Funded',
  [CAPITAL_CALL_STATUS.FULLY_FUNDED]: 'Fully Funded',
  [CAPITAL_CALL_STATUS.OVERDUE]: 'Overdue',
  [CAPITAL_CALL_STATUS.CANCELLED]: 'Cancelled',
};

export const CAPITAL_CALL_STATUS_COLORS: Record<CapitalCallStatus, string> = {
  [CAPITAL_CALL_STATUS.DRAFT]: '#9E9E9E',
  [CAPITAL_CALL_STATUS.ISSUED]: '#2196F3',
  [CAPITAL_CALL_STATUS.PARTIALLY_FUNDED]: '#FF9800',
  [CAPITAL_CALL_STATUS.FULLY_FUNDED]: '#4CAF50',
  [CAPITAL_CALL_STATUS.OVERDUE]: '#F44336',
  [CAPITAL_CALL_STATUS.CANCELLED]: '#607D8B',
};

// ----------------------------------------------------------------------------
// DISTRIBUTION TYPES
// ----------------------------------------------------------------------------

export const DISTRIBUTION_TYPES = {
  RETURN_OF_CAPITAL: 'return_of_capital',
  CAPITAL_GAIN: 'capital_gain',
  DIVIDEND: 'dividend',
  INTEREST: 'interest',
  WITHHOLDING_TAX: 'withholding_tax',
  RECALLABLE: 'recallable',
} as const;

export type DistributionType = typeof DISTRIBUTION_TYPES[keyof typeof DISTRIBUTION_TYPES];

export const DISTRIBUTION_TYPE_LABELS: Record<DistributionType, string> = {
  [DISTRIBUTION_TYPES.RETURN_OF_CAPITAL]: 'Return of Capital',
  [DISTRIBUTION_TYPES.CAPITAL_GAIN]: 'Capital Gain',
  [DISTRIBUTION_TYPES.DIVIDEND]: 'Dividend',
  [DISTRIBUTION_TYPES.INTEREST]: 'Interest',
  [DISTRIBUTION_TYPES.WITHHOLDING_TAX]: 'Withholding Tax',
  [DISTRIBUTION_TYPES.RECALLABLE]: 'Recallable Distribution',
};

// ----------------------------------------------------------------------------
// INVESTMENT STATUS
// ----------------------------------------------------------------------------

export const PORTFOLIO_INVESTMENT_STATUS = {
  COMMITTED: 'committed',
  FUNDED: 'funded',
  ACTIVE: 'active',
  IMPAIRED: 'impaired',
  REALIZED: 'realized',
  WRITTEN_OFF: 'written_off',
} as const;

export type PortfolioInvestmentStatus = typeof PORTFOLIO_INVESTMENT_STATUS[keyof typeof PORTFOLIO_INVESTMENT_STATUS];

export const PORTFOLIO_INVESTMENT_STATUS_LABELS: Record<PortfolioInvestmentStatus, string> = {
  [PORTFOLIO_INVESTMENT_STATUS.COMMITTED]: 'Committed',
  [PORTFOLIO_INVESTMENT_STATUS.FUNDED]: 'Funded',
  [PORTFOLIO_INVESTMENT_STATUS.ACTIVE]: 'Active',
  [PORTFOLIO_INVESTMENT_STATUS.IMPAIRED]: 'Impaired',
  [PORTFOLIO_INVESTMENT_STATUS.REALIZED]: 'Realized',
  [PORTFOLIO_INVESTMENT_STATUS.WRITTEN_OFF]: 'Written Off',
};

export const PORTFOLIO_INVESTMENT_STATUS_COLORS: Record<PortfolioInvestmentStatus, string> = {
  [PORTFOLIO_INVESTMENT_STATUS.COMMITTED]: '#9E9E9E',
  [PORTFOLIO_INVESTMENT_STATUS.FUNDED]: '#2196F3',
  [PORTFOLIO_INVESTMENT_STATUS.ACTIVE]: '#4CAF50',
  [PORTFOLIO_INVESTMENT_STATUS.IMPAIRED]: '#FF9800',
  [PORTFOLIO_INVESTMENT_STATUS.REALIZED]: '#00BCD4',
  [PORTFOLIO_INVESTMENT_STATUS.WRITTEN_OFF]: '#F44336',
};

// ----------------------------------------------------------------------------
// WATERFALL TIERS
// ----------------------------------------------------------------------------

export const WATERFALL_TIERS = {
  RETURN_OF_CAPITAL: 'return_of_capital',
  PREFERRED_RETURN: 'preferred_return',
  GP_CATCHUP: 'gp_catchup',
  CARRIED_INTEREST: 'carried_interest',
} as const;

export type WaterfallTier = typeof WATERFALL_TIERS[keyof typeof WATERFALL_TIERS];

export const WATERFALL_TIER_LABELS: Record<WaterfallTier, string> = {
  [WATERFALL_TIERS.RETURN_OF_CAPITAL]: 'Return of Capital',
  [WATERFALL_TIERS.PREFERRED_RETURN]: 'Preferred Return',
  [WATERFALL_TIERS.GP_CATCHUP]: 'GP Catch-up',
  [WATERFALL_TIERS.CARRIED_INTEREST]: 'Carried Interest',
};

// ----------------------------------------------------------------------------
// ALLOCATION SECTORS (Uganda Focus)
// ----------------------------------------------------------------------------

export const ALLOCATION_SECTORS = {
  INFRASTRUCTURE: 'infrastructure',
  HEALTHCARE: 'healthcare',
  AGRICULTURE: 'agriculture',
  TECHNOLOGY: 'technology',
  FINANCIAL_SERVICES: 'financial_services',
  MANUFACTURING: 'manufacturing',
  REAL_ESTATE: 'real_estate',
  EDUCATION: 'education',
  ENERGY: 'energy',
  CONSUMER_GOODS: 'consumer_goods',
  TOURISM: 'tourism',
  LOGISTICS: 'logistics',
} as const;

export type AllocationSector = typeof ALLOCATION_SECTORS[keyof typeof ALLOCATION_SECTORS];

export const ALLOCATION_SECTOR_LABELS: Record<AllocationSector, string> = {
  [ALLOCATION_SECTORS.INFRASTRUCTURE]: 'Infrastructure',
  [ALLOCATION_SECTORS.HEALTHCARE]: 'Healthcare',
  [ALLOCATION_SECTORS.AGRICULTURE]: 'Agriculture',
  [ALLOCATION_SECTORS.TECHNOLOGY]: 'Technology',
  [ALLOCATION_SECTORS.FINANCIAL_SERVICES]: 'Financial Services',
  [ALLOCATION_SECTORS.MANUFACTURING]: 'Manufacturing',
  [ALLOCATION_SECTORS.REAL_ESTATE]: 'Real Estate',
  [ALLOCATION_SECTORS.EDUCATION]: 'Education',
  [ALLOCATION_SECTORS.ENERGY]: 'Energy',
  [ALLOCATION_SECTORS.CONSUMER_GOODS]: 'Consumer Goods',
  [ALLOCATION_SECTORS.TOURISM]: 'Tourism & Hospitality',
  [ALLOCATION_SECTORS.LOGISTICS]: 'Logistics & Transport',
};

export const ALLOCATION_SECTOR_COLORS: Record<AllocationSector, string> = {
  [ALLOCATION_SECTORS.INFRASTRUCTURE]: '#FF9800',
  [ALLOCATION_SECTORS.HEALTHCARE]: '#E91E63',
  [ALLOCATION_SECTORS.AGRICULTURE]: '#8BC34A',
  [ALLOCATION_SECTORS.TECHNOLOGY]: '#2196F3',
  [ALLOCATION_SECTORS.FINANCIAL_SERVICES]: '#673AB7',
  [ALLOCATION_SECTORS.MANUFACTURING]: '#795548',
  [ALLOCATION_SECTORS.REAL_ESTATE]: '#4CAF50',
  [ALLOCATION_SECTORS.EDUCATION]: '#00BCD4',
  [ALLOCATION_SECTORS.ENERGY]: '#FFC107',
  [ALLOCATION_SECTORS.CONSUMER_GOODS]: '#9C27B0',
  [ALLOCATION_SECTORS.TOURISM]: '#3F51B5',
  [ALLOCATION_SECTORS.LOGISTICS]: '#607D8B',
};

// ----------------------------------------------------------------------------
// GEOGRAPHIC ALLOCATIONS
// ----------------------------------------------------------------------------

export const GEOGRAPHIC_ALLOCATIONS = {
  UGANDA: 'uganda',
  KENYA: 'kenya',
  TANZANIA: 'tanzania',
  RWANDA: 'rwanda',
  ETHIOPIA: 'ethiopia',
  DRC: 'drc',
  SOUTH_SUDAN: 'south_sudan',
  EAST_AFRICA_OTHER: 'east_africa_other',
  PAN_AFRICA: 'pan_africa',
} as const;

export type GeographicAllocation = typeof GEOGRAPHIC_ALLOCATIONS[keyof typeof GEOGRAPHIC_ALLOCATIONS];

export const GEOGRAPHIC_ALLOCATION_LABELS: Record<GeographicAllocation, string> = {
  [GEOGRAPHIC_ALLOCATIONS.UGANDA]: 'Uganda',
  [GEOGRAPHIC_ALLOCATIONS.KENYA]: 'Kenya',
  [GEOGRAPHIC_ALLOCATIONS.TANZANIA]: 'Tanzania',
  [GEOGRAPHIC_ALLOCATIONS.RWANDA]: 'Rwanda',
  [GEOGRAPHIC_ALLOCATIONS.ETHIOPIA]: 'Ethiopia',
  [GEOGRAPHIC_ALLOCATIONS.DRC]: 'DR Congo',
  [GEOGRAPHIC_ALLOCATIONS.SOUTH_SUDAN]: 'South Sudan',
  [GEOGRAPHIC_ALLOCATIONS.EAST_AFRICA_OTHER]: 'Other East Africa',
  [GEOGRAPHIC_ALLOCATIONS.PAN_AFRICA]: 'Pan-Africa',
};

export const GEOGRAPHIC_ALLOCATION_COLORS: Record<GeographicAllocation, string> = {
  [GEOGRAPHIC_ALLOCATIONS.UGANDA]: '#FFD700',
  [GEOGRAPHIC_ALLOCATIONS.KENYA]: '#006600',
  [GEOGRAPHIC_ALLOCATIONS.TANZANIA]: '#1EB53A',
  [GEOGRAPHIC_ALLOCATIONS.RWANDA]: '#00A1DE',
  [GEOGRAPHIC_ALLOCATIONS.ETHIOPIA]: '#078930',
  [GEOGRAPHIC_ALLOCATIONS.DRC]: '#007FFF',
  [GEOGRAPHIC_ALLOCATIONS.SOUTH_SUDAN]: '#0F47AF',
  [GEOGRAPHIC_ALLOCATIONS.EAST_AFRICA_OTHER]: '#9E9E9E',
  [GEOGRAPHIC_ALLOCATIONS.PAN_AFRICA]: '#D4AF37',
};

// ----------------------------------------------------------------------------
// CURRENCY CONSTANTS
// ----------------------------------------------------------------------------

export const FUND_CURRENCIES = {
  USD: 'USD',
  UGX: 'UGX',
  EUR: 'EUR',
  GBP: 'GBP',
  KES: 'KES',
} as const;

export type FundCurrency = typeof FUND_CURRENCIES[keyof typeof FUND_CURRENCIES];

export const CURRENCY_LABELS: Record<FundCurrency, string> = {
  [FUND_CURRENCIES.USD]: 'US Dollar',
  [FUND_CURRENCIES.UGX]: 'Uganda Shilling',
  [FUND_CURRENCIES.EUR]: 'Euro',
  [FUND_CURRENCIES.GBP]: 'British Pound',
  [FUND_CURRENCIES.KES]: 'Kenya Shilling',
};

export const CURRENCY_SYMBOLS: Record<FundCurrency, string> = {
  [FUND_CURRENCIES.USD]: '$',
  [FUND_CURRENCIES.UGX]: 'UGX',
  [FUND_CURRENCIES.EUR]: '€',
  [FUND_CURRENCIES.GBP]: '£',
  [FUND_CURRENCIES.KES]: 'KES',
};

// ----------------------------------------------------------------------------
// LP REPORT TYPES
// ----------------------------------------------------------------------------

export const LP_REPORT_TYPES = {
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
  CAPITAL_CALL: 'capital_call',
  DISTRIBUTION: 'distribution',
  K1: 'k1',
  CUSTOM: 'custom',
} as const;

export type LPReportType = typeof LP_REPORT_TYPES[keyof typeof LP_REPORT_TYPES];

export const LP_REPORT_TYPE_LABELS: Record<LPReportType, string> = {
  [LP_REPORT_TYPES.QUARTERLY]: 'Quarterly Report',
  [LP_REPORT_TYPES.ANNUAL]: 'Annual Report',
  [LP_REPORT_TYPES.CAPITAL_CALL]: 'Capital Call Notice',
  [LP_REPORT_TYPES.DISTRIBUTION]: 'Distribution Notice',
  [LP_REPORT_TYPES.K1]: 'K-1 Tax Statement',
  [LP_REPORT_TYPES.CUSTOM]: 'Custom Report',
};

// ----------------------------------------------------------------------------
// LP COMMITMENT STATUS
// ----------------------------------------------------------------------------

export const LP_COMMITMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  DEFAULTED: 'defaulted',
  TRANSFERRED: 'transferred',
  REDEEMED: 'redeemed',
} as const;

export type LPCommitmentStatus = typeof LP_COMMITMENT_STATUS[keyof typeof LP_COMMITMENT_STATUS];

export const LP_COMMITMENT_STATUS_LABELS: Record<LPCommitmentStatus, string> = {
  [LP_COMMITMENT_STATUS.PENDING]: 'Pending',
  [LP_COMMITMENT_STATUS.ACTIVE]: 'Active',
  [LP_COMMITMENT_STATUS.DEFAULTED]: 'Defaulted',
  [LP_COMMITMENT_STATUS.TRANSFERRED]: 'Transferred',
  [LP_COMMITMENT_STATUS.REDEEMED]: 'Redeemed',
};

// ----------------------------------------------------------------------------
// VALUATION METHODS
// ----------------------------------------------------------------------------

export const VALUATION_METHODS = {
  COST: 'cost',
  MARKET: 'market',
  REVENUE_MULTIPLE: 'revenue_multiple',
  EBITDA_MULTIPLE: 'ebitda_multiple',
  DCF: 'dcf',
  COMPARABLE: 'comparable',
  THIRD_PARTY: 'third_party',
} as const;

export type ValuationMethod = typeof VALUATION_METHODS[keyof typeof VALUATION_METHODS];

export const VALUATION_METHOD_LABELS: Record<ValuationMethod, string> = {
  [VALUATION_METHODS.COST]: 'Cost Basis',
  [VALUATION_METHODS.MARKET]: 'Market Value',
  [VALUATION_METHODS.REVENUE_MULTIPLE]: 'Revenue Multiple',
  [VALUATION_METHODS.EBITDA_MULTIPLE]: 'EBITDA Multiple',
  [VALUATION_METHODS.DCF]: 'DCF Analysis',
  [VALUATION_METHODS.COMPARABLE]: 'Comparable Companies',
  [VALUATION_METHODS.THIRD_PARTY]: 'Third-Party Valuation',
};

// ----------------------------------------------------------------------------
// EXIT TYPES
// ----------------------------------------------------------------------------

export const EXIT_TYPES = {
  IPO: 'ipo',
  ACQUISITION: 'acquisition',
  SECONDARY: 'secondary',
  BUYBACK: 'buyback',
  WRITE_OFF: 'write_off',
} as const;

export type ExitType = typeof EXIT_TYPES[keyof typeof EXIT_TYPES];

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  [EXIT_TYPES.IPO]: 'IPO',
  [EXIT_TYPES.ACQUISITION]: 'Acquisition',
  [EXIT_TYPES.SECONDARY]: 'Secondary Sale',
  [EXIT_TYPES.BUYBACK]: 'Management Buyback',
  [EXIT_TYPES.WRITE_OFF]: 'Write-off',
};

// ----------------------------------------------------------------------------
// DEFAULT VALUES
// ----------------------------------------------------------------------------

export const DEFAULT_FUND_TERMS = {
  managementFeeRate: 2.0,        // 2% annual
  carriedInterestRate: 20.0,     // 20% carry
  preferredReturnRate: 8.0,      // 8% hurdle
  gpCatchupRate: 100.0,          // 100% catch-up
  investmentPeriodYears: 5,
  fundLifeYears: 10,
  extensionYears: 2,
  minCommitment: 100000,         // $100K minimum
  maxCommitment: 10000000,       // $10M maximum
};

export const ALLOCATION_LIMITS = {
  maxSingleInvestment: 15,       // 15% of fund
  maxSectorConcentration: 40,    // 40% per sector
  maxGeographicConcentration: 60, // 60% per geography
  minDiversification: 8,         // Minimum 8 investments
};

// ----------------------------------------------------------------------------
// COLLECTION NAMES
// ----------------------------------------------------------------------------

export const ALLOCATION_FUNDS_COLLECTION = 'allocation_funds';
export const LP_COMMITMENTS_COLLECTION = 'lp_commitments';
export const CAPITAL_CALLS_COLLECTION = 'capital_calls';
export const DISTRIBUTIONS_COLLECTION = 'distributions';
export const PORTFOLIO_INVESTMENTS_COLLECTION = 'portfolio_investments';
export const VALUATIONS_COLLECTION = 'valuations';
export const LP_REPORTS_COLLECTION = 'lp_reports';
