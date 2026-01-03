/**
 * Estimate Service
 * Calculate project estimates from optimization results and material palette
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
  query,
  where,
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
import type { ConsolidatedCutlist, DesignItem, ProcurementPricing, ManufacturingCost, PartEntry, SheetMaterialBreakdown } from '../types';
import type { EstimationResult, MaterialPaletteEntry } from '@/shared/types';
import { getMaterial } from './materialService';
import { getMaterialPriceByName } from '@/modules/inventory/services/inventoryPriceService';

// Default sheet size for material estimation (mm)
const DEFAULT_SHEET_SIZE = { length: 2440, width: 1220 };

/**
 * Calculate sheet material breakdown from parts list
 * Groups parts by material and calculates required sheets
 */
export async function calculateSheetMaterialsFromParts(
  parts: PartEntry[],
  materialPalette?: MaterialPaletteEntry[]
): Promise<{ materials: SheetMaterialBreakdown[]; totalCost: number }> {
  // Group parts by material
  const materialGroups = new Map<string, {
    materialId?: string;
    materialName: string;
    thickness: number;
    parts: PartEntry[];
    totalArea: number;
  }>();

  for (const part of parts) {
    const key = `${part.materialName}-${part.thickness}`;
    const existing = materialGroups.get(key);
    const partArea = (part.length * part.width * part.quantity) / 1_000_000; // Convert to m²
    
    if (existing) {
      existing.parts.push(part);
      existing.totalArea += partArea;
    } else {
      materialGroups.set(key, {
        materialId: part.materialId,
        materialName: part.materialName,
        thickness: part.thickness,
        parts: [part],
        totalArea: partArea,
      });
    }
  }

  // Calculate sheets required and costs for each material
  const materials: SheetMaterialBreakdown[] = [];
  let totalCost = 0;

  for (const [, group] of materialGroups) {
    // Calculate sheet area (in m²)
    const sheetArea = (DEFAULT_SHEET_SIZE.length * DEFAULT_SHEET_SIZE.width) / 1_000_000;
    
    // Estimate sheets required (with 15% waste factor)
    const sheetsRequired = Math.ceil((group.totalArea * 1.15) / sheetArea);
    
    // Get unit cost from unified inventory (single source of truth)
    let unitCost = 0;
    
    // 1. Try centralized inventory pricing (includes Katana-synced prices)
    try {
      const priceResult = await getMaterialPriceByName(
        group.materialName,
        group.thickness
      );
      if (priceResult.found && priceResult.price) {
        unitCost = priceResult.price.costPerUnit;
      }
    } catch {
      // Inventory price lookup failed
    }
    
    // 2. Fallback to material palette if provided
    if (unitCost === 0 && materialPalette) {
      const paletteEntry = materialPalette.find(
        entry => entry.designName === group.materialName || 
                 entry.normalizedName === group.materialName.toLowerCase().trim()
      );
      if (paletteEntry?.unitCost) {
        unitCost = paletteEntry.unitCost;
      }
    }
    
    // 3. Fallback to old material service
    if (unitCost === 0 && group.materialId) {
      try {
        const material = await getMaterial(group.materialId, 'global', undefined);
        if (material?.pricing?.unitCost) {
          unitCost = material.pricing.unitCost;
        }
      } catch {
        // Material not found
      }
    }
    
    // 4. Last resort fallback pricing (to be deprecated)
    if (unitCost === 0) {
      console.warn(`[Estimate] No price found for ${group.materialName}, using fallback`);
      const defaultPrices: Record<number, number> = {
        3: 45000, 6: 65000, 9: 85000, 12: 105000, 15: 125000,
        16: 135000, 18: 155000, 22: 185000, 25: 210000,
      };
      unitCost = defaultPrices[group.thickness] || 150000;
    }

    const materialTotal = sheetsRequired * unitCost;
    totalCost += materialTotal;

    materials.push({
      materialId: group.materialId,
      materialName: group.materialName,
      thickness: group.thickness,
      sheetsRequired,
      unitCost,
      totalCost: materialTotal,
      partsCount: group.parts.reduce((sum, p) => sum + p.quantity, 0),
      totalArea: group.totalArea,
    });
  }

  return { materials, totalCost };
}

/**
 * Calculate labor hours based on parts complexity
 */
export function calculateLaborFromParts(
  parts: PartEntry[],
  config: EstimateConfig = DEFAULT_ESTIMATE_CONFIG
): { hours: number; cost: number } {
  let totalMinutes = 0;
  
  for (const part of parts) {
    // Base time per part
    let minutesPerPart = config.laborMinutesPerPart;
    
    // Add time for edge banding
    const edges = part.edgeBanding;
    const edgeCount = [edges?.top, edges?.bottom, edges?.left, edges?.right]
      .filter(e => e && typeof e === 'string' && e !== 'none').length;
    minutesPerPart += edgeCount * 2; // 2 minutes per edge
    
    // Add time for CNC operations
    if (part.hasCNCOperations) {
      minutesPerPart += 5;
    }
    
    totalMinutes += minutesPerPart * part.quantity;
  }
  
  const hours = totalMinutes / 60;
  const cost = hours * config.laborRatePerHour;
  
  return { hours: Math.round(hours * 10) / 10, cost: Math.round(cost) };
}

