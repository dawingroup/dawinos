export type KatanaCatalogSource = 'katana-api' | 'sample-data' | 'unknown';

export interface KatanaCatalogItem {
  id: string;
  katanaId: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  costPerUnit: number;
  currency: string;
  inStock: number;
  barcode: string;
  source: KatanaCatalogSource;
  isStandard: boolean;
  displayNameOverride?: string;
  categoryOverride?: string;
  aliases: string[];
}

export type KatanaCatalogItemInput = Omit<KatanaCatalogItem, 'id'>;
