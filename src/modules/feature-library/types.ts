/**
 * Feature Library Types
 * Re-exports from shared and adds module-specific types
 */

// Re-export feature types from shared
export type {
  Feature,
  FeatureCategory,
  FeatureInstance,
  FeatureFilters,
  FeatureWithAssets,
} from '@/shared/types';

// Module-specific types

import type { Timestamp } from '@/shared/types';

/**
 * Feature creation input (from scanner or manual)
 */
export interface FeatureInput {
  name: string;
  description?: string;
  category: import('@/shared/types').FeatureCategory;
  tags: string[];
  requiredAssetIds: string[];
  estimatedMinutes?: number;
  parameters?: Record<string, unknown>;
}

/**
 * Vision analysis result from AI
 */
export interface FeatureAnalysisResult {
  name: string;
  description: string;
  category: import('@/shared/types').FeatureCategory;
  tags: string[];
  suggestedAssets: string[];
  estimatedMinutes: number;
  complexity: 'simple' | 'moderate' | 'complex';
  notes: string;
  confidence: number;
  analyzedAt: string;
  analyzedBy: string;
}

/**
 * Feature with linked asset details
 */
export interface FeatureWithAssetDetails {
  id: string;
  name: string;
  description?: string;
  category: import('@/shared/types').FeatureCategory;
  tags: string[];
  requiredAssetIds: string[];
  isAvailable: boolean;
  availabilityReason: string;
  estimatedMinutes?: number;
  
  // Linked asset details
  linkedAssets: {
    id: string;
    displayName: string;
    status: import('@/shared/types').AssetStatus;
    isOperational: boolean;
  }[];
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
}
