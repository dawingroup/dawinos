/**
 * Project Types with Optimization State
 * Extended project schema for cutlist optimization workflow
 */

import type { Timestamp } from './common';

// ============================================
// Stock and Nesting Types
// ============================================

/**
 * Stock sheet configuration for optimization (PANEL materials)
 */
export interface OptimizationStockSheet {
  id: string;
  materialId: string;
  materialName: string;
  length: number;           // mm
  width: number;            // mm
  thickness: number;        // mm
  quantity: number;
  costPerSheet: number;
  supplier?: string;
  sku?: string;
}

/**
 * Timber stock definition for dimensional lumber (TIMBER materials)
 * Represents available cross-sections and lengths for solid timber
 */
export interface TimberStockDefinition {
  id: string;
  materialId: string;
  materialName: string;     // e.g., "Meranti", "Pine PAR", "Oak"

  // Cross-section (the "profile")
  thickness: number;        // mm (e.g., 38mm, 50mm)
  width: number;            // mm (e.g., 100mm, 150mm, 200mm)

  // Available lengths for this cross-section
  availableLengths: number[]; // [2400, 3000, 3600, 4800, 5400, 6000] mm

  // Pricing
  costPerLinearMeter?: number;    // Cost per running meter
  costPerPiece?: {                // Or cost per standard length
    length: number;
    cost: number;
  }[];

  // Processing capabilities
  isDressed: boolean;       // PAR (Planed All Round) vs rough sawn
  canBeRipped: boolean;     // Can this be ripped to narrower widths?

  // Metadata
  species?: string;         // Wood species (e.g., "Meranti", "Oak", "Pine")
  grade?: string;           // Structural grade, appearance grade
  supplier?: string;
  sku?: string;
  quantity?: number;        // Available pieces in stock
}

/**
 * Linear stock definition for metal bars, tubes, and aluminium profiles
 * (METAL_BAR and ALUMINIUM materials)
 */
export interface LinearStockDefinition {
  id: string;
  materialId: string;
  materialName: string;     // e.g., "Steel", "Aluminium 6063"

  // Profile specification
  profile: string;          // e.g., "50x50 SHS", "25mm Round Bar", "40x40 Angle"
  profileDimensions: {      // Structured dimensions
    type: 'round' | 'square' | 'rectangle' | 'angle' | 'channel' | 'flat' | 'tube';
    dimension1: number;     // mm (diameter for round, width for others)
    dimension2?: number;    // mm (height for rectangle, thickness for flat)
    wallThickness?: number; // mm (for tubes)
  };

  // Available lengths
  availableLengths: number[]; // [3000, 6000] mm (typical metal stock lengths)

  // Pricing
  costPerLinearMeter: number;
  costPerPiece?: {
    length: number;
    cost: number;
  }[];

  // Metadata
  material: 'steel' | 'aluminium' | 'stainless' | 'brass' | 'copper' | 'other';
  finish?: string;          // e.g., "Mill finish", "Anodized", "Powder coated"
  supplier?: string;
  sku?: string;
  quantity?: number;
}

/**
 * Glass sheet configuration with fragility handling (GLASS materials)
 */
export interface GlassStockDefinition extends OptimizationStockSheet {
  // Glass-specific properties
  glassType: 'clear' | 'tinted' | 'frosted' | 'laminated' | 'tempered' | 'low-e';
  safetyMargin: number;     // mm - minimum margin from edges for cuts
  minimumCutSize: {         // Minimum practical cut size
    length: number;
    width: number;
  };
  requiresPolishing: boolean; // Edges need polishing after cutting
  fragile: true;            // Always true for glass
}

/**
 * Sheet summary from estimation
 */
export interface SheetSummary {
  materialId: string;
  materialName: string;
  thickness: number;
  sheetSize: { length: number; width: number };
  sheetsRequired: number;
  partsOnSheet: number;
  utilizationPercent: number;
  wasteArea: number;        // sq mm
  estimatedCost: number;
}

/**
 * Individual nesting sheet result
 */
