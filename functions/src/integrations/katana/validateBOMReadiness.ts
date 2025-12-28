/**
 * BOM Validation Service
 * Validates that a project is ready for Katana BOM export
 */

import * as admin from 'firebase-admin';

const db = admin.firestore();

// ============================================
// Types
// ============================================

export type BOMValidationIssueType = 
  | 'UNMAPPED_MATERIAL' 
  | 'OPTIMIZATION_OUTDATED' 
  | 'NO_PRODUCTION_RESULTS'
  | 'NO_MATERIAL_PALETTE'
  | 'EMPTY_NESTING';

export interface BOMValidationIssue {
  type: BOMValidationIssueType;
  materialName?: string;
  message: string;
}

export interface BOMValidationResult {
  ready: boolean;
  issues: BOMValidationIssue[];
  summary?: {
    totalMaterials: number;
    mappedMaterials: number;
    totalSheets: number;
    totalParts: number;
  };
}

// ============================================
// Validation Functions
// ============================================

/**
 * Get project from Firestore
 */
async function getProject(projectId: string): Promise<any> {
  const doc = await db.collection('designProjects').doc(projectId).get();
  if (!doc.exists) {
    throw new Error(`Project not found: ${projectId}`);
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Validate that a project is ready for BOM export to Katana
 */
export async function validateBOMReadiness(projectId: string): Promise<BOMValidationResult> {
  const project = await getProject(projectId);
  const issues: BOMValidationIssue[] = [];

  // Check if optimization state exists
  if (!project.optimizationState) {
    issues.push({
      type: 'NO_PRODUCTION_RESULTS',
      message: 'No optimization has been run for this project'
    });
    return { ready: false, issues };
  }

  // Check production results exist
  const production = project.optimizationState?.production;
  if (!production) {
    issues.push({
      type: 'NO_PRODUCTION_RESULTS',
      message: 'Production optimization has not been run'
    });
  } else {
    // Check if production is invalidated
    if (production.invalidatedAt) {
      const reasons = production.invalidationReasons?.join(', ') || 'Unknown reason';
      issues.push({
        type: 'OPTIMIZATION_OUTDATED',
        message: `Production optimization is outdated: ${reasons}`
      });
    }

    // Check if nesting has results
    if (!production.nestingSheets || production.nestingSheets.length === 0) {
      issues.push({
        type: 'EMPTY_NESTING',
        message: 'No nesting sheets generated - run production optimization first'
      });
    }
  }

  // Check material palette exists
  const palette = project.materialPalette;
  if (!palette || !palette.entries || palette.entries.length === 0) {
    issues.push({
      type: 'NO_MATERIAL_PALETTE',
      message: 'No material palette found - harvest materials from design items first'
    });
    return { ready: false, issues };
  }

  // Check all materials are mapped to inventory
  const unmappedMaterials = palette.entries.filter(
    (m: any) => !m.inventoryId
  );

  for (const material of unmappedMaterials) {
    issues.push({
      type: 'UNMAPPED_MATERIAL',
      materialName: material.designName,
      message: `Material "${material.designName}" not mapped to inventory`
    });
  }

  // Build summary
  const summary = {
    totalMaterials: palette.entries.length,
    mappedMaterials: palette.entries.length - unmappedMaterials.length,
    totalSheets: production?.nestingSheets?.length || 0,
    totalParts: production?.nestingSheets?.reduce(
      (acc: number, sheet: any) => acc + (sheet.placements?.length || 0),
      0
    ) || 0,
  };

  return {
    ready: issues.length === 0,
    issues,
    summary
  };
}

/**
 * Quick check if BOM was already exported
 */
export async function checkBOMExportStatus(projectId: string): Promise<{
  exported: boolean;
  katanaBOMId?: string;
  exportedAt?: admin.firestore.Timestamp;
}> {
  const project = await getProject(projectId);
  const production = project.optimizationState?.production;

  if (production?.katanaBOMId) {
    return {
      exported: true,
      katanaBOMId: production.katanaBOMId,
      exportedAt: production.katanaBOMExportedAt
    };
  }

  return { exported: false };
}
