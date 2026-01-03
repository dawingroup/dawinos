/**
 * BOQ Service - CRUD operations for BOQ items
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import type { BOQItem } from '../types';
import { ConstructionStage, MeasurementUnit } from '../types';

const boqCollection = (orgId: string, projectId: string) =>
  collection(db, 'organizations', orgId, 'matflow_projects', projectId, 'boq_items');

// CREATE
export interface CreateBOQItemInput {
  itemCode: string;
  description: string;
  unit: MeasurementUnit;
  quantityContract: number;
  rate?: number;
  stage: ConstructionStage;
  formulaId?: string;
  formulaCode?: string;
}

export async function createBOQItem(
  orgId: string,
  projectId: string,
  userId: string,
  input: CreateBOQItemInput
): Promise<string> {
  const amount = input.rate ? input.quantityContract * input.rate : 0;
  
  const docRef = await addDoc(boqCollection(orgId, projectId), {
    projectId,
    ...input,
    amount,
    quantityExecuted: 0,
    quantityRemaining: input.quantityContract,
    materialRequirements: [],
    isVerified: false,
    source: { type: 'manual' },
    version: 1,
    lastModifiedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  return docRef.id;
}

// READ
export async function getBOQItems(
  orgId: string,
  projectId: string,
  filters?: { stage?: ConstructionStage }
): Promise<BOQItem[]> {
  let q = query(
    boqCollection(orgId, projectId),
    orderBy('stage'),
    orderBy('itemCode')
  );
  
  if (filters?.stage) {
    q = query(q, where('stage', '==', filters.stage));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as BOQItem[];
}

export function subscribeToBOQItems(
  orgId: string,
  projectId: string,
  callback: (items: BOQItem[]) => void
): () => void {
  const q = query(
    boqCollection(orgId, projectId),
    orderBy('stage'),
    orderBy('itemCode')
  );
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as BOQItem[];
    callback(items);
  });
}

// UPDATE
export async function updateBOQItem(
  orgId: string,
  projectId: string,
  itemId: string,
  userId: string,
  updates: Partial<BOQItem>
): Promise<void> {
  const docRef = doc(boqCollection(orgId, projectId), itemId);
  await updateDoc(docRef, {
    ...updates,
    version: increment(1),
    lastModifiedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

// DELETE
export async function deleteBOQItem(
  orgId: string,
  projectId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(doc(boqCollection(orgId, projectId), itemId));
}

// BULK OPERATIONS
export async function bulkUpdateStage(
  orgId: string,
  projectId: string,
  itemIds: string[],
  stage: ConstructionStage,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const itemId of itemIds) {
    batch.update(doc(boqCollection(orgId, projectId), itemId), {
      stage,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
  
  await batch.commit();
}
