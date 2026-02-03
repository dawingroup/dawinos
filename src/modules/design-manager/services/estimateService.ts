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
import type { ConstructionPricing } from '../types/deliverables';
import { normalizeSourcingType } from '../types/deliverables';
import type { EstimationResult, MaterialPaletteEntry } from '@/shared/types';
import { getMaterial } from './materialService';
import { getMaterialPriceByName } from '@/modules/inventory/services/inventoryPriceService';
import type { BudgetTier, ProjectStrategy } from '../types/strategy';
import { BUDGET_TIER_MULTIPLIERS } from '../types/strategy';

// Default sheet size for material estimation (mm)
const DEFAULT_SHEET_SIZE = { length: 2440, width: 1220 };

/**
 * Get budget tier multiplier for pricing adjustments
 * Priority: item.strategyContext.budgetTier > strategy.budgetFramework.tier > 'standard' (1.0x)
 */
function getBudgetTierMultiplier(
  item: DesignItem,
  projectStrategy: ProjectStrategy | null
): number {
  // 1. Check item-level strategy context
  const itemTier = item.strategyContext?.budgetTier;
  if (itemTier && itemTier in BUDGET_TIER_MULTIPLIERS) {
    return BUDGET_TIER_MULTIPLIERS[itemTier];
  }

  // 2. Fall back to project-level strategy
  const projectTier = projectStrategy?.budgetFramework?.tier;
  if (projectTier && projectTier in BUDGET_TIER_MULTIPLIERS) {
    return BUDGET_TIER_MULTIPLIERS[projectTier];
  }

  // 3. Default to standard tier (1.0x - no adjustment)
  return BUDGET_TIER_MULTIPLIERS.standard;
}

/**
 * Fetch project strategy for budget tier pricing
 */
