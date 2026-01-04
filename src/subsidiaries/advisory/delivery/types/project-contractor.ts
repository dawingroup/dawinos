/**
 * PROJECT CONTRACTOR/TEAM TYPES
 * 
 * Contractor information for contractor implementation,
 * Site team for direct implementation.
 */

// ─────────────────────────────────────────────────────────────────
// CONTACT DETAILS
// ─────────────────────────────────────────────────────────────────

export interface ContactDetails {
  name: string;
  role: string;
  email: string;
  phone: string;
  alternatePhone?: string;
}

// ─────────────────────────────────────────────────────────────────
// CONTRACT TYPES
// ─────────────────────────────────────────────────────────────────

export type ContractType =
  | 'lump_sum'
  | 'unit_rate'
  | 'cost_plus'
  | 'design_build'
  | 'epc';

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  lump_sum: 'Lump Sum',
  unit_rate: 'Unit Rate/Measure & Pay',
  cost_plus: 'Cost Plus',
  design_build: 'Design & Build',
  epc: 'EPC (Engineering, Procurement, Construction)',
};

// ─────────────────────────────────────────────────────────────────
// BOND INFORMATION
// ─────────────────────────────────────────────────────────────────

export type BondType = 'bank_guarantee' | 'insurance_bond' | 'cash_deposit';

export interface BondInfo {
  type: BondType;
  amount: number;
  currency: string;
  issuer: string;
  expiryDate: Date;
  documentId?: string;
}

export const BOND_TYPE_LABELS: Record<BondType, string> = {
  bank_guarantee: 'Bank Guarantee',
  insurance_bond: 'Insurance Bond',
  cash_deposit: 'Cash Deposit',
};

// ─────────────────────────────────────────────────────────────────
// CONTRACTOR STATUS
// ─────────────────────────────────────────────────────────────────

export type ContractorStatus = 'active' | 'suspended' | 'terminated' | 'completed';

export const CONTRACTOR_STATUS_LABELS: Record<ContractorStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  terminated: 'Terminated',
  completed: 'Completed',
};

// ─────────────────────────────────────────────────────────────────
// CONTRACTOR INFO (for contractor implementation)
// ─────────────────────────────────────────────────────────────────

export interface ContractorInfo {
  contractorId: string;
  companyName: string;
  registrationNumber?: string;
  contactPerson: ContactDetails;
  contractType: ContractType;
  contractNumber: string;
  contractValue: number;
  contractCurrency: string;
  contractStartDate: Date;
  contractEndDate: Date;
  performanceBond?: BondInfo;
  retentionPercentage: number;
  currentRetention: number;
  status: ContractorStatus;
}

// ─────────────────────────────────────────────────────────────────
// TEAM MEMBER (for direct implementation)
// ─────────────────────────────────────────────────────────────────

export type TeamMemberStatus = 'active' | 'inactive';

export interface TeamMember {
  userId?: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  assignedDate: Date;
  status: TeamMemberStatus;
}

// ─────────────────────────────────────────────────────────────────
// SPECIALIST CONTRACTOR
// ─────────────────────────────────────────────────────────────────

export interface SpecialistContractor {
  id: string;
  companyName: string;
  specialty: string;
  contactPerson: ContactDetails;
  contractValue: number;
  startDate: Date;
  endDate: Date;
}

// ─────────────────────────────────────────────────────────────────
// SITE TEAM (for direct implementation)
// ─────────────────────────────────────────────────────────────────

export interface SiteTeam {
  siteEngineer?: TeamMember;
  siteForeman?: TeamMember;
  storekeeper?: TeamMember;
  supervisor?: TeamMember;
  laborCount: number;
  specialistContractors?: SpecialistContractor[];
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Initialize empty contractor info
 */
export function initializeContractorInfo(): Partial<ContractorInfo> {
  return {
    contractType: 'lump_sum',
    retentionPercentage: 10,
    currentRetention: 0,
    status: 'active',
  };
}

/**
 * Initialize empty site team
 */
export function initializeSiteTeam(): SiteTeam {
  return {
    laborCount: 0,
    specialistContractors: [],
  };
}

/**
 * Calculate retention amount
 */
export function calculateRetention(
  certifiedAmount: number,
  retentionPercentage: number
): number {
  return certifiedAmount * (retentionPercentage / 100);
}

/**
 * Get contractor status color
 */
export function getContractorStatusColor(status: ContractorStatus): string {
  const colorMap: Record<ContractorStatus, string> = {
    active: 'text-green-600 bg-green-100',
    suspended: 'text-yellow-600 bg-yellow-100',
    terminated: 'text-red-600 bg-red-100',
    completed: 'text-gray-600 bg-gray-100',
  };
  return colorMap[status];
}

/**
 * Check if bond is expiring soon (within 30 days)
 */
export function isBondExpiringSoon(bond: BondInfo): boolean {
  const expiryDate = new Date(bond.expiryDate);
  const now = new Date();
  const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 30 && daysDiff > 0;
}

/**
 * Check if bond has expired
 */
export function isBondExpired(bond: BondInfo): boolean {
  return new Date(bond.expiryDate) < new Date();
}

/**
 * Get active team members count
 */
export function getActiveTeamMembersCount(siteTeam: SiteTeam): number {
  let count = 0;
  if (siteTeam.siteEngineer?.status === 'active') count++;
  if (siteTeam.siteForeman?.status === 'active') count++;
  if (siteTeam.storekeeper?.status === 'active') count++;
  if (siteTeam.supervisor?.status === 'active') count++;
  return count;
}

/**
 * Format contract value
 */
export function formatContractValue(
  value: number,
  currency: string
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
