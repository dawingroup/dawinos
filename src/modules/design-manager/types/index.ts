/**
 * Design Manager Types
 * TypeScript type definitions for the design manager module
 */

import type { Timestamp } from '@/shared/types';

// ============================================
// Core Enums and Status Types
// ============================================

/**
 * RAG Status values (Red, Amber, Green, Not Applicable)
 */
export type RAGStatusValue = 'red' | 'amber' | 'green' | 'not-applicable';

/**
 * Design stages in the workflow
 */
export type DesignStage = 
  | 'concept'
  | 'preliminary'
  | 'technical'
  | 'pre-production'
  | 'production-ready';

/**
 * Design item categories
 */
export type DesignCategory = 
  | 'casework'
  | 'furniture'
  | 'millwork'
  | 'doors'
  | 'fixtures'
  | 'specialty';

/**
 * Approval status
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision-requested';

// ============================================
// RAG Status Types
// ============================================

/**
 * Single RAG value with metadata
 */
export interface RAGValue {
  status: RAGStatusValue;
  notes: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Design Completeness aspects
 */
export interface DesignCompletenessAspects {
  overallDimensions: RAGValue;
  model3D: RAGValue;
  productionDrawings: RAGValue;
  materialSpecs: RAGValue;
  hardwareSpecs: RAGValue;
  finishSpecs: RAGValue;
  joineryDetails: RAGValue;
  tolerances: RAGValue;
  assemblyInstructions: RAGValue;
}

/**
 * Manufacturing Readiness aspects
 */
export interface ManufacturingReadinessAspects {
  materialAvailability: RAGValue;
  hardwareAvailability: RAGValue;
  toolingReadiness: RAGValue;
  processDocumentation: RAGValue;
  qualityCriteria: RAGValue;
  costValidation: RAGValue;
}

/**
 * Quality Gates aspects
 */
export interface QualityGatesAspects {
  internalDesignReview: RAGValue;
  manufacturingReview: RAGValue;
  clientApproval: RAGValue;
  prototypeValidation: RAGValue;
}

/**
 * Complete RAG Status structure
 */
export interface RAGStatus {
  designCompleteness: DesignCompletenessAspects;
  manufacturingReadiness: ManufacturingReadinessAspects;
  qualityGates: QualityGatesAspects;
}

// ============================================
// Design Item Types
// ============================================

/**
 * Stage transition history entry
 */
export interface StageTransition {
  fromStage: DesignStage;
  toStage: DesignStage;
  transitionedAt: Timestamp;
  transitionedBy: string;
  notes?: string;
}

/**
 * Approval record
 */
export interface ApprovalRecord {
  id: string;
  type: 'internal' | 'client' | 'manufacturing';
  status: ApprovalStatus;
  requestedAt: Timestamp;
  requestedBy: string;
  respondedAt?: Timestamp;
  respondedBy?: string;
  notes?: string;
}

/**
 * File attachment for design items
 */
export interface DesignFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  category: 'drawing' | 'model' | 'specification' | 'reference' | 'other';
  uploadedAt: Timestamp;
  uploadedBy: string;
}

/**
 * Design Item - Main entity
 */
export interface DesignItem {
  id: string;
  
  // Identification
  itemCode: string;
  name: string;
  description?: string;
  category: DesignCategory;
  
  // Project relationship
  projectId: string;
  projectCode: string;
  
  // Status
  currentStage: DesignStage;
  ragStatus: RAGStatus;
  overallReadiness: number; // 0-100 percentage
  
  // History
  stageHistory: StageTransition[];
  approvals: ApprovalRecord[];
  
  // Files
  files: DesignFile[];
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
  
  // Optional fields
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Timestamp;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  notes?: string;
}

// ============================================
// Project Types
// ============================================

/**
 * Design Project
 */
export interface DesignProject {
  id: string;
  code: string;
  name: string;
  description?: string;
  
  // Client info
  customerId?: string;
  customerName?: string;
  
