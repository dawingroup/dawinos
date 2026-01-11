// ============================================================================
// STRATEGY TYPES - DawinOS CEO Strategy Command
// TypeScript interfaces for strategy document management
// ============================================================================

import { Timestamp } from 'firebase/firestore';
import {
  StrategyDocumentType,
  StrategyDocumentStatus,
  StrategyScope,
  TimeHorizon,
  PillarCategory,
  PillarStatus,
  ReviewFrequency,
  StrategyApprovalLevel,
  ObjectivePriority,
  ObjectiveStatus,
  RiskLikelihood,
  RiskImpact,
  RiskStatus,
  AlignmentEntityType,
  AlignmentStrength,
  MetricDirection,
} from '../constants/strategy.constants';

// ----------------------------------------------------------------------------
// Strategy Document
// ----------------------------------------------------------------------------
export interface StrategyDocument {
  id: string;
  companyId: string;
  type: StrategyDocumentType;
  title: string;
  subtitle?: string;
  description?: string;
  status: StrategyDocumentStatus;
  scope: StrategyScope;
  scopeEntityId?: string;
  scopeEntityName?: string;
  timeHorizon: TimeHorizon;
  effectiveFrom: Timestamp;
  effectiveTo?: Timestamp;
  fiscalYear?: string;
  quarter?: number;
  content: StrategyDocumentContent;
  pillars: StrategicPillar[];
  parentDocumentId?: string;
  linkedDocumentIds: string[];
  approvalLevel: StrategyApprovalLevel;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Timestamp;
  reviewFrequency: ReviewFrequency;
  nextReviewDate?: Timestamp;
  lastReviewDate?: Timestamp;
  version: number;
  previousVersionId?: string;
  changeLog?: string;
  tags: string[];
  attachments: StrategyAttachment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  createdByName?: string;
  updatedBy: string;
  updatedByName?: string;
}

// ----------------------------------------------------------------------------
// Strategy Document Content
// ----------------------------------------------------------------------------
export interface StrategyDocumentContent {
  summary?: string;
  vision?: string;
  mission?: string;
  values?: string[];
  context?: string;
  assumptions?: string[];
  risks?: StrategyRisk[];
  dependencies?: string[];
  successCriteria?: string[];
  richContent?: string;
}

// ----------------------------------------------------------------------------
// Strategic Pillar
// ----------------------------------------------------------------------------
export interface StrategicPillar {
  id: string;
  category: PillarCategory;
  name: string;
  description?: string;
  weight: number;
  order: number;
  objectives: StrategicObjective[];
  metrics: PillarMetric[];
  owner?: PillarOwner;
  status: PillarStatus;
  progress: number;
  color?: string;
}

export interface PillarOwner {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
}

// ----------------------------------------------------------------------------
// Strategic Objective
// ----------------------------------------------------------------------------
export interface StrategicObjective {
  id: string;
  pillarId: string;
  title: string;
  description?: string;
  targetDate?: Timestamp;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
  progress: number;
  linkedOKRIds: string[];
  linkedKPIIds: string[];
  notes?: string;
  assigneeId?: string;
  assigneeName?: string;
}

// ----------------------------------------------------------------------------
// Pillar Metric
// ----------------------------------------------------------------------------
export interface PillarMetric {
  id: string;
  name: string;
  description?: string;
  targetValue: number;
  currentValue?: number;
  baselineValue?: number;
  unit: string;
  direction: MetricDirection;
  source?: string;
  lastUpdatedAt?: Timestamp;
}

// ----------------------------------------------------------------------------
// Strategy Risk
// ----------------------------------------------------------------------------
export interface StrategyRisk {
  id: string;
  description: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  mitigation?: string;
  owner?: string;
  ownerName?: string;
  status: RiskStatus;
  identifiedAt?: Timestamp;
  mitigatedAt?: Timestamp;
}

