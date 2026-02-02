/**
 * Purchase Order Types
 * Full PO lifecycle with landed cost tracking and goods receipt
 */

import type { Timestamp } from '@/shared/types';

// ============================================
// Purchase Order Status
// ============================================

/**
 * Purchase order lifecycle statuses
 */
export type PurchaseOrderStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'rejected'
  | 'sent'
  | 'partially-received'
  | 'received'
  | 'closed'
  | 'cancelled';

/**
 * Ordered list of PO statuses for pipeline display
 */
export const PO_STATUS_FLOW: PurchaseOrderStatus[] = [
  'draft',
  'pending-approval',
  'approved',
  'sent',
  'partially-received',
  'received',
  'closed',
];

/**
 * Human-readable labels for PO statuses
 */
export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  'pending-approval': 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  sent: 'Sent to Supplier',
  'partially-received': 'Partially Received',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

// ============================================
// Line Items
// ============================================

/**
 * Single line item in a purchase order
 */
export interface POLineItem {
  id: string;
  inventoryItemId?: string;
  sku?: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  currency: string;
  unit: string;
  quantityReceived: number;

  /** Weight in kg, used for proportional landed cost distribution */
  weight?: number;

  /** Calculated share of PO-level landed costs allocated to this line */
  landedCostAllocation?: number;

  /** Unit cost including allocated landed costs: unitCost + (landedCostAllocation / quantity) */
  effectiveUnitCost?: number;
}

// ============================================
// Landed Costs
// ============================================

/**
 * Method for distributing landed costs across PO line items
 */
export type LandedCostDistributionMethod =
  | 'proportional_value'
  | 'proportional_weight'
  | 'equal';

/**
 * PO-level landed cost components
 */
export interface LandedCosts {
  shipping: number;
  customs: number;
  duties: number;
  insurance: number;
  handling: number;
  other: number;
  totalLandedCost: number;
  currency: string;
  distributionMethod: LandedCostDistributionMethod;
}

/**
 * Default (empty) landed costs
 */
export const DEFAULT_LANDED_COSTS: LandedCosts = {
  shipping: 0,
  customs: 0,
  duties: 0,
  insurance: 0,
  handling: 0,
  other: 0,
  totalLandedCost: 0,
  currency: 'USD',
  distributionMethod: 'proportional_value',
};

// ============================================
// Approvals
// ============================================

/**
 * Single approval record on a PO
 */
export interface POApproval {
  id: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  respondedAt?: Timestamp;
  notes?: string;
  level: number;
}

// ============================================
// Goods Receipt
// ============================================

/**
 * Line-level receipt information
 */
export interface GoodsReceiptLine {
  lineItemId: string;
  quantityReceived: number;
  inventoryItemId?: string;
  warehouseId: string;
}

/**
 * Goods receipt record (partial or full delivery)
 */
export interface GoodsReceipt {
  id: string;
  receivedAt: Timestamp;
  receivedBy: string;
  lines: GoodsReceiptLine[];
  notes?: string;
  deliveryReference?: string;
}

// ============================================
// Purchase Order Totals
// ============================================

/**
 * Calculated totals for a purchase order
 */
export interface POTotals {
  subtotal: number;
  landedCostTotal: number;
  grandTotal: number;
  currency: string;
}

// ============================================
// Purchase Order
// ============================================

/**
 * Purchase Order - main entity
 */
export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;

  // Supplier
  supplierId?: string;
  supplierName: string;
  supplierContact?: string;

  // Line items
  lineItems: POLineItem[];

  // Landed costs (PO-level, distributed across line items)
  landedCosts: LandedCosts;

  // Calculated totals
  totals: POTotals;

  // Approval workflow
  approvals: POApproval[];

  // Goods receipt history
  receivingHistory: GoodsReceipt[];

  // Links
  linkedMOIds?: string[];
  linkedProjectId?: string;

  // Notes
  notes?: string;

  // Scoping
  subsidiaryId: string;

  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================
// Filters
// ============================================

/**
 * Filters for querying purchase orders
 */
export interface POFilters {
  status?: PurchaseOrderStatus | PurchaseOrderStatus[];
  supplierName?: string;
  linkedProjectId?: string;
  search?: string;
  sortBy?: 'poNumber' | 'createdAt' | 'updatedAt' | 'supplierName';
  sortOrder?: 'asc' | 'desc';
}
