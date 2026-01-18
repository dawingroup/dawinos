/**
 * CONTROL BOQ TYPES
 * 
 * Types for the Control BOQ used in the Delivery module.
 * The Control BOQ is imported from MatFlow's BOQ parsing tool
 * and serves as the source for requisition generation.
 */

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────
// BOQ ITEM STATUS
// ─────────────────────────────────────────────────────────────────

export type BOQItemStatus = 
  | 'pending'        // Not yet requisitioned
  | 'partial'        // Partially requisitioned
  | 'requisitioned'  // Fully requisitioned
  | 'in_progress'    // Work in progress
  | 'completed';     // Work completed

export const BOQ_ITEM_STATUS_CONFIG: Record<BOQItemStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'gray' },
  partial: { label: 'Partial', color: 'blue' },
  requisitioned: { label: 'Requisitioned', color: 'purple' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  completed: { label: 'Completed', color: 'green' },
};

// ─────────────────────────────────────────────────────────────────
// BOQ CATEGORY
// ─────────────────────────────────────────────────────────────────

export type BOQCategory =
  | 'preliminaries'
  | 'substructure'
  | 'superstructure'
  | 'finishes'
  | 'services'
  | 'external_works'
  | 'provisional'
  | 'contingency'
  | 'professional_fees'
  | 'other';

export const BOQ_CATEGORY_LABELS: Record<BOQCategory, string> = {
  preliminaries: 'Preliminaries',
  substructure: 'Substructure',
  superstructure: 'Superstructure',
  finishes: 'Finishes',
  services: 'Services',
  external_works: 'External Works',
  provisional: 'Provisional Sums',
  contingency: 'Contingency',
  professional_fees: 'Professional Fees',
  other: 'Other',
};

// ─────────────────────────────────────────────────────────────────
// CONTROL BOQ ITEM
// ─────────────────────────────────────────────────────────────────

export interface ControlBOQItem {
  id: string;
  projectId: string;
  
  // Item identification
  itemCode: string;
  itemNumber: string;
  description: string;
  specification?: string;
  
  // Hierarchy (from MatFlow parsing)
  billNumber: string;
  billName?: string;
  elementCode?: string;
  elementName?: string;
  sectionCode?: string;
  sectionName?: string;
  hierarchyPath?: string;
  hierarchyLevel?: number;
  
  // Quantities
  unit: string;
  quantityContract: number;      // Original contract quantity
  quantityRequisitioned: number; // Amount already in requisitions
  quantityExecuted: number;      // Amount of work completed
  quantityRemaining: number;     // Contract - Executed
  
  // Rates & Amounts
  rate: number;
  amount: number;
  currency: string;
  
  // Category & Stage
  category?: BOQCategory;
  stage?: string;
  
  // Status
  status: BOQItemStatus;
  
  // Requisition tracking
  linkedRequisitionIds: string[];
  lastRequisitionDate?: Date;
  
  // Metadata
  source: 'import' | 'manual' | 'matflow';
  importedAt?: Timestamp;
  importedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────────
// REQUISITION BOQ ITEM (Line item in a requisition)
// ─────────────────────────────────────────────────────────────────

export interface RequisitionBOQItem {
  id: string;
  
  // Reference to source BOQ item
  boqItemId: string;
  boqItemCode: string;
  
  // Item details (copied from BOQ for reference)
  description: string;
  specification?: string;
  billName?: string;
  sectionName?: string;
  
  // Requisition quantity (subset of BOQ item)
  unit: string;
  quantityRequested: number;
  quantityAvailable: number;  // How much was available at time of requisition
  
  // Rates & Amounts
  rate: number;
  amount: number;
  
  // Notes
  notes?: string;
  
  // Execution tracking (for accountability)
  quantityExecuted: number;
  executionNotes?: string;
}

// ─────────────────────────────────────────────────────────────────
// CONTROL BOQ SUMMARY
// ─────────────────────────────────────────────────────────────────

export interface ControlBOQSummary {
  projectId: string;
  
  // Counts
  totalItems: number;
  pendingItems: number;
  requisitionedItems: number;
  inProgressItems: number;
  completedItems: number;
  
  // Amounts
  totalContractValue: number;
  requisitionedValue: number;
  executedValue: number;
  remainingValue: number;
  currency: string;
  
  // By category
  byCategory: Record<BOQCategory, {
    count: number;
    contractValue: number;
    requisitionedValue: number;
  }>;
  
  // Metadata
  lastUpdated: Timestamp;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate available quantity for requisition
 */
export function getAvailableQuantity(item: ControlBOQItem): number {
  return Math.max(0, item.quantityContract - item.quantityRequisitioned);
}

/**
 * Calculate requisition progress percentage
 */
export function getRequisitionProgress(item: ControlBOQItem): number {
  if (item.quantityContract <= 0) return 0;
  return (item.quantityRequisitioned / item.quantityContract) * 100;
}

/**
 * Calculate execution progress percentage
 */
export function getExecutionProgress(item: ControlBOQItem): number {
  if (item.quantityContract <= 0) return 0;
  return (item.quantityExecuted / item.quantityContract) * 100;
}

/**
 * Determine item status based on quantities
 */
export function determineItemStatus(item: ControlBOQItem): BOQItemStatus {
  if (item.quantityExecuted >= item.quantityContract) {
    return 'completed';
  }
  if (item.quantityExecuted > 0) {
    return 'in_progress';
  }
  if (item.quantityRequisitioned >= item.quantityContract) {
    return 'requisitioned';
  }
  if (item.quantityRequisitioned > 0) {
    return 'partial';
  }
  return 'pending';
}

/**
 * Calculate total amount for requisition items
 */
export function calculateRequisitionTotal(items: RequisitionBOQItem[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Group BOQ items by bill
 */
export function groupByBill(items: ControlBOQItem[]): Record<string, ControlBOQItem[]> {
  return items.reduce((groups, item) => {
    const key = item.billName || item.billNumber || 'Uncategorized';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, ControlBOQItem[]>);
}

/**
 * Group BOQ items by section
 */
export function groupBySection(items: ControlBOQItem[]): Record<string, ControlBOQItem[]> {
  return items.reduce((groups, item) => {
    const key = item.sectionName || item.sectionCode || 'Uncategorized';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {} as Record<string, ControlBOQItem[]>);
}
