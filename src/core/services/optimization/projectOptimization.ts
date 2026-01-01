/**
 * Project-Level Optimization Actions
 * Runs optimization on project data and saves results to optimizationState
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  serverTimestamp,
  deleteField,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type { 
  Project, 
  EstimationResult, 
  ProductionResult,
  SheetSummary,
  NestingSheet,
  CutOperation,
  OptimizationConfig,
  PartPlacement,
  WasteRegion,
  Timestamp,
} from '@/shared/types';
import type { PartEntry } from '@/modules/design-manager/types';
import { optimizationService, type Panel, type OptimizationResult } from './OptimizationService';
import { updateOptimizationRAG } from '../ragService';

// Collection names
const PROJECTS_COLLECTION = 'designProjects';
const DESIGN_ITEMS_SUBCOLLECTION = 'designItems';

// ============================================
// Types
// ============================================

export interface CutlistPart {
  id: string;
  partNumber: string;
  name: string;
  designItemId: string;
  designItemName: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  materialId: string;
  materialName: string;
  grainDirection: 'length' | 'width' | 'none';
  edgeBanding: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
}

export interface MaterialBreakdown {
  materialId: string;
  materialName: string;
  thickness: number;
  totalParts: number;
  totalArea: number;
  sheetsRequired: number;
  estimatedCost: number;
}

export interface Remnant {
  id: string;
  sheetId: string;
  x: number;
  y: number;
  length: number;
  width: number;
  area: number;
  reusable: boolean;
}

export interface EdgeBandItem {
  partId: string;
  partName: string;
  edge: 'top' | 'bottom' | 'left' | 'right';
  length: number;
  material: string;
}

// ============================================
// Part Aggregation
// ============================================

/**
 * Aggregate all parts from design items in a project
 */
export async function aggregatePartsFromProject(projectId: string): Promise<CutlistPart[]> {
  const parts: CutlistPart[] = [];
  
  // Get all design items for this project (subcollection under project)
  const itemsRef = collection(db, PROJECTS_COLLECTION, projectId, DESIGN_ITEMS_SUBCOLLECTION);
  const itemsSnapshot = await getDocs(itemsRef);
  
  for (const itemDoc of itemsSnapshot.docs) {
    const itemData = itemDoc.data();
    const designItemId = itemDoc.id;
    const designItemName = itemData.name || itemData.itemCode || 'Unknown';
    
    // Get parts from the design item
    const itemParts: PartEntry[] = itemData.parts || [];
    
    for (const part of itemParts) {
      parts.push({
        id: part.id,
        partNumber: part.partNumber,
        name: part.name,
        designItemId,
        designItemName,
        length: part.length,
        width: part.width,
        thickness: part.thickness,
        quantity: part.quantity,
        materialId: part.materialId || '',
        materialName: part.materialName,
        grainDirection: part.grainDirection,
        edgeBanding: part.edgeBanding,
      });
    }
  }
  
  return parts;
}

/**
 * Convert CutlistParts to optimization Panel format
 */
function partsToOptimizationPanels(parts: CutlistPart[]): Panel[] {
  return parts.map(part => ({
    id: part.id,
    label: `${part.designItemName} - ${part.name}`,
    cabinet: part.designItemName,
    material: part.materialName,
    thickness: part.thickness,
    length: part.length,
    width: part.width,
    quantity: part.quantity,
    grain: part.grainDirection === 'none' ? 0 : 1,
  }));
}

// ============================================
// Estimation Mode
// ============================================

/**
 * Run estimation and save to project.optimizationState.estimation
 * Fast mode with ~70% utilization assumption, adds 15% buffer
 */
