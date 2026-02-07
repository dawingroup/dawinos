/**
 * Parts Service
 * CRUD operations for design item parts
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { nanoid } from 'nanoid';
import type { PartEntry, PartsSummary, PartEdgeBanding } from '../types';

const PROJECTS_COLLECTION = 'designProjects';

/**
 * Helper to remove undefined values from objects (Firestore doesn't accept undefined)
 */
function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  if (typeof obj !== 'object') return obj;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = typeof value === 'object' && value !== null ? cleanUndefined(value) : value;
    }
  }
  return cleaned;
}

/**
 * Generate a unique part ID
 */
export function generatePartId(): string {
  return nanoid(10);
}

/**
 * Generate part number (sequential within item)
 */
export function generatePartNumber(existingParts: PartEntry[]): string {
  const maxNumber = existingParts.reduce((max, part) => {
    const match = part.partNumber.match(/P(\d+)/);
    if (match) {
      return Math.max(max, parseInt(match[1], 10));
    }
    return max;
  }, 0);
  return `P${String(maxNumber + 1).padStart(3, '0')}`;
}

/**
 * Calculate parts summary
 */
export function calculatePartsSummary(parts: PartEntry[]): PartsSummary {
  const uniqueMaterials = new Set(parts.map((p) => p.materialId || p.materialName));
  
  // Calculate total area in square meters
  const totalArea = parts.reduce((sum, part) => {
    const areaPerPart = (part.length * part.width) / 1_000_000; // mm² to m²
    return sum + areaPerPart * part.quantity;
  }, 0);

  const isComplete = parts.every((p) => p.materialId || p.materialName);

  return {
    totalParts: parts.reduce((sum, p) => sum + p.quantity, 0),
    uniqueMaterials: uniqueMaterials.size,
    totalArea: Math.round(totalArea * 1000) / 1000, // Round to 3 decimals
    lastUpdated: Timestamp.now(),
    isComplete,
  };
}

/**
 * Default edge banding
 */
export const DEFAULT_EDGE_BANDING: PartEdgeBanding = {
  top: false,
  bottom: false,
  left: false,
  right: false,
};

/**
 * Create a new part entry
 */
