/**
 * Client Portal Types
 * Types for client-facing quotes and procurement approvals
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Client quote status
 */
export type ClientQuoteStatus = 
  | 'draft'           // Not yet shared with client
  | 'sent'            // Sent to client, awaiting response
  | 'viewed'          // Client has viewed the quote
  | 'approved'        // Client approved the quote
  | 'rejected'        // Client rejected the quote
  | 'revision'        // Client requested changes
  | 'expired';        // Quote validity expired

/**
 * Procurement approval status
 */
export type ProcurementApprovalStatus = 
  | 'pending'         // Awaiting client decision
  | 'approved'        // Client approved procurement
  | 'rejected'        // Client rejected procurement
  | 'revision';       // Client requested changes

/**
 * Procurement item for client approval
 */
export interface ClientProcurementItem {
  id: string;
  designItemId: string;
  designItemName: string;
  
  // Item details
  name: string;
  description?: string;
  category: string;
  quantity: number;
  
  // Pricing (in target currency)
  unitCost: number;
  totalCost: number;
  currency: string;
  
  // Source info
  vendor?: string;
  leadTime?: string;
  
  // Reference
  referenceImageUrl?: string;
  specificationUrl?: string;
  
  // Approval
  status: ProcurementApprovalStatus;
  clientNotes?: string;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  revisionRequestedAt?: Timestamp;
}

/**
 * Tax rate options for quote line items
 */
export type QuoteTaxRateId = 'no_vat' | 'standard_vat' | 'exempt';

/**
 * Client quote line item (mirrors EstimateLineItem structure)
 * Each design item becomes a separate line item (not aggregated)
 */
export interface ClientQuoteLineItem {
  id: string;
  description: string;
  category: 'material' | 'labor' | 'hardware' | 'finishing' | 'outsourcing' | 
            'overhead' | 'procurement' | 'procurement-logistics' | 'procurement-customs' | 'other';
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // Discount
  discountPercent?: number;
  discountAmount?: number;
  
  // Tax
  taxRateId?: QuoteTaxRateId;
  taxAmount?: number;
  
  // Linking to design items
  linkedDesignItemId?: string;
  linkedDesignItemName?: string;
  linkedMaterialId?: string;
  
  // Notes (cost breakdown info)
  notes?: string;
  
  // Manual item flag
  isManual?: boolean;
}

/**
 * Client quote document
 */
export interface ClientQuote {
  id: string;
  
  // Project reference
  projectId: string;
  projectCode: string;
  projectName: string;
  
  // Customer reference
  customerId: string;
  customerName: string;
  customerEmail?: string;
  
  // Quote details
  quoteNumber: string;          // e.g., "QT-2024-001"
  title: string;
  description?: string;
  
  // Status
  status: ClientQuoteStatus;
  
  // Line items (simplified for client view)
  lineItems: ClientQuoteLineItem[];
  
  // Procurement items needing approval
  procurementItems: ClientProcurementItem[];
  
  // Pricing
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  
  // Overhead and Margin (from estimate)
  overheadPercent?: number;
  overheadAmount?: number;
  marginPercent?: number;
  marginAmount?: number;
  
  // Total discount
  totalDiscount?: number;
  
  // Validity
  validUntil: Timestamp;
  
  // Payment terms
  paymentTerms?: string;
  depositRequired?: number;     // Percentage or fixed amount
  depositType?: 'percentage' | 'fixed';
  
  // Access
  accessToken: string;          // Secure token for client access
  accessUrl?: string;           // Full URL for client portal
  
  // Timestamps
  createdAt: Timestamp;
  createdBy: string;
  sentAt?: Timestamp;
  viewedAt?: Timestamp;
  respondedAt?: Timestamp;
  
  // Client response
  clientResponse?: {
    status: 'approved' | 'rejected' | 'revision';
    notes?: string;
    respondedAt: Timestamp;
    respondedBy?: string;       // Client name/email
    signature?: string;         // Base64 signature if required
  };
  
  // Internal notes (not shown to client)
  internalNotes?: string;
  
  // Version tracking
  version: number;
  previousVersionId?: string;
}

/**
 * Client quote form data for creation
 */
export interface ClientQuoteFormData {
  projectId: string;
  customerId: string;
  title: string;
  description?: string;
  validityDays: number;
  paymentTerms?: string;
  depositRequired?: number;
  depositType?: 'percentage' | 'fixed';
  internalNotes?: string;
}

