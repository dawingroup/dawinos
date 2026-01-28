/**
 * Deliverables Type System
 * New unified type system for Design Manager deliverables
 */

import type { Timestamp } from '@/shared/types';
import type { DesignStage } from './index';

// ============================================
// Deliverable Sourcing Types
// ============================================

/**
 * Deliverable sourcing/production types
 * Maps to different workflows and detail pages
 */
export type DeliverableSourcingType =
  | 'CUSTOM_FURNITURE_MILLWORK'  // In-house production (replaces MANUFACTURED)
  | 'PROCURED'                    // External sourcing (unchanged)
  | 'DESIGN_DOCUMENT'             // Design documents (replaces ARCHITECTURAL)
  | 'CONSTRUCTION';               // Electricals, tiling, painting, gypsum, fitout

/**
 * Legacy sourcing type values (for backward compatibility)
 */
export type LegacySourcingType = 'MANUFACTURED' | 'PROCURED' | 'ARCHITECTURAL';

/**
 * Legacy to new type mapping
 * Used for normalizing legacy data at read time
 */
export const LEGACY_SOURCING_MAP: Record<string, DeliverableSourcingType> = {
  'MANUFACTURED': 'CUSTOM_FURNITURE_MILLWORK',
  'ARCHITECTURAL': 'DESIGN_DOCUMENT',
  'PROCURED': 'PROCURED',
};

/**
 * Normalize a sourcing type value (handles legacy values)
 */
export function normalizeSourcingType(
  value?: string | null
): DeliverableSourcingType {
  if (!value) return 'CUSTOM_FURNITURE_MILLWORK';

  // Check if it's a legacy value
  if (value in LEGACY_SOURCING_MAP) {
    return LEGACY_SOURCING_MAP[value];
  }

  // Return as-is if it's already a new type
  return value as DeliverableSourcingType;
}

/**
 * Human-readable labels for deliverable types
 */
export const DELIVERABLE_TYPE_LABELS: Record<DeliverableSourcingType, string> = {
  'CUSTOM_FURNITURE_MILLWORK': 'Custom Furniture/Millwork',
  'PROCURED': 'Procured Items',
  'DESIGN_DOCUMENT': 'Design Documents',
  'CONSTRUCTION': 'Construction Items',
};

/**
 * Short labels for deliverable types (for badges/tags)
 */
export const DELIVERABLE_TYPE_SHORT_LABELS: Record<DeliverableSourcingType, string> = {
  'CUSTOM_FURNITURE_MILLWORK': 'Custom',
  'PROCURED': 'Procured',
  'DESIGN_DOCUMENT': 'Document',
  'CONSTRUCTION': 'Construction',
};

/**
 * Icons for deliverable types (Lucide icon names)
 */
export const DELIVERABLE_TYPE_ICONS: Record<DeliverableSourcingType, string> = {
  'CUSTOM_FURNITURE_MILLWORK': 'Package',
  'PROCURED': 'ShoppingCart',
  'DESIGN_DOCUMENT': 'FileText',
  'CONSTRUCTION': 'HardHat',
};

/**
 * Colors for deliverable types (Tailwind classes)
 */