export interface NestingSheet {
  id: string;
  sheetIndex: number;
  stockSheetId: string;
  materialId: string;
  materialName: string;
  sheetSize: { length: number; width: number };
  placements: PartPlacement[];
  utilizationPercent: number;
  wasteArea: number;
  wasteRegions: WasteRegion[];
}

/**
 * Part placement on a sheet
 */
export interface PartPlacement {
  partId: string;
  partName: string;
  designItemId: string;
  designItemName: string;
  x: number;                // mm from left
  y: number;                // mm from bottom
  length: number;           // mm
  width: number;            // mm
  rotated: boolean;         // 90° rotation applied
  grainAligned: boolean;
  edgeBanding?: {           // Edge banding from source part
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    material?: string;
    thickness?: number;
  };
}

/**
 * Waste region on a sheet
 */
export interface WasteRegion {
  x: number;
  y: number;
  length: number;
  width: number;
  area: number;
  reusable: boolean;        // Large enough for future use
}

// ============================================
// Timber and Linear Stock Types
// ============================================

/**
 * Linear cutting result for timber/metal bars/aluminium (1D optimization)
 */
export interface LinearCuttingResult {
  id: string;
  stockIndex: number;
  stockId: string;
  materialId: string;
  materialName: string;

  // Stock dimensions
  crossSection: {
    thickness: number;      // mm
    width: number;          // mm (for timber/flat stock)
  };
  stockLength: number;      // mm - original length of the stick/bar

  // Cuts on this stick
  cuts: LinearCutPlacement[];
  utilizationPercent: number;
  wasteLength: number;      // mm
  wasteSegments: LinearWasteSegment[];
}

/**
 * Part placement on linear stock (1D)
 */
export interface LinearCutPlacement {
  partId: string;
  partName: string;
  designItemId: string;
  designItemName: string;
  startPosition: number;    // mm from left end of stock
  cutLength: number;        // mm - length of this cut
  quantity: number;         // How many of this part from this position
}

/**
 * Waste segment on linear stock
 */
export interface LinearWasteSegment {
  startPosition: number;    // mm from left end
  length: number;           // mm
  reusable: boolean;        // Large enough for future use (e.g., > 300mm)
}

/**
 * Timber-specific summary
 */
export interface TimberSummary {
  materialId: string;
  materialName: string;
  crossSection: {
    thickness: number;
    width: number;
  };
  stockLength: number;
  sticksRequired: number;
  totalLinearMeters: number;
  partsOnSticks: number;
  averageUtilizationPercent: number;
  totalWasteLength: number; // mm
  estimatedCost: number;
}

/**
 * Linear stock summary (metal bars, aluminium)
 */
export interface LinearStockSummary {
  materialId: string;
  materialName: string;
  profile: string;
  stockLength: number;
  barsRequired: number;
  totalLinearMeters: number;
  partsOnBars: number;
  averageUtilizationPercent: number;
  totalWasteLength: number;
  estimatedCost: number;
}

/**
 * Cut operation in sequence
 */
export interface CutOperation {
  id: string;
  sheetId: string;
  sequence: number;
  type: 'rip' | 'crosscut' | 'trim';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  resultingParts: string[]; // Part IDs created by this cut
}

/**
 * Edge banding configuration
 */
export interface EdgeBandConfig {
  defaultMaterial: string;
  defaultThickness: number;
  defaultWidth: number;
  applyToAllExposed: boolean;
  materialMappings: Record<string, string>; // materialId -> edgeBandMaterial
}

// ============================================
// Optimization State
// ============================================

/**
 * Estimation mode results (Stage 3 - Pre-production)
 */
export interface EstimationResult {
  // Panel materials (sheet goods)
  sheetSummary: SheetSummary[];

  // Timber materials (dimensional lumber)
  timberSummary?: TimberSummary[];

  // Linear stock (metal bars, aluminium)
  linearStockSummary?: LinearStockSummary[];

  // Cost breakdown
  roughCost: number;              // Sheet materials cost (with buffer)
  timberCost?: number;            // Timber materials cost
  linearStockCost?: number;       // Metal/aluminium materials cost
  standardPartsCost?: number;     // Consumables cost (hinges, screws, etc)
  specialPartsCost?: number;      // Luxury/approved items cost
  totalCost?: number;             // Total of all costs

