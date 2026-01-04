/**
 * PROJECT TIMELINE TYPES
 * 
 * Schedule management, milestones, and extensions.
 */

import { Timestamp } from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────
// MILESTONE TYPES
// ─────────────────────────────────────────────────────────────────

export type MilestoneType =
  | 'commencement'
  | 'mobilization_complete'
  | 'foundations_complete'
  | 'structure_complete'
  | 'roofing_complete'
  | 'mep_roughin'
  | 'finishes_complete'
  | 'substantial_completion'
  | 'practical_completion'
  | 'final_handover';

export type MilestoneStatus = 'upcoming' | 'due' | 'overdue' | 'completed';

export const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  commencement: 'Project Commencement',
  mobilization_complete: 'Mobilization Complete',
  foundations_complete: 'Foundations Complete',
  structure_complete: 'Structure Complete',
  roofing_complete: 'Roofing Complete',
  mep_roughin: 'MEP Rough-in Complete',
  finishes_complete: 'Finishes Complete',
  substantial_completion: 'Substantial Completion',
  practical_completion: 'Practical Completion',
  final_handover: 'Final Handover',
};

// ─────────────────────────────────────────────────────────────────
// PROJECT MILESTONE
// ─────────────────────────────────────────────────────────────────

export interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  type: MilestoneType;
  plannedDate: Date;
  actualDate?: Date;
  status: MilestoneStatus;
  isContractual: boolean;
  paymentLinked: boolean;
  paymentPercentage?: number;
}

// ─────────────────────────────────────────────────────────────────
// EXTENSION TYPES
// ─────────────────────────────────────────────────────────────────

export type ExtensionReason =
  | 'weather'
  | 'scope_change'
  | 'design_change'
  | 'material_delay'
  | 'site_access'
  | 'community_issue'
  | 'regulatory_delay'
  | 'force_majeure'
  | 'client_instruction';

export type ExtensionStatus = 'pending' | 'approved' | 'partial' | 'rejected';

export const EXTENSION_REASON_LABELS: Record<ExtensionReason, string> = {
  weather: 'Adverse Weather',
  scope_change: 'Scope Change',
  design_change: 'Design Change',
  material_delay: 'Material Delay',
  site_access: 'Site Access Issues',
  community_issue: 'Community Issues',
  regulatory_delay: 'Regulatory Delay',
  force_majeure: 'Force Majeure',
  client_instruction: 'Client Instruction',
};

// ─────────────────────────────────────────────────────────────────
// TIMELINE EXTENSION
// ─────────────────────────────────────────────────────────────────

export interface TimelineExtension {
  id: string;
  requestDate: Date;
  requestedDays: number;
  approvedDays: number;
  reason: ExtensionReason;
  justification: string;
  supportingDocs?: string[];
  status: ExtensionStatus;
  approvalId?: string;
  approvedBy?: string;
  approvedAt?: Timestamp;
  newEndDate?: Date;
}

// ─────────────────────────────────────────────────────────────────
// PROJECT TIMELINE
// ─────────────────────────────────────────────────────────────────

export interface ProjectTimeline {
  // Original dates
  originalStartDate: Date;
  originalEndDate: Date;
  originalDuration: number;
  
  // Current dates (after extensions)
  currentStartDate: Date;
  currentEndDate: Date;
  currentDuration: number;
  
  // Actual dates
  actualStartDate?: Date;
  actualEndDate?: Date;
  
  // Status
  isDelayed: boolean;
  delayDays: number;
  daysRemaining: number;
  percentTimeElapsed: number;
  
  // Milestones
  milestones: ProjectMilestone[];
  
