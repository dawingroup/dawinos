/**
 * AI Conversion Utilities
 * Functions for converting AI-extracted items to design items
 */

import type {
  ExtractedDesignItem,
  DesignItem,
  DesignCategory,
  DesignParameters,
} from '../types';
import type { ClientDocument } from '../types/document.types';
import { createDesignItem } from '../services/firestore';

/**
 * Convert AI-extracted items to DesignItem data
 */
export function convertExtractedToDesignItemData(
  extracted: ExtractedDesignItem,
  projectId: string,
  projectCode: string,
  sourceDocumentId?: string
): Partial<DesignItem> {
  // Build design parameters from extracted data
  const designParameters: Partial<DesignParameters> = {};

  // Set dimensions if available
  if (extracted.dimensions) {
    const { width, height, depth, unit } = extracted.dimensions;
    if (width || height || depth) {
      designParameters.dimensions = {
        width: width || 0,
        height: height || 0,
        depth: depth || 0,
        unit: unit === 'inches' ? 'in' : 'mm',
      };
    }
  }

  // Set primary material
  if (extracted.suggestedMaterials?.length > 0) {
    designParameters.primaryMaterial = extracted.suggestedMaterials[0];
    if (extracted.suggestedMaterials.length > 1) {
      designParameters.secondaryMaterials = extracted.suggestedMaterials.slice(1);
    }
  }

  // Set finish
  if (extracted.suggestedFinish) {
    designParameters.finish = extracted.suggestedFinish;
  }

  // Set special requirements
  if (extracted.specialRequirements?.length > 0) {
    designParameters.specialRequirements = extracted.specialRequirements;
  }

  // Build the design item data
  const designItemData: Partial<DesignItem> = {
    name: extracted.name,
    category: extracted.category,
    description: extracted.description || '',
    projectId,
    projectCode,
    currentStage: 'concept', // All AI-extracted items start at concept stage
    designParameters,
    // Store AI extraction metadata
    aiExtraction: {
      sourceDocumentId,
      extractedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      confidence: extracted.confidence,
      estimatedComplexity: extracted.estimatedComplexity,
    },
  };

  return designItemData;
}

/**
 * Batch convert and create design items from AI analysis
 */
export async function createDesignItemsFromAIAnalysis(
  document: ClientDocument,
  projectId: string,
  projectCode: string,
  userId: string,
  options?: {
    skipLowConfidence?: boolean;
    confidenceThreshold?: number;
    onProgress?: (current: number, total: number, itemName: string) => void;
  }
): Promise<{
  created: string[];
  skipped: { name: string; reason: string }[];
  errors: { name: string; error: string }[];
}> {
  const {
    skipLowConfidence = true,
    confidenceThreshold = 0.5,
    onProgress,
  } = options || {};

  const result = {
    created: [] as string[],
    skipped: [] as { name: string; reason: string }[],
    errors: [] as { name: string; error: string }[],
  };

  // Get extracted items from the document
  const extractedItems = document.aiAnalysisResult?.extractedItems;
  if (!extractedItems || extractedItems.length === 0) {
    return result;
  }

  const total = extractedItems.length;
  let current = 0;

  for (const extracted of extractedItems) {
    current++;
    onProgress?.(current, total, extracted.name);

    // Skip low confidence items if configured
    if (skipLowConfidence && extracted.confidence < confidenceThreshold) {
      result.skipped.push({
        name: extracted.name,
        reason: `Low confidence (${Math.round(extracted.confidence * 100)}% < ${Math.round(confidenceThreshold * 100)}%)`,
      });
      continue;
    }

    try {
      // Convert to design item data
      const itemData = convertExtractedToDesignItemData(
        extracted,
        projectId,
        projectCode,
        document.id
      );

      // Create the design item
      const itemId = await createDesignItem(projectId, itemData, userId);
      result.created.push(itemId);
    } catch (error) {
      result.errors.push({
        name: extracted.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return result;
}

/**
 * Preview what design items would be created from AI analysis
 */
export function previewAIConversion(
  document: ClientDocument,
  options?: {
    confidenceThreshold?: number;
  }
): {
  items: (ExtractedDesignItem & { willBeCreated: boolean; skipReason?: string })[];
  summary: {
    total: number;
    willCreate: number;
    willSkip: number;
    averageConfidence: number;
  };
} {
  const { confidenceThreshold = 0.5 } = options || {};
  const extractedItems = document.aiAnalysisResult?.extractedItems || [];

  const items = extractedItems.map(item => ({
    ...item,
    willBeCreated: item.confidence >= confidenceThreshold,
    skipReason: item.confidence < confidenceThreshold
      ? `Confidence below threshold (${Math.round(item.confidence * 100)}%)`
      : undefined,
  }));

  const willCreate = items.filter(i => i.willBeCreated).length;
  const totalConfidence = extractedItems.reduce((sum, i) => sum + i.confidence, 0);

  return {
    items,
    summary: {
      total: extractedItems.length,
      willCreate,
      willSkip: extractedItems.length - willCreate,
      averageConfidence: extractedItems.length > 0
        ? Math.round((totalConfidence / extractedItems.length) * 100)
        : 0,
    },
  };
}

/**
 * Validate category from AI extraction
 */
export function validateCategory(category: string): DesignCategory {
  const validCategories: DesignCategory[] = [
    'casework', 'furniture', 'millwork', 'doors', 'fixtures', 'specialty'
  ];

  const normalized = category.toLowerCase();
  if (validCategories.includes(normalized as DesignCategory)) {
    return normalized as DesignCategory;
  }

  // Try to map common variations
  const categoryMap: Record<string, DesignCategory> = {
    'cabinet': 'casework',
    'cabinets': 'casework',
    'cabinetry': 'casework',
    'table': 'furniture',
    'chair': 'furniture',
    'desk': 'furniture',
    'shelving': 'casework',
    'shelves': 'casework',
    'door': 'doors',
    'panel': 'doors',
    'trim': 'millwork',
    'molding': 'millwork',
    'fixture': 'fixtures',
    'custom': 'specialty',
  };

  return categoryMap[normalized] || 'specialty';
}
