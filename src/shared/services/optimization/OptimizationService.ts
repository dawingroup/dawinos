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
  wasteRegions?: { x: number; y: number; width: number; height: number }[];
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

      // Sort panels by area (largest first), then by aspect ratio difficulty
      // Parts with extreme aspect ratios are harder to place, so prioritize them
      const sortedPanels = [...panelGroup].sort((a, b) => {
        const areaA = a.length * a.width;
        const areaB = b.length * b.width;

        // Primary: sort by area (largest first)
        if (Math.abs(areaB - areaA) > 10000) { // Significant area difference
          return areaB - areaA;
        }

        // Secondary: sort by aspect ratio difficulty (extreme ratios first)
        const aspectA = Math.max(a.length, a.width) / Math.min(a.length, a.width);
        const aspectB = Math.max(b.length, b.width) / Math.min(b.length, b.width);
        return aspectB - aspectA; // Higher aspect ratio = more difficult = earlier
      });

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
          wasteRegions: packResult.freeRects,  // Actual waste regions from panel saw cuts
        });

        remainingPanels = packResult.remaining;
        sheetIndex++;
      }
    }

    return this.calculateStatistics(results, stockSheets);
  }

  /**
   * Pack panels onto a single sheet using improved guillotine algorithm
   * with smart split selection and rectangle merging
   */
  private packSingleSheet(
    panels: Panel[],
    stockSheet: StockSheet,
    kerf: number
  ): { placements: PanelPlacement[]; remaining: Panel[]; usedArea: number; freeRects: { x: number; y: number; width: number; height: number }[] } {
    const placements: PanelPlacement[] = [];
    const remaining: Panel[] = [];
    let usedArea = 0;

    const sheetWidth = stockSheet.length;
    const sheetHeight = stockSheet.width;

    interface FreeRect { x: number; y: number; width: number; height: number; }
    let freeRects: FreeRect[] = [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }];

    // Track used positions to prevent duplicates
    const usedPositions = new Set<string>();

    for (const panel of panels) {
      const position = this.findBestPosition(panel, freeRects, usedPositions, sheetWidth, sheetHeight, placements);

      if (position) {
        const { rect, rotated, index } = position;
        const placedWidth = rotated ? panel.length : panel.width;
        const placedHeight = rotated ? panel.width : panel.length;

        // Create position key and mark as used
        const posKey = `${rect.x},${rect.y}`;
        usedPositions.add(posKey);

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

        // Remove used rectangle and add new ones using smart split
        freeRects.splice(index, 1);
        const newRects = this.guillotineSplitSmart(rect, placedWidth, placedHeight, kerf);
        freeRects.push(...newRects);

        // Merge adjacent rectangles to recover usable space
        freeRects = this.mergeAdjacentRects(freeRects, kerf);

        // Sort by a combination of factors to prefer better positions
        freeRects.sort((a, b) => {
          // Prefer corner positions (lower x + y sum)
          const cornerScoreA = a.x + a.y;
          const cornerScoreB = b.x + b.y;
          if (cornerScoreA !== cornerScoreB) {
            return cornerScoreA - cornerScoreB;
          }
          // Then by area (smaller first for tight packing)
          return (a.width * a.height) - (b.width * b.height);
        });
      } else {
        remaining.push(panel);
      }
    }

    // Return remaining free rectangles as waste regions for panel saw cutting
    return { placements, remaining, usedArea, freeRects };
  }

  /**
   * Find best position for a panel using improved scoring
   * Considers: fit quality, contact perimeter, corner preference
   */
  private findBestPosition(
    panel: Panel,
    freeRects: { x: number; y: number; width: number; height: number }[],
    usedPositions?: Set<string>,
    sheetWidth?: number,
    sheetHeight?: number,
    existingPlacements?: PanelPlacement[]
  ): { rect: typeof freeRects[0]; rotated: boolean; index: number } | null {
    let bestScore = -Infinity;
    let bestRect: typeof freeRects[0] | null = null;
    let bestRotated = false;
    let bestIndex = -1;

    const sWidth = sheetWidth || 2440;
    const sHeight = sheetHeight || 1220;

    for (let i = 0; i < freeRects.length; i++) {
      const rect = freeRects[i];

      // Skip positions already used (defensive check)
      const posKey = `${rect.x},${rect.y}`;
      if (usedPositions?.has(posKey)) {
        continue;
      }

      // Try without rotation
      if (panel.width <= rect.width && panel.length <= rect.height) {
        const score = this.calculatePlacementScore(
          rect, panel.width, panel.length, sWidth, sHeight, existingPlacements
        );
        if (score > bestScore) {
          bestScore = score;
          bestRect = rect;
          bestRotated = false;
          bestIndex = i;
        }
      }

      // Try with rotation (if grain allows)
      if (panel.grain !== 1 && panel.length <= rect.width && panel.width <= rect.height) {
        const score = this.calculatePlacementScore(
          rect, panel.length, panel.width, sWidth, sHeight, existingPlacements
        );
        if (score > bestScore) {
          bestScore = score;
          bestRect = rect;
          bestRotated = true;
          bestIndex = i;
        }
      }
    }

    return bestRect ? { rect: bestRect, rotated: bestRotated, index: bestIndex } : null;
  }

  /**
   * Calculate placement score - higher is better
   * Factors: tight fit, contact perimeter, corner/edge preference
   */
  private calculatePlacementScore(
    rect: { x: number; y: number; width: number; height: number },
    panelWidth: number,
    panelHeight: number,
    sheetWidth: number,
    sheetHeight: number,
    existingPlacements?: PanelPlacement[]
  ): number {
    let score = 0;

    // 1. Tight fit score - minimize wasted space in this rectangle (weight: 100)
    const leftoverWidth = rect.width - panelWidth;
    const leftoverHeight = rect.height - panelHeight;
    const fitScore = 100 - (leftoverWidth + leftoverHeight) / 10;
    score += fitScore;

    // 2. Contact perimeter score - reward touching edges and other panels (weight: 50)
    let contactLength = 0;

    // Contact with sheet edges
    if (rect.x === 0) contactLength += panelHeight; // Left edge
    if (rect.y === 0) contactLength += panelWidth;  // Bottom edge
    if (rect.x + panelWidth >= sheetWidth - 1) contactLength += panelHeight;  // Right edge
    if (rect.y + panelHeight >= sheetHeight - 1) contactLength += panelWidth; // Top edge

    // Contact with existing placements
    if (existingPlacements) {
      for (const p of existingPlacements) {
        // Check if this panel would touch the existing placement
        const panelRight = rect.x + panelWidth;
        const panelTop = rect.y + panelHeight;
        const existingRight = p.x + p.width;
        const existingTop = p.y + p.height;

        // Horizontal contact (panels side by side)
        if (Math.abs(panelRight - p.x) < 10 || Math.abs(rect.x - existingRight) < 10) {
          const overlapStart = Math.max(rect.y, p.y);
          const overlapEnd = Math.min(panelTop, existingTop);
          if (overlapEnd > overlapStart) {
            contactLength += overlapEnd - overlapStart;
          }
        }

        // Vertical contact (panels above/below)
        if (Math.abs(panelTop - p.y) < 10 || Math.abs(rect.y - existingTop) < 10) {
          const overlapStart = Math.max(rect.x, p.x);
          const overlapEnd = Math.min(panelRight, existingRight);
          if (overlapEnd > overlapStart) {
            contactLength += overlapEnd - overlapStart;
          }
        }
      }
    }

    score += contactLength / 20; // Normalize contact contribution

    // 3. Corner preference - prefer positions near origin (weight: 30)
    const distanceFromOrigin = Math.sqrt(rect.x * rect.x + rect.y * rect.y);
    const maxDistance = Math.sqrt(sheetWidth * sheetWidth + sheetHeight * sheetHeight);
    const cornerScore = 30 * (1 - distanceFromOrigin / maxDistance);
    score += cornerScore;

    // 4. Aspect ratio of remaining space - prefer leaving usable rectangles (weight: 20)
    if (leftoverWidth > 50 && leftoverHeight > 50) {
      // If both remainders are usable, that's good
      const remainingAspect = Math.max(leftoverWidth, leftoverHeight) /
                              Math.min(leftoverWidth, leftoverHeight);
      // Prefer aspect ratios closer to 1 (more usable)
      score += 20 / remainingAspect;
    } else if (leftoverWidth > 50 || leftoverHeight > 50) {
      // One usable strip is okay
      score += 10;
    }
    // If both are < 50, no bonus (tight fit is already rewarded)

    return score;
  }

  /**
   * Smart guillotine split - chooses best split direction
   * to maximize usable remaining space
   */
  private guillotineSplitSmart(
    rect: { x: number; y: number; width: number; height: number },
    panelWidth: number,
    panelHeight: number,
    kerf: number
  ): { x: number; y: number; width: number; height: number }[] {
    const newRects: { x: number; y: number; width: number; height: number }[] = [];
    const minUsable = 50; // Minimum usable dimension

    const rightWidth = rect.width - panelWidth - kerf;
    const topHeight = rect.height - panelHeight - kerf;

    // If one remainder is too small, use the other split direction
    if (rightWidth <= minUsable && topHeight <= minUsable) {
      // Both remainders too small - no new rectangles
      return newRects;
    }

    if (rightWidth <= minUsable) {
      // Only top remainder is usable - horizontal split
      if (topHeight > minUsable) {
        newRects.push({
          x: rect.x,
          y: rect.y + panelHeight + kerf,
          width: rect.width,
          height: topHeight,
        });
      }
      return newRects;
    }

    if (topHeight <= minUsable) {
      // Only right remainder is usable - vertical split
      if (rightWidth > minUsable) {
        newRects.push({
          x: rect.x + panelWidth + kerf,
          y: rect.y,
          width: rightWidth,
          height: rect.height,
        });
      }
      return newRects;
    }

    // Both remainders are usable - choose the split that creates better rectangles
    // Option 1: Horizontal split (top strip spans full width)
    const horizontalScore = this.scoreSplitQuality(
      { width: rightWidth, height: panelHeight },      // Right rectangle
      { width: rect.width, height: topHeight }         // Top rectangle
    );

    // Option 2: Vertical split (right strip spans full height)
    const verticalScore = this.scoreSplitQuality(
      { width: rightWidth, height: rect.height },      // Right rectangle
      { width: panelWidth, height: topHeight }         // Top rectangle
    );

    if (horizontalScore >= verticalScore) {
      // Horizontal split: top spans full width, right is panel height only
      newRects.push({
        x: rect.x + panelWidth + kerf,
        y: rect.y,
        width: rightWidth,
        height: panelHeight,
      });
      newRects.push({
        x: rect.x,
        y: rect.y + panelHeight + kerf,
        width: rect.width,
        height: topHeight,
      });
    } else {
      // Vertical split: right spans full height, top is panel width only
      newRects.push({
        x: rect.x + panelWidth + kerf,
        y: rect.y,
        width: rightWidth,
        height: rect.height,
      });
      newRects.push({
        x: rect.x,
        y: rect.y + panelHeight + kerf,
        width: panelWidth,
        height: topHeight,
      });
    }

    return newRects;
  }

  /**
   * Score the quality of a split based on resulting rectangle usability
   * Higher score = better split
   */
  private scoreSplitQuality(
    rect1: { width: number; height: number },
    rect2: { width: number; height: number }
  ): number {
    let score = 0;

    // Prefer rectangles with better aspect ratios (closer to 1:1 or standard sheet ratios)
    const scoreRect = (r: { width: number; height: number }) => {
      const area = r.width * r.height;
      const aspect = Math.max(r.width, r.height) / Math.min(r.width, r.height);

      // Penalize extreme aspect ratios (thin strips are less usable)
      let aspectScore = 100;
      if (aspect > 4) aspectScore = 50;
      if (aspect > 6) aspectScore = 25;
      if (aspect > 10) aspectScore = 10;

      // Bonus for larger areas
      const areaScore = Math.sqrt(area) / 10;

      // Bonus for dimensions that could fit standard parts (multiples of 100mm)
      const dimScore = (r.width >= 200 ? 10 : 0) + (r.height >= 200 ? 10 : 0);

      return aspectScore + areaScore + dimScore;
    };

    score += scoreRect(rect1);
    score += scoreRect(rect2);

    return score;
  }

  /**
   * Merge adjacent free rectangles to recover usable space
   * This helps reduce fragmentation from the guillotine cuts
   */
  private mergeAdjacentRects(
    rects: { x: number; y: number; width: number; height: number }[],
    kerf: number
  ): { x: number; y: number; width: number; height: number }[] {
    if (rects.length < 2) return rects;

    let merged = true;
    let result = [...rects];

    // Keep trying to merge until no more merges are possible
    while (merged) {
      merged = false;

      for (let i = 0; i < result.length && !merged; i++) {
        for (let j = i + 1; j < result.length && !merged; j++) {
          const a = result[i];
          const b = result[j];

          // Check if rectangles can be merged horizontally (same y and height)
          if (Math.abs(a.y - b.y) < 1 && Math.abs(a.height - b.height) < 1) {
            // Check if they're adjacent (touching or separated by kerf)
            if (Math.abs((a.x + a.width + kerf) - b.x) < 2) {
              // Merge: a is left, b is right
              result[i] = {
                x: a.x,
                y: a.y,
                width: a.width + kerf + b.width,
                height: a.height,
              };
              result.splice(j, 1);
              merged = true;
            } else if (Math.abs((b.x + b.width + kerf) - a.x) < 2) {
              // Merge: b is left, a is right
              result[i] = {
                x: b.x,
                y: b.y,
                width: b.width + kerf + a.width,
                height: a.height,
              };
              result.splice(j, 1);
              merged = true;
            }
          }

          // Check if rectangles can be merged vertically (same x and width)
          if (!merged && Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1) {
            // Check if they're adjacent (touching or separated by kerf)
            if (Math.abs((a.y + a.height + kerf) - b.y) < 2) {
              // Merge: a is bottom, b is top
              result[i] = {
                x: a.x,
                y: a.y,
                width: a.width,
                height: a.height + kerf + b.height,
              };
              result.splice(j, 1);
              merged = true;
            } else if (Math.abs((b.y + b.height + kerf) - a.y) < 2) {
              // Merge: b is bottom, a is top
              result[i] = {
                x: b.x,
                y: b.y,
                width: a.width,
                height: b.height + kerf + a.height,
              };
              result.splice(j, 1);
              merged = true;
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Legacy guillotine split (kept for reference/fallback)
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
      // Expand by quantity - create unique ID for each copy
      const qty = panel.quantity || 1;
      for (let i = 0; i < qty; i++) {
        const uniqueId = qty > 1 ? `${panel.id}-${i + 1}` : panel.id;
        const uniqueLabel = qty > 1 ? `${panel.label} (${i + 1}/${qty})` : panel.label;
        groups[key].push({ 
          ...panel, 
          id: uniqueId,
          label: uniqueLabel,
          quantity: 1 
        });
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