// ----------------------------------------------------------------------------
// Strategy Attachment
// ----------------------------------------------------------------------------
export interface StrategyAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
  uploadedByName?: string;
}

// ----------------------------------------------------------------------------
// Strategy Version
// ----------------------------------------------------------------------------
export interface StrategyVersion {
  id: string;
  documentId: string;
  version: number;
  title: string;
  content: StrategyDocumentContent;
  pillars: StrategicPillar[];
  changeLog: string;
  changedBy: string;
  changedByName?: string;
  changedAt: Timestamp;
  snapshot: Partial<StrategyDocument>;
}

// ----------------------------------------------------------------------------
// Strategy Alignment
// ----------------------------------------------------------------------------
export interface StrategyAlignment {
  id: string;
  companyId: string;
  strategyDocumentId: string;
  strategyDocumentTitle?: string;
  pillarId: string;
  pillarName?: string;
  objectiveId?: string;
  objectiveTitle?: string;
  alignedEntityType: AlignmentEntityType;
  alignedEntityId: string;
  alignedEntityName: string;
  alignmentStrength: AlignmentStrength;
  contributionDescription?: string;
  createdAt: Timestamp;
  createdBy: string;
  createdByName?: string;
}

// ----------------------------------------------------------------------------
// Strategy Review
// ----------------------------------------------------------------------------
export interface StrategyReview {
  id: string;
  documentId: string;
  documentTitle?: string;
  reviewDate: Timestamp;
  reviewedBy: string[];
  reviewerNames?: string[];
  summary: string;
  pillarUpdates: PillarUpdate[];
  recommendations: string[];
  decisions?: string[];
  nextReviewDate: Timestamp;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  createdBy: string;
}

export interface PillarUpdate {
  pillarId: string;
  pillarName: string;
  previousStatus: PillarStatus;
  newStatus: PillarStatus;
  previousProgress: number;
  newProgress: number;
  comments: string;
}

// ----------------------------------------------------------------------------
// Strategy Summary (For Dashboards)
// ----------------------------------------------------------------------------
export interface StrategySummary {
  documentId: string;
  title: string;
  type: StrategyDocumentType;
  status: StrategyDocumentStatus;
  scope: StrategyScope;
  scopeEntityName?: string;
  overallProgress: number;
  pillarSummaries: PillarSummary[];
  upcomingMilestones: MilestoneSummary[];
  risksAtRisk: number;
  objectivesTotal: number;
  objectivesCompleted: number;
  lastReviewDate?: Timestamp;
  nextReviewDate?: Timestamp;
  daysUntilReview?: number;
}

export interface PillarSummary {
  pillarId: string;
  name: string;
  category: PillarCategory;
  weight: number;
  progress: number;
  status: PillarStatus;
  objectivesTotal: number;
  objectivesCompleted: number;
}

export interface MilestoneSummary {
  objectiveId: string;
  pillarId: string;
  title: string;
  targetDate: Timestamp;
  daysRemaining: number;
  priority: ObjectivePriority;
  status: ObjectiveStatus;
}

// ----------------------------------------------------------------------------
// Form Input Types
// ----------------------------------------------------------------------------
export interface CreateStrategyDocumentInput {
  type: StrategyDocumentType;
  title: string;
  subtitle?: string;
  description?: string;
  scope: StrategyScope;
  scopeEntityId?: string;
  scopeEntityName?: string;
  timeHorizon: TimeHorizon;
  effectiveFrom: Date;
  effectiveTo?: Date;
  fiscalYear?: string;
  quarter?: number;
  content?: Partial<StrategyDocumentContent>;
  pillars?: CreatePillarInput[];
  approvalLevel: StrategyApprovalLevel;
  reviewFrequency: ReviewFrequency;
  parentDocumentId?: string;
  tags?: string[];
}

