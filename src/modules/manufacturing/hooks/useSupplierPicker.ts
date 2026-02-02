/**
 * useSupplierPicker
 * Hook for searching and selecting suppliers from the matflow system
 */

import { useState, useCallback, useRef } from 'react';
import type { Supplier } from '@/subsidiaries/advisory/matflow/types/supplier';
import { searchSuppliers, getActiveSuppliers } from '../services/supplierBridgeService';

export function useSupplierPicker() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  /**
   * Search suppliers with debounce
   */
  const search = useCallback((query: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      // Load all active suppliers when search is empty
      setLoading(true);
      getActiveSuppliers()
        .then(setSuppliers)
        .catch(() => setSuppliers([]))
        .finally(() => setLoading(false));
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchSuppliers(query);
        setSuppliers(results);
      } catch {
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  /**
   * Load all active suppliers (for initial dropdown)
   */
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getActiveSuppliers();
      setSuppliers(results);
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suppliers,
    loading,
    search,
    loadAll,
  };
}
