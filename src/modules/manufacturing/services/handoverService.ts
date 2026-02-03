/**
 * Handover Service
 * Bridge between Design Manager and Manufacturing module
 * Validates readiness and creates manufacturing orders from production-ready design items
 */

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { DesignItem, ManufacturingCost, PartEntry } from '@/modules/design-manager/types';
import type { BOMEntry, MOPartEntry } from '../types';
import { createManufacturingOrder } from './manufacturingOrderService';
import { getStockLevels } from '@/modules/inventory/services/stockLevelService';
import { resolveSupplierFromText } from './supplierBridgeService';
import { generateRequirementsFromMO } from './procurementRequirementService';

const PROJECTS_COLLECTION = 'designProjects';
const ITEMS_SUBCOLLECTION = 'designItems';

// ============================================
// Readiness Validation
// ============================================

export interface HandoverValidationResult {
  isReady: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Validate that a design item is ready for manufacturing handover
 */
export function validateHandoverReadiness(
  designItem: DesignItem,
): HandoverValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Must be correct sourcing type
  if (
    designItem.sourcingType !== 'CUSTOM_FURNITURE_MILLWORK' &&
    designItem.sourcingType !== 'MANUFACTURED'
  ) {
    issues.push('Item must be Custom Furniture/Millwork or Manufactured type');
  }

  // Must be at production-ready stage
  if (designItem.currentStage !== 'production-ready') {
    issues.push(
      `Item is at stage "${designItem.currentStage}", must be "production-ready"`,
    );
  }

  // Must have manufacturing cost data
  if (!designItem.manufacturing) {
    issues.push('No manufacturing cost data available');
  } else {
    if (designItem.manufacturing.totalCost <= 0) {
      warnings.push('Manufacturing total cost is zero');
    }
  }

  // Check RAG manufacturing readiness aspects
  const mfgReadiness = designItem.ragStatus?.manufacturingReadiness;
  if (mfgReadiness) {
    const criticalAspects = [
      { key: 'materialAvailability', label: 'Material Availability' },
      { key: 'processDocumentation', label: 'Process Documentation' },
      { key: 'costValidation', label: 'Cost Validation' },
    ] as const;

    for (const aspect of criticalAspects) {
      const status = mfgReadiness[aspect.key]?.status;
      if (status === 'red') {
        issues.push(`${aspect.label} is RED - must be resolved before handover`);
      } else if (status === 'amber') {
        warnings.push(`${aspect.label} is AMBER - consider resolving before handover`);
      }
    }
  }

  return {
    isReady: issues.length === 0,
    issues,
    warnings,
  };
}

// ============================================
// BOM Generation
// ============================================

/**
 * Build a bill of materials from a design item's manufacturing cost data and parts.
 * Resolves supplier text from special parts to matflow supplier records.
 */
export async function buildBOMFromDesignItem(
  manufacturing: ManufacturingCost,
  parts: PartEntry[],
): Promise<BOMEntry[]> {
  const bom: BOMEntry[] = [];

  // Sheet materials from manufacturing cost breakdown
  if (manufacturing.sheetMaterials) {
    for (const sheet of manufacturing.sheetMaterials) {
      bom.push({
        id: `BOM-SHEET-${sheet.materialName}-${sheet.thickness}`,
        inventoryItemId: sheet.materialId ?? '',
        sku: '',
        itemName: `${sheet.materialName} ${sheet.thickness}mm`,
        category: 'sheet-goods',
        quantityRequired: sheet.sheetsRequired,
        unit: 'sheet',
        unitCost: sheet.unitCost,
        totalCost: sheet.totalCost,
      });
    }
  }

  // Standard parts (hardware from Katana)
  if (manufacturing.standardParts) {
    for (const part of manufacturing.standardParts) {
      bom.push({
        id: `BOM-STD-${part.id}`,
        inventoryItemId: '',
        sku: part.katanaSku ?? '',
        itemName: part.name,
        category: part.category,
        quantityRequired: part.quantity,
        unit: 'pcs',
        unitCost: part.unitCost,
        totalCost: part.totalCost,
      });
    }
  }

  // Special parts (luxury items) — resolve supplier text to matflow supplier
  if (manufacturing.specialParts) {
    for (const part of manufacturing.specialParts) {
      let supplierId: string | undefined;
      let supplierName: string | undefined;

      if (part.supplier) {
        const resolved = await resolveSupplierFromText(part.supplier);
        if (resolved) {
          supplierId = resolved.supplierId;
          supplierName = resolved.supplierName;
        } else {
          // Could not resolve — keep original text in notes
          supplierName = part.supplier;
        }
      }

      bom.push({
        id: `BOM-SPL-${part.id}`,
        inventoryItemId: '',
        sku: part.partNumber ?? '',
        itemName: part.name,
        category: part.category,
        quantityRequired: part.quantity,
        unit: 'pcs',
        unitCost: part.costing?.landedUnitCost ?? 0,
        totalCost: part.costing?.totalLandedCost ?? 0,
        supplierId,
        supplierName,
        notes: !supplierId && part.supplier ? `Supplier (unresolved): ${part.supplier}` : undefined,
      });
    }
  }

  // Edge banding from parts
  const edgeBandingParts = parts.filter(
    (p) =>
      p.edgeBanding &&
      (p.edgeBanding.top || p.edgeBanding.bottom || p.edgeBanding.left || p.edgeBanding.right),
  );
  if (edgeBandingParts.length > 0) {
    // Calculate total linear meters of edge banding needed
    let totalEdgeMeters = 0;
    for (const part of edgeBandingParts) {
      const eb = part.edgeBanding;
      const lengthM = part.length / 1000;
      const widthM = part.width / 1000;
      const edgeLength =
        (eb.top ? lengthM : 0) +
        (eb.bottom ? lengthM : 0) +
        (eb.left ? widthM : 0) +
        (eb.right ? widthM : 0);
      totalEdgeMeters += edgeLength * part.quantity;
    }

    if (totalEdgeMeters > 0) {
      bom.push({
        id: 'BOM-EDGE-TOTAL',
        inventoryItemId: '',
        sku: '',
        itemName: 'Edge Banding (estimated)',
        category: 'edge-banding',
        quantityRequired: Math.ceil(totalEdgeMeters * 1.1), // 10% waste
        unit: 'lm',
        unitCost: 0,
        totalCost: 0,
        notes: `Calculated from ${edgeBandingParts.length} parts`,
      });
    }
  }

  return bom;
}