async function fetchProjectStrategy(projectId: string): Promise<ProjectStrategy | null> {
  try {
    const strategySnapshot = await getDocs(collection(db, 'projectStrategy'));
    const strategyDoc = strategySnapshot.docs.find(d => d.id === projectId);

    if (!strategyDoc) {
      return null;
    }

    const data = strategyDoc.data();
    return {
      id: strategyDoc.id,
      projectId,
      ...data,
    } as ProjectStrategy;
  } catch (err) {
    console.warn('[Estimate] Failed to fetch project strategy:', err);
    return null;
  }
}

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
    
    // Get unit cost - PRIORITY: Material palette mappings first, then inventory
    let unitCost = 0;
    const normalizedName = group.materialName.toLowerCase().trim();
    
    // 1. FIRST: Check material palette (contains mapped inventory costs)
    if (materialPalette) {
      const paletteEntry = materialPalette.find(
        entry => entry.designName === group.materialName || 
                 entry.normalizedName === normalizedName
      );
      if (paletteEntry?.unitCost && paletteEntry.unitCost > 0) {
        unitCost = paletteEntry.unitCost;
      }
      // Also try mapped inventory name if palette has it but no direct cost
      if (unitCost === 0 && paletteEntry?.inventoryName) {
        try {
          const priceResult = await getMaterialPriceByName(
            paletteEntry.inventoryName,
            group.thickness
          );
          if (priceResult.found && priceResult.price) {
            unitCost = priceResult.price.costPerUnit;
          }
        } catch {
          // Continue to fallback
        }
      }
    }
    
    // 2. SECOND: Try inventory by design material name (legacy)
    if (unitCost === 0) {
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
    
    // 4. Last resort fallback pricing in UGX (to be deprecated)
    if (unitCost === 0) {
      console.warn(`[Estimate] No price found for ${group.materialName}, using fallback`);
      const defaultPrices: Record<number, number> = { // UGX per sheet
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
 * Calculate design document cost from matrix-based pricing
 */
function calculateDesignDocumentCost(item: DesignItem): {
  totalLaborCost: number;
  totalLaborHours: number;
  logisticsCost: number;
  externalStudiesCost: number;
  adminFeeAmount: number;
  grandTotal: number;
  hasValidPricing: boolean;
} {
  const architectural = item.architectural as any;

  if (!architectural) {
    return {
      totalLaborCost: 0,
      totalLaborHours: 0,
      logisticsCost: 0,
      externalStudiesCost: 0,
      adminFeeAmount: 0,
      grandTotal: 0,
      hasValidPricing: false,
    };
  }

  // Get pricing matrix and rates
  const pricingMatrix = architectural.pricingMatrix || {};
  const logistics = architectural.logistics || [];
  const externalStudies = architectural.externalStudies || [];
  const adminFeePercent = architectural.adminFeePercent || 10;

  // Hourly rates: use saved rateConfig if available, otherwise defaults (UGX)
  const defaultRates: Record<string, number> = {
    'principal': 550000,
    'senior-engineer': 440000,
    'mid-level-architect': 330000,
    'junior-drafter': 220000,
  };

  // Read saved rate config from the item (persisted from DesignDocumentPricingTab)
  const savedRateConfig = architectural.rateConfig;
  const getRateForRole = (roleId: string): number => {
    if (savedRateConfig?.roles?.length) {
      const found = savedRateConfig.roles.find((r: any) => r.id === roleId);
      if (found?.hourlyRate !== undefined) return found.hourlyRate;
    }
    return defaultRates[roleId] || 0;
  };

  const roles = ['principal', 'senior-engineer', 'mid-level-architect', 'junior-drafter'];
  const stages = ['concept', 'schematic', 'design-development', 'construction-docs'];

  // Calculate labor cost from matrix
  let totalLaborHours = 0;
  let totalLaborCost = 0;

  for (const role of roles) {
    const rate = getRateForRole(role);
    for (const stage of stages) {
      const key = `${role}_${stage}`;
      const hours = pricingMatrix[key] || 0;
      totalLaborHours += hours;
      totalLaborCost += hours * rate;
    }
  }

  // Calculate logistics cost
  const logisticsCost = logistics.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);

  // Calculate external studies with admin fee
  const externalStudiesCost = externalStudies.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
  const adminFeeAmount = externalStudiesCost * (adminFeePercent / 100);
  const externalStudiesTotalWithFee = externalStudiesCost + adminFeeAmount;

  // Grand total
  const grandTotal = totalLaborCost + logisticsCost + externalStudiesTotalWithFee;

  return {
    totalLaborCost,
    totalLaborHours,
    logisticsCost,
    externalStudiesCost,
    adminFeeAmount,
    grandTotal,
    hasValidPricing: grandTotal > 0,
  };
}

/**
 * Fetch all design items for a project
 */
async function fetchAllDesignItems(projectId: string): Promise<Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost }>> {
  const itemsRef = collection(db, 'designProjects', projectId, 'designItems');
  const snapshot = await getDocs(itemsRef);

  const items = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      sourcingType: normalizeSourcingType(data.sourcingType),
    };
  }) as Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost; construction?: ConstructionPricing }>;

  // Sort by sortOrder ascending (items without sortOrder go last)
  items.sort((a, b) => (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity));

  return items;
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
 * @deprecated Use inline generation in calculateEstimateFromOptimization instead
 */
