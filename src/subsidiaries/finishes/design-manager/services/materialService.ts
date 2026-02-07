/**
 * Material Service
 * Three-tier material library: Global → Customer → Project
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import type {
  Material,
  MaterialFormData,
  MaterialListItem,
  ResolvedMaterial,
  MaterialTier,
  MaterialCategory,
} from '../types/materials';

/**
 * Collection references
 */
const globalMaterialsRef = collection(db, 'materials');

function getCustomerMaterialsRef(customerId: string) {
  return collection(db, 'customers', customerId, 'materials');
}

function getProjectMaterialsRef(projectId: string) {
  return collection(db, 'designProjects', projectId, 'materials');
}

/**
 * Generate a material code
 */
export function generateMaterialCode(name: string, category: MaterialCategory): string {
  const categoryPrefix: Record<MaterialCategory, string> = {
    'sheet-goods': 'SHT',
    'solid-wood': 'WOD',
    'hardware': 'HDW',
    'edge-banding': 'EDG',
    'finishing': 'FIN',
    'other': 'OTH',
  };
  
  const prefix = categoryPrefix[category];
  const namePart = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${prefix}-${namePart}-${randomPart}`;
}

/**
 * Subscribe to global materials
 */
export function subscribeToGlobalMaterials(
  callback: (materials: MaterialListItem[]) => void,
  onError?: (error: Error) => void,
  options?: { category?: MaterialCategory; status?: 'active' | 'discontinued' | 'out-of-stock' }
): () => void {
  const q = query(globalMaterialsRef);
  
  return onSnapshot(
    q,
    (snapshot) => {
      let materials = snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.data().code || '',
        name: doc.data().name || '',
        category: doc.data().category || 'other',
        tier: 'global' as MaterialTier,
        thickness: doc.data().dimensions?.thickness,
        unitCost: doc.data().pricing?.unitCost,
        currency: doc.data().pricing?.currency,
        status: doc.data().status || 'active',
      })) as MaterialListItem[];
      
      // Client-side filtering
      if (options?.category) {
        materials = materials.filter(m => m.category === options.category);
      }
      if (options?.status) {
        materials = materials.filter(m => m.status === options.status);
      }
      
      materials.sort((a, b) => a.name.localeCompare(b.name));
      callback(materials);
    },
    (error) => {
      console.error('Material subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to customer materials
 */
export function subscribeToCustomerMaterials(
  customerId: string,
  callback: (materials: MaterialListItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = getCustomerMaterialsRef(customerId);
  
  return onSnapshot(
    ref,
    (snapshot) => {
      const materials = snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.data().code || '',
        name: doc.data().name || '',
        category: doc.data().category || 'other',
        tier: 'customer' as MaterialTier,
        thickness: doc.data().dimensions?.thickness,
        unitCost: doc.data().pricing?.unitCost,
        currency: doc.data().pricing?.currency,
        status: doc.data().status || 'active',
      })) as MaterialListItem[];
      
      materials.sort((a, b) => a.name.localeCompare(b.name));
      callback(materials);
    },
    (error) => {
      console.error('Customer materials subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Subscribe to project materials
 */
export function subscribeToProjectMaterials(
  projectId: string,
  callback: (materials: MaterialListItem[]) => void,
  onError?: (error: Error) => void
): () => void {
  const ref = getProjectMaterialsRef(projectId);
  
  return onSnapshot(
    ref,
    (snapshot) => {
      const materials = snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.data().code || '',
        name: doc.data().name || '',
        category: doc.data().category || 'other',
        tier: 'project' as MaterialTier,
        thickness: doc.data().dimensions?.thickness,
        unitCost: doc.data().pricing?.unitCost,
        currency: doc.data().pricing?.currency,
        status: doc.data().status || 'active',
      })) as MaterialListItem[];
      
      materials.sort((a, b) => a.name.localeCompare(b.name));
      callback(materials);
    },
    (error) => {
      console.error('Project materials subscription error:', error);
      onError?.(error);
    }
  );
}

/**
 * Get material by ID
 */
export async function getMaterial(
  materialId: string,
  tier: MaterialTier,
  scopeId?: string // customerId or projectId
): Promise<Material | null> {
  let docRef;
  
  switch (tier) {
    case 'global':
      docRef = doc(globalMaterialsRef, materialId);
      break;
    case 'customer':
      if (!scopeId) throw new Error('customerId required for customer materials');
      docRef = doc(getCustomerMaterialsRef(scopeId), materialId);
      break;
    case 'project':
      if (!scopeId) throw new Error('projectId required for project materials');
      docRef = doc(getProjectMaterialsRef(scopeId), materialId);
      break;
  }
  
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Material;
  }
  return null;
}

/**
 * Get all materials for a project (merged from all tiers)
 * Resolution order: Project > Customer > Global
 */
export async function getMaterialsForProject(
  projectId: string,
  customerId?: string
): Promise<ResolvedMaterial[]> {
  const materialMap = new Map<string, ResolvedMaterial>();
  
  // 1. Load global materials
  const globalSnapshot = await getDocs(query(globalMaterialsRef, where('status', '==', 'active')));
  globalSnapshot.forEach((doc) => {
    const material = { id: doc.id, ...doc.data() } as Material;
    materialMap.set(material.code, {
      ...material,
      resolvedFrom: 'global',
    });
  });
  
  // 2. Load customer materials (override globals)
  if (customerId) {
    const customerRef = getCustomerMaterialsRef(customerId);
    const customerSnapshot = await getDocs(customerRef);
    customerSnapshot.forEach((doc) => {
      const material = { id: doc.id, ...doc.data() } as Material;
      materialMap.set(material.code, {
        ...material,
        resolvedFrom: 'customer',
      });
    });
  }
  
  // 3. Load project materials (override customer/global)
  const projectRef = getProjectMaterialsRef(projectId);
  const projectSnapshot = await getDocs(projectRef);
  projectSnapshot.forEach((doc) => {
    const material = { id: doc.id, ...doc.data() } as Material;
    materialMap.set(material.code, {
      ...material,
      resolvedFrom: 'project',
    });
  });
  
  // Convert to array and sort
  return Array.from(materialMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create a global material (admin only)
 */
export async function createGlobalMaterial(
  data: MaterialFormData,
  userId: string
): Promise<string> {
  const docRef = await addDoc(globalMaterialsRef, {
    ...data,
    tier: 'global',
    pricing: data.pricing ? {
      ...data.pricing,
      lastUpdated: serverTimestamp(),
    } : undefined,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  return docRef.id;
}

/**
 * Create a customer material
 */
export async function createCustomerMaterial(
  customerId: string,
  data: MaterialFormData,
  userId: string
): Promise<string> {
  const ref = getCustomerMaterialsRef(customerId);
  const docRef = await addDoc(ref, {
    ...data,
    tier: 'customer',
    pricing: data.pricing ? {
      ...data.pricing,
      lastUpdated: serverTimestamp(),
    } : undefined,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  return docRef.id;
}

/**
 * Create a project material (override)
 */
export async function createProjectMaterial(
  projectId: string,
  data: MaterialFormData,
  userId: string,
  parentMaterialId?: string
): Promise<string> {
  const ref = getProjectMaterialsRef(projectId);
  const docRef = await addDoc(ref, {
    ...data,
    tier: 'project',
    parentMaterialId,
    pricing: data.pricing ? {
      ...data.pricing,
      lastUpdated: serverTimestamp(),
    } : undefined,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  return docRef.id;
}

/**
 * Update a material
 */
export async function updateMaterial(
  materialId: string,
  tier: MaterialTier,
  scopeId: string | undefined,
  data: Partial<MaterialFormData>,
  userId: string
): Promise<void> {
  let docRef;
  
  switch (tier) {
    case 'global':
      docRef = doc(globalMaterialsRef, materialId);
      break;
    case 'customer':
      if (!scopeId) throw new Error('customerId required');
      docRef = doc(getCustomerMaterialsRef(scopeId), materialId);
      break;
    case 'project':
      if (!scopeId) throw new Error('projectId required');
      docRef = doc(getProjectMaterialsRef(scopeId), materialId);
      break;
  }
  
  const updateData: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  };
  
  if (data.pricing) {
    updateData.pricing = {
      ...data.pricing,
      lastUpdated: serverTimestamp(),
    };
  }
  
  await updateDoc(docRef, updateData);
}

/**
 * Delete a material
 */
export async function deleteMaterial(
  materialId: string,
  tier: MaterialTier,
  scopeId?: string
): Promise<void> {
  let docRef;
  
  switch (tier) {
    case 'global':
      docRef = doc(globalMaterialsRef, materialId);
      break;
    case 'customer':
      if (!scopeId) throw new Error('customerId required');
      docRef = doc(getCustomerMaterialsRef(scopeId), materialId);
      break;
    case 'project':
      if (!scopeId) throw new Error('projectId required');
      docRef = doc(getProjectMaterialsRef(scopeId), materialId);
      break;
  }
  
  await deleteDoc(docRef);
}

/**
 * Link material to a part (update part.materialId)
 */
export async function linkMaterialToPart(
  projectId: string,
  itemId: string,
  partId: string,
  materialId: string,
  materialCode: string,
  materialName: string,
  currentParts: any[],
  userId: string
): Promise<void> {
  const docRef = doc(db, 'designProjects', projectId, 'designItems', itemId);
  
  const updatedParts = currentParts.map((part) =>
    part.id === partId
      ? { ...part, materialId, materialCode, materialName, updatedAt: Timestamp.now() }
      : part
  );
  
  await updateDoc(docRef, {
    parts: updatedParts,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Import materials from CSV data
 */
export async function importMaterialsFromCSV(
  tier: MaterialTier,
  scopeId: string | undefined,
  materials: MaterialFormData[],
  userId: string
): Promise<{ imported: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  
  for (const material of materials) {
    try {
      switch (tier) {
        case 'global':
          await createGlobalMaterial(material, userId);
          break;
        case 'customer':
          if (!scopeId) throw new Error('customerId required');
          await createCustomerMaterial(scopeId, material, userId);
          break;
        case 'project':
          if (!scopeId) throw new Error('projectId required');
          await createProjectMaterial(scopeId, material, userId);
          break;
      }
      imported++;
    } catch (error) {
      errors.push(`Failed to import "${material.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { imported, errors };
}
