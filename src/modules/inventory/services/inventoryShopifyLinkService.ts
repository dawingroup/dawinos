/**
 * Inventory Shopify Link Service
 *
 * Bridges inventory items (products) to Shopify for retail.
 * Tracks sync status and manages the relationship between inventory products and Shopify listings.
 */

import {
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/shared/services/firebase';
import type { ShopifySyncStatus, InventoryItem } from '../types/inventory';

const API_BASE = 'https://api-okekivpl2a-uc.a.run.app';
const INVENTORY_COLLECTION = 'unifiedInventory';

/**
 * Get Firebase ID token for authenticated API calls
 */
async function getAuthToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Input for syncing inventory item to Shopify
 */
export interface ShopifyProductInput {
  title: string;
  description?: string;
  productType?: string;
  vendor?: string;
  tags?: string[];
  variants: {
    price: string;
    sku: string;
    inventoryQuantity?: number;
  }[];
  images?: { src: string }[];
}

/**
 * Sync an inventory item to Shopify as a product
 */
export async function syncInventoryItemToShopify(
  inventoryItemId: string,
  productInput: ShopifyProductInput
): Promise<{ success: boolean; shopifyProductId?: string; shopifyVariantId?: string; error?: string }> {
  const itemRef = doc(db, INVENTORY_COLLECTION, inventoryItemId);

  // Update sync status to 'syncing'
  await updateDoc(itemRef, {
    shopifySyncStatus: 'syncing' as ShopifySyncStatus,
    updatedAt: serverTimestamp(),
  });

  try {
    const response = await authenticatedFetch(`${API_BASE}/shopify/sync-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventoryItemId,
        productData: productInput,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Update sync status to 'error'
      await updateDoc(itemRef, {
        shopifySyncStatus: 'error' as ShopifySyncStatus,
        updatedAt: serverTimestamp(),
      });
      return { success: false, error: data.error || 'Sync failed' };
    }

    // Update inventory item with Shopify IDs
    await updateDoc(itemRef, {
      shopifyProductId: data.shopifyProductId,
      shopifyVariantId: data.shopifyVariantId,
      shopifySyncStatus: 'synced' as ShopifySyncStatus,
      shopifyLastSyncAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      shopifyProductId: data.shopifyProductId,
      shopifyVariantId: data.shopifyVariantId,
    };
  } catch (error) {
    // Update sync status to 'error'
    await updateDoc(itemRef, {
      shopifySyncStatus: 'error' as ShopifySyncStatus,
      updatedAt: serverTimestamp(),
    });
    return { success: false, error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

/**
 * Update Shopify product from inventory item changes
 */
export async function updateShopifyProduct(
  inventoryItemId: string,
  updates: Partial<ShopifyProductInput>
): Promise<{ success: boolean; error?: string }> {
  const itemRef = doc(db, INVENTORY_COLLECTION, inventoryItemId);
  const itemDoc = await getDoc(itemRef);

  if (!itemDoc.exists()) {
    return { success: false, error: 'Inventory item not found' };
  }

  const item = itemDoc.data() as InventoryItem;
  if (!item.shopifyProductId) {
    return { success: false, error: 'Item not synced to Shopify' };
  }

  // Update sync status to 'syncing'
  await updateDoc(itemRef, {
    shopifySyncStatus: 'syncing' as ShopifySyncStatus,
    updatedAt: serverTimestamp(),
  });

  try {
    const response = await authenticatedFetch(`${API_BASE}/shopify/update-product`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopifyProductId: item.shopifyProductId,
        updates,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      await updateDoc(itemRef, {
        shopifySyncStatus: 'error' as ShopifySyncStatus,
        updatedAt: serverTimestamp(),
      });
      return { success: false, error: data.error || 'Update failed' };
    }

    await updateDoc(itemRef, {
      shopifySyncStatus: 'synced' as ShopifySyncStatus,
      shopifyLastSyncAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    await updateDoc(itemRef, {
      shopifySyncStatus: 'error' as ShopifySyncStatus,
      updatedAt: serverTimestamp(),
    });
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  }
}

/**
 * Unlink inventory item from Shopify (doesn't delete Shopify product)
 */
export async function unlinkFromShopify(inventoryItemId: string): Promise<void> {
  const itemRef = doc(db, INVENTORY_COLLECTION, inventoryItemId);
  await updateDoc(itemRef, {
    shopifyProductId: null,
    shopifyVariantId: null,
    shopifySyncStatus: 'not_synced' as ShopifySyncStatus,
    shopifyLastSyncAt: null,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get sync status for an inventory item
 */
export async function getShopifySyncStatus(
  inventoryItemId: string
): Promise<{ status: ShopifySyncStatus; shopifyProductId?: string; lastSyncAt?: Timestamp } | null> {
  const itemRef = doc(db, INVENTORY_COLLECTION, inventoryItemId);
  const itemDoc = await getDoc(itemRef);

  if (!itemDoc.exists()) {
    return null;
  }

  const item = itemDoc.data() as InventoryItem;
  return {
    status: item.shopifySyncStatus || 'not_synced',
    shopifyProductId: item.shopifyProductId,
    lastSyncAt: item.shopifyLastSyncAt,
  };
}

/**
 * Build ShopifyProductInput from InventoryItem
 */
export function buildShopifyProductInput(item: InventoryItem): ShopifyProductInput {
  return {
    title: item.displayName || item.name,
    description: item.description,
    productType: item.category,
    tags: item.tags,
    variants: [
      {
        price: item.pricing.costPerUnit.toString(),
        sku: item.sku,
        inventoryQuantity: item.inventory.inStock,
      },
    ],
  };
}
