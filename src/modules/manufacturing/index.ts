export { default as ManufacturingModule } from './ManufacturingModule';

// Types
export * from './types';
export * from './types/purchaseOrder';
export * from './types/procurement';

// Hooks
export * from './hooks';

// Shared Components
export * from './components/shared';

// Core Services
export * from './services/manufacturingOrderService';
export * from './services/purchaseOrderService';
export * from './services/procurementRequirementService';
export * from './services/supplierBridgeService';
export * from './services/handoverService';

// Enhanced Integration Services
// Note: inventoryIntegrationService has its own checkMaterialAvailability that conflicts with handoverService
// Use explicit imports if you need both: import { checkMaterialAvailability as checkMaterialAvailabilityEnhanced } from './services/inventoryIntegrationService'
export {
  generateProcurementFromShortages,
  getReorderAlerts,
  getMOStockStatus,
} from './services/inventoryIntegrationService';
export * from './services/costVarianceService';
export * from './services/bulkOperationsService';
export * from './services/approvalWorkflowService';
export * from './services/unifiedDashboardService';
