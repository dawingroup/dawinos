/**
 * Manufacturing Order Service
 * CRUD, stage transitions, material reservation/consumption, and BOM management
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
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type {
  ManufacturingOrder,
  ManufacturingOrderStatus,
  MOStage,
  BOMEntry,
  MOPartEntry,
  MOStageTransition,
  MaterialReservation,
  MaterialConsumption,
  QualityCheck,
  MOFilters,
} from '../types';
import {
  reserveStock,
  consumeStock,
  releaseStock,
} from '@/modules/inventory/services/stockLevelService';

const MO_COLLECTION = 'manufacturingOrders';
const BUSINESS_EVENTS_COLLECTION = 'businessEvents';

// ============================================
// Auto-numbering
// ============================================

async function generateMONumber(subsidiaryId: string): Promise<string> {
  const year = new Date().getFullYear();
  const q = query(
    collection(db, MO_COLLECTION),
    where('subsidiaryId', '==', subsidiaryId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  const nextNum = snap.size + 1;
  return `MO-${year}-${String(nextNum).padStart(4, '0')}`;
}

// ============================================
// Business Event Emission
// ============================================

async function emitBusinessEvent(
  eventType: string,
  mo: Partial<ManufacturingOrder>,
  userId: string,
  extraData?: Record<string, unknown>,
): Promise<void> {
  await addDoc(collection(db, BUSINESS_EVENTS_COLLECTION), {
    eventType,
    category: 'workflow_transition',
    severity: eventType.includes('shortage') || eventType.includes('failed') ? 'high' : 'medium',
    sourceModule: 'manufacturing',
    subsidiary: 'finishes',
    entityType: 'manufacturing_order',
    entityId: mo.id ?? '',
    entityName: mo.moNumber ?? '',
    projectId: mo.projectId ?? null,
    projectName: mo.projectCode ?? null,
    title: `Manufacturing order ${eventType.replace(/_/g, ' ')}`,
    description: `MO ${mo.moNumber} for ${mo.designItemName ?? 'unknown item'}`,
    triggeredBy: userId,
    triggeredAt: serverTimestamp(),
    status: 'pending',
    metadata: extraData ?? {},
    createdAt: serverTimestamp(),
  });
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a manufacturing order (typically called by handoverService)
 */
