/**
 * Optimization Service
 * Shared cutting optimization service with PRODUCTION and ESTIMATION modes
 */

import type { EstimationMode } from '@/shared/types';

// ============================================
// Types
// ============================================

export interface Panel {
  id?: string;
  label: string;
  cabinet?: string;
  material: string;
  thickness: number;
  length: number;
  width: number;
  quantity: number;
  grain: number; // 0 = no grain, 1 = grain direction matters
}

export interface StockSheet {
  material: string;
  length: number;
  width: number;
  thickness: number;
  cost?: number;
}

export interface OptimizationOptions {
  mode: EstimationMode;
  bladeKerf?: number;
  stockSheets?: Record<string, StockSheet>;
}

export interface SheetLayout {
  id: string;
  sheetNumber: number;
  material: string;
  thickness: number;
  stockSheet: StockSheet;
  width: number;
  height: number;
  placements: PanelPlacement[];
  usedArea: number;
  wastedArea: number;
  utilization: number;
}

export interface PanelPlacement {
  panel: Panel;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  label: string;
}

export interface OptimizationResult {
  sheets: SheetLayout[];
  totalSheets: number;
  totalPanels: number;
  totalUsedArea: number;
  totalWastedArea: number;
  averageUtilization: number;
  sheetsByMaterial: Record<string, number>;
  estimatedMaterialCost?: number;
}

// ============================================
// Default Stock Sheets (Standard Sizes)
// ============================================

const DEFAULT_STOCK_SHEETS: Record<string, StockSheet> = {
  'MDF': { material: 'MDF', length: 2440, width: 1220, thickness: 18, cost: 85000 },
  'Plywood': { material: 'Plywood', length: 2440, width: 1220, thickness: 18, cost: 180000 },
  'Chipboard': { material: 'Chipboard', length: 2440, width: 1220, thickness: 18, cost: 65000 },
  'Melamine': { material: 'Melamine', length: 2440, width: 1220, thickness: 18, cost: 95000 },
  'default': { material: 'Default', length: 2440, width: 1220, thickness: 18, cost: 85000 },
};

// ============================================
// Optimization Service Class
// ============================================

export class OptimizationService {
  private stockSheets: Record<string, StockSheet>;
  private bladeKerf: number;

  constructor(options?: { stockSheets?: Record<string, StockSheet>; bladeKerf?: number }) {
    this.stockSheets = options?.stockSheets || DEFAULT_STOCK_SHEETS;
    this.bladeKerf = options?.bladeKerf || 4;
  }

  /**
   * Main optimization method
   * @param panels - Panels to optimize
   * @param options - Optimization options including mode
   */
  optimize(panels: Panel[], options: OptimizationOptions): OptimizationResult {
    if (!panels || panels.length === 0) {
      return this.emptyResult();
    }

    const stockSheets = options.stockSheets || this.stockSheets;
    const kerf = options.bladeKerf ?? this.bladeKerf;

    if (options.mode === 'ESTIMATION') {
      // Fast estimation mode - simplified calculation
      return this.estimationOptimize(panels, stockSheets);
    } else {
      // Full production mode - complete guillotine packing
      return this.productionOptimize(panels, stockSheets, kerf);
    }
  }

  /**
   * ESTIMATION mode - Fast, rough calculation
   * Uses simple area-based estimation without full packing
   */
  private estimationOptimize(
    panels: Panel[],
    stockSheets: Record<string, StockSheet>
  ): OptimizationResult {
    const grouped = this.groupByMaterialAndThickness(panels);
    let totalSheets = 0;
    let totalPanels = 0;
    let totalUsedArea = 0;
    let estimatedCost = 0;
    const sheetsByMaterial: Record<string, number> = {};

    for (const [key, panelGroup] of Object.entries(grouped)) {
      const [material] = key.split('|');
      const stock = this.findMatchingStock(stockSheets, material);
      
      if (!stock) continue;

      const stockArea = stock.length * stock.width;
      
      // Calculate total panel area for this group
      let groupArea = 0;
      for (const panel of panelGroup) {
        groupArea += panel.length * panel.width;
        totalPanels++;
      }

      // Estimate sheets needed (assume 70% utilization for estimation)
      const estimatedUtilization = 0.70;
      const sheetsNeeded = Math.ceil(groupArea / (stockArea * estimatedUtilization));
      
      totalSheets += sheetsNeeded;
      totalUsedArea += groupArea;
      
      if (!sheetsByMaterial[material]) {
        sheetsByMaterial[material] = 0;
      }
      sheetsByMaterial[material] += sheetsNeeded;

      // Calculate cost
      if (stock.cost) {
        estimatedCost += sheetsNeeded * stock.cost;
      }
    }

    const totalArea = totalSheets * (DEFAULT_STOCK_SHEETS.default.length * DEFAULT_STOCK_SHEETS.default.width);
    const totalWastedArea = totalArea - totalUsedArea;

    return {
      sheets: [], // No detailed sheets in estimation mode
      totalSheets,
      totalPanels,
      totalUsedArea,
      totalWastedArea,
      averageUtilization: totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0,
      sheetsByMaterial,
      estimatedMaterialCost: estimatedCost,
    };
  }