export interface UpdateStrategyDocumentInput {
  title?: string;
  subtitle?: string;
  description?: string;
  status?: StrategyDocumentStatus;
  timeHorizon?: TimeHorizon;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  content?: Partial<StrategyDocumentContent>;
  approvalLevel?: StrategyApprovalLevel;
  reviewFrequency?: ReviewFrequency;
  nextReviewDate?: Date;
  tags?: string[];
  changeLog?: string;
}

export interface CreatePillarInput {
  category: PillarCategory;
  name: string;
  description?: string;
  weight: number;
  ownerId?: string;
  ownerName?: string;
  color?: string;
}

export interface UpdatePillarInput {
  category?: PillarCategory;
  name?: string;
  description?: string;
  weight?: number;
  status?: PillarStatus;
  progress?: number;
  ownerId?: string;
  ownerName?: string;
  color?: string;
}

export interface CreateObjectiveInput {
  pillarId: string;
  title: string;
  description?: string;
  targetDate?: Date;
  priority: ObjectivePriority;
  assigneeId?: string;
  assigneeName?: string;
}

export interface UpdateObjectiveInput {
  title?: string;
  description?: string;
  targetDate?: Date;
  priority?: ObjectivePriority;
  status?: ObjectiveStatus;
  progress?: number;
  linkedOKRIds?: string[];
  linkedKPIIds?: string[];
  notes?: string;
  assigneeId?: string;
  assigneeName?: string;
}

export interface CreateMetricInput {
  pillarId: string;
  name: string;
  description?: string;
  targetValue: number;
  baselineValue?: number;
  unit: string;
  direction: MetricDirection;
  source?: string;
}

export interface UpdateMetricInput {
  name?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  direction?: MetricDirection;
  source?: string;
}

export interface CreateRiskInput {
  description: string;
  likelihood: RiskLikelihood;
  impact: RiskImpact;
  mitigation?: string;
  owner?: string;
  ownerName?: string;
}

export interface UpdateRiskInput {
  description?: string;
  likelihood?: RiskLikelihood;
  impact?: RiskImpact;
  mitigation?: string;
  owner?: string;
  ownerName?: string;
  status?: RiskStatus;
}

export interface CreateAlignmentInput {
  strategyDocumentId: string;
  pillarId: string;
  objectiveId?: string;
  alignedEntityType: AlignmentEntityType;
  alignedEntityId: string;
  alignedEntityName: string;
  alignmentStrength: AlignmentStrength;
  contributionDescription?: string;
}

export interface CreateReviewInput {
  documentId: string;
  reviewDate: Date;
  reviewedBy: string[];
  summary: string;
  pillarUpdates: Omit<PillarUpdate, 'pillarName'>[];
  recommendations: string[];
  decisions?: string[];
  nextReviewDate: Date;
  notes?: string;
}

// ----------------------------------------------------------------------------
// Filter Types
// ----------------------------------------------------------------------------
export interface StrategyDocumentFilters {
  type?: StrategyDocumentType;
  status?: StrategyDocumentStatus;
  scope?: StrategyScope;
  scopeEntityId?: string;
  fiscalYear?: string;
  timeHorizon?: TimeHorizon;
  approvalLevel?: StrategyApprovalLevel;
  activeOnly?: boolean;
  parentDocumentId?: string;
  tags?: string[];
  createdBy?: string;
  searchQuery?: string;
}

export interface AlignmentFilters {
  strategyDocumentId?: string;
  pillarId?: string;
  objectiveId?: string;
  alignedEntityType?: AlignmentEntityType;
  alignedEntityId?: string;
  alignmentStrength?: AlignmentStrength;
}

// ----------------------------------------------------------------------------
// Hierarchy Types
// ----------------------------------------------------------------------------
export interface StrategyHierarchy {
  groupStrategy?: StrategyDocument;
  subsidiaryStrategies: StrategyDocument[];
  departmentStrategies: StrategyDocument[];
  teamStrategies: StrategyDocument[];
}

export interface StrategyTreeNode {
  document: StrategyDocument;
  children: StrategyTreeNode[];
  level: number;
  alignmentCount: number;
}
