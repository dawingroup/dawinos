import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { KatanaCatalogItem, KatanaCatalogSource } from '../types/katanaCatalog';

const KATANA_CATALOG_COLLECTION = 'katanaCatalogItems';

export function subscribeToKatanaCatalogItems(
  callback: (items: KatanaCatalogItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const ref = collection(db, KATANA_CATALOG_COLLECTION);
  const q = query(ref, orderBy('name', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          katanaId: data.katanaId || d.id,
          sku: data.sku || '',
          name: data.name || '',
          type: data.type || '',
          unit: data.unit || '',
          costPerUnit: typeof data.costPerUnit === 'number' ? data.costPerUnit : 0,
          inStock: typeof data.inStock === 'number' ? data.inStock : 0,
          barcode: data.barcode || '',
          source: (data.source as KatanaCatalogSource) || 'unknown',
          isStandard: !!data.isStandard,
          displayNameOverride: data.displayNameOverride,
          categoryOverride: data.categoryOverride,
          aliases: Array.isArray(data.aliases) ? data.aliases : [],
        } satisfies KatanaCatalogItem;
      });

      callback(items);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function updateKatanaCatalogItem(
  katanaId: string,
  data: Partial<Pick<KatanaCatalogItem, 'isStandard' | 'displayNameOverride' | 'categoryOverride' | 'aliases'>>
): Promise<void> {
  const ref = doc(db, KATANA_CATALOG_COLLECTION, katanaId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export interface KatanaMaterialApiRecord {
  id: string;
  name: string;
  sku: string;
  type: string;
  thickness?: number;
  inStock?: number;
  barcode?: string;
  unit?: string;
  costPerUnit?: number;
}

export async function upsertKatanaCatalogFromMaterials(
  materials: KatanaMaterialApiRecord[],
  source: KatanaCatalogSource
): Promise<{ upsertedCount: number }> {
  const batch = writeBatch(db);

  for (const m of materials) {
    if (!m?.id) continue;

    const ref = doc(db, KATANA_CATALOG_COLLECTION, String(m.id));

    batch.set(
      ref,
      {
        katanaId: String(m.id),
        sku: m.sku || '',
        name: m.name || '',
        type: m.type || '',
        unit: m.unit || '',
        costPerUnit: typeof m.costPerUnit === 'number' ? m.costPerUnit : 0,
        inStock: typeof m.inStock === 'number' ? m.inStock : 0,
        barcode: m.barcode || '',
        source,
        lastSyncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return { upsertedCount: materials.length };
}
