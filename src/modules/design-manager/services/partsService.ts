/**
 * Parts Service
 * CRUD operations for design item parts
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { nanoid } from 'nanoid';
import type { PartEntry, PartsSummary, PartEdgeBanding } from '../types';

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
  return {
    ...data,
    id: generatePartId(),
    partNumber: data.partNumber || generatePartNumber(existingParts),
    edgeBanding: data.edgeBanding || DEFAULT_EDGE_BANDING,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
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
  const part = createPartEntry(partData, existingParts);
  const docRef = getDesignItemRef(projectId, itemId);

  const newParts = [...existingParts, part];
  const summary = calculatePartsSummary(newParts);

  await updateDoc(docRef, {
    parts: newParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

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

  const updatedParts = currentParts.map((part) =>
    part.id === partId
      ? { ...part, ...updates, updatedAt: Timestamp.now() }
      : part
  );

  const summary = calculatePartsSummary(updatedParts);

  await updateDoc(docRef, {
    parts: updatedParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
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

  const remainingParts = currentParts.filter((p) => p.id !== partId);
  const summary = calculatePartsSummary(remainingParts);

  await updateDoc(docRef, {
    parts: remainingParts,
    partsSummary: summary,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
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

  let allParts = [...existingParts];
  const newParts: PartEntry[] = [];

  for (const partData of partsData) {
    const part = createPartEntry(partData, allParts);
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

  return parts;
}
