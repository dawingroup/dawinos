/**
 * Unified Inventory Types
 * Single source of truth for materials - merges Materials + Katana Catalog
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Inventory item categories
 */
export type InventoryCategory =
  | 'sheet-goods'
  | 'solid-wood'
  | 'hardware'
  | 'edge-banding'
  | 'finishing'
  | 'adhesives'
  | 'fasteners'
  | 'other';

/**
 * Units of measure
 */
export type InventoryUnit =
  | 'sheet'
  | 'sqft'
  | 'sqm'
  | 'lft'
  | 'pcs'
  | 'gal'
  | 'ea'
  | 'kg'
  | 'ltr';

/**
 * Item source tracking
 */
export type InventorySource = 'manual' | 'katana' | 'parts-promotion';

/**
 * Tier for scoped items
 */
export type InventoryTier = 'global' | 'customer' | 'project';

/**
 * Grain pattern options
 */
export type GrainPattern = 'none' | 'lengthwise' | 'crosswise' | 'random';

/**
 * Item status
 */
export type InventoryStatus = 'active' | 'discontinued' | 'out-of-stock';

/**
 * Classification: raw material vs finished product
 */
export type InventoryClassification = 'material' | 'product';

/**
 * Shopify sync status for products
 */
export type ShopifySyncStatus = 'not_synced' | 'syncing' | 'synced' | 'error';

/**
 * Price history entry for tracking changes
 */
export interface PriceHistoryEntry {
  costPerUnit: number;
  currency: string;
  recordedAt: Timestamp;
  source: 'katana-sync' | 'manual-update';
}

/**
 * Pricing information
 */
export interface InventoryPricing {
  costPerUnit: number;
  currency: string; // KES, UGX, USD
  unit: InventoryUnit;
  lastSyncedFromKatana?: Timestamp;
  priceHistory?: PriceHistoryEntry[];
}

/**
 * Inventory/stock information
 */
export interface InventoryStock {
  inStock: number;
  reorderLevel?: number;
  lastSyncedFromKatana?: Timestamp;
}

/**
 * Katana sync tracking
 */
export interface KatanaSyncInfo {
  isStandard: boolean; // Handled directly in Katana
  lastPulledAt?: Timestamp; // Last sync from Katana
  lastPushedAt?: Timestamp; // Last sync to Katana
  pendingPush: boolean; // Metadata needs to be pushed
  syncErrors?: string[];
}

/**
 * Supplier-specific pricing for an inventory item
 * Supports multiple suppliers per item with pricing, lead times, and preferences
 */
export interface SupplierInventoryPricing {
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  unitPrice: number;
  currency: string;
  unit: InventoryUnit;
  minimumOrder?: number;
  leadTimeDays?: number;
  effectiveDate?: Timestamp;
  expiryDate?: Timestamp;
  notes?: string;
  isPreferred: boolean;        // Is this the preferred supplier?
  lastQuotedAt?: Timestamp;
  addedAt: Timestamp;
  addedBy: string;
}

/**
 * Form data for adding/editing supplier pricing
 */
export interface SupplierPricingFormData {
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  unitPrice: number;
  currency: string;
  minimumOrder?: number;
  leadTimeDays?: number;
  notes?: string;
}

/**
 * Material dimensions (for sheet goods)
 */
export interface InventoryDimensions {
  length: number; // mm
  width: number; // mm
  thickness: number; // mm
}

/**
 * Core Inventory Item interface
 */
export interface InventoryItem {
  id: string;
  sku: string; // Unique identifier (Katana SKU or generated)
  name: string;
  displayName?: string; // Override for UI display
  description?: string;

  // === CLASSIFICATION & CATEGORIZATION ===
  classification?: InventoryClassification;
  category: InventoryCategory;
  subcategory?: string; // MDF, Plywood, Melamine, etc.
  tags: string[]; // Searchable tags
  aliases?: string[]; // Alternative names for matching

  // === SUPPLIER & SHOPIFY ===
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  shopifySyncStatus?: ShopifySyncStatus;
  shopifyLastSyncAt?: Timestamp;

