/**
 * MatFlow Core Types
 * Construction material management for Dawin Advisory
 */

// ============================================================================
// MODULE IDENTIFIER
// ============================================================================

export const MATFLOW_MODULE = 'matflow' as const;
export const MATFLOW_SUBSIDIARY = 'advisory' as const;

// ============================================================================
// ENUMS
// ============================================================================

export enum MeasurementUnit {
  // Length
  METERS = 'm',
  CENTIMETERS = 'cm',
  MILLIMETERS = 'mm',
  FEET = 'ft',
  INCHES = 'in',
  
  // Area
  SQUARE_METERS = 'm²',
  SQUARE_FEET = 'ft²',
  
  // Volume
  CUBIC_METERS = 'm³',
  CUBIC_FEET = 'ft³',
  LITERS = 'L',
  GALLONS = 'gal',
  
  // Weight
  KILOGRAMS = 'kg',
  TONNES = 't',
  POUNDS = 'lb',
  
  // Count
  PIECES = 'pcs',
  BAGS = 'bags',
  BUNDLES = 'bundles',
  ROLLS = 'rolls',
  SHEETS = 'sheets',
  BOXES = 'boxes',
  PACKETS = 'packets',
  
  // Construction specific
  TRIPS = 'trips',
  LOADS = 'loads',
  LUMP_SUM = 'LS',
  PROVISIONAL_SUM = 'PS',
}

export enum MaterialCategory {
  CONCRETE = 'concrete',
  STEEL = 'steel',
  MASONRY = 'masonry',
  TIMBER = 'timber',
  ROOFING = 'roofing',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  FINISHES = 'finishes',
  DOORS_WINDOWS = 'doors_windows',
  HARDWARE = 'hardware',
  EARTHWORKS = 'earthworks',
  DRAINAGE = 'drainage',
  LANDSCAPING = 'landscaping',
  MISCELLANEOUS = 'miscellaneous',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum BOQStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REVISED = 'revised',
  LOCKED = 'locked',
}

export enum ConstructionStage {
  PRELIMINARIES = 'preliminaries',
  SUBSTRUCTURES = 'substructures',
  SUPERSTRUCTURE = 'superstructure',
  ROOFING = 'roofing',
  FINISHES = 'finishes',
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  EXTERNAL_WORKS = 'external_works',
  LANDSCAPING = 'landscaping',
}

export enum ProcurementType {
  DELIVERY = 'delivery',
  PURCHASE_ORDER = 'purchase_order',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  RETURN = 'return',
  TRANSFER = 'transfer',
}

export enum ProcurementStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

// ============================================================================
// BASE INTERFACES
// ============================================================================

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface AuditFields {
  createdAt: FirestoreTimestamp;
  createdBy: string;
  updatedAt: FirestoreTimestamp;
  updatedBy: string;
}

export interface SoftDelete {
  isDeleted: boolean;
  deletedAt?: FirestoreTimestamp;
  deletedBy?: string;
}

export interface VersionControl {
  version: number;
  lastModifiedAt: FirestoreTimestamp;
}

// ============================================================================
// FORMULA TYPES
// ============================================================================

export interface FormulaComponent {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: MeasurementUnit;
  wastagePercent: number;
}

export interface StandardFormula {
  id: string;
  code: string;
  name: string;
  description: string;
  category: MaterialCategory;
  outputUnit: MeasurementUnit;
  components: FormulaComponent[];
  keywords: string[];
  isActive: boolean;
  usageCount: number;
  version: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface MaterialRate {
  id: string;
  materialId: string;
  name: string;
  unit: MeasurementUnit;
  unitPrice: number;
  currency: 'UGX' | 'USD';
  supplierId?: string;
  supplierName?: string;
  validFrom: FirestoreTimestamp;
  validUntil?: FirestoreTimestamp;
  isActive: boolean;
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface ProjectMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'quantity_surveyor' | 'site_engineer' | 'project_manager';
  capabilities: string[];
  addedAt: FirestoreTimestamp;
  addedBy: string;
}

export interface ProjectStage {
  id: string;
  name: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed';
  plannedStart?: FirestoreTimestamp;
  plannedEnd?: FirestoreTimestamp;
  actualStart?: FirestoreTimestamp;
  actualEnd?: FirestoreTimestamp;
  completionPercent: number;
}

export interface ProjectSettings {
  currency: 'UGX' | 'USD';
  taxEnabled: boolean;
  taxRate: number;
  contingencyPercent: number;
  defaultWastagePercent: number;
}

export interface MatFlowProject extends AuditFields, SoftDelete {
  id: string;
  code: string;
  name: string;
  description?: string;
  
  // Relationships
  organizationId: string;
  customerId: string;
  customerName: string;
  
  // Status
  status: ProjectStatus;
  boqStatus: BOQStatus;
  
  // Location
  location: {
    district: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Configuration
  settings: ProjectSettings;
  members: ProjectMember[];
  stages: ProjectStage[];
  
  // Metadata
  totalBOQItems: number;
  totalPlannedCost: number;
  totalActualCost: number;
}

// ============================================================================
// BOQ TYPES
// ============================================================================

export interface MaterialRequirement {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: MeasurementUnit;
  unitRate: number;
  totalCost: number;
  wastageIncluded: boolean;
}

export interface BOQItemSource {
  type: 'manual' | 'ai_import' | 'excel_import';
  jobId?: string;
  fileName?: string;
  sourceRow?: number;
  confidence?: number;
}

export interface BOQItem extends AuditFields, VersionControl {
  id: string;
  projectId: string;
  