export function createPartEntry(
  data: Omit<PartEntry, 'id' | 'createdAt' | 'updatedAt'>,
  existingParts: PartEntry[] = []
): PartEntry {
  const part: PartEntry = {
    id: generatePartId(),
    partNumber: data.partNumber || generatePartNumber(existingParts),
    name: data.name || '',
    length: data.length || 0,
    width: data.width || 0,
    thickness: data.thickness || 18,
    quantity: data.quantity || 1,
    materialName: data.materialName || '',
    grainDirection: data.grainDirection || 'none',
    edgeBanding: data.edgeBanding || DEFAULT_EDGE_BANDING,
    hasCNCOperations: data.hasCNCOperations || false,
    source: data.source || 'manual',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Add optional fields only if they have values
  if (data.materialId) part.materialId = data.materialId;
  if (data.materialCode) part.materialCode = data.materialCode;
  if (data.cncProgramRef) part.cncProgramRef = data.cncProgramRef;
  if (data.notes) part.notes = data.notes;
  if (data.importedFrom) part.importedFrom = data.importedFrom;
  
  return part;
}

/**
 * Get design item document reference
 */
function getDesignItemRef(projectId: string, itemId: string) {
  return doc(db, 'designProjects', projectId, 'designItems', itemId);
}

/**
 * Add a part to a design item
 */
export async function addPart(
  projectId: string,
  itemId: string,
  partData: Omit<PartEntry, 'id' | 'createdAt' | 'updatedAt'>,
  existingParts: PartEntry[],
  userId: string
): Promise<PartEntry> {
  const part = cleanUndefined(createPartEntry(partData, existingParts));
  const docRef = getDesignItemRef(projectId, itemId);

  // Clean all parts to remove any undefined values
  const newParts = [...existingParts.map(cleanUndefined), part];
  const summary = calculatePartsSummary(newParts);

  await updateDoc(docRef, {
    parts: newParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Invalidate project optimization
  await invalidateProjectOptimization(projectId, userId, 'Part added');

  return part;
}

/**
 * Update a part in a design item
 */
export async function updatePart(
  projectId: string,
  itemId: string,
  partId: string,
  updates: Partial<Omit<PartEntry, 'id' | 'createdAt'>>,
  currentParts: PartEntry[],
  userId: string
): Promise<void> {
  const docRef = getDesignItemRef(projectId, itemId);

  // Clean undefined values from updates before applying
  const cleanedUpdates = cleanUndefined(updates);
  
  const updatedParts = currentParts.map((part) =>
    part.id === partId
      ? cleanUndefined({ ...part, ...cleanedUpdates, updatedAt: Timestamp.now() })
      : cleanUndefined(part)
  );

  const summary = calculatePartsSummary(updatedParts);

  await updateDoc(docRef, {
    parts: updatedParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Invalidate project optimization
  await invalidateProjectOptimization(projectId, userId, 'Part modified');
}

/**
 * Delete a part from a design item
 */
export async function deletePart(
  projectId: string,
  itemId: string,
  partId: string,
  currentParts: PartEntry[],
  userId: string
): Promise<void> {
  const docRef = getDesignItemRef(projectId, itemId);

  const remainingParts = currentParts.filter((p) => p.id !== partId).map(cleanUndefined);
  const summary = calculatePartsSummary(remainingParts);

  await updateDoc(docRef, {
    parts: remainingParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Invalidate project optimization
  await invalidateProjectOptimization(projectId, userId, 'Part deleted');
}

/**
 * Bulk add parts (for CSV import)
 */
export async function bulkAddParts(
  projectId: string,
  itemId: string,
  partsData: Omit<PartEntry, 'id' | 'createdAt' | 'updatedAt'>[],
  existingParts: PartEntry[],
  userId: string
): Promise<PartEntry[]> {
  const docRef = getDesignItemRef(projectId, itemId);

  let allParts = existingParts.map(cleanUndefined);
  const newParts: PartEntry[] = [];

  for (const partData of partsData) {
    const part = cleanUndefined(createPartEntry(partData, allParts));
    newParts.push(part);
    allParts.push(part);
  }

  const summary = calculatePartsSummary(allParts);

  await updateDoc(docRef, {
    parts: allParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Invalidate project optimization
  await invalidateProjectOptimization(projectId, userId, 'Parts imported');

  return newParts;
}

/**
 * Replace all parts (for re-import)
 */
export async function replaceAllParts(
  projectId: string,
  itemId: string,
  partsData: Omit<PartEntry, 'id' | 'createdAt' | 'updatedAt'>[],
  userId: string
): Promise<PartEntry[]> {
  const docRef = getDesignItemRef(projectId, itemId);

  const parts: PartEntry[] = [];
  for (const partData of partsData) {
    const part = createPartEntry(partData, parts);
    parts.push(part);
  }

  const summary = calculatePartsSummary(parts);

  await updateDoc(docRef, {
    parts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Invalidate project optimization
  await invalidateProjectOptimization(projectId, userId, 'Parts replaced');

  return parts;
}

// ============================================
// Invalidation Helper
// ============================================

/**
 * Invalidate project optimization and cutlist when parts change
 * Integrates with ChangeDetectionService for dependency tracking
 */
async function invalidateProjectOptimization(
  projectId: string,
  userId: string,
  reason: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) return;
  
  const project = projectSnap.data();
  const now = Timestamp.now();
  const timestamp = { seconds: now.seconds, nanoseconds: now.nanoseconds };
  
  // Get current optimization status
  const currentStatus = project.optimizationStatus;
  const currentReasons = currentStatus?.invalidationReasons || [];
  const updatedReasons = currentReasons.includes(reason) 
    ? currentReasons 
    : [...currentReasons, reason];
  
  const updates: Record<string, unknown> = {
    // Mark cutlist as stale
    'consolidatedCutlist.isStale': true,
    'consolidatedCutlist.staleReason': reason,
    // Update optimization status for change detection
    'optimizationStatus.status': 'stale',
    'optimizationStatus.invalidationReasons': updatedReasons,
    'optimizationStatus.version': (currentStatus?.version || 0) + 1,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  
  // Invalidate estimation if it exists
  if (project.optimizationState?.estimation && !project.optimizationState.estimation.invalidatedAt) {
    updates['optimizationState.estimation.invalidatedAt'] = timestamp;
    updates['optimizationState.estimation.invalidationReasons'] = [reason];
  }
  
  // Invalidate production if it exists
  if (project.optimizationState?.production && !project.optimizationState.production.invalidatedAt) {
    updates['optimizationState.production.invalidatedAt'] = timestamp;
    updates['optimizationState.production.invalidationReasons'] = [reason];
  }
  
  await updateDoc(projectRef, updates);
  console.log(`Project ${projectId} marked stale: ${reason}`);
}
