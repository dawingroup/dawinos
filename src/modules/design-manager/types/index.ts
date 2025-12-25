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
