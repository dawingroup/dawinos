/**
 * Clipper Types
 * Shared type definitions for the clipper module
 */

export interface DesignClip {
  id: string;
  sourceUrl: string;
  imageUrl: string;
  thumbnailUrl: string;
  title: string;
  description?: string;
  
  // Extracted metadata
  price?: {
    amount: number;
    currency: string;
    formatted: string;
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit: 'in' | 'cm' | 'mm';
  };
  materials?: string[];
  colors?: string[];
  brand?: string;
  sku?: string;
  
  // Organization
  tags: string[];
  notes?: string;
  projectId?: string;
  designItemId?: string;
  roomType?: string;
  
  // AI Analysis
  aiAnalysis?: ClipAIAnalysis;
  
  // Sync metadata
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  syncError?: string;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClipAIAnalysis {
  analyzedAt: Date;
  confidence: number;
  productType?: string;
  style?: string;
  primaryMaterials?: string[];
  colors?: string[];
  estimatedDimensions?: {
    width?: string;
    height?: string;
    depth?: string;
    unit?: string;
  };
  suggestedTags: string[];
  millworkAssessment?: {
    isCustomCandidate: boolean;
    complexity: 'simple' | 'moderate' | 'complex' | 'highly-complex';
    keyFeatures?: string[];
    estimatedHours?: number;
    considerations?: string[];
  };
}

export interface ClipFilter {
  search?: string;
  tags?: string[];
  projectId?: string;
  syncStatus?: DesignClip['syncStatus'];
  dateRange?: { start: Date; end: Date };
}

export interface ClipStats {
  total: number;
  synced: number;
  pending: number;
  byProject: Record<string, number>;
}
