/**
 * Katana Parts Sync Service
 * Syncs standard parts/consumables from Katana inventory
 * Provides local cache for quick lookup and recommendations
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

// ============================================
// Types
// ============================================

export interface StandardPart {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: PartCategory;
  subCategory?: string;
  material?: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    unit: string;
  };
  unitPrice?: number;
  currency?: string;
  supplier?: string;
  minimumOrderQty?: number;
  leadTimeDays?: number;
  inStock?: boolean;
  stockLevel?: number;
  katanaItemId?: string;
  lastSyncedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PartCategory = 
  | 'hardware'      // Hinges, handles, slides, locks
  | 'fasteners'     // Screws, nails, dominos, biscuits
  | 'adhesives'     // Glue, tape, sealants
  | 'finishes'      // Paint, stain, lacquer, oil
  | 'edge-banding'  // PVC, veneer, solid wood edge
  | 'panels'        // Sheet goods, boards
  | 'lumber'        // Solid wood
  | 'consumables'   // Sandpaper, masks, blades
  | 'packaging'     // Boxes, wrap, foam
  | 'other';

export interface KatanaItem {
  id: string;
  name: string;
  sku: string;
  category_name?: string;
  unit_price?: number;
  currency?: string;
  stock_on_hand?: number;
  supplier_name?: string;
  lead_time_days?: number;
  minimum_order_quantity?: number;
  notes?: string;
}

export interface PartSearchFilters {
  category?: PartCategory;
  searchText?: string;
  inStockOnly?: boolean;
  maxPrice?: number;
  supplier?: string;
}

export interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: number;
  timestamp: Date;
}

// ============================================
// Constants
// ============================================

const STANDARD_PARTS_COLLECTION = 'standardParts';

// Category mapping from Katana categories
const CATEGORY_MAPPING: Record<string, PartCategory> = {
  'hardware': 'hardware',
  'hinges': 'hardware',
  'handles': 'hardware',
  'slides': 'hardware',
  'locks': 'hardware',
  'screws': 'fasteners',
  'nails': 'fasteners',
  'fasteners': 'fasteners',
  'dominos': 'fasteners',
  'biscuits': 'fasteners',
  'glue': 'adhesives',
  'adhesive': 'adhesives',
  'tape': 'adhesives',
  'sealant': 'adhesives',
  'paint': 'finishes',
  'stain': 'finishes',
  'lacquer': 'finishes',
  'finish': 'finishes',
  'oil': 'finishes',
  'edge': 'edge-banding',
  'edging': 'edge-banding',
  'pvc': 'edge-banding',
  'veneer': 'edge-banding',
  'panel': 'panels',
  'board': 'panels',
  'plywood': 'panels',
  'mdf': 'panels',
  'melamine': 'panels',
  'lumber': 'lumber',
  'wood': 'lumber',
  'timber': 'lumber',
  'sandpaper': 'consumables',
  'blade': 'consumables',
  'mask': 'consumables',
  'ppe': 'consumables',
  'box': 'packaging',
  'wrap': 'packaging',
  'foam': 'packaging',
};

// ============================================
// Sync Functions
// ============================================

/**
 * Sync parts from Katana API
 * This would normally call Katana's API, but for now we simulate
 */
