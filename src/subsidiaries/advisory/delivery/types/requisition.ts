/**
 * REQUISITION TYPES
 * 
 * Advance request for direct implementation projects.
 */

import { Payment } from './payment';

// ─────────────────────────────────────────────────────────────────
// ADVANCE & EXPENSE TYPES
// ─────────────────────────────────────────────────────────────────

export type AdvanceType =
  | 'materials'
  | 'labor'
  | 'equipment'
  | 'transport'
  | 'miscellaneous';

export const ADVANCE_TYPE_LABELS: Record<AdvanceType, string> = {
  materials: 'Construction Materials',
  labor: 'Labor Payments',
  equipment: 'Equipment Rental',
  transport: 'Transport & Logistics',
  miscellaneous: 'Miscellaneous',
};

export type ExpenseCategory =
  | 'construction_materials'
  | 'labor_wages'
  | 'equipment_rental'
  | 'transport_logistics'
  | 'utilities'
  | 'permits_fees'
  | 'professional_services'
  | 'contingency';

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  construction_materials: 'Construction Materials',
  labor_wages: 'Labor & Wages',
  equipment_rental: 'Equipment Rental',
  transport_logistics: 'Transport & Logistics',
  utilities: 'Utilities',
  permits_fees: 'Permits & Fees',
  professional_services: 'Professional Services',
  contingency: 'Contingency',
};

// ─────────────────────────────────────────────────────────────────
// ACCOUNTABILITY STATUS
// ─────────────────────────────────────────────────────────────────

export type AccountabilityStatus =
  | 'not_required'
  | 'pending'
  | 'partial'
  | 'complete'
  | 'overdue';

export const ACCOUNTABILITY_STATUS_CONFIG: Record<AccountabilityStatus, {
  label: string;
  color: string;
}> = {
  not_required: { label: 'Not Required', color: 'gray' },
  pending: { label: 'Pending', color: 'yellow' },
  partial: { label: 'Partial', color: 'blue' },
  complete: { label: 'Complete', color: 'green' },
  overdue: { label: 'Overdue', color: 'red' },
};

// ─────────────────────────────────────────────────────────────────
// REQUISITION ITEM
// ─────────────────────────────────────────────────────────────────

export interface RequisitionItem {
  id: string;
  description: string;
  category: ExpenseCategory;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// REQUISITION ENTITY
// ─────────────────────────────────────────────────────────────────

export interface Requisition extends Payment {
  paymentType: 'requisition';
  
  // Requisition-specific fields
  requisitionNumber: string;
  purpose: string;
  
  // Budget reference
  budgetLineId: string;
  budgetLineName: string;
  budgetLineBalance: number;
  
  // Line items
  items: RequisitionItem[];
  
  // Accountability tracking
  accountabilityStatus: AccountabilityStatus;
  accountabilityDueDate: Date;
  linkedAccountabilityIds: string[];
  unaccountedAmount: number;
  
  // Advance details
  advanceType: AdvanceType;
  expectedReturnDate?: Date;
}

// ─────────────────────────────────────────────────────────────────
// REQUISITION FORM DATA
// ─────────────────────────────────────────────────────────────────

export interface RequisitionFormData {
  projectId: string;
  purpose: string;
  budgetLineId: string;
  items: Omit<RequisitionItem, 'id'>[];
  advanceType: AdvanceType;
  expectedReturnDate?: Date;
  accountabilityDueDate: Date;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate total from requisition items
 */
export function calculateRequisitionTotal(items: RequisitionItem[]): number {
  return items.reduce((sum, item) => sum + item.totalCost, 0);
}

/**
 * Validate requisition against budget
 */
export function validateAgainstBudget(
  requestedAmount: number,
  budgetBalance: number
): { valid: boolean; message?: string } {
  if (requestedAmount > budgetBalance) {
    return {
      valid: false,
      message: `Requested amount exceeds budget balance by ${requestedAmount - budgetBalance}`,
    };
  }
  return { valid: true };
}

/**
 * Calculate accountability percentage
 */
export function calculateAccountabilityPercentage(requisition: Requisition): number {
  const accountedAmount = requisition.grossAmount - requisition.unaccountedAmount;
  return requisition.grossAmount > 0
    ? (accountedAmount / requisition.grossAmount) * 100
    : 0;
}

/**
 * Check if accountability is overdue
 */
export function isAccountabilityOverdue(requisition: Requisition): boolean {
  if (requisition.accountabilityStatus === 'complete') return false;
  const dueDate = new Date(requisition.accountabilityDueDate);
  return dueDate < new Date();
}

/**
 * Get accountability status color
 */
export function getAccountabilityStatusColor(status: AccountabilityStatus): string {
  const colorMap: Record<string, string> = {
    gray: 'text-gray-600 bg-gray-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
  };
  return colorMap[ACCOUNTABILITY_STATUS_CONFIG[status].color] || colorMap.gray;
}

/**
 * Format requisition number
 */
export function formatRequisitionNumber(
  projectCode: string,
  sequence: number
): string {
  return `REQ-${projectCode}-${sequence.toString().padStart(3, '0')}`;
}

/**
 * Create empty requisition item
 */
export function createEmptyRequisitionItem(): Omit<RequisitionItem, 'id'> {
  return {
    description: '',
    category: 'construction_materials',
    quantity: 1,
    unit: 'units',
    unitCost: 0,
    totalCost: 0,
  };
}
