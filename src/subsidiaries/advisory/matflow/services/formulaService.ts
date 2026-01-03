/**
 * Formula Service
 * Access and manage standard calculation formulas
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import type { StandardFormula, MaterialCategory } from '../types';

const FORMULAS_COLLECTION = 'matflow/data/formulas';

export async function getFormulas(category?: MaterialCategory): Promise<StandardFormula[]> {
  let q = query(
    collection(db, FORMULAS_COLLECTION),
    where('isActive', '==', true),
    orderBy('usageCount', 'desc')
  );
  
  if (category) {
    q = query(q, where('category', '==', category));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as StandardFormula[];
}

export async function getFormulaById(formulaId: string): Promise<StandardFormula | null> {
  const snapshot = await getDoc(doc(db, FORMULAS_COLLECTION, formulaId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as StandardFormula;
}

export async function getFormulaByCode(code: string): Promise<StandardFormula | null> {
  const q = query(
    collection(db, FORMULAS_COLLECTION),
    where('code', '==', code),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as StandardFormula;
}

export async function searchFormulas(searchTerm: string): Promise<StandardFormula[]> {
  // Firestore doesn't support full-text search, so we search by keywords
  const q = query(
    collection(db, FORMULAS_COLLECTION),
    where('isActive', '==', true),
    where('keywords', 'array-contains', searchTerm.toLowerCase())
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as StandardFormula[];
}

export async function incrementFormulaUsage(formulaId: string): Promise<void> {
  await updateDoc(doc(db, FORMULAS_COLLECTION, formulaId), {
    usageCount: increment(1),
  });
}
