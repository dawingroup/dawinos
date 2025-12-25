/**
 * Firestore Service
 * Generic Firestore operations and utilities
 */

import { 
  getFirestore, 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  type Firestore,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type CollectionReference,
  type Unsubscribe
} from 'firebase/firestore';
import { app } from './config';

// Initialize Firestore
export const db: Firestore = getFirestore(app);

/**
 * Get a document reference
 */
export function getDocRef<T = DocumentData>(
  collectionPath: string, 
  docId: string
): DocumentReference<T> {
  return doc(db, collectionPath, docId) as DocumentReference<T>;
}

/**
 * Get a collection reference
 */
export function getCollectionRef<T = DocumentData>(
  collectionPath: string
): CollectionReference<T> {
  return collection(db, collectionPath) as CollectionReference<T>;
}

/**
 * Fetch a single document
 */
export async function fetchDocument<T>(
  collectionPath: string, 
  docId: string
): Promise<T | null> {
  const docRef = getDocRef<T>(collectionPath, docId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

/**
 * Fetch all documents in a collection
 */
export async function fetchCollection<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const collectionRef = getCollectionRef<T>(collectionPath);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

/**
 * Create or update a document
 */
export async function saveDocument<T extends DocumentData>(
  collectionPath: string,
  docId: string,
  data: T
): Promise<void> {
  const docRef = getDocRef(collectionPath, docId);
  await setDoc(docRef, data, { merge: true });
}

/**
 * Update specific fields in a document
 */
export async function updateDocument(
  collectionPath: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = getDocRef(collectionPath, docId);
  await updateDoc(docRef, data);
}

/**
 * Delete a document
 */
export async function removeDocument(
  collectionPath: string,
  docId: string
): Promise<void> {
  const docRef = getDocRef(collectionPath, docId);
  await deleteDoc(docRef);
}

/**
 * Subscribe to document changes
 */
export function subscribeToDocument<T>(
  collectionPath: string,
  docId: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const docRef = getDocRef<T>(collectionPath, docId);
  return onSnapshot(docRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as T) : null);
  });
}

/**
 * Subscribe to collection changes
 */
export function subscribeToCollection<T>(
  collectionPath: string,
  callback: (data: T[]) => void,
  constraints: QueryConstraint[] = []
): Unsubscribe {
  const collectionRef = getCollectionRef<T>(collectionPath);
  const q = query(collectionRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  });
}

// Re-export commonly used Firestore utilities
export { where, orderBy, limit, type QueryConstraint };
