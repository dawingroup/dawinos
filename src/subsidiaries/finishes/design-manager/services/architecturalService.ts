/**
 * Architectural Drawings Service
 * CRUD operations and real-time subscriptions for Architectural Drawing entities
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
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/shared/services/firebase';
import type {
  ArchitecturalDrawing,
  ArchitecturalDrawingFile,
  ArchitecturalStage,
  ArchitecturalDrawingType,
  ArchitecturalApprovalRecord,
  ArchitecturalStageTransition,
  ArchitecturalDrawingFilters,
  ArchitecturalDashboardStats,
  DrawingSet,
  PortalArchitecturalDrawing,
} from '../types/architectural';
import {
  ARCHITECTURAL_STAGE_ORDER,
  ARCHITECTURAL_GATE_CRITERIA,
  DRAWING_NUMBER_PREFIXES,
} from '../types/architectural';

// Collection names
const PROJECTS_COLLECTION = 'designProjects';
const DRAWINGS_SUBCOLLECTION = 'architecturalDrawings';
const APPROVALS_SUBCOLLECTION = 'approvals';
const STAGE_HISTORY_SUBCOLLECTION = 'stageHistory';
const DRAWING_SETS_SUBCOLLECTION = 'drawingSets';

// ============================================
// Helper Functions
// ============================================

/**
 * Get the drawings collection reference for a project
 */
function getDrawingsCollection(projectId: string) {
  return collection(db, PROJECTS_COLLECTION, projectId, DRAWINGS_SUBCOLLECTION);
}

/**
 * Get drawing document reference
 */
function getDrawingDoc(projectId: string, drawingId: string) {
  return doc(db, PROJECTS_COLLECTION, projectId, DRAWINGS_SUBCOLLECTION, drawingId);
}

/**
 * Generate a drawing number based on type and existing drawings
 */
async function generateDrawingNumber(
  projectId: string,
  projectCode: string,
  drawingType: ArchitecturalDrawingType
): Promise<string> {
  const prefix = DRAWING_NUMBER_PREFIXES[drawingType];

  // Get existing drawings of this type to determine the next number
  const q = query(
    getDrawingsCollection(projectId),
    where('drawingType', '==', drawingType),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;
  const paddedCount = count.toString().padStart(2, '0');

  return `${prefix}-${paddedCount}`;
}

// ============================================
// Drawing CRUD Operations
// ============================================

/**
 * Create a new architectural drawing
 */
export async function createArchitecturalDrawing(
  projectId: string,
  data: {
    name: string;
    drawingType: ArchitecturalDrawingType;
    description?: string;
    scale?: string;
    sheetSize?: ArchitecturalDrawing['sheetSize'];
    dueDate?: Timestamp;
    priority?: ArchitecturalDrawing['priority'];
    tags?: string[];
    notes?: string;
  },
  projectCode: string,
  userId: string
): Promise<string> {
  const drawingNumber = await generateDrawingNumber(projectId, projectCode, data.drawingType);

  const drawingData: Omit<ArchitecturalDrawing, 'id'> = {
    drawingNumber,
    name: data.name,
    description: data.description,
    drawingType: data.drawingType,
    projectId,
    projectCode,
    currentStage: 'arch-concept',
    version: 1,
    files: [],
    scale: data.scale,
    sheetSize: data.sheetSize,
    approvals: [],
    stageHistory: [],
    sharedToPortal: false,
    createdAt: serverTimestamp() as Timestamp,
    createdBy: userId,
    updatedAt: serverTimestamp() as Timestamp,
    updatedBy: userId,
    dueDate: data.dueDate,
    priority: data.priority,
    tags: data.tags,
    notes: data.notes,
  };

  const docRef = await addDoc(getDrawingsCollection(projectId), drawingData);

  // Add initial stage history entry
  await addDoc(
    collection(docRef, STAGE_HISTORY_SUBCOLLECTION),
    {
      fromStage: null,
      toStage: 'arch-concept',
      transitionedAt: serverTimestamp(),
      transitionedBy: userId,
      notes: 'Drawing created',
    }
  );

  return docRef.id;
}

/**
 * Get a drawing by ID
 */
export async function getArchitecturalDrawing(
  projectId: string,
  drawingId: string
): Promise<ArchitecturalDrawing | null> {
  const docRef = getDrawingDoc(projectId, drawingId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as ArchitecturalDrawing;
}

/**
 * Update an architectural drawing
 */
export async function updateArchitecturalDrawing(
  projectId: string,
  drawingId: string,
  data: Partial<ArchitecturalDrawing>,
  userId: string
): Promise<void> {
  const docRef = getDrawingDoc(projectId, drawingId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Delete an architectural drawing
 */
export async function deleteArchitecturalDrawing(
  projectId: string,
  drawingId: string
): Promise<void> {
  const batch = writeBatch(db);
  const drawingRef = getDrawingDoc(projectId, drawingId);

  // Delete approvals subcollection
  const approvalsSnapshot = await getDocs(collection(drawingRef, APPROVALS_SUBCOLLECTION));
  approvalsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete stage history subcollection
  const historySnapshot = await getDocs(collection(drawingRef, STAGE_HISTORY_SUBCOLLECTION));
  historySnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete the drawing document
  batch.delete(drawingRef);

  await batch.commit();

  // Note: Files in storage should be deleted separately if needed
}

/**
 * Get all drawings for a project with optional filters
 */
export async function getArchitecturalDrawings(
  projectId: string,
  filters?: ArchitecturalDrawingFilters
): Promise<ArchitecturalDrawing[]> {
  const constraints: QueryConstraint[] = [];

  if (filters?.stage) {
    if (Array.isArray(filters.stage)) {
      constraints.push(where('currentStage', 'in', filters.stage));
    } else {
      constraints.push(where('currentStage', '==', filters.stage));
    }
  }

  if (filters?.drawingType) {
    if (Array.isArray(filters.drawingType)) {
      constraints.push(where('drawingType', 'in', filters.drawingType));
    } else {
      constraints.push(where('drawingType', '==', filters.drawingType));
    }
  }

  if (filters?.sharedToPortal !== undefined) {
    constraints.push(where('sharedToPortal', '==', filters.sharedToPortal));
  }

  // Default sort
  const sortField = filters?.sortBy || 'updatedAt';
  const sortDir = filters?.sortOrder || 'desc';
  constraints.push(orderBy(sortField, sortDir));

  const q = query(getDrawingsCollection(projectId), ...constraints);
  const snapshot = await getDocs(q);

  let drawings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as ArchitecturalDrawing));

  // Client-side filtering for search (Firestore doesn't support full-text search)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    drawings = drawings.filter(d =>
      d.name.toLowerCase().includes(searchLower) ||
      d.drawingNumber.toLowerCase().includes(searchLower) ||
      d.description?.toLowerCase().includes(searchLower)
    );
  }

  return drawings;
}

