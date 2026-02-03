/**
 * Purchase Order Service
 * Full PO lifecycle: Draft → Approval → Sent → Receive → Close
 * Includes landed cost calculation and inventory cost updates
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
  PurchaseOrder,
  PurchaseOrderStatus,
  POLineItem,
  LandedCosts,
  POApproval,
  GoodsReceipt,
  POTotals,
  POFilters,
} from '../types/purchaseOrder';
import {
  receiveStock,
  updateInventoryItemCostFromReceipt,
} from '@/modules/inventory/services/stockLevelService';
import { updateRequirementsByPOStatus } from './procurementRequirementService';

const PURCHASE_ORDERS_COLLECTION = 'purchaseOrders';
const BUSINESS_EVENTS_COLLECTION = 'businessEvents';

// ============================================
// Auto-numbering
// ============================================

async function generatePONumber(subsidiaryId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = subsidiaryId === 'finishes' ? 'PO-FIN' : 'PO';

  const q = query(
    collection(db, PURCHASE_ORDERS_COLLECTION),
    where('subsidiaryId', '==', subsidiaryId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  const nextNum = snap.size + 1;

  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
}

// ============================================
// Landed Cost Calculation
// ============================================

/**
 * Calculate landed cost distribution across line items
 * and compute effective unit costs
 */
export function calculateLandedCostDistribution(
  lineItems: POLineItem[],
  landedCosts: LandedCosts,
): { updatedLineItems: POLineItem[]; totals: POTotals } {
  const totalLanded =
    landedCosts.shipping +
    landedCosts.customs +
    landedCosts.duties +
    landedCosts.insurance +
    landedCosts.handling +
    landedCosts.other;

  const subtotal = lineItems.reduce((sum, li) => sum + li.totalCost, 0);
  const totalWeight = lineItems.reduce((sum, li) => sum + (li.weight ?? 0), 0);

  const updatedLineItems = lineItems.map((li) => {
    let allocation = 0;

    switch (landedCosts.distributionMethod) {
      case 'proportional_value':
        allocation = subtotal > 0 ? (li.totalCost / subtotal) * totalLanded : 0;
        break;
      case 'proportional_weight':
        allocation =
          totalWeight > 0 ? ((li.weight ?? 0) / totalWeight) * totalLanded : 0;
        break;
      case 'equal':
        allocation = lineItems.length > 0 ? totalLanded / lineItems.length : 0;
        break;
    }

    const effectiveUnitCost =
      li.quantity > 0 ? (li.totalCost + allocation) / li.quantity : li.unitCost;

    return {
      ...li,
      landedCostAllocation: Math.round(allocation * 100) / 100,
      effectiveUnitCost: Math.round(effectiveUnitCost * 100) / 100,
    };
  });

  const totals: POTotals = {
    subtotal: Math.round(subtotal * 100) / 100,
    landedCostTotal: Math.round(totalLanded * 100) / 100,
    grandTotal: Math.round((subtotal + totalLanded) * 100) / 100,
    currency: landedCosts.currency,
  };

  return { updatedLineItems, totals };
}

// ============================================
// Business Event Emission
// ============================================

