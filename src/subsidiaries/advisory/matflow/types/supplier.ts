/**
 * Supplier Types
 * 
 * Types for supplier management and vendor relationships.
 */

import { Timestamp } from 'firebase/firestore';
import type { BOQMoney as Money, BOQAuditFields as AuditFields } from './boq';

// ============================================================================
// SUPPLIER
// ============================================================================

export interface Supplier {
  id: string;
  
  // Basic info
  code: string;
  name: string;
  tradeName?: string;
  
  // Contact
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  website?: string;
  
  // Address
  address: SupplierAddress;
  
  // Business info
  registrationNumber?: string;
  taxId?: string;
  bankDetails?: BankDetails;
  
  // Categories
  categories: string[];
  materials: string[]; // Material IDs they supply
  
  // Performance
  rating?: number;
  totalOrders: number;
  totalValue: Money;
  onTimeDeliveryRate?: number;
  qualityScore?: number;
  
  // Terms
  paymentTerms?: string;
  creditLimit?: Money;
  currentBalance?: Money;
  
  // Status
  status: SupplierStatus;
  
  // Documents
  documents?: SupplierDocument[];
  
  // Audit
  audit: AuditFields;
}

export type SupplierStatus = 'active' | 'inactive' | 'blacklisted' | 'pending_approval';

export interface SupplierAddress {
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  country: string;
  postalCode?: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swiftCode?: string;
  branchCode?: string;
}

export interface SupplierDocument {
  id: string;
  type: 'registration' | 'tax_cert' | 'quality_cert' | 'insurance' | 'contract' | 'other';
  name: string;
  url: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
  expiryDate?: Timestamp;
}

// ============================================================================
// SUPPLIER RATING
// ============================================================================

export interface SupplierRating {
  id: string;
  supplierId: string;
  
  // Rating details
  overallRating: number; // 1-5
  
  qualityRating: number;
  deliveryRating: number;
  priceRating: number;
  serviceRating: number;
  
  // Context
  projectId?: string;
  purchaseOrderId?: string;
  
  // Feedback
  comments?: string;
  wouldRecommend: boolean;
  
  // Audit
  ratedBy: string;
  ratedAt: Timestamp;
}

// ============================================================================
// SUPPLIER QUOTATION
// ============================================================================

export interface SupplierQuotation {
  id: string;
  supplierId: string;
  supplierName: string;
  
  // Request reference
  rfqId?: string;
  projectId?: string;
  
  // Quotation info
  quotationNumber: string;
  quotationDate: Timestamp;
  validUntil: Timestamp;
  
  // Items
  items: QuotationItem[];
  
  // Totals
  subtotal: Money;
  taxAmount: Money;
  totalAmount: Money;
  currency: string;
  
  // Terms
  paymentTerms: string;
  deliveryTerms: string;
  leadTimeDays: number;
  
  // Status
  status: 'received' | 'under_review' | 'accepted' | 'rejected' | 'expired';
  
  // Documents
  quotationDocUrl?: string;
  
  // Notes
  notes?: string;
  rejectionReason?: string;
  
  // Audit
  audit: AuditFields;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  
  // Item info
  description: string;
  materialId?: string;
  materialCode?: string;
  
  // Quantity
  quantity: number;
  unit: string;
  
  // Pricing
  unitRate: Money;
  amount: Money;
  
  // Specs
  specifications?: string;
  brand?: string;
  origin?: string;
  
  // Availability
  inStock: boolean;
  leadTimeDays?: number;
}

// ============================================================================
// REQUEST FOR QUOTATION (RFQ)
// ============================================================================

export interface RequestForQuotation {
  id: string;
  
  // RFQ info
  rfqNumber: string;
  title: string;
  description?: string;
  
  // Project reference
  projectId?: string;
  projectName?: string;
  requisitionId?: string;
  
  // Items requested
  items: RFQItem[];
  
  // Suppliers invited
  invitedSuppliers: string[];
  quotationsReceived: string[];
  
  // Timeline
  issueDate: Timestamp;
  closingDate: Timestamp;
  
  // Status
  status: 'draft' | 'issued' | 'closed' | 'awarded' | 'cancelled';
  
  // Award
  awardedSupplierId?: string;
  awardedQuotationId?: string;
  awardedAt?: Timestamp;
  awardedBy?: string;
  
  // Audit
  audit: AuditFields;
}

export interface RFQItem {
  id: string;
  
  // Item info
  description: string;
  materialId?: string;
  materialCode?: string;
  
  // Quantity
  quantity: number;
  unit: string;
  
  // Requirements
  specifications?: string;
  technicalRequirements?: string;
  requiredDeliveryDate?: Timestamp;
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateSupplierInput {
  code?: string;
  name?: string;
  tradeName?: string;
  contactPerson?: string;
  email?: string;
  phone: string; // Only phone is mandatory
  address?: SupplierAddress;
  categories?: string[];
  paymentTerms?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  tradeName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  address?: Partial<SupplierAddress>;
  categories?: string[];
  paymentTerms?: string;
  status?: SupplierStatus;
}

export interface CreateQuotationInput {
  supplierId: string;
  rfqId?: string;
  projectId?: string;
  quotationNumber: string;
  quotationDate: Timestamp;
  validUntil: Timestamp;
  items: Omit<QuotationItem, 'id' | 'quotationId'>[];
  paymentTerms: string;
  deliveryTerms: string;
  leadTimeDays: number;
  quotationDocUrl?: string;
  notes?: string;
}
