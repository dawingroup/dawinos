// ============================================================================
// INVESTOR CONSTANTS
// DawinOS v2.0 - Capital Hub Module
// Constants for Investor CRM & Relationship Management
// ============================================================================

// ----------------------------------------------------------------------------
// INVESTOR TYPES
// ----------------------------------------------------------------------------

export const INVESTOR_TYPES = {
  ANGEL: 'angel',
  VENTURE_CAPITAL: 'venture_capital',
  PRIVATE_EQUITY: 'private_equity',
  DFI: 'dfi',
  FAMILY_OFFICE: 'family_office',
  CORPORATE_VC: 'corporate_vc',
  SOVEREIGN_WEALTH: 'sovereign_wealth',
  PENSION_FUND: 'pension_fund',
  ENDOWMENT: 'endowment',
  HNWI: 'hnwi',
  STRATEGIC: 'strategic',
} as const;

export type InvestorType = typeof INVESTOR_TYPES[keyof typeof INVESTOR_TYPES];

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  [INVESTOR_TYPES.ANGEL]: 'Angel Investor',
  [INVESTOR_TYPES.VENTURE_CAPITAL]: 'Venture Capital',
  [INVESTOR_TYPES.PRIVATE_EQUITY]: 'Private Equity',
  [INVESTOR_TYPES.DFI]: 'Development Finance Institution',
  [INVESTOR_TYPES.FAMILY_OFFICE]: 'Family Office',
  [INVESTOR_TYPES.CORPORATE_VC]: 'Corporate Venture Capital',
  [INVESTOR_TYPES.SOVEREIGN_WEALTH]: 'Sovereign Wealth Fund',
  [INVESTOR_TYPES.PENSION_FUND]: 'Pension Fund',
  [INVESTOR_TYPES.ENDOWMENT]: 'Endowment/Foundation',
  [INVESTOR_TYPES.HNWI]: 'High Net Worth Individual',
  [INVESTOR_TYPES.STRATEGIC]: 'Strategic Investor',
};

// Common DFIs in Uganda/East Africa
export const EAST_AFRICA_DFIS = [
  { id: 'ifc', name: 'International Finance Corporation (IFC)', country: 'Global' },
  { id: 'afdb', name: 'African Development Bank (AfDB)', country: 'Africa' },
  { id: 'fmo', name: 'FMO - Dutch Development Bank', country: 'Netherlands' },
  { id: 'cdc', name: 'CDC Group (British International Investment)', country: 'UK' },
  { id: 'proparco', name: 'Proparco', country: 'France' },
  { id: 'dfc', name: 'US International Development Finance Corporation', country: 'USA' },
  { id: 'eadb', name: 'East African Development Bank', country: 'East Africa' },
  { id: 'udcl', name: 'Uganda Development Corporation', country: 'Uganda' },
  { id: 'udb', name: 'Uganda Development Bank', country: 'Uganda' },
  { id: 'nssf_ug', name: 'NSSF Uganda', country: 'Uganda' },
] as const;

// ----------------------------------------------------------------------------
// INVESTMENT STAGES
// ----------------------------------------------------------------------------

export const INVESTMENT_STAGES = {
  PRE_SEED: 'pre_seed',
  SEED: 'seed',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C_PLUS: 'series_c_plus',
  GROWTH: 'growth',
  MEZZANINE: 'mezzanine',
  BRIDGE: 'bridge',
  PROJECT_FINANCE: 'project_finance',
} as const;

export type InvestmentStage = typeof INVESTMENT_STAGES[keyof typeof INVESTMENT_STAGES];

export const INVESTMENT_STAGE_LABELS: Record<InvestmentStage, string> = {
  [INVESTMENT_STAGES.PRE_SEED]: 'Pre-Seed',
  [INVESTMENT_STAGES.SEED]: 'Seed',
  [INVESTMENT_STAGES.SERIES_A]: 'Series A',
  [INVESTMENT_STAGES.SERIES_B]: 'Series B',
  [INVESTMENT_STAGES.SERIES_C_PLUS]: 'Series C+',
  [INVESTMENT_STAGES.GROWTH]: 'Growth Equity',
  [INVESTMENT_STAGES.MEZZANINE]: 'Mezzanine',
  [INVESTMENT_STAGES.BRIDGE]: 'Bridge Financing',
  [INVESTMENT_STAGES.PROJECT_FINANCE]: 'Project Finance',
};