async function emitBusinessEvent(
  eventType: string,
  po: Partial<PurchaseOrder>,
  userId: string,
  extraData?: Record<string, unknown>,
): Promise<void> {
  await addDoc(collection(db, BUSINESS_EVENTS_COLLECTION), {
    eventType,
    category: 'workflow_transition',
    severity: 'medium',
    sourceModule: 'manufacturing',
    subsidiary: 'finishes',
    entityType: 'purchase_order',
    entityId: po.id ?? '',
    entityName: po.poNumber ?? '',
    projectId: po.linkedProjectId ?? null,
    title: `Purchase order ${eventType.replace(/_/g, ' ')}`,
    description: `PO ${po.poNumber} - ${po.supplierName ?? 'unknown supplier'}`,
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
 * Create a draft purchase order
 */
export async function createPurchaseOrder(
  data: {
    supplierName: string;
    supplierContact?: string;
    supplierId?: string;
    lineItems: POLineItem[];
    landedCosts: LandedCosts;
    linkedMOIds?: string[];
    linkedProjectId?: string;
    notes?: string;
    subsidiaryId: string;
  },
  userId: string,
): Promise<string> {
  const poNumber = await generatePONumber(data.subsidiaryId);
  const { updatedLineItems, totals } = calculateLandedCostDistribution(
    data.lineItems,
    data.landedCosts,
  );

  const landedCosts: LandedCosts = {
    ...data.landedCosts,
    totalLandedCost: totals.landedCostTotal,
  };

  const poData = {
    poNumber,
    status: 'draft' as PurchaseOrderStatus,
    supplierName: data.supplierName,
    supplierContact: data.supplierContact ?? null,
    supplierId: data.supplierId ?? null,
    lineItems: updatedLineItems,
    landedCosts,
    totals,
    approvals: [],
    receivingHistory: [],
    linkedMOIds: data.linkedMOIds ?? [],
    linkedProjectId: data.linkedProjectId ?? null,
    notes: data.notes ?? null,
    subsidiaryId: data.subsidiaryId,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  const docRef = await addDoc(collection(db, PURCHASE_ORDERS_COLLECTION), poData);

  await emitBusinessEvent('purchase_order_created', { ...poData, id: docRef.id } as unknown as Partial<PurchaseOrder>, userId);

  return docRef.id;
}

/**
 * Update purchase order details (only in draft/pending-approval status)
 */
export async function updatePurchaseOrder(
  poId: string,
  data: {
    supplierName?: string;
    supplierContact?: string;
    lineItems?: POLineItem[];
    landedCosts?: LandedCosts;
    notes?: string;
    linkedMOIds?: string[];
    linkedProjectId?: string;
  },
  userId: string,
): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('Purchase order not found');

  const existing = poSnap.data() as PurchaseOrder;
  if (!['draft', 'pending-approval'].includes(existing.status)) {
    throw new Error(`Cannot edit PO in ${existing.status} status`);
  }

  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };

  if (data.supplierName) updateData.supplierName = data.supplierName;
  if (data.supplierContact !== undefined) updateData.supplierContact = data.supplierContact;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.linkedMOIds) updateData.linkedMOIds = data.linkedMOIds;
  if (data.linkedProjectId !== undefined) updateData.linkedProjectId = data.linkedProjectId;

  // Recalculate if line items or landed costs changed
  if (data.lineItems || data.landedCosts) {
    const lineItems = data.lineItems ?? existing.lineItems;
    const landedCosts = data.landedCosts ?? existing.landedCosts;
    const { updatedLineItems, totals } = calculateLandedCostDistribution(lineItems, landedCosts);

    updateData.lineItems = updatedLineItems;
    updateData.landedCosts = { ...landedCosts, totalLandedCost: totals.landedCostTotal };
    updateData.totals = totals;
  }

  await updateDoc(poRef, updateData);
}

/**
 * Get a single purchase order by ID
 */
export async function getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
  const docRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as PurchaseOrder;
}

// ============================================
// Status Transitions
// ============================================

/**
 * Submit PO for approval (Draft → Pending Approval)
 */
