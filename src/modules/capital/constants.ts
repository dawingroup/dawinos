// ============================================================================
// CAPITAL HUB CONSTANTS
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

// Module branding
export const MODULE_COLOR = '#9C27B0';  // Capital Purple

// Exchange rate (configurable)
export const DEFAULT_EXCHANGE_RATE = 3700;  // 1 USD = 3,700 UGX

// Deal stages with progression order
export const DEAL_STAGES = [
  { id: 'sourcing', label: 'Sourcing', color: '#90CAF9', order: 1 },
  { id: 'screening', label: 'Screening', color: '#64B5F6', order: 2 },
  { id: 'due_diligence', label: 'Due Diligence', color: '#42A5F5', order: 3 },
  { id: 'negotiation', label: 'Negotiation', color: '#2196F3', order: 4 },
  { id: 'closing', label: 'Closing', color: '#1E88E5', order: 5 },
  { id: 'closed', label: 'Closed', color: '#4CAF50', order: 6 },
  { id: 'lost', label: 'Lost', color: '#9E9E9E', order: 7 },
] as const;

// Deal types
export const DEAL_TYPES = [
  { id: 'equity', label: 'Equity' },
  { id: 'debt', label: 'Debt' },
  { id: 'convertible', label: 'Convertible Note' },
  { id: 'mezzanine', label: 'Mezzanine' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'infrastructure', label: 'Infrastructure' },
] as const;

// Sectors
export const SECTORS = [
  { id: 'technology', label: 'Technology' },
  { id: 'financial_services', label: 'Financial Services' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'real_estate', label: 'Real Estate' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'agriculture', label: 'Agriculture' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'energy', label: 'Energy' },
  { id: 'education', label: 'Education' },
  { id: 'retail', label: 'Retail' },
] as const;

// Investment statuses
export const INVESTMENT_STATUSES = [
  { id: 'active', label: 'Active', color: '#4CAF50' },
  { id: 'monitoring', label: 'Monitoring', color: '#FF9800' },
  { id: 'exited', label: 'Exited', color: '#2196F3' },
  { id: 'written_off', label: 'Written Off', color: '#F44336' },
] as const;

// Investor types
export const INVESTOR_TYPES = [
  { id: 'institutional', label: 'Institutional' },
  { id: 'family_office', label: 'Family Office' },
  { id: 'hnwi', label: 'HNWI' },
  { id: 'dfi', label: 'DFI' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'government', label: 'Government' },
] as const;

// Uganda Tax Rates
export const UGANDA_TAX_RATES = {
  WHT_DIVIDENDS_RESIDENT: 0.10,      // 10% for residents
  WHT_DIVIDENDS_NON_RESIDENT: 0.15,  // 15% for non-residents
  WHT_INTEREST_RESIDENT: 0.15,       // 15% for residents
  WHT_INTEREST_NON_RESIDENT: 0.15,   // 15% for non-residents
  CGT_RATE: 0.30,                     // 30% Capital Gains Tax
  STAMP_DUTY: 0.01,                   // 1% Stamp Duty
} as const;

// Report periods
export const REPORT_PERIODS = [
  { id: 'Q1', label: 'Q1 (Jan-Mar)' },
  { id: 'Q2', label: 'Q2 (Apr-Jun)' },
  { id: 'Q3', label: 'Q3 (Jul-Sep)' },
  { id: 'Q4', label: 'Q4 (Oct-Dec)' },
  { id: 'FY', label: 'Full Year' },
] as const;

// Model types
export const MODEL_TYPES = [
  { id: 'dcf', label: 'DCF Valuation' },
  { id: 'lbo', label: 'LBO Analysis' },
  { id: 'comparables', label: 'Comparables Analysis' },
  { id: 'merger', label: 'Merger Model' },
  { id: 'returns', label: 'Returns Analysis' },
] as const;