export async function syncFromKatana(
  katanaItems: KatanaItem[]
): Promise<SyncResult> {
  const result: SyncResult = {
    synced: 0,
    created: 0,
    updated: 0,
    errors: 0,
    timestamp: new Date(),
  };

  const batch = writeBatch(db);
  const existingParts = await getExistingPartsBySku();

  for (const item of katanaItems) {
    try {
      const category = inferCategory(item.category_name, item.name);
      const partId = item.sku.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      const partData: Omit<StandardPart, 'id'> = {
        sku: item.sku,
        name: item.name,
        description: item.notes,
        category,
        unitPrice: item.unit_price,
        currency: item.currency || 'UGX',
        supplier: item.supplier_name,
        minimumOrderQty: item.minimum_order_quantity,
        leadTimeDays: item.lead_time_days,
        inStock: (item.stock_on_hand || 0) > 0,
        stockLevel: item.stock_on_hand,
        katanaItemId: item.id,
        lastSyncedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdAt: existingParts.has(item.sku) 
          ? existingParts.get(item.sku)!.createdAt 
          : Timestamp.now(),
      };

      const docRef = doc(db, STANDARD_PARTS_COLLECTION, partId);
      batch.set(docRef, { id: partId, ...partData }, { merge: true });

      if (existingParts.has(item.sku)) {
        result.updated++;
      } else {
        result.created++;
      }
      result.synced++;
    } catch (error) {
      console.error(`Error syncing part ${item.sku}:`, error);
      result.errors++;
    }
  }

  await batch.commit();
  return result;
}

/**
 * Get existing parts indexed by SKU
 */
async function getExistingPartsBySku(): Promise<Map<string, StandardPart>> {
  const snapshot = await getDocs(collection(db, STANDARD_PARTS_COLLECTION));
  const parts = new Map<string, StandardPart>();
  
  snapshot.docs.forEach(doc => {
    const part = { id: doc.id, ...doc.data() } as StandardPart;
    parts.set(part.sku, part);
  });
  
  return parts;
}

/**
 * Infer category from Katana category name and item name
 */
function inferCategory(categoryName?: string, itemName?: string): PartCategory {
  const searchText = `${categoryName || ''} ${itemName || ''}`.toLowerCase();
  
  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (searchText.includes(keyword)) {
      return category;
    }
  }
  
  return 'other';
}

// ============================================
// Query Functions
// ============================================

/**
 * Get all standard parts
 */
export async function getStandardParts(): Promise<StandardPart[]> {
  const snapshot = await getDocs(
    query(collection(db, STANDARD_PARTS_COLLECTION), orderBy('name'))
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StandardPart);
}

/**
 * Get parts by category
 */
export async function getPartsByCategory(category: PartCategory): Promise<StandardPart[]> {
  const snapshot = await getDocs(
    query(
      collection(db, STANDARD_PARTS_COLLECTION),
      where('category', '==', category),
      orderBy('name')
    )
  );
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StandardPart);
}

/**
 * Search parts with filters
 */
export async function searchParts(filters: PartSearchFilters): Promise<StandardPart[]> {
  let q = query(collection(db, STANDARD_PARTS_COLLECTION));
  
  if (filters.category) {
    q = query(q, where('category', '==', filters.category));
  }
  
  if (filters.inStockOnly) {
    q = query(q, where('inStock', '==', true));
  }
  
  const snapshot = await getDocs(q);
  let parts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StandardPart);
  
  // Client-side filtering for text search
  if (filters.searchText) {
    const searchLower = filters.searchText.toLowerCase();
    parts = parts.filter(part => 
      part.name.toLowerCase().includes(searchLower) ||
      part.sku.toLowerCase().includes(searchLower) ||
      part.description?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.maxPrice) {
    parts = parts.filter(part => 
      !part.unitPrice || part.unitPrice <= filters.maxPrice!
    );
  }
  
  if (filters.supplier) {
    const supplierLower = filters.supplier.toLowerCase();
    parts = parts.filter(part => 
      part.supplier?.toLowerCase().includes(supplierLower)
    );
  }
  
  return parts;
}

/**
 * Get part by SKU
 */
export async function getPartBySku(sku: string): Promise<StandardPart | null> {
  const snapshot = await getDocs(
    query(
      collection(db, STANDARD_PARTS_COLLECTION),
      where('sku', '==', sku),
      limit(1)
    )
  );
  
  if (snapshot.empty) return null;
  
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as StandardPart;
}

/**
 * Get part by ID
 */