export async function submitForApproval(poId: string, userId: string): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (po.status !== 'draft') throw new Error('PO must be in draft status');
  if (po.lineItems.length === 0) throw new Error('PO must have at least one line item');

  const approval: POApproval = {
    id: `APR-${Date.now()}`,
    approverId: '',
    approverName: '',
    status: 'pending',
    level: 1,
  };

  await updateDoc(poRef, {
    status: 'pending-approval',
    approvals: [approval],
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await emitBusinessEvent('purchase_order_submitted_for_approval', po, userId);
}

/**
 * Approve a purchase order (Pending Approval → Approved)
 */
export async function approvePurchaseOrder(
  poId: string,
  userId: string,
  approverName: string,
  notes?: string,
): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (po.status !== 'pending-approval') throw new Error('PO is not pending approval');

  const updatedApprovals = po.approvals.map((a) =>
    a.status === 'pending'
      ? {
          ...a,
          approverId: userId,
          approverName,
          status: 'approved' as const,
          respondedAt: new Date(),
          notes,
        }
      : a,
  );

  await updateDoc(poRef, {
    status: 'approved',
    approvals: updatedApprovals,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await emitBusinessEvent('purchase_order_approved', po, userId);
}

/**
 * Reject a purchase order (Pending Approval → Draft)
 */
export async function rejectPurchaseOrder(
  poId: string,
  userId: string,
  approverName: string,
  notes: string,
): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (po.status !== 'pending-approval') throw new Error('PO is not pending approval');

  const updatedApprovals = po.approvals.map((a) =>
    a.status === 'pending'
      ? {
          ...a,
          approverId: userId,
          approverName,
          status: 'rejected' as const,
          respondedAt: new Date(),
          notes,
        }
      : a,
  );

  await updateDoc(poRef, {
    status: 'draft',
    approvals: updatedApprovals,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await emitBusinessEvent('purchase_order_rejected', po, userId);
}

/**
 * Mark PO as sent to supplier (Approved → Sent)
 */
export async function markAsSent(poId: string, userId: string): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (po.status !== 'approved') throw new Error('PO must be approved before sending');

  await updateDoc(poRef, {
    status: 'sent',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Mark linked procurement requirements as ordered
  try {
    await updateRequirementsByPOStatus(poId, 'ordered');
  } catch {
    console.warn('Failed to update procurement requirements for PO:', poId);
  }

  await emitBusinessEvent('purchase_order_sent', po, userId);
}

/**
 * Receive goods against a PO
 * Updates stock levels and inventory item costs with landed cost
 */
export async function receiveGoods(
  poId: string,
  receipt: Omit<GoodsReceipt, 'id'>,
  userId: string,
): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (!['sent', 'partially-received'].includes(po.status)) {
    throw new Error('PO must be sent or partially received to receive goods');
  }

  const receiptWithId: GoodsReceipt = {
    ...receipt,
    id: `GR-${Date.now()}`,
  };

  // Update line item received quantities
  const updatedLineItems = po.lineItems.map((li) => {
    const receiptLine = receipt.lines.find((rl) => rl.lineItemId === li.id);
    if (!receiptLine) return li;
    return {
      ...li,
      quantityReceived: li.quantityReceived + receiptLine.quantityReceived,
    };
  });

  // Determine if fully or partially received
  const allFullyReceived = updatedLineItems.every(
    (li) => li.quantityReceived >= li.quantity,
  );
  const newStatus: PurchaseOrderStatus = allFullyReceived
    ? 'received'
    : 'partially-received';

  // Update PO
  await updateDoc(poRef, {
    status: newStatus,
    lineItems: updatedLineItems,
    receivingHistory: [...po.receivingHistory, receiptWithId],
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Update stock levels and inventory costs for each received line
  for (const line of receipt.lines) {
    const poLineItem = updatedLineItems.find((li) => li.id === line.lineItemId);
    if (!poLineItem || !line.inventoryItemId) continue;

    // Receive stock at the specified warehouse
    await receiveStock(
      line.inventoryItemId,
      line.warehouseId,
      poLineItem.sku ?? '',
      poLineItem.description,
      line.quantityReceived,
      poId,
      userId,
      `From PO ${po.poNumber}`,
    );

    // Update inventory item cost with landed cost (weighted average)
    if (poLineItem.effectiveUnitCost) {
      await updateInventoryItemCostFromReceipt(
        line.inventoryItemId,
        line.quantityReceived,
        poLineItem.effectiveUnitCost,
        po.totals.currency,
        userId,
        poId,
        po.poNumber,
      );
    }
  }

  // Mark linked procurement requirements as received (if fully received)
  if (allFullyReceived) {
    try {
      await updateRequirementsByPOStatus(poId, 'received');
    } catch {
      console.warn('Failed to update procurement requirements for PO:', poId);
    }
  }

  await emitBusinessEvent('goods_received', po, userId, {
    receiptId: receiptWithId.id,
    linesReceived: receipt.lines.length,
    fullyReceived: allFullyReceived,
  });
}

/**
 * Close a purchase order (Received → Closed)
 */
export async function closePurchaseOrder(poId: string, userId: string): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (!['received', 'partially-received'].includes(po.status)) {
    throw new Error('PO must be received to close');
  }

  await updateDoc(poRef, {
    status: 'closed',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  await emitBusinessEvent('purchase_order_closed', po, userId);
}

/**
 * Cancel a purchase order
 */
export async function cancelPurchaseOrder(
  poId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const poRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  const poSnap = await getDoc(poRef);
  if (!poSnap.exists()) throw new Error('PO not found');

  const po = { id: poId, ...poSnap.data() } as PurchaseOrder;
  if (['closed', 'cancelled'].includes(po.status)) {
    throw new Error('Cannot cancel a closed or already cancelled PO');
  }

  await updateDoc(poRef, {
    status: 'cancelled',
    notes: `${po.notes ? po.notes + '\n' : ''}[CANCELLED] ${reason}`,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

// ============================================
// Queries & Subscriptions
// ============================================

/**
 * Subscribe to purchase orders with filters (real-time)
 */
export function subscribeToPurchaseOrders(
  filters: POFilters & { subsidiaryId: string },
  callback: (orders: PurchaseOrder[]) => void,
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

  const q = query(collection(db, PURCHASE_ORDERS_COLLECTION), ...constraints);

  return onSnapshot(q, (snapshot) => {
    let orders = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as PurchaseOrder),
    );

    // Client-side filtering for fields that can't be combined in Firestore queries
    if (filters.search) {
      const term = filters.search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(term) ||
          o.supplierName.toLowerCase().includes(term),
      );
    }

    callback(orders);
  });
}

/**
 * Subscribe to a single purchase order (real-time)
 */
export function subscribeToPurchaseOrder(
  poId: string,
  callback: (order: PurchaseOrder | null) => void,
): () => void {
  const docRef = doc(db, PURCHASE_ORDERS_COLLECTION, poId);
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as PurchaseOrder);
  });
}
