/**
 * Requisition Types
 * 
 * Types for material requisitions from projects.
 */

import { Timestamp } from 'firebase/firestore';
import type { BOQMoney as Money, BOQAuditFields as AuditFields } from './boq';

// ============================================================================
// REQUISITION
// ============================================================================

export interface Requisition {
  id: string;
  
  // Relationships
  projectId: string;
  projectName: string;
  engagementId: string;
  programId?: string;
  
  // Requisition info
  requisitionNumber: string;
  description: string;
  priority: RequisitionPriority;
  requiredDate: Timestamp;
  
  // Items
  items: RequisitionItem[];
  
  // Totals
  totalItems: number;
  totalEstimatedCost: Money;
  totalApprovedCost?: Money;
  
  // Status
  status: RequisitionStatus;
  
  // Workflow
  workflow: RequisitionWorkflow;
  
  // Procurement link
  purchaseOrderIds?: string[];
  
  // Audit
  audit: AuditFields;
}

export type RequisitionPriority = 'low' | 'normal' | 'high' | 'urgent';

export type RequisitionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled';

export interface RequisitionWorkflow {
  // Submission
  submittedBy?: string;
  submittedAt?: Timestamp;
  
  // Technical review
  technicalReviewedBy?: string;
  technicalReviewedAt?: Timestamp;
  technicalApproved?: boolean;
  technicalNotes?: string;
  
  // Budget review
  budgetReviewedBy?: string;
  budgetReviewedAt?: Timestamp;
  budgetApproved?: boolean;
  budgetNotes?: string;
  
  // Final approval
  approvedBy?: string;
  approvedAt?: Timestamp;
  approvalNotes?: string;
  
  // Rejection
  rejectedBy?: string;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
}

// ============================================================================
// REQUISITION ITEM
// ============================================================================

export interface RequisitionItem {
  id: string;
  requisitionId: string;
  
  // Item info
  lineNumber: number;
  description: string;
  
  // Material reference
  materialId?: string;
  materialCode?: string;
  materialName?: string;
  
  // BOQ reference
  boqItemId?: string;
  boqItemNumber?: string;
  
  // Quantity
  requestedQuantity: number;
  approvedQuantity?: number;
  unit: string;
  
  // Pricing
  estimatedRate: Money;
  estimatedAmount: Money;
  approvedRate?: Money;
  approvedAmount?: Money;
  
  // Specifications
  specifications?: string;
  technicalRequirements?: string;
  
  // Suggestions
  suggestedSuppliers?: string[];
  
  // Status
  status: RequisitionItemStatus;
  fulfilledQuantity: number;
  
  // Notes
  notes?: string;
}

export type RequisitionItemStatus =
  | 'pending'
  | 'approved'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'rejected';

// ============================================================================
// REQUISITION TEMPLATE
// ============================================================================

export interface RequisitionTemplate {
  id: string;
  
  // Template info
  name: string;
  description?: string;
  category: string;
  
  // Template items
  items: Omit<RequisitionItem, 'id' | 'requisitionId' | 'status' | 'fulfilledQuantity'>[];
  
  // Usage
  usageCount: number;
  lastUsedAt?: Timestamp;
  
  // Audit
  audit: AuditFields;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateRequisitionInput {
  projectId: string;
  projectName: string;
  engagementId: string;
  programId?: string;
  description: string;
  priority: RequisitionPriority;
  requiredDate: Timestamp;
}

export interface CreateRequisitionItemInput {
  description: string;
  materialId?: string;
  materialCode?: string;
  materialName?: string;
  boqItemId?: string;
  boqItemNumber?: string;
  requestedQuantity: number;
  unit: string;
  estimatedRate: Money;
  specifications?: string;
  technicalRequirements?: string;
  suggestedSuppliers?: string[];
  notes?: string;
}
