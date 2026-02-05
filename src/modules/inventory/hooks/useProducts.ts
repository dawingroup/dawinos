/**
 * useProducts Hook
 * Subscribe to inventory items classified as 'product' (finished goods for retail/projects)
 */

import { useState, useEffect, useMemo } from 'react';
import { subscribeToInventory } from '../services/inventoryService';
import type { InventoryListItem, InventoryCategory, ShopifySyncStatus } from '../types';

interface UseProductsOptions {
  category?: InventoryCategory;
  shopifySynced?: boolean;
  hasProjectLinks?: boolean;
}

interface ProductListItem extends InventoryListItem {
  shopifySyncStatus?: ShopifySyncStatus;
  shopifyProductId?: string;
  linkedProjectCount?: number;
}

interface UseProductsResult {
  products: ProductListItem[];
  loading: boolean;
  error: Error | null;
  stats: {
    total: number;
    syncedToShopify: number;
    linkedToProjects: number;
    byCategory: Record<InventoryCategory, number>;
  };
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const [allItems, setAllItems] = useState<InventoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to inventory
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToInventory(
      (inventoryItems) => {
        setAllItems(inventoryItems);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { category: options.category }
    );

    return () => unsubscribe();
  }, [options.category]);

  // Filter to products only (classification='product' or no classification with shopify link)
  const products = useMemo(() => {
    let filtered = allItems.filter(
      (item) => (item as any).classification === 'product' || (item as any).shopifyProductId
    );

    if (options.shopifySynced !== undefined) {
      filtered = filtered.filter((item) => {
        const synced = !!(item as any).shopifyProductId;
        return options.shopifySynced ? synced : !synced;
      });
    }

    return filtered as ProductListItem[];
  }, [allItems, options.shopifySynced]);

  // Calculate stats
  const stats = useMemo(() => {
    const byCategory: Record<InventoryCategory, number> = {
      'sheet-goods': 0,
      'solid-wood': 0,
      'hardware': 0,
      'edge-banding': 0,
      'finishing': 0,
      'adhesives': 0,
      'fasteners': 0,
      'other': 0,
    };

    let syncedToShopify = 0;
    let linkedToProjects = 0;

    for (const product of products) {
      byCategory[product.category] = (byCategory[product.category] || 0) + 1;
      if (product.shopifyProductId) syncedToShopify++;
      if ((product as any).linkedProjectIds?.length > 0) linkedToProjects++;
    }

    return {
      total: products.length,
      syncedToShopify,
      linkedToProjects,
      byCategory,
    };
  }, [products]);

  return {
    products,
    loading,
    error,
    stats,
  };
}

export default useProducts;
