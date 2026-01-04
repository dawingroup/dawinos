/**
 * REQUISITION SERVICE
 * 
 * Requisition and accountability operations for direct implementation projects.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';
import {
  Requisition,
  RequisitionFormData,
  RequisitionItem,
  AccountabilityStatus,
  calculateRequisitionTotal,
} from '../types/requisition';
import {
  Accountability,
  AccountabilityFormData,
  AccountabilityExpense,
  calculateReceiptsSummary,
  calculateTotalExpenses,
  calculateBalanceDue,
} from '../types/accountability';

// ─────────────────────────────────────────────────────────────────
// COLLECTION PATHS
// ─────────────────────────────────────────────────────────────────

const PAYMENTS_PATH = 'payments';
const PROJECTS_PATH = 'projects';

// ─────────────────────────────────────────────────────────────────
// REQUISITION SERVICE
// ─────────────────────────────────────────────────────────────────

export class RequisitionService {
  private static instance: RequisitionService;
  private db: Firestore;

  private constructor(db: Firestore) {
    this.db = db;
  }

  static getInstance(db: Firestore): RequisitionService {
    if (!RequisitionService.instance) {
      RequisitionService.instance = new RequisitionService(db);
    }
    return RequisitionService.instance;
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE REQUISITION
  // ─────────────────────────────────────────────────────────────────

  async createRequisition(
    data: RequisitionFormData,
    userId: string
  ): Promise<string> {
    // Get project details
    const projectDoc = await getDoc(doc(this.db, PROJECTS_PATH, data.projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }

    const projectData = projectDoc.data();

    // Validate implementation type
    if (projectData.implementationType === 'contractor') {
      throw new Error('Requisitions are for direct implementation projects');
    }

    // Get requisition count for numbering
    const existingReqs = await this.getProjectRequisitions(data.projectId);
    const sequence = existingReqs.length + 1;

    // Add IDs to items
    const items: RequisitionItem[] = data.items.map((item, index) => ({
      ...item,
      id: `item-${Date.now()}-${index}`,
    }));

    const totalAmount = calculateRequisitionTotal(items);

    // Build requisition document
    const requisition: Omit<Requisition, 'id'> = {
      projectId: data.projectId,
      programId: projectData.programId,
      engagementId: projectData.engagementId,

      paymentType: 'requisition',
      paymentNumber: `REQ-${projectData.projectCode}-${sequence.toString().padStart(3, '0')}`,
      requisitionNumber: `REQ-${projectData.projectCode}-${sequence.toString().padStart(3, '0')}`,

      purpose: data.purpose,
      budgetLineId: data.budgetLineId,
      budgetLineName: '', // Would be fetched from budget
      budgetLineBalance: 0, // Would be fetched from budget

      items,
      advanceType: data.advanceType,
      expectedReturnDate: data.expectedReturnDate,

      currency: projectData.budget.currency,
      grossAmount: totalAmount,
      deductions: [],
      netAmount: totalAmount,

      accountabilityStatus: 'pending',
      accountabilityDueDate: data.accountabilityDueDate,
      linkedAccountabilityIds: [],
      unaccountedAmount: totalAmount,

      status: 'draft',
      currentApprovalLevel: 0,
      approvalChain: [],
      supportingDocs: [],

      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(this.db, PAYMENTS_PATH), requisition);
    return docRef.id;
  }

  // ─────────────────────────────────────────────────────────────────
  // READ OPERATIONS
  // ─────────────────────────────────────────────────────────────────

  async getRequisition(requisitionId: string): Promise<Requisition | null> {
    const docRef = doc(this.db, PAYMENTS_PATH, requisitionId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (data.paymentType !== 'requisition') {
      return null;
    }

    return { id: snapshot.id, ...data } as Requisition;
  }

  async getProjectRequisitions(projectId: string): Promise<Requisition[]> {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('projectId', '==', projectId),
      where('paymentType', '==', 'requisition'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requisition));
  }

  async getPendingAccountabilities(projectId: string): Promise<Requisition[]> {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('projectId', '==', projectId),
      where('paymentType', '==', 'requisition'),
      where('accountabilityStatus', 'in', ['pending', 'partial', 'overdue']),
      orderBy('accountabilityDueDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Requisition));
  }

  // ─────────────────────────────────────────────────────────────────
  // CREATE ACCOUNTABILITY
  // ─────────────────────────────────────────────────────────────────

  async createAccountability(
    data: AccountabilityFormData,
    userId: string
  ): Promise<string> {
    // Get requisition
    const requisition = await this.getRequisition(data.requisitionId);
    if (!requisition) {
      throw new Error('Requisition not found');
    }

    if (requisition.status !== 'paid') {
      throw new Error('Accountability can only be created for paid requisitions');
    }

    // Get existing accountabilities for this requisition
    const existingAccounts = await this.getRequisitionAccountabilities(data.requisitionId);
    const sequence = existingAccounts.length + 1;

    // Add IDs and status to expenses
    const expenses: AccountabilityExpense[] = data.expenses.map((expense, index) => ({
      ...expense,
      id: `exp-${Date.now()}-${index}`,
      status: 'pending',
    }));

    const totalExpenses = calculateTotalExpenses(expenses);
    const balanceDue = calculateBalanceDue(
      totalExpenses,
      requisition.grossAmount,
      data.unspentReturned
    );
    const receiptsSummary = calculateReceiptsSummary(expenses);

    // Build accountability document
    const accountability: Omit<Accountability, 'id'> = {
      projectId: requisition.projectId,
      programId: requisition.programId,
      engagementId: requisition.engagementId,

      paymentType: 'accountability',
      paymentNumber: `ACC-${requisition.requisitionNumber.replace('REQ-', '')}-${sequence.toString().padStart(2, '0')}`,

      requisitionId: data.requisitionId,
      requisitionNumber: requisition.requisitionNumber,
      requisitionAmount: requisition.grossAmount,

      expenses,
      totalExpenses,
      unspentReturned: data.unspentReturned,
      balanceDue,
      receiptsSummary,

      currency: requisition.currency,
      grossAmount: totalExpenses,
      deductions: [],
      netAmount: balanceDue > 0 ? balanceDue : 0,

      status: 'draft',
      currentApprovalLevel: 0,
      approvalChain: [],
      supportingDocs: [],

      createdAt: Timestamp.now(),
      createdBy: userId,
      updatedAt: Timestamp.now(),
      updatedBy: userId,
    };

    const docRef = await addDoc(collection(this.db, PAYMENTS_PATH), accountability);

    // Link accountability to requisition
    await updateDoc(doc(this.db, PAYMENTS_PATH, data.requisitionId), {
      linkedAccountabilityIds: [...requisition.linkedAccountabilityIds, docRef.id],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    return docRef.id;
  }

  // ─────────────────────────────────────────────────────────────────
  // ACCOUNTABILITY OPERATIONS
  // ─────────────────────────────────────────────────────────────────

  async getAccountability(accountabilityId: string): Promise<Accountability | null> {
    const docRef = doc(this.db, PAYMENTS_PATH, accountabilityId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (data.paymentType !== 'accountability') {
      return null;
    }

    return { id: snapshot.id, ...data } as Accountability;
  }

  async getRequisitionAccountabilities(requisitionId: string): Promise<Accountability[]> {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('requisitionId', '==', requisitionId),
      where('paymentType', '==', 'accountability'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Accountability));
  }

  async verifyExpense(
    accountabilityId: string,
    expenseId: string,
    userId: string,
    approved: boolean,
    rejectionReason?: string
  ): Promise<void> {
    const accountability = await this.getAccountability(accountabilityId);
    if (!accountability) {
      throw new Error('Accountability not found');
    }

    const expenseIndex = accountability.expenses.findIndex(e => e.id === expenseId);
    if (expenseIndex === -1) {
      throw new Error('Expense not found');
    }

    const updatedExpenses = [...accountability.expenses];
    updatedExpenses[expenseIndex] = {
      ...updatedExpenses[expenseIndex],
      status: approved ? 'verified' : 'rejected',
      rejectionReason: approved ? undefined : rejectionReason,
    };

    const receiptsSummary = calculateReceiptsSummary(updatedExpenses);

    const docRef = doc(this.db, PAYMENTS_PATH, accountabilityId);
    await updateDoc(docRef, {
      expenses: updatedExpenses,
      receiptsSummary,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async completeVerification(
    accountabilityId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const accountability = await this.getAccountability(accountabilityId);
    if (!accountability) {
      throw new Error('Accountability not found');
    }

    const docRef = doc(this.db, PAYMENTS_PATH, accountabilityId);
    await updateDoc(docRef, {
      verifiedBy: userId,
      verifiedAt: Timestamp.now(),
      verificationNotes: notes,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Update requisition accountability status
    await this.updateRequisitionAccountabilityStatus(
      accountability.requisitionId,
      userId
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  private async updateRequisitionAccountabilityStatus(
    requisitionId: string,
    userId: string
  ): Promise<void> {
    const requisition = await this.getRequisition(requisitionId);
    if (!requisition) return;

    const accountabilities = await this.getRequisitionAccountabilities(requisitionId);
    const approvedAccountabilities = accountabilities.filter(
      a => a.status === 'approved' || a.status === 'paid'
    );

    const totalAccounted = approvedAccountabilities.reduce(
      (sum, a) => sum + a.totalExpenses + a.unspentReturned, 0
    );

    let newStatus: AccountabilityStatus;
    const unaccountedAmount = requisition.grossAmount - totalAccounted;

    if (unaccountedAmount <= 0) {
      newStatus = 'complete';
    } else if (totalAccounted > 0) {
      newStatus = 'partial';
    } else if (new Date(requisition.accountabilityDueDate) < new Date()) {
      newStatus = 'overdue';
    } else {
      newStatus = 'pending';
    }

    const docRef = doc(this.db, PAYMENTS_PATH, requisitionId);
    await updateDoc(docRef, {
      accountabilityStatus: newStatus,
      unaccountedAmount: Math.max(0, unaccountedAmount),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }
}

// Export singleton factory
export function getRequisitionService(db: Firestore): RequisitionService {
  return RequisitionService.getInstance(db);
}
