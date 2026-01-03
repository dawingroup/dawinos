/**
 * Material Calculator
 * Calculates material requirements from BOQ items using formulas
 */

import type { 
  BOQItem, 
  MaterialRequirement,
} from '../types';
import { getFormulaById, getFormulaByCode } from './formulaService';

export interface CalculationResult {
  success: boolean;
  requirements: MaterialRequirement[];
  errors?: string[];
  warnings?: string[];
}

export interface CalculationOptions {
  applyWastage?: boolean;
  wastageOverride?: number;
  roundUp?: boolean;
}

/**
 * Calculate material requirements for a single BOQ item
 */
export async function calculateMaterials(
  boqItem: BOQItem,
  options: CalculationOptions = {}
): Promise<CalculationResult> {
  const { applyWastage = true, wastageOverride, roundUp = true } = options;
  
  // Get formula
  const formula = boqItem.formulaId 
    ? await getFormulaById(boqItem.formulaId)
    : boqItem.formulaCode 
      ? await getFormulaByCode(boqItem.formulaCode)
      : null;
  
  if (!formula) {
    return {
      success: false,
      requirements: [],
      errors: ['No formula assigned to this BOQ item'],
    };
  }
  
  const requirements: MaterialRequirement[] = [];
  const warnings: string[] = [];
  
  for (const component of formula.components) {
    // Calculate base quantity
    let quantity = boqItem.quantityContract * component.quantity;
    
    // Apply wastage
    if (applyWastage) {
      const wastagePercent = wastageOverride ?? component.wastagePercent;
      quantity *= (1 + wastagePercent / 100);
    }
    
    // Round up if requested
    if (roundUp) {
      quantity = Math.ceil(quantity * 100) / 100; // Round to 2 decimals
    }
    
    // Calculate cost (placeholder - would come from material rates)
    const unitRate = 0; // TODO: Get from material rates service
    const totalCost = quantity * unitRate;
    
    requirements.push({
      materialId: component.materialId,
      materialName: component.materialName,
      quantity,
      unit: component.unit,
      unitRate,
      totalCost,
      wastageIncluded: applyWastage,
    });
  }
  
  return {
    success: true,
    requirements,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate materials for multiple BOQ items
 */
export async function calculateBatchMaterials(
  boqItems: BOQItem[],
  options: CalculationOptions = {}
): Promise<Map<string, CalculationResult>> {
  const results = new Map<string, CalculationResult>();
  
  for (const item of boqItems) {
    const result = await calculateMaterials(item, options);
    results.set(item.id, result);
  }
  
  return results;
}

/**
 * Aggregate material requirements across multiple BOQ items
 */
export function aggregateMaterials(
  calculationResults: Map<string, CalculationResult>
): MaterialRequirement[] {
  const aggregated = new Map<string, MaterialRequirement>();
  
  for (const result of calculationResults.values()) {
    if (!result.success) continue;
    
    for (const req of result.requirements) {
      const existing = aggregated.get(req.materialId);
      
      if (existing) {
        existing.quantity += req.quantity;
        existing.totalCost += req.totalCost;
      } else {
        aggregated.set(req.materialId, { ...req });
      }
    }
  }
  
  return Array.from(aggregated.values()).sort((a, b) => 
    a.materialName.localeCompare(b.materialName)
  );
}