  // === PROJECT LINKS (for products) ===
  linkedProjectIds?: string[];

  // === MULTI-SUPPLIER SUPPORT ===
  supplierPricing?: SupplierInventoryPricing[];

  // === MATERIAL LINKS (reverse lookup) ===
  linkedMaterialIds?: string[];

  // === SOURCE TRACKING ===
  source: InventorySource;
  katanaId?: string; // If synced from/to Katana
  promotedFromPartId?: string; // If promoted from parts database

  // === TIER ===
  tier: InventoryTier;
  scopeId?: string; // customerId or projectId (for customer/project tier)

  // === DESIGN PROPERTIES ===
  dimensions?: InventoryDimensions;
  grainPattern?: GrainPattern;

  // === PRICING ===
  pricing: InventoryPricing;

  // === INVENTORY STATUS ===
  inventory: InventoryStock;

  // === KATANA SYNC ===
  katanaSync: KatanaSyncInfo;

  // === STATUS ===
  status: InventoryStatus;

  // === METADATA ===
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Form data for creating/editing inventory items
 */
export interface InventoryItemFormData {
  sku: string;
  name: string;
  displayName?: string;
  description?: string;
  classification?: InventoryClassification;
  category: InventoryCategory;
  subcategory?: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  shopifyProductId?: string;
  shopifyVariantId?: string;
  tags?: string[];
  dimensions?: InventoryDimensions;
  grainPattern?: GrainPattern;
  pricing: {
    costPerUnit: number;
    currency: string;
    unit: InventoryUnit;
  };
  status: InventoryStatus;
  // Multi-supplier pricing
  supplierPricing?: SupplierPricingFormData[];
}

/**
 * List item (lightweight for lists)
 */
export interface InventoryListItem {
  id: string;
  sku: string;
  name: string;
  displayName?: string;
  category: InventoryCategory;
  subcategory?: string;
  tier: InventoryTier;
  source: InventorySource;
  thickness?: number;
  costPerUnit?: number;
  currency?: string;
  inStock?: number;
  isStandard?: boolean;
  status: InventoryStatus;
}

/**
 * Resolved price with source tracking
 */
export interface ResolvedPrice {
  costPerUnit: number;
  currency: string;
  unit: InventoryUnit;
  source: 'project' | 'customer' | 'global' | 'katana';
  itemId: string;
  itemName: string;
  lastSynced?: Timestamp;
}

/**
 * Category metadata
 */
export const INVENTORY_CATEGORIES: Record<InventoryCategory, { label: string; icon: string }> = {
  'sheet-goods': { label: 'Sheet Goods', icon: '📦' },
  'solid-wood': { label: 'Solid Wood', icon: '🪵' },
  'hardware': { label: 'Hardware', icon: '🔩' },
  'edge-banding': { label: 'Edge Banding', icon: '📏' },
  'finishing': { label: 'Finishing', icon: '🎨' },
  'adhesives': { label: 'Adhesives', icon: '🧴' },
  'fasteners': { label: 'Fasteners', icon: '🔧' },
  'other': { label: 'Other', icon: '📋' },
};

/**
 * Unit labels
 */
export const INVENTORY_UNITS: Record<InventoryUnit, string> = {
  sheet: 'Sheet',
  sqft: 'sq ft',
  sqm: 'sq m',
  lft: 'linear ft',
  pcs: 'pieces',
  gal: 'gallon',
  ea: 'each',
  kg: 'kg',
  ltr: 'litre',
};

/**
 * Common sheet sizes (mm)
 */
export const COMMON_SHEET_SIZES: InventoryDimensions[] = [
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

/**
 * Source labels
 */
export const INVENTORY_SOURCE_LABELS: Record<InventorySource, { label: string; color: string }> = {
  'manual': { label: 'Manual', color: 'bg-gray-100 text-gray-700' },
  'katana': { label: 'Katana', color: 'bg-blue-100 text-blue-700' },
  'parts-promotion': { label: 'From Parts', color: 'bg-purple-100 text-purple-700' },
};
