/**
 * Architectural Drawings Types
 * Type definitions for the architectural drawings module
 */

import type { Timestamp } from '@/shared/types';
import type { ApprovalStatus } from './index';

// ============================================
// Core Enums and Types
// ============================================

/**
 * Types of architectural drawings
 */
export type ArchitecturalDrawingType =
  | 'floor-plan'
  | 'elevation'
  | 'section'
  | 'detail'
  | 'reflected-ceiling-plan'
  | 'site-plan'
  | 'roof-plan'
  | 'schedule';

/**
 * Architectural drawing workflow stages
 */
export type ArchitecturalStage =
  | 'arch-concept'        // Initial concept sketches
  | 'arch-development'    // Design development
  | 'arch-review'         // Internal review
  | 'arch-client-review'  // Client review via portal
  | 'arch-revision'       // Revision based on feedback
  | 'arch-approved';      // Final approved

/**
 * Sheet sizes for architectural drawings
 */
export type SheetSize = 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'ARCH-D' | 'ARCH-E' | 'custom';

/**
 * Drawing file types
 */
export type DrawingFileType = 'pdf' | 'dwg' | 'dxf' | 'skp' | 'rvt' | 'image' | 'other';

// ============================================
// File and Approval Types
// ============================================

/**
 * File attachment for architectural drawings
 */
export interface ArchitecturalDrawingFile {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  mimeType: string;
  size: number;
  fileType: DrawingFileType;
  uploadedAt: Timestamp;
  uploadedBy: string;
  isCurrentVersion: boolean;
}

/**
 * Approval record for architectural drawings
 */
export interface ArchitecturalApprovalRecord {
  id: string;
  type: 'internal' | 'client';
  status: ApprovalStatus;
  requestedAt: Timestamp;
  requestedBy: string;
  respondedAt?: Timestamp;
  respondedBy?: string;
  notes?: string;
  signature?: string;           // Base64 signature for client approvals
}

/**
 * Stage transition history entry
 */
export interface ArchitecturalStageTransition {
  id: string;
  fromStage: ArchitecturalStage | null;
  toStage: ArchitecturalStage;
  transitionedAt: Timestamp;
  transitionedBy: string;
  notes?: string;
}

// ============================================
// Main Architectural Drawing Type
// ============================================

/**
 * Architectural Drawing - Main entity
 */
export interface ArchitecturalDrawing {
  id: string;

  // Identification
  drawingNumber: string;        // e.g., "A-101", "A-201"
  name: string;                 // e.g., "Ground Floor Plan"
  description?: string;
  drawingType: ArchitecturalDrawingType;

  // Project relationship
  projectId: string;
  projectCode: string;

  // Workflow
  currentStage: ArchitecturalStage;

  // Version control
  version: number;
  previousVersionId?: string;

  // Files
  files: ArchitecturalDrawingFile[];

  // Scale and sheet info
  scale?: string;               // e.g., "1:50", "1:100"
  sheetSize?: SheetSize;
  customSheetSize?: {
    width: number;
    height: number;
    unit: 'mm' | 'inches';
  };

  // Approval tracking
  approvals: ArchitecturalApprovalRecord[];
  stageHistory: ArchitecturalStageTransition[];

  // Client portal
  sharedToPortal: boolean;
  portalShareDate?: Timestamp;
  clientViewedAt?: Timestamp;

  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;

  // Optional
  dueDate?: Timestamp;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  notes?: string;

  // Room/space reference (for floor plans)
  linkedSpaces?: string[];

  // Revision info
  revisionNumber?: string;      // e.g., "Rev A", "Rev B"
  revisionDate?: Timestamp;
  revisionNotes?: string;
}

// ============================================
// Drawing Set Types
// ============================================

/**
 * Drawing set for grouping related drawings
 */
