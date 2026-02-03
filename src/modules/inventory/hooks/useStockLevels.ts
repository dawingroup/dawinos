/**
 * Hook for subscribing to stock levels
 */

import { useState, useEffect } from 'react';
import type { StockLevel } from '../types/warehouse';
import {
  subscribeToStockLevels,
  subscribeToStockByWarehouse,
  getAggregatedStock,
} from '../services/stockLevelService';

interface UseStockLevelsResult {
  stockLevels: StockLevel[];
  loading: boolean;
  error: string | null;
  aggregated: {
    totalOnHand: number;
    totalReserved: number;
    totalAvailable: number;
  };
}

/**
 * Subscribe to stock levels for an inventory item across all locations
 */
export function useStockLevels(inventoryItemId: string | null): UseStockLevelsResult {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inventoryItemId) {
      setStockLevels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToStockLevels(inventoryItemId, (levels) => {
      setStockLevels(levels);
      setLoading(false);
    });

    return unsubscribe;
  }, [inventoryItemId]);

  const aggregated = stockLevels.reduce(
    (acc, sl) => ({
      totalOnHand: acc.totalOnHand + sl.quantityOnHand,
      totalReserved: acc.totalReserved + sl.quantityReserved,
      totalAvailable: acc.totalAvailable + sl.quantityAvailable,
    }),
    { totalOnHand: 0, totalReserved: 0, totalAvailable: 0 },
  );

  return { stockLevels, loading, error, aggregated };
}

/**
 * Subscribe to stock levels at a specific warehouse
 */
export function useWarehouseStock(warehouseId: string | null) {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!warehouseId) {
      setStockLevels([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToStockByWarehouse(warehouseId, (levels) => {
      setStockLevels(levels);
      setLoading(false);
    });

    return unsubscribe;
  }, [warehouseId]);

  return { stockLevels, loading };
}
