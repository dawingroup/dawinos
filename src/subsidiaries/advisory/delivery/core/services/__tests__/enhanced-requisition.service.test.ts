/**
 * ENHANCED REQUISITION SERVICE TESTS
 *
 * Integration tests for EnhancedRequisitionService with ADD-FIN-001 functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { EnhancedRequisitionService } from '../enhanced-requisition.service';
import type { RequisitionFormData } from '../../../types/requisition';
import type { ApprovalConfiguration } from '../../../types/approval-config';

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
    validateRequisition: vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: [],
      boqItem: {
        id: 'boq-item-1',
        itemCode: 'A.001',
        quantityRemaining: 100,
      },
    }),
    reserveQuantity: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock RequisitionService
vi.mock('../../../services/requisition-service', () => ({
  RequisitionService: {
    getInstance: vi.fn().mockReturnValue({
      createRequisition: vi.fn().mockResolvedValue('req-123'),
      getRequisition: vi.fn().mockResolvedValue({
        id: 'req-123',
        projectId: 'project-1',
        items: [],
        approvalChain: [],
      }),
    }),
  },
}));

describe('EnhancedRequisitionService', () => {
  let service: EnhancedRequisitionService;
  const projectId = 'test-project-123';
  const userId = 'user-456';

  beforeEach(() => {
    service = new EnhancedRequisitionService(mockFirestore);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ───────────────────────────────────────────────────────────────
  // VALIDATION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('validateRequisition', () => {
    it('should validate requisition successfully with no overdue accountabilities', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            quantity: 10,
            unit: 'm3',
            rate: 1000,
            amount: 10000,
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock no overdue accountabilities
      mockFirestore.getDocs.mockResolvedValue({ empty: true });

      const result = await service.validateRequisition(formData, userId);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject requisition if user has overdue accountabilities', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            quantity: 10,
            unit: 'm3',
            rate: 1000,
            amount: 10000,
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock overdue accountabilities exist
      mockFirestore.getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'req-old-1', data: () => ({}) }],
      });

      const result = await service.validateRequisition(formData, userId);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('overdue accountabilities')
      );
    });

    it('should validate BOQ items and include BOQ validation results', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'BOQ Item',
            quantity: 10,
            unit: 'm3',
            rate: 1000,
            amount: 10000,
            sourceType: 'boq',
            boqItemId: 'boq-item-1',
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock no overdue accountabilities
      mockFirestore.getDocs.mockResolvedValue({ empty: true });

      const result = await service.validateRequisition(formData, userId);

      expect(result.valid).toBe(true);
      expect(result.boqValidations).toBeDefined();
      expect(result.boqValidations).toHaveLength(1);
      expect(result.boqValidations![0].itemCode).toBe('A.001');
    });

    it('should reject requisition if BOQ validation fails', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'BOQ Item',
            quantity: 200, // Exceeds available
            unit: 'm3',
            rate: 1000,
            amount: 200000,
            sourceType: 'boq',
            boqItemId: 'boq-item-1',
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock no overdue accountabilities
      mockFirestore.getDocs.mockResolvedValue({ empty: true });

      // Mock BOQ validation failure
      const { BOQControlService } = await import('../boq-control.service');
      const mockBoqService = new BOQControlService(mockFirestore);
      vi.mocked(mockBoqService.validateRequisition).mockResolvedValue({
        valid: false,
        errors: ['Quantity exceeds available quantity (100 m3)'],
        warnings: [],
        boqItem: {
          id: 'boq-item-1',
          itemCode: 'A.001',
          quantityRemaining: 100,
        } as any,
      });

      // Replace service's BOQ service
      (service as any).boqService = mockBoqService;

      const result = await service.validateRequisition(formData, userId);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('exceeds available quantity')
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // APPROVAL CONFIGURATION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('resolveApprovalConfiguration', () => {
    it('should use project-level custom configuration if available', async () => {
      const customConfig: ApprovalConfiguration = {
        id: 'custom-1',
        name: 'Custom Project Approval',
        description: 'Custom approval for project',
        type: 'requisition',
        level: 'project',
        entityId: projectId,
        isDefault: false,
        isActive: true,
        overridesDefault: true,
        stages: [
          {
            id: 'stage-1',
            sequence: 1,
            name: 'Project Manager Review',
            description: 'PM review',
            requiredRole: 'PROJECT_MANAGER',
            slaHours: 24,
            isRequired: true,
            canSkip: false,
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
        ],
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
        version: 1,
      };

      // Mock project config query
      mockFirestore.getDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'custom-1', data: () => customConfig }],
      });

      const result = await service.resolveApprovalConfiguration(projectId);

      expect(result.id).toBe('custom-1');
      expect(result.level).toBe('project');
      expect(result.stages).toHaveLength(1);
      expect(result.stages[0].name).toBe('Project Manager Review');
    });

    it('should fall back to ADD-FIN-001 default if no custom config', async () => {
      // Mock no custom configs
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ programId: null, organizationId: null }),
      });
      mockFirestore.getDocs.mockResolvedValue({ empty: true });

      const result = await service.resolveApprovalConfiguration(projectId);

      expect(result.isDefault).toBe(true);
      expect(result.type).toBe('requisition');
      expect(result.stages).toHaveLength(2); // Technical + Financial
      expect(result.stages[0].name).toBe('Technical Review');
      expect(result.stages[1].name).toBe('Financial Approval');
    });

    it('should use program-level config if no project config', async () => {
      const programConfig: ApprovalConfiguration = {
        id: 'program-config-1',
        name: 'Program Approval',
        description: 'Program-level approval',
        type: 'requisition',
        level: 'program',
        entityId: 'program-1',
        isDefault: false,
        isActive: true,
        overridesDefault: true,
        stages: [
          {
            id: 'stage-1',
            sequence: 1,
            name: 'Program Manager Review',
            description: 'Program manager review',
            requiredRole: 'PROGRAM_MANAGER',
            slaHours: 48,
            isRequired: true,
            canSkip: false,
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
        ],
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
        version: 1,
      };

      // Mock no project config
      mockFirestore.getDocs
        .mockResolvedValueOnce({ empty: true })
        // Mock program config exists
        .mockResolvedValueOnce({
          empty: false,
          docs: [{ id: 'program-config-1', data: () => programConfig }],
        });

      // Mock project has program
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ programId: 'program-1' }),
      });

      const result = await service.resolveApprovalConfiguration(projectId);

      expect(result.id).toBe('program-config-1');
      expect(result.level).toBe('program');
    });
  });

  describe('buildApprovalChain', () => {
    it('should build approval chain from configuration', async () => {
      const config: ApprovalConfiguration = {
        id: 'config-1',
        name: 'Test Config',
        type: 'requisition',
        level: 'organization',
        entityId: 'org-1',
        isDefault: true,
        isActive: true,
        overridesDefault: false,
        stages: [
          {
            id: 'stage-1',
            sequence: 1,
            name: 'Technical Review',
            requiredRole: 'ICE_MANAGER',
            slaHours: 48,
            isRequired: true,
            canSkip: false,
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
          {
            id: 'stage-2',
            sequence: 2,
            name: 'Financial Approval',
            requiredRole: 'FINANCE',
            slaHours: 72,
            isRequired: true,
            canSkip: false,
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
        ],
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
        version: 1,
      };

      const chain = service.buildApprovalChain(config, 10000, 'UGX');

      expect(chain).toHaveLength(2);
      expect(chain[0].name).toBe('Technical Review');
      expect(chain[0].approverRole).toBe('ICE_MANAGER');
      expect(chain[0].slaHours).toBe(48);
      expect(chain[1].name).toBe('Financial Approval');
      expect(chain[1].approverRole).toBe('FINANCE');
      expect(chain[1].slaHours).toBe(72);
    });

    it('should skip stages with skip conditions', async () => {
      const config: ApprovalConfiguration = {
        id: 'config-1',
        name: 'Test Config',
        type: 'requisition',
        level: 'organization',
        entityId: 'org-1',
        isDefault: false,
        isActive: true,
        overridesDefault: true,
        stages: [
          {
            id: 'stage-1',
            sequence: 1,
            name: 'Technical Review',
            requiredRole: 'ICE_MANAGER',
            slaHours: 48,
            isRequired: true,
            canSkip: true,
            skipConditions: [
              {
                type: 'amount',
                operator: 'lt',
                value: 5000,
                description: 'Skip for amounts < 5000',
              },
            ],
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
          {
            id: 'stage-2',
            sequence: 2,
            name: 'Financial Approval',
            requiredRole: 'FINANCE',
            slaHours: 72,
            isRequired: true,
            canSkip: false,
            canRunInParallel: false,
            isExternalApproval: false,
            notifyOnAssignment: true,
            notifyOnOverdue: true,
          },
        ],
        createdBy: userId,
        createdAt: Timestamp.now(),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
        version: 1,
      };

      // Amount < 5000, should skip Technical Review
      const chain = service.buildApprovalChain(config, 3000, 'UGX');

      expect(chain).toHaveLength(1);
      expect(chain[0].name).toBe('Financial Approval');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // CREATE REQUISITION TESTS
  // ───────────────────────────────────────────────────────────────

  describe('createRequisition', () => {
    it('should create requisition with approval chain', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            quantity: 10,
            unit: 'm3',
            rate: 1000,
            amount: 10000,
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock no overdue accountabilities
      mockFirestore.getDocs.mockResolvedValue({ empty: true });

      // Mock no custom approval config
      mockFirestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ programId: null, organizationId: null }),
      });

      const requisitionId = await service.createRequisition(formData, userId);

      expect(requisitionId).toBe('req-123');
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should throw error if validation fails', async () => {
      const formData: RequisitionFormData = {
        projectId,
        purpose: 'Test requisition',
        budgetLineId: 'budget-1',
        advanceType: 'materials',
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            quantity: 10,
            unit: 'm3',
            rate: 1000,
            amount: 10000,
          },
        ],
        accountabilityDueDate: Timestamp.fromDate(
          new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        ),
        expectedReturnDate: Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ),
      };

      // Mock overdue accountabilities
      mockFirestore.getDocs.mockResolvedValue({
        empty: false,
        docs: [{ id: 'req-old-1' }],
      });

      await expect(
        service.createRequisition(formData, userId)
      ).rejects.toThrow('Requisition validation failed');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // ADVANCE POLICY TESTS
  // ───────────────────────────────────────────────────────────────

  describe('calculateAccountabilityDueDate', () => {
    it('should calculate 14 days for materials', () => {
      const approvalDate = new Date('2026-01-01');
      const dueDate = service.calculateAccountabilityDueDate(
        'materials',
        approvalDate
      );

      const expected = new Date('2026-01-15');
      expect(dueDate.getTime()).toBe(expected.getTime());
    });

    it('should calculate 7 days for labor', () => {
      const approvalDate = new Date('2026-01-01');
      const dueDate = service.calculateAccountabilityDueDate(
        'labor',
        approvalDate
      );

      const expected = new Date('2026-01-08');
      expect(dueDate.getTime()).toBe(expected.getTime());
    });

    it('should default to 14 days for unknown type', () => {
      const approvalDate = new Date('2026-01-01');
      const dueDate = service.calculateAccountabilityDueDate(
        'unknown_type',
        approvalDate
      );

      const expected = new Date('2026-01-15');
      expect(dueDate.getTime()).toBe(expected.getTime());
    });
  });

  // ───────────────────────────────────────────────────────────────
  // QUOTATION MANAGEMENT TESTS (Optional PM features)
  // ───────────────────────────────────────────────────────────────

  describe('addQuotation', () => {
    it('should add quotation to requisition', async () => {
      const quotation = {
        supplierName: 'ABC Suppliers',
        quotedAmount: 9500,
        documentUrl: 'https://storage.example.com/quote.pdf',
      };

      await service.addQuotation('req-123', quotation, userId);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          quotations: expect.arrayContaining([
            expect.objectContaining({
              supplierName: 'ABC Suppliers',
              quotedAmount: 9500,
            }),
          ]),
        })
      );
    });
  });

  describe('selectSupplier', () => {
    it('should select supplier for requisition', async () => {
      const supplier = {
        name: 'ABC Suppliers',
        contactInfo: 'abc@example.com',
        selectionReason: 'Best value for money',
        alternativesConsidered: 3,
      };

      await service.selectSupplier('req-123', supplier, userId);

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selectedSupplier: expect.objectContaining({
            name: 'ABC Suppliers',
            alternativesConsidered: 3,
          }),
        })
      );
    });
  });
});