export async function getPartById(id: string): Promise<StandardPart | null> {
  const docRef = doc(db, STANDARD_PARTS_COLLECTION, id);
  
  // Use getDoc instead
  const { getDoc } = await import('firebase/firestore');
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as StandardPart;
}

// ============================================
// Recommendation Functions
// ============================================

/**
 * Get recommended parts for a design item category
 */
export async function getRecommendedParts(
  designItemCategory: string,
  existingPartSkus: string[] = []
): Promise<StandardPart[]> {
  // Map design item categories to part categories
  const partCategories: PartCategory[] = [];
  const categoryLower = designItemCategory.toLowerCase();
  
  // Always recommend hardware for furniture items
  if (['cabinet', 'drawer', 'wardrobe', 'door', 'furniture'].some(c => categoryLower.includes(c))) {
    partCategories.push('hardware', 'fasteners');
  }
  
  // Recommend finishes for visible items
  if (['table', 'desk', 'shelf', 'cabinet'].some(c => categoryLower.includes(c))) {
    partCategories.push('finishes');
  }
  
  // Get parts from recommended categories
  const parts: StandardPart[] = [];
  for (const category of partCategories) {
    const categoryParts = await getPartsByCategory(category);
    parts.push(...categoryParts);
  }
  
  // Filter out already added parts
  const filtered = parts.filter(part => !existingPartSkus.includes(part.sku));
  
  // Sort by popularity/usage (if we had usage data) or just by name
  return filtered.slice(0, 10);
}

/**
 * Get common consumables that might be missing
 */
export async function getSuggestedConsumables(
  _designItemNames: string[] = []
): Promise<StandardPart[]> {
  const consumables = await getPartsByCategory('consumables');
  const fasteners = await getPartsByCategory('fasteners');
  const adhesives = await getPartsByCategory('adhesives');
  
  // Combine and return top suggestions
  const all = [...consumables, ...fasteners, ...adhesives];
  
  // Sort by stock availability first, then by name
  return all
    .sort((a, b) => {
      if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 15);
}

// ============================================
// Manual Part Management
// ============================================

/**
 * Add a custom part (not from Katana)
 */
export async function addCustomPart(
  partData: Omit<StandardPart, 'id' | 'createdAt' | 'updatedAt'>
): Promise<StandardPart> {
  const partId = partData.sku.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  
  const part: StandardPart = {
    ...partData,
    id: partId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await setDoc(doc(db, STANDARD_PARTS_COLLECTION, partId), part);
  return part;
}

/**
 * Update a part
 */
export async function updatePart(
  partId: string,
  updates: Partial<StandardPart>
): Promise<void> {
  await setDoc(
    doc(db, STANDARD_PARTS_COLLECTION, partId),
    { ...updates, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

// ============================================
// Statistics
// ============================================

/**
 * Get parts statistics
 */
export async function getPartsStats(): Promise<{
  totalParts: number;
  byCategory: Record<PartCategory, number>;
  inStock: number;
  outOfStock: number;
  lastSyncedAt?: Date;
}> {
  const parts = await getStandardParts();
  
  const byCategory: Record<PartCategory, number> = {
    hardware: 0,
    fasteners: 0,
    adhesives: 0,
    finishes: 0,
    'edge-banding': 0,
    panels: 0,
    lumber: 0,
    consumables: 0,
    packaging: 0,
    other: 0,
  };
  
  let inStock = 0;
  let outOfStock = 0;
  let latestSync: Date | undefined;
  
  for (const part of parts) {
    byCategory[part.category] = (byCategory[part.category] || 0) + 1;
    
    if (part.inStock) {
      inStock++;
    } else {
      outOfStock++;
    }
    
    if (part.lastSyncedAt) {
      const syncDate = part.lastSyncedAt.toDate();
      if (!latestSync || syncDate > latestSync) {
        latestSync = syncDate;
      }
    }
  }
  
  return {
    totalParts: parts.length,
    byCategory,
    inStock,
    outOfStock,
    lastSyncedAt: latestSync,
  };
}