export async function createManufacturingOrder(
  data: {
    designItemId: string;
    projectId: string;
    projectCode: string;
    designItemName: string;
    quantity: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    bom: BOMEntry[];
    parts: MOPartEntry[];
    instructions: string;
    handoverNotes: string;
    subsidiaryId: string;
  },
  userId: string,
): Promise<string> {
  const moNumber = await generateMONumber(data.subsidiaryId);

  // Calculate cost summary from BOM
  const materialCost = data.bom.reduce((sum, entry) => sum + entry.totalCost, 0);

  const moData = {
    moNumber,
    status: 'draft' as ManufacturingOrderStatus,
    designItemId: data.designItemId,
    projectId: data.projectId,
    projectCode: data.projectCode,
    designItemName: data.designItemName,
    quantity: data.quantity,
    priority: data.priority,
    bom: data.bom,
    parts: data.parts,
    instructions: data.instructions,
    handoverNotes: data.handoverNotes,
    scheduling: {},
    materialReservations: [],
    materialConsumptions: [],
    stageHistory: [
      {
        fromStage: null,
        toStage: 'queued' as MOStage,
        transitionedAt: new Date(),
        transitionedBy: userId,
        notes: 'Manufacturing order created',
      },
    ],
    currentStage: 'queued' as MOStage,
    stageEnteredAt: serverTimestamp(),
    costSummary: {
      materialCost,
      laborCost: 0,
      totalCost: materialCost,
      currency: 'UGX',
    },
    subsidiaryId: data.subsidiaryId,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  const docRef = await addDoc(collection(db, MO_COLLECTION), moData);
  await emitBusinessEvent(
    'manufacturing_order_created',
    { ...moData, id: docRef.id } as unknown as Partial<ManufacturingOrder>,
    userId,
  );

  return docRef.id;
}

/**
 * Get a single manufacturing order
 */
export async function getManufacturingOrder(
  moId: string,
): Promise<ManufacturingOrder | null> {
  const snap = await getDoc(doc(db, MO_COLLECTION, moId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ManufacturingOrder;
}

// ============================================
// Status Transitions
// ============================================

/**
 * Approve a manufacturing order (Draft → Approved)
 * Triggers material reservation
 */
export async function approveManufacturingOrder(
  moId: string,
  userId: string,
  defaultWarehouseId: string,
): Promise<{ success: boolean; shortages: Array<{ itemName: string; required: number; available: number }> }> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;
  if (mo.status !== 'draft') throw new Error('MO must be in draft status to approve');

  // Reserve materials from inventory
  const reservations: MaterialReservation[] = [];
  const shortages: Array<{ itemName: string; required: number; available: number }> = [];

  for (const bomEntry of mo.bom) {
    if (!bomEntry.inventoryItemId) continue;

    const warehouseId = bomEntry.warehouseId ?? defaultWarehouseId;
    const result = await reserveStock(
      bomEntry.inventoryItemId,
      warehouseId,
      bomEntry.sku,
      bomEntry.itemName,
      bomEntry.quantityRequired,
      moId,
      userId,
    );

    if (result.success) {
      reservations.push({
        id: `RES-${Date.now()}-${bomEntry.id}`,
        inventoryItemId: bomEntry.inventoryItemId,
        stockLevelId: result.stockLevelId,
        warehouseId,
        quantityReserved: bomEntry.quantityRequired,
        reservedAt: new Date() as any,
        reservedBy: userId,
        status: 'active',
      });
    } else {
      shortages.push({
        itemName: bomEntry.itemName,
        required: bomEntry.quantityRequired,
        available: result.availableQty,
      });
    }
  }

  if (shortages.length > 0) {
    // Emit shortage event but still proceed with partial reservation
    await emitBusinessEvent('material_shortage_detected', mo, userId, {
      shortages,
      reservedCount: reservations.length,
    });
  }

  await updateDoc(moRef, {
    status: shortages.length > 0 ? 'draft' : 'approved',
    materialReservations: reservations,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  if (shortages.length === 0) {
    await emitBusinessEvent('manufacturing_order_approved', mo, userId);
  }

  return { success: shortages.length === 0, shortages };
}

/**
 * Start production (Approved → In Progress)
 */
export async function startProduction(moId: string, userId: string): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;
  if (mo.status !== 'approved') throw new Error('MO must be approved to start production');

  await updateDoc(moRef, {
    status: 'in-progress',
    'scheduling.actualStart': serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Advance manufacturing stage
 */
export async function advanceStage(
  moId: string,
  userId: string,
  notes?: string,
): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;
  if (mo.status !== 'in-progress') throw new Error('MO must be in-progress');

  const stageOrder: MOStage[] = ['queued', 'cutting', 'assembly', 'finishing', 'qc', 'ready'];
  const currentIdx = stageOrder.indexOf(mo.currentStage);
  if (currentIdx === -1 || currentIdx >= stageOrder.length - 1) {
    throw new Error('Cannot advance past final stage');
  }

  const nextStage = stageOrder[currentIdx + 1];
  const transition: MOStageTransition = {
    fromStage: mo.currentStage,
    toStage: nextStage,
    transitionedAt: new Date() as any,
    transitionedBy: userId,
    notes,
  };

  const updateData: Record<string, unknown> = {
    currentStage: nextStage,
    stageEnteredAt: serverTimestamp(),
    stageHistory: [...mo.stageHistory, transition],
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  // If reaching 'ready', mark as completed
  if (nextStage === 'ready') {
    updateData.status = 'completed';
    updateData['scheduling.actualEnd'] = serverTimestamp();
  }

  await updateDoc(moRef, updateData);

  await emitBusinessEvent('manufacturing_order_stage_changed', mo, userId, {
    fromStage: mo.currentStage,
    toStage: nextStage,
  });

  if (nextStage === 'ready') {
    await emitBusinessEvent('manufacturing_order_completed', { ...mo, id: moId }, userId);
  }
}

/**
 * Record material consumption during a manufacturing stage
 */
export async function recordMaterialConsumption(
  moId: string,
  items: Array<{
    inventoryItemId: string;
    warehouseId: string;
    quantity: number;
  }>,
  userId: string,
): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;
  const newConsumptions: MaterialConsumption[] = [];

  for (const item of items) {
    await consumeStock(
      item.inventoryItemId,
      item.warehouseId,
      item.quantity,
      moId,
      userId,
    );

    newConsumptions.push({
      id: `CON-${Date.now()}-${item.inventoryItemId}`,
      inventoryItemId: item.inventoryItemId,
      stockLevelId: '',
      warehouseId: item.warehouseId,
      quantityConsumed: item.quantity,
      consumedAt: new Date() as any,
      consumedBy: userId,
      moStage: mo.currentStage,
    });
  }

  await updateDoc(moRef, {
    materialConsumptions: [...mo.materialConsumptions, ...newConsumptions],
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Record QC inspection
 */
export async function recordQualityCheck(
  moId: string,
  qc: QualityCheck,
  userId: string,
): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;

  await updateDoc(moRef, {
    qualityCheck: qc,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  if (!qc.passed) {
    await emitBusinessEvent('qc_inspection_failed', mo, userId, {
      defects: qc.defects,
      notes: qc.notes,
    });
  }
}

/**
 * Put MO on hold
 */
export async function putOnHold(
  moId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  await updateDoc(moRef, {
    status: 'on-hold',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  const mo = await getManufacturingOrder(moId);
  if (mo) {
    await emitBusinessEvent('manufacturing_order_on_hold', mo, userId, { reason });
  }
}

/**
 * Resume MO from hold
 */
export async function resumeFromHold(moId: string, userId: string): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  await updateDoc(moRef, {
    status: 'in-progress',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Cancel MO and release all material reservations
 */
export async function cancelManufacturingOrder(
  moId: string,
  userId: string,
  _reason: string,
): Promise<void> {
  const moRef = doc(db, MO_COLLECTION, moId);
  const moSnap = await getDoc(moRef);
  if (!moSnap.exists()) throw new Error('MO not found');

  const mo = { id: moId, ...moSnap.data() } as ManufacturingOrder;

  // Release all active reservations
  for (const reservation of mo.materialReservations) {
    if (reservation.status !== 'active') continue;
    await releaseStock(
      reservation.inventoryItemId,
      reservation.warehouseId,
      reservation.quantityReserved,
      moId,
      userId,
    );
  }

  const updatedReservations = mo.materialReservations.map((r) =>
    r.status === 'active' ? { ...r, status: 'released' as const } : r,
  );

  await updateDoc(moRef, {
    status: 'cancelled',
    materialReservations: updatedReservations,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

// ============================================
// Queries & Subscriptions
// ============================================

/**
 * Subscribe to manufacturing orders with filters (real-time)
 */
export function subscribeToManufacturingOrders(
  filters: MOFilters & { subsidiaryId: string },
  callback: (orders: ManufacturingOrder[]) => void,
): () => void {
  const constraints: QueryConstraint[] = [
    where('subsidiaryId', '==', filters.subsidiaryId),
  ];

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    if (statuses.length === 1) {
      constraints.push(where('status', '==', statuses[0]));
    }
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, MO_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    let orders = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as ManufacturingOrder),
    );

    if (filters.search) {
      const term = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.moNumber.toLowerCase().includes(term) ||
          o.designItemName.toLowerCase().includes(term),
      );
    }

    if (filters.projectId) {
      orders = orders.filter((o) => o.projectId === filters.projectId);
    }

    callback(orders);
  });
}

/**
 * Subscribe to a single MO (real-time)
 */
export function subscribeToManufacturingOrder(
  moId: string,
  callback: (order: ManufacturingOrder | null) => void,
): () => void {
  const docRef = doc(db, MO_COLLECTION, moId);
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as ManufacturingOrder);
  });
}

/**
 * Get MOs linked to a specific design item
 */
export async function getMOsByDesignItem(
  designItemId: string,
): Promise<ManufacturingOrder[]> {
  const q = query(
    collection(db, MO_COLLECTION),
    where('designItemId', '==', designItemId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ManufacturingOrder));
}
