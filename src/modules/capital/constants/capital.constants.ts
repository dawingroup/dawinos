// ============================================================================
// CAPITAL HUB CONSTANTS
// DawinOS v2.0 - Capital Hub Module
// ============================================================================

// Deal Stages
export const DEAL_STAGES = {
  LEAD: 'lead',
  QUALIFICATION: 'qualification',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  DUE_DILIGENCE: 'due_diligence',
  DOCUMENTATION: 'documentation',
  CLOSING: 'closing',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type DealStage = typeof DEAL_STAGES[keyof typeof DEAL_STAGES];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  lead: 'Lead',
  qualification: 'Qualification',
  proposal: 'Proposal Sent',
  negotiation: 'Negotiation',
  due_diligence: 'Due Diligence',
  documentation: 'Documentation',
  closing: 'Closing',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export const DEAL_STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 10,
  qualification: 20,
  proposal: 40,
  negotiation: 60,
  due_diligence: 75,
  documentation: 90,
  closing: 95,
  closed_won: 100,
  closed_lost: 0,
};

export const DEAL_STAGE_COLORS: Record<DealStage, string> = {
  lead: 'bg-gray-100 text-gray-800',
  qualification: 'bg-blue-100 text-blue-800',
  proposal: 'bg-indigo-100 text-indigo-800',
  negotiation: 'bg-purple-100 text-purple-800',
  due_diligence: 'bg-amber-100 text-amber-800',
  documentation: 'bg-orange-100 text-orange-800',
  closing: 'bg-cyan-100 text-cyan-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
};

// Investment Types
export const INVESTMENT_TYPES = {
  EQUITY: 'equity',
  DEBT: 'debt',
  CONVERTIBLE: 'convertible',
  GRANT: 'grant',
  MEZZANINE: 'mezzanine',
  PROJECT_FINANCE: 'project_finance',
} as const;

export type InvestmentType = typeof INVESTMENT_TYPES[keyof typeof INVESTMENT_TYPES];

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  equity: 'Equity Investment',
  debt: 'Debt Financing',
  convertible: 'Convertible Note',
  grant: 'Grant Funding',
  mezzanine: 'Mezzanine Financing',
  project_finance: 'Project Finance',
};

// Investor Types
export const INVESTOR_TYPES = {
  INDIVIDUAL: 'individual',
  INSTITUTIONAL: 'institutional',
  CORPORATE: 'corporate',
  FAMILY_OFFICE: 'family_office',
  DFI: 'dfi',
  GOVERNMENT: 'government',
  FOUNDATION: 'foundation',
} as const;

export type InvestorType = typeof INVESTOR_TYPES[keyof typeof INVESTOR_TYPES];

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  individual: 'Individual Investor',
  institutional: 'Institutional Investor',
  corporate: 'Corporate Investor',
  family_office: 'Family Office',
  dfi: 'Development Finance Institution',
  government: 'Government Entity',
  foundation: 'Foundation/NGO',
};

// Investment Sectors (Uganda Focus)
export const INVESTMENT_SECTORS = [
  { id: 'healthcare', name: 'Healthcare', icon: 'Heart' },
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'agriculture', name: 'Agriculture & Agribusiness', icon: 'Leaf' },
  { id: 'real_estate', name: 'Real Estate & Construction', icon: 'Building2' },
  { id: 'energy', name: 'Energy & Renewables', icon: 'Zap' },
  { id: 'fintech', name: 'Financial Services & Fintech', icon: 'Landmark' },
  { id: 'manufacturing', name: 'Manufacturing', icon: 'Factory' },
  { id: 'logistics', name: 'Logistics & Transport', icon: 'Truck' },
  { id: 'technology', name: 'Technology & Digital', icon: 'Monitor' },
  { id: 'tourism', name: 'Tourism & Hospitality', icon: 'Hotel' },
] as const;

export const SECTOR_LABELS: Record<string, string> = Object.fromEntries(
  INVESTMENT_SECTORS.map(s => [s.id, s.name])
);

// Fund Status
export const FUND_STATUS = {
  RAISING: 'raising',
  DEPLOYING: 'deploying',
  INVESTED: 'invested',
  HARVESTING: 'harvesting',
  CLOSED: 'closed',
} as const;

export type FundStatus = typeof FUND_STATUS[keyof typeof FUND_STATUS];

export const FUND_STATUS_LABELS: Record<FundStatus, string> = {
  raising: 'Fundraising',
  deploying: 'Deploying Capital',
  invested: 'Fully Invested',
  harvesting: 'Harvesting',
  closed: 'Closed',
};