// Typical check sizes by stage (USD)
export const STAGE_CHECK_SIZES: Record<InvestmentStage, { min: number; max: number }> = {
  [INVESTMENT_STAGES.PRE_SEED]: { min: 25000, max: 250000 },
  [INVESTMENT_STAGES.SEED]: { min: 100000, max: 2000000 },
  [INVESTMENT_STAGES.SERIES_A]: { min: 1000000, max: 15000000 },
  [INVESTMENT_STAGES.SERIES_B]: { min: 5000000, max: 50000000 },
  [INVESTMENT_STAGES.SERIES_C_PLUS]: { min: 20000000, max: 200000000 },
  [INVESTMENT_STAGES.GROWTH]: { min: 10000000, max: 100000000 },
  [INVESTMENT_STAGES.MEZZANINE]: { min: 5000000, max: 50000000 },
  [INVESTMENT_STAGES.BRIDGE]: { min: 500000, max: 10000000 },
  [INVESTMENT_STAGES.PROJECT_FINANCE]: { min: 10000000, max: 500000000 },
};

// ----------------------------------------------------------------------------
// SECTORS
// ----------------------------------------------------------------------------

export const INVESTMENT_SECTORS = {
  INFRASTRUCTURE: 'infrastructure',
  HEALTHCARE: 'healthcare',
  AGRICULTURE: 'agriculture',
  FINTECH: 'fintech',
  TECHNOLOGY: 'technology',
  EDUCATION: 'education',
  ENERGY: 'energy',
  MANUFACTURING: 'manufacturing',
  REAL_ESTATE: 'real_estate',
  CONSUMER: 'consumer',
  LOGISTICS: 'logistics',
  CLIMATE: 'climate',
} as const;

export type InvestmentSector = typeof INVESTMENT_SECTORS[keyof typeof INVESTMENT_SECTORS];

export const INVESTMENT_SECTOR_LABELS: Record<InvestmentSector, string> = {
  [INVESTMENT_SECTORS.INFRASTRUCTURE]: 'Infrastructure',
  [INVESTMENT_SECTORS.HEALTHCARE]: 'Healthcare',
  [INVESTMENT_SECTORS.AGRICULTURE]: 'Agriculture/Agribusiness',
  [INVESTMENT_SECTORS.FINTECH]: 'Fintech/Financial Services',
  [INVESTMENT_SECTORS.TECHNOLOGY]: 'Technology',
  [INVESTMENT_SECTORS.EDUCATION]: 'Education/EdTech',
  [INVESTMENT_SECTORS.ENERGY]: 'Energy/Renewables',
  [INVESTMENT_SECTORS.MANUFACTURING]: 'Manufacturing',
  [INVESTMENT_SECTORS.REAL_ESTATE]: 'Real Estate',
  [INVESTMENT_SECTORS.CONSUMER]: 'Consumer/Retail',
  [INVESTMENT_SECTORS.LOGISTICS]: 'Logistics/Supply Chain',
  [INVESTMENT_SECTORS.CLIMATE]: 'Climate/Sustainability',
};

// ----------------------------------------------------------------------------
// RELATIONSHIP STATUS
// ----------------------------------------------------------------------------

export const RELATIONSHIP_STATUSES = {
  PROSPECT: 'prospect',
  COLD: 'cold',
  WARM: 'warm',
  HOT: 'hot',
  ACTIVE_INVESTOR: 'active_investor',
  FORMER_INVESTOR: 'former_investor',
  DECLINED: 'declined',
  DO_NOT_CONTACT: 'do_not_contact',
} as const;

export type RelationshipStatus = typeof RELATIONSHIP_STATUSES[keyof typeof RELATIONSHIP_STATUSES];

export const RELATIONSHIP_STATUS_LABELS: Record<RelationshipStatus, string> = {
  [RELATIONSHIP_STATUSES.PROSPECT]: 'Prospect',
  [RELATIONSHIP_STATUSES.COLD]: 'Cold Lead',
  [RELATIONSHIP_STATUSES.WARM]: 'Warm Lead',
  [RELATIONSHIP_STATUSES.HOT]: 'Hot Lead',
  [RELATIONSHIP_STATUSES.ACTIVE_INVESTOR]: 'Active Investor',
  [RELATIONSHIP_STATUSES.FORMER_INVESTOR]: 'Former Investor',
  [RELATIONSHIP_STATUSES.DECLINED]: 'Declined',
  [RELATIONSHIP_STATUSES.DO_NOT_CONTACT]: 'Do Not Contact',
};

