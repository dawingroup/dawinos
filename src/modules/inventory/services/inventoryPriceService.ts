/**
 * Inventory Price Service
 * Centralized pricing resolution - THE ONLY WAY to get material prices across the app
 * 
 * Resolution order:
 * 1. Project-specific override
 * 2. Customer-specific override
 * 3. Global inventory item (Katana-synced)
 */

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type {
  InventoryItem,
  ResolvedPrice,
} from '../types';

const INVENTORY_COLLECTION = 'inventoryItems';

/**
 * Price resolution result
 */
export interface PriceResolutionResult {
  found: boolean;
  price?: ResolvedPrice;
  error?: string;
}

/**
 * Get material price by SKU - primary lookup method
 * This is THE single entry point for all pricing across the app
 */
export async function getMaterialPrice(
  sku: string,
  projectId?: string,
  customerId?: string
): Promise<PriceResolutionResult> {
  try {
    // 1. Check project-level override
    if (projectId) {
      const projectPrice = await getProjectPriceOverride(projectId, sku);
      if (projectPrice) {
        return { found: true, price: projectPrice };
      }
    }

    // 2. Check customer-level override
    if (customerId) {
      const customerPrice = await getCustomerPriceOverride(customerId, sku);
      if (customerPrice) {
        return { found: true, price: customerPrice };
      }
    }

    // 3. Get from global inventory (Katana-synced)
    const globalItem = await getGlobalInventoryItem(sku);
    if (globalItem && globalItem.pricing?.costPerUnit > 0) {
      return {
        found: true,
        price: {
          costPerUnit: globalItem.pricing.costPerUnit,
          currency: globalItem.pricing.currency,
          unit: globalItem.pricing.unit,
          source: globalItem.source === 'katana' ? 'katana' : 'global',
          itemId: globalItem.id,
          itemName: globalItem.displayName || globalItem.name,
          lastSynced: globalItem.pricing.lastSyncedFromKatana,
        },
      };
    }

    // 4. No price found
    return {
      found: false,
      error: `No price found for material: ${sku}`,
    };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error resolving price',
    };
  }
}

/**
 * Get material price by name (fuzzy match)
 * Tries exact match first, then searches aliases
 */
export async function getMaterialPriceByName(
  materialName: string,
  thickness?: number,
  projectId?: string,
  customerId?: string
): Promise<PriceResolutionResult> {
  try {
    const normalizedName = materialName.toLowerCase().trim();

    // Search for matching item
    const inventoryRef = collection(db, INVENTORY_COLLECTION);
    const snapshot = await getDocs(inventoryRef);

    let bestMatch: InventoryItem | null = null;
    let matchScore = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const item: InventoryItem = {
        id: docSnap.id,
        ...data,
      } as InventoryItem;

      // Skip inactive items
      if (item.status !== 'active') continue;

      // Calculate match score
      let score = 0;

      // Exact SKU match
      if (item.sku.toLowerCase() === normalizedName) {
        score = 100;
      }
      // Exact name match
      else if (item.name.toLowerCase() === normalizedName) {
        score = 90;
      }
      // Display name match
      else if (item.displayName?.toLowerCase() === normalizedName) {
        score = 85;
      }
      // Alias match
      else if (item.aliases?.some((a) => a.toLowerCase() === normalizedName)) {
        score = 80;
      }
      // Partial name match
      else if (item.name.toLowerCase().includes(normalizedName) ||
               normalizedName.includes(item.name.toLowerCase())) {
        score = 50;
      }

      // Boost score if thickness matches
      if (thickness && item.dimensions?.thickness === thickness) {
        score += 10;
      }

      if (score > matchScore) {
        matchScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && matchScore >= 50) {
      // Now resolve price with tier overrides
      return getMaterialPrice(bestMatch.sku, projectId, customerId);
    }

    return {
      found: false,
      error: `No matching material found for: ${materialName}`,
    };
  } catch (error) {
    return {
      found: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get prices for multiple SKUs (batch)
 */
export async function getMaterialPrices(
  skus: string[],
  projectId?: string,
  customerId?: string
): Promise<Map<string, PriceResolutionResult>> {
  const results = new Map<string, PriceResolutionResult>();

  // Process in parallel
  await Promise.all(
    skus.map(async (sku) => {
      const result = await getMaterialPrice(sku, projectId, customerId);
      results.set(sku, result);
    })
  );

  return results;
}

/**
 * Get all prices for a project (for estimation)
 * Returns a map of SKU -> ResolvedPrice
 */
export async function getAllPricesForProject(
  projectId: string,
  customerId?: string
): Promise<Map<string, ResolvedPrice>> {
  const priceMap = new Map<string, ResolvedPrice>();

  // Get all global inventory items
  const inventoryRef = collection(db, INVENTORY_COLLECTION);
  const q = query(
    inventoryRef,
    where('tier', '==', 'global'),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.pricing?.costPerUnit > 0) {
      priceMap.set(data.sku, {
        costPerUnit: data.pricing.costPerUnit,
        currency: data.pricing.currency,
        unit: data.pricing.unit || 'sheet',
        source: data.source === 'katana' ? 'katana' : 'global',
        itemId: docSnap.id,
        itemName: data.displayName || data.name,
        lastSynced: data.pricing.lastSyncedFromKatana,
      });
    }
  }

  // Override with customer prices
  if (customerId) {
    const customerPrices = await getCustomerPriceOverrides(customerId);
    for (const [sku, price] of customerPrices) {
      priceMap.set(sku, price);
    }
  }

  // Override with project prices
  const projectPrices = await getProjectPriceOverrides(projectId);
  for (const [sku, price] of projectPrices) {
    priceMap.set(sku, price);
  }

  return priceMap;
}

// === Helper functions ===

async function getGlobalInventoryItem(sku: string): Promise<InventoryItem | null> {
  const inventoryRef = collection(db, INVENTORY_COLLECTION);
  const q = query(inventoryRef, where('sku', '==', sku), where('tier', '==', 'global'));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as InventoryItem;
  }

  // Try matching by name or alias
  const allDocs = await getDocs(inventoryRef);
  const normalizedSku = sku.toLowerCase().trim();

  for (const docSnap of allDocs.docs) {
    const data = docSnap.data();
    if (data.tier !== 'global') continue;

    if (
      data.name?.toLowerCase() === normalizedSku ||
      data.displayName?.toLowerCase() === normalizedSku ||
      data.aliases?.some((a: string) => a.toLowerCase() === normalizedSku)
    ) {
      return { id: docSnap.id, ...data } as InventoryItem;
    }
  }

  return null;
}

async function getProjectPriceOverride(
  projectId: string,
  sku: string
): Promise<ResolvedPrice | null> {
  // Project-level price overrides stored in designProjects/{projectId}/priceOverrides
  const overridesRef = collection(db, 'designProjects', projectId, 'priceOverrides');
  const q = query(overridesRef, where('sku', '==', sku));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    return {
      costPerUnit: data.costPerUnit,
      currency: data.currency,
      unit: data.unit || 'sheet',
      source: 'project',
      itemId: snapshot.docs[0].id,
      itemName: data.itemName || sku,
    };
  }

  return null;
}

