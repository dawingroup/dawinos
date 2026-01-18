/**
 * CORE PROJECT TYPES
 * =================================================================
 * This is the canonical definition for a "Project" within Dawin Advisory.
 * It consolidates types from the original Delivery and MatFlow modules
 * into a single source of truth.
 */

import { Timestamp } from 'firebase/firestore';
import { BOQDocument } from './boq.types'; // We will create this file next

// ─────────────────────────────────────────────────────────────────
// ENUMS & SHARED TYPES (from MatFlow)
// ─────────────────────────────────────────────────────────────────

export enum MeasurementUnit {
  METERS = 'm',
  CENTIMETERS = 'cm',
  MILLIMETERS = 'mm',
  SQUARE_METERS = 'm²',
  CUBIC_METERS = 'm³',
  LITERS = 'L',
  KILOGRAMS = 'kg',
  TONNES = 't',
  PIECES = 'pcs',
  BAGS = 'bags',
  LUMP_SUM = 'LS',
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
  MISCELLANEOUS = 'miscellaneous',
}

// ─────────────────────────────────────────────────────────────────
// PROJECT STATUS & TYPE (from Delivery)
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

export type ProjectType =
  | 'new_construction'
  | 'renovation'
  | 'expansion'
  | 'rehabilitation';

// ─────────────────────────────────────────────────────────────────
// SUB-TYPES (Consolidated)
// ─────────────────────────────────────────────────────────────────

export interface ProjectLocation {
  siteName: string;
  address?: string;
  district: string;
  region: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ProjectBudget {
  currency: 'UGX' | 'USD';
  totalBudget: number;
  spent: number;
  remaining: number;
  variance: number;
  varianceStatus: 'on_track' | 'over' | 'under';
  contingencyPercent: number;
}

export interface ProjectProgress {
  physicalProgress: number; // Percentage
  financialProgress: number; // Percentage
  completionPercent: number; // from MatFlow stages
}

export interface ProjectTimeline {
  plannedStartDate: Date;
  plannedEndDate: Date;
  currentStartDate: Date;
  currentEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  isDelayed: boolean;
  daysRemaining: number;
}

export interface ProjectMember {
  userId: string;
  email: string;
  displayName: string;
  role: 'quantity_surveyor' | 'site_engineer' | 'project_manager' | 'advisor';
  capabilities: string[];
}

export interface ProjectStage {
  id: string;
  name: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completionPercent: number;
}

export interface ProjectSettings {
  taxEnabled: boolean;
  taxRate: number;
  defaultWastagePercent: number;
}

// ─────────────────────────────────────────────────────────────────
// CANONICAL PROJECT ENTITY
// ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  
  // Core Identification
  name: string;
  projectCode: string;
  description?: string;
  
  // Relationships
  programId: string;
  engagementId: string;
  customerId?: string;
  customerName?: string;
  linkedDealId?: string;

  // Classification
  status: ProjectStatus;
  projectType: ProjectType;
  
  // Core Data Structures
  location: ProjectLocation;
  budget: ProjectBudget;
  progress: ProjectProgress;
  timeline: ProjectTimeline;
  settings: ProjectSettings;
  stages: ProjectStage[];
  members: ProjectMember[];
  
  // BOQ & Material Management
  // The full BOQ documents can be stored in a sub-collection.
  // We can store lightweight references here.
  boqIds: string[];
  activeBoqId?: string;
  
  // Metadata
  tags?: string[];
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;
}

// ─────────────────────────────────────────────────────────────────
// FORM & SUMMARY TYPES
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
  budgetCurrency: 'UGX' | 'USD';
  customerId?: string;
}

export interface ProjectSummary {
  id: string;
  projectCode: string;
  name:string;
  status: ProjectStatus;
  location: {
    siteName: string;
    region: string;
  };
  budget: {
    currency: string;
    total: number;
    spent: number;
    percentSpent: number;
  };
  progress: {
    physical: number;
    financial: number;
  };
  timeline: {
    endDate: Date;
    isDelayed: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS (Adapted from Delivery)
// ─────────────────────────────────────────────────────────────────

export function getProjectStatusColor(status: ProjectStatus): string {
  const colorMap: Record<ProjectStatus, string> = {
    planning: 'text-blue-600 bg-blue-100',
    procurement: 'text-purple-600 bg-purple-100',
    mobilization: 'text-indigo-600 bg-indigo-100',
    active: 'text-green-600 bg-green-100',
    substantial_completion: 'text-teal-600 bg-teal-100',
    defects_liability: 'text-cyan-600 bg-cyan-100',
    completed: 'text-gray-600 bg-gray-100',
    suspended: 'text-yellow-600 bg-yellow-100',
    cancelled: 'text-red-600 bg-red-100',
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
}

export function isProjectActive(project: Project): boolean {
  return ['mobilization', 'active', 'substantial_completion', 'defects_liability'].includes(
    project.status
  );
}

export function isProjectClosed(project: Project): boolean {
  return ['completed', 'cancelled'].includes(project.status);
}
