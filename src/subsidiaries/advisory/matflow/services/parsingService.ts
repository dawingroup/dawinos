/**
 * BOQ Parsing Service
 * Manages file uploads, parsing jobs, and import of parsed items
 */

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/core/services/firebase';
import type { BOQParsingResult, ParsedBOQItem } from '../ai/schemas/boqSchema';
import { BOQStatus } from '../types';

// Parsing job status
export type ParsingJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Parsing job interface
export interface ParsingJob {
  id: string;
  organizationId: string;
  projectId: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: 'excel' | 'pdf' | 'csv';
  status: ParsingJobStatus;
  progress: number;
  parsedItems: ParsedBOQItem[];
  result?: BOQParsingResult;
  errorMessage?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
}

// Collection reference helper
const parsingJobsCollection = (orgId: string, projectId: string) =>
  collection(db, 'organizations', orgId, 'matflow_projects', projectId, 'parsing_jobs');

const parsingJobDoc = (orgId: string, projectId: string, jobId: string) =>
  doc(db, 'organizations', orgId, 'matflow_projects', projectId, 'parsing_jobs', jobId);

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Determine file type from extension
 */
function getFileType(fileName: string): 'excel' | 'pdf' | 'csv' {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (['xlsx', 'xls'].includes(ext || '')) {
    return 'excel';
  } else if (ext === 'pdf') {
    return 'pdf';
  } else if (ext === 'csv') {
    return 'csv';
  }
  
  throw new Error('Unsupported file type. Please upload Excel, PDF, or CSV files.');
}

/**
 * Upload BOQ file to Firebase Storage
 */
export async function uploadBOQFile(
  organizationId: string,
  projectId: string,
  file: File
): Promise<{ fileUrl: string; fileType: 'excel' | 'pdf' | 'csv' }> {
  const fileType = getFileType(file.name);
  
  const timestamp = Date.now();
  const storagePath = `organizations/${organizationId}/matflow/${projectId}/imports/${timestamp}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  
  await uploadBytes(storageRef, file);
  const fileUrl = await getDownloadURL(storageRef);
  
  return { fileUrl, fileType };
}

// ============================================================================
// PARSING JOB MANAGEMENT
// ============================================================================

/**
 * Create a new parsing job
 */
export async function createParsingJob(
  organizationId: string,
  projectId: string,
  userId: string,
  fileName: string,
  fileUrl: string,
  fileType: 'excel' | 'pdf' | 'csv'
): Promise<string> {
  const jobRef = doc(parsingJobsCollection(organizationId, projectId));
  
  const jobData: Omit<ParsingJob, 'id'> = {
    organizationId,
    projectId,
    userId,
    fileName,
    fileUrl,
    fileType,
    status: 'pending',
    progress: 0,
    parsedItems: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  await setDoc(jobRef, jobData);
  
  // Note: Parsing is now handled client-side via processParsingJobLocally
  // Cloud Functions are not used to avoid CORS issues
  
  return jobRef.id;
}

/**
 * Get parsing job by ID
 */
export async function getParsingJob(
  organizationId: string,
  projectId: string,
  jobId: string
): Promise<ParsingJob | null> {
  const jobSnap = await getDoc(parsingJobDoc(organizationId, projectId, jobId));
  
  if (!jobSnap.exists()) {
    return null;
  }
  
  return { id: jobSnap.id, ...jobSnap.data() } as ParsingJob;
}

/**
 * Subscribe to parsing job updates (real-time)
 */
export function subscribeToParsingJob(
  organizationId: string,
  projectId: string,
  jobId: string,
  callback: (job: ParsingJob | null) => void
): () => void {
  return onSnapshot(
    parsingJobDoc(organizationId, projectId, jobId),
    (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as ParsingJob);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Parsing job subscription error:', error);
      callback(null);
    }
  );
}

/**
 * Update parsing job status
 */
export async function updateParsingJobStatus(
  organizationId: string,
  projectId: string,
  jobId: string,
  status: ParsingJobStatus,
  updates?: {
    progress?: number;
    result?: BOQParsingResult;
    parsedItems?: ParsedBOQItem[];
    errorMessage?: string;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  
  if (updates?.progress !== undefined) {
    updateData.progress = updates.progress;
  }
  
  if (updates?.result) {
    updateData.result = updates.result;
    updateData.parsedItems = updates.result.items;
  }
  
  // Allow directly setting parsedItems (for client-side parsing)
  if (updates?.parsedItems) {
    updateData.parsedItems = updates.parsedItems;
  }
  
  if (updates?.errorMessage) {
    updateData.errorMessage = updates.errorMessage;
  }
  
  if (status === 'completed' || status === 'failed') {
    updateData.completedAt = serverTimestamp();
  }
  
  await updateDoc(parsingJobDoc(organizationId, projectId, jobId), updateData);
}

/**
 * Get recent parsing jobs for a project
 */
export async function getParsingJobs(
  organizationId: string,
  projectId: string,
  limitCount = 10
): Promise<ParsingJob[]> {
  const q = query(
    parsingJobsCollection(organizationId, projectId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as ParsingJob[];
}

// ============================================================================
// IMPORT PARSED ITEMS
// ============================================================================

/**
 * Import parsed BOQ items into the project
 */
export async function importParsedItems(
  organizationId: string,
  projectId: string,
  items: ParsedBOQItem[],
  userId: string
): Promise<string[]> {
  console.log('importParsedItems called:', { organizationId, projectId, itemCount: items?.length, userId });
  
  if (!items || items.length === 0) {
    console.warn('No items to import');
    return [];
  }
  
  const boqCollection = collection(
    db,
    'organizations',
    organizationId,
    'matflow_projects',
    projectId,
    'boq_items'
  );
  
  const importedIds: string[] = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`Importing item ${i + 1}/${items.length}:`, item.description?.substring(0, 50));
    const boqItemData = {
      projectId,
      itemCode: item.itemCode,
      description: item.description,
      unit: item.unit,
      quantityContract: item.quantity,
      quantityExecuted: 0,
      quantityRemaining: item.quantity,
      rate: item.rate || 0,
      amount: item.amount || (item.quantity * (item.rate || 0)),
      stage: item.stage || 'uncategorized',
      formulaId: null,
      formulaCode: item.suggestedFormulaCode || null,
      materialRequirements: [],
      aiConfidence: item.confidence || 0.8,
      isVerified: (item.confidence || 0.8) >= 0.8,
      source: { type: 'ai_import' as const },
      version: 1,
      lastModifiedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      createdBy: userId,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    };
    
    const docRef = doc(boqCollection);
    await setDoc(docRef, boqItemData);
    importedIds.push(docRef.id);
  }
  
  // Update project stats
  const projectRef = doc(
    db,
    'organizations',
    organizationId,
    'matflow_projects',
    projectId
  );
  
  const projectSnap = await getDoc(projectRef);
  if (projectSnap.exists()) {
    const currentTotal = projectSnap.data()?.totalBOQItems || 0;
    const currentCost = projectSnap.data()?.totalPlannedCost || 0;
    const importedCost = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    
    await updateDoc(projectRef, {
      totalBOQItems: currentTotal + items.length,
      totalPlannedCost: currentCost + importedCost,
      boqStatus: BOQStatus.DRAFT,
      updatedAt: serverTimestamp(),
    });
  }
  
  return importedIds;
}