export async function runProjectEstimation(
  projectId: string,
  userId: string
): Promise<EstimationResult> {
  // Get project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  
  // Aggregate parts from all design items
  const parts = await aggregatePartsFromProject(projectId);
  
  if (parts.length === 0) {
    throw new Error('No parts found in project design items');
  }
  
  // Convert to optimization format
  const panels = partsToOptimizationPanels(parts);
  
  // Get config or use defaults
  const config = project.optimizationState?.config;
  const stockSheets = config?.stockSheets?.reduce((acc, sheet) => {
    acc[sheet.materialName] = {
      material: sheet.materialName,
      length: sheet.length,
      width: sheet.width,
      thickness: sheet.thickness,
      cost: sheet.costPerSheet,
    };
    return acc;
  }, {} as Record<string, { material: string; length: number; width: number; thickness: number; cost: number }>) || undefined;
  
  // Run estimation optimization
  const result = optimizationService.optimize(panels, {
    mode: 'ESTIMATION',
    bladeKerf: config?.kerf || 4,
    stockSheets,
  });
  
  // Convert to EstimationResult format
  const sheetSummary = buildSheetSummary(result, parts);
  const wasteEstimate = result.totalWastedArea / (result.totalUsedArea + result.totalWastedArea) * 100;
  
  // Add 15% buffer to estimation
  const bufferedCost = (result.estimatedMaterialCost || 0) * 1.15;
  
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };
  
  const estimation: EstimationResult = {
    sheetSummary,
    roughCost: bufferedCost,
    wasteEstimate,
    totalPartsCount: result.totalPanels,
    totalSheetsCount: result.totalSheets,
    validAt: timestamp,
  };
  
  // Save to project - explicitly set fields and clear invalidation
  await updateDoc(projectRef, {
    'optimizationState.estimation.sheetSummary': estimation.sheetSummary,
    'optimizationState.estimation.roughCost': estimation.roughCost,
    'optimizationState.estimation.wasteEstimate': estimation.wasteEstimate,
    'optimizationState.estimation.totalPartsCount': estimation.totalPartsCount,
    'optimizationState.estimation.totalSheetsCount': estimation.totalSheetsCount,
    'optimizationState.estimation.validAt': estimation.validAt,
    'optimizationState.estimation.invalidatedAt': deleteField(),
    'optimizationState.estimation.invalidationReasons': deleteField(),
    'optimizationState.lastEstimationRun': timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Update RAG status
  const updatedProject = { ...project, optimizationState: { ...project.optimizationState, estimation } } as Project;
  const ragStatus = updateOptimizationRAG(updatedProject);
  
  await updateDoc(projectRef, {
    optimizationRAG: ragStatus,
  });
  
  return estimation;
}

/**
 * Build sheet summary from optimization result
 */
function buildSheetSummary(result: OptimizationResult, parts: CutlistPart[]): SheetSummary[] {
  const summaries: SheetSummary[] = [];
  
  for (const [material, sheetCount] of Object.entries(result.sheetsByMaterial)) {
    const materialParts = parts.filter(p => p.materialName === material);
    const thickness = materialParts[0]?.thickness || 18;
    
    // Estimate based on area
    const totalArea = materialParts.reduce((sum, p) => sum + (p.length * p.width * p.quantity), 0);
    const stockArea = 2440 * 1220; // Default sheet size
    const utilizationPercent = (totalArea / (sheetCount * stockArea)) * 100;
    
    summaries.push({
      materialId: material,
      materialName: material,
      thickness,
      sheetSize: { length: 2440, width: 1220 },
      sheetsRequired: sheetCount,
      partsOnSheet: Math.ceil(materialParts.reduce((sum, p) => sum + p.quantity, 0) / sheetCount),
      utilizationPercent: Math.min(utilizationPercent, 100),
      wasteArea: (sheetCount * stockArea) - totalArea,
      estimatedCost: (result.estimatedMaterialCost || 0) * (sheetCount / result.totalSheets),
    });
  }
  
  return summaries;
}

// ============================================
// Production Mode
// ============================================

/**
 * Run production optimization and save to project.optimizationState.production
 * Full nesting with guillotine algorithm, targets 85%+ yield
 */
export async function runProjectProduction(
  projectId: string,
  userId: string
): Promise<ProductionResult> {
  // Get project
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const projectSnap = await getDoc(projectRef);
  
  if (!projectSnap.exists()) {
    throw new Error('Project not found');
  }
  
  const project = { id: projectSnap.id, ...projectSnap.data() } as Project;
  
  // Check if estimation exists
  if (!project.optimizationState?.estimation) {
    throw new Error('Run estimation first before production optimization');
  }
  
  // Aggregate parts from all design items
  const parts = await aggregatePartsFromProject(projectId);
  
  if (parts.length === 0) {
    throw new Error('No parts found in project design items');
  }
  
  // Convert to optimization format
  const panels = partsToOptimizationPanels(parts);
  
  // Get config
  const config = project.optimizationState?.config;
  const stockSheets = config?.stockSheets?.reduce((acc, sheet) => {
    acc[sheet.materialName] = {
      material: sheet.materialName,
      length: sheet.length,
      width: sheet.width,
      thickness: sheet.thickness,
      cost: sheet.costPerSheet,
    };
    return acc;
  }, {} as Record<string, { material: string; length: number; width: number; thickness: number; cost: number }>) || undefined;
  
  // Run production optimization
  const result = optimizationService.optimize(panels, {
    mode: 'PRODUCTION',
    bladeKerf: config?.kerf || 4,
    stockSheets,
  });
  
  // Convert to ProductionResult format
  const nestingSheets = buildNestingSheets(result, parts);
  const cutSequence = buildCutSequence(nestingSheets);
  const optimizedYield = result.averageUtilization;
  
  const now = FirestoreTimestamp.now();
  const timestamp: Timestamp = {
    seconds: now.seconds,
    nanoseconds: now.nanoseconds,
  };
  
  const production: ProductionResult = {
    nestingSheets,
    cutSequence,
    optimizedYield,
    totalCuttingLength: calculateTotalCuttingLength(cutSequence),
    estimatedCutTime: estimateCutTime(cutSequence),
    validAt: timestamp,
  };
  
  // Save to project - explicitly set fields and clear invalidation
  await updateDoc(projectRef, {
    'optimizationState.production.nestingSheets': production.nestingSheets,
    'optimizationState.production.cutSequence': production.cutSequence,
    'optimizationState.production.optimizedYield': production.optimizedYield,
    'optimizationState.production.totalCuttingLength': production.totalCuttingLength,
    'optimizationState.production.estimatedCutTime': production.estimatedCutTime,
    'optimizationState.production.validAt': production.validAt,
    'optimizationState.production.invalidatedAt': deleteField(),
    'optimizationState.production.invalidationReasons': deleteField(),
    'optimizationState.lastProductionRun': timestamp,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  // Update RAG status
  const updatedProject = { ...project, optimizationState: { ...project.optimizationState, production } } as Project;
  const ragStatus = updateOptimizationRAG(updatedProject);
  
  await updateDoc(projectRef, {
    optimizationRAG: ragStatus,
  });
  
  return production;
}

/**
 * Build nesting sheets from optimization result
 */
function buildNestingSheets(result: OptimizationResult, parts: CutlistPart[]): NestingSheet[] {
  return result.sheets.map((sheet, index) => {
    const placements: PartPlacement[] = sheet.placements.map(p => {
      const originalPart = parts.find(part => 
        p.panel.label.includes(part.name) || p.panel.id === part.id
      );
      
      return {
        partId: p.panel.id || `part-${index}`,
        partName: p.label,
        designItemId: originalPart?.designItemId || '',
        designItemName: originalPart?.designItemName || '',
        x: p.x,
        y: p.y,
        length: p.width,
        width: p.height,
        rotated: p.rotated,
        grainAligned: !p.rotated || p.panel.grain === 0,
      };
    });
    
    // Calculate waste regions
    const wasteRegions = calculateWasteRegions(sheet, placements);
    
    return {
      id: sheet.id,
      sheetIndex: index,
      stockSheetId: sheet.stockSheet.material,
      materialId: sheet.material,
      materialName: sheet.material,
      sheetSize: { length: sheet.width, width: sheet.height },
      placements,
      utilizationPercent: sheet.utilization,
      wasteArea: sheet.wastedArea,
      wasteRegions,
    };
  });
}

/**
 * Calculate waste regions on a sheet
 */
function calculateWasteRegions(
  sheet: { width: number; height: number; wastedArea: number },
  _placements: PartPlacement[]
): WasteRegion[] {
  // Simplified waste region calculation
  // A full implementation would use computational geometry
  const regions: WasteRegion[] = [];
  
  if (sheet.wastedArea > 0) {
    // Create a single waste region for now
    regions.push({
      x: 0,
      y: 0,
      length: 100,
      width: 100,
      area: sheet.wastedArea,
      reusable: sheet.wastedArea > (300 * 300), // Reusable if > 300x300mm
    });
  }
  
  return regions;
}

/**
 * Build cut sequence from nesting sheets
 */
function buildCutSequence(sheets: NestingSheet[]): CutOperation[] {
  const operations: CutOperation[] = [];
  let sequence = 1;
  
  for (const sheet of sheets) {
    // Generate cuts for each sheet
    // Simplified: just create horizontal and vertical cuts based on placements
    const placements = [...sheet.placements].sort((a, b) => a.y - b.y || a.x - b.x);
    
    for (const placement of placements) {
      // Rip cut (vertical)
      operations.push({
        id: `cut-${sequence}`,
        sheetId: sheet.id,
        sequence: sequence++,
        type: 'rip',
        startX: placement.x + placement.length,
        startY: 0,
        endX: placement.x + placement.length,
        endY: sheet.sheetSize.width,
        length: sheet.sheetSize.width,
        resultingParts: [placement.partId],
      });
      
      // Crosscut (horizontal)
      operations.push({
        id: `cut-${sequence}`,
        sheetId: sheet.id,
        sequence: sequence++,
        type: 'crosscut',
        startX: 0,
        startY: placement.y + placement.width,
        endX: placement.x + placement.length,
        endY: placement.y + placement.width,
        length: placement.x + placement.length,
        resultingParts: [placement.partId],
      });
    }
  }
  
  return operations;
}

/**
 * Calculate total cutting length
 */
function calculateTotalCuttingLength(cuts: CutOperation[]): number {
  return cuts.reduce((sum, cut) => sum + cut.length, 0);
}

/**
 * Estimate cut time based on cut sequence
 */
function estimateCutTime(cuts: CutOperation[]): number {
  // Assume 2 seconds per 100mm of cutting
  const totalLength = calculateTotalCuttingLength(cuts);
  return Math.ceil(totalLength / 100 * 2 / 60); // minutes
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if optimization needs re-run
 */
export function needsReOptimization(
  project: Project,
  mode: 'estimation' | 'production'
): boolean {
  const state = project.optimizationState?.[mode];
  return !state || !!state.invalidatedAt;
}

/**
 * Get optimization status summary
 */
export function getOptimizationStatus(project: Project): {
  estimationStatus: 'none' | 'valid' | 'stale';
  productionStatus: 'none' | 'valid' | 'stale';
  canRunProduction: boolean;
} {
  const estimation = project.optimizationState?.estimation;
  const production = project.optimizationState?.production;
  
  return {
    estimationStatus: !estimation ? 'none' : estimation.invalidatedAt ? 'stale' : 'valid',
    productionStatus: !production ? 'none' : production.invalidatedAt ? 'stale' : 'valid',
    canRunProduction: !!estimation && !estimation.invalidatedAt,
  };
}

/**
 * Update optimization config
 */
export async function updateProjectConfig(
  projectId: string, 
  changes: Partial<OptimizationConfig>,
  userId: string
): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  // Build update object for each changed field
  const updates: Record<string, any> = {
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  
  if (changes.kerf !== undefined) {
    updates['optimizationState.config.kerf'] = changes.kerf;
  }
  if (changes.targetYield !== undefined) {
    updates['optimizationState.config.targetYield'] = changes.targetYield;
  }
  if (changes.grainMatching !== undefined) {
    updates['optimizationState.config.grainMatching'] = changes.grainMatching;
  }
  if (changes.allowRotation !== undefined) {
    updates['optimizationState.config.allowRotation'] = changes.allowRotation;
  }
  if (changes.stockSheets !== undefined) {
    updates['optimizationState.config.stockSheets'] = changes.stockSheets;
  }
  
  await updateDoc(projectRef, updates);
}

/**
 * Clear estimation and mark for re-run
 */
export async function clearEstimation(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  await updateDoc(projectRef, {
    'optimizationState.estimation': null,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Clear production and mark for re-run
 */
export async function clearProduction(projectId: string, userId: string): Promise<void> {
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  
  await updateDoc(projectRef, {
    'optimizationState.production': null,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}
