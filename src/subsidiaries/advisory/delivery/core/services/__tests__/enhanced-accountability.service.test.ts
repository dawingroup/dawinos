/**
 * ENHANCED ACCOUNTABILITY SERVICE TESTS
 *
 * Integration tests for EnhancedAccountabilityService with ADD-FIN-001 functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { EnhancedAccountabilityService } from '../enhanced-accountability.service';
import type {
  AccountabilityFormData,
  AccountabilityExpense,
  ProofOfSpendDocument,
} from '../../../types/accountability';

// Mock Firestore
const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
} as any;

// Mock BOQControlService
vi.mock('../boq-control.service', () => ({
  BOQControlService: vi.fn().mockImplementation(() => ({
    executeQuantity: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock RequisitionService
vi.mock('../../../services/requisition-service', () => ({
  RequisitionService: {
    getInstance: vi.fn().mockReturnValue({
      getRequisition: vi.fn().mockResolvedValue({
        id: 'req-123',
        projectId: 'project-1',
        requisitionNumber: 'REQ-001',
        grossAmount: 10000,
        currency: 'UGX',
        status: 'paid',
        items: [],
        updatedAt: Timestamp.now(),
      }),
      getAccountability: vi.fn().mockResolvedValue({
        id: 'acc-123',
        requisitionId: 'req-123',
        requisitionAmount: 10000,
        totalExpenses: 9500,
        unspentReturned: 500,
        expenses: [],
        variance: {
          varianceAmount: 0,
          variancePercentage: 0,
          varianceStatus: 'compliant',
          isZeroDiscrepancy: true,
          totalExpenses: 9500,
          unspentReturned: 500,
          requisitionAmount: 10000,
          requiresInvestigation: false,
        },
        isZeroDiscrepancy: true,
      }),
      createAccountability: vi.fn().mockResolvedValue('acc-123'),
    }),
  },
}));

describe('EnhancedAccountabilityService', () => {
  let service: EnhancedAccountabilityService;
  const userId = 'user-456';

  beforeEach(() => {
    service = new EnhancedAccountabilityService(mockFirestore);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ───────────────────────────────────────────────────────────────
  // VALIDATION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('validateAccountability', () => {
    it('should validate accountability with zero discrepancy', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Cement purchase',
            category: 'construction_materials',
            amount: 9500,
            status: 'pending',
            isZeroDiscrepancy: true,
            proofOfSpend: {
              expenseId: 'exp-1',
              category: 'construction_materials',
              requiredDocuments: ['invoice', 'receipt', 'delivery_note', 'photo_evidence'],
              providedDocuments: [
                {
                  id: 'doc-1',
                  type: 'invoice',
                  documentUrl: 'https://storage.example.com/invoice.pdf',
                  documentName: 'invoice.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 50000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-2',
                  type: 'receipt',
                  documentUrl: 'https://storage.example.com/receipt.pdf',
                  documentName: 'receipt.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 40000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-3',
                  type: 'delivery_note',
                  documentUrl: 'https://storage.example.com/delivery.pdf',
                  documentName: 'delivery.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 30000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-4',
                  type: 'photo_evidence',
                  documentUrl: 'https://storage.example.com/photo.jpg',
                  documentName: 'photo.jpg',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 200000,
                  mimeType: 'image/jpeg',
                  dpi: 300,
                  isQualityValid: true,
                },
              ],
              isComplete: true,
            },
          },
        ],
        unspentReturned: 500,
      };

      const result = await service.validateAccountability(formData, userId);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.varianceDetails?.isZeroDiscrepancy).toBe(true);
      expect(result.proofOfSpendValidations![0].isComplete).toBe(true);
    });

    it('should detect missing proof of spend documents', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Cement purchase',
            category: 'construction_materials',
            amount: 9500,
            status: 'pending',
            isZeroDiscrepancy: true,
            proofOfSpend: {
              expenseId: 'exp-1',
              category: 'construction_materials',
              requiredDocuments: ['invoice', 'receipt', 'delivery_note', 'photo_evidence'],
              providedDocuments: [
                {
                  id: 'doc-1',
                  type: 'invoice',
                  documentUrl: 'https://storage.example.com/invoice.pdf',
                  documentName: 'invoice.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 50000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
              ],
              isComplete: false,
            },
          },
        ],
        unspentReturned: 500,
      };

      const result = await service.validateAccountability(formData, userId);

      expect(result.valid).toBe(true); // Valid but with warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('missing proof');
      expect(result.proofOfSpendValidations![0].isComplete).toBe(false);
      expect(result.proofOfSpendValidations![0].missingDocuments).toContain('receipt');
      expect(result.proofOfSpendValidations![0].missingDocuments).toContain('delivery_note');
      expect(result.proofOfSpendValidations![0].missingDocuments).toContain('photo_evidence');
    });

    it('should detect variance and trigger investigation warning', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Cement purchase',
            category: 'construction_materials',
            amount: 9000, // 9000 + 500 = 9500 (500 variance = 5%)
            status: 'pending',
            isZeroDiscrepancy: false,
            proofOfSpend: {
              expenseId: 'exp-1',
              category: 'construction_materials',
              requiredDocuments: ['invoice', 'receipt', 'delivery_note', 'photo_evidence'],
              providedDocuments: [],
              isComplete: false,
            },
          },
        ],
        unspentReturned: 500,
      };

      const result = await service.validateAccountability(formData, userId);

      expect(result.valid).toBe(true);
      expect(result.varianceDetails?.isZeroDiscrepancy).toBe(false);
      expect(result.varianceDetails?.requiresInvestigation).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('requires investigation within 48 hours')
      );
    });

    it('should warn about low quality documents', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Labor wages',
            category: 'labor_wages',
            amount: 9500,
            status: 'pending',
            isZeroDiscrepancy: true,
            proofOfSpend: {
              expenseId: 'exp-1',
              category: 'labor_wages',
              requiredDocuments: ['attendance_register', 'payment_receipt'],
              providedDocuments: [
                {
                  id: 'doc-1',
                  type: 'attendance_register',
                  documentUrl: 'https://storage.example.com/attendance.pdf',
                  documentName: 'attendance.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 50000,
                  mimeType: 'application/pdf',
                  dpi: 150, // Below 300 DPI requirement
                  isQualityValid: false,
                },
                {
                  id: 'doc-2',
                  type: 'payment_receipt',
                  documentUrl: 'https://storage.example.com/receipt.pdf',
                  documentName: 'receipt.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 40000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
              ],
              isComplete: true,
            },
          },
        ],
        unspentReturned: 500,
      };

      const result = await service.validateAccountability(formData, userId);

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain(
        expect.stringContaining('below 300 DPI quality standard')
      );
    });

    it('should reject accountability for unpaid requisition', async () => {
      // Mock unpaid requisition
      const { RequisitionService } = await import(
        '../../../services/requisition-service'
      );
      const mockReqService = RequisitionService.getInstance(mockFirestore);
      vi.mocked(mockReqService.getRequisition).mockResolvedValue({
        id: 'req-123',
        projectId: 'project-1',
        requisitionNumber: 'REQ-001',
        grossAmount: 10000,
        currency: 'UGX',
        status: 'approved', // Not paid yet
        items: [],
      } as any);

      // Replace service's base service
      (service as any).baseService = mockReqService;

      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Test expense',
            category: 'construction_materials',
            amount: 9500,
            status: 'pending',
            isZeroDiscrepancy: true,
          },
        ],
        unspentReturned: 500,
      };

      const result = await service.validateAccountability(formData, userId);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Accountability can only be created for paid requisitions'
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // VARIANCE INVESTIGATION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('triggerVarianceInvestigation', () => {
    it('should create variance investigation', async () => {
      const investigationId = 'inv-123';
      mockFirestore.addDoc.mockResolvedValue({ id: investigationId });

      const result = await service.triggerVarianceInvestigation(
        'acc-123',
        500,
        5.0,
        userId
      );

      expect(result).toBe(investigationId);
      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          investigationId,
        })
      );
    });
  });

  describe('completeInvestigation', () => {
    it('should complete investigation with findings', async () => {
      const investigationId = 'inv-123';
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: investigationId,
          accountabilityId: 'acc-123',
          varianceAmount: 500,
          variancePercentage: 5.0,
          assignedTo: userId,
          status: 'in_progress',
        }),
      });

      await service.completeInvestigation(
        investigationId,
        {
          rootCause: 'Price fluctuation in market',
          correctiveActions: 'Update budget estimates',
          personalLiabilityAmount: 0,
        },
        userId
      );

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'completed',
          rootCause: 'Price fluctuation in market',
          correctiveActions: 'Update budget estimates',
        })
      );
    });

    it('should assign personal liability for severe variance', async () => {
      const investigationId = 'inv-123';
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          id: investigationId,
          accountabilityId: 'acc-123',
          varianceAmount: 800,
          variancePercentage: 8.0,
          assignedTo: userId,
          status: 'in_progress',
        }),
      });

      await service.completeInvestigation(
        investigationId,
        {
          rootCause: 'Unauthorized expenditure',
          correctiveActions: 'Disciplinary action initiated',
          personalLiabilityAmount: 800,
          personalLiabilityAssignedTo: userId,
        },
        userId
      );

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          personalLiabilityAmount: 800,
          personalLiabilityAssignedTo: userId,
        })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // RECONCILIATION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('createReconciliation', () => {
    it('should create reconciliation record', async () => {
      const reconciliationId = 'rec-123';
      mockFirestore.addDoc.mockResolvedValue({ id: reconciliationId });

      const result = await service.createReconciliation(
        'acc-123',
        userId,
        'All receipts verified, zero discrepancy achieved'
      );

      expect(result).toBe(reconciliationId);
      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          reconciliationStatus: 'completed',
        })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // PROOF OF SPEND TESTS
  // ───────────────────────────────────────────────────────────────

  describe('validateDocumentQuality', () => {
    it('should validate document with sufficient DPI', () => {
      const document: ProofOfSpendDocument = {
        id: 'doc-1',
        type: 'invoice',
        documentUrl: 'https://storage.example.com/invoice.pdf',
        documentName: 'invoice.pdf',
        uploadedAt: Timestamp.now(),
        uploadedBy: userId,
        fileSize: 50000,
        mimeType: 'application/pdf',
        dpi: 300,
        isQualityValid: true,
      };

      const result = service.validateDocumentQuality(
        document,
        'construction_materials'
      );

      expect(result.valid).toBe(true);
    });

    it('should reject document with insufficient DPI', () => {
      const document: ProofOfSpendDocument = {
        id: 'doc-1',
        type: 'invoice',
        documentUrl: 'https://storage.example.com/invoice.pdf',
        documentName: 'invoice.pdf',
        uploadedAt: Timestamp.now(),
        uploadedBy: userId,
        fileSize: 50000,
        mimeType: 'application/pdf',
        dpi: 150,
        isQualityValid: false,
      };

      const result = service.validateDocumentQuality(
        document,
        'construction_materials'
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('below required 300 DPI');
    });

    it('should warn when DPI information unavailable', () => {
      const document: ProofOfSpendDocument = {
        id: 'doc-1',
        type: 'invoice',
        documentUrl: 'https://storage.example.com/invoice.pdf',
        documentName: 'invoice.pdf',
        uploadedAt: Timestamp.now(),
        uploadedBy: userId,
        fileSize: 50000,
        mimeType: 'application/pdf',
        isQualityValid: false,
      };

      const result = service.validateDocumentQuality(
        document,
        'construction_materials'
      );

      expect(result.valid).toBe(false);
      expect(result.message).toContain('DPI information not available');
    });
  });

  describe('addProofOfSpendDocument', () => {
    it('should add document to expense', async () => {
      const document: ProofOfSpendDocument = {
        id: 'doc-new',
        type: 'receipt',
        documentUrl: 'https://storage.example.com/receipt.pdf',
        documentName: 'receipt.pdf',
        uploadedAt: Timestamp.now(),
        uploadedBy: userId,
        fileSize: 40000,
        mimeType: 'application/pdf',
        dpi: 300,
        isQualityValid: true,
      };

      await service.addProofOfSpendDocument('acc-123', 'exp-1', document, userId);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          expenses: expect.any(Array),
        })
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // REPORTING TESTS
  // ───────────────────────────────────────────────────────────────

  describe('getVarianceSummary', () => {
    it('should calculate variance summary for project', async () => {
      mockFirestore.getDocs.mockResolvedValue({
        docs: [
          {
            id: 'acc-1',
            data: () => ({
              variance: {
                varianceAmount: 0,
                varianceStatus: 'compliant',
                isZeroDiscrepancy: true,
                requiresInvestigation: false,
              },
            }),
          },
          {
            id: 'acc-2',
            data: () => ({
              variance: {
                varianceAmount: 150,
                varianceStatus: 'minor',
                isZeroDiscrepancy: false,
                requiresInvestigation: false,
              },
            }),
          },
          {
            id: 'acc-3',
            data: () => ({
              variance: {
                varianceAmount: 400,
                varianceStatus: 'moderate',
                isZeroDiscrepancy: false,
                requiresInvestigation: true,
              },
            }),
          },
          {
            id: 'acc-4',
            data: () => ({
              variance: {
                varianceAmount: 800,
                varianceStatus: 'severe',
                isZeroDiscrepancy: false,
                requiresInvestigation: true,
              },
            }),
          },
        ],
      });

      const summary = await service.getVarianceSummary('project-1');

      expect(summary.totalAccountabilities).toBe(4);
      expect(summary.zeroDiscrepancyCount).toBe(1);
      expect(summary.minorVarianceCount).toBe(1);
      expect(summary.moderateVarianceCount).toBe(1);
      expect(summary.severeVarianceCount).toBe(1);
      expect(summary.totalVarianceAmount).toBe(1350); // 0 + 150 + 400 + 800
      expect(summary.activeInvestigations).toBe(2);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // CREATE ACCOUNTABILITY TESTS
  // ───────────────────────────────────────────────────────────────

  describe('createAccountability', () => {
    it('should create accountability with variance tracking', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Cement purchase',
            category: 'construction_materials',
            amount: 9500,
            status: 'pending',
            isZeroDiscrepancy: true,
            proofOfSpend: {
              expenseId: 'exp-1',
              category: 'construction_materials',
              requiredDocuments: ['invoice', 'receipt', 'delivery_note', 'photo_evidence'],
              providedDocuments: [
                {
                  id: 'doc-1',
                  type: 'invoice',
                  documentUrl: 'https://storage.example.com/invoice.pdf',
                  documentName: 'invoice.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 50000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-2',
                  type: 'receipt',
                  documentUrl: 'https://storage.example.com/receipt.pdf',
                  documentName: 'receipt.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 40000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-3',
                  type: 'delivery_note',
                  documentUrl: 'https://storage.example.com/delivery.pdf',
                  documentName: 'delivery.pdf',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 30000,
                  mimeType: 'application/pdf',
                  dpi: 300,
                  isQualityValid: true,
                },
                {
                  id: 'doc-4',
                  type: 'photo_evidence',
                  documentUrl: 'https://storage.example.com/photo.jpg',
                  documentName: 'photo.jpg',
                  uploadedAt: Timestamp.now(),
                  uploadedBy: userId,
                  fileSize: 200000,
                  mimeType: 'image/jpeg',
                  dpi: 300,
                  isQualityValid: true,
                },
              ],
              isComplete: true,
            },
          },
        ],
        unspentReturned: 500,
      };

      const accountabilityId = await service.createAccountability(formData, userId);

      expect(accountabilityId).toBe('acc-123');
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          variance: expect.any(Object),
          isZeroDiscrepancy: true,
          reconciliationStatus: 'pending',
          requiresInvestigation: false,
        })
      );
    });

    it('should trigger investigation for moderate variance', async () => {
      const formData: AccountabilityFormData = {
        requisitionId: 'req-123',
        expenses: [
          {
            id: 'exp-1',
            date: new Date(),
            description: 'Materials',
            category: 'construction_materials',
            amount: 9000,
            status: 'pending',
            isZeroDiscrepancy: false,
          },
        ],
        unspentReturned: 500, // 9500 vs 10000 = 5% variance
      };

      mockFirestore.addDoc.mockResolvedValue({ id: 'inv-123' });

      await service.createAccountability(formData, userId);

      expect(mockFirestore.addDoc).toHaveBeenCalled(); // Investigation created
    });
  });
});
