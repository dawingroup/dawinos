/**
 * Estimate Service
 * Calculate project estimates from optimization results and material palette
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { nanoid } from 'nanoid';
import type {
  ConsolidatedEstimate,
  EstimateLineItem,
  EstimateConfig,
  EstimateLineItemFormData,
} from '../types/estimate';
import { DEFAULT_ESTIMATE_CONFIG } from '../types/estimate';
import type { ConsolidatedCutlist } from '../types';
import type { EstimationResult, MaterialPaletteEntry } from '@/shared/types';
import { getMaterial } from './materialService';

/**
 * Calculate estimate from cutlist
 */
export async function calculateEstimate(
  projectId: string,
  _customerId: string | undefined, // Reserved for future customer-specific pricing
  cutlist: ConsolidatedCutlist,
  userId: string,
  config: EstimateConfig = DEFAULT_ESTIMATE_CONFIG
): Promise<ConsolidatedEstimate> {
  const lineItems: EstimateLineItem[] = [];

  // 1. Material costs from cutlist
  for (const group of cutlist.materialGroups) {
    let unitCost = 0;
    let materialId: string | undefined;

    // Try to get material pricing from library
    if (group.materialId) {
      try {
        const material = await getMaterial(group.materialId, 'global', undefined);
        if (material?.pricing?.unitCost) {
          unitCost = material.pricing.unitCost;
          materialId = material.id;
        }
      } catch (e) {
        // Material not found, use 0
      }
    }

    // If no pricing, estimate based on area (fallback)
    if (unitCost === 0) {
      // Default price per sheet based on thickness
      const defaultPrices: Record<number, number> = {
        3: 1500,
        6: 2000,
        9: 2500,
        12: 3000,
        15: 3500,
        16: 3800,
        18: 4200,
        22: 5000,
        25: 5500,
      };
      unitCost = defaultPrices[group.thickness] || 4000;
    }

    const totalPrice = group.estimatedSheets * unitCost;

    const item: EstimateLineItem = {
      id: nanoid(10),
      description: `${group.materialName} (${group.thickness}mm)`,
      category: 'material',
      quantity: group.estimatedSheets,
      unit: 'sheets',
      unitPrice: unitCost,
      totalPrice,
    };
    // Only add linkedMaterialId if it exists (Firestore doesn't accept undefined)
    if (materialId) {
      item.linkedMaterialId = materialId;
    }
    lineItems.push(item);
  }

  // 2. Labor costs
  const laborHours = (cutlist.totalParts * config.laborMinutesPerPart) / 60;
  const laborCost = laborHours * config.laborRatePerHour;

  lineItems.push({
    id: nanoid(10),
    description: 'Shop Labor',
    category: 'labor',
    quantity: Math.round(laborHours * 10) / 10,
    unit: 'hours',
    unitPrice: config.laborRatePerHour,
    totalPrice: Math.round(laborCost),
  });

  // 3. Overhead
  const materialSubtotal = lineItems
    .filter((li) => li.category === 'material')
    .reduce((sum, li) => sum + li.totalPrice, 0);
  
  if (config.overheadPercent > 0) {
    const overheadAmount = materialSubtotal * config.overheadPercent;
    lineItems.push({
      id: nanoid(10),
      description: `Overhead (${config.overheadPercent * 100}%)`,
      category: 'overhead',
      quantity: 1,
      unit: 'lot',
      unitPrice: Math.round(overheadAmount),
      totalPrice: Math.round(overheadAmount),
    });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const taxAmount = Math.round(subtotal * config.defaultTaxRate);
  const marginAmount = config.defaultMarginPercent > 0
    ? Math.round(subtotal * config.defaultMarginPercent)
    : 0;

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: cutlist.generatedAt as any,
    lineItems,
    subtotal: Math.round(subtotal),
    taxRate: config.defaultTaxRate,
    taxAmount,
    total: Math.round(subtotal + taxAmount + marginAmount),
    currency: config.currency,
    marginPercent: config.defaultMarginPercent,
    marginAmount,
  };

  // Save to project document
  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    consolidatedEstimate: {
      ...estimate,
      generatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return estimate;
}

/**
 * Calculate estimate from optimization results and material palette
 * This is the unified approach that uses Nesting Studio data
 */
export async function calculateEstimateFromOptimization(
  projectId: string,
  estimation: EstimationResult,
  materialPalette: MaterialPaletteEntry[],
  userId: string,
  config: EstimateConfig = DEFAULT_ESTIMATE_CONFIG
): Promise<ConsolidatedEstimate> {
  const lineItems: EstimateLineItem[] = [];

  // 1. Material costs from optimization sheet summary
  for (const sheet of estimation.sheetSummary) {
    // Find matching material in palette for unit cost
    const paletteEntry = materialPalette.find(
      entry => entry.designName === sheet.materialName || 
               entry.normalizedName === sheet.materialName.toLowerCase().trim()
    );
    
    // Use unit cost from palette (from inventory mapping) or fallback
    let unitCost = paletteEntry?.unitCost || 0;
    
    // If no unit cost from palette, use default based on thickness
    if (unitCost === 0) {
      const thickness = paletteEntry?.thickness || 18;
      const defaultPrices: Record<number, number> = {
        3: 1500, 6: 2000, 9: 2500, 12: 3000, 15: 3500,
        16: 3800, 18: 4200, 22: 5000, 25: 5500,
      };
      unitCost = defaultPrices[thickness] || 4000;
    }

    const totalPrice = sheet.sheetsRequired * unitCost;

    const item: EstimateLineItem = {
      id: nanoid(10),
      description: `${sheet.materialName} (${sheet.sheetSize.length}×${sheet.sheetSize.width}mm)`,
      category: 'material',
      quantity: sheet.sheetsRequired,
      unit: 'sheets',
      unitPrice: unitCost,
      totalPrice,
    };
    
    // Link to inventory if mapped
    if (paletteEntry?.inventoryId) {
      item.linkedMaterialId = paletteEntry.inventoryId;
    }
    
    lineItems.push(item);
  }

  // 2. Labor costs based on optimized parts count
  const laborHours = (estimation.totalPartsCount * config.laborMinutesPerPart) / 60;
  const laborCost = laborHours * config.laborRatePerHour;

  lineItems.push({
    id: nanoid(10),
    description: 'Shop Labor',
    category: 'labor',
    quantity: Math.round(laborHours * 10) / 10,
    unit: 'hours',
    unitPrice: config.laborRatePerHour,
    totalPrice: Math.round(laborCost),
  });

  // 3. Overhead
  const materialSubtotal = lineItems
    .filter((li) => li.category === 'material')
    .reduce((sum, li) => sum + li.totalPrice, 0);
  
  if (config.overheadPercent > 0) {
    const overheadAmount = materialSubtotal * config.overheadPercent;
    lineItems.push({
      id: nanoid(10),
      description: `Overhead (${config.overheadPercent * 100}%)`,
      category: 'overhead',
      quantity: 1,
      unit: 'lot',
      unitPrice: Math.round(overheadAmount),
      totalPrice: Math.round(overheadAmount),
    });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const taxAmount = Math.round(subtotal * config.defaultTaxRate);
  const marginAmount = config.defaultMarginPercent > 0
    ? Math.round(subtotal * config.defaultMarginPercent)
    : 0;

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: estimation.validAt as any, // Use optimization validAt
    lineItems,
    subtotal: Math.round(subtotal),
    taxRate: config.defaultTaxRate,
    taxAmount,
    total: Math.round(subtotal + taxAmount + marginAmount),
    currency: config.currency,
    marginPercent: config.defaultMarginPercent,
    marginAmount,
  };

  // Save to project document
  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    consolidatedEstimate: {
      ...estimate,
      generatedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return estimate;
}

/**
 * Add manual line item to estimate
 */
export async function addEstimateLineItem(
  projectId: string,
  currentEstimate: ConsolidatedEstimate,
  itemData: EstimateLineItemFormData,
  userId: string
): Promise<ConsolidatedEstimate> {
  const newItem: EstimateLineItem = {
    id: nanoid(10),
    description: itemData.description,
    category: itemData.category,
    quantity: itemData.quantity,
    unit: itemData.unit,
    unitPrice: itemData.unitPrice,
    totalPrice: itemData.quantity * itemData.unitPrice,
    isManual: true,
  };
  // Only add notes if it exists (Firestore doesn't accept undefined)
  if (itemData.notes) {
    newItem.notes = itemData.notes;
  }

  const lineItems = [...currentEstimate.lineItems, newItem];
  return await recalculateAndSave(projectId, currentEstimate, lineItems, userId);
}

/**
 * Update a line item
 */
export async function updateEstimateLineItem(
  projectId: string,
  currentEstimate: ConsolidatedEstimate,
  itemId: string,
  updates: Partial<EstimateLineItemFormData>,
  userId: string
): Promise<ConsolidatedEstimate> {
  const lineItems = currentEstimate.lineItems.map((item) => {
    if (item.id !== itemId) return item;
    
    const updated = {
      ...item,
      ...updates,
      totalPrice: (updates.quantity ?? item.quantity) * (updates.unitPrice ?? item.unitPrice),
    };
    return updated;
  });

  return await recalculateAndSave(projectId, currentEstimate, lineItems, userId);
}

/**
 * Remove a line item
 */
export async function removeEstimateLineItem(
  projectId: string,
  currentEstimate: ConsolidatedEstimate,
  itemId: string,
  userId: string
): Promise<ConsolidatedEstimate> {
  const lineItems = currentEstimate.lineItems.filter((item) => item.id !== itemId);
  return await recalculateAndSave(projectId, currentEstimate, lineItems, userId);
}

/**
 * Recalculate totals and save
 */
async function recalculateAndSave(
  projectId: string,
  currentEstimate: ConsolidatedEstimate,
  lineItems: EstimateLineItem[],
  userId: string
): Promise<ConsolidatedEstimate> {
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const taxAmount = Math.round(subtotal * currentEstimate.taxRate);
  const marginAmount = currentEstimate.marginPercent
    ? Math.round(subtotal * currentEstimate.marginPercent)
    : 0;

  const estimate: ConsolidatedEstimate = {
    ...currentEstimate,
    lineItems,
    subtotal: Math.round(subtotal),
    taxAmount,
    marginAmount,
    total: Math.round(subtotal + taxAmount + marginAmount),
  };

  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    consolidatedEstimate: estimate,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });

  return estimate;
}

