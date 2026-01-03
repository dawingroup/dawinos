/**
 * Inventory Service
 * CRUD operations for unified inventory items
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  InventoryItem,
  InventoryItemFormData,
  InventoryListItem,
  InventoryCategory,
  InventoryTier,
  InventoryStatus,
  InventorySource,
} from '../types';

const COLLECTION_NAME = 'inventoryItems';
const inventoryRef = collection(db, COLLECTION_NAME);

/**
 * Generate a SKU from name and category
 */
export function generateSku(name: string, category: InventoryCategory): string {
  const categoryPrefix: Record<InventoryCategory, string> = {
    'sheet-goods': 'SHT',
    'solid-wood': 'WOD',
    'hardware': 'HDW',
    'edge-banding': 'EDG',
    'finishing': 'FIN',
    'adhesives': 'ADH',
    'fasteners': 'FST',
    'other': 'OTH',
  };

  const prefix = categoryPrefix[category];
  const namePart = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();

  return `${prefix}-${namePart}-${randomPart}`;
}

/**
 * Transform Firestore doc to InventoryListItem
 */
function docToListItem(id: string, data: any): InventoryListItem {
  return {
    id,
    sku: data.sku || '',
    name: data.name || '',
    displayName: data.displayName,
    category: data.category || 'other',
    subcategory: data.subcategory,
    tier: data.tier || 'global',
    source: data.source || 'manual',
    thickness: data.dimensions?.thickness,
    costPerUnit: data.pricing?.costPerUnit,
    currency: data.pricing?.currency,
    inStock: data.inventory?.inStock,
    isStandard: data.katanaSync?.isStandard,
    status: data.status || 'active',
  };
}

/**
 * Transform Firestore doc to full InventoryItem
 */
function docToItem(id: string, data: any): InventoryItem {
  return {
    id,
    sku: data.sku || '',
    name: data.name || '',
    displayName: data.displayName,
    description: data.description,
    category: data.category || 'other',
    subcategory: data.subcategory,
    tags: data.tags || [],
    aliases: data.aliases || [],
    source: data.source || 'manual',
    katanaId: data.katanaId,
    promotedFromPartId: data.promotedFromPartId,
    tier: data.tier || 'global',
    scopeId: data.scopeId,
    dimensions: data.dimensions,
    grainPattern: data.grainPattern,
    pricing: data.pricing || { costPerUnit: 0, currency: 'KES', unit: 'sheet' },
    inventory: data.inventory || { inStock: 0 },
    katanaSync: data.katanaSync || { isStandard: false, pendingPush: false },
    status: data.status || 'active',
    createdAt: data.createdAt,
    createdBy: data.createdBy || '',
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy || '',
  };
}

/**
 * Subscribe to inventory items with filters
 */
