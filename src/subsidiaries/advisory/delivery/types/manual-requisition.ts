/**
 * MANUAL REQUISITION TYPES
 *
 * Types for manually entered requisitions from backlog.
 * These can later be linked to projects and auto-generated requisitions.
 */

import { Timestamp } from 'firebase/firestore';
import { AccountabilityStatus, AdvanceType, ExpenseCategory, RequisitionItem } from './requisition';
import { AccountabilityExpense, SupportingDocument } from './accountability';

// ─────────────────────────────────────────────────────────────────
// MANUAL REQUISITION STATUS
// ─────────────────────────────────────────────────────────────────

export type ManualRequisitionStatus =
  | 'unlinked'      // Not yet linked to a project
  | 'linked'        // Linked to a project
  | 'reconciled';   // Linked and reconciled with system-generated requisition

export const MANUAL_REQUISITION_STATUS_CONFIG: Record<ManualRequisitionStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  unlinked: {
    label: 'Unlinked',
    color: 'yellow',
    description: 'Not yet linked to a project'
  },
  linked: {
    label: 'Linked',
    color: 'blue',
    description: 'Linked to a project'
  },
  reconciled: {
    label: 'Reconciled',
    color: 'green',
    description: 'Fully reconciled with system requisition'
  },
};

// ─────────────────────────────────────────────────────────────────
// ACKNOWLEDGEMENT DOCUMENT
// ─────────────────────────────────────────────────────────────────

export interface AcknowledgementDocument {
  id: string;
  amountReceived: number;
  dateReceived: Date | Timestamp;
  receivedBy: string;           // Name of person who received
  receivedByEmail: string;      // Email for signature
  receivedByTitle?: string;     // Job title
  signatureImageUrl?: string;   // URL to uploaded signature image
  signatureHtml?: string;       // HTML email signature
  notes?: string;
  generatedAt?: Timestamp;
  generatedBy?: string;
  documentUrl?: string;         // URL to generated PDF
}

export interface AcknowledgementFormData {
  amountReceived: number;
  dateReceived: Date;
  receivedBy: string;
  receivedByEmail: string;
  receivedByTitle?: string;
  signatureHtml?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────
// MANUAL ACCOUNTABILITY ENTRY
// ─────────────────────────────────────────────────────────────────

export interface ManualAccountabilityEntry {
  id: string;
  date: Date;
  description: string;
  category: ExpenseCategory;
  vendor?: string;
  amount: number;
  receiptNumber?: string;
  invoiceNumber?: string;
  notes?: string;
  documents: SupportingDocument[];
}

// ─────────────────────────────────────────────────────────────────
// MANUAL REQUISITION ENTITY
// ─────────────────────────────────────────────────────────────────

export interface ManualRequisition {
  id: string;

  // Basic info
  referenceNumber: string;        // Original reference (e.g., from Excel/paper)
  description: string;
  purpose: string;

  // Amount
  currency: string;
  amount: number;

  // Dates (stored as Timestamp in Firestore)
  requisitionDate: Timestamp | Date;   // When the requisition was originally made
  paidDate?: Timestamp | Date;         // When the advance was paid
  accountabilityDueDate?: Timestamp | Date;   // When accountability was/is due

  // Accountability
  accountabilityStatus: AccountabilityStatus;
  accountabilities: ManualAccountabilityEntry[];
  totalAccountedAmount: number;
  unaccountedAmount: number;

  // Categorization
  advanceType: AdvanceType;

  // Linking (optional - for later association)
  linkStatus: ManualRequisitionStatus;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedProgramId?: string;
  linkedProgramName?: string;
  linkedRequisitionId?: string;   // System-generated requisition ID
  linkedRequisitionNumber?: string;

  // Source info
  sourceDocument?: string;        // e.g., "Excel backlog 2024", "Paper requisition"
  sourceReference?: string;       // Original file reference

  // Acknowledgement document (first step before accountabilities)
  acknowledgement?: AcknowledgementDocument;

  // Notes
  notes?: string;
  linkingNotes?: string;          // Notes about how/why it was linked

  // Audit
  createdAt: Timestamp;
  createdBy: string;
  createdByName?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// FORM DATA TYPES
// ─────────────────────────────────────────────────────────────────

export interface ManualRequisitionFormData {
  referenceNumber: string;
  description: string;
  purpose: string;
  currency: string;
  amount: number;
  requisitionDate: Date;
  paidDate?: Date;
  accountabilityDueDate?: Date;
  advanceType: AdvanceType;
  accountabilityStatus: AccountabilityStatus;
  accountabilities: Omit<ManualAccountabilityEntry, 'id'>[];
  sourceDocument?: string;
  sourceReference?: string;
  notes?: string;

  // Optional pre-linking
  linkedProjectId?: string;
  linkedProgramId?: string;
}

export interface ManualAccountabilityFormData {
  date: Date;
  description: string;
  category: ExpenseCategory;
  vendor?: string;
  amount: number;
  receiptNumber?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface LinkToProjectData {
  projectId: string;
  projectName: string;
  programId: string;
  programName: string;
  linkingNotes?: string;
}

export interface LinkToRequisitionData {
  requisitionId: string;
  requisitionNumber: string;
  linkingNotes?: string;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate total accounted amount from accountability entries
 */
export function calculateManualAccountedTotal(
  accountabilities: ManualAccountabilityEntry[]
): number {
  return accountabilities.reduce((sum, acc) => sum + acc.amount, 0);
}

/**
 * Calculate accountability status based on amounts
 */
export function calculateManualAccountabilityStatus(
  amount: number,
  accountedAmount: number,
  dueDate?: Date | Timestamp
): AccountabilityStatus {
  if (accountedAmount >= amount) {
    return 'complete';
  }
  if (accountedAmount > 0) {
    return 'partial';
  }
  if (dueDate) {
    // Handle both Date and Firestore Timestamp
    const dueDateObj = dueDate instanceof Date ? dueDate : (dueDate as Timestamp).toDate();
    if (dueDateObj < new Date()) {
      return 'overdue';
    }
  }
  return 'pending';
}

/**
 * Get link status color
 */
export function getManualRequisitionStatusColor(status: ManualRequisitionStatus): string {
  const colorMap: Record<string, string> = {
    yellow: 'text-yellow-600 bg-yellow-100',
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
  };
  return colorMap[MANUAL_REQUISITION_STATUS_CONFIG[status].color] || colorMap.yellow;
}

/**
 * Generate a reference number for manual requisitions
 */
export function generateManualRequisitionRef(sequence: number): string {
  return `MAN-REQ-${new Date().getFullYear()}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Create empty manual accountability entry
 */
export function createEmptyManualAccountability(): Omit<ManualAccountabilityEntry, 'id'> {
  return {
    date: new Date(),
    description: '',
    category: 'construction_materials',
    amount: 0,
    documents: [],
  };
}

/**
 * Calculate accountability percentage
 */
export function calculateManualAccountabilityPercentage(
  amount: number,
  accountedAmount: number
): number {
  return amount > 0 ? (accountedAmount / amount) * 100 : 0;
}