/**
 * Client portal view data (public-facing)
 */
export interface ClientPortalData {
  quote: Omit<ClientQuote, 'accessToken' | 'internalNotes'>;
  companyInfo: {
    name: string;
    logo?: string;
    logoUrl?: string;           // URL to logo from organization settings
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  canApprove: boolean;          // Whether approval actions are available
  isExpired: boolean;
}

/**
 * Client approval response
 */
export interface ClientApprovalResponse {
  quoteId: string;
  action: 'approve' | 'reject' | 'revision';
  notes?: string;
  signature?: string;
  procurementApprovals?: Array<{
    itemId: string;
    status: ProcurementApprovalStatus;
    notes?: string;
  }>;
}

/**
 * Quote activity log entry
 */
export interface QuoteActivityEntry {
  id: string;
  quoteId: string;
  action: 'created' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'revision' | 'updated' | 'expired';
  timestamp: Timestamp;
  performedBy?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================================================
// CLIENT PORTAL MESSAGING
// ============================================================================

/**
 * Message sender type
 */
export type MessageSenderType = 'client' | 'team';

/**
 * Message context - what the message relates to
 */
export type MessageContext = 
  | 'quote'
  | 'deliverable'
  | 'approval'
  | 'general'
  | 'payment';

/**
 * Client portal message
 */
export interface ClientPortalMessage {
  id: string;
  projectId: string;
  quoteId?: string;
  
  // Sender info
  senderType: MessageSenderType;
  senderName: string;
  senderEmail?: string;
  senderId?: string; // User ID for team members
  
  // Message content
  subject?: string;
  content: string;
  
  // Context
  context: MessageContext;
  contextId?: string; // ID of related quote/deliverable/approval
  
  // Attachments
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  
  // Status
  isRead: boolean;
  readAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
}

// ============================================================================
// DELIVERABLES & PLANS
// ============================================================================

/**
 * Deliverable type
 */
export type DeliverableType = 
  | 'drawing'           // 2D drawings/plans
  | 'model'             // 3D models (SketchUp, etc.)
  | 'specification'     // Spec documents
  | 'cutlist'           // Cut lists
  | 'bom'               // Bill of materials
  | 'render'            // 3D renders/visualizations
  | 'other';

/**
 * Deliverable status
 */
export type DeliverableStatus = 
  | 'draft'             // Work in progress
  | 'pending_payment'   // Ready but awaiting payment
  | 'available'         // Available for download
  | 'downloaded'        // Client has downloaded
  | 'superseded';       // Replaced by newer version

/**
 * Project deliverable
 */
export interface ProjectDeliverable {
  id: string;
  projectId: string;
  quoteId?: string;
  
  // Deliverable info
  name: string;
  description?: string;
  type: DeliverableType;
  version: number;
  
  // File info
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  
  // 3D Model specific (SketchUp)
  sketchupModelId?: string;
  sketchupViewerUrl?: string;
  thumbnailUrl?: string;
  
  // Access control
  status: DeliverableStatus;
  requiresPayment: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  
  // Approval
  requiresApproval?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'revision';
  approvedAt?: Timestamp;
  approvedBy?: string;
  approvalNotes?: string;
  
  // Download tracking
  downloadCount: number;
  lastDownloadedAt?: Timestamp;
  lastDownloadedBy?: string;
  
  // Timestamps
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  
  // Version history
  previousVersionId?: string;
}

// ============================================================================
// APPROVAL ITEMS (Materials, Standard Parts, Special Parts)
// ============================================================================

/**
 * Approval item type
 */
export type ApprovalItemType =
  | 'material'          // Sheet materials, etc.
  | 'standard_part'     // Standard parts from Katana
  | 'special_part'      // Special/custom parts
  | 'procurement'       // Procured items
  | 'design_change'     // Design modifications
  | 'design_option';    // Design options with inspirations

/**
 * Approval item status
 */
export type ApprovalItemStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision'
  | 'superseded';

/**
 * Item for client approval
 */
export interface ClientApprovalItem {
  id: string;
  projectId: string;
  quoteId?: string;
  designItemId?: string;
  designItemName?: string;
  
