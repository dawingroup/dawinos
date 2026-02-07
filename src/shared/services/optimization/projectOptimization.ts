/**
 * Project-Level Optimization Actions
 * Runs optimization on project data and saves results to optimizationState
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  serverTimestamp,
  deleteField,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type {
  Project,
  EstimationResult,
  ProductionResult,
  SheetSummary,
  NestingSheet,
  CutOperation,
  OptimizationConfig,
  PartPlacement,
  WasteRegion,
  Timestamp,
  MaterialType,
  TimberSummary,
  LinearStockSummary,
  LinearCuttingResult,
} from '@/shared/types';
import type { PartEntry } from '@/modules/design-manager/types';
import { optimizationService, type Panel, type OptimizationResult } from './OptimizationService';
import { TimberOptimizationService } from './TimberOptimizationService';
import { LinearStockOptimizationService } from './LinearStockOptimizationService';
import { GlassOptimizationService } from './GlassOptimizationService';
import { getMaterialPriceByName } from '@/modules/inventory/services/inventoryPriceService';
import { updateOptimizationRAG } from '../ragService';

// Collection names
const PROJECTS_COLLECTION = 'designProjects';
const DESIGN_ITEMS_SUBCOLLECTION = 'designItems';

// ============================================
// Types
// ============================================

export interface CutlistPart {
  id: string;
  partNumber: string;
  name: string;
  designItemId: string;
  designItemName: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  materialId: string;
  materialName: string;
  grainDirection: 'length' | 'width' | 'none';
  edgeBanding: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

export interface MaterialBreakdown {
  materialId: string;
  materialName: string;
  thickness: number;
  totalParts: number;
  totalArea: number;
  sheetsRequired: number;
  estimatedCost: number;
}

export interface Remnant {
  id: string;
  sheetId: string;
  x: number;
  y: number;
  length: number;
  width: number;
  area: number;
  reusable: boolean;
}

export interface EdgeBandItem {
  partId: string;
  partName: string;
  edge: 'top' | 'bottom' | 'left' | 'right';
  length: number;
  material: string;
}

// ============================================
// Part Aggregation
// ============================================

/**
 * Aggregate all parts from design items in a project
 * Multiplies part quantities by the design item's requiredQuantity
 */
export async function aggregatePartsFromProject(projectId: string): Promise<CutlistPart[]> {
  const parts: CutlistPart[] = [];
  
  // Get all design items for this project (subcollection under project)
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, DESIGN_ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const designItemId = itemDoc.id;
    const designItemName = itemData.name || itemData.itemCode || 'Unknown';
    
    // Get the design item's required quantity (how many of this item are needed)
    const requiredQuantity = itemData.requiredQuantity || 1;
    
    // Get parts from the design item
    const itemParts: PartEntry[] = itemData.parts || [];
    
    for (const part of itemParts) {
      // Multiply part quantity by design item's required quantity
      const totalQuantity = part.quantity * requiredQuantity;
      
      parts.push({
        id: part.id,
        partNumber: part.partNumber,
        name: part.name,
        designItemId,
        designItemName,
        length: part.length,
        width: part.width,
        thickness: part.thickness,
        quantity: totalQuantity,  // Total = part qty × design item qty
        materialId: part.materialId || '',
        materialName: part.materialName,
        grainDirection: part.grainDirection,
        edgeBanding: part.edgeBanding,
      });
    }
  }
  
  return parts;
}

/**
 * Aggregate standard parts (hinges, screws, edging) from all design items
 * Multiplies quantities by design item's requiredQuantity
 */
export async function aggregateStandardPartsFromProject(projectId: string): Promise<Array<{
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitCost: number;
  designItemId: string;
  designItemName: string;
}>> {
  const parts: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unitCost: number;
    designItemId: string;
    designItemName: string;
  }> = [];
  
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, DESIGN_ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const designItemId = itemDoc.id;
    const designItemName = itemData.name || itemData.itemCode || 'Unknown';
    const requiredQuantity = itemData.requiredQuantity || 1;
    
    const manufacturing = itemData.manufacturing || {};
    const standardParts = manufacturing.standardParts || [];
    
    for (const part of standardParts) {
      parts.push({
        id: part.id,
        name: part.name,
        category: part.category || 'other',
        quantity: (part.quantity || 1) * requiredQuantity,
        unitCost: part.unitCost || 0,
        designItemId,
        designItemName,
      });
    }
  }
  
  return parts;
}

/**
 * Aggregate special parts (luxury/approved items) from all design items
 * Multiplies quantities by design item's requiredQuantity
 */
export async function aggregateSpecialPartsFromProject(projectId: string): Promise<Array<{
  id: string;
  name: string;
  category: string;
  quantity: number;
  supplier: string;
  costing?: {
    currency: string;
    unitCost: number;
    totalLandedCost: number;
  };
  designItemId: string;
  designItemName: string;
}>> {
  const parts: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    supplier: string;
    costing?: {
      currency: string;
      unitCost: number;
      totalLandedCost: number;
    };
    designItemId: string;
    designItemName: string;
  }> = [];
  
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, DESIGN_ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const designItemId = itemDoc.id;
    const designItemName = itemData.name || itemData.itemCode || 'Unknown';
    const requiredQuantity = itemData.requiredQuantity || 1;
    
    const manufacturing = itemData.manufacturing || {};
    const specialParts = manufacturing.specialParts || [];
    
    for (const part of specialParts) {
      parts.push({
        id: part.id,
        name: part.name,
        category: part.category || 'other',
        quantity: (part.quantity || 1) * requiredQuantity,
        supplier: part.supplier || '',
        costing: part.costing,
        designItemId,
        designItemName,
      });
    }
  }
  
  return parts;
}

