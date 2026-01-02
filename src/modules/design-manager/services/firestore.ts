/**
 * Design Manager Firestore Service
 * CRUD operations and real-time subscriptions for Design Manager entities
 */

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { 
  DesignProject, 
  DesignItem, 
  RAGValue,
  RAGStatusValue,
  DesignStage,
  StageTransition,
  DesignCategory,
  Approval,
  ApprovalType,
  ApprovalStatus,
  Deliverable,
  DeliverableType,
} from '../types';
import { 
  createInitialRAGStatus, 
  calculateOverallReadiness,
  updateRAGAspect as updateRAGAspectUtil,
} from '../utils/rag-calculations';
import { formatItemCode } from '../utils/formatting';

// Collection names
const PROJECTS_COLLECTION = 'designProjects';
const ITEMS_SUBCOLLECTION = 'designItems';
const APPROVALS_SUBCOLLECTION = 'approvals';
const DELIVERABLES_SUBCOLLECTION = 'deliverables';

// ============================================
// Project CRUD Operations
// ============================================

/**
 * Create a new design project
 */
export async function createProject(
  data: Omit<DesignProject, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
  userId: string
): Promise<string> {
  const projectData = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  };
  
  const docRef = await addDoc(collection(db, PROJECTS_COLLECTION), projectData);
  return docRef.id;
}

/**
 * Update an existing project
 */
export async function updateProject(
  projectId: string, 
  data: Partial<DesignProject>,
  userId: string
): Promise<void> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Get a project by ID
 */
export async function getProject(projectId: string): Promise<DesignProject | null> {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as DesignProject;
}

/**
 * Delete a project and all its design items
 */
export async function deleteProject(projectId: string): Promise<void> {
  const batch = writeBatch(db);
  
  // Delete all design items in the project
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  for (const itemDoc of itemsSnapshot.docs) {
    // Delete approvals subcollection
    const approvalsRef = collection(itemDoc.ref, APPROVALS_SUBCOLLECTION);
    const approvalsSnapshot = await getDocs(approvalsRef);
    approvalsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete deliverables subcollection
    const deliverablesRef = collection(itemDoc.ref, DELIVERABLES_SUBCOLLECTION);
    const deliverablesSnapshot = await getDocs(deliverablesRef);
    deliverablesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    
    // Delete the item itself
    batch.delete(itemDoc.ref);
  }
  
  // Delete the project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  batch.delete(projectRef);
  
  await batch.commit();
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<DesignProject[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignProject));
}

/**
 * Subscribe to project changes
 */
export function subscribeToProject(
  projectId: string, 
  callback: (project: DesignProject | null) => void
): () => void {
  const docRef = doc(db, PROJECTS_COLLECTION, projectId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as DesignProject);
    } else {
      callback(null);
    }
  });
}

/**
 * Subscribe to all projects
 */
export function subscribeToProjects(
  callback: (projects: DesignProject[]) => void
): () => void {
  const q = query(
    collection(db, PROJECTS_COLLECTION),
    orderBy('updatedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as DesignProject));
    callback(projects);
  });
}

// ============================================
// Design Item CRUD Operations
// ============================================

/**
 * Get the items collection reference for a project
 */
function getItemsCollection(projectId: string) {
  return collection(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION);
}

/**
 * Get item document reference
 */
function getItemDoc(projectId: string, itemId: string) {
  return doc(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId);
}

/**
 * Create a new design item
 */
export async function createDesignItem(
  projectId: string, 
  data: Partial<DesignItem>, 
  userId: string
): Promise<string> {
  // Get existing items count for code generation
  const existingItems = await getDocs(getItemsCollection(projectId));
  const sequence = existingItems.size + 1;
  
  // Get project for code prefix
  const project = await getProject(projectId);
  const projectCode = project?.code || 'DF-000';
  
  const itemData: Omit<DesignItem, 'id'> = {
    itemCode: data.itemCode || formatItemCode(projectCode, sequence),
    name: data.name || 'Untitled Item',
    description: data.description || '',
    category: data.category || 'casework',
    projectId,
    projectCode,
    currentStage: data.currentStage || 'concept',
    ragStatus: data.ragStatus || createInitialRAGStatus(userId),
    overallReadiness: 0,
    stageHistory: [],
    approvals: [],
    files: [],
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    createdBy: userId,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    updatedBy: userId,
    ...data,
  };
  
  // Calculate initial readiness
  itemData.overallReadiness = calculateOverallReadiness(itemData.ragStatus);
  
  const docRef = await addDoc(getItemsCollection(projectId), {
    ...itemData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    stageEnteredAt: serverTimestamp(), // Track when item entered initial stage
  });
  
  return docRef.id;
}

/**
 * Update a design item
 */
