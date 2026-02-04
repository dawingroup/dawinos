/**
 * Material Harvester Service
 * Scans design items to build and maintain project material palette
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  serverTimestamp,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { 
  Project, 
  MaterialPalette, 
  MaterialPaletteEntry, 
  MaterialType,
  OptimizationStockSheet,
  Timestamp,
} from '@/shared/types';
import type { PartEntry } from '../types';

// Collection names
const PROJECTS_COLLECTION = 'designProjects';
const DESIGN_ITEMS_SUBCOLLECTION = 'designItems';

// ============================================
// Types
// ============================================

export interface HarvestResult {
  newMaterials: string[];
  existingMaterials: string[];
  removedMaterials: string[];
  totalMaterials: number;
  unmappedCount: number;
}

export interface MaterialUsage {
  designName: string;
  normalizedName: string;
  thickness: number;
  usageCount: number;
  designItemIds: Set<string>;
}

// ============================================
// Normalization Utilities
// ============================================

/**
 * Normalize material name for consistent matching
 */
export function normalizeMaterialName(name: string): string {
  if (!name) return 'unknown';
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/[_-]+/g, ' ')         // Replace underscores/dashes with spaces
    .replace(/\bmm\b/gi, '')        // Remove "mm" unit
    .replace(/\d+\s*mm/gi, '')      // Remove thickness like "18mm"
    .replace(/\s+/g, ' ')           // Collapse again
    .trim();
}

/**
 * Extract thickness from material name
 */