  // Statistics
  wasteEstimate: number;          // percentage (for sheet goods)
  totalPartsCount: number;
  totalSheetsCount: number;
  totalTimberSticks?: number;
  totalLinearBars?: number;
  totalStandardParts?: number;
  totalSpecialParts?: number;

  // Metadata
  validAt: Timestamp;
  invalidatedAt?: Timestamp;
  invalidationReasons?: string[];
}

/**
 * Production mode results (Stage 4 - Production Ready)
 */
export interface ProductionResult {
  // Panel materials (sheet goods)
  nestingSheets: NestingSheet[];
  cutSequence: CutOperation[];

  // Timber materials (dimensional lumber)
  timberCuttingResults?: LinearCuttingResult[];

  // Linear stock (metal bars, aluminium)
  linearStockCuttingResults?: LinearCuttingResult[];

  // Optimization metrics
  optimizedYield: number;         // percentage (average across all materials)
  sheetYield?: number;            // percentage (panels only)
  timberYield?: number;           // percentage (timber only)
  linearStockYield?: number;      // percentage (metal/aluminium only)

  totalCuttingLength: number;     // mm (total for all cuts)
  estimatedCutTime: number;       // minutes

  // Metadata
  validAt: Timestamp;
  invalidatedAt?: Timestamp;
  invalidationReasons?: string[];
  katanaBOMId?: string;
  katanaBOMExportedAt?: Timestamp;
  katanaOrderNumber?: string;
}

/**
 * Optimization configuration (persisted for re-runs)
 */
export interface OptimizationConfig {
  // Cutting parameters
  kerf: number;                   // mm (blade width / saw kerf)

  // Stock definitions by material type
  stockSheets: OptimizationStockSheet[];      // Panel materials
  timberStock?: TimberStockDefinition[];      // Timber materials
  linearStock?: LinearStockDefinition[];      // Metal bars, aluminium
  glassStock?: GlassStockDefinition[];        // Glass materials

  // Panel-specific settings
  grainMatching: boolean;
  edgeBandingSettings: EdgeBandConfig;
  allowRotation: boolean;
  prioritizeGrain: boolean;
  minimumUsableCutoff: { length: number; width: number };

  // Linear stock settings (timber, metal, aluminium)
  minimumUsableOffcut?: number;   // mm - minimum length to consider reusable (default: 300mm)
  allowCrossGrain?: boolean;      // For timber - allow cross-grain cuts if needed

  // Target optimization
  targetYield: number;            // percentage target (applies to all material types)
}

/**
 * Shop Traveler PDF section settings
 */
export interface ShopTravelerSettings {
  includeCoverPage: boolean;
  includeCuttingMaps: boolean;
  includeEdgeBandingSchedule: boolean;
  includeRemnantRegister: boolean;
  includePartLabels: boolean;
  // Future sections
  includeAssemblyInstructions?: boolean;
  includeMaterialsList?: boolean;
}

/**
 * Default shop traveler settings
 */
export const DEFAULT_SHOP_TRAVELER_SETTINGS: ShopTravelerSettings = {
  includeCoverPage: true,
  includeCuttingMaps: true,
  includeEdgeBandingSchedule: true,
  includeRemnantRegister: true,
  includePartLabels: true,
};

/**
 * Complete optimization state for a project
 */
export interface OptimizationState {
  // Estimation Mode Results (Stage 3)
  estimation: EstimationResult | null;
  
  // Production Mode Results (Stage 4)
  production: ProductionResult | null;
  
  // Configuration (persisted for re-runs)
  config: OptimizationConfig;
  
  // Shop Traveler settings (which sections to include)
  shopTravelerSettings?: ShopTravelerSettings;
  
  // Last run metadata
  lastEstimationRun?: Timestamp;
  lastProductionRun?: Timestamp;
}

// ============================================
// Material Palette Types
// ============================================

/**
 * Material type classification
 */