export function subscribeToInventory(
  callback: (items: InventoryListItem[]) => void,
  onError?: (error: Error) => void,
  options?: {
    category?: InventoryCategory;
    tier?: InventoryTier;
    source?: InventorySource;
    status?: InventoryStatus;
    standardOnly?: boolean;
  }
): Unsubscribe {
  // Simple query without orderBy to avoid index requirements
  // Sorting done client-side
  return onSnapshot(
    inventoryRef,
    (snapshot) => {
      let items = snapshot.docs.map((doc) => docToListItem(doc.id, doc.data()));

      // Client-side sorting
      items.sort((a, b) => a.name.localeCompare(b.name));

      // Client-side filtering
      if (options?.category) {
        items = items.filter((i) => i.category === options.category);
      }
      if (options?.tier) {
        items = items.filter((i) => i.tier === options.tier);
      }
      if (options?.source) {
        items = items.filter((i) => i.source === options.source);
      }
      if (options?.status) {
        items = items.filter((i) => i.status === options.status);
      }
      if (options?.standardOnly) {
        items = items.filter((i) => i.isStandard);
      }

      callback(items);
    },
    (error) => {
      console.error('Inventory subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to global inventory items only
 */
export function subscribeToGlobalInventory(
  callback: (items: InventoryListItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  return subscribeToInventory(callback, onError, { tier: 'global' });
}

/**
 * Get inventory item by ID
 */
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const docRef = doc(inventoryRef, id);
  const snapshot = await getDoc(docRef);

  if (snapshot.exists()) {
    return docToItem(snapshot.id, snapshot.data());
  }
  return null;
}

/**
 * Get inventory item by SKU
 */
export async function getInventoryItemBySku(sku: string): Promise<InventoryItem | null> {
  const q = query(inventoryRef, where('sku', '==', sku));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return docToItem(doc.id, doc.data());
  }
  return null;
}

/**
 * Get inventory item by Katana ID
 */
export async function getInventoryItemByKatanaId(katanaId: string): Promise<InventoryItem | null> {
  const q = query(inventoryRef, where('katanaId', '==', katanaId));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return docToItem(doc.id, doc.data());
  }
  return null;
}

/**
 * Search inventory items by name, SKU, or alias
 */
export async function searchInventory(
  searchTerm: string,
  options?: { category?: InventoryCategory; limit?: number }
): Promise<InventoryListItem[]> {
  // Firestore doesn't support full-text search, so we fetch and filter client-side
  // For production, consider Algolia or Typesense
  const q = query(inventoryRef, orderBy('name', 'asc'));
  const snapshot = await getDocs(q);

  const term = searchTerm.toLowerCase().trim();
  let items = snapshot.docs
    .map((doc) => docToListItem(doc.id, doc.data()))
    .filter((item) => {
      const searchable = [
        item.sku,
        item.name,
        item.displayName || '',
        item.subcategory || '',
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(term);
    });

  if (options?.category) {
    items = items.filter((i) => i.category === options.category);
  }

  if (options?.limit) {
    items = items.slice(0, options.limit);
  }

  return items;
}

/**
 * Create a new inventory item
 */
export async function createInventoryItem(
  data: InventoryItemFormData,
  userId: string,
  options?: {
    tier?: InventoryTier;
    scopeId?: string;
    source?: InventorySource;
    katanaId?: string;
  }
): Promise<string> {
  const now = serverTimestamp();

  const docData: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> & {
    createdAt: ReturnType<typeof serverTimestamp>;
    updatedAt: ReturnType<typeof serverTimestamp>;
  } = {
    sku: data.sku,
    name: data.name,
    displayName: data.displayName,
    description: data.description,
    category: data.category,
    subcategory: data.subcategory,
    tags: data.tags || [],
    source: options?.source || 'manual',
    katanaId: options?.katanaId,
    tier: options?.tier || 'global',
    scopeId: options?.scopeId,
    dimensions: data.dimensions,
    grainPattern: data.grainPattern,
    pricing: {
      costPerUnit: data.pricing.costPerUnit,
      currency: data.pricing.currency,
      unit: data.pricing.unit,
    },
    inventory: { inStock: 0 },
    katanaSync: {
      isStandard: false,
      pendingPush: options?.source !== 'katana', // Push to Katana if not from Katana
    },
    status: data.status,
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  const docRef = await addDoc(inventoryRef, docData);
  return docRef.id;
}

/**
 * Update an inventory item
 */
export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItemFormData>,
  userId: string
): Promise<void> {
  const docRef = doc(inventoryRef, id);

  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  // Copy over simple fields
  if (data.name !== undefined) updateData.name = data.name;
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.dimensions !== undefined) updateData.dimensions = data.dimensions;
  if (data.grainPattern !== undefined) updateData.grainPattern = data.grainPattern;
  if (data.status !== undefined) updateData.status = data.status;

  // Handle pricing updates
  if (data.pricing) {
    updateData.pricing = {
      costPerUnit: data.pricing.costPerUnit,
      currency: data.pricing.currency,
      unit: data.pricing.unit,
    };
  }

  // Mark as pending push to Katana if metadata changed
  updateData['katanaSync.pendingPush'] = true;

  await updateDoc(docRef, updateData);
}

/**
 * Update pricing from Katana sync
 */
export async function updatePricingFromKatana(
  id: string,
  costPerUnit: number,
  inStock: number
): Promise<void> {
  const docRef = doc(inventoryRef, id);
  const now = serverTimestamp();

  await updateDoc(docRef, {
    'pricing.costPerUnit': costPerUnit,
    'pricing.lastSyncedFromKatana': now,
    'inventory.inStock': inStock,
    'inventory.lastSyncedFromKatana': now,
    'katanaSync.lastPulledAt': now,
    updatedAt: now,
  });
}

/**
 * Mark item as synced to Katana
 */
export async function markSyncedToKatana(id: string): Promise<void> {
  const docRef = doc(inventoryRef, id);
  const now = serverTimestamp();

  await updateDoc(docRef, {
    'katanaSync.lastPushedAt': now,
    'katanaSync.pendingPush': false,
    updatedAt: now,
  });
}

/**
 * Toggle standard flag
 */
export async function toggleStandard(id: string, isStandard: boolean): Promise<void> {
  const docRef = doc(inventoryRef, id);

  await updateDoc(docRef, {
    'katanaSync.isStandard': isStandard,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id: string): Promise<void> {
  const docRef = doc(inventoryRef, id);
  await deleteDoc(docRef);
}

/**
 * Get all items pending push to Katana
 */
export async function getItemsPendingKatanaPush(): Promise<InventoryItem[]> {
  const q = query(inventoryRef, where('katanaSync.pendingPush', '==', true));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => docToItem(doc.id, doc.data()));
}

/**
 * Get all active global items (for estimation)
 */
export async function getActiveGlobalItems(): Promise<InventoryItem[]> {
  const q = query(
    inventoryRef,
    where('tier', '==', 'global'),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => docToItem(doc.id, doc.data()));
}

/**
 * Promote a project part to a global inventory item
 * This allows reusing custom parts across projects
 */
export interface PromotePartData {
  name: string;
  partNumber?: string;
  supplier: string;
  category: InventoryCategory;
  unitCost: number;
  currency: string;
  description?: string;
  referenceImageUrl?: string;
  purchaseUrl?: string;
  specifications?: Record<string, string>;
}

export async function promotePartToInventory(
  partData: PromotePartData,
  sourcePartId: string,
  userId: string
): Promise<string> {
  const now = serverTimestamp();

  // Generate SKU for the new inventory item
  const sku = generateSku(partData.name, partData.category);

  const docData = {
    sku,
    name: partData.name,
    displayName: partData.name,
    description: partData.description || `Promoted from project part. Supplier: ${partData.supplier}`,
    category: partData.category,
    subcategory: partData.supplier,
    tags: ['promoted-from-part'],
    aliases: partData.partNumber ? [partData.partNumber] : [],
    source: 'parts-promotion' as const,
    promotedFromPartId: sourcePartId,
    tier: 'global' as const,
    dimensions: undefined,
    grainPattern: undefined,
    pricing: {
      costPerUnit: partData.unitCost,
      currency: partData.currency,
      unit: 'ea' as const,
    },
    inventory: { inStock: 0 },
    katanaSync: {
      isStandard: false,
      pendingPush: true, // Mark for Katana sync
    },
    status: 'active' as const,
    metadata: {
      supplierUrl: partData.purchaseUrl,
      referenceImageUrl: partData.referenceImageUrl,
      specifications: partData.specifications,
    },
    createdAt: now,
    createdBy: userId,
    updatedAt: now,
    updatedBy: userId,
  };

  const docRef = await addDoc(inventoryRef, docData);
  return docRef.id;
}