function _generateDesignItemLineItems(
  designItems: Array<DesignItem & { procurement?: ProcurementPricing; manufacturing?: ManufacturingCost }>
): EstimateLineItem[] {
  const lineItems: EstimateLineItem[] = [];
  
  for (const item of designItems) {
    // Get the design item's required quantity for multiplication
    const requiredQuantity = item.requiredQuantity || 1;
    
    // Handle PROCURED items
    if (item.sourcingType === 'PROCURED') {
      const procurement = item.procurement;
      
      if (!procurement || !procurement.totalLandedCost || procurement.totalLandedCost === 0) {
        continue;
      }
      
      // Multiply by requiredQuantity for correct totals
      const totalQty = (procurement.quantity || 1) * requiredQuantity;
      const unitPrice = Math.round(procurement.landedCostPerUnit || 0);
      
      const landedCostLine: EstimateLineItem = {
        id: nanoid(10),
        description: `${item.name} (Procured)`,
        category: 'procurement',
        quantity: totalQty,
        unit: 'units',
        unitPrice,
        totalPrice: Math.round(unitPrice * totalQty),
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
      
      // Multiply by requiredQuantity for correct totals
      const baseQty = manufacturing.quantity || 1;
      const totalQty = baseQty * requiredQuantity;
      const unitPrice = Math.round(manufacturing.costPerUnit || (manufacturing.totalCost / baseQty));
      
      const manufacturedLine: EstimateLineItem = {
        id: nanoid(10),
        description: `${item.name} (Manufactured)`,
        category: 'material', // Using 'material' category for manufactured items
        quantity: totalQty,
        unit: 'units',
        unitPrice,
        totalPrice: Math.round(unitPrice * totalQty),
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

  // Apply overhead + margin markup to each line item's unit price
  // These are internal adjustments - the client sees the adjusted price directly
  const overheadMultiplier = 1 + config.overheadPercent;
  const marginMultiplier = 1 + config.defaultMarginPercent;
  const totalMarkup = overheadMultiplier * marginMultiplier;

  const markedUpLineItems = lineItems.map(item => ({
    ...item,
    unitPrice: Math.round(item.unitPrice * totalMarkup),
    totalPrice: Math.round(item.totalPrice * totalMarkup),
  }));

  // Subtotal = sum of marked-up line items (OH + margin already included)
  const subtotal = markedUpLineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const taxAmount = Math.round(subtotal * config.defaultTaxRate);

  // Track base amounts internally for reference
  const baseSubtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const overheadAmount = Math.round(baseSubtotal * config.overheadPercent);
  const marginAmount = Math.round((baseSubtotal + overheadAmount) * config.defaultMarginPercent);

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: cutlist.generatedAt as any,
    lineItems: markedUpLineItems, // Unit prices include OH + margin
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
    // Ensure errorChecks is always defined (empty array if no errors)
    errorChecks: [],
    hasErrors: false,
  };

  // Save to project document - filter out undefined values
  const projectRef = doc(db, 'designProjects', projectId);
  const estimateForFirestore = Object.fromEntries(
    Object.entries(estimate).filter(([_, v]) => v !== undefined)
  );
  await updateDoc(projectRef, {
    consolidatedEstimate: {
      ...estimateForFirestore,
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
  estimation: EstimationResult,
  _materialPalette: MaterialPaletteEntry[], // Material costs already in estimation
  userId: string,
  config: EstimateConfig = DEFAULT_ESTIMATE_CONFIG,
  taxMode: 'exclusive' | 'inclusive' = 'exclusive'
): Promise<ConsolidatedEstimate> {
  // NEW ARCHITECTURE: Generate per-design-item line items
  // Each design item becomes a line item with its unit cost × requiredQuantity
  // This ensures: Design Item Costing Tab total × qty = Estimation line item

  // Fetch project strategy for budget tier pricing
  const projectStrategy = await fetchProjectStrategy(projectId);

  const allDesignItems = await fetchAllDesignItems(projectId);
  const baseLineItems: EstimateLineItem[] = [];
  const errorChecks: { itemId: string; itemName: string; issue: string }[] = [];

  // Track budget allocations for summary
  let totalAllocated = 0;
  let itemsOverBudget = 0;
  
  // Generate line items for ALL design items (manufactured + procured + design documents)
  for (const item of allDesignItems) {
    const requiredQuantity = item.requiredQuantity || 1;

    // Get budget tier multiplier for this item
    const tierMultiplier = getBudgetTierMultiplier(item, projectStrategy);

    // Track allocated budget from strategyContext
    const allocatedBudget = item.budgetTracking?.allocatedBudget || 0;
    if (allocatedBudget > 0) {
      totalAllocated += allocatedBudget;
    }

    if (item.sourcingType === 'PROCURED') {
      // PROCURED items: use procurement pricing
      const procurement = item.procurement;

      if (!procurement || !procurement.totalLandedCost || procurement.totalLandedCost === 0) {
        errorChecks.push({
          itemId: item.id,
          itemName: item.name,
          issue: 'Missing procurement pricing',
        });
        continue;
      }

      // Apply budget tier multiplier to unit cost
      const baseUnitCost = Math.round(procurement.landedCostPerUnit || 0);
      const unitCost = Math.round(baseUnitCost * tierMultiplier);
      const extendedCost = unitCost * requiredQuantity;

      // Check if over allocated budget
      if (allocatedBudget > 0 && extendedCost > allocatedBudget) {
        itemsOverBudget++;
      }

      baseLineItems.push({
        id: nanoid(10),
        description: item.name,
        category: 'procurement',
        quantity: requiredQuantity,
        unit: 'units',
        unitPrice: unitCost,
        totalPrice: extendedCost,
        linkedDesignItemId: item.id,
        ...(procurement.vendor && { notes: `Vendor: ${procurement.vendor}` }),
      });
    } else if (item.sourcingType === 'DESIGN_DOCUMENT') {
      // DESIGN_DOCUMENT items: use matrix-based pricing from architectural field
      const designDocCost = calculateDesignDocumentCost(item);

      if (!designDocCost.hasValidPricing) {
        errorChecks.push({
          itemId: item.id,
          itemName: item.name,
          issue: 'Missing design document pricing - go to Pricing tab and enter hours in the matrix',
        });
        continue;
      }

      // Apply budget tier multiplier to unit cost
      const baseUnitCost = Math.round(designDocCost.grandTotal);
      const unitCost = Math.round(baseUnitCost * tierMultiplier);
      const extendedCost = unitCost * requiredQuantity;

      // Check if over allocated budget
      if (allocatedBudget > 0 && extendedCost > allocatedBudget) {
        itemsOverBudget++;
      }

      // Build cost breakdown notes
      const breakdown: string[] = [];
      if (designDocCost.totalLaborHours > 0) {
        breakdown.push(`Labor: ${designDocCost.totalLaborHours.toFixed(1)} hrs = ${designDocCost.totalLaborCost.toLocaleString()}`);
      }
      if (designDocCost.logisticsCost > 0) {
        breakdown.push(`Logistics: ${designDocCost.logisticsCost.toLocaleString()}`);
      }
      if (designDocCost.externalStudiesCost > 0) {
        breakdown.push(`Studies: ${designDocCost.externalStudiesCost.toLocaleString()} + Admin: ${designDocCost.adminFeeAmount.toLocaleString()}`);
      }

      baseLineItems.push({
        id: nanoid(10),
        description: item.name,
        category: 'labor', // Design documents are labor-based
        quantity: requiredQuantity,
        unit: 'project',
        unitPrice: unitCost,
        totalPrice: extendedCost,
        linkedDesignItemId: item.id,
        ...(breakdown.length > 0 && { notes: breakdown.join(' | ') }),
      });
    } else if (item.sourcingType === 'CONSTRUCTION') {
      // CONSTRUCTION items: use construction pricing (unit-based + labor + materials)
      const construction = (item as any).construction as ConstructionPricing | undefined;

      if (!construction || !construction.totalCost || construction.totalCost === 0) {
        errorChecks.push({
          itemId: item.id,
          itemName: item.name,
          issue: 'Missing construction pricing - go to Pricing tab and enter costs',
        });
        continue;
      }

      // Apply budget tier multiplier to unit cost
      const baseUnitCost = Math.round(construction.totalCost);
      const unitCost = Math.round(baseUnitCost * tierMultiplier);
      const extendedCost = unitCost * requiredQuantity;

      // Check if over allocated budget
      if (allocatedBudget > 0 && extendedCost > allocatedBudget) {
        itemsOverBudget++;
      }

      // Build cost breakdown notes
      const breakdown: string[] = [];
      if (construction.quantity && construction.unitRate) {
        breakdown.push(`Units: ${construction.quantity} × ${construction.currency || ''} ${construction.unitRate.toLocaleString()}`);
      }
      if (construction.laborCost) breakdown.push(`Labor: ${construction.laborCost.toLocaleString()}`);
      if (construction.materialsCost) breakdown.push(`Materials: ${construction.materialsCost.toLocaleString()}`);
      if (construction.contractor) breakdown.push(`Contractor: ${construction.contractor}`);

      baseLineItems.push({
        id: nanoid(10),
        description: item.name,
        category: 'construction',
        quantity: requiredQuantity,
        unit: 'lot',
        unitPrice: unitCost,
        totalPrice: extendedCost,
        linkedDesignItemId: item.id,
        ...(breakdown.length > 0 && { notes: breakdown.join(' | ') }),
      });
    } else {
      // CUSTOM_FURNITURE_MILLWORK (and legacy MANUFACTURED) items: use manufacturing.costPerUnit from Costing tab
      const manufacturing = item.manufacturing;

      // Check if manufacturing data exists with valid costs
      // Note: 0 is a valid cost (e.g., for items with no material cost), so check explicitly for undefined/null
      const hasCostPerUnit = manufacturing?.costPerUnit !== undefined && manufacturing?.costPerUnit !== null;
      const hasTotalCost = manufacturing?.totalCost !== undefined && manufacturing?.totalCost !== null;

      if (!manufacturing || (!hasCostPerUnit && !hasTotalCost)) {
        errorChecks.push({
          itemId: item.id,
          itemName: item.name,
          issue: 'Missing manufacturing cost - go to Costing Summary tab and click Save Costing',
        });
        continue;
      }

      // Use costPerUnit if available, otherwise calculate from totalCost
      const mfgQty = manufacturing.quantity || 1;
      const baseUnitCost = Math.round(manufacturing.costPerUnit || (manufacturing.totalCost / mfgQty));

      // Apply budget tier multiplier to unit cost
      const unitCost = Math.round(baseUnitCost * tierMultiplier);
      const extendedCost = unitCost * requiredQuantity;

      // Check if over allocated budget
      if (allocatedBudget > 0 && extendedCost > allocatedBudget) {
        itemsOverBudget++;
      }

      // Build cost breakdown notes
      const breakdown: string[] = [];
      if (manufacturing.sheetMaterialsCost) breakdown.push(`Sheets: ${manufacturing.sheetMaterialsCost.toLocaleString()}`);
      if (manufacturing.standardPartsCost) breakdown.push(`Std Parts: ${manufacturing.standardPartsCost.toLocaleString()}`);
      if (manufacturing.specialPartsCost) breakdown.push(`Spc Parts: ${manufacturing.specialPartsCost.toLocaleString()}`);
      if (manufacturing.laborCost) breakdown.push(`Labor: ${manufacturing.laborCost.toLocaleString()}`);

      baseLineItems.push({
        id: nanoid(10),
        description: item.name,
        category: 'material', // Manufactured items
        quantity: requiredQuantity,
        unit: 'units',
        unitPrice: unitCost,
        totalPrice: extendedCost,
        linkedDesignItemId: item.id,
        ...(breakdown.length > 0 && { notes: breakdown.join(' | ') }),
      });
    }
  }
  
  // Apply overhead + margin markup to each line item's unit price
  // These are internal adjustments - the client sees the adjusted price directly
  const overheadMultiplier = 1 + config.overheadPercent;
  const marginMultiplier = 1 + config.defaultMarginPercent;
  const totalMarkup = overheadMultiplier * marginMultiplier;

  const lineItems: EstimateLineItem[] = baseLineItems.map(item => ({
    ...item,
    unitPrice: Math.round(item.unitPrice * totalMarkup),
    totalPrice: Math.round(item.totalPrice * totalMarkup),
  }));

  // Subtotal = sum of marked-up line items (OH + margin already included)
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);

  // Track base amounts internally for reference
  const baseSubtotal = baseLineItems.reduce((sum, li) => sum + li.totalPrice, 0);
  const overheadAmount = Math.round(baseSubtotal * config.overheadPercent);
  const marginAmount = Math.round((baseSubtotal + overheadAmount) * config.defaultMarginPercent);

  // Calculate tax based on mode
  let taxAmount: number;
  let total: number;

  if (taxMode === 'inclusive') {
    taxAmount = Math.round(subtotal - (subtotal / (1 + config.defaultTaxRate)));
    total = subtotal;
  } else {
    taxAmount = Math.round(subtotal * config.defaultTaxRate);
    total = subtotal + taxAmount;
  }

  // Calculate budget summary if we have allocated budgets
  const budgetSummary = totalAllocated > 0 ? {
    totalAllocated,
    totalActual: Math.round(total),
    variance: Math.round(total) - totalAllocated,
    variancePercent: Math.round(((Math.round(total) - totalAllocated) / totalAllocated) * 100),
    itemsOverBudget,
    ...(projectStrategy?.budgetFramework?.tier && { budgetTier: projectStrategy.budgetFramework.tier }),
  } : undefined;

  const estimate: ConsolidatedEstimate = {
    generatedAt: Timestamp.now() as any,
    generatedBy: userId,
    isStale: false,
    lastCutlistUpdate: estimation?.validAt as any, // Use optimization validAt
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
    // Error checking data - use empty array instead of undefined (Firestore doesn't accept undefined)
    errorChecks: errorChecks.length > 0 ? errorChecks : [],
    designItemCount: allDesignItems.length,
    lineItemCount: baseLineItems.length,
    hasErrors: errorChecks.length > 0,
    // Budget tracking summary
    ...(budgetSummary && { budgetSummary }),
  };

  // Save to project document - filter out any undefined values
  const projectRef = doc(db, 'designProjects', projectId);
  const estimateForFirestore = Object.fromEntries(
    Object.entries(estimate).filter(([_, v]) => v !== undefined)
  );
  await updateDoc(projectRef, {
    consolidatedEstimate: {
      ...estimateForFirestore,
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
  // Line items already have OH + margin baked into unitPrice/totalPrice
  // Subtotal = sum of line items (markup already included)
  const subtotal = lineItems.reduce((sum, li) => sum + li.totalPrice, 0);

  // Reverse-calculate base amounts for internal tracking
  const overheadPercent = currentEstimate.overheadPercent || 0;
  const marginPercent = currentEstimate.marginPercent || 0;
  const totalMarkup = (1 + overheadPercent) * (1 + marginPercent);
  const baseSubtotal = totalMarkup > 0 ? Math.round(subtotal / totalMarkup) : subtotal;
  const overheadAmount = Math.round(baseSubtotal * overheadPercent);
  const marginAmount = Math.round((baseSubtotal + overheadAmount) * marginPercent);

  const taxMode = currentEstimate.taxMode || 'exclusive';
  let taxAmount: number;
  let total: number;

  if (taxMode === 'inclusive') {
    taxAmount = Math.round(subtotal - (subtotal / (1 + currentEstimate.taxRate)));
    total = subtotal;
  } else {
    taxAmount = Math.round(subtotal * currentEstimate.taxRate);
    total = subtotal + taxAmount;
  }

  const estimate: ConsolidatedEstimate = {
    ...currentEstimate,
    lineItems,
    subtotal: Math.round(subtotal),
    taxAmount,
    overheadAmount,
    marginAmount,
    total: Math.round(total),
    // Ensure errorChecks is never undefined
    errorChecks: currentEstimate.errorChecks || [],
  };

  // Filter out undefined values before saving to Firestore
  const estimateForFirestore = Object.fromEntries(
    Object.entries(estimate).filter(([_, v]) => v !== undefined)
  );

  const projectRef = doc(db, 'designProjects', projectId);
  await updateDoc(projectRef, {
    consolidatedEstimate: estimateForFirestore,
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