/**
 * Subscribe to drawings for a project
 */
export function subscribeToArchitecturalDrawings(
  projectId: string,
  callback: (drawings: ArchitecturalDrawing[]) => void,
  filters?: ArchitecturalDrawingFilters
): () => void {
  const constraints: QueryConstraint[] = [];

  if (filters?.stage) {
    if (Array.isArray(filters.stage)) {
      constraints.push(where('currentStage', 'in', filters.stage));
    } else {
      constraints.push(where('currentStage', '==', filters.stage));
    }
  }

  if (filters?.drawingType) {
    if (Array.isArray(filters.drawingType)) {
      constraints.push(where('drawingType', 'in', filters.drawingType));
    } else {
      constraints.push(where('drawingType', '==', filters.drawingType));
    }
  }

  constraints.push(orderBy('updatedAt', 'desc'));

  const q = query(getDrawingsCollection(projectId), ...constraints);

  return onSnapshot(q, (snapshot) => {
    const drawings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ArchitecturalDrawing));
    callback(drawings);
  });
}

/**
 * Subscribe to a single drawing
 */
export function subscribeToArchitecturalDrawing(
  projectId: string,
  drawingId: string,
  callback: (drawing: ArchitecturalDrawing | null) => void
): () => void {
  const docRef = getDrawingDoc(projectId, drawingId);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as ArchitecturalDrawing);
    } else {
      callback(null);
    }
  });
}

// ============================================
// Stage Transition Operations
// ============================================

/**
 * Check if a drawing can transition to the target stage
 */