export type MaterialType =
  | 'PANEL'        // Sheet goods (MDF, Plywood, Melamine, etc.)
  | 'SOLID'        // Solid wood (legacy - use TIMBER for dimensional lumber)
  | 'VENEER'       // Veneers for finishing
  | 'EDGE'         // Edge banding materials
  | 'TIMBER'       // Dimensional lumber with varying cross-sections (thickness × width × length)
  | 'GLASS'        // Glass sheets with fragility handling
  | 'METAL_BAR'    // Metal bars, tubes, and linear stock
  | 'ALUMINIUM';   // Aluminium extrusions and profiles

/**
 * Material palette entry - maps design materials to inventory
 */
export interface MaterialPaletteEntry {
  id: string;
  designName: string;        // From CSV/Polyboard (e.g., "18mm White Melamine")
  normalizedName: string;    // Cleaned for matching
  thickness: number;
  materialType: MaterialType;
  
  // Usage tracking
  usageCount: number;        // How many parts use this material
  designItemIds: string[];   // Which design items use this
  
  // Inventory mapping
  inventoryId?: string;      // Katana/Stock SKU
  inventoryName?: string;    // Display name from inventory
  inventorySku?: string;     // SKU code
  unitCost?: number;         // Cost per sheet/unit
  mappedAt?: Timestamp;
  mappedBy?: string;

  // Stock options (for optimization) - type-specific
  stockSheets: OptimizationStockSheet[];          // For PANEL materials
  timberStock?: TimberStockDefinition[];          // For TIMBER materials
  linearStock?: LinearStockDefinition[];          // For METAL_BAR and ALUMINIUM materials
  glassStock?: GlassStockDefinition[];            // For GLASS materials

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Material palette for a project
 */
export interface MaterialPalette {
  entries: MaterialPaletteEntry[];
  lastHarvestedAt?: Timestamp;
  unmappedCount: number;
  mappedCount: number;
}

// ============================================
// Extended Project Interface
// ============================================

/**
 * RAG status for optimization
 */
export interface OptimizationRAGStatus {
  estimation: {
    status: 'red' | 'amber' | 'green' | 'grey';
    message: string;
  };
  production: {
    status: 'red' | 'amber' | 'green' | 'grey';
    message: string;
  };
  katanaBOM: {
    status: 'red' | 'amber' | 'green' | 'grey';
    message: string;
  };
}

/**
 * Project with optimization state
 */
export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  
  // Client info
  customerId?: string;
  customerName?: string;
  
  // Status
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  
  // Dates
  startDate?: Timestamp;
  dueDate?: Timestamp;
  completedDate?: Timestamp;
  
  // Optimization state (new)
  optimizationState?: OptimizationState;
  optimizationRAG?: OptimizationRAGStatus;
  
  // Material palette for inventory mapping
  materialPalette?: MaterialPalette;
  
  // Snapshot for change detection
  lastSnapshot?: ProjectSnapshot;
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

/**
 * Project snapshot for change detection
 */
export interface ProjectSnapshot {
  takenAt: Timestamp;
  
  // Part-level data
  partsHash: string;        // Hash of all parts data
  totalParts: number;
  
  // Material mappings
  materialMappingsHash: string;
  
  // Configuration
  configHash: string;
  
  // Design items
  designItemIds: string[];
  designItemsHash: string;
}

// ============================================
// Default Values
// ============================================

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  kerf: 3.2,                // Standard 3.2mm kerf
  stockSheets: [],
  grainMatching: true,
  edgeBandingSettings: {
    defaultMaterial: 'PVC',
    defaultThickness: 0.5,
    defaultWidth: 22,
    applyToAllExposed: true,
    materialMappings: {},
  },
  targetYield: 85,          // 85% target yield
  allowRotation: true,
  prioritizeGrain: true,
  minimumUsableCutoff: { length: 150, width: 75 },
};

/**
 * Create default optimization state
 */
export function createDefaultOptimizationState(): OptimizationState {
  return {
    estimation: null,
    production: null,
    config: { ...DEFAULT_OPTIMIZATION_CONFIG },
  };
}
