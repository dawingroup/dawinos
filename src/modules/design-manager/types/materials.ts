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

  // === INVENTORY LINK ===
  inventoryItemId?: string;      // Link to InventoryItem
  inventoryItemSku?: string;     // Cached for display
  linkedAt?: Timestamp;          // When link was established
  linkedBy?: string;             // User who created link

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
 * Supplier pricing summary for materials with linked inventory
 */
export interface SupplierPricingSummary {
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  currency: string;
  leadTimeDays?: number;
  isPreferred: boolean;
}

/**
 * Inventory status for linked materials
 */
export type LinkedInventoryStatus = 'active' | 'discontinued' | 'out-of-stock';

/**
 * Extended material with resolved inventory data
 * Used when displaying materials with their linked inventory info
 */
export interface MaterialWithInventory extends Material {
  inventory?: {
    id: string;
    sku: string;
    name: string;
    inStock: number;
    reorderLevel?: number;
    costPerUnit: number;
    currency: string;
    status: LinkedInventoryStatus;
    preferredSupplierId?: string;
    preferredSupplierName?: string;
  };
  suppliers?: SupplierPricingSummary[];
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

// ============================================
// Stock Size Presets for Different Material Types
// ============================================

/**
 * Common panel sheet sizes with labels for UI selection
 */
export const PANEL_SIZE_PRESETS = [
  { length: 2440, width: 1220, label: '2440 × 1220mm (8×4 ft)' },
  { length: 3050, width: 1220, label: '3050 × 1220mm (10×4 ft)' },
  { length: 2500, width: 1250, label: '2500 × 1250mm (European)' },
  { length: 2800, width: 2070, label: '2800 × 2070mm (Egger)' },
  { length: 2750, width: 1830, label: '2750 × 1830mm (PG Bison)' },
  { length: 2790, width: 2050, label: '2790 × 2050mm (Kronospan)' },
];

/**
 * Common glass sheet sizes
 */
export const GLASS_SIZE_PRESETS = [
  { length: 2440, width: 1220, label: '2440 × 1220mm (8×4 ft)' },
  { length: 2440, width: 1830, label: '2440 × 1830mm (8×6 ft)' },
  { length: 3000, width: 1500, label: '3000 × 1500mm' },
  { length: 3210, width: 2250, label: '3210 × 2250mm (Jumbo)' },
  { length: 3200, width: 2400, label: '3200 × 2400mm (Laminated)' },
  { length: 2134, width: 1524, label: '2134 × 1524mm (7×5 ft)' },
];

/**
 * Glass type options
 */
export const GLASS_TYPES = [
  { value: 'clear', label: 'Clear Float' },
  { value: 'tinted', label: 'Tinted' },
  { value: 'frosted', label: 'Frosted/Sandblasted' },
  { value: 'laminated', label: 'Laminated Safety' },
  { value: 'tempered', label: 'Tempered/Toughened' },
  { value: 'low-e', label: 'Low-E Coated' },
] as const;

export type GlassType = typeof GLASS_TYPES[number]['value'];

/**
 * Common timber cross-sections (thickness × width in mm)
 */
export const TIMBER_SECTION_PRESETS = [
  { thickness: 22, width: 70, label: '22 × 70mm PAR' },
  { thickness: 22, width: 100, label: '22 × 100mm PAR' },
  { thickness: 22, width: 150, label: '22 × 150mm PAR' },
  { thickness: 32, width: 100, label: '32 × 100mm PAR' },
  { thickness: 38, width: 38, label: '38 × 38mm PAR' },
  { thickness: 38, width: 75, label: '38 × 75mm PAR' },
  { thickness: 38, width: 100, label: '38 × 100mm PAR' },
  { thickness: 38, width: 150, label: '38 × 150mm PAR' },
  { thickness: 50, width: 50, label: '50 × 50mm PAR' },
  { thickness: 50, width: 75, label: '50 × 75mm PAR' },
  { thickness: 50, width: 100, label: '50 × 100mm PAR' },
  { thickness: 50, width: 150, label: '50 × 150mm PAR' },
  { thickness: 75, width: 75, label: '75 × 75mm Post' },
  { thickness: 100, width: 100, label: '100 × 100mm Post' },
];

/**
 * Common timber stock lengths (mm)
 */
export const TIMBER_LENGTH_PRESETS = [
  { length: 2400, label: '2.4m' },
  { length: 3000, label: '3.0m' },
  { length: 3600, label: '3.6m' },
  { length: 4200, label: '4.2m' },
  { length: 4800, label: '4.8m' },
  { length: 5400, label: '5.4m' },
  { length: 6000, label: '6.0m' },
];

/**
 * Linear profile types (metal bars, aluminium extrusions)
 */
export const LINEAR_PROFILE_TYPES = [
  { value: 'round', label: 'Round Bar' },
  { value: 'square', label: 'Square Hollow Section (SHS)' },
  { value: 'rectangle', label: 'Rectangular Hollow Section (RHS)' },
  { value: 'angle', label: 'Angle (L-Section)' },
  { value: 'channel', label: 'Channel (C-Section)' },
  { value: 'flat', label: 'Flat Bar' },
  { value: 'tube', label: 'Round Tube' },
] as const;

export type LinearProfileType = typeof LINEAR_PROFILE_TYPES[number]['value'];

/**
 * Common linear stock profiles with dimensions
 */
export const LINEAR_PROFILE_PRESETS = [
  { type: 'square' as const, dimension1: 20, label: '20×20 SHS' },
  { type: 'square' as const, dimension1: 25, label: '25×25 SHS' },
  { type: 'square' as const, dimension1: 40, label: '40×40 SHS' },
  { type: 'square' as const, dimension1: 50, label: '50×50 SHS' },
  { type: 'rectangle' as const, dimension1: 50, dimension2: 25, label: '50×25 RHS' },
  { type: 'rectangle' as const, dimension1: 75, dimension2: 50, label: '75×50 RHS' },
  { type: 'rectangle' as const, dimension1: 100, dimension2: 50, label: '100×50 RHS' },
  { type: 'angle' as const, dimension1: 25, dimension2: 25, label: '25×25 Angle' },
  { type: 'angle' as const, dimension1: 40, dimension2: 40, label: '40×40 Angle' },
  { type: 'angle' as const, dimension1: 50, dimension2: 50, label: '50×50 Angle' },
  { type: 'round' as const, dimension1: 10, label: '10mm Round Bar' },
  { type: 'round' as const, dimension1: 12, label: '12mm Round Bar' },
  { type: 'round' as const, dimension1: 16, label: '16mm Round Bar' },
  { type: 'round' as const, dimension1: 20, label: '20mm Round Bar' },
  { type: 'round' as const, dimension1: 25, label: '25mm Round Bar' },
  { type: 'flat' as const, dimension1: 25, dimension2: 3, label: '25×3 Flat Bar' },
  { type: 'flat' as const, dimension1: 40, dimension2: 5, label: '40×5 Flat Bar' },
  { type: 'flat' as const, dimension1: 50, dimension2: 5, label: '50×5 Flat Bar' },
  { type: 'tube' as const, dimension1: 25, wallThickness: 2, label: '25mm Tube (2mm wall)' },
  { type: 'tube' as const, dimension1: 32, wallThickness: 2.5, label: '32mm Tube (2.5mm wall)' },
];

/**
 * Common linear stock lengths (mm)
 */
export const LINEAR_LENGTH_PRESETS = [
  { length: 3000, label: '3.0m' },
  { length: 6000, label: '6.0m' },
  { length: 6500, label: '6.5m' },
];

/**
 * Linear stock material options
 */
export const LINEAR_MATERIAL_TYPES = [
  { value: 'steel', label: 'Mild Steel' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'stainless', label: 'Stainless Steel' },
  { value: 'brass', label: 'Brass' },
  { value: 'copper', label: 'Copper' },
  { value: 'other', label: 'Other' },
] as const;

export type LinearMaterialType = typeof LINEAR_MATERIAL_TYPES[number]['value'];
