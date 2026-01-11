/**
 * Nesting Studio Component
 * Optimization interface for ESTIMATION and PRODUCTION modes
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Settings,
  Layers,
  Package,
  Scissors,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { 
  Project, 
  EstimationResult, 
  ProductionResult,
  OptimizationConfig,
  NestingSheet,
} from '@/shared/types';
import { 
  runProjectEstimation, 
  runProjectProduction,
  updateProjectConfig
} from '@/shared/services/optimization/projectOptimization';

// ============================================
// Types
// ============================================

interface NestingStudioProps {
  projectId: string;
  project: Project;
  mode: 'ESTIMATION' | 'PRODUCTION';
  onComplete?: () => void;
  onRefresh?: () => void;
  userId: string;
  className?: string;
}

// ============================================
// Sub-Components
// ============================================

interface ConfigPanelProps {
  config: OptimizationConfig | undefined;
  onChange: (config: Partial<OptimizationConfig>) => void;
  disabled: boolean;
  expanded: boolean;
  onToggle: () => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onChange, 
  disabled, 
  expanded, 
  onToggle 
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Optimization Settings</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Kerf */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blade Kerf (mm)
            </label>
            <input
              type="number"
              value={config?.kerf || 3.2}
              onChange={(e) => onChange({ kerf: parseFloat(e.target.value) })}
              disabled={disabled}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
              step="0.1"
              min="0"
            />
          </div>

          {/* Target Yield */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Yield (%)
            </label>
            <input
              type="number"
              value={config?.targetYield || 85}
              onChange={(e) => onChange({ targetYield: parseInt(e.target.value) })}
              disabled={disabled}
              className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm"
              min="50"
              max="100"
            />
          </div>

          {/* Grain Matching */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="grainMatching"
              checked={config?.grainMatching ?? true}
              onChange={(e) => onChange({ grainMatching: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300"
            />
            <label htmlFor="grainMatching" className="text-sm text-gray-700">
              Respect grain direction
            </label>
          </div>

          {/* Allow Rotation */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowRotation"
              checked={config?.allowRotation ?? true}
              onChange={(e) => onChange({ allowRotation: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300"
            />
            <label htmlFor="allowRotation" className="text-sm text-gray-700">
              Allow part rotation
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

interface EstimationResultsProps {
  results: EstimationResult;
}

const EstimationResults: React.FC<EstimationResultsProps> = ({ results }) => {
  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{results.totalSheetsCount}</div>
          <div className="text-sm text-blue-600">Sheets Required</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{results.totalPartsCount}</div>
          <div className="text-sm text-green-600">Sheet Parts</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700">{results.wasteEstimate.toFixed(1)}%</div>
          <div className="text-sm text-amber-600">Est. Waste</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">
            {((results.totalCost || results.roughCost) / 1000000).toFixed(2)}M
          </div>
          <div className="text-sm text-purple-600">Total Est. Cost</div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {(results.standardPartsCost || results.specialPartsCost) ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-700">
              {(results.roughCost / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-gray-500">Sheet Materials</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-lg font-bold text-orange-700">
              {((results.standardPartsCost || 0) / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-orange-500">
              Standard Parts ({results.totalStandardParts || 0})
            </div>
          </div>
          <div className="bg-pink-50 rounded-lg p-3">
            <div className="text-lg font-bold text-pink-700">
              {((results.specialPartsCost || 0) / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-pink-500">
              Special Parts ({results.totalSpecialParts || 0})
            </div>
          </div>
        </div>
      ) : null}

      {/* Sheet Summary Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-medium text-gray-700">Sheet Summary by Material</h4>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Thickness</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sheets</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.sheetSummary.map((summary, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{summary.materialName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{summary.thickness}mm</td>
                <td className="px-4 py-3 text-sm text-gray-600">{summary.sheetsRequired}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          summary.utilizationPercent >= 80 ? 'bg-green-500' :
                          summary.utilizationPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(summary.utilizationPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{summary.utilizationPercent.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {summary.estimatedCost.toLocaleString()} UGX
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ProductionResultsProps {
  results: ProductionResult;
}

const ProductionResults: React.FC<ProductionResultsProps> = ({ results }) => {
  const [selectedSheet, setSelectedSheet] = useState<NestingSheet | null>(null);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-700">{results.nestingSheets.length}</div>
          <div className="text-sm text-blue-600">Nesting Sheets</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-700">{results.optimizedYield.toFixed(1)}%</div>
          <div className="text-sm text-green-600">Optimized Yield</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-700">{results.cutSequence.length}</div>
          <div className="text-sm text-amber-600">Cut Operations</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-700">{results.estimatedCutTime}</div>
          <div className="text-sm text-purple-600">Est. Minutes</div>
        </div>
      </div>

      {/* Nesting Sheets Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Nesting Sheets</h4>
          <span className="text-sm text-gray-500">Click to view details</span>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {results.nestingSheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setSelectedSheet(sheet)}
              className={`p-4 border rounded-lg text-left transition-all ${
                selectedSheet?.id === sheet.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">Sheet {sheet.sheetIndex + 1}</span>
              </div>
              <div className="text-sm text-gray-600">{sheet.materialName}</div>
              <div className="text-sm text-gray-500">
                {sheet.placements.length} parts • {sheet.utilizationPercent.toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Detail View */}
      {selectedSheet && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h4 className="font-medium text-gray-700">
              Sheet {selectedSheet.sheetIndex + 1} - {selectedSheet.materialName}
            </h4>
            <button
              onClick={() => setSelectedSheet(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <div className="p-4">
            {/* Simple sheet visualization */}
            <div 
              className="relative bg-amber-100 border-2 border-amber-300 rounded-lg overflow-hidden"
              style={{ 
                width: '100%', 
                paddingBottom: `${(selectedSheet.sheetSize.width / selectedSheet.sheetSize.length) * 100}%` 
              }}
            >
              {selectedSheet.placements.map((placement, idx) => {
                const scaleX = 100 / selectedSheet.sheetSize.length;
                const scaleY = 100 / selectedSheet.sheetSize.width;
                
                return (
                  <div
                    key={idx}
                    className="absolute bg-blue-500 border border-blue-700 flex items-center justify-center text-xs text-white font-medium overflow-hidden"
                    style={{
                      left: `${placement.x * scaleX}%`,
                      top: `${placement.y * scaleY}%`,
                      width: `${placement.length * scaleX}%`,
                      height: `${placement.width * scaleY}%`,
                    }}
                    title={`${placement.partName} (${placement.length}x${placement.width}mm)`}
                  >
                    {placement.partName.substring(0, 10)}
                  </div>
                );
              })}
            </div>
            
            {/* Parts list */}
            <div className="mt-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Parts on this sheet:</h5>
              <div className="flex flex-wrap gap-2">
                {selectedSheet.placements.map((placement, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {placement.partName} ({placement.length}x{placement.width})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const NestingStudio: React.FC<NestingStudioProps> = ({ 
  projectId, 
  project,
  mode, 
  onComplete,
  onRefresh,
  userId,
  className = '',
}) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Get optimization state based on mode
  const modeKey = mode.toLowerCase() as 'estimation' | 'production';
  const optimizationState = project?.optimizationState?.[modeKey];
  const isInvalidated = !!optimizationState?.invalidatedAt;
  const hasResults = !!optimizationState && !isInvalidated;
  const config = project?.optimizationState?.config;
  
  // Get asset warnings (e.g., CNC machines in maintenance)
  const assetWarnings = (project as any)?.activeWarnings?.filter(
    (w: any) => w.type === 'ASSET_UNAVAILABLE'
  ) || [];
  
  // Track if auto-estimation has been attempted
  const autoRunAttemptedRef = useRef(false);

  // Run optimization
  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    setError(null);

    try {
      if (mode === 'ESTIMATION') {
        await runProjectEstimation(projectId, userId);
      } else {
        await runProjectProduction(projectId, userId);
      }
      
      onRefresh?.();
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto-run estimation when entering the tab if stale or no results
  useEffect(() => {
    // Only auto-run for estimation mode, not production (which is more expensive)
    if (mode !== 'ESTIMATION') return;
    
    // Skip if already attempted, already running, or has valid results
    if (autoRunAttemptedRef.current || isOptimizing || hasResults) return;
    
    // Auto-run if no results or invalidated
    if (!optimizationState || isInvalidated) {
      autoRunAttemptedRef.current = true;
      console.log('[NestingStudio] Auto-running estimation...');
      handleRunOptimization();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, hasResults, isInvalidated, isOptimizing]);

  // Handle config change
  const handleConfigChange = async (changes: Partial<OptimizationConfig>) => {
    console.log('Config change:', changes);
    try {
      await updateProjectConfig(projectId, changes, userId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  // Get button state
  const getButtonState = () => {
    if (isOptimizing) {
      return { 
        label: 'Optimizing...', 
        icon: RefreshCw, 
        variant: 'secondary' as const,
        spin: true,
      };
    }
    if (isInvalidated) {
      return { 
        label: 'Re-optimize', 
        icon: RefreshCw, 
        variant: 'warning' as const,
        spin: false,
      };
    }
    if (hasResults) {
      return { 
        label: 'Results Current', 
        icon: CheckCircle, 
        variant: 'success' as const,
        spin: false,
      };
    }
    return { 
      label: `Run ${mode === 'ESTIMATION' ? 'Estimation' : 'Production'}`, 
      icon: Play, 
      variant: 'primary' as const,
      spin: false,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode === 'ESTIMATION' ? (
            <BarChart3 className="w-5 h-5 text-blue-600" />
          ) : (
            <Scissors className="w-5 h-5 text-purple-600" />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {mode === 'ESTIMATION' ? 'Material Estimation' : 'Production Nesting'}
            </h3>
            <p className="text-sm text-gray-500">
              {mode === 'ESTIMATION' 
                ? 'Quick estimate with ~70% utilization assumption' 
                : 'Full optimization for 85%+ yield'}
            </p>
          </div>
        </div>
      </div>

      {/* Asset Warnings (CNC machines in maintenance, etc.) */}
      {assetWarnings.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-orange-800">Machine Status Warning</h4>
            <div className="text-sm text-orange-700 mt-1 space-y-1">
              {assetWarnings.map((warning: any) => (
                <p key={warning.assetId}>{warning.message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Invalidation Warning */}
      {isInvalidated && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">Optimization Outdated</h4>
            <p className="text-sm text-amber-700 mt-1">
              Changes detected: {optimizationState?.invalidationReasons?.join(', ') || 'Project data modified'}
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Optimization Failed</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      <ConfigPanel
        config={config}
        onChange={handleConfigChange}
        disabled={isOptimizing}
        expanded={showConfig}
        onToggle={() => setShowConfig(!showConfig)}
      />

      {/* Action Button */}
      <button
        onClick={handleRunOptimization}
        disabled={isOptimizing}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
          buttonState.variant === 'primary' 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : buttonState.variant === 'warning'
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : buttonState.variant === 'success'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : buttonState.variant === 'secondary'
            ? 'bg-blue-400 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <buttonState.icon className={`w-5 h-5 ${buttonState.spin ? 'animate-spin' : ''}`} />
        {buttonState.label}
      </button>

      {/* Results */}
      {hasResults && (
        <div className="mt-6">
          {mode === 'ESTIMATION' && optimizationState ? (
            <EstimationResults results={optimizationState as EstimationResult} />
          ) : mode === 'PRODUCTION' && optimizationState ? (
            <ProductionResults results={optimizationState as ProductionResult} />
          ) : null}
        </div>
      )}

      {/* No results message */}
      {!hasResults && !isOptimizing && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Run optimization to see material requirements</p>
        </div>
      )}
    </div>
  );
};

export default NestingStudio;
