/**
 * Katana BOM Export Cloud Function
 * Creates a manufacturing order in Katana MRP from cutlist optimization results
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { validateBOMReadiness } from './validateBOMReadiness';

const db = admin.firestore();
const katanaApiKey = defineSecret('KATANA_API_KEY');

// ============================================
// Types
// ============================================

interface KatanaBOMItem {
  variant_id?: string;
  sku?: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

interface KatanaManufacturingOrder {
  reference: string;
  customer_name?: string;
  notes?: string;
  bom_items: KatanaBOMItem[];
}

interface NestingSheet {
  id: string;
  materialId: string;
  materialName: string;
  sheetSize: { length: number; width: number };
  placements: Array<{
    partId: string;
    partName: string;
    designItemId: string;
    designItemName: string;
    length: number;
    width: number;
  }>;
  utilizationPercent: number;
}

interface MaterialPaletteEntry {
  id: string;
  designName: string;
  inventoryId?: string;
  inventoryName?: string;
  inventorySku?: string;
  thickness: number;
  stockSheets: Array<{
    length: number;
    width: number;
    costPerSheet: number;
  }>;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get project from Firestore
 */
async function getProject(projectId: string): Promise<any> {
  const doc = await db.collection('designProjects').doc(projectId).get();
  if (!doc.exists) {
    throw new HttpsError('not-found', `Project not found: ${projectId}`);
  }
  return { id: doc.id, ...doc.data() };
}

/**
 * Build BOM items from nesting results
 */
function buildBOMFromNesting(
  nestingSheets: NestingSheet[],
  materialPalette: { entries: MaterialPaletteEntry[] }
): KatanaBOMItem[] {
  // Group sheets by material
  const sheetsByMaterial = new Map<string, number>();
  
  for (const sheet of nestingSheets) {
    const current = sheetsByMaterial.get(sheet.materialId) || 0;
    sheetsByMaterial.set(sheet.materialId, current + 1);
  }

  // Convert to BOM items
  const bomItems: KatanaBOMItem[] = [];
  
  for (const [materialId, quantity] of sheetsByMaterial) {
    // Find material in palette
    const paletteMaterial = materialPalette.entries.find(m => m.id === materialId);
    
    if (!paletteMaterial) {
      console.warn(`Material ${materialId} not found in palette`);
      continue;
    }

    // Get sheet size for notes
    const sheetInfo = nestingSheets.find(s => s.materialId === materialId);
    const sheetSize = sheetInfo?.sheetSize;

    bomItems.push({
      variant_id: paletteMaterial.inventoryId || undefined,
      sku: paletteMaterial.inventorySku || undefined,
      name: paletteMaterial.inventoryName || paletteMaterial.designName,
      quantity,
      unit: 'sheet',
      notes: sheetSize 
        ? `${sheetSize.length}x${sheetSize.width}mm, ${paletteMaterial.thickness}mm thick`
        : `${paletteMaterial.thickness}mm thick`
    });
  }

  return bomItems;
}

/**
 * Save BOM export reference to project
 */
async function saveBOMExportReference(
  projectId: string,
  katanaBOMId: string,
  orderNumber: string
): Promise<void> {
  await db.collection('designProjects').doc(projectId).update({
    'optimizationState.production.katanaBOMId': katanaBOMId,
    'optimizationState.production.katanaBOMExportedAt': admin.firestore.FieldValue.serverTimestamp(),
    'optimizationState.production.katanaOrderNumber': orderNumber,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// ============================================
// Cloud Function
// ============================================

export const createCutlistBOM = onCall(
  { 
    secrets: [katanaApiKey],
    cors: true,
  },
  async (request) => {
    const { projectId } = request.data;

    if (!projectId) {
      throw new HttpsError('invalid-argument', 'projectId is required');
    }

    console.log(`Creating Katana BOM for project: ${projectId}`);

    // Step 1: Validate BOM readiness
    const validation = await validateBOMReadiness(projectId);
    if (!validation.ready) {
      const issueMessages = validation.issues.map(i => i.message).join('; ');
      throw new HttpsError('failed-precondition', `BOM not ready: ${issueMessages}`);
    }

    // Step 2: Get project data
    const project = await getProject(projectId);
    const production = project.optimizationState.production;

    // Check if already exported
    if (production.katanaBOMId) {
      throw new HttpsError(
        'already-exists',
        `BOM already exported to Katana (Order ID: ${production.katanaBOMId})`
      );
    }

    // Step 3: Build BOM from nesting results
    const bomItems = buildBOMFromNesting(
      production.nestingSheets,
      project.materialPalette
    );

    if (bomItems.length === 0) {
      throw new HttpsError('internal', 'No BOM items could be generated from nesting results');
    }

    console.log(`Built ${bomItems.length} BOM items for export`);

    // Step 4: Create manufacturing order in Katana
    const katanaOrder: KatanaManufacturingOrder = {
      reference: project.code || `PRJ-${projectId.substring(0, 8)}`,
      customer_name: project.customerName,
      notes: `Generated from Dawin Cutlist Processor\nProject: ${project.name}\nTotal sheets: ${production.nestingSheets.length}\nYield: ${production.optimizedYield}%`,
      bom_items: bomItems,
    };

    try {
      const apiKey = katanaApiKey.value();
      
      if (!apiKey) {
        // Simulation mode if API key not configured
        console.log('KATANA_API_KEY not configured - running in simulation mode');
        
        const simulatedOrderId = `SIM-${Date.now()}`;
        const simulatedOrderNumber = `MO-${Math.floor(Math.random() * 10000)}`;
        
        await saveBOMExportReference(projectId, simulatedOrderId, simulatedOrderNumber);
        
        return {
          success: true,
          simulated: true,
          orderId: simulatedOrderId,
          orderNumber: simulatedOrderNumber,
          bomItemCount: bomItems.length,
          message: 'BOM created in simulation mode (Katana API key not configured)'
        };
      }

      // Make actual Katana API call
      const response = await fetch('https://api.katanamrp.com/v1/manufacturing-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(katanaOrder),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Katana API error:', response.status, errorBody);
        throw new HttpsError(
          'internal',
          `Katana API error: ${response.status} - ${response.statusText}`
        );
      }

      const katanaResponse = await response.json();
      console.log('Katana order created:', katanaResponse);

      // Step 5: Save reference to project
      await saveBOMExportReference(
        projectId,
        katanaResponse.id,
        katanaResponse.order_number
      );

      return {
        success: true,
        orderId: katanaResponse.id,
        orderNumber: katanaResponse.order_number,
        bomItemCount: bomItems.length,
      };

    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }
      
      console.error('Error creating Katana BOM:', error);
      throw new HttpsError('internal', `Failed to create Katana BOM: ${error.message}`);
    }
  }
);

// ============================================
// Validation Endpoint (for pre-flight check)
// ============================================

export const validateKatanaBOM = onCall(
  { cors: true },
  async (request) => {
    const { projectId } = request.data;

    if (!projectId) {
      throw new HttpsError('invalid-argument', 'projectId is required');
    }

    const validation = await validateBOMReadiness(projectId);
    return validation;
  }
);
