/**
 * Cutlist Processor Module
 *
 * Public API for the cutlist processor module.
 * This module handles CSV upload, material mapping, nesting optimization, and PDF output.
 *
 * @module cutlist-processor
 */

// Public types
export * from './types';

// Public utilities (for use by other modules if needed)
export { parseCSV, optimizePanelLayout, calculateStatistics } from './utils';

// Public services
export {
  generateOptimizationPDF,
  downloadOptimizationPDF,
  createWorkInstance,
  getWorkInstance,
  getProjectInstances
} from './services';

// Public context providers
export {
  ConfigProvider,
  useConfig,
  OffcutProvider,
  useOffcuts,
  WorkInstanceProvider,
  useWorkInstance
} from './context';

// Public hooks
export { useCutlistAggregation } from './hooks';

// Public components
export {
  CuttingDiagram,
  OptimizationReport,
  FileUpload,
  OffcutManager,
  WorkInstancePanel,
  SettingsPanel,
  CustomerProjectSelector,
  CutlistTab,
} from './components';
