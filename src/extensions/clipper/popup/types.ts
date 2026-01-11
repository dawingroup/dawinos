/**
 * Type definitions for popup components
 * These are simplified versions that work with chrome.storage (no Blobs)
 */

export interface PopupClipRecord {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  title: string;
  thumbnailDataUrl?: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'syncing' | 'error';
  syncError?: string;
  tags: string[];
  description?: string;
  notes?: string;
  brand?: string;
  sku?: string;
  price?: { 
    amount: number; 
    currency?: string;
    formatted: string; 
  };
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    unit?: string;
  };
  materials?: string[];
  colors?: string[];
  projectId?: string;
  designItemId?: string;
  roomType?: string;
  clipType?: 'inspiration' | 'reference' | 'parts-source' | 'procurement' | 'material' | 'asset' | 'product-idea';
  aiAnalysis?: {
    analyzedAt?: Date;
    confidence?: number;
    productType?: string;
    style?: string;
    suggestedTags?: string[];
  };
}
