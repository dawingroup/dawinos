/**
 * Manufacturing Module Types
 * Manufacturing orders, BOM, material reservations, and stage tracking
 */

import type { Timestamp } from '@/shared/types';

// ============================================
// Manufacturing Order Stage & Status
// ============================================

/**
 * Manufacturing order production stages
 */
export type MOStage =
  | 'queued'
  | 'cutting'
  | 'assembly'
  | 'finishing'
  | 'qc'
  | 'ready';

/**
 * Ordered list of MO stages for pipeline display
 */
export const MO_STAGES: MOStage[] = [
  'queued',
  'cutting',
  'assembly',
  'finishing',
  'qc',
  'ready',
];

/**
 * Human-readable labels for MO stages
 */
export const MO_STAGE_LABELS: Record<MOStage, string> = {
  queued: 'Queued',
  cutting: 'Cutting',
  assembly: 'Assembly',
  finishing: 'Finishing',
  qc: 'Quality Check',
  ready: 'Ready',
};

/**
 * Manufacturing order lifecycle statuses
 */
export type ManufacturingOrderStatus =
  | 'draft'
  | 'pending-approval'
  | 'approved'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'cancelled';

/**
 * Human-readable labels for MO statuses
 */
export const MO_STATUS_LABELS: Record<ManufacturingOrderStatus, string> = {
  draft: 'Draft',
  'pending-approval': 'Pending Approval',
  approved: 'Approved',
  'in-progress': 'In Progress',
  'on-hold': 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// ============================================
// Bill of Materials (BOM)
// ============================================

/**
 * Single entry in the bill of materials
 */
export interface BOMEntry {
  id: string;
  inventoryItemId: string;
  sku: string;
  itemName: string;
  category: string;
  quantityRequired: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  warehouseId?: string;
  notes?: string;

  // Supplier info (resolved from matflow)
  supplierId?: string;
  supplierName?: string;
  supplierSku?: string;
}

// ============================================
// Manufacturing Order Parts
// ============================================

/**
 * Part entry copied from design item for manufacturing
 */
export interface MOPartEntry {
  id: string;
  partNumber: string;
  name: string;
  materialName: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  grainDirection: 'length' | 'width' | 'none';
  edgeBanding: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
  hasCNCOperations: boolean;
  cncProgramRef?: string;
}

// ============================================
// Material Reservation & Consumption
// ============================================

/**
 * Material reservation against inventory for an MO
 */
export interface MaterialReservation {
  id: string;
  inventoryItemId: string;
  stockLevelId: string;
  warehouseId: string;
  quantityReserved: number;
  reservedAt: Timestamp;
  reservedBy: string;
  status: 'active' | 'consumed' | 'released';
}

/**
 * Material consumption record during manufacturing
 */
export interface MaterialConsumption {
  id: string;
  inventoryItemId: string;
  stockLevelId: string;
  warehouseId: string;
  quantityConsumed: number;
  consumedAt: Timestamp;
  consumedBy: string;
  moStage: MOStage;
}

// ============================================
// Stage Transitions
// ============================================

/**
 * Audit record for MO stage transitions
 */
export interface MOStageTransition {
  fromStage: MOStage | null;
  toStage: MOStage;
  transitionedAt: Timestamp;
  transitionedBy: string;
  notes?: string;
}

// ============================================
// Quality Check
// ============================================

/**
 * Quality inspection record
 */
export interface QualityCheck {
  inspectedBy: string;
  inspectedAt: Timestamp;
  passed: boolean;
  notes: string;
  defects?: string[];
}

// ============================================
// Manufacturing Order
// ============================================

/**
 * Cost summary for a manufacturing order
 */
export interface MOCostSummary {
  materialCost: number;
  laborCost: number;
  totalCost: number;
  currency: string;
}

/**
 * Scheduling information for a manufacturing order
 */
export interface MOScheduling {
  scheduledStart?: Timestamp;
  scheduledEnd?: Timestamp;
  actualStart?: Timestamp;
  actualEnd?: Timestamp;
  assignedWorkstation?: string;
}

/**
 * Manufacturing Order - main entity
 */
export interface ManufacturingOrder {
  id: string;
  moNumber: string;
  status: ManufacturingOrderStatus;

  // Links to design manager
  designItemId: string;
  projectId: string;
  projectCode: string;
  designItemName: string;

  // Production details
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // BOM & Parts
  bom: BOMEntry[];
  parts: MOPartEntry[];
  instructions: string;
  handoverNotes: string;

  // Scheduling
  scheduling: MOScheduling;

  // Material tracking
  materialReservations: MaterialReservation[];
  materialConsumptions: MaterialConsumption[];

  // Stage tracking
  stageHistory: MOStageTransition[];
  currentStage: MOStage;
  stageEnteredAt: Timestamp;

  // Quality
  qualityCheck?: QualityCheck;

  // Cost
  costSummary: MOCostSummary;

  // Linked POs (procurement)
  linkedPOIds?: string[];

  // Scoping
  subsidiaryId: string;

  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================
// Filters & Dashboard
// ============================================

/**
 * Filters for querying manufacturing orders
 */
export interface MOFilters {
  status?: ManufacturingOrderStatus | ManufacturingOrderStatus[];
  currentStage?: MOStage | MOStage[];
  projectId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  search?: string;
  sortBy?: 'moNumber' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Dashboard statistics for manufacturing overview
 */
export interface ManufacturingDashboardStats {
  totalOrders: number;
  byStatus: Record<ManufacturingOrderStatus, number>;
  byStage: Record<MOStage, number>;
  ordersOnHold: number;
  completedThisMonth: number;
  averageCycleTimeDays: number;
}
