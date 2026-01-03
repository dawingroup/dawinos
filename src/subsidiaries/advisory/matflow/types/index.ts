/**
 * MatFlow Types - Central Export
 */

export * from './core';
export * from './customer';
export * from './variance';
export * from './stageProgress';

// Re-export commonly used types for convenience
export type {
  MatFlowProject,
  BOQItem,
  StandardFormula,
  ProcurementEntry,
  MaterialRequirement,
  MaterialVariance,
  BOQParsingJob,
  MatFlowCapability,
  MatFlowRole,
} from './core';

export type {
  SharedCustomer,
  MatFlowCustomerSummary,
  ContactPerson,
  CustomerAddress,
  SubsidiaryEngagement,
  CustomerType,
  CustomerStatus,
} from './customer';

export type {
  StageProgress,
  StageStatus,
  StageHealth,
  StageMilestone,
  StageBlocker,
  StageTimelineEvent,
  ProjectStageOverview,
} from './stageProgress';

// Offline types
export * from './offline';

export type {
  NetworkStatus,
  NetworkState,
  SyncStatus,
  SyncState,
  SyncError,
  OfflineOperation,
  OfflineOperationType,
  ConflictStrategy,
  DataConflict,
  CacheConfig,
} from './offline';

// Mobile breakpoint constants
export { BREAKPOINTS } from '../hooks/useMediaQuery';

// EFRIS types
export * from './efris';

// Export and reporting types (excluding VarianceTrend which is already exported from ./variance)
export type {
  ExportFormat,
  ReportType,
  ReportStatus,
  ReportConfig,
  ReportFilter,
  ReportRecord,
  ReportTemplate,
  BOQSummaryReportData,
  BOQStageSection,
  BOQItemRow,
  MaterialRequirementsReportData,
  MaterialRequirementRow,
  CategorySummary,
  VarianceAnalysisReportData,
  StageVarianceSection,
  VarianceItem,
  ProcurementLogReportData,
  DeliveryLogRow,
  SupplierSummary,
  TaxComplianceReportData,
  TaxInvoiceRow,
  SupplierTaxSummary,
  ProjectOverviewReportData,
  StageProgressRow,
  ActivityItem,
  ProjectIssue,
  ExportJob,
  DataExportConfig,
  ScheduledReport,
  ReportData,
} from './export';