/**
 * Build a mapping from design material names to inventory material names
 * Multiple design materials may map to the same inventory material
 * This consolidation prevents over-buying sheets
 */
function buildDesignToInventoryMaterialMap(
  project: Project
): Map<string, { inventoryName: string; inventoryId?: string }> {
  const mapping = new Map<string, { inventoryName: string; inventoryId?: string }>();
  const materialPalette = project.materialPalette?.entries || [];
  
  for (const entry of materialPalette) {
    if (entry.inventoryName) {
      mapping.set(entry.designName, {
        inventoryName: entry.inventoryName,
        inventoryId: entry.inventoryId,
      });
      // Also map by normalized name for fuzzy matching
      if (entry.normalizedName && entry.normalizedName !== entry.designName) {
        mapping.set(entry.normalizedName, {
          inventoryName: entry.inventoryName,
          inventoryId: entry.inventoryId,
        });
      }
    }
  }
  
  return mapping;
}

/**
 * Determine material type for a part based on material palette
 */
function getMaterialType(
  part: CutlistPart,
  project: Project
): MaterialType {
  const materialPalette = project.materialPalette?.entries || [];

  // Find matching material palette entry
  const paletteEntry = materialPalette.find(
    entry => entry.designName === part.materialName || entry.normalizedName === part.materialName
  );

  if (paletteEntry) {
    return paletteEntry.materialType;
  }

  // Default to PANEL for backwards compatibility
  return 'PANEL';
}

/**
 * Group parts by material type
 */
function groupPartsByMaterialType(
  parts: CutlistPart[],
  project: Project
): Record<MaterialType, CutlistPart[]> {
  const groups: Record<MaterialType, CutlistPart[]> = {
    PANEL: [],
    SOLID: [],
    VENEER: [],
    EDGE: [],
    TIMBER: [],
    GLASS: [],
    METAL_BAR: [],
    ALUMINIUM: [],
  };

  for (const part of parts) {
    const materialType = getMaterialType(part, project);
    groups[materialType].push(part);
  }

  return groups;
}

/**
 * Extract timber stock definitions from material palette
 */
function extractTimberStock(project: Project) {
  const materialPalette = project.materialPalette?.entries || [];
  const timberStock = materialPalette
    .filter(entry => entry.materialType === 'TIMBER' && entry.timberStock)
    .flatMap(entry => entry.timberStock || []);

  return timberStock;
}

/**
 * Extract linear stock definitions from material palette
 */
function extractLinearStock(project: Project) {
  const materialPalette = project.materialPalette?.entries || [];
  const linearStock = materialPalette
    .filter(entry => (entry.materialType === 'METAL_BAR' || entry.materialType === 'ALUMINIUM') && entry.linearStock)
    .flatMap(entry => entry.linearStock || []);

  return linearStock;
}

/**
 * Extract glass stock definitions from material palette
 */
function extractGlassStock(project: Project) {
  const materialPalette = project.materialPalette?.entries || [];
  const glassStock = materialPalette
    .filter(entry => entry.materialType === 'GLASS' && entry.glassStock)
    .flatMap(entry => entry.glassStock || []);

  return glassStock;
}

/**
 * Extract panel stock definitions from material palette
 * Returns stock sheets keyed by inventory material name
 */
function extractPanelStock(project: Project): Record<string, { material: string; length: number; width: number; thickness: number; cost: number }> {
  const materialPalette = project.materialPalette?.entries || [];
  const stockSheets: Record<string, { material: string; length: number; width: number; thickness: number; cost: number }> = {};

  for (const entry of materialPalette) {
    // Only process panel-type materials with stockSheets configured
    if (['PANEL', 'SOLID', 'VENEER'].includes(entry.materialType) && entry.stockSheets && entry.stockSheets.length > 0) {
      const materialKey = entry.inventoryName || entry.designName;

      // Use the first (or largest) stock sheet for this material
      // In future, we could support multiple stock sizes per material
      const sheet = entry.stockSheets[0];

      stockSheets[materialKey] = {
        material: materialKey,
        length: sheet.length,
        width: sheet.width,
        thickness: sheet.thickness,
        cost: sheet.costPerSheet || entry.unitCost || 0,
      };
    }
  }

  return stockSheets;
}

/**
 * Convert CutlistParts to optimization Panel format
 * Uses inventory material name for grouping when available (via materialMap)
 * This ensures parts with different design materials but same inventory material
 * are nested together on the same sheets
 */
function partsToOptimizationPanels(
  parts: CutlistPart[],
  materialMap?: Map<string, { inventoryName: string; inventoryId?: string }>
): Panel[] {
  return parts.map(part => {
    // Use inventory material if mapped, otherwise use design material
    const mappedMaterial = materialMap?.get(part.materialName);
    const nestingMaterial = mappedMaterial?.inventoryName || part.materialName;

    return {
      id: part.id,
      label: `${part.designItemName} - ${part.name}`,
      cabinet: part.designItemName,
      material: nestingMaterial, // Use inventory material for nesting grouping
      thickness: part.thickness,
      length: part.length,
      width: part.width,
      quantity: part.quantity,
      grain: part.grainDirection === 'none' ? 0 : 1,
    };
  });
}