export async function updateDesignItem(
  projectId: string, 
  itemId: string, 
  data: Partial<DesignItem>,
  userId: string
): Promise<void> {
  const docRef = getItemDoc(projectId, itemId);
  
  // If RAG status is being updated, recalculate readiness
  let updateData: Record<string, unknown> = { ...data };
  if (data.ragStatus) {
    updateData.overallReadiness = calculateOverallReadiness(data.ragStatus);
  }
  
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Delete a design item
 */
export async function deleteDesignItem(
  projectId: string, 
  itemId: string
): Promise<void> {
  const docRef = getItemDoc(projectId, itemId);
  await deleteDoc(docRef);
}

/**
 * Get a single design item
 */
export async function getDesignItem(
  projectId: string, 
  itemId: string
): Promise<DesignItem | null> {
  const docRef = getItemDoc(projectId, itemId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as DesignItem;
}

/**
 * Get all design items for a project
 */
export async function getDesignItems(
  projectId: string,
  filters?: {
    stage?: DesignStage;
    category?: DesignCategory;
  }
): Promise<DesignItem[]> {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];
  
  if (filters?.stage) {
    constraints.unshift(where('currentStage', '==', filters.stage));
  }
  if (filters?.category) {
    constraints.unshift(where('category', '==', filters.category));
  }
  
  const q = query(getItemsCollection(projectId), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignItem));
}

/**
 * Subscribe to design items changes
 */
export function subscribeToDesignItems(
  projectId: string, 
  callback: (items: DesignItem[]) => void,
  filters?: {
    stage?: DesignStage;
    category?: DesignCategory;
  }
): () => void {
  const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];
  
  if (filters?.stage) {
    constraints.unshift(where('currentStage', '==', filters.stage));
  }
  if (filters?.category) {
    constraints.unshift(where('category', '==', filters.category));
  }
  
  const q = query(getItemsCollection(projectId), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as DesignItem));
    callback(items);
  });
}

/**
 * Subscribe to a single design item
 */
export function subscribeToDesignItem(
  projectId: string,
  itemId: string,
  callback: (item: DesignItem | null) => void
): () => void {
  const docRef = getItemDoc(projectId, itemId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as DesignItem);
    } else {
      callback(null);
    }
  });
}

// ============================================
// RAG Status Updates
// ============================================

/**
 * Update a single RAG aspect
 */
export async function updateRAGAspect(
  projectId: string, 
  itemId: string, 
  aspectPath: string, 
  value: { status: RAGStatusValue; notes: string },
  userId: string
): Promise<void> {
  const item = await getDesignItem(projectId, itemId);
  if (!item) throw new Error('Design item not found');
  
  const newRagValue: RAGValue = {
    status: value.status,
    notes: value.notes,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    updatedBy: userId,
  };
  
  const updatedRagStatus = updateRAGAspectUtil(item.ragStatus, aspectPath, newRagValue);
  const newReadiness = calculateOverallReadiness(updatedRagStatus);
  
  await updateDesignItem(projectId, itemId, {
    ragStatus: updatedRagStatus,
    overallReadiness: newReadiness,
  }, userId);
}

// ============================================
// Stage Transitions
// ============================================

/**
 * Transition a design item to a new stage
 */
export async function transitionStage(
  projectId: string,
  itemId: string,
  targetStage: DesignStage,
  userId: string,
  notes: string = '',
  overrideGate: boolean = false
): Promise<void> {
  const item = await getDesignItem(projectId, itemId);
  if (!item) throw new Error('Design item not found');
  
  const transition: StageTransition = {
    fromStage: item.currentStage,
    toStage: targetStage,
    transitionedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    transitionedBy: userId,
    notes: overrideGate ? `[OVERRIDE] ${notes}` : notes,
  };
  
  await updateDesignItem(projectId, itemId, {
    currentStage: targetStage,
    stageEnteredAt: serverTimestamp() as any, // FieldValue converted to Timestamp by Firestore
    stageHistory: [...item.stageHistory, transition],
  }, userId);
}

// ============================================
// Batch Operations
// ============================================

/**
 * Update multiple items' RAG aspects at once
 */
