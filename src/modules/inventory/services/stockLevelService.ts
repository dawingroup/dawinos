/**
 * Stock Level Service
 * Multi-location stock tracking with reservations, consumption, transfers, and audit trail
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type {
  StockLevel,
  StockMovement,
  StockMovementType,
  StockMovementReferenceType,
  CostHistoryEntry,
  CostChangeSource,
  StockTransferRequest,
} from '../types/warehouse';

const STOCK_LEVELS_COLLECTION = 'stockLevels';
const MOVEMENTS_SUBCOLLECTION = 'movements';
const COST_HISTORY_COLLECTION = 'costHistory';
const INVENTORY_ITEMS_COLLECTION = 'inventoryItems';

// ============================================
// Stock Level Queries
// ============================================

/**
 * Get all stock levels for an inventory item across all locations
 */
export async function getStockLevels(inventoryItemId: string): Promise<StockLevel[]> {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('inventoryItemId', '==', inventoryItemId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockLevel));
}

/**
 * Get all stock levels at a specific warehouse
 */
export async function getStockByWarehouse(warehouseId: string): Promise<StockLevel[]> {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('warehouseId', '==', warehouseId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as StockLevel));
}

/**
 * Get a specific stock level (item + warehouse combo)
 */
export async function getStockLevel(
  inventoryItemId: string,
  warehouseId: string,
): Promise<StockLevel | null> {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('inventoryItemId', '==', inventoryItemId),
    where('warehouseId', '==', warehouseId),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as StockLevel;
}

/**
 * Get aggregated stock across all locations for an item
 */
export async function getAggregatedStock(inventoryItemId: string): Promise<{
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
}> {
  const levels = await getStockLevels(inventoryItemId);
  return levels.reduce(
    (acc, sl) => ({
      totalOnHand: acc.totalOnHand + sl.quantityOnHand,
      totalReserved: acc.totalReserved + sl.quantityReserved,
      totalAvailable: acc.totalAvailable + sl.quantityAvailable,
    }),
    { totalOnHand: 0, totalReserved: 0, totalAvailable: 0 },
  );
}

// ============================================
// Stock Level Subscriptions
// ============================================

/**
 * Subscribe to stock levels at a warehouse (real-time)
 */
export function subscribeToStockByWarehouse(
  warehouseId: string,
  callback: (levels: StockLevel[]) => void,
): () => void {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('warehouseId', '==', warehouseId),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StockLevel)));
  });
}

/**
 * Subscribe to stock levels for an item across all locations (real-time)
 */
export function subscribeToStockLevels(
  inventoryItemId: string,
  callback: (levels: StockLevel[]) => void,
): () => void {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('inventoryItemId', '==', inventoryItemId),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StockLevel)));
  });
}

// ============================================
// Stock Adjustments
// ============================================

/**
 * Get or create a stock level document for an item+warehouse combo
 */