export const RELATIONSHIP_STATUS_COLORS: Record<RelationshipStatus, string> = {
  [RELATIONSHIP_STATUSES.PROSPECT]: '#9E9E9E',
  [RELATIONSHIP_STATUSES.COLD]: '#90CAF9',
  [RELATIONSHIP_STATUSES.WARM]: '#FFB74D',
  [RELATIONSHIP_STATUSES.HOT]: '#EF5350',
  [RELATIONSHIP_STATUSES.ACTIVE_INVESTOR]: '#66BB6A',
  [RELATIONSHIP_STATUSES.FORMER_INVESTOR]: '#78909C',
  [RELATIONSHIP_STATUSES.DECLINED]: '#E57373',
  [RELATIONSHIP_STATUSES.DO_NOT_CONTACT]: '#424242',
};

// ----------------------------------------------------------------------------
// COMMUNICATION TYPES
// ----------------------------------------------------------------------------

export const COMMUNICATION_TYPES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  VIDEO_CALL: 'video_call',
  WHATSAPP: 'whatsapp',
  LINKEDIN: 'linkedin',
  CONFERENCE: 'conference',
  SITE_VISIT: 'site_visit',
  DOCUMENT_SHARED: 'document_shared',
  INTRO: 'intro',
} as const;

export type CommunicationType = typeof COMMUNICATION_TYPES[keyof typeof COMMUNICATION_TYPES];

export const COMMUNICATION_TYPE_LABELS: Record<CommunicationType, string> = {
  [COMMUNICATION_TYPES.EMAIL]: 'Email',
  [COMMUNICATION_TYPES.CALL]: 'Phone Call',
  [COMMUNICATION_TYPES.MEETING]: 'In-Person Meeting',
  [COMMUNICATION_TYPES.VIDEO_CALL]: 'Video Call',
  [COMMUNICATION_TYPES.WHATSAPP]: 'WhatsApp',
  [COMMUNICATION_TYPES.LINKEDIN]: 'LinkedIn Message',
  [COMMUNICATION_TYPES.CONFERENCE]: 'Conference/Event',
  [COMMUNICATION_TYPES.SITE_VISIT]: 'Site Visit',
  [COMMUNICATION_TYPES.DOCUMENT_SHARED]: 'Document Shared',
  [COMMUNICATION_TYPES.INTRO]: 'Introduction',
};

// ----------------------------------------------------------------------------
// MEETING TYPES
// ----------------------------------------------------------------------------

export const MEETING_TYPES = {
  INTRO_CALL: 'intro_call',
  PITCH: 'pitch',
  DEEP_DIVE: 'deep_dive',
  DUE_DILIGENCE: 'due_diligence',
  NEGOTIATION: 'negotiation',
  CLOSING: 'closing',
  PORTFOLIO_REVIEW: 'portfolio_review',
  BOARD_MEETING: 'board_meeting',
  SITE_VISIT: 'site_visit',
  NETWORKING: 'networking',
} as const;

export type MeetingType = typeof MEETING_TYPES[keyof typeof MEETING_TYPES];

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  [MEETING_TYPES.INTRO_CALL]: 'Intro Call',
  [MEETING_TYPES.PITCH]: 'Pitch Meeting',
  [MEETING_TYPES.DEEP_DIVE]: 'Deep Dive',
  [MEETING_TYPES.DUE_DILIGENCE]: 'Due Diligence',
  [MEETING_TYPES.NEGOTIATION]: 'Negotiation',
  [MEETING_TYPES.CLOSING]: 'Closing',
  [MEETING_TYPES.PORTFOLIO_REVIEW]: 'Portfolio Review',
  [MEETING_TYPES.BOARD_MEETING]: 'Board Meeting',
  [MEETING_TYPES.SITE_VISIT]: 'Site Visit',
  [MEETING_TYPES.NETWORKING]: 'Networking',
};

// ----------------------------------------------------------------------------
// RELATIONSHIP HEALTH
// ----------------------------------------------------------------------------

export const RELATIONSHIP_HEALTH_LEVELS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  AT_RISK: 'at_risk',
} as const;

export type RelationshipHealthLevel = typeof RELATIONSHIP_HEALTH_LEVELS[keyof typeof RELATIONSHIP_HEALTH_LEVELS];

