/**
 * Timber Optimization Service
 *
 * Implements 1D cutting stock optimization for dimensional lumber with varying cross-sections.
 * Uses First Fit Decreasing (FFD) algorithm for linear cutting optimization.
 */

import type {
  TimberStockDefinition,
  LinearCuttingResult,
  LinearCutPlacement,
  LinearWasteSegment,
  TimberSummary,
} from '../../types/project';

interface TimberPart {
  partId: string;
  partName: string;
  designItemId: string;
  designItemName: string;
  length: number;           // Required length in mm
  width: number;            // Required width in mm
  thickness: number;        // Required thickness in mm
  quantity: number;
  materialName: string;
}

interface CrossSectionGroup {
  thickness: number;
  width: number;
  parts: TimberPart[];
  matchedStock: TimberStockDefinition | null;
  rippedFromStock: TimberStockDefinition | null;  // If need to rip from wider stock
}

/**
 * Timber Optimization Service
 */
export class TimberOptimizationService {
  private kerf: number;                    // Saw kerf in mm (default 4mm)
  private minimumUsableOffcut: number;     // Minimum reusable length (default 300mm)

  constructor(
    kerf: number = 4,
    minimumUsableOffcut: number = 300
  ) {
    this.kerf = kerf;
    this.minimumUsableOffcut = minimumUsableOffcut;
  }

  /**
   * Run estimation for timber materials (fast, area-based)
   */
  public async estimateTimber(
    parts: TimberPart[],
    timberStock: TimberStockDefinition[]
  ): Promise<TimberSummary[]> {
    // Group parts by cross-section
    const groups = this.groupByCrossSection(parts);

    // Match each group to available stock
    const matchedGroups = this.matchStockToCrossSections(groups, timberStock);

    // Estimate requirements (assume 70% utilization)
    const summaries: TimberSummary[] = [];

    for (const group of matchedGroups) {
      if (!group.matchedStock && !group.rippedFromStock) {
        // No matching stock - skip or flag as error
        console.warn(`No matching stock for ${group.thickness}×${group.width}mm`);
        continue;
      }

      const stock = group.matchedStock || group.rippedFromStock!;
      const totalLinearLength = group.parts.reduce(
        (sum, part) => sum + (part.length + this.kerf) * part.quantity,
        0
      );

      // Use preferred stock length (usually the longest available)
      const preferredStockLength = Math.max(...stock.availableLengths);

      // Estimate with 70% utilization
      const sticksRequired = Math.ceil(totalLinearLength / (preferredStockLength * 0.7));
      const totalLinearMeters = (sticksRequired * preferredStockLength) / 1000;

      // Calculate cost
      let estimatedCost = 0;
      if (stock.costPerLinearMeter) {
        estimatedCost = totalLinearMeters * stock.costPerLinearMeter;
      } else if (stock.costPerPiece && stock.costPerPiece.length > 0) {
        const matchingCost = stock.costPerPiece.find(c => c.length === preferredStockLength);
        estimatedCost = sticksRequired * (matchingCost?.cost || 0);
      }

      // Add 15% buffer to cost (like sheet materials)
      estimatedCost *= 1.15;

      const totalParts = group.parts.reduce((sum, part) => sum + part.quantity, 0);

      summaries.push({
        materialId: stock.materialId,
        materialName: stock.materialName,
        crossSection: {
          thickness: group.thickness,
          width: group.width,
        },
        stockLength: preferredStockLength,
        sticksRequired,
        totalLinearMeters,
        partsOnSticks: totalParts,
        averageUtilizationPercent: 70,  // Estimation assumes 70%
        totalWasteLength: (sticksRequired * preferredStockLength) - totalLinearLength,
        estimatedCost,
      });
    }

    return summaries;
  }

  /**
   * Run production optimization for timber materials (full FFD algorithm)
   */
  public async optimizeTimber(
    parts: TimberPart[],
    timberStock: TimberStockDefinition[],
    targetYield: number = 85
  ): Promise<LinearCuttingResult[]> {
    // Group parts by cross-section
    const groups = this.groupByCrossSection(parts);

    // Match each group to available stock
    const matchedGroups = this.matchStockToCrossSections(groups, timberStock);

    const allResults: LinearCuttingResult[] = [];

    for (const group of matchedGroups) {
      if (!group.matchedStock && !group.rippedFromStock) {
        console.warn(`No matching stock for ${group.thickness}×${group.width}mm`);
        continue;
      }

      const stock = group.matchedStock || group.rippedFromStock!;

      // Run FFD algorithm for this cross-section group
      const results = this.runFFDOptimization(group.parts, stock);
      allResults.push(...results);
    }

    return allResults;
  }

