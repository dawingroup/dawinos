/**
 * Supplier Service
 * 
 * Service for managing suppliers and tracking performance.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '@/core/services/firebase';
import type {
  Supplier,
  SupplierStatus,
  SupplierQuotation,
  RequestForQuotation,
} from '../types/supplier';

// Generate unique IDs
const generateId = (prefix: string = 'sup'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// COLLECTION REFERENCE
// ============================================================================

const SUPPLIERS_COLLECTION = 'advisoryPlatform/matflow/suppliers';
const QUOTATIONS_COLLECTION = 'advisoryPlatform/matflow/quotations';
const RFQ_COLLECTION = 'advisoryPlatform/matflow/rfqs';

const suppliersRef = collection(db, SUPPLIERS_COLLECTION);

// ============================================================================
// SUPPLIER CATEGORY TYPE
// ============================================================================

export type SupplierCategory = 'materials' | 'equipment' | 'services' | 'subcontractor' | 'other';

// ============================================================================
// SUPPLIER CONTACT TYPE
// ============================================================================

export interface SupplierContact {
  name: string;
  role?: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
}

// ============================================================================
// MATERIAL RATE TYPE
// ============================================================================

export interface MaterialRate {
  materialId: string;
  materialName: string;
  unitPrice: number;
  currency: string;
  unit: string;
  minimumOrder?: number;
  leadTimeDays?: number;
  effectiveDate?: Timestamp;
  expiryDate?: Timestamp;
  addedAt: Timestamp;
  addedBy: string;
}

// ============================================================================
// SUPPLIER PERFORMANCE TYPE
// ============================================================================

export interface SupplierPerformance {
  totalOrders: number;
  completedOrders: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  qualityPassRate: number;
  averageLeadTimeDays: number;
  rating: number;
  lastOrderDate?: Timestamp;
}

// ============================================================================
// CREATE SUPPLIER INPUT
// ============================================================================

export interface CreateSupplierInput {
  name?: string;
  code?: string;
  category: SupplierCategory;
  description?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    country: string;
    postalCode?: string;
  };
  contactPerson?: string;
  email?: string;
  phone: string; // Only phone is mandatory
  alternatePhone?: string;
  taxId?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchCode?: string;
    swiftCode?: string;
  };
  paymentTerms?: string;
  creditLimit?: number;
  notes?: string;
  categories?: string[];
  createdBy: string;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export const createSupplier = async (
  input: CreateSupplierInput
): Promise<Supplier> => {
  const supplierId = generateId('sup');
  const supplierCode = input.code || await generateSupplierCode(input.category);

  // Default address if not provided
  const defaultAddress = {
    line1: '',
    city: '',
    country: 'Uganda',
  };

  const supplier: Supplier = {
    id: supplierId,
    code: supplierCode,
    name: input.name || '', // Optional - can be empty
    contactPerson: input.contactPerson || '', // Optional - can be empty
    email: input.email || '', // Optional - can be empty
    phone: input.phone, // Only phone is mandatory
    address: input.address || defaultAddress,
    categories: input.categories || [input.category],
    materials: [],
    status: 'active',
    totalOrders: 0,
    totalValue: { amount: 0, currency: 'UGX' },
    paymentTerms: input.paymentTerms || 'Net 30',
    audit: {
      createdAt: Timestamp.now(),
      createdBy: input.createdBy,
      updatedAt: Timestamp.now(),
      updatedBy: input.createdBy,
      version: 1,
    },
  };

  // Add optional fields only if they have values (Firestore doesn't accept undefined)
  if (input.alternatePhone) supplier.alternatePhone = input.alternatePhone;
  if (input.taxId) supplier.taxId = input.taxId;
  if (input.bankDetails) supplier.bankDetails = input.bankDetails;
  if (input.creditLimit) supplier.creditLimit = { amount: input.creditLimit, currency: 'UGX' };

  await setDoc(doc(suppliersRef, supplierId), supplier);
  return supplier;
};

const generateSupplierCode = async (category: SupplierCategory): Promise<string> => {
  const categoryPrefix: Record<SupplierCategory, string> = {
    materials: 'MAT',
    equipment: 'EQP',
    services: 'SVC',
    subcontractor: 'SUB',
    other: 'OTH',
  };

  const q = query(
    suppliersRef,
    where('categories', 'array-contains', category)
  );
  const snapshot = await getDocs(q);
  const count = snapshot.size + 1;

  return `${categoryPrefix[category]}-${count.toString().padStart(4, '0')}`;
};

export const updateSupplier = async (
  supplierId: string,
  updates: Partial<Supplier>,
  userId: string
): Promise<void> => {
  const supplierDocRef = doc(suppliersRef, supplierId);
  
  await updateDoc(supplierDocRef, {
    ...updates,
    'audit.updatedAt': serverTimestamp(),
    'audit.updatedBy': userId,
    'audit.version': increment(1),
  });
};

export const getSupplier = async (
  supplierId: string
): Promise<Supplier | null> => {
  const supplierDocRef = doc(suppliersRef, supplierId);
  const snapshot = await getDoc(supplierDocRef);
  
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Supplier;
};

export const deactivateSupplier = async (
  supplierId: string,
  userId: string,
  _reason: string
): Promise<void> => {
  await updateSupplier(supplierId, {
    status: 'inactive',
  }, userId);
};

export const reactivateSupplier = async (
  supplierId: string,
  userId: string
): Promise<void> => {
  await updateSupplier(supplierId, {
    status: 'active',
  }, userId);
};

export const blacklistSupplier = async (
  supplierId: string,
  userId: string,
  _reason: string
): Promise<void> => {
  await updateSupplier(supplierId, {
    status: 'blacklisted',
  }, userId);
};

// ============================================================================
// MATERIAL RATES
// ============================================================================

export const addMaterialRate = async (
  supplierId: string,
  rate: Omit<MaterialRate, 'addedAt' | 'addedBy'>,
  userId: string
): Promise<void> => {
  const supplier = await getSupplier(supplierId);
  if (!supplier) throw new Error('Supplier not found');

  const newRate: MaterialRate = {
    ...rate,
    addedAt: Timestamp.now(),
    addedBy: userId,
  };

  // Add material ID to supplier's materials list if not already there
  const materials = supplier.materials || [];
  if (!materials.includes(rate.materialId)) {
    materials.push(rate.materialId);
  }

  // Store rates in a subcollection or as part of supplier doc
  // For simplicity, we'll store in supplier metadata
  const supplierDocRef = doc(suppliersRef, supplierId);
  await updateDoc(supplierDocRef, {
    materials,
    [`materialRates.${rate.materialId}`]: newRate,
    'audit.updatedAt': serverTimestamp(),
    'audit.updatedBy': userId,
  });
};

export const updateMaterialRate = async (
  supplierId: string,
  materialId: string,
  newPrice: number,
  userId: string,
  effectiveDate?: Date
): Promise<void> => {
  const supplierDocRef = doc(suppliersRef, supplierId);
  
  await updateDoc(supplierDocRef, {
    [`materialRates.${materialId}.unitPrice`]: newPrice,
    [`materialRates.${materialId}.effectiveDate`]: effectiveDate 
      ? Timestamp.fromDate(effectiveDate) 
      : Timestamp.now(),
    [`materialRates.${materialId}.addedAt`]: Timestamp.now(),
    [`materialRates.${materialId}.addedBy`]: userId,
    'audit.updatedAt': serverTimestamp(),
    'audit.updatedBy': userId,
  });
};

export const removeMaterialRate = async (
  supplierId: string,
  materialId: string,
  userId: string
): Promise<void> => {
  const supplier = await getSupplier(supplierId);
  if (!supplier) throw new Error('Supplier not found');

  const materials = (supplier.materials || []).filter(m => m !== materialId);

  const supplierDocRef = doc(suppliersRef, supplierId);
  await updateDoc(supplierDocRef, {
    materials,
    [`materialRates.${materialId}`]: null,
    'audit.updatedAt': serverTimestamp(),
    'audit.updatedBy': userId,
  });
};

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

export const updatePerformanceMetrics = async (
  supplierId: string,
  metrics: {
    orderCompleted?: boolean;
    deliveryOnTime?: boolean;
    qualityPassed?: boolean;
    leadTimeDays?: number;
  },
  userId: string
): Promise<void> => {
  const supplier = await getSupplier(supplierId);
  if (!supplier) throw new Error('Supplier not found');

  const updates: Record<string, any> = {
    'audit.updatedAt': serverTimestamp(),
    'audit.updatedBy': userId,
  };

  // Update order counts
  if (metrics.orderCompleted !== undefined) {
    updates.totalOrders = increment(1);
    if (metrics.orderCompleted) {
      // Track completed orders separately if needed
    }
  }

  // Update on-time delivery rate
  if (metrics.deliveryOnTime !== undefined) {
    // This would need to be calculated based on running totals
    // For now, we increment counters
    if (metrics.deliveryOnTime) {
      updates.onTimeDeliveryRate = increment(1);
    }
  }

  // Update quality score
  if (metrics.qualityPassed !== undefined) {
    if (metrics.qualityPassed) {
      updates.qualityScore = increment(1);
    }
  }

  const supplierDocRef = doc(suppliersRef, supplierId);
  await updateDoc(supplierDocRef, updates);
};

export const calculateSupplierRating = (supplier: Supplier): number => {
  const weights = {
    onTimeDelivery: 0.4,
    quality: 0.3,
    orderCompletion: 0.3,
  };

  const onTimeRate = supplier.onTimeDeliveryRate || 0;
  const qualityRate = supplier.qualityScore || 0;
  const completionRate = supplier.totalOrders > 0 ? 1 : 0;

  const rating = (
    (onTimeRate / 100) * weights.onTimeDelivery +
    (qualityRate / 100) * weights.quality +
    completionRate * weights.orderCompletion
  ) * 5;

  return Math.min(5, Math.max(0, rating));
};

export const getSupplierPerformanceReport = async (
  supplierId: string
): Promise<{
  supplier: Supplier;
  rating: number;
  recommendations: string[];
}> => {
  const supplier = await getSupplier(supplierId);
  if (!supplier) throw new Error('Supplier not found');

  const rating = calculateSupplierRating(supplier);
  const recommendations: string[] = [];

  if ((supplier.onTimeDeliveryRate || 0) < 70) {
    recommendations.push('On-time delivery rate is low. Consider negotiating better delivery schedules.');
  }
  if ((supplier.qualityScore || 0) < 90) {
    recommendations.push('Quality score could be improved. Consider stricter quality requirements.');
  }
  if (rating < 3) {
    recommendations.push('Overall rating is below average. Consider finding alternative suppliers.');
  }

  return {
    supplier,
    rating,
    recommendations,
  };
};

// ============================================================================
// QUERIES
// ============================================================================

export const getSuppliers = async (
  filters?: {
    status?: SupplierStatus;
    category?: string;
    minRating?: number;
  }
): Promise<Supplier[]> => {
  let q = query(suppliersRef, orderBy('name'));

  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }

  const snapshot = await getDocs(q);
  let suppliers = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Supplier[];

  // Client-side filtering
  if (filters?.category) {
    suppliers = suppliers.filter(s => 
      s.categories?.includes(filters.category!)
    );
  }

  if (filters?.minRating) {
    suppliers = suppliers.filter(s => 
      (s.rating || 0) >= filters.minRating!
    );
  }

  return suppliers;
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  return getSuppliers({ status: 'active' });
};

export const getSuppliersByCategory = async (
  category: string
): Promise<Supplier[]> => {
  const q = query(
    suppliersRef,
    where('categories', 'array-contains', category),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Supplier[];
};

export const getSuppliersByMaterial = async (
  materialId: string
): Promise<Supplier[]> => {
  const q = query(
    suppliersRef,
    where('materials', 'array-contains', materialId),
    where('status', '==', 'active')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Supplier[];
};

export const searchSuppliers = async (
  searchTerm: string
): Promise<Supplier[]> => {
  const allSuppliers = await getSuppliers({ status: 'active' });
  const term = searchTerm.toLowerCase();
  
  return allSuppliers.filter(s => 
    s.name.toLowerCase().includes(term) ||
    s.code.toLowerCase().includes(term) ||
    s.contactPerson?.toLowerCase().includes(term) ||
    s.address.city.toLowerCase().includes(term)
  );
};

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export const subscribeToSupplier = (
  supplierId: string,
  callback: (supplier: Supplier | null) => void
): () => void => {
  const supplierDocRef = doc(suppliersRef, supplierId);
  
  return onSnapshot(supplierDocRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as Supplier);
    } else {
      callback(null);
    }
  });
};

export const subscribeToSuppliers = (
  callback: (suppliers: Supplier[]) => void,
  status?: SupplierStatus
): () => void => {
  let q = query(suppliersRef, orderBy('name'));
  
  if (status) {
    q = query(q, where('status', '==', status));
  }

  return onSnapshot(q, (snapshot) => {
    const suppliers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Supplier[];
    callback(suppliers);
  });
};

// ============================================================================
// QUOTATION MANAGEMENT
// ============================================================================

export const createQuotation = async (
  quotation: Omit<SupplierQuotation, 'id' | 'status'>,
  _userId: string
): Promise<string> => {
  const quotationId = generateId('quot');
  const quotationsRef = collection(db, QUOTATIONS_COLLECTION);
  
  const fullQuotation: SupplierQuotation = {
    ...quotation,
    id: quotationId,
    status: 'received',
  };

  await setDoc(doc(quotationsRef, quotationId), fullQuotation);
  return quotationId;
};

export const getSupplierQuotations = async (
  supplierId: string
): Promise<SupplierQuotation[]> => {
  const quotationsRef = collection(db, QUOTATIONS_COLLECTION);
  const q = query(
    quotationsRef,
    where('supplierId', '==', supplierId),
    orderBy('quotationDate', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SupplierQuotation[];
};

// ============================================================================
// RFQ MANAGEMENT
// ============================================================================

export const createRFQ = async (
  rfq: Omit<RequestForQuotation, 'id' | 'status'>,
  _userId: string
): Promise<string> => {
  const rfqId = generateId('rfq');
  const rfqsRef = collection(db, RFQ_COLLECTION);
  
  const fullRFQ: RequestForQuotation = {
    ...rfq,
    id: rfqId,
    status: 'draft',
  };

  await setDoc(doc(rfqsRef, rfqId), fullRFQ);
  return rfqId;
};

export const sendRFQ = async (
  rfqId: string,
  supplierIds: string[],
  userId: string
): Promise<void> => {
  const rfqsRef = collection(db, RFQ_COLLECTION);
  const rfqDocRef = doc(rfqsRef, rfqId);
  
  await updateDoc(rfqDocRef, {
    status: 'sent',
    sentToSuppliers: supplierIds,
    sentAt: Timestamp.now(),
    sentBy: userId,
  });
};

export const supplierService = {
  createSupplier,
  updateSupplier,
  getSupplier,
  deactivateSupplier,
  reactivateSupplier,
  blacklistSupplier,
  addMaterialRate,
  updateMaterialRate,
  removeMaterialRate,
  updatePerformanceMetrics,
  calculateSupplierRating,
  getSupplierPerformanceReport,
  getSuppliers,
  getActiveSuppliers,
  getSuppliersByCategory,
  getSuppliersByMaterial,
  searchSuppliers,
  subscribeToSupplier,
  subscribeToSuppliers,
  createQuotation,
  getSupplierQuotations,
  createRFQ,
  sendRFQ,
};

export default supplierService;