  // Status
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  
  // Dates
  startDate?: Timestamp;
  dueDate?: Timestamp;
  completedDate?: Timestamp;
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================
// Dashboard / Summary Types
// ============================================

/**
 * Summary statistics for dashboard
 */
export interface DesignDashboardStats {
  totalItems: number;
  byStage: Record<DesignStage, number>;
  byStatus: Record<RAGStatusValue, number>;
  byCategory: Record<DesignCategory, number>;
  averageReadiness: number;
  itemsNeedingAttention: number;
  recentlyUpdated: number;
}

/**
 * Filter options for design items
 */
export interface DesignItemFilters {
  projectId?: string;
  stage?: DesignStage | DesignStage[];
  category?: DesignCategory | DesignCategory[];
  status?: RAGStatusValue;
  search?: string;
  sortBy?: 'name' | 'updatedAt' | 'readiness' | 'stage';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Design Parameters Types (from Spec Section 3.4)
// ============================================

/**
 * Material specification
 */
export interface MaterialSpec {
  id: string;
  name: string;                        // "3/4 Baltic Birch Plywood"
  type: 'sheet' | 'solid' | 'veneer' | 'laminate' | 'other';
  thickness: number;                   // mm
  supplier: string | null;
  sku: string | null;
  katanaMaterialId: string | null;
  grainDirection: boolean;             // Does grain matter?
  estimatedCostPerUnit: number | null;
}

/**
 * Hardware specification
 */
export interface HardwareSpec {
  id: string;
  name: string;                        // "Blum Tandem Plus 566H"
  category: 'hinges' | 'slides' | 'handles' | 'locks' | 'connectors' | 'other';
  quantity: number;
  supplier: string | null;
  sku: string | null;
  katanaMaterialId: string | null;
  estimatedCostPerUnit: number | null;
}

/**
 * Finish specification
 */
export interface FinishSpec {
  type: 'paint' | 'stain' | 'lacquer' | 'oil' | 'veneer' | 'laminate' | 'none';
  color: string | null;
  sheen: 'flat' | 'matte' | 'satin' | 'semi-gloss' | 'gloss' | null;
  coats: number | null;
  brand: string | null;
  productCode: string | null;
}

/**
 * Edge banding specification
 */
export interface EdgeBandingSpec {
  material: string;
  thickness: number;                   // mm
  width: number;                       // mm
  color: string | null;
  supplier: string | null;
}

/**
 * Construction method types
 */
export type ConstructionMethod = 
  | 'frameless'          // European/32mm system
  | 'face-frame'         // Traditional American
  | 'post-and-rail'      // Frame and panel
  | 'solid-wood'         // Solid wood construction
  | 'mixed';             // Combination

/**
 * Joinery types
 */
export type JoineryType = 
  | 'dowel'
  | 'biscuit'
  | 'pocket-screw'
  | 'mortise-tenon'
  | 'dovetail'
  | 'rabbet-dado'
  | 'cam-lock'
  | 'confirmat'
  | 'glue-only';

/**
 * Complete design parameters interface
 */
export interface DesignParameters {
  // Dimensions
  dimensions: {
    width: number | null;              // mm
    height: number | null;             // mm
    depth: number | null;              // mm
    unit: 'mm' | 'inches';
  };
  
  // Materials
  primaryMaterial: MaterialSpec | null;
  secondaryMaterials: MaterialSpec[];
  edgeBanding: EdgeBandingSpec | null;
  
  // Hardware
  hardware: HardwareSpec[];
  
  // Finish
  finish: FinishSpec | null;
  
  // Construction
  constructionMethod: ConstructionMethod;
  joineryTypes: JoineryType[];
  
  // Quality
  awiGrade: 'economy' | 'custom' | 'premium';
  
  // Special Requirements
  specialRequirements: string[];
}

// ============================================
// Extended Design Item with Parameters
// ============================================

/**
 * Extended Design Item with full parameters (for detailed views)
 */
export interface DesignItemFull extends DesignItem {
  // Parameters (design specifications)
  parameters: DesignParameters;
  
  // Workflow flags
  hasBlockers: boolean;
  blockerNotes: string;
  requiresPrototype: boolean;
  prototypeStatus: 'not-required' | 'pending' | 'in-progress' | 'approved' | 'rejected';
  
  // Calculated/Derived
  estimatedCost: number | null;
  
  // External References
  katanaProductId: string | null;
  katanaVariantId: string | null;
  notionPageId: string | null;
  
  // Stage timing
  stageEnteredAt: Timestamp;
  productionReleasedAt: Timestamp | null;
  