/**
 * Fetch all design items for a project
 */
async function fetchAllDesignItems(projectId: string): Promise<Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost }>> {
  const itemsRef = collection(db, 'designProjects', projectId, 'designItems');
  const snapshot = await getDocs(itemsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost }>;
}

/**
 * Fetch all procured items for a project
 */
async function fetchProcuredItems(projectId: string): Promise<Array<DesignItem & { procurement?: ProcurementPricing }>> {
  const itemsRef = collection(db, 'designProjects', projectId, 'designItems');
  const q = query(itemsRef, where('sourcingType', '==', 'PROCURED'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<DesignItem & { procurement?: ProcurementPricing }>;
}

/**
 * Generate estimate line items from all design items (both manufactured and procured)
 */
function generateDesignItemLineItems(
  designItems: Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost }>
): EstimateLineItem[] {
  const lineItems: EstimateLineItem[] = [];
  
  for (const item of designItems) {
    // Handle PROCURED items
    if (item.sourcingType === 'PROCURED') {
      const procurement = item.procurement;
      
      if (!procurement || !procurement.totalLandedCost || procurement.totalLandedCost === 0) {
        continue;
      }
      
      const landedCostLine: EstimateLineItem = {
        id: nanoid(10),
        description: `${item.name} (Procured)`,
        category: 'procurement',
        quantity: procurement.quantity,
        unit: 'units',
        unitPrice: Math.round(procurement.landedCostPerUnit || 0),
        totalPrice: Math.round(procurement.totalLandedCost),
        linkedDesignItemId: item.id,
      };
      
      const notes: string[] = [];
      if (procurement.vendor) {
        notes.push(`Vendor: ${procurement.vendor}`);
      }
      if (procurement.currency && procurement.exchangeRate && procurement.exchangeRate !== 1) {
        notes.push(`FX: 1 ${procurement.currency} = ${procurement.exchangeRate} ${procurement.targetCurrency || 'UGX'}`);
      }
      if (notes.length > 0) {
        landedCostLine.notes = notes.join(' | ');
      }
      
      lineItems.push(landedCostLine);
    }
    // Handle MANUFACTURED items
    else if (item.sourcingType === 'MANUFACTURED' || !item.sourcingType) {
      const manufacturing = item.manufacturing;
      
      if (!manufacturing || !manufacturing.totalCost || manufacturing.totalCost === 0) {
        continue;
      }
      
      const materialCost = manufacturing.materialCost || 0;
      const laborHours = manufacturing.laborHours || 0;
      const laborRate = manufacturing.laborRate || 0;
      const laborCost = manufacturing.laborCost || 0;
      
      const manufacturedLine: EstimateLineItem = {
        id: nanoid(10),
        description: `${item.name} (Manufactured)`,
        category: 'material', // Using 'material' category for manufactured items
        quantity: manufacturing.quantity || 1,
        unit: 'units',
        unitPrice: Math.round(manufacturing.costPerUnit || manufacturing.totalCost),
        totalPrice: Math.round(manufacturing.totalCost),
        linkedDesignItemId: item.id,
      };
      
      const notes: string[] = [];
      notes.push(`Materials: ${materialCost.toLocaleString()}`);
      notes.push(`Labor: ${laborHours}hrs @ ${laborRate}/hr = ${laborCost.toLocaleString()}`);
      if (manufacturing.materialBreakdown) {
        notes.push(manufacturing.materialBreakdown);
      }
      manufacturedLine.notes = notes.join(' | ');
      
      lineItems.push(manufacturedLine);
    }
  }
  
  return lineItems;
}

/**
 * Generate estimate line items from procured items (legacy - kept for compatibility)
 */
function generateProcurementLineItems(
  procuredItems: Array<DesignItem & { procurement?: ProcurementPricing }>
): EstimateLineItem[] {
  const lineItems: EstimateLineItem[] = [];
  
  for (const item of procuredItems) {
    const procurement = item.procurement;
    
    if (!procurement || !procurement.totalLandedCost || procurement.totalLandedCost === 0) {
      continue;
    }
    
    const landedCostLine: EstimateLineItem = {
      id: nanoid(10),
      description: `${item.name} - Landed Cost (${procurement.quantity}x @ ${procurement.targetCurrency || 'UGX'} ${Math.round(procurement.landedCostPerUnit || 0).toLocaleString()}/unit)`,
      category: 'procurement',
      quantity: procurement.quantity,
      unit: 'units',
      unitPrice: Math.round(procurement.landedCostPerUnit || 0),
      totalPrice: Math.round(procurement.totalLandedCost),
      linkedDesignItemId: item.id,
    };
    
    const notes: string[] = [];
    if (procurement.vendor) {
      notes.push(`Vendor: ${procurement.vendor}`);
    }
    if (procurement.currency && procurement.exchangeRate && procurement.exchangeRate !== 1) {
      notes.push(`FX: 1 ${procurement.currency} = ${procurement.exchangeRate} ${procurement.targetCurrency || 'UGX'}`);
    }
    const breakdown: string[] = [];
    if (procurement.totalItemCost > 0) {
      breakdown.push(`Item: ${procurement.currency} ${procurement.totalItemCost.toLocaleString()}`);
    }
    if (procurement.totalLogistics && procurement.totalLogistics > 0) {
      breakdown.push(`Logistics: ${procurement.currency} ${procurement.totalLogistics.toLocaleString()}`);
    }
    if (procurement.totalCustoms && procurement.totalCustoms > 0) {
      breakdown.push(`Customs: ${procurement.currency} ${procurement.totalCustoms.toLocaleString()}`);
    }
    if (breakdown.length > 0) {
      notes.push(`Breakdown: ${breakdown.join(' + ')}`);
    }
    
    if (notes.length > 0) {
      landedCostLine.notes = notes.join(' | ');
    }
    
    lineItems.push(landedCostLine);
  }
  
  return lineItems;
}

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

  // 3. Procured items (fetch from project)
  const procuredItems = await fetchProcuredItems(projectId);
  const procurementLineItems = generateProcurementLineItems(procuredItems);
  lineItems.push(...procurementLineItems);

  // Apply overhead and margin markup to each line item's rate
  const overheadMultiplier = 1 + config.overheadPercent;
  const marginMultiplier = 1 + config.defaultMarginPercent;
  const totalMarkup = overheadMultiplier * marginMultiplier;
  
  const markedUpLineItems = lineItems.map(item => ({
    ...item,
    unitPrice: Math.round(item.unitPrice * totalMarkup),
    totalPrice: Math.round(item.totalPrice * totalMarkup),
  }));

  // Calculate totals from marked-up line items
  const subtotal = markedUpLineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const taxAmount = Math.round(subtotal * config.defaultTaxRate);
  
  // Track base amounts for reference
  const baseSubtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const overheadAmount = Math.round(baseSubtotal * config.overheadPercent);
  const marginAmount = Math.round((baseSubtotal + overheadAmount) * config.defaultMarginPercent);

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: cutlist.generatedAt as any,
    lineItems: markedUpLineItems,
    subtotal: Math.round(subtotal),
    taxRate: config.defaultTaxRate,
    taxAmount,
    total: Math.round(subtotal + taxAmount),
    currency: config.currency,
    overheadPercent: config.overheadPercent,
    overheadAmount,
    marginPercent: config.defaultMarginPercent,
    marginAmount,
    taxMode: 'exclusive',
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
 * This is the unified approach that uses per-design-item costing
 * Overhead and margin are applied to each line item's rate (not as separate line items)
 */
export async function calculateEstimateFromOptimization(
  projectId: string,
  _estimation: EstimationResult,
  _materialPalette: MaterialPaletteEntry[],
  userId: string,
  config: EstimateConfig = DEFAULT_ESTIMATE_CONFIG,
  taxMode: 'exclusive' | 'inclusive' = 'exclusive'
): Promise<ConsolidatedEstimate> {
  // Fetch all design items and generate per-item line items
  const allDesignItems = await fetchAllDesignItems(projectId);
  const baseLineItems = generateDesignItemLineItems(allDesignItems);
  
  // Calculate markup multiplier (overhead + margin applied to each item's rate)
  const overheadMultiplier = 1 + config.overheadPercent;
  const marginMultiplier = 1 + config.defaultMarginPercent;
  const totalMarkup = overheadMultiplier * marginMultiplier;
  
  // Apply markup to each line item's unit price and total price
  const lineItems: EstimateLineItem[] = baseLineItems.map(item => ({
    ...item,
    unitPrice: Math.round(item.unitPrice * totalMarkup),
    totalPrice: Math.round(item.totalPrice * totalMarkup),
  }));
  
  // Calculate subtotal from marked-up line items
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  
  // Calculate base amounts for tracking (before markup)
  const baseSubtotal = baseLineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const overheadAmount = Math.round(baseSubtotal * config.overheadPercent);
  const marginAmount = Math.round((baseSubtotal + overheadAmount) * config.defaultMarginPercent);
  
  // Calculate tax based on mode
  let taxAmount: number;
  let total: number;
  
  if (taxMode === 'inclusive') {
    // Tax is already included in subtotal, extract it
    taxAmount = Math.round(subtotal - (subtotal / (1 + config.defaultTaxRate)));
    total = subtotal;
  } else {
    // Tax is added on top
    taxAmount = Math.round(subtotal * config.defaultTaxRate);
    total = subtotal + taxAmount;
  }

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: _estimation?.validAt as any, // Use optimization validAt
    lineItems,
    subtotal: Math.round(subtotal),
    taxRate: config.defaultTaxRate,
    taxAmount,
    total: Math.round(total),
    currency: config.currency,
    overheadPercent: config.overheadPercent,
    overheadAmount,
    marginPercent: config.defaultMarginPercent,
    marginAmount,
    taxMode,
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