  /**
   * Group parts by cross-section (thickness × width)
   */
  private groupByCrossSection(parts: TimberPart[]): CrossSectionGroup[] {
    const groupMap = new Map<string, CrossSectionGroup>();

    for (const part of parts) {
      const key = `${part.thickness}×${part.width}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          thickness: part.thickness,
          width: part.width,
          parts: [],
          matchedStock: null,
          rippedFromStock: null,
        });
      }

      groupMap.get(key)!.parts.push(part);
    }

    return Array.from(groupMap.values());
  }

  /**
   * Match cross-section groups to available timber stock
   */
  private matchStockToCrossSections(
    groups: CrossSectionGroup[],
    timberStock: TimberStockDefinition[]
  ): CrossSectionGroup[] {
    for (const group of groups) {
      // Try exact match first
      const exactMatch = timberStock.find(
        stock => stock.thickness === group.thickness && stock.width === group.width
      );

      if (exactMatch) {
        group.matchedStock = exactMatch;
        continue;
      }

      // Try to find wider stock that can be ripped
      const rippableStock = timberStock
        .filter(
          stock =>
            stock.thickness === group.thickness &&
            stock.width > group.width &&
            stock.canBeRipped
        )
        .sort((a, b) => a.width - b.width); // Sort by width (prefer smallest that fits)

      if (rippableStock.length > 0) {
        group.rippedFromStock = rippableStock[0];
      }
    }

    return groups;
  }

  /**
   * Run First Fit Decreasing (FFD) algorithm for linear cutting
   */
  private runFFDOptimization(
    parts: TimberPart[],
    stock: TimberStockDefinition
  ): LinearCuttingResult[] {
    // Expand parts by quantity (each quantity becomes individual part)
    const expandedParts: TimberPart[] = [];
    for (const part of parts) {
      for (let i = 0; i < part.quantity; i++) {
        expandedParts.push({ ...part, quantity: 1 });
      }
    }

    // Sort parts by length (descending) - FFD requires this
    const sortedParts = expandedParts.sort((a, b) => b.length - a.length);

    // Available stock lengths (sorted from shortest to longest for efficiency)
    const stockLengths = [...stock.availableLengths].sort((a, b) => a - b);

    // Open sticks (tracks remaining space on each stick)
    const openSticks: {
      stockLength: number;
      remainingLength: number;
      cuts: LinearCutPlacement[];
      wasteSegments: LinearWasteSegment[];
    }[] = [];

    let stockIndex = 0;

    // FFD algorithm: For each part, try to fit in existing open sticks
    for (const part of sortedParts) {
      const requiredLength = part.length + this.kerf; // Include kerf
      let placed = false;

      // Try to fit in existing open sticks (First Fit)
      for (const stick of openSticks) {
        if (stick.remainingLength >= requiredLength) {
          // Place part on this stick
          const startPosition = stick.stockLength - stick.remainingLength;

          stick.cuts.push({
            partId: part.partId,
            partName: part.partName,
            designItemId: part.designItemId,
            designItemName: part.designItemName,
            startPosition,
            cutLength: part.length,
            quantity: 1,
          });

          stick.remainingLength -= requiredLength;
          placed = true;
          break;
        }
      }

      // If not placed, open new stick (use shortest stock length that fits)
      if (!placed) {
        const suitableStockLength = stockLengths.find(len => len >= requiredLength);

        if (!suitableStockLength) {
          console.error(`Part ${part.partId} (${part.length}mm) too long for available stock`);
          continue;
        }

        const startPosition = 0;

        openSticks.push({
          stockLength: suitableStockLength,
          remainingLength: suitableStockLength - requiredLength,
          cuts: [{
            partId: part.partId,
            partName: part.partName,
            designItemId: part.designItemId,
            designItemName: part.designItemName,
            startPosition,
            cutLength: part.length,
            quantity: 1,
          }],
          wasteSegments: [],
        });

        stockIndex++;
      }
    }

    // Convert open sticks to results
    const results: LinearCuttingResult[] = openSticks.map((stick, index) => {
      const usedLength = stick.stockLength - stick.remainingLength;
      const utilizationPercent = (usedLength / stick.stockLength) * 100;

      // Calculate waste segments
      const wasteSegments: LinearWasteSegment[] = [];
      if (stick.remainingLength > 0) {
        const wasteStart = stick.stockLength - stick.remainingLength;
        wasteSegments.push({
          startPosition: wasteStart,
          length: stick.remainingLength,
          reusable: stick.remainingLength >= this.minimumUsableOffcut,
        });
      }

      return {
        id: `timber-${stock.materialId}-${index}`,
        stockIndex: index,
        stockId: stock.id,
        materialId: stock.materialId,
        materialName: stock.materialName,
        crossSection: {
          thickness: stock.thickness,
          width: stock.width,
        },
        stockLength: stick.stockLength,
        cuts: stick.cuts,
        utilizationPercent,
        wasteLength: stick.remainingLength,
        wasteSegments,
      };
    });

    return results;
  }
}

export default TimberOptimizationService;