  // Item details
  itemCode: string;
  description: string;
  unit: MeasurementUnit;
  
  // Quantities
  quantityContract: number;
  quantityExecuted: number;
  quantityRemaining: number;
  
  // Pricing
  rate: number;
  amount: number;
  
  // Classification
  stage: ConstructionStage;
  category: MaterialCategory;
  
  // Formula linkage
  formulaId?: string;
  formulaCode?: string;
  materialRequirements: MaterialRequirement[];
  
  // AI metadata
  aiConfidence?: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: FirestoreTimestamp;
  
  // Source tracking
  source: BOQItemSource;
  
  // Notes
  notes?: string;
}

// ============================================================================
// PROCUREMENT TYPES
// ============================================================================

export interface ProcurementEntry extends AuditFields {
  id: string;
  projectId: string;
  
  // Classification
  type: ProcurementType;
  status: ProcurementStatus;
  
  // Reference
  referenceNumber: string;
  externalReference?: string;
  
  // Material info
  materialId: string;
  materialName: string;
  unit: MeasurementUnit;
  
  // Quantities
  quantityOrdered?: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected?: number;
  
  // Pricing
  unitPrice: number;
  totalAmount: number;
  currency: 'UGX' | 'USD';
  
  // Supplier
  supplierId?: string;
  supplierName: string;
  supplierContact?: string;
  
  // Delivery
  deliveryDate: FirestoreTimestamp;
  deliveryCondition?: 'good' | 'partial' | 'damaged' | 'rejected';
  receivedBy: string;
  receivedByName: string;
  
  // BOQ linkage
  boqItemIds: string[];
  stageId?: string;
  
  // Attachments
  receiptUrl?: string;
  photoUrls?: string[];
  
  // Offline sync
  syncStatus: 'synced' | 'pending' | 'error';
  localId?: string;
}

// ============================================================================
// AI PARSING TYPES
// ============================================================================

export interface ParsedBOQItem {
  sourceRow: number;
  itemCode?: string;
  description: string;
  unit: string;
  quantity: number;
  rate?: number;
  amount?: number;
  stage?: string;
  confidence: number;
}

export interface FormulaSuggestion {
  formulaId: string;
  formulaCode: string;
  formulaName: string;
  matchScore: number;
  reason: string;
}

export interface ParsedBOQItemWithSuggestions extends ParsedBOQItem {
  suggestedFormulas: FormulaSuggestion[];
}

export interface BOQParsingJob extends AuditFields {
  id: string;
  projectId: string;
  
  // File info
  fileName: string;
  fileUrl: string;
  fileType: 'xlsx' | 'pdf' | 'csv';
  fileSize: number;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  
  // Results
  parsedItems?: ParsedBOQItemWithSuggestions[];
  totalItemsFound?: number;
  errorMessage?: string;
  
  // Import tracking
  importedAt?: FirestoreTimestamp;
  importedBy?: string;
  importedCount?: number;
}

// ============================================================================
// VARIANCE TYPES
// ============================================================================

export interface MaterialVariance {
  materialId: string;
  materialName: string;
  unit: MeasurementUnit;
  plannedQuantity: number;
  actualQuantity: number;
  varianceQuantity: number;
  variancePercent: number;
  plannedCost: number;
  actualCost: number;
  varianceCost: number;
  status: 'under' | 'on_track' | 'over' | 'critical';
}

export interface StageVarianceSummary {
  stageId: string;
  stageName: string;
  plannedCost: number;
  actualCost: number;
  varianceCost: number;
  variancePercent: number;
  completionPercent: number;
  materials: MaterialVariance[];
}

// ============================================================================
// ROLE & CAPABILITY TYPES
// ============================================================================

export type MatFlowCapability =
  | 'boq:view'
  | 'boq:create'
  | 'boq:edit'
  | 'boq:delete'
  | 'boq:approve'
  | 'boq:import'
  | 'procurement:view'
  | 'procurement:create'
  | 'procurement:edit'
  | 'procurement:delete'
  | 'project:view'
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'formula:view'
  | 'formula:manage'
  | 'reports:view'
  | 'reports:export';

export interface MatFlowRole {
  id: string;
  name: string;
  description: string;
  capabilities: MatFlowCapability[];
  isSystem: boolean;
}

export const MATFLOW_ROLE_TEMPLATES: Record<string, MatFlowCapability[]> = {
  quantity_surveyor: [
    'boq:view', 'boq:create', 'boq:edit', 'boq:delete', 'boq:approve', 'boq:import',
    'procurement:view', 'procurement:create', 'procurement:edit',
    'project:view', 'project:edit',
    'formula:view', 'formula:manage',
    'reports:view', 'reports:export',
  ],
  site_engineer: [
    'boq:view',
    'procurement:view', 'procurement:create', 'procurement:edit',
    'project:view',
    'formula:view',
    'reports:view',
  ],
  project_manager: [
    'boq:view', 'boq:approve',
    'procurement:view',
    'project:view', 'project:edit',
    'formula:view',
    'reports:view', 'reports:export',
  ],
};
