/**
 * Shop Traveler PDF Service
 * Generates and downloads shop traveler PDFs from production optimization results
 */

import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ShopTraveler, type ShopTravelerOptions } from '@/subsidiaries/finishes/design-manager/features/production/pdf/ShopTraveler';
import { getProjectWithOptimization as getProject } from '@/shared/services/projectService';
import { aggregateStandardPartsFromProject, aggregateSpecialPartsFromProject } from '@/shared/services/optimization';
import { getDesignItems } from '@/modules/design-manager/services/firestore';
import { getOrganizationSettings } from '@/core/settings';
import type { Project, ProductionResult, NestingSheet } from '@/shared/types';

// Suppress unused React warning - needed for JSX
void React;

// Re-export the options type
export type { ShopTravelerOptions };

export interface LabelsCSVData {
  partId: string;
  partName: string;
  designItemName: string;
  length: number;
  width: number;
  thickness: number;
  material: string;
  edgeBanding: string;
  sheetNumber: number;
}

// ============================================
// PDF Generation
// ============================================

/**
 * Generate Shop Traveler PDF blob
 */
export async function generateShopTravelerPDF(
  projectId: string,
  options?: ShopTravelerOptions
): Promise<Blob> {
  const project = await getProject(projectId);
  
  if (!project) {
    throw new Error('Project not found');
  }

  const production = project.optimizationState?.production;
  
  if (!production) {
    throw new Error('No production optimization results available');
  }

  if (!production.nestingSheets || production.nestingSheets.length === 0) {
    throw new Error('No nesting sheets to generate shop traveler');
  }

  // Fetch standard parts, special parts, design items, and organization settings for the project
  const [standardParts, specialParts, designItems, orgSettings] = await Promise.all([
    aggregateStandardPartsFromProject(projectId),
    aggregateSpecialPartsFromProject(projectId),
    getDesignItems(projectId),
    getOrganizationSettings().catch(() => null),
  ]);

  // Get Dawin Finishes logo URL from subsidiary branding
  const dawinFinishesLogo = orgSettings?.branding?.subsidiaries?.['dawin-finishes']?.logoUrl;

  // Create the PDF document element using JSX with options
  const doc = <ShopTraveler 
    project={project as Project} 
    production={production as ProductionResult}
    options={options}
    standardParts={standardParts}
    specialParts={specialParts}
    designItems={designItems}
    logoUrl={dawinFinishesLogo}
  />;
  
  // Generate PDF blob
  const blob = await pdf(doc).toBlob();
  
  return blob;
}

/**
 * Download Shop Traveler PDF
 */
export async function downloadShopTraveler(
  projectId: string,
  options?: ShopTravelerOptions
): Promise<void> {
  const project = await getProject(projectId);
  const projectCode = project?.code || projectId.substring(0, 8);
  const timestamp = new Date().toISOString().split('T')[0];
  
  const blob = await generateShopTravelerPDF(projectId, options);
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ShopTraveler-${projectCode}-${timestamp}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// ============================================
// Labels CSV Export
// ============================================

/**
 * Generate labels data from production results
 */
function generateLabelsData(
  nestingSheets: NestingSheet[]
): LabelsCSVData[] {
  const labels: LabelsCSVData[] = [];
  
  for (let sheetIndex = 0; sheetIndex < nestingSheets.length; sheetIndex++) {
    const sheet = nestingSheets[sheetIndex];
    
    for (const placement of sheet.placements) {
      labels.push({
        partId: placement.partId,
        partName: placement.partName,
        designItemName: placement.designItemName,
        length: placement.length,
        width: placement.width,
        thickness: 18, // Default, would come from material
        material: sheet.materialName,
        edgeBanding: 'L-R', // Simplified, would come from part data
        sheetNumber: sheetIndex + 1,
      });
    }
  }
  
  return labels;
}

/**
 * Convert labels data to CSV string
 */
function labelsToCSV(labels: LabelsCSVData[]): string {
  const headers = [
    'Part ID',
    'Part Name',
    'Design Item',
    'Length (mm)',
    'Width (mm)',
    'Thickness (mm)',
    'Material',
    'Edge Banding',
    'Sheet #',
  ];
  
  const rows = labels.map(label => [
    label.partId,
    label.partName,
    label.designItemName,
    label.length.toString(),
    label.width.toString(),
    label.thickness.toString(),
    label.material,
    label.edgeBanding,
    label.sheetNumber.toString(),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

/**
 * Download labels as CSV file
 */
export async function downloadLabelsCSV(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  
  if (!project) {
    throw new Error('Project not found');
  }

  const production = project.optimizationState?.production;
  
  if (!production || !production.nestingSheets) {
    throw new Error('No production optimization results available');
  }

  const projectCode = project.code || projectId.substring(0, 8);
  const labels = generateLabelsData(production.nestingSheets as NestingSheet[]);
  const csvContent = labelsToCSV(labels);
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `Labels-${projectCode}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

// ============================================
// Cut List CSV Export
// ============================================

/**
 * Download cut list as CSV file (for CNC import)
 */
export async function downloadCutListCSV(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  
  if (!project) {
    throw new Error('Project not found');
  }

  const production = project.optimizationState?.production;
  
  if (!production || !production.nestingSheets) {
    throw new Error('No production optimization results available');
  }

  const projectCode = project.code || projectId.substring(0, 8);
  
  // Generate cut list with all parts and their positions
  const headers = [
    'Sheet #',
    'Material',
    'Part ID',
    'Part Name',
    'X Position',
    'Y Position',
    'Length',
    'Width',
    'Rotated',
    'Grain Aligned',
  ];
  
  const rows: string[][] = [];
  
  for (let i = 0; i < production.nestingSheets.length; i++) {
    const sheet = production.nestingSheets[i] as NestingSheet;
    
    for (const placement of sheet.placements) {
      rows.push([
        (i + 1).toString(),
        sheet.materialName,
        placement.partId,
        placement.partName,
        placement.x.toString(),
        placement.y.toString(),
        placement.length.toString(),
        placement.width.toString(),
        placement.rotated ? 'Yes' : 'No',
        placement.grainAligned ? 'Yes' : 'No',
      ]);
    }
  }
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `CutList-${projectCode}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