/**
 * Mark estimate as stale
 */
export async function markEstimateStale(
  projectId: string,
  reason: string
): Promise<void> {
  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    'consolidatedEstimate.isStale': true,
    'consolidatedEstimate.staleReason': reason,
  });
}

/**
 * Export estimate to CSV
 */
export function exportEstimateCSV(estimate: ConsolidatedEstimate): string {
  const headers = ['Category', 'Description', 'Quantity', 'Unit', 'Unit Price', 'Total'];
  const rows = estimate.lineItems.map((item) => [
    item.category,
    item.description,
    item.quantity.toString(),
    item.unit,
    item.unitPrice.toFixed(2),
    item.totalPrice.toFixed(2),
  ]);

  // Add totals
  rows.push(['', '', '', '', 'Subtotal', estimate.subtotal.toFixed(2)]);
  rows.push(['', '', '', '', `Tax (${estimate.taxRate * 100}%)`, estimate.taxAmount.toFixed(2)]);
  if (estimate.marginAmount) {
    rows.push(['', '', '', '', `Margin (${(estimate.marginPercent || 0) * 100}%)`, estimate.marginAmount.toFixed(2)]);
  }
  rows.push(['', '', '', '', 'TOTAL', estimate.total.toFixed(2)]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Download CSV
 */
export function downloadEstimateCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
