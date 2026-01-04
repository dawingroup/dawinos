/**
 * PROJECT PROGRESS TYPES
 * 
 * Physical and financial progress tracking for projects.
 */

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────
// PROGRESS STATUS
// ─────────────────────────────────────────────────────────────────

export type ProgressStatus =
  | 'ahead'
  | 'on_track'
  | 'slightly_behind'
  | 'significantly_behind'
  | 'critical';

export const PROGRESS_STATUS_CONFIG: Record<ProgressStatus, {
  label: string;
  color: string;
  description: string;
}> = {
  ahead: { label: 'Ahead of Schedule', color: 'blue', description: '>5% ahead' },
  on_track: { label: 'On Track', color: 'green', description: 'Within 5%' },
  slightly_behind: { label: 'Slightly Behind', color: 'yellow', description: '5-15% behind' },
  significantly_behind: { label: 'Significantly Behind', color: 'orange', description: '15-30% behind' },
  critical: { label: 'Critical', color: 'red', description: '>30% behind' },
};

// ─────────────────────────────────────────────────────────────────
// PROGRESS UPDATE METHOD
// ─────────────────────────────────────────────────────────────────

export type ProgressUpdateMethod = 'manual' | 'calculated' | 'ai_vision';

// ─────────────────────────────────────────────────────────────────
// WORK PACKAGE PROGRESS
// ─────────────────────────────────────────────────────────────────

export type WorkPackageProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'delayed';

export interface WorkPackageProgress {
  workPackageId: string;
  name: string;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  percentComplete: number;
  status: WorkPackageProgressStatus;
}

// ─────────────────────────────────────────────────────────────────
// PROGRESS RECORD
// ─────────────────────────────────────────────────────────────────

export interface ProgressRecord {
  id: string;
  recordDate: Date;
  physicalProgress: number;
  financialProgress: number;
  notes?: string;
  photos?: string[];
  recordedBy: string;
  recordedAt: Timestamp;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT PROGRESS
// ─────────────────────────────────────────────────────────────────

export interface ProjectProgress {
  // Physical progress
  physicalProgress: number;
  lastPhysicalUpdate: Timestamp;
  physicalUpdateMethod: ProgressUpdateMethod;
  
  // Financial progress
  financialProgress: number;
  lastFinancialUpdate: Timestamp;
  
  // Progress curve
  plannedProgress: number;
  progressVariance: number;
  progressStatus: ProgressStatus;
  
  // Work package progress
  workPackageProgress: WorkPackageProgress[];
  
  // History
  progressHistory: ProgressRecord[];
}

// ─────────────────────────────────────────────────────────────────
// SITE VISIT
// ─────────────────────────────────────────────────────────────────

export type SiteVisitType = 'routine' | 'milestone' | 'inspection' | 'audit';

export interface SiteVisit {
  id: string;
  projectId: string;
  visitDate: Date;
  visitType: SiteVisitType;
  visitors: string[];
  findings: string;
  progressObserved: number;
  issues?: SiteIssue[];
  photos: string[];
  reportDocumentId?: string;
  createdAt: Timestamp;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────────
// SITE ISSUES
// ─────────────────────────────────────────────────────────────────

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IssueCategory =
  | 'quality'
  | 'safety'
  | 'design'
  | 'material'
  | 'labor'
  | 'weather'
  | 'community'
  | 'regulatory';

export interface SiteIssue {
  id: string;
  description: string;
  severity: IssueSeverity;
  category: IssueCategory;
  status: IssueStatus;
  responsibleParty?: string;
  dueDate?: Date;
  resolution?: string;
  resolvedAt?: Timestamp;
}

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  quality: 'Quality',
  safety: 'Safety',
  design: 'Design',
  material: 'Material',
  labor: 'Labor',
  weather: 'Weather',
  community: 'Community',
  regulatory: 'Regulatory',
};

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Initialize project progress
 */
export function initializeProjectProgress(): ProjectProgress {
  return {
    physicalProgress: 0,
    lastPhysicalUpdate: Timestamp.now(),
    physicalUpdateMethod: 'manual',
    financialProgress: 0,
    lastFinancialUpdate: Timestamp.now(),
    plannedProgress: 0,
    progressVariance: 0,
    progressStatus: 'on_track',
    workPackageProgress: [],
    progressHistory: [],
  };
}

/**
 * Calculate progress status from variance
 */
export function calculateProgressStatus(
  actualProgress: number,
  plannedProgress: number
): ProgressStatus {
  const variance = actualProgress - plannedProgress;
  if (variance > 5) return 'ahead';
  if (variance >= -5) return 'on_track';
  if (variance >= -15) return 'slightly_behind';
  if (variance >= -30) return 'significantly_behind';
  return 'critical';
}

/**
 * Calculate overall work package progress
 */
export function calculateOverallProgress(
  workPackages: WorkPackageProgress[]
): number {
  if (workPackages.length === 0) return 0;
  const totalProgress = workPackages.reduce((sum, wp) => sum + wp.percentComplete, 0);
  return Math.round(totalProgress / workPackages.length);
}

/**
 * Get progress status color class
 */
export function getProgressStatusColor(status: ProgressStatus): string {
  const colorMap: Record<ProgressStatus, string> = {
    ahead: 'text-blue-600 bg-blue-100',
    on_track: 'text-green-600 bg-green-100',
    slightly_behind: 'text-yellow-600 bg-yellow-100',
    significantly_behind: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  };
  return colorMap[status];
}

/**
 * Get issue severity color
 */
export function getIssueSeverityColor(severity: IssueSeverity): string {
  const colorMap: Record<IssueSeverity, string> = {
    low: 'text-gray-600 bg-gray-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  };
  return colorMap[severity];
}

/**
 * Count open issues by severity
 */
export function countOpenIssuesBySeverity(issues: SiteIssue[]): Record<IssueSeverity, number> {
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress');
  return openIssues.reduce(
    (acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 }
  );
}

/**
 * Get delayed work packages
 */
export function getDelayedWorkPackages(
  workPackages: WorkPackageProgress[]
): WorkPackageProgress[] {
  return workPackages.filter(wp => wp.status === 'delayed');
}
