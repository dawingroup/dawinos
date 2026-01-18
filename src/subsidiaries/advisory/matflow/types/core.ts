/**
 * MATFLOW CORE TYPES
 * 
 * Core types for the MatFlow module including projects, BOQ items, and formulas.
 */

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────
// PROJECT STATUS
// ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 
  | 'draft'
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ProjectType = 
  | 'new_construction'
  | 'renovation'
  | 'expansion'
  | 'rehabilitation';

// ─────────────────────────────────────────────────────────────────
// MATFLOW PROJECT
// ─────────────────────────────────────────────────────────────────

export interface MatFlowProject {
  id: string;
  name: string;
  projectCode?: string;
  description?: string;
  status: ProjectStatus;
  type?: ProjectType;
  
  // Customer
  customerId?: string;
  customerName?: string;
  
  // Location
  location?: {
    siteName: string;
    address?: string;
    district?: string;
    region?: string;
    country?: string;
  };
  
  // Timeline
  startDate?: Date | Timestamp;
  endDate?: Date | Timestamp;
  
  // Budget
  budget?: {
    currency: 'UGX' | 'USD';
    totalBudget: number;
    spent: number;
  };
  
  // Progress
  progress?: {
    physicalProgress: number;
    financialProgress: number;
  };
  
  // BOQ Summary
  boqSummary?: {
    totalItems: number;
    totalValue: number;
    parsedItems: number;
    approvedItems: number;
  };
  
  // Team
  teamMembers?: ProjectMember[];
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT MEMBER & ROLES
// ─────────────────────────────────────────────────────────────────

export type MatFlowRole = 
  | 'project_manager'
  | 'quantity_surveyor'
  | 'site_engineer'
  | 'procurement_officer'
  | 'viewer';

export type MatFlowCapability = 
  | 'view_project'
  | 'edit_project'
  | 'manage_boq'
  | 'approve_boq'
  | 'manage_procurement'
  | 'approve_procurement'
  | 'manage_team'
  | 'export_data';

export interface ProjectMember {
  userId: string;
  email: string;
  displayName: string;
  role: MatFlowRole;
  capabilities: MatFlowCapability[];
  addedAt: Timestamp;
  addedBy: string;
}

export const MATFLOW_ROLE_TEMPLATES: Record<MatFlowRole, MatFlowCapability[]> = {
  project_manager: [
    'view_project', 'edit_project', 'manage_boq', 'approve_boq',
    'manage_procurement', 'approve_procurement', 'manage_team', 'export_data'
  ],
  quantity_surveyor: [
    'view_project', 'edit_project', 'manage_boq', 'approve_boq', 'export_data'
  ],
  site_engineer: [
    'view_project', 'edit_project', 'manage_procurement', 'export_data'
  ],
  procurement_officer: [
    'view_project', 'manage_procurement', 'export_data'
  ],
  viewer: ['view_project'],
};

// ─────────────────────────────────────────────────────────────────
// BOQ ITEM
// ─────────────────────────────────────────────────────────────────

export interface BOQItem {
  id: string;
  projectId: string;
  
  // Hierarchy
  billNumber?: string;
  elementCode?: string;
  sectionCode?: string;
  itemNumber: string;
  
  // Description
  description: string;
  specification?: string;
  
  // Quantities
  quantity: number;
  unit: string;
  
  // Rates
  laborRate?: number;
  materialRate?: number;
  equipmentRate?: number;
  unitRate: number;
  amount: number;
  
  // Status
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';
  
  // Tracking
  procuredQuantity?: number;
  deliveredQuantity?: number;
  installedQuantity?: number;
  
  // Formula
  formulaId?: string;
  formulaName?: string;
  
  // AI Parsing
  confidence?: number;
  aiSuggestions?: string[];
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// STANDARD FORMULA
// ─────────────────────────────────────────────────────────────────

export interface StandardFormula {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  
  // Formula components
  laborFormula?: string;
  materialFormula?: string;
  equipmentFormula?: string;
  
  // Default rates
  defaultLaborRate?: number;
  defaultMaterialRate?: number;
  defaultEquipmentRate?: number;
  
  // Usage
  usageCount: number;
  isActive: boolean;
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────────
// PROCUREMENT ENTRY
// ─────────────────────────────────────────────────────────────────

export interface ProcurementEntry {
  id: string;
  projectId: string;
  boqItemId?: string;
  
  // Item details
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // Supplier
  supplierId?: string;
  supplierName?: string;
  
  // Status
  status: 'pending' | 'ordered' | 'delivered' | 'verified';
  
  // Dates
  orderDate?: Timestamp;
  expectedDelivery?: Timestamp;
  actualDelivery?: Timestamp;
  
  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────────
// MATERIAL REQUIREMENT & VARIANCE
// ─────────────────────────────────────────────────────────────────

export interface MaterialRequirement {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  
  requiredQuantity: number;
  orderedQuantity: number;
  deliveredQuantity: number;
  usedQuantity: number;
  
  unit: string;
  unitPrice: number;
  
  status: 'pending' | 'partial' | 'complete';
}

export interface MaterialVariance {
  id: string;
  projectId: string;
  materialId: string;
  
  plannedQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  variancePercent: number;
  
  reason?: string;
  notes?: string;
  
  recordedAt: Timestamp;
  recordedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// BOQ PARSING JOB
// ─────────────────────────────────────────────────────────────────

export interface BOQParsingJob {
  id: string;
  projectId: string;
  
  // Source
  fileName: string;
  fileUrl: string;
  fileType: 'excel' | 'pdf' | 'csv';
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  
  // Results
  totalItems?: number;
  parsedItems?: number;
  errorItems?: number;
  
  // Timing
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Audit
  createdAt: Timestamp;
  createdBy: string;
}