export function canTransitionToStage(
  drawing: ArchitecturalDrawing,
  targetStage: ArchitecturalStage
): { canTransition: boolean; blockers: string[] } {
  const blockers: string[] = [];
  const criteria = ARCHITECTURAL_GATE_CRITERIA[targetStage];

  for (const criterion of criteria.mustMeet) {
    switch (criterion.aspect) {
      case 'hasDrawingFile':
        if (drawing.files.length === 0) {
          blockers.push('At least one drawing file must be uploaded');
        }
        break;
      case 'hasScaleSet':
        if (!drawing.scale) {
          blockers.push('Drawing scale must be set');
        }
        break;
      case 'hasDrawingNumber':
        if (!drawing.drawingNumber) {
          blockers.push('Drawing number must be assigned');
        }
        break;
      case 'internalReviewApproved':
        const internalApproval = drawing.approvals.find(a => a.type === 'internal' && a.status === 'approved');
        if (!internalApproval) {
          blockers.push('Internal review must be approved');
        }
        break;
      case 'clientApproved':
        const clientApproval = drawing.approvals.find(a => a.type === 'client' && a.status === 'approved');
        if (!clientApproval) {
          blockers.push('Client approval is required');
        }
        break;
    }
  }

  return {
    canTransition: blockers.length === 0,
    blockers,
  };
}

/**
 * Transition a drawing to a new stage
 */
