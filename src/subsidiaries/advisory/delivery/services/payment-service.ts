/**
 * PAYMENT SERVICE
 * 
 * Unified payment operations for all payment types.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  increment,
  QueryConstraint,
  Firestore,
} from 'firebase/firestore';
import {
  Payment,
  PaymentStatus,
  PaymentType,
  PaymentSummary,
  ApprovalStep,
} from '../types/payment';

// ─────────────────────────────────────────────────────────────────
// COLLECTION PATHS
// ─────────────────────────────────────────────────────────────────

const PAYMENTS_PATH = 'payments';
const PROJECTS_PATH = 'projects';

// ─────────────────────────────────────────────────────────────────
// PAYMENT SERVICE
// ─────────────────────────────────────────────────────────────────

export class PaymentService {
  private static instance: PaymentService;
  private db: Firestore;

  private constructor(db: Firestore) {
    this.db = db;
  }

  static getInstance(db: Firestore): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService(db);
    }
    return PaymentService.instance;
  }

  // ─────────────────────────────────────────────────────────────────
  // READ OPERATIONS
  // ─────────────────────────────────────────────────────────────────

  async getPayment(paymentId: string): Promise<Payment | null> {
    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    return { id: snapshot.id, ...snapshot.data() } as Payment;
  }

  async getPaymentsByProject(
    projectId: string,
    options: {
      paymentType?: PaymentType;
      status?: PaymentStatus[];
      limitCount?: number;
    } = {}
  ): Promise<Payment[]> {
    const constraints: QueryConstraint[] = [
      where('projectId', '==', projectId),
    ];

    if (options.paymentType) {
      constraints.push(where('paymentType', '==', options.paymentType));
    }

    if (options.status?.length) {
      constraints.push(where('status', 'in', options.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(collection(this.db, PAYMENTS_PATH), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];
  }

  async getPaymentsByProgram(
    programId: string,
    options: {
      status?: PaymentStatus[];
      paymentType?: PaymentType;
    } = {}
  ): Promise<Payment[]> {
    const constraints: QueryConstraint[] = [
      where('programId', '==', programId),
    ];

    if (options.status?.length) {
      constraints.push(where('status', 'in', options.status));
    }

    if (options.paymentType) {
      constraints.push(where('paymentType', '==', options.paymentType));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(collection(this.db, PAYMENTS_PATH), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];
  }

  async getPendingApprovals(
    userRole: string
  ): Promise<Payment[]> {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('status', 'in', ['submitted', 'under_review']),
      orderBy('submittedAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const payments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Payment[];

    // Filter for user's approval level
    return payments.filter(p => {
      const currentStep = p.approvalChain[p.currentApprovalLevel];
      return currentStep?.role === userRole && currentStep?.status === 'pending';
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // SUBSCRIPTIONS
  // ─────────────────────────────────────────────────────────────────

  subscribeToProjectPayments(
    projectId: string,
    callback: (payments: Payment[]) => void
  ): () => void {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('projectId', '==', projectId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Payment[];
      callback(payments);
    });
  }

  subscribeToPendingApprovals(
    userRole: string,
    callback: (payments: Payment[]) => void
  ): () => void {
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('status', 'in', ['submitted', 'under_review']),
      orderBy('submittedAt', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Payment))
        .filter(p => {
          const currentStep = p.approvalChain[p.currentApprovalLevel];
          return currentStep?.role === userRole && currentStep?.status === 'pending';
        });
      callback(payments);
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // APPROVAL WORKFLOW
  // ─────────────────────────────────────────────────────────────────

  async submitForApproval(
    paymentId: string,
    userId: string
  ): Promise<void> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'draft') {
      throw new Error('Only draft payments can be submitted');
    }

    // Build approval chain based on payment type and amount
    const approvalChain = await this.buildApprovalChain(payment);

    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    await updateDoc(docRef, {
      status: 'submitted',
      submittedAt: Timestamp.now(),
      approvalChain,
      currentApprovalLevel: 0,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async approvePayment(
    paymentId: string,
    userId: string,
    userName: string,
    comments?: string
  ): Promise<void> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!['submitted', 'under_review'].includes(payment.status)) {
      throw new Error('Payment cannot be approved in current status');
    }

    const currentLevel = payment.currentApprovalLevel;
    const approvalChain = [...payment.approvalChain];

    // Update current step
    approvalChain[currentLevel] = {
      ...approvalChain[currentLevel],
      status: 'approved',
      userId,
      userName,
      timestamp: Timestamp.now(),
      comments,
    };

    // Determine next status
    const isLastLevel = currentLevel === approvalChain.length - 1;
    const newStatus: PaymentStatus = isLastLevel ? 'approved' : 'under_review';
    const newLevel = isLastLevel ? currentLevel : currentLevel + 1;

    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    await updateDoc(docRef, {
      status: newStatus,
      approvalChain,
      currentApprovalLevel: newLevel,
      ...(isLastLevel ? { approvedAt: Timestamp.now() } : {}),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // If fully approved, update project budget
    if (isLastLevel) {
      await this.updateProjectBudget(payment.projectId, payment.netAmount, userId);
    }
  }

  async rejectPayment(
    paymentId: string,
    userId: string,
    userName: string,
    reason: string
  ): Promise<void> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (!['submitted', 'under_review'].includes(payment.status)) {
      throw new Error('Payment cannot be rejected in current status');
    }

    const approvalChain = [...payment.approvalChain];
    approvalChain[payment.currentApprovalLevel] = {
      ...approvalChain[payment.currentApprovalLevel],
      status: 'rejected',
      userId,
      userName,
      timestamp: Timestamp.now(),
      comments: reason,
    };

    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    await updateDoc(docRef, {
      status: 'rejected',
      approvalChain,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async returnPayment(
    paymentId: string,
    userId: string,
    _reason: string
  ): Promise<void> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    await updateDoc(docRef, {
      status: 'draft',
      currentApprovalLevel: 0,
      approvalChain: [],
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  async markAsPaid(
    paymentId: string,
    userId: string
  ): Promise<void> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'approved') {
      throw new Error('Only approved payments can be marked as paid');
    }

    const docRef = doc(this.db, PAYMENTS_PATH, paymentId);
    await updateDoc(docRef, {
      status: 'paid',
      paidAt: Timestamp.now(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PAYMENT SUMMARY
  // ─────────────────────────────────────────────────────────────────

  async getPaymentSummary(projectId: string): Promise<PaymentSummary> {
    const payments = await this.getPaymentsByProject(projectId);

    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p =>
      ['submitted', 'under_review', 'approved'].includes(p.status)
    );

    const retentionHeld = paidPayments.reduce((sum, p) => {
      const retention = p.deductions.find(d => d.type === 'retention');
      return sum + (retention?.amount || 0);
    }, 0);

    return {
      projectId,
      totalPaid: paidPayments.reduce((sum, p) => sum + p.netAmount, 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + p.netAmount, 0),
      pendingCount: pendingPayments.length,
      retentionHeld,
      advanceOutstanding: 0, // Calculated from requisitions
      lastPaymentDate: paidPayments[0]?.paidAt?.toDate(),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  private async buildApprovalChain(payment: Payment): Promise<ApprovalStep[]> {
    const chain: ApprovalStep[] = [];

    // Base chain by payment type
    if (payment.paymentType === 'ipc') {
      chain.push(
        { level: 0, role: 'quantity_surveyor', status: 'pending' },
        { level: 1, role: 'project_manager', status: 'pending' },
        { level: 2, role: 'program_manager', status: 'pending' }
      );
    } else {
      // Requisition or Accountability
      chain.push(
        { level: 0, role: 'site_engineer', status: 'pending' },
        { level: 1, role: 'project_manager', status: 'pending' }
      );
    }

    // Amount-based escalation
    if (payment.netAmount > 50000000) { // 50M UGX
      chain.push({
        level: chain.length,
        role: 'finance_director',
        status: 'pending',
      });
    }

    if (payment.netAmount > 100000000) { // 100M UGX
      chain.push({
        level: chain.length,
        role: 'country_coordinator',
        status: 'pending',
      });
    }

    return chain;
  }

  private async updateProjectBudget(
    projectId: string,
    amount: number,
    userId: string
  ): Promise<void> {
    const projectRef = doc(this.db, PROJECTS_PATH, projectId);
    const project = await getDoc(projectRef);

    if (!project.exists()) return;

    const projectData = project.data();
    const currentSpent = projectData.budget?.spent || 0;
    const totalBudget = projectData.budget?.totalBudget || 1;
    const newSpent = currentSpent + amount;
    const financialProgress = (newSpent / totalBudget) * 100;

    await updateDoc(projectRef, {
      'budget.spent': increment(amount),
      'budget.remaining': increment(-amount),
      'progress.financialProgress': Math.min(100, financialProgress),
      'progress.lastFinancialUpdate': serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // PAYMENT NUMBER GENERATION
  // ─────────────────────────────────────────────────────────────────

  async generatePaymentNumber(
    paymentType: PaymentType,
    projectCode: string
  ): Promise<string> {
    const prefix = paymentType === 'ipc' ? 'IPC' :
                   paymentType === 'requisition' ? 'REQ' : 'ACC';

    // Get count of this payment type for project
    const q = query(
      collection(this.db, PAYMENTS_PATH),
      where('paymentType', '==', paymentType),
      where('projectId', '==', projectCode)
    );

    const snapshot = await getDocs(q);
    const sequence = snapshot.size + 1;

    return `${prefix}-${projectCode}-${sequence.toString().padStart(3, '0')}`;
  }
}

// Export singleton factory
export function getPaymentService(db: Firestore): PaymentService {
  return PaymentService.getInstance(db);
}