async function getCustomerPriceOverride(
  customerId: string,
  sku: string
): Promise<ResolvedPrice | null> {
  // Customer-level price overrides stored in customers/{customerId}/priceOverrides
  const overridesRef = collection(db, 'customers', customerId, 'priceOverrides');
  const q = query(overridesRef, where('sku', '==', sku));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const data = snapshot.docs[0].data();
    return {
      costPerUnit: data.costPerUnit,
      currency: data.currency,
      unit: data.unit || 'sheet',
      source: 'customer',
      itemId: snapshot.docs[0].id,
      itemName: data.itemName || sku,
    };
  }

  return null;
}

async function getProjectPriceOverrides(
  projectId: string
): Promise<Map<string, ResolvedPrice>> {
  const priceMap = new Map<string, ResolvedPrice>();
  const overridesRef = collection(db, 'designProjects', projectId, 'priceOverrides');
  const snapshot = await getDocs(overridesRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.sku && data.costPerUnit > 0) {
      priceMap.set(data.sku, {
        costPerUnit: data.costPerUnit,
        currency: data.currency,
        unit: data.unit || 'sheet',
        source: 'project',
        itemId: docSnap.id,
        itemName: data.itemName || data.sku,
      });
    }
  }

  return priceMap;
}

async function getCustomerPriceOverrides(
  customerId: string
): Promise<Map<string, ResolvedPrice>> {
  const priceMap = new Map<string, ResolvedPrice>();
  const overridesRef = collection(db, 'customers', customerId, 'priceOverrides');
  const snapshot = await getDocs(overridesRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.sku && data.costPerUnit > 0) {
      priceMap.set(data.sku, {
        costPerUnit: data.costPerUnit,
        currency: data.currency,
        unit: data.unit || 'sheet',
        source: 'customer',
        itemId: docSnap.id,
        itemName: data.itemName || data.sku,
      });
    }
  }

  return priceMap;
}

/**
 * Validate that all materials in a list have prices
 * Returns list of missing materials
 */
export async function validateMaterialPrices(
  materials: Array<{ sku?: string; name: string; thickness?: number }>,
  projectId?: string,
  customerId?: string
): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];

  for (const material of materials) {
    let result: PriceResolutionResult;

    if (material.sku) {
      result = await getMaterialPrice(material.sku, projectId, customerId);
    } else {
      result = await getMaterialPriceByName(
        material.name,
        material.thickness,
        projectId,
        customerId
      );
    }

    if (!result.found) {
      missing.push(material.sku || material.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
