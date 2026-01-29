/**
 * Cutlist Processor Components
 * UI components for the cutlist processor module
 *
 * Re-exports from existing components during migration
 */

// Cutting Diagram - SVG visualization of panel layouts
export { default as CuttingDiagram } from '../../../../components/CuttingDiagram';

// Optimization Report - Full report with statistics and export
export { default as OptimizationReport } from '../../../../components/OptimizationReport';

// File Upload - CSV upload with drag-drop and Google Drive support
export { default as FileUpload } from '../../../../components/FileUpload';

// Offcut Manager - Inventory management for remnant pieces
export { default as OffcutManager } from '../../../../components/OffcutManager';

// Work Instance Panel - Save/load optimization sessions
export { default as WorkInstancePanel } from '../../../../components/WorkInstancePanel';

// Settings Panel - Application configuration
export { default as SettingsPanel } from '../../../../components/SettingsPanel';

// Customer Project Selector - Project selection for cutlist
export { default as CustomerProjectSelector } from '../../../../components/CustomerProjectSelector';

// Cutlist Tab (from design-manager) - Project-level cutlist aggregation
export { CutlistTab } from '../../design-manager/components/project/CutlistTab';
