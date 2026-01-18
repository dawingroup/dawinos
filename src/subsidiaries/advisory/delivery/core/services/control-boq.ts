/**
 * Control BOQ Service
 * 
 * Service for managing Control BOQ items within projects.
 * Collection path: projects/{projectId}/boq_items
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  Firestore,
  Timestamp,
} from 'firebase/firestore';
import type { ControlBOQItem, ControlBOQ, BOQCategory } from '../types/boq';
import type { CleanedBOQItem } from '../types/parsing';

// ─────────────────────────────────────────────────────────────────
// COLLECTION PATHS
// ─────────────────────────────────────────────────────────────────

const PROJECTS_PATH = 'projects';
const BOQ_ITEMS_SUBCOLLECTION = 'boq_items';
const CONTROL_BOQ_SUBCOLLECTION = 'control_boq';

function getBoqItemsPath(projectId: string): string {
  return `${PROJECTS_PATH}/${projectId}/${BOQ_ITEMS_SUBCOLLECTION}`;
}

function getControlBoqPath(projectId: string): string {
  return `${PROJECTS_PATH}/${projectId}/${CONTROL_BOQ_SUBCOLLECTION}`;
}

// ─────────────────────────────────────────────────────────────────
// CREATE / IMPORT BOQ ITEMS
// ─────────────────────────────────────────────────────────────────

export interface ImportBOQItemsInput {
  projectId: string;
  items: CleanedBOQItem[];
  userId: string;
  sourceFileName?: string;
  parsingJobId?: string;
}

export async function importBOQItems(
  db: Firestore,
  input: ImportBOQItemsInput
): Promise<string[]> {
  const { projectId, items, userId, sourceFileName, parsingJobId } = input;
  
  if (!items || items.length === 0) {
    return [];
  }
  
  const batch = writeBatch(db);
  const importedIds: string[] = [];
  const collectionRef = collection(db, getBoqItemsPath(projectId));
  
  for (const item of items) {
    if (item.isSummaryRow) continue; // Skip summary rows
    
    const docRef = doc(collectionRef);
    const boqItem: Omit<ControlBOQItem, 'id'> = {
      projectId,
      itemCode: item.itemCode,
      itemNumber: item.itemCode,
      description: item.description,
      specification: item.specifications || undefined,
      
      // Hierarchy
      billNumber: item.billNumber,
      billName: item.billName,
      elementCode: item.elementCode,
      elementName: item.elementName,
      sectionCode: item.sectionCode,
      sectionName: item.sectionName,
      hierarchyPath: item.hierarchyPath,
      hierarchyLevel: item.hierarchyLevel,
      
      // Quantities
      unit: item.unit,
      quantityContract: item.quantity,
      quantityRequisitioned: 0,
      quantityCertified: 0,
      quantityExecuted: 0,
      quantityRemaining: item.quantity,
      
      // Rates
      rate: item.rate || 0,
      amount: item.amount || (item.quantity * (item.rate || 0)),
      currency: 'UGX',
      
      // Category
      category: (item.category as BOQCategory) || 'other',
      stage: item.stage,
      
      // Status
      status: 'pending',
      
      // Tracking
      linkedPaymentIds: [],
      
      // AI metadata
      aiConfidence: item.confidence,
      suggestedFormulaCode: item.suggestedFormulaCode,
      governingSpecs: item.governingSpecs,
      
      // Source
      source: 'ai_parsed',
      importedAt: Timestamp.now(),
      importedBy: userId,
      
      // Audit
      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
    };
    
    batch.set(docRef, boqItem);
    importedIds.push(docRef.id);
  }
  
  // Create or update Control BOQ document
  const controlBoqRef = doc(db, getControlBoqPath(projectId), 'main');
  const controlBoqData: Partial<ControlBOQ> = {
    projectId,
    name: sourceFileName || 'Control BOQ',
    version: 1,
    status: 'draft',
    sourceFileName,
    parsingJobId,
    totalItems: importedIds.length,
    totalContractValue: items.reduce((sum, i) => sum + (i.amount || 0), 0),
    currency: 'UGX',
    updatedAt: Timestamp.now(),
  };
  
  batch.set(controlBoqRef, controlBoqData, { merge: true });
  
  await batch.commit();
  
  return importedIds;
}

// ─────────────────────────────────────────────────────────────────
// GET BOQ ITEMS
// ─────────────────────────────────────────────────────────────────

export async function getProjectBOQItems(
  db: Firestore,
  projectId: string
): Promise<ControlBOQItem[]> {
  try {
    // Try with ordering first
    const q = query(
      collection(db, getBoqItemsPath(projectId)),
      orderBy('hierarchyPath', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ControlBOQItem[];
  } catch (err) {
    // Fallback: query without ordering if index doesn't exist
    console.warn('BOQ query with ordering failed, falling back to unordered:', err);
    const collRef = collection(db, getBoqItemsPath(projectId));
    const snapshot = await getDocs(collRef);
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ControlBOQItem[];
    
    // Sort in memory
    return items.sort((a, b) => (a.hierarchyPath || '').localeCompare(b.hierarchyPath || ''));
  }
}

export async function getBOQItem(
  db: Firestore,
  projectId: string,
  itemId: string
): Promise<ControlBOQItem | null> {
  const docRef = doc(db, getBoqItemsPath(projectId), itemId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as ControlBOQItem;
}

export async function getAvailableBOQItems(
  db: Firestore,
  projectId: string
): Promise<ControlBOQItem[]> {
  const items = await getProjectBOQItems(db, projectId);
  return items.filter(item => {
    const processed = Math.max(item.quantityRequisitioned, item.quantityCertified);
    return item.quantityContract > processed;
  });
}

// ─────────────────────────────────────────────────────────────────
// UPDATE BOQ ITEMS
// ─────────────────────────────────────────────────────────────────

export async function updateBOQItemQuantities(
  db: Firestore,
  projectId: string,
  itemId: string,
  updates: {
    quantityRequisitioned?: number;
    quantityCertified?: number;
    quantityExecuted?: number;
    linkedPaymentId?: string;
  }
): Promise<void> {
  const docRef = doc(db, getBoqItemsPath(projectId), itemId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('BOQ item not found');
  }
  
  const current = docSnap.data() as ControlBOQItem;
  const updateData: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };
  
  if (updates.quantityRequisitioned !== undefined) {
    updateData.quantityRequisitioned = updates.quantityRequisitioned;
  }
  if (updates.quantityCertified !== undefined) {
    updateData.quantityCertified = updates.quantityCertified;
  }
  if (updates.quantityExecuted !== undefined) {
    updateData.quantityExecuted = updates.quantityExecuted;
    updateData.quantityRemaining = current.quantityContract - updates.quantityExecuted;
  }
  if (updates.linkedPaymentId) {
    const linkedIds = current.linkedPaymentIds || [];
    if (!linkedIds.includes(updates.linkedPaymentId)) {
      updateData.linkedPaymentIds = [...linkedIds, updates.linkedPaymentId];
      updateData.lastPaymentDate = serverTimestamp();
    }
  }
  
  // Update status based on quantities
  const qtyReq = updates.quantityRequisitioned ?? current.quantityRequisitioned;
  const qtyCert = updates.quantityCertified ?? current.quantityCertified;
  const qtyExec = updates.quantityExecuted ?? current.quantityExecuted;
  
  if (qtyExec >= current.quantityContract) {
    updateData.status = 'completed';
  } else if (qtyExec > 0) {
    updateData.status = 'in_progress';
  } else if (qtyReq > 0 || qtyCert > 0) {
    updateData.status = 'partial';
  }
  
  await updateDoc(docRef, updateData);
}

// ─────────────────────────────────────────────────────────────────
// CONTROL BOQ DOCUMENT
// ─────────────────────────────────────────────────────────────────

export async function getControlBOQ(
  db: Firestore,
  projectId: string
): Promise<ControlBOQ | null> {
  const docRef = doc(db, getControlBoqPath(projectId), 'main');
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return { id: docSnap.id, ...docSnap.data() } as ControlBOQ;
}

export async function approveControlBOQ(
  db: Firestore,
  projectId: string,
  userId: string
): Promise<void> {
  const docRef = doc(db, getControlBoqPath(projectId), 'main');
  
  await updateDoc(docRef, {
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy: userId,
    approvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ─────────────────────────────────────────────────────────────────
// DELETE BOQ ITEMS
// ─────────────────────────────────────────────────────────────────

export async function deleteBOQItem(
  db: Firestore,
  projectId: string,
  itemId: string
): Promise<void> {
  const docRef = doc(db, getBoqItemsPath(projectId), itemId);
  await deleteDoc(docRef);
}

export async function clearProjectBOQ(
  db: Firestore,
  projectId: string
): Promise<void> {
  const items = await getProjectBOQItems(db, projectId);
  const batch = writeBatch(db);
  
  for (const item of items) {
    const docRef = doc(db, getBoqItemsPath(projectId), item.id);
    batch.delete(docRef);
  }
  
  // Also delete the control BOQ document
  const controlBoqRef = doc(db, getControlBoqPath(projectId), 'main');
  batch.delete(controlBoqRef);
  
  await batch.commit();
}