/**
 * Convert design item parts to MO part entries
 */
function convertToMOParts(parts: PartEntry[]): MOPartEntry[] {
  return parts.map((p) => ({
    id: p.id,
    partNumber: p.partNumber,
    name: p.name,
    materialName: p.materialName,
    length: p.length,
    width: p.width,
    thickness: p.thickness,
    quantity: p.quantity,
    grainDirection: p.grainDirection,
    edgeBanding: {
      top: p.edgeBanding?.top ?? false,
      bottom: p.edgeBanding?.bottom ?? false,
      left: p.edgeBanding?.left ?? false,
      right: p.edgeBanding?.right ?? false,
    },
    hasCNCOperations: p.hasCNCOperations,
    cncProgramRef: p.cncProgramRef,
  }));
}

// ============================================
// Material Availability Check
// ============================================

export interface MaterialAvailabilityReport {
  bomEntry: BOMEntry;
  totalAvailable: number;
  isSufficient: boolean;
}

/**
 * Check material availability for a BOM
 */
export async function checkMaterialAvailability(
  bom: BOMEntry[],
): Promise<MaterialAvailabilityReport[]> {
  const report: MaterialAvailabilityReport[] = [];

  for (const entry of bom) {
    if (!entry.inventoryItemId) {
      report.push({
        bomEntry: entry,
        totalAvailable: 0,
        isSufficient: false,
      });
      continue;
    }

    const stockLevels = await getStockLevels(entry.inventoryItemId);
    const totalAvailable = stockLevels.reduce(
      (sum, sl) => sum + sl.quantityAvailable,
      0,
    );

    report.push({
      bomEntry: entry,
      totalAvailable,
      isSufficient: totalAvailable >= entry.quantityRequired,
    });
  }

  return report;
}

// ============================================
// Handover Execution
// ============================================

/**
 * Initiate handover from design manager to manufacturing
 * Creates a manufacturing order and links it to the design item
 */
export async function initiateHandover(
  projectId: string,
  designItemId: string,
  userId: string,
  handoverNotes: string = '',
): Promise<{ moId: string; validation: HandoverValidationResult }> {
  // Fetch design item
  const itemRef = doc(
    db,
    PROJECTS_COLLECTION,
    projectId,
    ITEMS_SUBCOLLECTION,
    designItemId,
  );
  const itemSnap = await getDoc(itemRef);
  if (!itemSnap.exists()) throw new Error('Design item not found');

  const designItem = { id: itemSnap.id, ...itemSnap.data() } as DesignItem;

  // Validate readiness
  const validation = validateHandoverReadiness(designItem);
  if (!validation.isReady) {
    return { moId: '', validation };
  }

  // Fetch project for code
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  const projectCode = projectSnap.exists()
    ? (projectSnap.data()?.code ?? projectId)
    : projectId;

  // Fetch parts for the design item
  const partsQuery = query(
    collection(db, PROJECTS_COLLECTION, projectId, ITEMS_SUBCOLLECTION, designItemId, 'parts'),
  );
  const partsSnap = await getDocs(partsQuery);
  const parts = partsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PartEntry));

  // Build BOM (async — resolves suppliers) and parts
  const bom = await buildBOMFromDesignItem(designItem.manufacturing!, parts);
  const moParts = convertToMOParts(parts);

  // Create manufacturing order
  const moId = await createManufacturingOrder(
    {
      designItemId,
      projectId,
      projectCode,
      designItemName: designItem.name,
      quantity: designItem.requiredQuantity ?? 1,
      priority: designItem.priority ?? 'medium',
      bom,
      parts: moParts,
      instructions: designItem.notes ?? '',
      handoverNotes,
      subsidiaryId: 'finishes',
    },
    userId,
  );

  // Link MO back to design item
  await updateDoc(itemRef, {
    manufacturingOrderId: moId,
    handoverStatus: 'handed-over',
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  // Auto-generate procurement requirements for outsourced BOM items
  try {
    await generateRequirementsFromMO(moId, userId);
  } catch {
    // Non-critical — procurement requirements can be generated manually later
    console.warn('Failed to auto-generate procurement requirements for MO:', moId);
  }

  return { moId, validation };
}