/**
 * Fetch dynamic material costs from material palette mappings
 * Uses the MAPPED inventory material's cost, not the design material name
 * Returns a map of design material name -> cost per sheet
 */
async function fetchMaterialCosts(
  parts: CutlistPart[],
  project: Project
): Promise<Record<string, number>> {
  const costs: Record<string, number> = {};
  const uniqueMaterials = new Map<string, number>(); // material -> thickness
  
  // Get unique materials from parts
  for (const part of parts) {
    if (part.materialName && !uniqueMaterials.has(part.materialName)) {
      uniqueMaterials.set(part.materialName, part.thickness);
    }
  }
  
  // Get material palette from project
  const materialPalette = project.materialPalette?.entries || [];
  
  for (const [designMaterialName, thickness] of uniqueMaterials) {
    const normalizedName = designMaterialName.toLowerCase().trim();
    
    // 1. First priority: Look up in material palette (mapped materials)
    // Use flexible matching: case-insensitive and check both designName and normalizedName
    const paletteEntry = materialPalette.find(entry => {
      const entryDesignName = entry.designName?.toLowerCase().trim() || '';
      const entryNormalizedName = entry.normalizedName?.toLowerCase().trim() || '';
      const searchName = normalizedName;

      // Direct match
      if (entryDesignName === searchName || entryNormalizedName === searchName) {
        return true;
      }

      // Fuzzy match: Check if search name starts with entry name (handles suffixes like " 1", " 2")
      if (searchName.startsWith(entryDesignName + ' ') || searchName.startsWith(entryNormalizedName + ' ')) {
        return true;
      }

      return false;
    });

    if (paletteEntry?.unitCost && paletteEntry.unitCost > 0) {
      // Use the mapped material's cost from palette
      costs[designMaterialName] = paletteEntry.unitCost;
      console.log(`[Estimation] Using palette price for "${designMaterialName}": ${paletteEntry.unitCost} UGX`);
      continue;
    }
    
    // 2. Second priority: Try inventory lookup by mapped inventory name
    if (paletteEntry?.inventoryName) {
      try {
        const priceResult = await getMaterialPriceByName(
          paletteEntry.inventoryName, 
          thickness, 
          project.id
        );
        if (priceResult.found && priceResult.price?.costPerUnit) {
          costs[designMaterialName] = priceResult.price.costPerUnit;
          continue;
        }
      } catch {
        // Continue to fallback
      }
    }
    
    // 3. Third priority: Try inventory lookup by design name (legacy)
    try {
      const priceResult = await getMaterialPriceByName(designMaterialName, thickness, project.id);
      if (priceResult.found && priceResult.price?.costPerUnit) {
        costs[designMaterialName] = priceResult.price.costPerUnit;
        continue;
      }
    } catch {
      // Continue to fallback
    }
    
    // 4. Fallback pricing
    if (!costs[designMaterialName]) {
      const fallbackPrices: Record<number, number> = {
        3: 45000, 6: 65000, 9: 85000, 12: 105000, 15: 125000,
        16: 135000, 18: 155000, 22: 185000, 25: 210000,
      };
      costs[designMaterialName] = fallbackPrices[thickness] || 150000;
      console.warn(`[Estimation] No mapped cost for "${designMaterialName}", using fallback`);
    }
  }
  
  return costs;
}

// ============================================
// Estimation Mode
// ============================================

/**
 * Run estimation and save to project.optimizationState.estimation
 * Fast mode with ~70% utilization assumption, adds 15% buffer
 */
