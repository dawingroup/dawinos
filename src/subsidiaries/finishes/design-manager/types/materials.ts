/**
 * Material Library Types
 * Three-tier material system: Global → Customer → Project
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Material categories
 */
export type MaterialCategory =
  | 'sheet-goods'
  | 'solid-wood'
  | 'hardware'
  | 'edge-banding'
  | 'finishing'
  | 'other';

/**
 * Material units of measure
 */
export type MaterialUnit =
  | 'sheet'
  | 'sqft'
  | 'sqm'
  | 'lft'
  | 'pcs'
  | 'gal'
  | 'ea';

/**
 * Material tier (where the material is defined)
 */
export type MaterialTier = 'global' | 'customer' | 'project';

/**
 * Grain pattern options
 */
export type GrainPattern = 'none' | 'lengthwise' | 'crosswise' | 'random';

/**
 * Material dimensions for sheet goods
 */
export interface MaterialDimensions {
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
}

/**
 * Material pricing information
 */
export interface MaterialPricing {
  unitCost: number;
  currency: string; // KES, USD, etc.
  unit: MaterialUnit;
  lastUpdated?: Timestamp;
  supplier?: string;
}

/**
 * Core Material interface
 */
export interface Material {
  id: string;
  code: string; // Unique material code
  name: string;
  description?: string;
  category: MaterialCategory;
  
  // Dimensions (for sheet goods)
  dimensions?: MaterialDimensions;
  
  // Pricing
  pricing?: MaterialPricing;
  
  // Grain
  grainPattern?: GrainPattern;
  
  // Status
  status: 'active' | 'discontinued' | 'out-of-stock';
  
  // Tier info
  tier: MaterialTier;
  
  // For customer/project materials - reference to parent
  parentMaterialId?: string; // If this overrides a global/customer material
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Form data for creating/editing materials
 */
export interface MaterialFormData {
  code: string;
  name: string;
  description?: string;
  category: MaterialCategory;
  dimensions?: MaterialDimensions;
  pricing?: Omit<MaterialPricing, 'lastUpdated'>;
  grainPattern?: GrainPattern;
  status: 'active' | 'discontinued' | 'out-of-stock';
}

/**
 * Material list item (lightweight for lists)
 */
export interface MaterialListItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  tier: MaterialTier;
  thickness?: number;
  unitCost?: number;
  currency?: string;
  status: 'active' | 'discontinued' | 'out-of-stock';
}

/**
 * Merged material (resolved from all tiers)
 */
export interface ResolvedMaterial extends Material {
  resolvedFrom: MaterialTier; // Which tier this was resolved from
  overrides?: {
    pricing?: MaterialPricing; // Project-level price override
  };
}

/**
 * Material category metadata
 */
export const MATERIAL_CATEGORIES: Record<MaterialCategory, { label: string; icon: string }> = {
  'sheet-goods': { label: 'Sheet Goods', icon: '📦' },
  'solid-wood': { label: 'Solid Wood', icon: '🪵' },
  'hardware': { label: 'Hardware', icon: '🔩' },
  'edge-banding': { label: 'Edge Banding', icon: '📏' },
  'finishing': { label: 'Finishing', icon: '🎨' },
  'other': { label: 'Other', icon: '📋' },
};

/**
 * Material unit labels
 */
export const MATERIAL_UNITS: Record<MaterialUnit, string> = {
  sheet: 'Sheet',
  sqft: 'sq ft',
  sqm: 'sq m',
  lft: 'linear ft',
  pcs: 'pieces',
  gal: 'gallon',
  ea: 'each',
};

/**
 * Common sheet sizes (mm)
 */
export const COMMON_SHEET_SIZES: MaterialDimensions[] = [
  { length: 2440, width: 1220, thickness: 18 }, // 8x4 ft
  { length: 2440, width: 1220, thickness: 16 },
  { length: 2440, width: 1220, thickness: 12 },
  { length: 2440, width: 1220, thickness: 9 },
  { length: 2440, width: 1220, thickness: 6 },
  { length: 2440, width: 1220, thickness: 3 },
  { length: 3050, width: 1220, thickness: 18 }, // 10x4 ft
  { length: 3050, width: 1220, thickness: 16 },
  { length: 2500, width: 1250, thickness: 18 }, // European standard
];

/**
 * Common thicknesses (mm)
 */
export const COMMON_THICKNESSES = [3, 6, 9, 12, 15, 16, 18, 22, 25];
