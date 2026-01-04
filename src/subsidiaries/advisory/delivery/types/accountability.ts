/**
 * ACCOUNTABILITY TYPES
 * 
 * Expense reporting for requisition advances.
 */

import { Timestamp } from 'firebase/firestore';
import { Payment } from './payment';
import { ExpenseCategory } from './requisition';

// ─────────────────────────────────────────────────────────────────
// EXPENSE STATUS
// ─────────────────────────────────────────────────────────────────

export type ExpenseStatus = 'pending' | 'verified' | 'rejected';

export const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, {
  label: string;
  color: string;
}> = {
  pending: { label: 'Pending Verification', color: 'yellow' },
  verified: { label: 'Verified', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
};

// ─────────────────────────────────────────────────────────────────
// ACCOUNTABILITY EXPENSE
// ─────────────────────────────────────────────────────────────────

export interface AccountabilityExpense {
  id: string;
  date: Date;
  description: string;
  category: ExpenseCategory;
  vendor?: string;
  receiptNumber?: string;
  amount: number;
  receiptDocId?: string;
  status: ExpenseStatus;
  rejectionReason?: string;
}

// ─────────────────────────────────────────────────────────────────
// RECEIPTS SUMMARY
// ─────────────────────────────────────────────────────────────────

export interface ReceiptsSummary {
  totalReceipts: number;
  verifiedReceipts: number;
  pendingReceipts: number;
  rejectedReceipts: number;
  totalVerifiedAmount: number;
}

// ─────────────────────────────────────────────────────────────────
// ACCOUNTABILITY ENTITY
// ─────────────────────────────────────────────────────────────────

export interface Accountability extends Payment {
  paymentType: 'accountability';
  
  // Reference to requisition
  requisitionId: string;
  requisitionNumber: string;
  requisitionAmount: number;
  
  // Expense details
  expenses: AccountabilityExpense[];
  
  // Summary
  totalExpenses: number;
  unspentReturned: number;
  balanceDue: number;
  
  // Verification
  receiptsSummary: ReceiptsSummary;
  verifiedBy?: string;
  verifiedAt?: Timestamp;
  verificationNotes?: string;
}

// ─────────────────────────────────────────────────────────────────
// ACCOUNTABILITY FORM DATA
// ─────────────────────────────────────────────────────────────────

export interface AccountabilityFormData {
  requisitionId: string;
  expenses: Omit<AccountabilityExpense, 'id' | 'status'>[];
  unspentReturned: number;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate receipts summary
 */
export function calculateReceiptsSummary(
  expenses: AccountabilityExpense[]
): ReceiptsSummary {
  const verified = expenses.filter(e => e.status === 'verified');
  const pending = expenses.filter(e => e.status === 'pending');
  const rejected = expenses.filter(e => e.status === 'rejected');
  
  return {
    totalReceipts: expenses.length,
    verifiedReceipts: verified.length,
    pendingReceipts: pending.length,
    rejectedReceipts: rejected.length,
    totalVerifiedAmount: verified.reduce((sum, e) => sum + e.amount, 0),
  };
}

/**
 * Calculate total expenses
 */
export function calculateTotalExpenses(expenses: AccountabilityExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Calculate balance due (if expenses exceed requisition)
 */
export function calculateBalanceDue(
  totalExpenses: number,
  requisitionAmount: number,
  unspentReturned: number
): number {
  const accountedFor = totalExpenses + unspentReturned;
  if (accountedFor > requisitionAmount) {
    return totalExpenses - (requisitionAmount - unspentReturned);
  }
  return 0;
}

/**
 * Validate accountability completeness
 */
export function validateAccountability(
  totalExpenses: number,
  unspentReturned: number,
  requisitionAmount: number
): { valid: boolean; message?: string; variance: number } {
  const accountedFor = totalExpenses + unspentReturned;
  const variance = accountedFor - requisitionAmount;
  
  if (Math.abs(variance) < 0.01) {
    return { valid: true, variance: 0 };
  }
  
  if (variance < 0) {
    return {
      valid: false,
      message: `Unaccounted amount: ${Math.abs(variance)}`,
      variance,
    };
  }
  
  return {
    valid: true,
    message: `Additional amount due: ${variance}`,
    variance,
  };
}

/**
 * Get expense status color
 */
export function getExpenseStatusColor(status: ExpenseStatus): string {
  const colorMap: Record<string, string> = {
    yellow: 'text-yellow-600 bg-yellow-100',
    green: 'text-green-600 bg-green-100',
    red: 'text-red-600 bg-red-100',
  };
  return colorMap[EXPENSE_STATUS_CONFIG[status].color] || colorMap.yellow;
}

/**
 * Format accountability number
 */
export function formatAccountabilityNumber(
  requisitionNumber: string,
  sequence: number
): string {
  return `ACC-${requisitionNumber.replace('REQ-', '')}-${sequence.toString().padStart(2, '0')}`;
}

/**
 * Create empty expense
 */
export function createEmptyExpense(): Omit<AccountabilityExpense, 'id' | 'status'> {
  return {
    date: new Date(),
    description: '',
    category: 'construction_materials',
    amount: 0,
  };
}

/**
 * Check if all expenses are verified
 */
export function areAllExpensesVerified(expenses: AccountabilityExpense[]): boolean {
  return expenses.every(e => e.status === 'verified');
}

/**
 * Get pending expenses count
 */
export function getPendingExpensesCount(expenses: AccountabilityExpense[]): number {
  return expenses.filter(e => e.status === 'pending').length;
}
