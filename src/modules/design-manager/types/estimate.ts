/**
 * Consolidated Estimate Types
 * Project-level cost estimation from cutlist and materials
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Line item categories
 */
export type EstimateLineItemCategory = 
  | 'material'
  | 'labor'
  | 'hardware'
  | 'finishing'
  | 'outsourcing'
  | 'overhead'
  | 'other';

/**
 * Estimate line item
 */
export interface EstimateLineItem {
  id: string;
  description: string;
  category: EstimateLineItemCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  
  // Optional linking
  linkedMaterialId?: string;
  linkedDesignItemId?: string;
  
  // Notes
  notes?: string;
  
  // Editable flag
  isManual?: boolean;
}

/**
 * Consolidated Estimate for a project
 */
export interface ConsolidatedEstimate {
  generatedAt: Timestamp;
  generatedBy: string;
  
  // Stale tracking
  isStale: boolean;
  staleReason?: string;
  lastCutlistUpdate?: Timestamp;
  
  // Line items
  lineItems: EstimateLineItem[];
  
  // Totals
  subtotal: number;
  taxRate: number; // e.g., 0.16 for 16%
  taxAmount: number;
  total: number;
  
  // Currency
  currency: string; // KES, USD, etc.
  
  // Margin
  marginPercent?: number;
  marginAmount?: number;
  
  // External sync
  quickbooksInvoiceId?: string;
  quickbooksInvoiceNumber?: string;
  syncedAt?: Timestamp;
}

/**
 * Estimate configuration
 */
export interface EstimateConfig {
  laborRatePerHour: number;
  laborMinutesPerPart: number;
  defaultTaxRate: number;
  defaultMarginPercent: number;
  currency: string;
  overheadPercent: number;
}

/**
 * Default estimate configuration
 */
export const DEFAULT_ESTIMATE_CONFIG: EstimateConfig = {
  laborRatePerHour: 500, // KES
  laborMinutesPerPart: 15, // 15 min per part average
  defaultTaxRate: 0.16, // 16% VAT
  defaultMarginPercent: 0.25, // 25% margin
  currency: 'UGX',
  overheadPercent: 0.10, // 10% overhead
};

/**
 * Estimate line item category labels
 */
export const ESTIMATE_CATEGORY_LABELS: Record<EstimateLineItemCategory, string> = {
  material: 'Materials',
  labor: 'Labor',
  hardware: 'Hardware',
  finishing: 'Finishing',
  outsourcing: 'Outsourcing',
  overhead: 'Overhead',
  other: 'Other',
};

/**
 * Form data for manual line items
 */
export interface EstimateLineItemFormData {
  description: string;
  category: EstimateLineItemCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes?: string;
}