export async function batchUpdateRAGAspects(
  projectId: string,
  updates: Array<{
    itemId: string;
    aspectPath: string;
    value: { status: RAGStatusValue; notes: string };
  }>,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);
  
  for (const update of updates) {
    const item = await getDesignItem(projectId, update.itemId);
    if (!item) continue;
    
    const newRagValue: RAGValue = {
      status: update.value.status,
      notes: update.value.notes,
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      updatedBy: userId,
    };
    
    const updatedRagStatus = updateRAGAspectUtil(item.ragStatus, update.aspectPath, newRagValue);
    const newReadiness = calculateOverallReadiness(updatedRagStatus);
    
    const docRef = getItemDoc(projectId, update.itemId);
    batch.update(docRef, {
      ragStatus: updatedRagStatus,
      overallReadiness: newReadiness,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
  
  await batch.commit();
}

// ============================================
// Approvals CRUD Operations
// ============================================

/**
 * Get approvals subcollection reference
 */
function getApprovalsCollection(projectId: string, itemId: string) {
  return collection(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId, APPROVALS_SUBCOLLECTION);
}

/**
 * Create a new approval request
 */
export async function createApproval(
  projectId: string,
  itemId: string,
  data: {
    type: ApprovalType;
    assignedTo: string;
    notes?: string;
  },
  userId: string
): Promise<string> {
  const approvalsRef = getApprovalsCollection(projectId, itemId);
  
  const approval = {
    type: data.type,
    status: 'pending' as ApprovalStatus,
    assignedTo: data.assignedTo,
    requestedBy: userId,
    requestedAt: serverTimestamp(),
    notes: data.notes || null,
    decision: null,
    decidedAt: null,
    attachments: [],
  };
  
  const docRef = await addDoc(approvalsRef, approval);
  
  // Also update the design item's approvals array for quick access
  const itemRef = getItemDoc(projectId, itemId);
  const itemSnap = await getDoc(itemRef);
  if (itemSnap.exists()) {
    const currentApprovals = itemSnap.data().approvals || [];
    await updateDoc(itemRef, {
      approvals: [...currentApprovals, { id: docRef.id, ...approval }],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
  
  return docRef.id;
}

/**
 * Respond to an approval request
 */
export async function respondToApproval(
  projectId: string,
  itemId: string,
  approvalId: string,
  status: 'approved' | 'rejected' | 'revision-requested',
  decision: string,
  userId: string
): Promise<void> {
  const approvalRef = doc(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId, APPROVALS_SUBCOLLECTION, approvalId);
  
  await updateDoc(approvalRef, {
    status,
    decision,
    decidedAt: serverTimestamp(),
    respondedBy: userId,
  });
  
  // Update the item's approvals array
  const itemRef = getItemDoc(projectId, itemId);
  const itemSnap = await getDoc(itemRef);
  if (itemSnap.exists()) {
    const currentApprovals = itemSnap.data().approvals || [];
    const updatedApprovals = currentApprovals.map((a: Approval) => 
      a.id === approvalId 
        ? { ...a, status, decision, decidedAt: new Date(), respondedBy: userId }
        : a
    );
    await updateDoc(itemRef, {
      approvals: updatedApprovals,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Subscribe to approvals for a design item
 */
export function subscribeToApprovals(
  projectId: string,
  itemId: string,
  callback: (approvals: Approval[]) => void
): () => void {
  const approvalsRef = getApprovalsCollection(projectId, itemId);
  const q = query(approvalsRef, orderBy('requestedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const approvals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Approval[];
    callback(approvals);
  });
}

// ============================================
// Deliverables CRUD Operations
// ============================================

/**
 * Get deliverables subcollection reference
 */
function getDeliverablesCollection(projectId: string, itemId: string) {
  return collection(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId, DELIVERABLES_SUBCOLLECTION);
}

/**
 * Create a new deliverable
 */
export async function createDeliverable(
  projectId: string,
  itemId: string,
  data: {
    name: string;
    type: DeliverableType;
    description?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    storageUrl: string;
    storagePath: string;
  },
  userId: string,
  currentStage: DesignStage
): Promise<string> {
  const deliverablesRef = getDeliverablesCollection(projectId, itemId);
  
  // Get the next version number for this type
  const existingQuery = query(deliverablesRef, where('type', '==', data.type));
  const existingSnap = await getDocs(existingQuery);
  const version = existingSnap.size + 1;
  
  const deliverable = {
    name: data.name,
    type: data.type,
    description: data.description || null,
    stage: currentStage,
    version,
    status: 'draft' as const,
    fileName: data.fileName,
    fileType: data.fileType,
    fileSize: data.fileSize,
    storageUrl: data.storageUrl,
    storagePath: data.storagePath,
    uploadedBy: userId,
    uploadedAt: serverTimestamp(),
    approvedBy: null,
    approvedAt: null,
  };
  
  const docRef = await addDoc(deliverablesRef, deliverable);
  return docRef.id;
}

/**
 * Update deliverable status
 */
export async function updateDeliverableStatus(
  projectId: string,
  itemId: string,
  deliverableId: string,
  status: 'draft' | 'review' | 'approved' | 'superseded',
  userId: string
): Promise<void> {
  const deliverableRef = doc(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId, DELIVERABLES_SUBCOLLECTION, deliverableId);
  
  const updateData: Record<string, unknown> = { status };
  
  if (status === 'approved') {
    updateData.approvedBy = userId;
    updateData.approvedAt = serverTimestamp();
  }
  
  await updateDoc(deliverableRef, updateData);
}

/**
 * Delete a deliverable
 */
export async function deleteDeliverable(
  projectId: string,
  itemId: string,
  deliverableId: string
): Promise<void> {
  const deliverableRef = doc(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, itemId, DELIVERABLES_SUBCOLLECTION, deliverableId);
  await deleteDoc(deliverableRef);
}

/**
 * Subscribe to deliverables for a design item
 */
export function subscribeToDeliverables(
  projectId: string,
  itemId: string,
  callback: (deliverables: Deliverable[]) => void
): () => void {
  const deliverablesRef = getDeliverablesCollection(projectId, itemId);
  const q = query(deliverablesRef, orderBy('uploadedAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const deliverables = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Deliverable[];
    callback(deliverables);
  });
}
