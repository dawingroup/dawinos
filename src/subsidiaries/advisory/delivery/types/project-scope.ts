/**
 * PROJECT SCOPE TYPES
 * 
 * Scope definition, work packages, and deliverables.
 */

// ─────────────────────────────────────────────────────────────────
// WORK CATEGORIES
// ─────────────────────────────────────────────────────────────────

export type WorkCategory =
  | 'site_preparation'
  | 'foundations'
  | 'structural'
  | 'roofing'
  | 'finishes'
  | 'mep'
  | 'external_works'
  | 'equipment'
  | 'landscaping';

export const WORK_CATEGORY_LABELS: Record<WorkCategory, string> = {
  site_preparation: 'Site Preparation',
  foundations: 'Foundations',
  structural: 'Structural Works',
  roofing: 'Roofing',
  finishes: 'Finishes',
  mep: 'MEP (Mechanical, Electrical, Plumbing)',
  external_works: 'External Works',
  equipment: 'Equipment Installation',
  landscaping: 'Landscaping',
};

// ─────────────────────────────────────────────────────────────────
// WORK PACKAGE
// ─────────────────────────────────────────────────────────────────

export type WorkPackageStatus = 'not_started' | 'in_progress' | 'completed';

export interface WorkPackage {
  id: string;
  name: string;
  description: string;
  category: WorkCategory;
  estimatedValue: number;
  percentOfTotal: number;
  status: WorkPackageStatus;
}

// ─────────────────────────────────────────────────────────────────
// DELIVERABLES
// ─────────────────────────────────────────────────────────────────

export type DeliverableType =
  | 'design_document'
  | 'permit'
  | 'certificate'
  | 'inspection_report'
  | 'handover_document'
  | 'as_built_drawing'
  | 'operation_manual';

export type DeliverableStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: DeliverableType;
  targetDate: Date;
  status: DeliverableStatus;
  documentId?: string;
}

export const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  design_document: 'Design Document',
  permit: 'Permit',
  certificate: 'Certificate',
  inspection_report: 'Inspection Report',
  handover_document: 'Handover Document',
  as_built_drawing: 'As-Built Drawing',
  operation_manual: 'Operation Manual',
};

// ─────────────────────────────────────────────────────────────────
// SCOPE CHANGE
// ─────────────────────────────────────────────────────────────────

export type ScopeChangeStatus = 'pending' | 'approved' | 'rejected';

export interface ScopeChange {
  id: string;
  description: string;
  reason: string;
  impact: {
    budgetImpact: number;
    timelineImpact: number;
  };
  approvedBy?: string;
  approvedAt?: Date;
  status: ScopeChangeStatus;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT SCOPE
// ─────────────────────────────────────────────────────────────────

export interface ProjectScope {
  summary: string;
  detailedScope?: string;
  majorWorks: WorkPackage[];
  expectedDeliverables: Deliverable[];
  scopeVersion: number;
  lastScopeChange?: ScopeChange;
  hasApprovedBoq: boolean;
  boqApprovalDate?: Date;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Initialize default scope
 */
export function getDefaultScope(): ProjectScope {
  return {
    summary: '',
    majorWorks: [],
    expectedDeliverables: [],
    scopeVersion: 1,
    hasApprovedBoq: false,
  };
}

/**
 * Calculate scope completion percentage
 */
export function calculateScopeCompletion(scope: ProjectScope): number {
  if (scope.majorWorks.length === 0) return 0;
  
  const completed = scope.majorWorks.filter(w => w.status === 'completed').length;
  return Math.round((completed / scope.majorWorks.length) * 100);
}

/**
 * Get pending deliverables count
 */
export function getPendingDeliverablesCount(scope: ProjectScope): number {
  return scope.expectedDeliverables.filter(d => d.status === 'pending').length;
}

/**
 * Get overdue deliverables
 */
export function getOverdueDeliverables(scope: ProjectScope): Deliverable[] {
  const now = new Date();
  return scope.expectedDeliverables.filter(
    d => d.status === 'pending' && new Date(d.targetDate) < now
  );
}

/**
 * Get work package status label
 */
export function getWorkPackageStatusLabel(status: WorkPackageStatus): string {
  const labels: Record<WorkPackageStatus, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  };
  return labels[status];
}

/**
 * Create default work packages for a project type
 */
export function createDefaultWorkPackages(_projectType: string): WorkPackage[] {
  const packages: WorkPackage[] = [
    {
      id: 'wp-1',
      name: 'Site Preparation',
      description: 'Clearing, leveling, and site setup',
      category: 'site_preparation',
      estimatedValue: 0,
      percentOfTotal: 5,
      status: 'not_started',
    },
    {
      id: 'wp-2',
      name: 'Foundations',
      description: 'Foundation works and ground floor slab',
      category: 'foundations',
      estimatedValue: 0,
      percentOfTotal: 15,
      status: 'not_started',
    },
    {
      id: 'wp-3',
      name: 'Structural Works',
      description: 'Columns, beams, walls, and slabs',
      category: 'structural',
      estimatedValue: 0,
      percentOfTotal: 25,
      status: 'not_started',
    },
    {
      id: 'wp-4',
      name: 'Roofing',
      description: 'Roof structure and covering',
      category: 'roofing',
      estimatedValue: 0,
      percentOfTotal: 10,
      status: 'not_started',
    },
    {
      id: 'wp-5',
      name: 'MEP Works',
      description: 'Mechanical, electrical, and plumbing installations',
      category: 'mep',
      estimatedValue: 0,
      percentOfTotal: 20,
      status: 'not_started',
    },
    {
      id: 'wp-6',
      name: 'Finishes',
      description: 'Plastering, painting, tiling, and fixtures',
      category: 'finishes',
      estimatedValue: 0,
      percentOfTotal: 15,
      status: 'not_started',
    },
    {
      id: 'wp-7',
      name: 'External Works',
      description: 'Drainage, paving, and external facilities',
      category: 'external_works',
      estimatedValue: 0,
      percentOfTotal: 10,
      status: 'not_started',
    },
  ];
  
  return packages;
}