export function extractThickness(name: string): number {
  const match = name.match(/(\d+)\s*mm/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 18; // Default thickness
}

/**
 * Detect material type from name
 */
export function detectMaterialType(name: string): MaterialType {
  const lower = name.toLowerCase();

  // Edge banding
  if (lower.includes('edge') || lower.includes('banding')) {
    return 'EDGE';
  }

  // Veneer
  if (lower.includes('veneer')) {
    return 'VENEER';
  }

  // Glass
  if (lower.includes('glass')) {
    return 'GLASS';
  }

  // Aluminium
  if (lower.includes('aluminium') || lower.includes('aluminum') || lower.includes('alu ')) {
    return 'ALUMINIUM';
  }

  // Metal bars
  if (lower.includes('steel') || lower.includes('metal') || lower.includes('bar') ||
      lower.includes('tube') || lower.includes('pipe') || lower.includes('angle') ||
      lower.includes('channel') || lower.includes('shs') || lower.includes('rhs')) {
    return 'METAL_BAR';
  }

  // Timber (dimensional lumber)
  if (lower.includes('timber') || lower.includes('lumber') || lower.includes('pine') ||
      lower.includes('oak') || lower.includes('meranti') || lower.includes('par') ||
      lower.includes('hardwood') || lower.includes('softwood') || lower.includes('beam') ||
      lower.includes('post') || lower.includes('joist')) {
    return 'TIMBER';
  }

  // Solid wood (legacy - less specific than timber)
  if (lower.includes('solid')) {
    return 'SOLID';
  }

  // Default to panel (sheet goods)
  return 'PANEL';
}

// ============================================
// Harvester Functions
// ============================================

/**
 * Scan all design items, extract materials, update palette
 * Returns what changed for invalidation detection
 */
export async function harvestMaterials(
  projectId: string,
  userId: string
): Promise<HarvestResult> {
  // Get project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  const previousPalette = project.materialPalette?.entries || [];
  const previousNames = new Set(previousPalette.map(e => e.normalizedName));
  
  // Aggregate all materials from design items (subcollection under project)
  const materialUsage = new Map<string, MaterialUsage>();
  
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, DESIGN_ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  console.log('[MaterialHarvester] Found design items:', itemsSnapshot.docs.length);
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const designItemId = itemDoc.id;
    const parts: PartEntry[] = itemData.parts || [];
    
    console.log(`[MaterialHarvester] Item ${designItemId} has ${parts.length} parts`);
    
    for (const part of parts) {
      const designName = part.materialName || part.materialId || 'Unknown';
      const normalizedName = normalizeMaterialName(designName);
      const thickness = part.thickness || extractThickness(designName);
      
      const key = `${normalizedName}|${thickness}`;
      
      if (!materialUsage.has(key)) {
        materialUsage.set(key, {
          designName,
          normalizedName,
          thickness,
          usageCount: 0,
          designItemIds: new Set(),
        });
      }
      
      const usage = materialUsage.get(key)!;
      usage.usageCount += part.quantity || 1;
      usage.designItemIds.add(designItemId);
    }
  }
  
  // Detect changes
  const currentNames = new Set(Array.from(materialUsage.values()).map(u => u.normalizedName));
  
  const result: HarvestResult = {
    newMaterials: [],
    existingMaterials: [],
    removedMaterials: [],
    totalMaterials: materialUsage.size,
    unmappedCount: 0,
  };
  
  // Find new materials
  for (const name of currentNames) {
    if (previousNames.has(name)) {
      result.existingMaterials.push(name);
    } else {
      result.newMaterials.push(name);
    }
  }
  
  // Find removed materials
  for (const name of previousNames) {
    if (!currentNames.has(name)) {
      result.removedMaterials.push(name);
    }
  }
  
  console.log('[MaterialHarvester] Total unique materials found:', materialUsage.size);
  
  // Build new palette
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };
  
  const newEntries: MaterialPaletteEntry[] = [];
  
  for (const [_key, usage] of materialUsage) {
    // Check if we have an existing entry to preserve mappings
    const existingEntry = previousPalette.find(
      e => e.normalizedName === usage.normalizedName && e.thickness === usage.thickness
    );
    
    // Build entry without undefined values (Firestore doesn't accept undefined)
    const entry: MaterialPaletteEntry = {
      id: existingEntry?.id || generateId(),
      designName: usage.designName,
      normalizedName: usage.normalizedName,
      thickness: usage.thickness,
      materialType: detectMaterialType(usage.designName),
      usageCount: usage.usageCount,
      designItemIds: Array.from(usage.designItemIds),
      stockSheets: existingEntry?.stockSheets || [],
      createdAt: existingEntry?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    
    // Only add optional mapping fields if they exist
    if (existingEntry?.inventoryId) {
      entry.inventoryId = existingEntry.inventoryId;
      entry.inventoryName = existingEntry.inventoryName;
      entry.inventorySku = existingEntry.inventorySku;
      entry.unitCost = existingEntry.unitCost;
      entry.mappedAt = existingEntry.mappedAt;
      entry.mappedBy = existingEntry.mappedBy;
    }
    
    if (!entry.inventoryId) {
      result.unmappedCount++;
    }
    
    newEntries.push(entry);
  }
  
  // Update palette
  const newPalette: MaterialPalette = {
    entries: newEntries,
    lastHarvestedAt: timestamp,
    unmappedCount: result.unmappedCount,
    mappedCount: newEntries.length - result.unmappedCount,
  };
  
  // Save to project
  await updateDoc(projectRef, {
    materialPalette: newPalette,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // If new materials added, invalidate estimation
  if (result.newMaterials.length > 0) {
    await invalidateEstimation(
      projectId, 
      userId,
      `New materials: ${result.newMaterials.join(', ')}`
    );
  }
  
  return result;
}

/**
 * Map a material to inventory
 * If unitCost is 0 or undefined, automatically fetches price from inventory item
 */
export async function mapMaterialToInventory(
  projectId: string,
  paletteEntryId: string,
  inventoryId: string,
  inventoryName: string,
  inventorySku: string,
  unitCost: number | undefined,
  stockSheets: OptimizationStockSheet[],
  userId: string
): Promise<void> {
  // Auto-fetch price from inventory if not provided or zero
  let resolvedUnitCost = unitCost || 0;
  if (resolvedUnitCost === 0) {
    try {
      const inventoryRef = doc(db, 'inventoryItems', inventoryId);
      const inventorySnap = await getDoc(inventoryRef);
      if (inventorySnap.exists()) {
        const inventoryData = inventorySnap.data();
        resolvedUnitCost = inventoryData.pricing?.costPerUnit || 0;
        console.log(`[MaterialHarvester] Auto-fetched price for ${inventoryName}: ${resolvedUnitCost}`);
      }
    } catch (error) {
      console.warn(`[MaterialHarvester] Failed to auto-fetch price for ${inventoryName}:`, error);
    }
  }
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  const palette = project.materialPalette;
  
  if (!palette) {
    throw new Error('Material palette not initialized. Run harvest first.');
  }
  
  const entryIndex = palette.entries.findIndex(e => e.id === paletteEntryId);
  if (entryIndex === -1) {
    throw new Error('Palette entry not found');
  }
  
  const entry = palette.entries[entryIndex];
  const previousInventoryId = entry.inventoryId;
  const wasUnmapped = !previousInventoryId;
  
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };
  
  // Update entry with resolved price (auto-fetched from inventory if needed)
  palette.entries[entryIndex] = {
    ...entry,
    inventoryId,
    inventoryName,
    inventorySku,
    unitCost: resolvedUnitCost,
    stockSheets,
    mappedAt: timestamp,
    mappedBy: userId,
    updatedAt: timestamp,
  };
  
  // Update counts
  if (wasUnmapped) {
    palette.unmappedCount = Math.max(0, palette.unmappedCount - 1);
    palette.mappedCount++;
  }
  
  // Save to project
  await updateDoc(projectRef, {
    materialPalette: palette,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Invalidate Katana BOM if mapping changed (not just first mapping)
  if (previousInventoryId && previousInventoryId !== inventoryId) {
    await invalidateKatanaBOM(
      projectId,
      userId,
      `Material mapping changed: ${entry.designName}`
    );
  }
  
  // If stock sheets changed, invalidate estimation
  const previousSheetIds = entry.stockSheets.map(s => s.id).sort().join(',');
  const newSheetIds = stockSheets.map(s => s.id).sort().join(',');
  
  if (previousSheetIds !== newSheetIds) {
    await invalidateEstimation(
      projectId,
      userId,
      `Stock sheets changed for: ${entry.designName}`
    );
  }
}

/**
 * Unmap a material from inventory
 */
export async function unmapMaterial(
  projectId: string,
  paletteEntryId: string,
  userId: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  const palette = project.materialPalette;
  
  if (!palette) {
    throw new Error('Material palette not initialized');
  }
  
  const entryIndex = palette.entries.findIndex(e => e.id === paletteEntryId);
  if (entryIndex === -1) {
    throw new Error('Palette entry not found');
  }
  
  const entry = palette.entries[entryIndex];
  const wasMapped = !!entry.inventoryId;
  
  const now = FirestoreTimestamp.now();
  
  // Clear mapping
  palette.entries[entryIndex] = {
    ...entry,
    inventoryId: undefined,
    inventoryName: undefined,
    inventorySku: undefined,
    unitCost: undefined,
    stockSheets: [],
    mappedAt: undefined,
    mappedBy: undefined,
    updatedAt: {
      seconds: now.seconds,
      nanoseconds: now.nanoseconds,
    },
  };
  
  // Update counts
  if (wasMapped) {
    palette.unmappedCount++;
    palette.mappedCount = Math.max(0, palette.mappedCount - 1);
  }
  
  // Save to project
  await updateDoc(projectRef, {
    materialPalette: palette,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Invalidate Katana BOM
  await invalidateKatanaBOM(
    projectId,
    userId,
    `Material unmapped: ${entry.designName}`
  );
}

// ============================================
// Invalidation Helpers
// ============================================

/**
 * Invalidate estimation results
 */
async function invalidateEstimation(
  projectId: string,
  userId: string,
  reason: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) return;
  
  const project = projectSnap.data() as Project;
  
  if (project.optimizationState?.estimation && !project.optimizationState.estimation.invalidatedAt) {
    const now = FirestoreTimestamp.now();
    
    await updateDoc(projectRef, {
      'optimizationState.estimation.invalidatedAt': {
        seconds: now.seconds,
        nanoseconds: now.nanoseconds,
      },
      'optimizationState.estimation.invalidationReasons': [reason],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Invalidate Katana BOM
 */
async function invalidateKatanaBOM(
  projectId: string,
  userId: string,
  reason: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) return;
  
  const project = projectSnap.data() as Project;
  
  if (project.optimizationState?.production?.katanaBOMId) {
    const now = FirestoreTimestamp.now();
    
    // Invalidate production to trigger BOM re-export
    await updateDoc(projectRef, {
      'optimizationState.production.invalidatedAt': {
        seconds: now.seconds,
        nanoseconds: now.nanoseconds,
      },
      'optimizationState.production.invalidationReasons': [reason],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Generate a simple ID
 */
function generateId(): string {
  return `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sync material palette prices from linked inventory items
 * Call this after Katana sync to update unitCost from the latest inventory prices
 */
export async function syncPalettePricesFromInventory(
  projectId: string,
  userId: string
): Promise<{ updated: number; errors: string[] }> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  const palette = project.materialPalette;
  
  if (!palette || palette.entries.length === 0) {
    return { updated: 0, errors: [] };
  }
  
  const result = { updated: 0, errors: [] as string[] };
  let hasChanges = false;
  
  // Get all inventory items in one query for efficiency
  const inventoryRef = collection(db, 'inventoryItems');
  const inventorySnapshot = await getDocs(inventoryRef);
  
  // Build lookup map by ID and SKU
  const inventoryByIdMap = new Map<string, { costPerUnit: number; inStock: number }>();
  const inventoryBySkuMap = new Map<string, { costPerUnit: number; inStock: number }>();
  
  for (const docSnap of inventorySnapshot.docs) {
    const data = docSnap.data();
    const costPerUnit = data.pricing?.costPerUnit || 0;
    const inStock = data.inventory?.inStock || 0;
    
    inventoryByIdMap.set(docSnap.id, { costPerUnit, inStock });
    if (data.sku) {
      inventoryBySkuMap.set(data.sku, { costPerUnit, inStock });
    }
  }
  
  // Update palette entries with latest prices
  for (let i = 0; i < palette.entries.length; i++) {
    const entry = palette.entries[i];
    
    if (!entry.inventoryId && !entry.inventorySku) {
      continue; // Not mapped to inventory
    }
    
    // Look up by ID first, then by SKU
    let inventoryData = entry.inventoryId 
      ? inventoryByIdMap.get(entry.inventoryId)
      : undefined;
    
    if (!inventoryData && entry.inventorySku) {
      inventoryData = inventoryBySkuMap.get(entry.inventorySku);
    }
    
    if (inventoryData && inventoryData.costPerUnit > 0) {
      const currentCost = entry.unitCost || 0;
      
      // Only update if price changed
      if (currentCost !== inventoryData.costPerUnit) {
        palette.entries[i] = {
          ...entry,
          unitCost: inventoryData.costPerUnit,
          updatedAt: {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
          },
        };
        hasChanges = true;
        result.updated++;
        console.log(`[MaterialHarvester] Updated price for ${entry.designName}: ${currentCost} -> ${inventoryData.costPerUnit}`);
      }
    }
  }
  
  // Save if changes were made
  if (hasChanges) {
    await updateDoc(projectRef, {
      materialPalette: palette,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
    
    // Invalidate estimation since costs changed
    await invalidateEstimation(
      projectId,
      userId,
      `Material prices updated from inventory sync (${result.updated} items)`
    );
  }
  
  return result;
}

/**
 * Sync all projects' material palette prices from inventory
 * Called after Katana sync to propagate price changes
 */
export async function syncAllProjectPricesFromInventory(
  userId: string
): Promise<{ projectsUpdated: number; totalMaterialsUpdated: number }> {
  const projectsRef = collection(db, PROJECTS_COLLECTION);
  const projectsSnapshot = await getDocs(projectsRef);
  
  let projectsUpdated = 0;
  let totalMaterialsUpdated = 0;
  
  for (const projectDoc of projectsSnapshot.docs) {
    const projectData = projectDoc.data();
    
    // Only process projects with material palettes that have mapped materials
    if (projectData.materialPalette?.mappedCount > 0) {
      try {
        const result = await syncPalettePricesFromInventory(projectDoc.id, userId);
        if (result.updated > 0) {
          projectsUpdated++;
          totalMaterialsUpdated += result.updated;
        }
      } catch (error) {
        console.error(`Failed to sync prices for project ${projectDoc.id}:`, error);
      }
    }
  }
  
  console.log(`[MaterialHarvester] Synced prices: ${totalMaterialsUpdated} materials across ${projectsUpdated} projects`);
  
  return { projectsUpdated, totalMaterialsUpdated };
}

/**
 * Get palette statistics
 */
export function getPaletteStats(palette: MaterialPalette | undefined): {
  total: number;
  mapped: number;
  unmapped: number;
  percentMapped: number;
} {
  if (!palette) {
    return { total: 0, mapped: 0, unmapped: 0, percentMapped: 0 };
  }
  
  const total = palette.entries.length;
  const mapped = palette.mappedCount;
  const unmapped = palette.unmappedCount;
  
  return {
    total,
    mapped,
    unmapped,
    percentMapped: total > 0 ? Math.round((mapped / total) * 100) : 0,
  };
}

/**
 * Check if all materials are mapped (required for Katana export)
 */
export function allMaterialsMapped(palette: MaterialPalette | undefined): boolean {
  if (!palette) return false;
  return palette.unmappedCount === 0 && palette.entries.length > 0;
}
