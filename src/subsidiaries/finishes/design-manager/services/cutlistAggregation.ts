/**
 * Cutlist Aggregation Service
 * Aggregates parts from all design items into a consolidated cutlist
 */

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type {
  ConsolidatedCutlist,
  MaterialGroup,
  AggregatedPart,
  DesignItem,
  PartEntry,
} from '../types';

const DEFAULT_SHEET_SIZE = { length: 2440, width: 1220 }; // Standard 8x4 sheet in mm

/**
 * Aggregate cutlist from all design items in a project
 */
export async function aggregateCutlist(
  projectId: string,
  userId: string
): Promise<ConsolidatedCutlist> {
  // Fetch all design items with parts
  const itemsRef = collection(db, 'designProjects', projectId, 'designItems');
  const snapshot = await getDocs(itemsRef);

  const allParts: (AggregatedPart & { materialName: string; thickness: number })[] = [];
  let lastUpdate = new Date(0);

  snapshot.forEach((docSnapshot) => {
    const item = docSnapshot.data() as DesignItem & { parts?: PartEntry[] };
    const parts = item.parts || [];

    parts.forEach((part) => {
      allParts.push({
        partId: part.id,
        designItemId: docSnapshot.id,
        designItemName: item.name,
        partNumber: part.partNumber,
        partName: part.name,
        length: part.length,
        width: part.width,
        quantity: part.quantity,
        grainDirection: part.grainDirection,
        edgeBanding: part.edgeBanding,
        materialName: part.materialName,
        thickness: part.thickness,
      });

      const partUpdate = part.updatedAt instanceof Timestamp 
        ? part.updatedAt.toDate() 
        : new Date(0);
      if (partUpdate > lastUpdate) {
        lastUpdate = partUpdate;
      }
    });
  });

  // Group by material and thickness
  const materialMap = new Map<string, MaterialGroup>();

  allParts.forEach((part) => {
    const key = `${part.materialName}-${part.thickness}`;

    if (!materialMap.has(key)) {
      materialMap.set(key, {
        materialId: '',
        materialCode: key,
        materialName: part.materialName,
        thickness: part.thickness,
        sheetSize: DEFAULT_SHEET_SIZE,
        parts: [],
        totalParts: 0,
        totalArea: 0,
        estimatedSheets: 0,
      });
    }

    const group = materialMap.get(key)!;
    group.parts.push({
      partId: part.partId,
      designItemId: part.designItemId,
      designItemName: part.designItemName,
      partNumber: part.partNumber,
      partName: part.partName,
      length: part.length,
      width: part.width,
      quantity: part.quantity,
      grainDirection: part.grainDirection,
      edgeBanding: part.edgeBanding,
    });
    group.totalParts += part.quantity;
    group.totalArea += (part.length * part.width * part.quantity) / 1_000_000; // mm² to m²
  });

  // Calculate estimated sheets per material (assume 70% yield)
  materialMap.forEach((group) => {
    const sheetArea = (group.sheetSize!.length * group.sheetSize!.width) / 1_000_000;
    group.estimatedSheets = Math.ceil(group.totalArea / (sheetArea * 0.7));
  });

  const materialGroups = Array.from(materialMap.values());

  // Build consolidated cutlist (omit staleReason when not stale - Firestore doesn't accept undefined)
  const cutlist = {
    generatedBy: userId,
    isStale: false,
    lastDesignItemUpdate: Timestamp.fromDate(lastUpdate),
    materialGroups,
    totalParts: materialGroups.reduce((sum, g) => sum + g.totalParts, 0),
    totalUniquePartsCount: allParts.length,
    totalMaterials: materialGroups.length,
    totalArea: Math.round(materialGroups.reduce((sum, g) => sum + g.totalArea, 0) * 1000) / 1000,
    estimatedTotalSheets: materialGroups.reduce((sum, g) => sum + g.estimatedSheets, 0),
  };

  // Save to project document
  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    consolidatedCutlist: {
      ...cutlist,
      generatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return {
    ...cutlist,
    generatedAt: Timestamp.now(),
  } as ConsolidatedCutlist;
}

/**
 * Mark cutlist as stale
 */
export async function markCutlistStale(
  projectId: string,
  reason: string
): Promise<void> {
  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    'consolidatedCutlist.isStale': true,
    'consolidatedCutlist.staleReason': reason,
  });
}

/**
 * Export cutlist to CSV format
 */
export function exportCutlistCSV(cutlist: ConsolidatedCutlist): string {
  const rows: string[] = [];
  rows.push('Material,Thickness (mm),Part #,Part Name,Design Item,Length (mm),Width (mm),Qty,Grain,Edges');

  cutlist.materialGroups.forEach((group) => {
    group.parts.forEach((part) => {
      const edges = [
        part.edgeBanding?.top && 'T',
        part.edgeBanding?.bottom && 'B',
        part.edgeBanding?.left && 'L',
        part.edgeBanding?.right && 'R',
      ].filter(Boolean).join('');

      rows.push([
        `"${group.materialName}"`,
        group.thickness,
        part.partNumber,
        `"${part.partName}"`,
        `"${part.designItemName}"`,
        part.length,
        part.width,
        part.quantity,
        part.grainDirection,
        edges || '-',
      ].join(','));
    });
  });

  return rows.join('\n');
}

/**
 * Export cutlist summary to CSV
 */
export function exportCutlistSummaryCSV(cutlist: ConsolidatedCutlist): string {
  const rows: string[] = [];
  rows.push('Material,Thickness (mm),Total Parts,Total Area (m²),Est. Sheets');

  cutlist.materialGroups.forEach((group) => {
    rows.push([
      `"${group.materialName}"`,
      group.thickness,
      group.totalParts,
      group.totalArea.toFixed(3),
      group.estimatedSheets,
    ].join(','));
  });

  rows.push('');
  rows.push(`Total,,${cutlist.totalParts},${cutlist.totalArea.toFixed(3)},${cutlist.estimatedTotalSheets}`);

  return rows.join('\n');
}

/**
 * Download CSV as file
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
