/**
 * Supplier Bridge Service
 * Bridges the advisory/matflow supplier system to the manufacturing module
 * Provides supplier search, lookup, and fuzzy resolution for manufacturing contexts
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { Supplier } from '@/subsidiaries/advisory/matflow/types/supplier';
import type { MaterialRate } from '@/subsidiaries/advisory/matflow/services/supplier-service';

const SUPPLIERS_COLLECTION = 'advisoryPlatform/matflow/suppliers';

// ============================================
// Supplier Lookup
// ============================================

/**
 * Get a supplier by ID from the matflow collection
 */
export async function getSupplierById(supplierId: string): Promise<Supplier | null> {
  const docRef = doc(db, SUPPLIERS_COLLECTION, supplierId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Supplier;
}

/**
 * Get all active suppliers
 */
export async function getActiveSuppliers(): Promise<Supplier[]> {
  const q = query(
    collection(db, SUPPLIERS_COLLECTION),
    where('status', '==', 'active'),
    orderBy('name', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier));
}

/**
 * Search suppliers by name, code, or contact person
 */
export async function searchSuppliers(searchTerm: string): Promise<Supplier[]> {
  const suppliers = await getActiveSuppliers();
  const term = searchTerm.toLowerCase().trim();
  if (!term) return suppliers;

  return suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term) ||
      s.contactPerson?.toLowerCase().includes(term) ||
      s.tradeName?.toLowerCase().includes(term),
  );
}

/**
 * Get suppliers that supply a specific material
 */
export async function getSuppliersByMaterial(materialId: string): Promise<Supplier[]> {
  const q = query(
    collection(db, SUPPLIERS_COLLECTION),
    where('materials', 'array-contains', materialId),
    where('status', '==', 'active'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier));
}

// ============================================
// Material Rates
// ============================================

/**
 * Get material rates for a supplier
 * Material rates are stored as a map on the supplier doc: materialRates.{materialId}
 */
export async function getSupplierMaterialRates(
  supplierId: string,
): Promise<MaterialRate[]> {
  const supplier = await getSupplierById(supplierId);
  if (!supplier) return [];

  const ratesMap = (supplier as any).materialRates as Record<string, MaterialRate> | undefined;
  if (!ratesMap) return [];

  return Object.values(ratesMap);
}

// ============================================
// Fuzzy Supplier Resolution
// ============================================

/**
 * Attempt to resolve a plain-text supplier name to a matflow supplier record.
 * Used during design-to-manufacturing handover to link special parts to known suppliers.
 *
 * Returns the best match if similarity is above threshold, null otherwise.
 */
export async function resolveSupplierFromText(
  supplierText: string,
): Promise<{ supplierId: string; supplierName: string } | null> {
  if (!supplierText?.trim()) return null;

  const suppliers = await getActiveSuppliers();
  const needle = supplierText.toLowerCase().trim();

  let bestMatch: Supplier | null = null;
  let bestScore = 0;

  for (const supplier of suppliers) {
    const candidates = [
      supplier.name.toLowerCase(),
      supplier.tradeName?.toLowerCase(),
      supplier.code.toLowerCase(),
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const score = similarityScore(needle, candidate);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = supplier;
      }
    }
  }

  // Require at least 60% similarity for a match
  if (bestMatch && bestScore >= 0.6) {
    return {
      supplierId: bestMatch.id,
      supplierName: bestMatch.name,
    };
  }

  return null;
}

/**
 * Simple similarity score between two strings.
 * Uses normalized longest common subsequence ratio.
 */
function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  // Exact containment
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }

  // Longest common subsequence ratio
  const lcsLen = lcs(a, b);
  return (2 * lcsLen) / (a.length + b.length);
}

/**
 * Length of longest common subsequence
 */
function lcs(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  // Use rolling array for memory efficiency
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return prev[n];
}