  // Item type and info
  type: ApprovalItemType;
  name: string;
  description?: string;
  sku?: string;
  
  // Quantity and pricing
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  currency: string;
  
  // Material specific
  material?: {
    species?: string;
    grade?: string;
    thickness?: string;
    finish?: string;
  };
  
  // Part specific
  part?: {
    category?: string;
    manufacturer?: string;
    partNumber?: string;
    specifications?: Record<string, string>;
  };
  
  // Vendor/sourcing
  vendor?: string;
  leadTime?: string;
  
  // References
  imageUrl?: string;
  specificationUrl?: string;
  alternativeOptions?: Array<{
    id: string;
    name: string;
    description?: string;
    unitCost: number;
    imageUrl?: string;
  }>;

  // Design option specific fields
  designOption?: {
    category: string;
    inspirations: Array<{
      id: string;
      clipId?: string;
      imageUrl: string;
      thumbnailUrl?: string;
      title: string;
      description?: string;
      sourceUrl?: string;
    }>;
    isRecommended?: boolean;
    comparisonNotes?: string;
  };
  /** Whether this is part of an option group */
  isOptionGroup?: boolean;
  /** Source design option ID */
  sourceOptionId?: string;
  /** Source option group ID */
  sourceGroupId?: string;

  // Approval workflow
  status: ApprovalItemStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: Timestamp;
  
  // Client response
  clientResponse?: {
    status: ApprovalItemStatus;
    selectedAlternativeId?: string;
    notes?: string;
    respondedAt: Timestamp;
    respondedBy?: string;
  };
  
  // Team notes
  internalNotes?: string;
  
  // Timestamps
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
}

// ============================================================================
// PAYMENTS
// ============================================================================

/**
 * Payment status
 */
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

/**
 * Payment method
 */
export type PaymentMethod = 
  | 'bank_transfer'
  | 'mtn_momo'
  | 'airtel_money'
  | 'pesapal'
  | 'cash'
  | 'other';

/**
 * Payment record
 */
export interface ClientPayment {
  id: string;
  projectId: string;
  quoteId: string;
  
  // Payment details
  amount: number;
  currency: string;
  method: PaymentMethod;
  
  // Status
  status: PaymentStatus;
  
  // Reference
  reference?: string;
  transactionId?: string;
  
  // For what
  paymentType: 'deposit' | 'milestone' | 'final' | 'deliverable';
  description?: string;
  
  // Related deliverables unlocked by this payment
  unlockedDeliverableIds?: string[];
  
  // Timestamps
  createdAt: Timestamp;
  paidAt?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  
  // Receipt
  receiptUrl?: string;
}

// ============================================================================
// SKETCHUP INTEGRATION
// ============================================================================

/**
 * SketchUp model for client viewing
 */
export interface SketchUpModel {
  id: string;
  projectId: string;
  designItemId?: string;
  
  // Model info
  name: string;
  description?: string;
  version: number;
  
  // SketchUp Viewer API
  modelFileUrl: string;        // .skp file URL
  viewerEmbedUrl?: string;     // Embedded viewer URL
  thumbnailUrl?: string;
  
  // Scene/view presets
  scenes?: Array<{
    id: string;
    name: string;
    description?: string;
    thumbnailUrl?: string;
  }>;
  
  // Annotations/callouts
  annotations?: Array<{
    id: string;
    position: { x: number; y: number; z: number };
    label: string;
    description?: string;
    linkedApprovalItemId?: string;
  }>;
  
  // Access
  isPublic: boolean;
  accessToken?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// ============================================================================
// EXTENDED CLIENT PORTAL DATA
// ============================================================================

/**
 * Extended client portal view data
 */
export interface ExtendedClientPortalData extends ClientPortalData {
  // Messaging
  messages: ClientPortalMessage[];
  unreadMessageCount: number;
  
  // Deliverables
  deliverables: ProjectDeliverable[];
  
  // Approval items
  approvalItems: ClientApprovalItem[];
  pendingApprovalCount: number;
  
  // Payments
  payments: ClientPayment[];
  totalPaid: number;
  balanceDue: number;
  
  // 3D Models
  sketchupModels: SketchUpModel[];
  
  // Project progress
  projectProgress?: {
    phase: string;
    percentComplete: number;
    nextMilestone?: string;
    estimatedCompletion?: Timestamp;
  };
}