export const RELATIONSHIP_HEALTH_LABELS: Record<RelationshipHealthLevel, string> = {
  [RELATIONSHIP_HEALTH_LEVELS.EXCELLENT]: 'Excellent',
  [RELATIONSHIP_HEALTH_LEVELS.GOOD]: 'Good',
  [RELATIONSHIP_HEALTH_LEVELS.FAIR]: 'Fair',
  [RELATIONSHIP_HEALTH_LEVELS.POOR]: 'Poor',
  [RELATIONSHIP_HEALTH_LEVELS.AT_RISK]: 'At Risk',
};

export const RELATIONSHIP_HEALTH_COLORS: Record<RelationshipHealthLevel, string> = {
  [RELATIONSHIP_HEALTH_LEVELS.EXCELLENT]: '#2E7D32',
  [RELATIONSHIP_HEALTH_LEVELS.GOOD]: '#558B2F',
  [RELATIONSHIP_HEALTH_LEVELS.FAIR]: '#F9A825',
  [RELATIONSHIP_HEALTH_LEVELS.POOR]: '#EF6C00',
  [RELATIONSHIP_HEALTH_LEVELS.AT_RISK]: '#C62828',
};

// Health score thresholds
export const HEALTH_SCORE_THRESHOLDS = {
  [RELATIONSHIP_HEALTH_LEVELS.EXCELLENT]: 80,
  [RELATIONSHIP_HEALTH_LEVELS.GOOD]: 60,
  [RELATIONSHIP_HEALTH_LEVELS.FAIR]: 40,
  [RELATIONSHIP_HEALTH_LEVELS.POOR]: 20,
  [RELATIONSHIP_HEALTH_LEVELS.AT_RISK]: 0,
};

// Factors affecting relationship health
export const HEALTH_FACTORS = {
  RECENCY: 'recency',
  FREQUENCY: 'frequency',
  ENGAGEMENT: 'engagement',
  DEAL_PROGRESS: 'deal_progress',
  SENTIMENT: 'sentiment',
} as const;

// ----------------------------------------------------------------------------
// CONTACT ROLES
// ----------------------------------------------------------------------------

export const CONTACT_ROLES = {
  PARTNER: 'partner',
  PRINCIPAL: 'principal',
  ASSOCIATE: 'associate',
  ANALYST: 'analyst',
  OPERATIONS: 'operations',
  IR: 'ir',
  OTHER: 'other',
} as const;

export type ContactRole = typeof CONTACT_ROLES[keyof typeof CONTACT_ROLES];

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  [CONTACT_ROLES.PARTNER]: 'Partner',
  [CONTACT_ROLES.PRINCIPAL]: 'Principal',
  [CONTACT_ROLES.ASSOCIATE]: 'Associate',
  [CONTACT_ROLES.ANALYST]: 'Analyst',
  [CONTACT_ROLES.OPERATIONS]: 'Operations',
  [CONTACT_ROLES.IR]: 'Investor Relations',
  [CONTACT_ROLES.OTHER]: 'Other',
};

// ----------------------------------------------------------------------------
// INVESTOR SOURCES
// ----------------------------------------------------------------------------

export const INVESTOR_SOURCES = {
  REFERRAL: 'referral',
  CONFERENCE: 'conference',
  COLD_OUTREACH: 'cold_outreach',
  INBOUND: 'inbound',
  NETWORK: 'network',
  OTHER: 'other',
} as const;

export type InvestorSource = typeof INVESTOR_SOURCES[keyof typeof INVESTOR_SOURCES];

export const INVESTOR_SOURCE_LABELS: Record<InvestorSource, string> = {
  [INVESTOR_SOURCES.REFERRAL]: 'Referral',
  [INVESTOR_SOURCES.CONFERENCE]: 'Conference/Event',
  [INVESTOR_SOURCES.COLD_OUTREACH]: 'Cold Outreach',
  [INVESTOR_SOURCES.INBOUND]: 'Inbound',
  [INVESTOR_SOURCES.NETWORK]: 'Network',
  [INVESTOR_SOURCES.OTHER]: 'Other',
};

// ----------------------------------------------------------------------------
// FIRESTORE COLLECTIONS
// ----------------------------------------------------------------------------

export const INVESTORS_COLLECTION = 'investors';
export const INVESTOR_COMMUNICATIONS_COLLECTION = 'investorCommunications';
export const INVESTOR_MEETINGS_COLLECTION = 'investorMeetings';
