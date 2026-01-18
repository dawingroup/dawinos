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

  // Hierarchy (4-level structure)
  billNumber?: string;
  billName?: string;
  elementCode?: string;
  elementName?: string;
  sectionCode?: string;
  sectionName?: string;
  itemNumber: string;
  itemName?: string;
  hierarchyPath?: string;  // e.g., "1.1.1.1"
  hierarchyLevel?: number; // 1=Bill, 2=Element, 3=Section, 4=Work Item
  isSummaryRow?: boolean;  // True for Level 1/2 header rows

  // Description
  description: string;
  specification?: string;
  specifications?: string; // Alternative field name from parsing
  governingSpecs?: {
    materialGrade?: string;
    brand?: string;
    standard?: string;
    finish?: string;
    color?: string;
  };

  // Quantities
  quantity: number; // For backward compatibility with parsed items
  quantityContract?: number; // Contract quantity (what's saved to Firestore)
  quantityExecuted?: number; // Actual quantity executed
  quantityRemaining?: number; // Remaining quantity
  unit: string;

  // Rates
  laborRate?: number;
  materialRate?: number;
  equipmentRate?: number;
  rate?: number; // Unit rate (what's saved to Firestore)
  unitRate: number; // For backward compatibility
  amount: number;

  // Status
  status: 'draft' | 'reviewed' | 'approved' | 'rejected';

  // Tracking
  procuredQuantity?: number;
  deliveredQuantity?: number;
  installedQuantity?: number;

  // Formula & Materials
  formulaId?: string;
  formulaName?: string;
  formulaCode?: string;
  suggestedFormula?: {
    formulaCode?: string;
    confidence?: number;
    materialRequirements?: any[];
  };
  materialRequirements?: any[];
  isBulkItem?: boolean; // True if item description IS the material itself, purchased as-is
  isCustomFormula?: boolean; // True if using one-time formula variant (not saved to library)

  // AI Parsing
  confidence?: number;
  aiConfidence?: number;
  aiSuggestions?: string[];
  isVerified?: boolean;
  needsEnhancement?: boolean;
  enhancementReasons?: string[];
  cleanupNotes?: string[];

  // Source tracking
  source?: {
    type: 'manual' | 'ai_import' | 'template';
    parsingJobId?: string;
  };
  version?: number;
  lastModifiedAt?: Timestamp;

  // Audit
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// STANDARD FORMULA
// ─────────────────────────────────────────────────────────────────

export interface FormulaComponent {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  wastagePercent: number;
}

export interface StandardFormula {
  id: string;
  code: string; // e.g., "C25", "BRICK_230"
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  outputUnit: string; // e.g., "m³", "m²"

  // Material components (NEW - what makes up this formula)
  components: FormulaComponent[];

  // Formula components (OLD - for calculations)
  laborFormula?: string;
  materialFormula?: string;
  equipmentFormula?: string;

  // Default rates
  defaultLaborRate?: number;
  defaultMaterialRate?: number;
  defaultEquipmentRate?: number;

  // Search keywords for easier discovery
  keywords?: string[];

  // Usage
  usageCount: number;
  isActive: boolean;

  // Audit
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
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
