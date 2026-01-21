/**
 * MANUAL REQUISITION SERVICE
 *
 * Service for managing manually entered requisitions from backlog.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  Firestore,
  limit,
} from 'firebase/firestore';
import {
  ManualRequisition,
  ManualRequisitionFormData,
  ManualAccountabilityEntry,
  ManualRequisitionStatus,
  LinkToProjectData,
  LinkToRequisitionData,
  AcknowledgementDocument,
  AcknowledgementFormData,
  calculateManualAccountedTotal,
  calculateManualAccountabilityStatus,
} from '../types/manual-requisition';
import { AccountabilityStatus } from '../types/requisition';

// ─────────────────────────────────────────────────────────────────
// COLLECTION PATH
// ─────────────────────────────────────────────────────────────────

const MANUAL_REQUISITIONS_PATH = 'manual_requisitions';

// ─────────────────────────────────────────────────────────────────
// MANUAL REQUISITION SERVICE
// ─────────────────────────────────────────────────────────────────

export class ManualRequisitionService {
  private static instance: ManualRequisitionService;
  private db: Firestore;

  private constructor(db: Firestore) {
    this.db = db;
  }

  static getInstance(db: Firestore): ManualRequisitionService {
    if (!ManualRequisitionService.instance) {
      ManualRequisitionService.instance = new ManualRequisitionService(db);
    }
    return ManualRequisitionService.instance;
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────

  async createManualRequisition(
    data: ManualRequisitionFormData,
    userId: string,
    userName?: string
  ): Promise<string> {
    // Generate reference number
    const existingCount = await this.getRequisitionCount();
    const referenceNumber = data.referenceNumber ||
      `MAN-REQ-${new Date().getFullYear()}-${(existingCount + 1).toString().padStart(4, '0')}`;

    // Add IDs to accountability entries
    const accountabilities: ManualAccountabilityEntry[] = data.accountabilities.map((acc, index) => ({
      ...acc,
      id: `macc-${Date.now()}-${index}`,
    }));

    const totalAccountedAmount = calculateManualAccountedTotal(accountabilities);
    const unaccountedAmount = data.amount - totalAccountedAmount;

    // Determine link status
    let linkStatus: ManualRequisitionStatus = 'unlinked';
    if (data.linkedProjectId) {
      linkStatus = 'linked';
    }

    // Build manual requisition document
    const manualRequisition: Omit<ManualRequisition, 'id'> = {
      referenceNumber,
      description: data.description,
      purpose: data.purpose,

      currency: data.currency,
      amount: data.amount,

      requisitionDate: data.requisitionDate,
      paidDate: data.paidDate,
      accountabilityDueDate: data.accountabilityDueDate,

      accountabilityStatus: data.accountabilityStatus ||
        calculateManualAccountabilityStatus(data.amount, totalAccountedAmount, data.accountabilityDueDate),
      accountabilities,
      totalAccountedAmount,
      unaccountedAmount: Math.max(0, unaccountedAmount),

      advanceType: data.advanceType,

      linkStatus,
      linkedProjectId: data.linkedProjectId,
      linkedProgramId: data.linkedProgramId,

      sourceDocument: data.sourceDocument,
      sourceReference: data.sourceReference,
      notes: data.notes,

      createdAt: Timestamp.now(),
      createdBy: userId,
      createdByName: userName,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(this.db, MANUAL_REQUISITIONS_PATH), manualRequisition);
    return docRef.id;
  }

  // ─────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────

  async getManualRequisition(id: string): Promise<ManualRequisition | null> {
    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as ManualRequisition;
  }

  async getAllManualRequisitions(options?: {
    linkStatus?: ManualRequisitionStatus;
    accountabilityStatus?: AccountabilityStatus;
    linkedProjectId?: string;
    limitCount?: number;
  }): Promise<ManualRequisition[]> {
    let q = query(
      collection(this.db, MANUAL_REQUISITIONS_PATH),
      orderBy('requisitionDate', 'desc')
    );

    // Note: Firestore doesn't support multiple inequality filters
    // For complex filtering, we filter in memory after fetching
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualRequisition));

    // Apply filters
    if (options?.linkStatus) {
      results = results.filter(r => r.linkStatus === options.linkStatus);
    }
    if (options?.accountabilityStatus) {
      results = results.filter(r => r.accountabilityStatus === options.accountabilityStatus);
    }
    if (options?.linkedProjectId) {
      results = results.filter(r => r.linkedProjectId === options.linkedProjectId);
    }
    if (options?.limitCount) {
      results = results.slice(0, options.limitCount);
    }

    return results;
  }

  async getUnlinkedRequisitions(): Promise<ManualRequisition[]> {
    const q = query(
      collection(this.db, MANUAL_REQUISITIONS_PATH),
      where('linkStatus', '==', 'unlinked'),
      orderBy('requisitionDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualRequisition));
  }

  async getProjectManualRequisitions(projectId: string): Promise<ManualRequisition[]> {
    const q = query(
      collection(this.db, MANUAL_REQUISITIONS_PATH),
      where('linkedProjectId', '==', projectId),
      orderBy('requisitionDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualRequisition));
  }

  private async getRequisitionCount(): Promise<number> {
    const snapshot = await getDocs(collection(this.db, MANUAL_REQUISITIONS_PATH));
    return snapshot.size;
  }

  // ─────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────

  async updateManualRequisition(
    id: string,
    data: Partial<ManualRequisitionFormData>,
    userId: string
  ): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    const updates: Partial<ManualRequisition> = {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    // Recalculate totals if accountabilities changed
    if (data.accountabilities) {
      const accountabilities: ManualAccountabilityEntry[] = data.accountabilities.map((acc, index) => ({
        ...acc,
        id: acc.id || `macc-${Date.now()}-${index}`,
      } as ManualAccountabilityEntry));

      const totalAccountedAmount = calculateManualAccountedTotal(accountabilities);
      const amount = data.amount ?? existing.amount;
      const unaccountedAmount = amount - totalAccountedAmount;

      updates.accountabilities = accountabilities;
      updates.totalAccountedAmount = totalAccountedAmount;
      updates.unaccountedAmount = Math.max(0, unaccountedAmount);
      updates.accountabilityStatus = calculateManualAccountabilityStatus(
        amount,
        totalAccountedAmount,
        data.accountabilityDueDate ?? existing.accountabilityDueDate
      );
    }

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, updates as any);
  }

  async saveAcknowledgement(
    id: string,
    acknowledgementData: AcknowledgementFormData,
    userId: string
  ): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    const acknowledgement: AcknowledgementDocument = {
      id: `ack-${Date.now()}`,
      amountReceived: acknowledgementData.amountReceived,
      dateReceived: acknowledgementData.dateReceived,
      receivedBy: acknowledgementData.receivedBy,
      receivedByEmail: acknowledgementData.receivedByEmail,
      receivedByTitle: acknowledgementData.receivedByTitle,
      signatureHtml: acknowledgementData.signatureHtml,
      notes: acknowledgementData.notes,
      generatedAt: Timestamp.now(),
      generatedBy: userId,
    };

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, {
      acknowledgement,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async addAccountability(
    id: string,
    accountability: Omit<ManualAccountabilityEntry, 'id'>,
    userId: string
  ): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    const newAccountability: ManualAccountabilityEntry = {
      ...accountability,
      id: `macc-${Date.now()}`,
    };

    const accountabilities = [...existing.accountabilities, newAccountability];
    const totalAccountedAmount = calculateManualAccountedTotal(accountabilities);
    const unaccountedAmount = existing.amount - totalAccountedAmount;

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, {
      accountabilities,
      totalAccountedAmount,
      unaccountedAmount: Math.max(0, unaccountedAmount),
      accountabilityStatus: calculateManualAccountabilityStatus(
        existing.amount,
        totalAccountedAmount,
        existing.accountabilityDueDate
      ),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // LINKING OPERATIONS
  // ─────────────────────────────────────────────────────────────────

  async linkToProject(
    id: string,
    data: LinkToProjectData,
    userId: string
  ): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, {
      linkStatus: 'linked',
      linkedProjectId: data.projectId,
      linkedProjectName: data.projectName,
      linkedProgramId: data.programId,
      linkedProgramName: data.programName,
      linkingNotes: data.linkingNotes,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async linkToRequisition(
    id: string,
    data: LinkToRequisitionData,
    userId: string
  ): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    if (existing.linkStatus === 'unlinked') {
      throw new Error('Manual requisition must be linked to a project first');
    }

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, {
      linkStatus: 'reconciled',
      linkedRequisitionId: data.requisitionId,
      linkedRequisitionNumber: data.requisitionNumber,
      linkingNotes: data.linkingNotes || existing.linkingNotes,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async unlinkFromProject(id: string, userId: string): Promise<void> {
    const existing = await this.getManualRequisition(id);
    if (!existing) {
      throw new Error('Manual requisition not found');
    }

    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await updateDoc(docRef, {
      linkStatus: 'unlinked',
      linkedProjectId: null,
      linkedProjectName: null,
      linkedProgramId: null,
      linkedProgramName: null,
      linkedRequisitionId: null,
      linkedRequisitionNumber: null,
      linkingNotes: null,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────

  async deleteManualRequisition(id: string): Promise<void> {
    const docRef = doc(this.db, MANUAL_REQUISITIONS_PATH, id);
    await deleteDoc(docRef);
  }

  // ─────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────

  async getBacklogSummary(): Promise<{
    total: number;
    unlinked: number;
    linked: number;
    reconciled: number;
    totalAmount: number;
    totalAccountedAmount: number;
    totalUnaccountedAmount: number;
    overdueCount: number;
  }> {
    const all = await this.getAllManualRequisitions();

    return {
      total: all.length,
      unlinked: all.filter(r => r.linkStatus === 'unlinked').length,
      linked: all.filter(r => r.linkStatus === 'linked').length,
      reconciled: all.filter(r => r.linkStatus === 'reconciled').length,
      totalAmount: all.reduce((sum, r) => sum + r.amount, 0),
      totalAccountedAmount: all.reduce((sum, r) => sum + r.totalAccountedAmount, 0),
      totalUnaccountedAmount: all.reduce((sum, r) => sum + r.unaccountedAmount, 0),
      overdueCount: all.filter(r => r.accountabilityStatus === 'overdue').length,
    };
  }
}

// Export singleton factory
export function getManualRequisitionService(db: Firestore): ManualRequisitionService {
  return ManualRequisitionService.getInstance(db);
}
