/**
 * PROJECT TYPES
 * 
 * Individual infrastructure project within a program.
 * Projects inherit engagement context and implementation type from parent program.
 */

import { Timestamp } from 'firebase/firestore';
import { ImplementationType } from './program';
import { ProjectLocation } from './project-location';
import { ProjectScope } from './project-scope';
import { ProjectBudget, BudgetSummary } from './project-budget';
import { ProjectProgress } from './project-progress';
import { ProjectTimeline } from './project-timeline';
import { ContractorInfo, SiteTeam } from './project-contractor';

// ─────────────────────────────────────────────────────────────────
// PROJECT STATUS
// ─────────────────────────────────────────────────────────────────

export type ProjectStatus =
  | 'planning'
  | 'procurement'
  | 'mobilization'
  | 'active'
  | 'substantial_completion'
  | 'defects_liability'
  | 'completed'
  | 'suspended'
  | 'cancelled';

export interface ProjectStatusConfig {
  status: ProjectStatus;
  label: string;
  description: string;
  color: string;
  allowedTransitions: ProjectStatus[];
}

export const PROJECT_STATUSES: Record<ProjectStatus, ProjectStatusConfig> = {
  planning: {
    status: 'planning',
    label: 'Planning',
    description: 'Scope and budget being defined',
    color: 'blue',
    allowedTransitions: ['procurement', 'mobilization', 'cancelled'],
  },
  procurement: {
    status: 'procurement',
    label: 'Procurement',
    description: 'Contractor selection in progress',
    color: 'purple',
    allowedTransitions: ['mobilization', 'cancelled', 'suspended'],
  },
  mobilization: {
    status: 'mobilization',
    label: 'Mobilization',
    description: 'Site preparation and setup',
    color: 'indigo',
    allowedTransitions: ['active', 'cancelled', 'suspended'],
  },
  active: {
    status: 'active',
    label: 'Active',
    description: 'Construction in progress',
    color: 'green',
    allowedTransitions: ['substantial_completion', 'suspended', 'cancelled'],
  },
  substantial_completion: {
    status: 'substantial_completion',
    label: 'Substantial Completion',
    description: 'Main works complete',
    color: 'teal',
    allowedTransitions: ['defects_liability', 'completed'],
  },
  defects_liability: {
    status: 'defects_liability',
    label: 'Defects Liability',
    description: 'DLP period active',
    color: 'cyan',
    allowedTransitions: ['completed'],
  },
  completed: {
    status: 'completed',
    label: 'Completed',
    description: 'Final handover done',
    color: 'gray',
    allowedTransitions: [],
  },
  suspended: {
    status: 'suspended',
    label: 'Suspended',
    description: 'Temporarily halted',
    color: 'yellow',
    allowedTransitions: ['planning', 'procurement', 'mobilization', 'active', 'cancelled'],
  },
  cancelled: {
    status: 'cancelled',
    label: 'Cancelled',
    description: 'Project terminated',
    color: 'red',
    allowedTransitions: [],
  },
};

// ─────────────────────────────────────────────────────────────────
// PROJECT TYPE
// ─────────────────────────────────────────────────────────────────

export type ProjectType =
  | 'new_construction'
  | 'renovation'
  | 'expansion'
  | 'rehabilitation'
  | 'equipment_installation'
  | 'infrastructure_upgrade';

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  new_construction: 'New Construction',
  renovation: 'Renovation',
  expansion: 'Expansion',
  rehabilitation: 'Rehabilitation',
  equipment_installation: 'Equipment Installation',
  infrastructure_upgrade: 'Infrastructure Upgrade',
};