export const DELIVERABLE_TYPE_COLORS: Record<DeliverableSourcingType, { bg: string; text: string; border: string }> = {
  'CUSTOM_FURNITURE_MILLWORK': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  'PROCURED': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  'DESIGN_DOCUMENT': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  'CONSTRUCTION': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

// ============================================
// Construction Types
// ============================================

/**
 * Construction item sub-categories
 */
export type ConstructionCategory =
  | 'electrical'
  | 'plumbing'
  | 'tiling'
  | 'painting'
  | 'gypsum'
  | 'fitout'
  | 'hvac'
  | 'flooring'
  | 'ceiling'
  | 'other';

/**
 * Human-readable labels for construction categories
 */
export const CONSTRUCTION_CATEGORY_LABELS: Record<ConstructionCategory, string> = {
  'electrical': 'Electrical Works',
  'plumbing': 'Plumbing',
  'tiling': 'Tiling',
  'painting': 'Painting',
  'gypsum': 'Gypsum/Drywall',
  'fitout': 'Fitout Works',
  'hvac': 'HVAC',
  'flooring': 'Flooring',
  'ceiling': 'Ceiling',
  'other': 'Other',
};

/**
 * Icons for construction categories (Lucide icon names)
 */
export const CONSTRUCTION_CATEGORY_ICONS: Record<ConstructionCategory, string> = {
  'electrical': 'Zap',
  'plumbing': 'Droplet',
  'tiling': 'Grid3X3',
  'painting': 'Paintbrush',
  'gypsum': 'Square',
  'fitout': 'Hammer',
  'hvac': 'Wind',
  'flooring': 'Layers',
  'ceiling': 'ArrowUp',
  'other': 'MoreHorizontal',
};

/**
 * Unit types for construction pricing
 */
export type ConstructionUnitType = 'sqm' | 'sqft' | 'lm' | 'unit' | 'lot';

/**
 * Labels for construction unit types
 */
export const CONSTRUCTION_UNIT_LABELS: Record<ConstructionUnitType, string> = {
  'sqm': 'Square Meters (m²)',
  'sqft': 'Square Feet (ft²)',
  'lm': 'Linear Meters (lm)',
  'unit': 'Units',
  'lot': 'Lump Sum',
};

/**
 * Short labels for construction unit types
 */
export const CONSTRUCTION_UNIT_SHORT_LABELS: Record<ConstructionUnitType, string> = {
  'sqm': 'm²',
  'sqft': 'ft²',
  'lm': 'lm',
  'unit': 'units',
  'lot': 'lot',
};

/**
 * Construction pricing for fitout/construction items
 */
export interface ConstructionPricing {
  // Category
  category: ConstructionCategory;

  // Contractor info
  contractor?: string;
  contractorContact?: string;

  // Area/quantity based
  unitType: ConstructionUnitType;
  quantity: number;
  unitRate: number;

  // Labor
  laborCost: number;
  laborDays?: number;
  laborNotes?: string;

  // Materials
  materialsCost: number;
  materialsBreakdown?: string;

  // Subtotals
  subtotal: number;           // (quantity × unitRate) + laborCost + materialsCost

  // VAT
  vatRate?: number;           // e.g., 0.18 for 18%
  vatAmount?: number;

  // Total
  totalCost: number;          // subtotal + vatAmount
  currency: string;

  // Tracking
  quotedAt?: Timestamp;
  quotedBy?: string;
  quoteReference?: string;
  validUntil?: Timestamp;

  // Notes
  scopeOfWork?: string;
  exclusions?: string;
  notes?: string;
}

/**
 * Create default construction pricing
 */
export function createDefaultConstructionPricing(
  category: ConstructionCategory = 'other',
  currency: string = 'UGX'
): ConstructionPricing {
  return {
    category,
    unitType: 'sqm',
    quantity: 0,
    unitRate: 0,
    laborCost: 0,
    materialsCost: 0,
    subtotal: 0,
    totalCost: 0,
    currency,
  };
}

/**
 * Calculate construction pricing totals
 */
export function calculateConstructionPricing(pricing: ConstructionPricing): ConstructionPricing {
  const quantityTotal = pricing.quantity * pricing.unitRate;
  const subtotal = quantityTotal + pricing.laborCost + pricing.materialsCost;
  const vatAmount = pricing.vatRate ? subtotal * pricing.vatRate : 0;
  const totalCost = subtotal + vatAmount;

  return {
    ...pricing,
    subtotal,
    vatAmount,
    totalCost,
  };
}

// ============================================
// Construction Stages
// ============================================

/**
 * Construction workflow stages
 */
export const CONSTRUCTION_STAGES: DesignStage[] = [
  'const-scope',
  'const-spec',
  'const-quote',
  'const-approve',
  'const-in-progress',
  'const-inspection',
  'const-complete',
];

/**
 * Construction stage labels
 */
export const CONSTRUCTION_STAGE_LABELS: Record<string, string> = {
  'const-scope': 'Scope Definition',
  'const-spec': 'Specification',
  'const-quote': 'Quotation',
  'const-approve': 'Approval',
  'const-in-progress': 'Work In Progress',
  'const-inspection': 'Inspection/QC',
  'const-complete': 'Completed',
};

/**
 * Construction stage short labels
 */
export const CONSTRUCTION_STAGE_SHORT_LABELS: Record<string, string> = {
  'const-scope': 'Scope',
  'const-spec': 'Spec',
  'const-quote': 'Quote',
  'const-approve': 'Approve',
  'const-in-progress': 'In Progress',
  'const-inspection': 'Inspection',
  'const-complete': 'Complete',
};

/**
 * Construction stage icons
 */
export const CONSTRUCTION_STAGE_ICONS: Record<string, string> = {
  'const-scope': 'ClipboardList',
  'const-spec': 'FileText',
  'const-quote': 'DollarSign',
  'const-approve': 'CheckCircle',
  'const-in-progress': 'Hammer',
  'const-inspection': 'Search',
  'const-complete': 'Flag',
};

// ============================================
// Type Guards
// ============================================

/**
 * Check if a sourcing type is for construction items
 */
export function isConstructionType(type?: string | null): boolean {
  return normalizeSourcingType(type) === 'CONSTRUCTION';
}

/**
 * Check if a sourcing type is for design documents
 */
export function isDesignDocumentType(type?: string | null): boolean {
  return normalizeSourcingType(type) === 'DESIGN_DOCUMENT';
}

/**
 * Check if a sourcing type is for procured items
 */
export function isProcuredType(type?: string | null): boolean {
  return normalizeSourcingType(type) === 'PROCURED';
}

/**
 * Check if a sourcing type is for custom furniture/millwork
 */
export function isCustomFurnitureType(type?: string | null): boolean {
  return normalizeSourcingType(type) === 'CUSTOM_FURNITURE_MILLWORK';
}

/**
 * Check if a stage is a construction stage
 */
export function isConstructionStage(stage?: string | null): boolean {
  if (!stage) return false;
  return stage.startsWith('const-');
}
