/**
 * Customer Service
 * Firestore operations for customer management
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import type { Customer, CustomerFormData, CustomerListItem, CustomerStatus } from '../types';

// Collection reference
const customersRef = collection(db, 'customers');

/**
 * Subscribe to all customers
 */
export function subscribeToCustomers(
  callback: (customers: CustomerListItem[]) => void,
  options?: { status?: CustomerStatus }
): () => void {
  let q = query(customersRef, orderBy('name', 'asc'));
  
  if (options?.status) {
    q = query(customersRef, where('status', '==', options.status), orderBy('name', 'asc'));
  }
  
  return onSnapshot(q, (snapshot) => {
    const customers = snapshot.docs.map((doc) => ({
      id: doc.id,
      code: doc.data().code,
      name: doc.data().name,
      type: doc.data().type,
      status: doc.data().status,
      email: doc.data().email,
      phone: doc.data().phone,
    })) as CustomerListItem[];
    callback(customers);
  });
}

/**
 * Subscribe to a single customer
 */
export function subscribeToCustomer(
  customerId: string,
  callback: (customer: Customer | null) => void
): () => void {
  const docRef = doc(customersRef, customerId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Customer);
    } else {
      callback(null);
    }
  });
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  const docRef = doc(customersRef, customerId);
  const snapshot = await getDoc(docRef);
  
  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() } as Customer;
  }
  return null;
}

/**
 * Check if customer code is unique
 */
export async function isCustomerCodeUnique(code: string, excludeId?: string): Promise<boolean> {
  const q = query(customersRef, where('code', '==', code));
  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(q, (snapshot) => {
      unsubscribe();
      const matches = snapshot.docs.filter((doc) => doc.id !== excludeId);
      resolve(matches.length === 0);
    });
  });
}

/**
 * Create a new customer
 */
export async function createCustomer(
  data: CustomerFormData,
  userId: string
): Promise<string> {
  // Validate unique code
  const isUnique = await isCustomerCodeUnique(data.code);
  if (!isUnique) {
    throw new Error(`Customer code "${data.code}" already exists`);
  }
  
  const docRef = await addDoc(customersRef, {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: userId,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  return docRef.id;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  data: Partial<CustomerFormData>,
  userId: string
): Promise<void> {
  // If code is being changed, validate uniqueness
  if (data.code) {
    const isUnique = await isCustomerCodeUnique(data.code, customerId);
    if (!isUnique) {
      throw new Error(`Customer code "${data.code}" already exists`);
    }
  }
  
  const docRef = doc(customersRef, customerId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
}

/**
 * Delete a customer (soft delete by setting status to inactive)
 */
export async function deleteCustomer(
  customerId: string,
  userId: string,
  hardDelete = false
): Promise<void> {
  const docRef = doc(customersRef, customerId);
  
  if (hardDelete) {
    await deleteDoc(docRef);
  } else {
    await updateDoc(docRef, {
      status: 'inactive',
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

/**
 * Generate a customer code from name
 */
export function generateCustomerCode(name: string, type: string): string {
  const namePart = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 6);
  
  const typePart = type.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  
  return `${namePart}-${typePart}-${randomPart}`;
}