  /**
   * PRODUCTION mode - Full guillotine bin-packing
   */
  private productionOptimize(
    panels: Panel[],
    stockSheets: Record<string, StockSheet>,
    kerf: number
  ): OptimizationResult {
    const grouped = this.groupByMaterialAndThickness(panels);
    const results: SheetLayout[] = [];

    for (const [key, panelGroup] of Object.entries(grouped)) {
      const [material, thickness] = key.split('|');
      const stock = this.findMatchingStock(stockSheets, material);
      
      if (!stock) {
        console.warn(`No stock sheet found for material: ${material}`);
        continue;
      }

      // Sort panels by area (largest first)
      const sortedPanels = [...panelGroup].sort((a, b) => 
        (b.length * b.width) - (a.length * a.width)
      );

      let remainingPanels = sortedPanels;
      let sheetIndex = 0;

      while (remainingPanels.length > 0 && sheetIndex < 100) {
        const packResult = this.packSingleSheet(remainingPanels, stock, kerf);
        
        if (packResult.placements.length === 0) {
          console.warn('Some panels are too large for the stock sheet');
          break;
        }

        const sheetWidth = stock.length;
        const sheetHeight = stock.width;
        const totalArea = sheetWidth * sheetHeight;

        results.push({
          id: `sheet-${results.length + 1}`,
          sheetNumber: results.length + 1,
          material,
          thickness: parseFloat(thickness),
          stockSheet: stock,
          width: sheetWidth,
          height: sheetHeight,
          placements: packResult.placements,
          usedArea: packResult.usedArea,
          wastedArea: totalArea - packResult.usedArea,
          utilization: (packResult.usedArea / totalArea) * 100,
        });

        remainingPanels = packResult.remaining;
        sheetIndex++;
      }
    }

    return this.calculateStatistics(results, stockSheets);
  }

  /**
   * Pack panels onto a single sheet using guillotine algorithm
   */
  private packSingleSheet(
    panels: Panel[],
    stockSheet: StockSheet,
    kerf: number
  ): { placements: PanelPlacement[]; remaining: Panel[]; usedArea: number } {
    const placements: PanelPlacement[] = [];
    const remaining: Panel[] = [];
    let usedArea = 0;

    const sheetWidth = stockSheet.length;
    const sheetHeight = stockSheet.width;

    interface FreeRect { x: number; y: number; width: number; height: number; }
    let freeRects: FreeRect[] = [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }];

    for (const panel of panels) {
      const position = this.findBestPosition(panel, freeRects);

      if (position) {
        const { rect, rotated, index } = position;
        const placedWidth = rotated ? panel.length : panel.width;
        const placedHeight = rotated ? panel.width : panel.length;

        placements.push({
          panel,
          x: rect.x,
          y: rect.y,
          width: placedWidth,
          height: placedHeight,
          rotated,
          label: panel.label || `Panel ${placements.length + 1}`,
        });

        usedArea += placedWidth * placedHeight;

        // Remove used rectangle and add new ones
        freeRects.splice(index, 1);
        const newRects = this.guillotineSplit(rect, placedWidth, placedHeight, kerf);
        freeRects.push(...newRects);
        freeRects.sort((a, b) => (a.width * a.height) - (b.width * b.height));
      } else {
        remaining.push(panel);
      }
    }