export async function runProjectEstimation(
  projectId: string,
  userId: string
): Promise<EstimationResult> {
  // Get project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  
  // Aggregate parts from all design items
  const parts = await aggregatePartsFromProject(projectId);
  
  if (parts.length === 0) {
    throw new Error('No parts found in project design items');
  }
  
  // Build material map to consolidate design materials to inventory materials
  // This prevents over-buying when multiple design materials map to the same inventory material
  const materialMap = buildDesignToInventoryMaterialMap(project);
  
  // Convert to optimization format using inventory materials for grouping
  const panels = partsToOptimizationPanels(parts, materialMap);
  
  // Get config or use defaults
  const config = project.optimizationState?.config;
  
  // Fetch dynamic material costs from material palette mappings
  const dynamicCosts = await fetchMaterialCosts(parts, project);
  
  // Build stock sheets with dynamic costs
  const stockSheets: Record<string, { material: string; length: number; width: number; thickness: number; cost: number }> = {};

  // First, extract panel stock from material palette (user-configured stock sizes)
  const paletteStock = extractPanelStock(project);
  for (const [materialKey, sheet] of Object.entries(paletteStock)) {
    stockSheets[materialKey] = {
      ...sheet,
      // Override with dynamic cost from inventory if available
      cost: dynamicCosts[materialKey] || sheet.cost,
    };
  }

  // Second, use config stock sheets (legacy config-based stock)
  if (config?.stockSheets) {
    for (const sheet of config.stockSheets) {
      // Only add if not already defined from palette
      if (!stockSheets[sheet.materialName]) {
        stockSheets[sheet.materialName] = {
          material: sheet.materialName,
          length: sheet.length,
          width: sheet.width,
          thickness: sheet.thickness,
          cost: dynamicCosts[sheet.materialName] || sheet.costPerSheet,
        };
      }
    }
  }

  // Add any materials from parts that aren't in config or palette
  // Use inventory material name for grouping (matches what partsToOptimizationPanels uses)
  for (const part of parts) {
    const mappedMaterial = materialMap.get(part.materialName);
    const inventoryMaterial = mappedMaterial?.inventoryName || part.materialName;

    if (inventoryMaterial && !stockSheets[inventoryMaterial]) {
      stockSheets[inventoryMaterial] = {
        material: inventoryMaterial,
        length: 2440,  // Default sheet size
        width: 1220,
        thickness: part.thickness,
        cost: dynamicCosts[part.materialName] || 150000,
      };
    }
  }
  
  // ============================================
  // Group parts by material type and run type-specific optimization
  // ============================================
  const partsByType = groupPartsByMaterialType(parts, project);

  // Panel materials (sheet goods) - existing optimization
  let sheetSummary: SheetSummary[] = [];
  let panelCost = 0;
  let totalSheetsCount = 0;
  let totalPanelParts = 0;
  let wasteEstimate = 0;

  if (partsByType.PANEL.length > 0 || partsByType.SOLID.length > 0 || partsByType.VENEER.length > 0) {
    const panelParts = [...partsByType.PANEL, ...partsByType.SOLID, ...partsByType.VENEER];
    const panelPanels = partsToOptimizationPanels(panelParts, materialMap);

    const panelResult = optimizationService.optimize(panelPanels, {
      mode: 'ESTIMATION',
      bladeKerf: config?.kerf || 4,
      stockSheets: Object.keys(stockSheets).length > 0 ? stockSheets : undefined,
    });

    sheetSummary = buildSheetSummary(panelResult, panelParts);
    wasteEstimate = panelResult.totalWastedArea / (panelResult.totalUsedArea + panelResult.totalWastedArea) * 100;
    panelCost = (panelResult.estimatedMaterialCost || 0) * 1.15; // 15% buffer
    totalSheetsCount = panelResult.totalSheets;
    totalPanelParts = panelResult.totalPanels;
  }

  // Timber materials (dimensional lumber)
  let timberSummary: TimberSummary[] | undefined;
  let timberCost = 0;
  let totalTimberSticks = 0;

  if (partsByType.TIMBER.length > 0) {
    const timberStock = extractTimberStock(project);

    if (timberStock.length > 0) {
      const timberService = new TimberOptimizationService(config?.kerf || 4, config?.minimumUsableOffcut || 300);
      // Map timber parts using inventory material names for matching with stock
      const timberParts = partsByType.TIMBER.map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          width: part.width,
          thickness: part.thickness,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
        };
      });

      timberSummary = await timberService.estimateTimber(timberParts, timberStock);
      timberCost = timberSummary.reduce((sum, s) => sum + s.estimatedCost, 0);
      totalTimberSticks = timberSummary.reduce((sum, s) => sum + s.sticksRequired, 0);
    }
  }

  // Linear stock materials (metal bars, aluminium)
  let linearStockSummary: LinearStockSummary[] | undefined;
  let linearStockCost = 0;
  let totalLinearBars = 0;

  if (partsByType.METAL_BAR.length > 0 || partsByType.ALUMINIUM.length > 0) {
    const linearStock = extractLinearStock(project);

    if (linearStock.length > 0) {
      const linearService = new LinearStockOptimizationService(config?.kerf || 4, config?.minimumUsableOffcut || 300);
      // Map linear parts using inventory material names for matching with stock
      const linearParts = [...partsByType.METAL_BAR, ...partsByType.ALUMINIUM].map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
          profile: `${part.thickness}x${part.width}`, // TODO: Get actual profile from material palette
        };
      });

      linearStockSummary = await linearService.estimateLinearStock(linearParts, linearStock);
      linearStockCost = linearStockSummary.reduce((sum, s) => sum + s.estimatedCost, 0);
      totalLinearBars = linearStockSummary.reduce((sum, s) => sum + s.barsRequired, 0);
    }
  }

  // Glass materials (handled similarly to panels but with safety margins)
  if (partsByType.GLASS.length > 0) {
    const glassStock = extractGlassStock(project);

    if (glassStock.length > 0) {
      const glassService = new GlassOptimizationService(config?.kerf || 4);
      // Map glass parts using inventory material names for matching with stock
      const glassParts = partsByType.GLASS.map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          width: part.width,
          thickness: part.thickness,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
          grain: part.grainDirection === 'none' ? 0 : 1,
        };
      });

      const glassSummary = await glassService.estimateGlass(glassParts, glassStock);
      // Add glass to sheet summary
      sheetSummary.push(...glassSummary);
      const glassCost = glassSummary.reduce((sum, s) => sum + s.estimatedCost, 0);
      panelCost += glassCost;
      totalSheetsCount += glassSummary.reduce((sum, s) => sum + s.sheetsRequired, 0);
    }
  }

  // Aggregate standard and special parts for cost calculation
  const [standardParts, specialParts] = await Promise.all([
    aggregateStandardPartsFromProject(projectId),
    aggregateSpecialPartsFromProject(projectId),
  ]);

  // Calculate standard parts cost (quantity × unitCost)
  const standardPartsCost = standardParts.reduce(
    (sum, p) => sum + (p.quantity * p.unitCost), 0
  );

  // Calculate special parts cost (unitCost × quantity for proper multiplication)
  const specialPartsCost = specialParts.reduce(
    (sum, p) => sum + (p.quantity * (p.costing?.unitCost || 0)), 0
  );

  // Total cost includes all material types
  const totalCost = panelCost + timberCost + linearStockCost + standardPartsCost + specialPartsCost;
  
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };

  const estimation: EstimationResult = {
    // Panel materials
    sheetSummary,
    roughCost: panelCost,

    // Timber materials
    timberSummary,
    timberCost,

    // Linear stock (metal bars, aluminium)
    linearStockSummary,
    linearStockCost,

    // Other costs
    standardPartsCost,
    specialPartsCost,
    totalCost,

    // Statistics
    wasteEstimate,
    totalPartsCount: parts.length,
    totalSheetsCount,
    totalTimberSticks,
    totalLinearBars,
    totalStandardParts: standardParts.reduce((sum, p) => sum + p.quantity, 0),
    totalSpecialParts: specialParts.reduce((sum, p) => sum + p.quantity, 0),

    validAt: timestamp,
  };
  
  // Save to project - explicitly set fields and clear invalidation
  await updateDoc(projectRef, {
    // Panel materials
    'optimizationState.estimation.sheetSummary': estimation.sheetSummary,
    'optimizationState.estimation.roughCost': estimation.roughCost,

    // Timber materials
    'optimizationState.estimation.timberSummary': estimation.timberSummary || deleteField(),
    'optimizationState.estimation.timberCost': estimation.timberCost || deleteField(),

    // Linear stock
    'optimizationState.estimation.linearStockSummary': estimation.linearStockSummary || deleteField(),
    'optimizationState.estimation.linearStockCost': estimation.linearStockCost || deleteField(),

    // Other costs
    'optimizationState.estimation.standardPartsCost': estimation.standardPartsCost,
    'optimizationState.estimation.specialPartsCost': estimation.specialPartsCost,
    'optimizationState.estimation.totalCost': estimation.totalCost,

    // Statistics
    'optimizationState.estimation.wasteEstimate': estimation.wasteEstimate,
    'optimizationState.estimation.totalPartsCount': estimation.totalPartsCount,
    'optimizationState.estimation.totalSheetsCount': estimation.totalSheetsCount,
    'optimizationState.estimation.totalTimberSticks': estimation.totalTimberSticks || deleteField(),
    'optimizationState.estimation.totalLinearBars': estimation.totalLinearBars || deleteField(),
    'optimizationState.estimation.totalStandardParts': estimation.totalStandardParts,
    'optimizationState.estimation.totalSpecialParts': estimation.totalSpecialParts,

    // Metadata
    'optimizationState.estimation.validAt': estimation.validAt,
    'optimizationState.estimation.invalidatedAt': deleteField(),
    'optimizationState.estimation.invalidationReasons': deleteField(),
    'optimizationState.lastEstimationRun': timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Update RAG status
  const updatedProject = { ...project, optimizationState: { ...project.optimizationState, estimation } } as Project;
  const ragStatus = updateOptimizationRAG(updatedProject);
  
  await updateDoc(projectRef, {
    optimizationRAG: ragStatus,
  });
  
  return estimation;
}

/**
 * Build sheet summary from optimization result
 */
function buildSheetSummary(result: OptimizationResult, parts: CutlistPart[]): SheetSummary[] {
  const summaries: SheetSummary[] = [];
  
  for (const [material, sheetCount] of Object.entries(result.sheetsByMaterial)) {
    const materialParts = parts.filter(p => p.materialName === material);
    const thickness = materialParts[0]?.thickness || 18;
    
    // Estimate based on area
    const totalArea = materialParts.reduce((sum, p) => sum + (p.length * p.width * p.quantity), 0);
    const stockArea = 2440 * 1220; // Default sheet size
    const utilizationPercent = (totalArea / (sheetCount * stockArea)) * 100;
    
    summaries.push({
      materialId: material,
      materialName: material,
      thickness,
      sheetSize: { length: 2440, width: 1220 },
      sheetsRequired: sheetCount,
      partsOnSheet: Math.ceil(materialParts.reduce((sum, p) => sum + p.quantity, 0) / sheetCount),
      utilizationPercent: Math.min(utilizationPercent, 100),
      wasteArea: (sheetCount * stockArea) - totalArea,
      estimatedCost: (result.estimatedMaterialCost || 0) * (sheetCount / result.totalSheets),
    });
  }
  
  return summaries;
}

// ============================================
// Production Mode
// ============================================

/**
 * Run production optimization and save to project.optimizationState.production
 * Full nesting with guillotine algorithm, targets 85%+ yield
 */
export async function runProjectProduction(
  projectId: string,
  userId: string
): Promise<ProductionResult> {
  // Get project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  
  // Check if estimation exists
  if (!project.optimizationState?.estimation) {
    throw new Error('Run estimation first before production optimization');
  }
  
  // Aggregate parts from all design items
  const parts = await aggregatePartsFromProject(projectId);
  
  if (parts.length === 0) {
    throw new Error('No parts found in project design items');
  }
  
  // Build material map to consolidate design materials to inventory materials
  // This prevents over-buying when multiple design materials map to the same inventory material
  const materialMap = buildDesignToInventoryMaterialMap(project);
  
  // Convert to optimization format using inventory materials for grouping
  const panels = partsToOptimizationPanels(parts, materialMap);
  
  // Get config
  const config = project.optimizationState?.config;
  
  // Fetch dynamic material costs from material palette mappings
  const dynamicCosts = await fetchMaterialCosts(parts, project);
  
  // Build stock sheets with dynamic costs
  const stockSheets: Record<string, { material: string; length: number; width: number; thickness: number; cost: number }> = {};

  // First, extract panel stock from material palette (user-configured stock sizes)
  const paletteStock = extractPanelStock(project);
  for (const [materialKey, sheet] of Object.entries(paletteStock)) {
    stockSheets[materialKey] = {
      ...sheet,
      // Override with dynamic cost from inventory if available
      cost: dynamicCosts[materialKey] || sheet.cost,
    };
  }

  // Second, use config stock sheets (legacy config-based stock)
  if (config?.stockSheets) {
    for (const sheet of config.stockSheets) {
      // Only add if not already defined from palette
      if (!stockSheets[sheet.materialName]) {
        stockSheets[sheet.materialName] = {
          material: sheet.materialName,
          length: sheet.length,
          width: sheet.width,
          thickness: sheet.thickness,
          cost: dynamicCosts[sheet.materialName] || sheet.costPerSheet,
        };
      }
    }
  }

  // Add any materials from parts that aren't in config or palette
  // Use inventory material name for grouping (matches what partsToOptimizationPanels uses)
  for (const part of parts) {
    const mappedMaterial = materialMap.get(part.materialName);
    const inventoryMaterial = mappedMaterial?.inventoryName || part.materialName;

    if (inventoryMaterial && !stockSheets[inventoryMaterial]) {
      stockSheets[inventoryMaterial] = {
        material: inventoryMaterial,
        length: 2440,
        width: 1220,
        thickness: part.thickness,
        cost: dynamicCosts[part.materialName] || 150000,
      };
    }
  }

  // ============================================
  // Group parts by material type and run type-specific optimization
  // ============================================
  const partsByType = groupPartsByMaterialType(parts, project);

  // Panel materials (sheet goods) - existing optimization
  let nestingSheets: NestingSheet[] = [];
  let panelYield = 0;

  if (partsByType.PANEL.length > 0 || partsByType.SOLID.length > 0 || partsByType.VENEER.length > 0) {
    const panelParts = [...partsByType.PANEL, ...partsByType.SOLID, ...partsByType.VENEER];
    const panelPanels = partsToOptimizationPanels(panelParts, materialMap);

    const panelResult = optimizationService.optimize(panelPanels, {
      mode: 'PRODUCTION',
      bladeKerf: config?.kerf || 4,
      stockSheets,
    });

    nestingSheets = buildNestingSheets(panelResult, panelParts);
    panelYield = panelResult.averageUtilization;
  }

  // Timber materials (dimensional lumber) - FFD linear cutting
  let timberCuttingResults: LinearCuttingResult[] | undefined;
  let timberYield = 0;

  if (partsByType.TIMBER.length > 0) {
    const timberStock = extractTimberStock(project);

    if (timberStock.length > 0) {
      const timberService = new TimberOptimizationService(config?.kerf || 4, config?.minimumUsableOffcut || 300);
      // Map timber parts using inventory material names for matching with stock
      const timberParts = partsByType.TIMBER.map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          width: part.width,
          thickness: part.thickness,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
        };
      });

      timberCuttingResults = await timberService.optimizeTimber(timberParts, timberStock, config?.targetYield || 85);

      // Calculate average utilization
      if (timberCuttingResults.length > 0) {
        timberYield = timberCuttingResults.reduce((sum, r) => sum + r.utilizationPercent, 0) / timberCuttingResults.length;
      }
    }
  }

  // Linear stock materials (metal bars, aluminium) - FFD linear cutting
  let linearStockCuttingResults: LinearCuttingResult[] | undefined;
  let linearStockYield = 0;

  if (partsByType.METAL_BAR.length > 0 || partsByType.ALUMINIUM.length > 0) {
    const linearStock = extractLinearStock(project);

    if (linearStock.length > 0) {
      const linearService = new LinearStockOptimizationService(config?.kerf || 4, config?.minimumUsableOffcut || 300);
      // Map linear parts using inventory material names for matching with stock
      const linearParts = [...partsByType.METAL_BAR, ...partsByType.ALUMINIUM].map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
          profile: `${part.thickness}x${part.width}`, // TODO: Get actual profile from material palette
        };
      });

      linearStockCuttingResults = await linearService.optimizeLinearStock(linearParts, linearStock, config?.targetYield || 85);

      // Calculate average utilization
      if (linearStockCuttingResults.length > 0) {
        linearStockYield = linearStockCuttingResults.reduce((sum, r) => sum + r.utilizationPercent, 0) / linearStockCuttingResults.length;
      }
    }
  }

  // Glass materials (2D nesting with safety margins)
  if (partsByType.GLASS.length > 0) {
    const glassStock = extractGlassStock(project);

    if (glassStock.length > 0) {
      const glassService = new GlassOptimizationService(config?.kerf || 4);
      // Map glass parts using inventory material names for matching with stock
      const glassParts = partsByType.GLASS.map(part => {
        const mappedMaterial = materialMap.get(part.materialName);
        return {
          partId: part.id,
          partName: part.name,
          designItemId: part.designItemId,
          designItemName: part.designItemName,
          length: part.length,
          width: part.width,
          thickness: part.thickness,
          quantity: part.quantity,
          // Use inventory material name for matching with stock
          materialName: mappedMaterial?.inventoryName || part.materialName,
          grain: part.grainDirection === 'none' ? 0 : 1,
        };
      });

      const glassSheets = await glassService.optimizeGlass(glassParts, glassStock, config?.targetYield || 75);
      nestingSheets.push(...glassSheets);

      // Update panel yield to include glass
      const glassYield = glassSheets.reduce((sum, s) => sum + s.utilizationPercent, 0) / (glassSheets.length || 1);
      if (nestingSheets.length > glassSheets.length) {
        // Weighted average if we have both panels and glass
        const panelSheetCount = nestingSheets.length - glassSheets.length;
        panelYield = (panelYield * panelSheetCount + glassYield * glassSheets.length) / nestingSheets.length;
      } else {
        panelYield = glassYield;
      }
    }
  }

  // Calculate overall yield (weighted average across all material types)
  const yields = [];
  if (nestingSheets.length > 0) yields.push({ yield: panelYield, weight: nestingSheets.length });
  if (timberCuttingResults && timberCuttingResults.length > 0) yields.push({ yield: timberYield, weight: timberCuttingResults.length });
  if (linearStockCuttingResults && linearStockCuttingResults.length > 0) yields.push({ yield: linearStockYield, weight: linearStockCuttingResults.length });

  const totalWeight = yields.reduce((sum, y) => sum + y.weight, 0);
  const optimizedYield = yields.length > 0
    ? yields.reduce((sum, y) => sum + (y.yield * y.weight), 0) / totalWeight
    : 0;

  // Build cut sequence from nesting sheets (panels and glass only)
  const cutSequence = buildCutSequence(nestingSheets);
  
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };

  const production: ProductionResult = {
    // Panel materials (sheet goods)
    nestingSheets,
    cutSequence,

    // Timber materials (dimensional lumber)
    timberCuttingResults,

    // Linear stock (metal bars, aluminium)
    linearStockCuttingResults,

    // Optimization metrics
    optimizedYield,
    sheetYield: nestingSheets.length > 0 ? panelYield : undefined,
    timberYield: timberCuttingResults && timberCuttingResults.length > 0 ? timberYield : undefined,
    linearStockYield: linearStockCuttingResults && linearStockCuttingResults.length > 0 ? linearStockYield : undefined,

    totalCuttingLength: calculateTotalCuttingLength(cutSequence),
    estimatedCutTime: estimateCutTime(cutSequence),

    validAt: timestamp,
  };
  
  // Save to project - explicitly set fields and clear invalidation
  await updateDoc(projectRef, {
    // Panel materials
    'optimizationState.production.nestingSheets': production.nestingSheets,
    'optimizationState.production.cutSequence': production.cutSequence,

    // Timber materials
    'optimizationState.production.timberCuttingResults': production.timberCuttingResults || deleteField(),

    // Linear stock
    'optimizationState.production.linearStockCuttingResults': production.linearStockCuttingResults || deleteField(),

    // Optimization metrics
    'optimizationState.production.optimizedYield': production.optimizedYield,
    'optimizationState.production.sheetYield': production.sheetYield || deleteField(),
    'optimizationState.production.timberYield': production.timberYield || deleteField(),
    'optimizationState.production.linearStockYield': production.linearStockYield || deleteField(),

    'optimizationState.production.totalCuttingLength': production.totalCuttingLength,
    'optimizationState.production.estimatedCutTime': production.estimatedCutTime,

    // Metadata
    'optimizationState.production.validAt': production.validAt,
    'optimizationState.production.invalidatedAt': deleteField(),
    'optimizationState.production.invalidationReasons': deleteField(),
    'optimizationState.lastProductionRun': timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Update RAG status
  const updatedProject = { ...project, optimizationState: { ...project.optimizationState, production } } as Project;
  const ragStatus = updateOptimizationRAG(updatedProject);
  
  await updateDoc(projectRef, {
    optimizationRAG: ragStatus,
  });
  
  return production;
}

/**
 * Build nesting sheets from optimization result
 */
function buildNestingSheets(result: OptimizationResult, parts: CutlistPart[]): NestingSheet[] {
  return result.sheets.map((sheet, index) => {
    const placements: PartPlacement[] = sheet.placements.map(p => {
      const originalPart = parts.find(part => 
        p.panel.label.includes(part.name) || p.panel.id === part.id
      );
      
      // Store PLACED dimensions (already accounting for rotation)
      // These match what the NestingStudio displays
      return {
        partId: p.panel.id || `part-${index}`,
        partName: p.label,
        designItemId: originalPart?.designItemId || '',
        designItemName: originalPart?.designItemName || '',
        x: p.x,
        y: p.y,
        length: p.width,   // Placed width (horizontal on sheet)
        width: p.height,   // Placed height (vertical on sheet)
        rotated: p.rotated,
        grainAligned: !p.rotated || p.panel.grain === 0,
        // Copy edge banding from original part data
        edgeBanding: originalPart?.edgeBanding ? {
          top: originalPart.edgeBanding.top,
          bottom: originalPart.edgeBanding.bottom,
          left: originalPart.edgeBanding.left,
          right: originalPart.edgeBanding.right,
        } : undefined,
      };
    });
    
    // Calculate waste regions from guillotine cut algorithm
    const wasteRegions = calculateWasteRegions({
      width: sheet.width,
      height: sheet.height,
      wastedArea: sheet.wastedArea,
      wasteRegions: sheet.wasteRegions,
    }, placements);
    
    return {
      id: sheet.id,
      sheetIndex: index,
      stockSheetId: sheet.stockSheet.material,
      materialId: sheet.material,
      materialName: sheet.material,
      sheetSize: { length: sheet.width, width: sheet.height },
      placements,
      utilizationPercent: sheet.utilization,
      wasteArea: sheet.wastedArea,
      wasteRegions,
    };
  });
}

/**
 * Calculate waste regions on a sheet from guillotine cut free rectangles
 * For panel saw cutting, waste regions are the remaining free rectangles after all parts are placed
 */
function calculateWasteRegions(
  sheet: { width: number; height: number; wastedArea: number; wasteRegions?: { x: number; y: number; width: number; height: number }[] },
  _placements: PartPlacement[],
  minimumUsableSize: { width: number; height: number } = { width: 200, height: 200 }
): WasteRegion[] {
  const regions: WasteRegion[] = [];
  
  // Use actual waste regions from guillotine algorithm if available
  if (sheet.wasteRegions && sheet.wasteRegions.length > 0) {
    for (const rect of sheet.wasteRegions) {
      const area = rect.width * rect.height;
      // A region is reusable if both dimensions are >= minimum usable size
      const reusable = rect.width >= minimumUsableSize.width && rect.height >= minimumUsableSize.height;
      
      regions.push({
        x: rect.x,
        y: rect.y,
        length: rect.width,   // Horizontal dimension
        width: rect.height,   // Vertical dimension
        area,
        reusable,
      });
    }
  } else if (sheet.wastedArea > 0) {
    // Fallback: create estimated waste region if no detailed regions available
    // This shouldn't happen with panel saw cuts but provides backwards compatibility
    const estimatedSide = Math.sqrt(sheet.wastedArea);
    regions.push({
      x: sheet.width - estimatedSide,
      y: sheet.height - estimatedSide,
      length: estimatedSide,
      width: estimatedSide,
      area: sheet.wastedArea,
      reusable: estimatedSide >= minimumUsableSize.width && estimatedSide >= minimumUsableSize.height,
    });
  }
  
  return regions;
}

/**
 * Build cut sequence from nesting sheets
 */
function buildCutSequence(sheets: NestingSheet[]): CutOperation[] {
  const operations: CutOperation[] = [];
  let sequence = 1;
  
  for (const sheet of sheets) {
    // Generate cuts for each sheet
    // Simplified: just create horizontal and vertical cuts based on placements
    const placements = [...sheet.placements].sort((a, b) => a.y - b.y || a.x - b.x);
    
    for (const placement of placements) {
      // Rip cut (vertical)
      operations.push({
        id: `cut-${sequence}`,
        sheetId: sheet.id,
        sequence: sequence++,
        type: 'rip',
        startX: placement.x + placement.length,
        startY: 0,
        endX: placement.x + placement.length,
        endY: sheet.sheetSize.width,
        length: sheet.sheetSize.width,
        resultingParts: [placement.partId],
      });
      
      // Crosscut (horizontal)
      operations.push({
        id: `cut-${sequence}`,
        sheetId: sheet.id,
        sequence: sequence++,
        type: 'crosscut',
        startX: 0,
        startY: placement.y + placement.width,
        endX: placement.x + placement.length,
        endY: placement.y + placement.width,
        length: placement.x + placement.length,
        resultingParts: [placement.partId],
      });
    }
  }
  
  return operations;
}

/**
 * Calculate total cutting length
 */
function calculateTotalCuttingLength(cuts: CutOperation[]): number {
  return cuts.reduce((sum, cut) => sum + cut.length, 0);
}

/**
 * Estimate cut time based on cut sequence
 */
function estimateCutTime(cuts: CutOperation[]): number {
  // Assume 2 seconds per 100mm of cutting
  const totalLength = calculateTotalCuttingLength(cuts);
  return Math.ceil(totalLength / 100 * 2 / 60); // minutes
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if optimization needs re-run
 */
export function needsReOptimization(
  project: Project,
  mode: 'estimation' | 'production'
): boolean {
  const state = project.optimizationState?.[mode];
  return !state || !!state.invalidatedAt;
}

/**
 * Get optimization status summary
 */
export function getOptimizationStatus(project: Project): {
  estimationStatus: 'none' | 'valid' | 'stale';
  productionStatus: 'none' | 'valid' | 'stale';
  canRunProduction: boolean;
} {
  const estimation = project.optimizationState?.estimation;
  const production = project.optimizationState?.production;
  
  return {
    estimationStatus: !estimation ? 'none' : estimation.invalidatedAt ? 'stale' : 'valid',
    productionStatus: !production ? 'none' : production.invalidatedAt ? 'stale' : 'valid',
    canRunProduction: !!estimation && !estimation.invalidatedAt,
  };
}

/**
 * Update optimization config
 */
export async function updateProjectConfig(
  projectId: string, 
  changes: Partial<OptimizationConfig>,
  userId: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  // Build update object for each changed field
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  
  if (changes.kerf !== undefined) {
    updates['optimizationState.config.kerf'] = changes.kerf;
  }
  if (changes.targetYield !== undefined) {
    updates['optimizationState.config.targetYield'] = changes.targetYield;
  }
  if (changes.grainMatching !== undefined) {
    updates['optimizationState.config.grainMatching'] = changes.grainMatching;
  }
  if (changes.allowRotation !== undefined) {
    updates['optimizationState.config.allowRotation'] = changes.allowRotation;
  }
  if (changes.stockSheets !== undefined) {
    updates['optimizationState.config.stockSheets'] = changes.stockSheets;
  }
  
  await updateDoc(projectRef, updates);
}

/**
 * Clear estimation and mark for re-run
 */
export async function clearEstimation(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  await updateDoc(projectRef, {
    'optimizationState.estimation': null,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Clear production and mark for re-run
 */
export async function clearProduction(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  await updateDoc(projectRef, {
    'optimizationState.production': null,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}
