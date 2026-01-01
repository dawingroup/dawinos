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
  | 'procurement'
  | 'procurement-logistics'
  | 'procurement-customs'
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
 * Tax mode for estimates
 */
export type TaxMode = 'exclusive' | 'inclusive';

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
  subtotal: number;        // Before overhead and margin
  taxRate: number;         // e.g., 0.16 for 16%
  taxAmount: number;
  total: number;
  
  // Currency
  currency: string; // KES, USD, etc.
  
  // Overhead (applied to all items)
  overheadPercent?: number;
  overheadAmount?: number;
  
  // Margin (applied to all items)
  marginPercent?: number;
  marginAmount?: number;
  
  // Tax mode
  taxMode?: TaxMode; // 'inclusive' or 'exclusive' (default)
  
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
  defaultTaxRate: 0.18, // 18% VAT
  defaultMarginPercent: 0.45, // 45% margin
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
  procurement: 'Procured Items',
  'procurement-logistics': 'Logistics & Shipping',
  'procurement-customs': 'Customs & Duties',
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