// Investor Relationship Status
export const INVESTOR_STATUS = {
  PROSPECT: 'prospect',
  CONTACTED: 'contacted',
  INTERESTED: 'interested',
  IN_DISCUSSION: 'in_discussion',
  COMMITTED: 'committed',
  INVESTED: 'invested',
  DORMANT: 'dormant',
} as const;

export type InvestorStatus = typeof INVESTOR_STATUS[keyof typeof INVESTOR_STATUS];

export const INVESTOR_STATUS_LABELS: Record<InvestorStatus, string> = {
  prospect: 'Prospect',
  contacted: 'Contacted',
  interested: 'Interested',
  in_discussion: 'In Discussion',
  committed: 'Committed',
  invested: 'Invested',
  dormant: 'Dormant',
};

export const INVESTOR_STATUS_COLORS: Record<InvestorStatus, string> = {
  prospect: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  interested: 'bg-indigo-100 text-indigo-800',
  in_discussion: 'bg-purple-100 text-purple-800',
  committed: 'bg-amber-100 text-amber-800',
  invested: 'bg-green-100 text-green-800',
  dormant: 'bg-red-100 text-red-800',
};

// Commitment Status
export const COMMITMENT_STATUS = {
  SOFT: 'soft',
  FIRM: 'firm',
  DOCUMENTED: 'documented',
  FUNDED: 'funded',
  CANCELLED: 'cancelled',
} as const;

export type CommitmentStatus = typeof COMMITMENT_STATUS[keyof typeof COMMITMENT_STATUS];

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  soft: 'Soft Commitment',
  firm: 'Firm Commitment',
  documented: 'Documented',
  funded: 'Funded',
  cancelled: 'Cancelled',
};

export const COMMITMENT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  soft: 'bg-gray-100 text-gray-800',
  firm: 'bg-blue-100 text-blue-800',
  documented: 'bg-amber-100 text-amber-800',
  funded: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// Document Types
export const DEAL_DOCUMENT_TYPES = {
  PITCH_DECK: 'pitch_deck',
  TERM_SHEET: 'term_sheet',
  INVESTMENT_MEMO: 'investment_memo',
  DUE_DILIGENCE: 'due_diligence',
  LEGAL_AGREEMENT: 'legal_agreement',
  FINANCIAL_MODEL: 'financial_model',
  VALUATION: 'valuation',
  OTHER: 'other',
} as const;

export type DealDocumentType = typeof DEAL_DOCUMENT_TYPES[keyof typeof DEAL_DOCUMENT_TYPES];

export const DEAL_DOCUMENT_TYPE_LABELS: Record<DealDocumentType, string> = {
  pitch_deck: 'Pitch Deck',
  term_sheet: 'Term Sheet',
  investment_memo: 'Investment Memo',
  due_diligence: 'Due Diligence Report',
  legal_agreement: 'Legal Agreement',
  financial_model: 'Financial Model',
  valuation: 'Valuation Report',
  other: 'Other Document',
};

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: 'call',
  MEETING: 'meeting',
  EMAIL: 'email',
  DOCUMENT: 'document',
  STAGE_CHANGE: 'stage_change',
  NOTE: 'note',
  TASK: 'task',
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: 'Phone Call',
  meeting: 'Meeting',
  email: 'Email',
  document: 'Document Shared',
  stage_change: 'Stage Change',
  note: 'Note Added',
  task: 'Task',
};

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
} as const;

export type KycStatus = typeof KYC_STATUS[keyof typeof KYC_STATUS];

// Collections
export const DEALS_COLLECTION = 'capital_deals';
export const INVESTORS_COLLECTION = 'investors';
export const FUNDS_COLLECTION = 'funds';
export const COMMITMENTS_COLLECTION = 'investor_commitments';
export const DEAL_ACTIVITIES_COLLECTION = 'deal_activities';
export const DEAL_DOCUMENTS_COLLECTION = 'deal_documents';

// Currency (Uganda context)
export const DEFAULT_CURRENCY = 'UGX';
export const SUPPORTED_CURRENCIES = ['UGX', 'USD', 'EUR', 'GBP', 'KES'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Pipeline Active Stages (excluding closed)
export const ACTIVE_DEAL_STAGES: DealStage[] = [
  'lead',
  'qualification',
  'proposal',
  'negotiation',
  'due_diligence',
  'documentation',
  'closing',
];
