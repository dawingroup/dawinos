/**
 * Client Portal Service
 * Manages client quotes and procurement approvals
 */

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { nanoid } from 'nanoid';
import { getOrganizationSettings } from '@/core/settings';
import type {
  ClientQuote,
  ClientQuoteFormData,
  ClientQuoteLineItem,
  ClientProcurementItem,
  ClientApprovalResponse,
  ClientPortalData,
  QuoteActivityEntry,
} from '../types/clientPortal';
import type { ConsolidatedEstimate } from '../types/estimate';
import type { DesignProject, DesignItem, ProcurementPricing } from '../types';

/**
 * Generate a unique quote number
 */
function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QT-${year}-${random}`;
}

/**
 * Generate a secure access token
 */
function generateAccessToken(): string {
  return nanoid(32);
}

/**
 * Convert estimate line items to client quote line items
 * Preserves individual line items (no aggregation) - mirrors estimate structure
 */
function convertLineItems(
  estimateItems: ConsolidatedEstimate['lineItems'],
  taxRate: number = 0.18
): ClientQuoteLineItem[] {
  return estimateItems.map((item) => {
    // Determine tax rate ID based on category
    const taxRateId: 'no_vat' | 'standard_vat' | 'exempt' = 
      item.category === 'labor' ? 'no_vat' : 'standard_vat';
    
    // Calculate tax amount for this item
    const taxAmount = taxRateId === 'standard_vat' ? Math.round(item.totalPrice * taxRate) : 0;
    
    // Build line item, excluding undefined values (Firestore doesn't accept undefined)
    const lineItem: ClientQuoteLineItem = {
      id: item.id,
      description: item.description,
      category: item.category || 'material',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      // Discount (default to 0)
      discountPercent: 0,
      discountAmount: 0,
      // Tax
      taxRateId,
      taxAmount,
    };
    
    // Only add optional fields if they have values
    if (item.linkedDesignItemId) lineItem.linkedDesignItemId = item.linkedDesignItemId;
    if (item.linkedMaterialId) lineItem.linkedMaterialId = item.linkedMaterialId;
    if (item.notes) lineItem.notes = item.notes;
    if (item.isManual !== undefined) lineItem.isManual = item.isManual;
    
    return lineItem;
  });
}

/**
 * Fetch procured design items for a project
 */
async function fetchProcuredItems(
  projectId: string
): Promise<Array<DesignItem & { procurement?: ProcurementPricing }>> {
  const itemsRef = collection(db, 'designProjects', projectId, 'designItems');
  const q = query(itemsRef, where('sourcingType', '==', 'PROCURED'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Array<DesignItem & { procurement?: ProcurementPricing }>;
}

/**
 * Convert design items to client procurement items
 */
function convertToProcurementItems(
  items: Array<DesignItem & { procurement?: ProcurementPricing }>
): ClientProcurementItem[] {
  return items
    .filter((item) => item.procurement && item.procurement.totalLandedCost > 0)
    .map((item) => {
      const proc = item.procurement!;
      return {
        id: nanoid(10),
        designItemId: item.id,
        designItemName: item.name,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: proc.quantity || 1,
        unitCost: Math.round(proc.landedCostPerUnit || 0),
        totalCost: Math.round(proc.totalLandedCost),
        currency: proc.targetCurrency || 'UGX',
        vendor: proc.vendor,
        leadTime: proc.logisticsNotes,
        status: 'pending',
      };
    });
}

/**
 * Create a client quote from a project estimate
 */
export async function createClientQuote(
  formData: ClientQuoteFormData,
  estimate: ConsolidatedEstimate,
  project: DesignProject,
  customerName: string,
  customerEmail: string | undefined,
  userId: string
): Promise<ClientQuote> {
  // Fetch procured items for approval
  const procuredItems = await fetchProcuredItems(formData.projectId);
  const procurementItems = convertToProcurementItems(procuredItems);
  
  // Calculate validity date
  const validUntil = Timestamp.fromDate(
    new Date(Date.now() + formData.validityDays * 24 * 60 * 60 * 1000)
  );
  
  // Build quote object, excluding undefined values (Firestore doesn't accept undefined)
  const quote: Omit<ClientQuote, 'id'> = {
    projectId: formData.projectId,
    projectCode: project.code,
    projectName: project.name,
    customerId: formData.customerId,
    customerName,
    ...(customerEmail && { customerEmail }),
    quoteNumber: generateQuoteNumber(),
    title: formData.title,
    ...(formData.description && { description: formData.description }),
    status: 'draft',
    // Convert estimate line items directly (no aggregation)
    lineItems: convertLineItems(estimate.lineItems, estimate.taxRate),
    procurementItems,
    subtotal: estimate.subtotal,
    taxRate: estimate.taxRate,
    taxAmount: estimate.taxAmount,
    total: estimate.total,
    currency: estimate.currency,
    // Include overhead and margin from estimate
    ...(estimate.overheadPercent !== undefined && { overheadPercent: estimate.overheadPercent }),
    ...(estimate.overheadAmount !== undefined && { overheadAmount: estimate.overheadAmount }),
    ...(estimate.marginPercent !== undefined && { marginPercent: estimate.marginPercent }),
    ...(estimate.marginAmount !== undefined && { marginAmount: estimate.marginAmount }),
    totalDiscount: 0, // Default to no discount
    validUntil,
    ...(formData.paymentTerms && { paymentTerms: formData.paymentTerms }),
    ...(formData.depositRequired !== undefined && { depositRequired: formData.depositRequired }),
    ...(formData.depositType && { depositType: formData.depositType }),
    accessToken: generateAccessToken(),
    createdAt: Timestamp.now(),
    createdBy: userId,
    ...(formData.internalNotes && { internalNotes: formData.internalNotes }),
    version: 1,
  };
  
  // Save to Firestore
  const quotesRef = collection(db, 'clientQuotes');
  const docRef = await addDoc(quotesRef, {
    ...quote,
    createdAt: serverTimestamp(),
  });
  
  // Log activity
  await logQuoteActivity(docRef.id, 'created', userId);
  
  return {
    id: docRef.id,
    ...quote,
  };
}

/**
 * Get a quote by ID
 */
export async function getQuote(quoteId: string): Promise<ClientQuote | null> {
  const quoteRef = doc(db, 'clientQuotes', quoteId);
  const snapshot = await getDoc(quoteRef);
  
  if (!snapshot.exists()) {
    return null;
  }
  
  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as ClientQuote;
}

/**
 * Get a quote by access token (for public client access)
 */
export async function getQuoteByToken(
  accessToken: string
): Promise<ClientQuote | null> {
  const quotesRef = collection(db, 'clientQuotes');
  const q = query(quotesRef, where('accessToken', '==', accessToken));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  } as ClientQuote;
}

/**
 * Get client portal data (public-facing, excludes sensitive fields)
 */
export async function getClientPortalData(
  accessToken: string
): Promise<ClientPortalData | null> {
  const quote = await getQuoteByToken(accessToken);
  
  if (!quote) {
    return null;
  }
  
  // Fetch organization settings for logo and company info
  let orgSettings = null;
  try {
    orgSettings = await getOrganizationSettings();
  } catch (err) {
    console.warn('Failed to fetch organization settings:', err);
  }
  
  // Check if expired
  const now = Timestamp.now();
  const isExpired = quote.validUntil.toMillis() < now.toMillis();
  
  // Mark as viewed if first time
  if (quote.status === 'sent' && !quote.viewedAt) {
    await updateDoc(doc(db, 'clientQuotes', quote.id), {
      status: 'viewed',
      viewedAt: serverTimestamp(),
    });
    await logQuoteActivity(quote.id, 'viewed');
  }
  
  // Can approve if not already responded and not expired
  const canApprove = 
    !isExpired && 
    ['sent', 'viewed'].includes(quote.status) &&
    !quote.clientResponse;
  
  // Remove sensitive fields
  const { accessToken: _, internalNotes: __, ...publicQuote } = quote;
  
  // Get Dawin Finishes subsidiary branding
  const dawinFinishesBranding = orgSettings?.branding?.subsidiaries?.['dawin-finishes'];
  
  return {
    quote: publicQuote,
    companyInfo: {
      name: orgSettings?.info?.name || 'Dawin Finishes',
      email: orgSettings?.info?.email || 'info@dawinfinishes.com',
      phone: orgSettings?.info?.phone || '+256 700 000 000',
      website: dawinFinishesBranding?.website || orgSettings?.info?.website || 'https://dawinfinishes.com',
      logoUrl: dawinFinishesBranding?.logoUrl || undefined,
    },
    canApprove,
    isExpired,
  };
}

/**
 * Send quote to client (update status and generate access URL)
 */
export async function sendQuoteToClient(
  quoteId: string,
  userId: string,
  baseUrl: string = window.location.origin
): Promise<{ accessUrl: string }> {
  const quote = await getQuote(quoteId);
  
  if (!quote) {
    throw new Error('Quote not found');
  }
  
  const accessUrl = `${baseUrl}/client-portal/${quote.accessToken}`;
  
  await updateDoc(doc(db, 'clientQuotes', quoteId), {
    status: 'sent',
    sentAt: serverTimestamp(),
    accessUrl,
  });
  
  await logQuoteActivity(quoteId, 'sent', userId);
  
  return { accessUrl };
}

/**
 * Process client approval response
 */
export async function processClientResponse(
  accessToken: string,
  response: ClientApprovalResponse,
  clientInfo?: { name?: string; email?: string; ipAddress?: string; userAgent?: string }
): Promise<void> {
  const quote = await getQuoteByToken(accessToken);
  
  if (!quote) {
    throw new Error('Quote not found');
  }
  
  // Check if already responded
  if (quote.clientResponse) {
    throw new Error('Quote has already been responded to');
  }
  
  // Check if expired
  const now = Timestamp.now();
  if (quote.validUntil.toMillis() < now.toMillis()) {
    throw new Error('Quote has expired');
  }
  
  // Update procurement items if provided
  let procurementItems = quote.procurementItems;
  if (response.procurementApprovals) {
    procurementItems = quote.procurementItems.map((item) => {
      const approval = response.procurementApprovals?.find(
        (a) => a.itemId === item.id
      );
      if (approval) {
        return {
          ...item,
          status: approval.status,
          clientNotes: approval.notes,
          ...(approval.status === 'approved' && { approvedAt: Timestamp.now() }),
          ...(approval.status === 'rejected' && { rejectedAt: Timestamp.now() }),
          ...(approval.status === 'revision' && { revisionRequestedAt: Timestamp.now() }),
        };
      }
      return item;
    });
  }
  
  // Map response action to quote status
  const statusMap: Record<string, ClientQuote['status']> = {
    approve: 'approved',
    reject: 'rejected',
    revision: 'revision',
  };
  
  await updateDoc(doc(db, 'clientQuotes', quote.id), {
    status: statusMap[response.action],
    respondedAt: serverTimestamp(),
    procurementItems,
    clientResponse: {
      status: response.action === 'approve' ? 'approved' : 
              response.action === 'reject' ? 'rejected' : 'revision',
      notes: response.notes,
      respondedAt: Timestamp.now(),
      respondedBy: clientInfo?.name || clientInfo?.email,
      signature: response.signature,
    },
  });
  
  await logQuoteActivity(
    quote.id,
    response.action === 'approve' ? 'approved' : 
    response.action === 'reject' ? 'rejected' : 'revision',
    undefined,
    response.notes,
    clientInfo?.ipAddress,
    clientInfo?.userAgent
  );
}

/**
 * Get quotes for a project
 */
export async function getQuotesForProject(
  projectId: string
): Promise<ClientQuote[]> {
  const quotesRef = collection(db, 'clientQuotes');
  const q = query(
    quotesRef,
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ClientQuote[];
}

/**
 * Get quotes for a customer
 */
export async function getQuotesForCustomer(
  customerId: string
): Promise<ClientQuote[]> {
  const quotesRef = collection(db, 'clientQuotes');
  const q = query(
    quotesRef,
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as ClientQuote[];
}

/**
 * Update quote (before sending)
 */
export async function updateQuote(
  quoteId: string,
  updates: Partial<Pick<ClientQuote, 'title' | 'description' | 'paymentTerms' | 'depositRequired' | 'depositType' | 'internalNotes' | 'lineItems'>>,
  userId: string
): Promise<void> {
  const quote = await getQuote(quoteId);
  
  if (!quote) {
    throw new Error('Quote not found');
  }
  
  if (quote.status !== 'draft') {
    throw new Error('Cannot update a quote that has already been sent');
  }
  
  // Recalculate totals if line items changed
  let totals = {};
  if (updates.lineItems) {
    const subtotal = updates.lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * quote.taxRate);
    totals = {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }
  
  // Filter out undefined values to prevent Firestore errors
  const cleanUpdates: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });
  
  await updateDoc(doc(db, 'clientQuotes', quoteId), {
    ...cleanUpdates,
    ...totals,
    version: quote.version + 1,
    updatedAt: serverTimestamp(),
    updatedBy: userId,
  });
  
  await logQuoteActivity(quoteId, 'updated', userId);
}

/**
 * Log quote activity
 */
async function logQuoteActivity(
  quoteId: string,
  action: QuoteActivityEntry['action'],
  performedBy?: string,
  details?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const activityRef = collection(db, 'clientQuotes', quoteId, 'activity');
  
  // Build activity object, excluding undefined values (Firestore doesn't accept undefined)
  const activity: Record<string, unknown> = {
    quoteId,
    action,
    timestamp: serverTimestamp(),
  };
  
  if (performedBy) activity.performedBy = performedBy;
  if (details) activity.details = details;
  if (ipAddress) activity.ipAddress = ipAddress;
  if (userAgent) activity.userAgent = userAgent;
  
  await addDoc(activityRef, activity);
}

/**
 * Get quote activity log
 */
export async function getQuoteActivity(
  quoteId: string
): Promise<QuoteActivityEntry[]> {
  const activityRef = collection(db, 'clientQuotes', quoteId, 'activity');
  const q = query(activityRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as QuoteActivityEntry[];
}

/**
 * Regenerate access token (if compromised)
 */
export async function regenerateAccessToken(
  quoteId: string,
  userId: string
): Promise<string> {
  const { deleteField } = await import('firebase/firestore');
  const newToken = generateAccessToken();
  
  await updateDoc(doc(db, 'clientQuotes', quoteId), {
    accessToken: newToken,
    accessUrl: deleteField(), // Clear old URL
  });
  
  await logQuoteActivity(quoteId, 'updated', userId, 'Access token regenerated');
  
  return newToken;
}

/**
 * Delete a quote (only draft quotes can be deleted)
 */
export async function deleteQuote(
  quoteId: string,
  userId: string
): Promise<void> {
  const quote = await getQuote(quoteId);
  
  if (!quote) {
    throw new Error('Quote not found');
  }
  
  if (quote.status !== 'draft') {
    throw new Error('Only draft quotes can be deleted');
  }
  
  // Delete the quote document
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'clientQuotes', quoteId));
}

/**
 * Check and expire old quotes
 */
export async function expireOldQuotes(): Promise<number> {
  const quotesRef = collection(db, 'clientQuotes');
  const q = query(
    quotesRef,
    where('status', 'in', ['sent', 'viewed']),
    where('validUntil', '<', Timestamp.now())
  );
  const snapshot = await getDocs(q);
  
  let count = 0;
  for (const docSnap of snapshot.docs) {
    await updateDoc(doc(db, 'clientQuotes', docSnap.id), {
      status: 'expired',
    });
    await logQuoteActivity(docSnap.id, 'expired');
    count++;
  }
  
  return count;
}