    return { placements, remaining, usedArea };
  }

  /**
   * Find best position for a panel (Best Short Side Fit)
   */
  private findBestPosition(
    panel: Panel,
    freeRects: { x: number; y: number; width: number; height: number }[]
  ): { rect: typeof freeRects[0]; rotated: boolean; index: number } | null {
    let bestScore = Infinity;
    let bestRect: typeof freeRects[0] | null = null;
    let bestRotated = false;
    let bestIndex = -1;

    for (let i = 0; i < freeRects.length; i++) {
      const rect = freeRects[i];

      // Try without rotation
      if (panel.width <= rect.width && panel.length <= rect.height) {
        const leftover = Math.min(rect.width - panel.width, rect.height - panel.length);
        if (leftover < bestScore) {
          bestScore = leftover;
          bestRect = rect;
          bestRotated = false;
          bestIndex = i;
        }
      }

      // Try with rotation (if grain allows)
      if (panel.grain !== 1 && panel.length <= rect.width && panel.width <= rect.height) {
        const leftover = Math.min(rect.width - panel.length, rect.height - panel.width);
        if (leftover < bestScore) {
          bestScore = leftover;
          bestRect = rect;
          bestRotated = true;
          bestIndex = i;
        }
      }
    }

    return bestRect ? { rect: bestRect, rotated: bestRotated, index: bestIndex } : null;
  }

  /**
   * Guillotine split after placing a panel
   */
  private guillotineSplit(
    rect: { x: number; y: number; width: number; height: number },
    panelWidth: number,
    panelHeight: number,
    kerf: number
  ): { x: number; y: number; width: number; height: number }[] {
    const newRects: { x: number; y: number; width: number; height: number }[] = [];

    const rightWidth = rect.width - panelWidth - kerf;
    if (rightWidth > 50) {
      newRects.push({
        x: rect.x + panelWidth + kerf,
        y: rect.y,
        width: rightWidth,
        height: panelHeight,
      });
    }

    const topHeight = rect.height - panelHeight - kerf;
    if (topHeight > 50) {
      newRects.push({
        x: rect.x,
        y: rect.y + panelHeight + kerf,
        width: rect.width,
        height: topHeight,
      });
    }

    return newRects;
  }

  /**
   * Group panels by material and thickness
   */
  private groupByMaterialAndThickness(panels: Panel[]): Record<string, Panel[]> {
    const groups: Record<string, Panel[]> = {};

    for (const panel of panels) {
      const key = `${panel.material || 'Unknown'}|${panel.thickness || 18}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      // Expand by quantity
      for (let i = 0; i < (panel.quantity || 1); i++) {
        groups[key].push({ ...panel, quantity: 1 });
      }
    }

    return groups;
  }

  /**
   * Find matching stock sheet for material
   */
  private findMatchingStock(
    stockSheets: Record<string, StockSheet>,
    material: string
  ): StockSheet | null {
    if (stockSheets[material]) {
      return stockSheets[material];
    }

    const materialLower = material.toLowerCase();
    for (const [key, value] of Object.entries(stockSheets)) {
      if (materialLower.includes(key.toLowerCase()) || key.toLowerCase().includes(materialLower)) {
        return value;
      }
    }

    return stockSheets.default || null;
  }

  /**
   * Calculate statistics from sheet layouts
   */
  private calculateStatistics(
    sheets: SheetLayout[],
    stockSheets: Record<string, StockSheet>
  ): OptimizationResult {
    if (sheets.length === 0) {
      return this.emptyResult();
    }

    let totalUsedArea = 0;
    let totalWastedArea = 0;
    let totalPanels = 0;
    let estimatedCost = 0;
    const sheetsByMaterial: Record<string, number> = {};

    for (const sheet of sheets) {
      totalUsedArea += sheet.usedArea;
      totalWastedArea += sheet.wastedArea;
      totalPanels += sheet.placements.length;

      if (!sheetsByMaterial[sheet.material]) {
        sheetsByMaterial[sheet.material] = 0;
      }
      sheetsByMaterial[sheet.material]++;

      // Calculate cost
      const stock = this.findMatchingStock(stockSheets, sheet.material);
      if (stock?.cost) {
        estimatedCost += stock.cost;
      }
    }

    const totalArea = totalUsedArea + totalWastedArea;

    return {
      sheets,
      totalSheets: sheets.length,
      totalPanels,
      totalUsedArea,
      totalWastedArea,
      averageUtilization: totalArea > 0 ? (totalUsedArea / totalArea) * 100 : 0,
      sheetsByMaterial,
      estimatedMaterialCost: estimatedCost,
    };
  }

  /**
   * Empty result helper
   */
  private emptyResult(): OptimizationResult {
    return {
      sheets: [],
      totalSheets: 0,
      totalPanels: 0,
      totalUsedArea: 0,
      totalWastedArea: 0,
      averageUtilization: 0,
      sheetsByMaterial: {},
      estimatedMaterialCost: 0,
    };
  }
}

// ============================================
// Singleton Instance
// ============================================

export const optimizationService = new OptimizationService();
