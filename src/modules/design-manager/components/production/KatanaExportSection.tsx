/**
 * KatanaExportSection Component
 * Validates BOM readiness and exports to Katana MRP
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  RefreshCw,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { Project } from '@/shared/types';

// ============================================
// Types
// ============================================

interface BOMValidationIssue {
  type: 'UNMAPPED_MATERIAL' | 'OPTIMIZATION_OUTDATED' | 'NO_PRODUCTION_RESULTS' | 'NO_MATERIAL_PALETTE' | 'EMPTY_NESTING';
  materialName?: string;
  message: string;
}

interface BOMValidationResult {
  ready: boolean;
  issues: BOMValidationIssue[];
  summary?: {
    totalMaterials: number;
    mappedMaterials: number;
    totalSheets: number;
    totalParts: number;
  };
}

interface KatanaExportSectionProps {
  project: Project;
  onExportComplete?: () => void;
}

// ============================================
// API Helpers
// ============================================

const API_BASE = 'https://api-okekivpl2a-uc.a.run.app';

async function validateBOM(projectId: string): Promise<BOMValidationResult> {
  try {
    const response = await fetch(`${API_BASE}/katana/validate-bom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to validate BOM');
    }
    
    return await response.json();
  } catch (error) {
    console.error('BOM validation error:', error);
    return {
      ready: false,
      issues: [{
        type: 'NO_PRODUCTION_RESULTS',
        message: 'Unable to validate BOM - check connection'
      }]
    };
  }
}

async function exportToKatana(projectId: string): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  simulated?: boolean;
}> {
  const response = await fetch(`${API_BASE}/katana/create-bom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    return { 
      success: false, 
      error: result.error || result.message || 'Export failed' 
    };
  }
  
  return result;
}

// ============================================
// Sub-Components
// ============================================

interface ValidationIssueListProps {
  issues: BOMValidationIssue[];
}

const ValidationIssueList: React.FC<ValidationIssueListProps> = ({ issues }) => {
  const getIssueIcon = (type: BOMValidationIssue['type']) => {
    switch (type) {
      case 'UNMAPPED_MATERIAL':
        return <Package className="w-4 h-4 text-amber-500" />;
      case 'OPTIMIZATION_OUTDATED':
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      case 'NO_PRODUCTION_RESULTS':
      case 'EMPTY_NESTING':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <span className="font-medium text-red-800">Cannot Export to Katana</span>
      </div>
      <ul className="space-y-2">
        {issues.map((issue, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            {getIssueIcon(issue.type)}
            <span className="text-red-700">{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ExportSuccessProps {
  katanaBOMId: string;
  orderNumber?: string;
  exportedAt?: any;
  simulated?: boolean;
}

const ExportSuccess: React.FC<ExportSuccessProps> = ({ 
  katanaBOMId, 
  orderNumber,
  exportedAt,
  simulated 
}) => {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle className="w-5 h-5 text-green-600" />
        <span className="font-medium text-green-800">
          {simulated ? 'BOM Exported (Simulation)' : 'Exported to Katana'}
        </span>
      </div>
      <div className="text-sm text-green-700 space-y-1">
        <p>
          <span className="font-medium">Order ID:</span> {katanaBOMId}
        </p>
        {orderNumber && (
          <p>
            <span className="font-medium">Order Number:</span> {orderNumber}
          </p>
        )}
        {exportedAt && (
          <p>
            <span className="font-medium">Exported:</span> {formatDate(exportedAt)}
          </p>
        )}
      </div>
      {!simulated && (
        <a
          href={`https://app.katanamrp.com/manufacturing-orders/${katanaBOMId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm text-green-700 hover:text-green-800"
        >
          View in Katana <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};

interface BOMSummaryProps {
  summary: NonNullable<BOMValidationResult['summary']>;
}

const BOMSummary: React.FC<BOMSummaryProps> = ({ summary }) => (
  <div className="grid grid-cols-4 gap-3 text-center">
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-2xl font-bold text-gray-900">{summary.totalSheets}</p>
      <p className="text-xs text-gray-500">Sheets</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-2xl font-bold text-gray-900">{summary.totalParts}</p>
      <p className="text-xs text-gray-500">Parts</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-2xl font-bold text-gray-900">{summary.mappedMaterials}</p>
      <p className="text-xs text-gray-500">Materials</p>
    </div>
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-2xl font-bold text-green-600">
        {summary.totalMaterials > 0 
          ? Math.round((summary.mappedMaterials / summary.totalMaterials) * 100) 
          : 0}%
      </p>
      <p className="text-xs text-gray-500">Mapped</p>
    </div>
  </div>
);

// ============================================
// Main Component
// ============================================

export const KatanaExportSection: React.FC<KatanaExportSectionProps> = ({ 
  project,
  onExportComplete 
}) => {
  const [validation, setValidation] = useState<BOMValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{
    orderId: string;
    orderNumber?: string;
    simulated?: boolean;
  } | null>(null);

  const production = project.optimizationState?.production;
  const alreadyExported = !!production?.katanaBOMId;

  // Run validation on mount and when production changes
  const runValidation = useCallback(async () => {
    setIsValidating(true);
    setExportError(null);
    try {
      const result = await validateBOM(project.id);
      setValidation(result);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [project.id]);

  useEffect(() => {
    if (!alreadyExported) {
      runValidation();
    }
  }, [project.id, production?.validAt, alreadyExported, runValidation]);

  // Handle export
  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const result = await exportToKatana(project.id);
      
      if (result.success) {
        setExportResult({
          orderId: result.orderId!,
          orderNumber: result.orderNumber,
          simulated: result.simulated,
        });
        onExportComplete?.();
      } else {
        setExportError(result.error || 'Export failed');
      }
    } catch (error: any) {
      setExportError(error.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-gray-900">Katana Manufacturing Order</h4>
        </div>
        {!alreadyExported && !exportResult && (
          <button
            onClick={runValidation}
            disabled={isValidating}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Already Exported State */}
        {alreadyExported && (
          <ExportSuccess
            katanaBOMId={production.katanaBOMId!}
            orderNumber={production.katanaOrderNumber}
            exportedAt={production.katanaBOMExportedAt}
          />
        )}

        {/* Just Exported State */}
        {!alreadyExported && exportResult && (
          <ExportSuccess
            katanaBOMId={exportResult.orderId}
            orderNumber={exportResult.orderNumber}
            simulated={exportResult.simulated}
          />
        )}

        {/* Validation In Progress */}
        {!alreadyExported && !exportResult && isValidating && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            <span className="ml-2 text-gray-500">Validating BOM readiness...</span>
          </div>
        )}

        {/* Validation Results */}
        {!alreadyExported && !exportResult && validation && !isValidating && (
          <>
            {/* Issues */}
            {!validation.ready && (
              <ValidationIssueList issues={validation.issues} />
            )}

            {/* Summary (when ready) */}
            {validation.ready && validation.summary && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">BOM Ready for Export</span>
                  </div>
                </div>
                <BOMSummary summary={validation.summary} />
              </>
            )}

            {/* Export Error */}
            {exportError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{exportError}</span>
                </div>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={!validation.ready || isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting to Katana...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Export BOM to Katana
                </>
              )}
            </button>
          </>
        )}

        {/* Help Text */}
        {!alreadyExported && !exportResult && validation && !validation.ready && (
          <p className="text-xs text-gray-500">
            Resolve the issues above to enable BOM export. Ensure all materials are mapped to 
            inventory items and production optimization is up to date.
          </p>
        )}
      </div>
    </div>
  );
};

export default KatanaExportSection;