export async function transitionArchitecturalStage(
  projectId: string,
  drawingId: string,
  targetStage: ArchitecturalStage,
  userId: string,
  notes?: string
): Promise<void> {
  const drawing = await getArchitecturalDrawing(projectId, drawingId);
  if (!drawing) throw new Error('Drawing not found');

  const { canTransition, blockers } = canTransitionToStage(drawing, targetStage);
  if (!canTransition) {
    throw new Error(`Cannot transition to ${targetStage}: ${blockers.join(', ')}`);
  }

  const batch = writeBatch(db);
  const drawingRef = getDrawingDoc(projectId, drawingId);

  // Update drawing stage
  batch.update(drawingRef, {
    currentStage: targetStage,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Add stage history entry
  const historyRef = doc(collection(drawingRef, STAGE_HISTORY_SUBCOLLECTION));
  batch.set(historyRef, {
    fromStage: drawing.currentStage,
    toStage: targetStage,
    transitionedAt: serverTimestamp(),
    transitionedBy: userId,
    notes,
  });

  await batch.commit();
}

// ============================================
// Approval Operations
// ============================================

/**
 * Request an approval for a drawing
 */
export async function requestArchitecturalApproval(
  projectId: string,
  drawingId: string,
  type: 'internal' | 'client',
  userId: string
): Promise<string> {
  const drawingRef = getDrawingDoc(projectId, drawingId);
  const drawing = await getArchitecturalDrawing(projectId, drawingId);

  if (!drawing) throw new Error('Drawing not found');

  const approval: Omit<ArchitecturalApprovalRecord, 'id'> = {
    type,
    status: 'pending',
    requestedAt: serverTimestamp() as Timestamp,
    requestedBy: userId,
  };

  const approvalRef = await addDoc(
    collection(drawingRef, APPROVALS_SUBCOLLECTION),
    approval
  );

  // Also add to the drawing's approvals array for quick access
  const updatedApprovals = [
    ...drawing.approvals,
    { id: approvalRef.id, ...approval },
  ];

  await updateDoc(drawingRef, {
    approvals: updatedApprovals,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return approvalRef.id;
}

/**
 * Respond to an approval request
 */
export async function respondToArchitecturalApproval(
  projectId: string,
  drawingId: string,
  approvalId: string,
  status: 'approved' | 'rejected' | 'revision-requested',
  notes: string | undefined,
  userId: string,
  signature?: string
): Promise<void> {
  const drawingRef = getDrawingDoc(projectId, drawingId);
  const approvalRef = doc(drawingRef, APPROVALS_SUBCOLLECTION, approvalId);

  // Update approval document
  await updateDoc(approvalRef, {
    status,
    respondedAt: serverTimestamp(),
    respondedBy: userId,
    notes,
    signature,
  });

  // Update the approvals array in the drawing document
  const drawing = await getArchitecturalDrawing(projectId, drawingId);
  if (drawing) {
    const updatedApprovals = drawing.approvals.map(a =>
      a.id === approvalId
        ? { ...a, status, respondedAt: serverTimestamp() as Timestamp, respondedBy: userId, notes, signature }
        : a
    );

    await updateDoc(drawingRef, {
      approvals: updatedApprovals,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

// ============================================
// Client Portal Operations
// ============================================

/**
 * Share a drawing to the client portal
 */
export async function shareDrawingToPortal(
  projectId: string,
  drawingId: string,
  userId: string
): Promise<void> {
  const drawingRef = getDrawingDoc(projectId, drawingId);

  await updateDoc(drawingRef, {
    sharedToPortal: true,
    portalShareDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Remove a drawing from the client portal
 */
export async function unshareDrawingFromPortal(
  projectId: string,
  drawingId: string,
  userId: string
): Promise<void> {
  const drawingRef = getDrawingDoc(projectId, drawingId);

  await updateDoc(drawingRef, {
    sharedToPortal: false,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Get drawings shared to the client portal
 */
export async function getPortalSharedDrawings(
  projectId: string
): Promise<PortalArchitecturalDrawing[]> {
  const q = query(
    getDrawingsCollection(projectId),
    where('sharedToPortal', '==', true),
    orderBy('portalShareDate', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data() as ArchitecturalDrawing;
    const currentFile = data.files.find(f => f.isCurrentVersion) || data.files[0];
    const pendingApproval = data.approvals.find(a => a.type === 'client' && a.status === 'pending');
    const approvedApproval = data.approvals.find(a => a.type === 'client' && a.status === 'approved');

    return {
      id: doc.id,
      projectId: data.projectId,
      drawingNumber: data.drawingNumber,
      name: data.name,
      drawingType: data.drawingType,
      description: data.description,
      fileUrl: currentFile?.url || '',
      fileName: currentFile?.name || '',
      fileType: currentFile?.mimeType || '',
      thumbnailUrl: undefined, // Could generate thumbnails
      version: data.version,
      scale: data.scale,
      revisionNumber: data.revisionNumber,
      status: pendingApproval ? 'pending-review' : (approvedApproval ? 'approved' : 'pending-review'),
      approvalStatus: pendingApproval?.status || approvedApproval?.status || 'pending',
      canApprove: !!pendingApproval,
      approvedAt: approvedApproval?.respondedAt,
      approvedBy: approvedApproval?.respondedBy,
      sharedAt: data.portalShareDate!,
      sharedBy: data.updatedBy,
    } as PortalArchitecturalDrawing;
  });
}

// ============================================
// File Operations
// ============================================

/**
 * Upload a drawing file
 */
export async function uploadArchitecturalDrawingFile(
  projectId: string,
  drawingId: string,
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<ArchitecturalDrawingFile> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `design-projects/${projectId}/architectural-drawings/${drawingId}/${timestamp}_${safeName}`;

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        // Determine file type
        let fileType: ArchitecturalDrawingFile['fileType'] = 'other';
        if (file.type === 'application/pdf') fileType = 'pdf';
        else if (file.name.endsWith('.dwg')) fileType = 'dwg';
        else if (file.name.endsWith('.dxf')) fileType = 'dxf';
        else if (file.name.endsWith('.skp')) fileType = 'skp';
        else if (file.name.endsWith('.rvt')) fileType = 'rvt';
        else if (file.type.startsWith('image/')) fileType = 'image';

        const fileData: ArchitecturalDrawingFile = {
          id: `${timestamp}`,
          name: file.name,
          url,
          storagePath,
          mimeType: file.type,
          size: file.size,
          fileType,
          uploadedAt: Timestamp.now(),
          uploadedBy: userId,
          isCurrentVersion: true,
        };

        // Update drawing with new file
        const drawing = await getArchitecturalDrawing(projectId, drawingId);
        if (drawing) {
          // Mark existing files as not current
          const updatedFiles = drawing.files.map(f => ({ ...f, isCurrentVersion: false }));
          updatedFiles.push(fileData);

          await updateArchitecturalDrawing(projectId, drawingId, {
            files: updatedFiles,
          }, userId);
        }

        resolve(fileData);
      }
    );
  });
}

/**
 * Delete a drawing file
 */
export async function deleteArchitecturalDrawingFile(
  projectId: string,
  drawingId: string,
  fileId: string,
  userId: string
): Promise<void> {
  const drawing = await getArchitecturalDrawing(projectId, drawingId);
  if (!drawing) throw new Error('Drawing not found');

  const file = drawing.files.find(f => f.id === fileId);
  if (!file) throw new Error('File not found');

  // Delete from storage
  const storageRef = ref(storage, file.storagePath);
  await deleteObject(storageRef);

  // Update drawing
  const updatedFiles = drawing.files.filter(f => f.id !== fileId);

  // If we deleted the current version, make the most recent remaining file current
  if (file.isCurrentVersion && updatedFiles.length > 0) {
    const mostRecent = updatedFiles.reduce((latest, f) =>
      f.uploadedAt > latest.uploadedAt ? f : latest
    );
    mostRecent.isCurrentVersion = true;
  }

  await updateArchitecturalDrawing(projectId, drawingId, {
    files: updatedFiles,
  }, userId);
}

// ============================================
// Drawing Set Operations
// ============================================

/**
 * Create a drawing set
 */
export async function createDrawingSet(
  projectId: string,
  data: {
    name: string;
    description?: string;
    drawingIds?: string[];
  },
  userId: string
): Promise<string> {
  const setData: Omit<DrawingSet, 'id'> = {
    projectId,
    name: data.name,
    description: data.description,
    drawingIds: data.drawingIds || [],
    status: 'draft',
    createdAt: serverTimestamp() as Timestamp,
    createdBy: userId,
    updatedAt: serverTimestamp() as Timestamp,
    updatedBy: userId,
  };

  const docRef = await addDoc(
    collection(db, PROJECTS_COLLECTION, projectId, DRAWING_SETS_SUBCOLLECTION),
    setData
  );

  return docRef.id;
}

/**
 * Add a drawing to a set
 */
export async function addDrawingToSet(
  projectId: string,
  setId: string,
  drawingId: string,
  userId: string
): Promise<void> {
  const setRef = doc(db, PROJECTS_COLLECTION, projectId, DRAWING_SETS_SUBCOLLECTION, setId);
  const setDoc = await getDoc(setRef);

  if (!setDoc.exists()) throw new Error('Drawing set not found');

  const set = setDoc.data() as DrawingSet;
  if (!set.drawingIds.includes(drawingId)) {
    await updateDoc(setRef, {
      drawingIds: [...set.drawingIds, drawingId],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Remove a drawing from a set
 */
export async function removeDrawingFromSet(
  projectId: string,
  setId: string,
  drawingId: string,
  userId: string
): Promise<void> {
  const setRef = doc(db, PROJECTS_COLLECTION, projectId, DRAWING_SETS_SUBCOLLECTION, setId);
  const setDoc = await getDoc(setRef);

  if (!setDoc.exists()) throw new Error('Drawing set not found');

  const set = setDoc.data() as DrawingSet;
  await updateDoc(setRef, {
    drawingIds: set.drawingIds.filter(id => id !== drawingId),
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Issue a drawing set (mark as issued)
 */
export async function issueDrawingSet(
  projectId: string,
  setId: string,
  revision: string,
  userId: string
): Promise<void> {
  const setRef = doc(db, PROJECTS_COLLECTION, projectId, DRAWING_SETS_SUBCOLLECTION, setId);

  await updateDoc(setRef, {
    status: 'issued',
    issuedDate: serverTimestamp(),
    revision,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Get all drawing sets for a project
 */
export async function getDrawingSets(projectId: string): Promise<DrawingSet[]> {
  const q = query(
    collection(db, PROJECTS_COLLECTION, projectId, DRAWING_SETS_SUBCOLLECTION),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as DrawingSet));
}

// ============================================
// Dashboard Statistics
// ============================================

/**
 * Get dashboard statistics for architectural drawings
 */
export async function getArchitecturalDashboardStats(
  projectId: string
): Promise<ArchitecturalDashboardStats> {
  const drawings = await getArchitecturalDrawings(projectId);

  const stats: ArchitecturalDashboardStats = {
    totalDrawings: drawings.length,
    byStage: {
      'arch-concept': 0,
      'arch-development': 0,
      'arch-review': 0,
      'arch-client-review': 0,
      'arch-revision': 0,
      'arch-approved': 0,
    },
    byType: {
      'floor-plan': 0,
      'elevation': 0,
      'section': 0,
      'detail': 0,
      'reflected-ceiling-plan': 0,
      'site-plan': 0,
      'roof-plan': 0,
      'schedule': 0,
    },
    pendingClientReview: 0,
    pendingInternalReview: 0,
    recentlyUpdated: 0,
  };

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const drawing of drawings) {
    // Count by stage
    stats.byStage[drawing.currentStage]++;

    // Count by type
    stats.byType[drawing.drawingType]++;

    // Count pending reviews
    if (drawing.currentStage === 'arch-client-review') {
      stats.pendingClientReview++;
    }
    if (drawing.currentStage === 'arch-review') {
      stats.pendingInternalReview++;
    }

    // Count recently updated
    const updatedAt = drawing.updatedAt?.toDate?.() || new Date(0);
    if (updatedAt > oneWeekAgo) {
      stats.recentlyUpdated++;
    }
  }

  return stats;
}