// ─────────────────────────────────────────────────────────────────
// PROJECT ENTITY
// ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  programId: string;
  engagementId: string;
  
  // Identification
  projectCode: string;
  name: string;
  description?: string;
  
  // Classification
  status: ProjectStatus;
  implementationType: ImplementationType;
  projectType: ProjectType;
  
  // Details
  location: ProjectLocation;
  scope: ProjectScope;
  budget: ProjectBudget;
  progress: ProjectProgress;
  timeline: ProjectTimeline;
  
  // Implementation (mutually exclusive based on implementationType)
  contractor?: ContractorInfo;
  siteTeam?: SiteTeam;
  
  // MatFlow Integration
  matflowLinked: boolean;
  matflowBoqId?: string;
  matflowBoqIds?: string[];
  
  // Cross-module linking
  linkedDealId?: string;
  
  // Metadata
  tags?: string[];
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT FORM DATA
// ─────────────────────────────────────────────────────────────────

export interface ProjectFormData {
  programId: string;
  name: string;
  description?: string;
  projectType: ProjectType;
  location: Partial<ProjectLocation>;
  estimatedStartDate: Date;
  estimatedEndDate: Date;
  budgetAmount: number;
  budgetCurrency: string;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT SUMMARY
// ─────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string;
  projectCode: string;
  name: string;
  status: ProjectStatus;
  location: {
    siteName: string;
    region: string;
  };
  budget: BudgetSummary;
  progress: {
    physical: number;
    financial: number;
  };
  timeline: {
    startDate: Date;
    endDate: Date;
    isDelayed: boolean;
    daysRemaining: number;
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Check if status transition is valid
 */
export function isValidProjectStatusTransition(
  from: ProjectStatus,
  to: ProjectStatus
): boolean {
  return PROJECT_STATUSES[from].allowedTransitions.includes(to);
}

/**
 * Get status color class
 */
export function getProjectStatusColor(status: ProjectStatus): string {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100',
    green: 'text-green-600 bg-green-100',
    teal: 'text-teal-600 bg-teal-100',
    cyan: 'text-cyan-600 bg-cyan-100',
    gray: 'text-gray-600 bg-gray-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
  };
  return colorMap[PROJECT_STATUSES[status].color] || colorMap.gray;
}

/**
 * Generate project code
 */
export function generateProjectCode(
  programCode: string,
  sequence: number
): string {
  const seq = sequence.toString().padStart(3, '0');
  return `${programCode}-${seq}`;
}

/**
 * Get project summary from project
 */
export function getProjectSummary(project: Project): ProjectSummary {
  return {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    status: project.status,
    location: {
      siteName: project.location.siteName,
      region: project.location.region,
    },
    budget: {
      currency: project.budget.currency,
      total: project.budget.totalBudget,
      spent: project.budget.spent,
      remaining: project.budget.remaining,
      percentSpent: project.budget.totalBudget > 0
        ? (project.budget.spent / project.budget.totalBudget) * 100
        : 0,
      varianceStatus: project.budget.varianceStatus,
    },
    progress: {
      physical: project.progress.physicalProgress,
      financial: project.progress.financialProgress,
    },
    timeline: {
      startDate: project.timeline.currentStartDate,
      endDate: project.timeline.currentEndDate,
      isDelayed: project.timeline.isDelayed,
      daysRemaining: project.timeline.daysRemaining,
    },
  };
}

/**
 * Check if project is active
 */
export function isProjectActive(project: Project): boolean {
  return ['mobilization', 'active', 'substantial_completion', 'defects_liability'].includes(
    project.status
  );
}

/**
 * Check if project is completed or cancelled
 */
export function isProjectClosed(project: Project): boolean {
  return ['completed', 'cancelled'].includes(project.status);
}

/**
 * Get status field for program stats
 */
export function getStatusCountField(status: ProjectStatus): string {
  const mapping: Record<ProjectStatus, string> = {
    planning: 'planning',
    procurement: 'procurement',
    mobilization: 'mobilization',
    active: 'construction',
    substantial_completion: 'practical_completion',
    defects_liability: 'defects_liability',
    completed: 'completed',
    suspended: 'on_hold',
    cancelled: 'cancelled',
  };
  return mapping[status];
}