  // Extensions
  extensions: TimelineExtension[];
  totalExtensionDays: number;
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Calculate days between two dates
 */
export function calculateDaysBetween(start: Date, end: Date): number {
  const diffTime = new Date(end).getTime() - new Date(start).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Add days to a date
 */
export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Initialize project timeline
 */
export function initializeProjectTimeline(
  startDate: Date,
  endDate: Date
): ProjectTimeline {
  const duration = calculateDaysBetween(startDate, endDate);
  const daysRemaining = calculateDaysBetween(new Date(), endDate);
  
  return {
    originalStartDate: startDate,
    originalEndDate: endDate,
    originalDuration: duration,
    currentStartDate: startDate,
    currentEndDate: endDate,
    currentDuration: duration,
    isDelayed: false,
    delayDays: 0,
    daysRemaining: Math.max(0, daysRemaining),
    percentTimeElapsed: 0,
    milestones: generateDefaultMilestones(startDate, endDate),
    extensions: [],
    totalExtensionDays: 0,
  };
}

/**
 * Generate default milestones
 */
export function generateDefaultMilestones(
  startDate: Date,
  endDate: Date
): ProjectMilestone[] {
  const duration = calculateDaysBetween(startDate, endDate);
  
  return [
    {
      id: 'ms-1',
      name: 'Project Commencement',
      type: 'commencement',
      plannedDate: startDate,
      status: 'upcoming',
      isContractual: true,
      paymentLinked: true,
      paymentPercentage: 10,
    },
    {
      id: 'ms-2',
      name: 'Foundations Complete',
      type: 'foundations_complete',
      plannedDate: addDaysToDate(startDate, Math.floor(duration * 0.2)),
      status: 'upcoming',
      isContractual: true,
      paymentLinked: true,
      paymentPercentage: 20,
    },
    {
      id: 'ms-3',
      name: 'Structure Complete',
      type: 'structure_complete',
      plannedDate: addDaysToDate(startDate, Math.floor(duration * 0.5)),
      status: 'upcoming',
      isContractual: true,
      paymentLinked: true,
      paymentPercentage: 25,
    },
    {
      id: 'ms-4',
      name: 'Substantial Completion',
      type: 'substantial_completion',
      plannedDate: addDaysToDate(startDate, Math.floor(duration * 0.9)),
      status: 'upcoming',
      isContractual: true,
      paymentLinked: true,
      paymentPercentage: 35,
    },
    {
      id: 'ms-5',
      name: 'Final Handover',
      type: 'final_handover',
      plannedDate: endDate,
      status: 'upcoming',
      isContractual: true,
      paymentLinked: true,
      paymentPercentage: 10,
    },
  ];
}

/**
 * Update milestone status based on current date
 */
export function updateMilestoneStatus(milestone: ProjectMilestone): MilestoneStatus {
  if (milestone.actualDate) return 'completed';
  
  const now = new Date();
  const plannedDate = new Date(milestone.plannedDate);
  const daysDiff = calculateDaysBetween(now, plannedDate);
  
  if (daysDiff < 0) return 'overdue';
  if (daysDiff <= 7) return 'due';
  return 'upcoming';
}

/**
 * Calculate percent time elapsed
 */
export function calculatePercentTimeElapsed(
  startDate: Date,
  endDate: Date
): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.round((elapsed / totalDuration) * 100);
}

/**
 * Get milestone status color
 */
export function getMilestoneStatusColor(status: MilestoneStatus): string {
  const colorMap: Record<MilestoneStatus, string> = {
    upcoming: 'text-gray-600 bg-gray-100',
    due: 'text-yellow-600 bg-yellow-100',
    overdue: 'text-red-600 bg-red-100',
    completed: 'text-green-600 bg-green-100',
  };
  return colorMap[status];
}

/**
 * Get extension status color
 */
export function getExtensionStatusColor(status: ExtensionStatus): string {
  const colorMap: Record<ExtensionStatus, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    approved: 'text-green-600 bg-green-100',
    partial: 'text-blue-600 bg-blue-100',
    rejected: 'text-red-600 bg-red-100',
  };
  return colorMap[status];
}

/**
 * Get upcoming milestones
 */
export function getUpcomingMilestones(
  milestones: ProjectMilestone[],
  limit: number = 3
): ProjectMilestone[] {
  return milestones
    .filter(m => m.status !== 'completed')
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
    .slice(0, limit);
}

/**
 * Get overdue milestones
 */
export function getOverdueMilestones(
  milestones: ProjectMilestone[]
): ProjectMilestone[] {
  return milestones.filter(m => m.status === 'overdue');
}