async function getOrCreateStockLevel(
  inventoryItemId: string,
  warehouseId: string,
  sku: string,
  itemName: string,
): Promise<string> {
  const existing = await getStockLevel(inventoryItemId, warehouseId);
  if (existing) return existing.id;

  const docRef = await addDoc(collection(db, STOCK_LEVELS_COLLECTION), {
    inventoryItemId,
    warehouseId,
    sku,
    itemName,
    quantityOnHand: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Record a stock movement and update stock level atomically
 */
async function recordMovement(
  stockLevelId: string,
  movement: {
    type: StockMovementType;
    quantity: number;
    referenceType: StockMovementReferenceType;
    referenceId: string;
    notes?: string;
    performedBy: string;
  },
  updates: {
    quantityOnHand?: number;
    quantityReserved?: number;
  },
): Promise<void> {
  const batch = writeBatch(db);

  // Record movement in subcollection
  const movementRef = doc(
    collection(db, STOCK_LEVELS_COLLECTION, stockLevelId, MOVEMENTS_SUBCOLLECTION),
  );
  batch.set(movementRef, {
    ...movement,
    performedAt: serverTimestamp(),
  });

  // Update stock level
  const stockRef = doc(db, STOCK_LEVELS_COLLECTION, stockLevelId);
  const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.quantityOnHand !== undefined) {
    updateData.quantityOnHand = increment(updates.quantityOnHand);
    updateData.quantityAvailable = increment(
      updates.quantityOnHand - (updates.quantityReserved ?? 0),
    );
  }
  if (updates.quantityReserved !== undefined && updates.quantityOnHand === undefined) {
    updateData.quantityReserved = increment(updates.quantityReserved);
    updateData.quantityAvailable = increment(-updates.quantityReserved);
  }

  if (movement.type === 'receipt') {
    updateData.lastReceivedAt = serverTimestamp();
  } else if (movement.type === 'consumption') {
    updateData.lastConsumedAt = serverTimestamp();
  }

  batch.update(stockRef, updateData);
  await batch.commit();
}

/**
 * Receive stock from a purchase order
 */
export async function receiveStock(
  inventoryItemId: string,
  warehouseId: string,
  sku: string,
  itemName: string,
  quantity: number,
  poId: string,
  userId: string,
  notes?: string,
): Promise<void> {
  const stockLevelId = await getOrCreateStockLevel(inventoryItemId, warehouseId, sku, itemName);
  await recordMovement(
    stockLevelId,
    {
      type: 'receipt',
      quantity,
      referenceType: 'po',
      referenceId: poId,
      notes,
      performedBy: userId,
    },
    { quantityOnHand: quantity },
  );
}

/**
 * Reserve stock for a manufacturing order
 */
export async function reserveStock(
  inventoryItemId: string,
  warehouseId: string,
  sku: string,
  itemName: string,
  quantity: number,
  moId: string,
  userId: string,
): Promise<{ stockLevelId: string; success: boolean; availableQty: number }> {
  const stockLevelId = await getOrCreateStockLevel(inventoryItemId, warehouseId, sku, itemName);

  // Check availability in a transaction
  return runTransaction(db, async (transaction) => {
    const stockRef = doc(db, STOCK_LEVELS_COLLECTION, stockLevelId);
    const stockSnap = await transaction.get(stockRef);
    const data = stockSnap.data();
    const available = (data?.quantityAvailable ?? 0) as number;

    if (available < quantity) {
      return { stockLevelId, success: false, availableQty: available };
    }

    // Reserve the stock
    transaction.update(stockRef, {
      quantityReserved: increment(quantity),
      quantityAvailable: increment(-quantity),
      updatedAt: serverTimestamp(),
    });

    // Record movement
    const movementRef = doc(
      collection(db, STOCK_LEVELS_COLLECTION, stockLevelId, MOVEMENTS_SUBCOLLECTION),
    );
    transaction.set(movementRef, {
      type: 'reservation',
      quantity: -quantity,
      referenceType: 'mo',
      referenceId: moId,
      performedBy: userId,
      performedAt: serverTimestamp(),
    });

    return { stockLevelId, success: true, availableQty: available - quantity };
  });
}

/**
 * Consume reserved stock during manufacturing
 */
export async function consumeStock(
  inventoryItemId: string,
  warehouseId: string,
  quantity: number,
  moId: string,
  userId: string,
): Promise<void> {
  const stockLevel = await getStockLevel(inventoryItemId, warehouseId);
  if (!stockLevel) throw new Error('Stock level not found');

  const batch = writeBatch(db);
  const stockRef = doc(db, STOCK_LEVELS_COLLECTION, stockLevel.id);

  // Decrease both onHand and reserved (available stays same)
  batch.update(stockRef, {
    quantityOnHand: increment(-quantity),
    quantityReserved: increment(-quantity),
    lastConsumedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Record movement
  const movementRef = doc(
    collection(db, STOCK_LEVELS_COLLECTION, stockLevel.id, MOVEMENTS_SUBCOLLECTION),
  );
  batch.set(movementRef, {
    type: 'consumption',
    quantity: -quantity,
    referenceType: 'mo',
    referenceId: moId,
    performedBy: userId,
    performedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Release previously reserved stock (e.g., MO cancelled)
 */
export async function releaseStock(
  inventoryItemId: string,
  warehouseId: string,
  quantity: number,
  moId: string,
  userId: string,
): Promise<void> {
  const stockLevel = await getStockLevel(inventoryItemId, warehouseId);
  if (!stockLevel) throw new Error('Stock level not found');

  const batch = writeBatch(db);
  const stockRef = doc(db, STOCK_LEVELS_COLLECTION, stockLevel.id);

  batch.update(stockRef, {
    quantityReserved: increment(-quantity),
    quantityAvailable: increment(quantity),
    updatedAt: serverTimestamp(),
  });

  const movementRef = doc(
    collection(db, STOCK_LEVELS_COLLECTION, stockLevel.id, MOVEMENTS_SUBCOLLECTION),
  );
  batch.set(movementRef, {
    type: 'release',
    quantity,
    referenceType: 'mo',
    referenceId: moId,
    performedBy: userId,
    performedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Transfer stock between warehouses
 */
export async function transferStock(
  request: StockTransferRequest,
  userId: string,
): Promise<void> {
  const { inventoryItemId, fromWarehouseId, toWarehouseId, quantity, notes } = request;

  // Get source stock level
  const sourceStock = await getStockLevel(inventoryItemId, fromWarehouseId);
  if (!sourceStock) throw new Error('Source stock level not found');
  if (sourceStock.quantityAvailable < quantity) {
    throw new Error(
      `Insufficient available stock. Available: ${sourceStock.quantityAvailable}, Requested: ${quantity}`,
    );
  }

  // Get/create destination stock level
  const destStockId = await getOrCreateStockLevel(
    inventoryItemId,
    toWarehouseId,
    sourceStock.sku,
    sourceStock.itemName,
  );

  const transferId = `TRF-${Date.now()}`;
  const batch = writeBatch(db);

  // Decrease source
  const sourceRef = doc(db, STOCK_LEVELS_COLLECTION, sourceStock.id);
  batch.update(sourceRef, {
    quantityOnHand: increment(-quantity),
    quantityAvailable: increment(-quantity),
    updatedAt: serverTimestamp(),
  });

  // Source movement
  const sourceMovementRef = doc(
    collection(db, STOCK_LEVELS_COLLECTION, sourceStock.id, MOVEMENTS_SUBCOLLECTION),
  );
  batch.set(sourceMovementRef, {
    type: 'transfer',
    quantity: -quantity,
    referenceType: 'transfer',
    referenceId: transferId,
    notes: notes ?? `Transfer to warehouse ${toWarehouseId}`,
    performedBy: userId,
    performedAt: serverTimestamp(),
  });

  // Increase destination
  const destRef = doc(db, STOCK_LEVELS_COLLECTION, destStockId);
  batch.update(destRef, {
    quantityOnHand: increment(quantity),
    quantityAvailable: increment(quantity),
    lastReceivedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Destination movement
  const destMovementRef = doc(
    collection(db, STOCK_LEVELS_COLLECTION, destStockId, MOVEMENTS_SUBCOLLECTION),
  );
  batch.set(destMovementRef, {
    type: 'transfer',
    quantity,
    referenceType: 'transfer',
    referenceId: transferId,
    notes: notes ?? `Transfer from warehouse ${fromWarehouseId}`,
    performedBy: userId,
    performedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Manual stock adjustment (inventory count correction)
 */
export async function adjustStock(
  inventoryItemId: string,
  warehouseId: string,
  sku: string,
  itemName: string,
  quantityDelta: number,
  userId: string,
  notes?: string,
): Promise<void> {
  const stockLevelId = await getOrCreateStockLevel(inventoryItemId, warehouseId, sku, itemName);
  await recordMovement(
    stockLevelId,
    {
      type: 'adjustment',
      quantity: quantityDelta,
      referenceType: 'manual',
      referenceId: `ADJ-${Date.now()}`,
      notes,
      performedBy: userId,
    },
    { quantityOnHand: quantityDelta },
  );
}

// ============================================
// Stock Movement History
// ============================================

/**
 * Get movement history for a stock level
 */
export async function getStockMovements(
  stockLevelId: string,
  limitCount = 50,
): Promise<StockMovement[]> {
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION, stockLevelId, MOVEMENTS_SUBCOLLECTION),
    orderBy('performedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs
    .slice(0, limitCount)
    .map((d) => ({ id: d.id, ...d.data() } as StockMovement));
}

// ============================================
// Cost History
// ============================================

/**
 * Record a cost change for an inventory item
 */
export async function recordCostChange(
  inventoryItemId: string,
  previousCost: number,
  newCost: number,
  currency: string,
  source: CostChangeSource,
  userId: string,
  referenceId?: string,
  poNumber?: string,
  notes?: string,
): Promise<void> {
  await addDoc(collection(db, COST_HISTORY_COLLECTION), {
    inventoryItemId,
    previousCost,
    newCost,
    currency,
    source,
    referenceId,
    poNumber,
    notes,
    recordedAt: serverTimestamp(),
    recordedBy: userId,
  });
}

/**
 * Get cost history for an inventory item
 */
export async function getCostHistory(inventoryItemId: string): Promise<CostHistoryEntry[]> {
  const q = query(
    collection(db, COST_HISTORY_COLLECTION),
    where('inventoryItemId', '==', inventoryItemId),
    orderBy('recordedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CostHistoryEntry));
}

/**
 * Subscribe to cost history for an item (real-time)
 */
export function subscribeToCostHistory(
  inventoryItemId: string,
  callback: (entries: CostHistoryEntry[]) => void,
): () => void {
  const q = query(
    collection(db, COST_HISTORY_COLLECTION),
    where('inventoryItemId', '==', inventoryItemId),
    orderBy('recordedAt', 'desc'),
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CostHistoryEntry)));
  });
}

// ============================================
// Inventory Item Cost Updates
// ============================================

/**
 * Update inventory item cost using weighted average after PO receipt
 *
 * Formula:
 *   newAvgCost = ((existingQty * existingCost) + (receivedQty * effectiveUnitCost))
 *                / (existingQty + receivedQty)
 */
export async function updateInventoryItemCostFromReceipt(
  inventoryItemId: string,
  receivedQuantity: number,
  effectiveUnitCost: number,
  currency: string,
  userId: string,
  poId: string,
  poNumber: string,
): Promise<void> {
  const itemRef = doc(db, INVENTORY_ITEMS_COLLECTION, inventoryItemId);
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) return;

  const itemData = itemSnap.data();
  const existingCost = itemData?.pricing?.costPerUnit ?? 0;
  const existingQty = itemData?.inventory?.inStock ?? 0;

  const totalQty = existingQty + receivedQuantity;
  const newAvgCost =
    totalQty > 0
      ? ((existingQty * existingCost) + (receivedQuantity * effectiveUnitCost)) / totalQty
      : effectiveUnitCost;

  // Record cost change
  await recordCostChange(
    inventoryItemId,
    existingCost,
    newAvgCost,
    currency,
    'po_receipt',
    userId,
    poId,
    poNumber,
    `Weighted avg: (${existingQty} x ${existingCost} + ${receivedQuantity} x ${effectiveUnitCost}) / ${totalQty}`,
  );

  // Update inventory item pricing
  await updateDoc(itemRef, {
    'pricing.costPerUnit': newAvgCost,
    'pricing.lastUpdatedAt': serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// Low Stock Detection
// ============================================

/**
 * Get stock levels that are below their reorder level
 */
export async function getLowStockLevels(): Promise<StockLevel[]> {
  // Firestore can't do field-to-field comparison, so we fetch all with reorder levels set
  // and filter client-side
  const q = query(
    collection(db, STOCK_LEVELS_COLLECTION),
    where('reorderLevel', '>', 0),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as StockLevel))
    .filter((sl) => sl.quantityAvailable < (sl.reorderLevel ?? 0));
}
