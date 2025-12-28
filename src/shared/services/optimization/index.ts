/**
 * Optimization Services
 * Barrel export for optimization services
 */

export { 
  OptimizationService, 
  optimizationService,
  type Panel,
  type StockSheet,
  type OptimizationOptions,
  type OptimizationResult,
  type SheetLayout,
  type PanelPlacement,
} from './OptimizationService';

export {
  InvalidationDetector,
  invalidationDetector,
  createHash,
  createProjectSnapshot,
  type InvalidationTrigger,
  type InvalidationResult,
} from './InvalidationDetector';

export {
  runProjectEstimation,
  runProjectProduction,
  aggregatePartsFromProject,
  needsReOptimization,
  getOptimizationStatus,
  updateProjectConfig,
  clearEstimation,
  clearProduction,
  type CutlistPart,
  type MaterialBreakdown,
  type Remnant,
  type EdgeBandItem,
} from './projectOptimization';