  // Assignment
  assignedTo: string | null;           // User ID
}

// ============================================
// Approval Types (from Spec Section 3.6)
// ============================================

/**
 * Approval workflow types
 */
export type ApprovalType = 
  | 'design-review'
  | 'manufacturing-review'
  | 'client-approval'
  | 'prototype-approval'
  | 'production-release';

/**
 * Full approval entity (subcollection)
 */
export interface Approval {
  id: string;
  type: ApprovalType;
  status: ApprovalStatus;
  requestedAt: Timestamp;
  requestedBy: string;                 // User ID
  assignedTo: string;                  // User ID (approver)
  decidedAt: Timestamp | null;
  decision: string | null;             // Approval notes
  attachments: string[];               // Storage URLs
}

// ============================================
// Deliverable Types (from Spec Section 3.7)
// ============================================

/**
 * Deliverable types
 */
export type DeliverableType = 
  | 'concept-sketch'
  | 'mood-board'
  | '3d-model'
  | 'rendering'
  | 'shop-drawing'
  | 'cut-list'
  | 'bom'
  | 'cnc-program'
  | 'assembly-instructions'
  | 'specification-sheet'
  | 'client-presentation'
  | 'other';

/**
 * Design deliverable (subcollection)
 */
export interface Deliverable {
  id: string;
  stage: DesignStage;
  type: DeliverableType;
  name: string;
  description: string;
  
  // File reference
  storageUrl: string;                  // Firebase Storage URL
  googleDriveUrl: string | null;       // If synced to Drive
  fileType: string;                    // "pdf", "skp", "dxf", etc.
  fileSize: number;                    // bytes
  
  // Version control
  version: number;
  previousVersionId: string | null;
  
  // Status
  status: 'draft' | 'review' | 'approved' | 'superseded';
  
  // Metadata
  uploadedAt: Timestamp;
  uploadedBy: string;
  approvedAt: Timestamp | null;
  approvedBy: string | null;
}

// ============================================
// AI Analysis Types (from Spec Section 3.8)
// ============================================

/**
 * AI analysis types
 */
export type AIAnalysisType = 'brief-parsing' | 'manufacturability' | 'cost-estimation' | 'dfm-check';

/**
 * Design for Manufacturing issue
 */
export interface DfMIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;                    // "tool-access", "material", "joinery", etc.
  description: string;
  affectedComponent: string | null;
  suggestedFix: string | null;
  ruleId?: string;
}

/**
 * Cost breakdown from AI analysis
 */
export interface CostBreakdown {
  materials: number;
  hardware: number;
  labor: number;
  finishing: number;
  overhead: number;
  total: number;
  confidence: number;
}

/**
 * AI Analysis entity (subcollection)
 */
export interface AIAnalysis {
  id: string;
  designItemId: string;
  analysisType: AIAnalysisType;
  
  // Request
  inputData: Record<string, unknown>;  // What was sent to AI
  requestedAt: Timestamp;
  requestedBy: string;
  
  // Response
  status: 'pending' | 'completed' | 'failed';
  completedAt: Timestamp | null;
  result: Record<string, unknown> | null;  // AI response
  confidence: number | null;           // 0-1 confidence score
  
  // DfM-specific
  dfmIssues?: DfMIssue[];
  
  // Cost-specific
  costBreakdown?: CostBreakdown;
  
  // Feedback loop
  userFeedback: 'accurate' | 'partially-accurate' | 'inaccurate' | null;
  feedbackNotes: string | null;
}

// ============================================
// Brief Analysis Result Types (for AI)
// ============================================

/**
 * Extracted design item from brief parsing
 */
export interface ExtractedDesignItem {
  name: string;
  category: DesignCategory;
  description: string;
  dimensions: {
    width: number | null;
    height: number | null;
    depth: number | null;
    unit: 'mm' | 'inches';
  };
  suggestedMaterials: string[];
  suggestedFinish: string | null;
  specialRequirements: string[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  confidence: number;
}

/**
 * Brief analysis result
 */
export interface BriefAnalysisResult {
  extractedItems: ExtractedDesignItem[];
  projectNotes: string | null;
  ambiguities: string[];
  clientPreferences: string[];
}

// ============================================
// Stage History Types (from Spec Section 3.5)
// ============================================

/**
 * Stage transition with full audit data (subcollection)
 */
export interface StageHistoryEntry {
  id: string;
  fromStage: DesignStage | null;       // null for initial creation
  toStage: DesignStage;
  transitionedAt: Timestamp;
  transitionedBy: string;              // User ID
  ragSnapshot: RAGStatus;              // Snapshot at transition
  notes: string;
  gateCheckPassed: boolean;
  overrideUsed?: boolean;
}

// ============================================
// Gate Criteria Types
// ============================================

/**
 * Single gate criterion
 */
export interface GateCriterion {
  aspect: string;
  requiredStatus: RAGStatusValue | RAGStatusValue[];
  allowNA?: boolean;
  minimumStatus?: RAGStatusValue;
}

/**
 * Gate criteria set for a stage
 */
export interface GateCriteriaSet {
  mustMeet: GateCriterion[];
  shouldMeet: GateCriterion[];
  minimumReadiness: number;
}