export interface DrawingSet {
  id: string;
  projectId: string;
  name: string;                 // e.g., "Construction Documents", "Permit Set"
  description?: string;
  drawingIds: string[];
  status: 'draft' | 'issued' | 'superseded';
  issuedDate?: Timestamp;
  revision?: string;            // e.g., "Rev A", "Rev B"
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ============================================
// Stage Gate Types
// ============================================

/**
 * Stage gate criterion for architectural drawings
 */
export interface ArchitecturalGateCriterion {
  aspect: string;
  requiredStatus: 'met' | 'not-met';
  allowOverride?: boolean;
}

/**
 * Gate criteria set for architectural stages
 */
export interface ArchitecturalGateCriteriaSet {
  mustMeet: ArchitecturalGateCriterion[];
  shouldMeet: ArchitecturalGateCriterion[];
}

// ============================================
// Dashboard & Filter Types
// ============================================

/**
 * Summary statistics for architectural drawings
 */
export interface ArchitecturalDashboardStats {
  totalDrawings: number;
  byStage: Record<ArchitecturalStage, number>;
  byType: Record<ArchitecturalDrawingType, number>;
  pendingClientReview: number;
  pendingInternalReview: number;
  recentlyUpdated: number;
}

/**
 * Filter options for architectural drawings
 */
export interface ArchitecturalDrawingFilters {
  projectId?: string;
  stage?: ArchitecturalStage | ArchitecturalStage[];
  drawingType?: ArchitecturalDrawingType | ArchitecturalDrawingType[];
  sharedToPortal?: boolean;
  search?: string;
  sortBy?: 'drawingNumber' | 'updatedAt' | 'name' | 'stage';
  sortOrder?: 'asc' | 'desc';
}

// ============================================
// Client Portal Types
// ============================================

/**
 * Architectural drawing for client portal view
 */
export interface PortalArchitecturalDrawing {
  id: string;
  projectId: string;
  drawingNumber: string;
  name: string;
  drawingType: ArchitecturalDrawingType;
  description?: string;

  // File for viewing
  fileUrl: string;
  fileName: string;
  fileType: string;
  thumbnailUrl?: string;

  // Version
  version: number;
  scale?: string;
  revisionNumber?: string;

  // Status
  status: 'pending-review' | 'approved' | 'revision-requested';

  // Approval
  approvalStatus: ApprovalStatus;
  canApprove: boolean;
  approvedAt?: Timestamp;
  approvedBy?: string;

  // Client feedback
  clientNotes?: string;

  // Timestamps
  sharedAt: Timestamp;
  sharedBy: string;
}

/**
 * Client response to a drawing review
 */
export interface DrawingApprovalResponse {
  drawingId: string;
  action: 'approve' | 'reject' | 'revision';
  notes?: string;
  signature?: string;           // Optional signature capture
  markedUpFileUrl?: string;     // If client uploads marked-up version
}

// ============================================
// Constants
// ============================================

/**
 * Stage order for progression
 */
export const ARCHITECTURAL_STAGE_ORDER: ArchitecturalStage[] = [
  'arch-concept',
  'arch-development',
  'arch-review',
  'arch-client-review',
  'arch-revision',
  'arch-approved',
];

/**
 * Stage display labels
 */
export const ARCHITECTURAL_STAGE_LABELS: Record<ArchitecturalStage, string> = {
  'arch-concept': 'Concept',
  'arch-development': 'Development',
  'arch-review': 'Internal Review',
  'arch-client-review': 'Client Review',
  'arch-revision': 'Revision',
  'arch-approved': 'Approved',
};

/**
 * Drawing type display labels
 */
export const DRAWING_TYPE_LABELS: Record<ArchitecturalDrawingType, string> = {
  'floor-plan': 'Floor Plan',
  'elevation': 'Elevation',
  'section': 'Section',
  'detail': 'Detail',
  'reflected-ceiling-plan': 'Reflected Ceiling Plan',
  'site-plan': 'Site Plan',
  'roof-plan': 'Roof Plan',
  'schedule': 'Schedule',
};

/**
 * Drawing number prefixes by type
 */
export const DRAWING_NUMBER_PREFIXES: Record<ArchitecturalDrawingType, string> = {
  'floor-plan': 'A1',
  'elevation': 'A2',
  'section': 'A3',
  'detail': 'A5',
  'reflected-ceiling-plan': 'A7',
  'site-plan': 'C1',
  'roof-plan': 'A4',
  'schedule': 'A9',
};

/**
 * Gate criteria for each architectural stage
 */
export const ARCHITECTURAL_GATE_CRITERIA: Record<ArchitecturalStage, ArchitecturalGateCriteriaSet> = {
  'arch-concept': {
    mustMeet: [],
    shouldMeet: [],
  },
  'arch-development': {
    mustMeet: [
      { aspect: 'hasDrawingFile', requiredStatus: 'met' },
    ],
    shouldMeet: [],
  },
  'arch-review': {
    mustMeet: [
      { aspect: 'hasScaleSet', requiredStatus: 'met' },
      { aspect: 'hasDrawingNumber', requiredStatus: 'met' },
    ],
    shouldMeet: [],
  },
  'arch-client-review': {
    mustMeet: [
      { aspect: 'internalReviewApproved', requiredStatus: 'met' },
    ],
    shouldMeet: [],
  },
  'arch-revision': {
    mustMeet: [],
    shouldMeet: [],
  },
  'arch-approved': {
    mustMeet: [
      { aspect: 'clientApproved', requiredStatus: 'met' },
    ],
    shouldMeet: [],
  },
};
