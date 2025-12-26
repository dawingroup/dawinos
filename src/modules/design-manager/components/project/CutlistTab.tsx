/**
 * CutlistTab Component
 * Display consolidated cutlist at project level
 */

import { useState } from 'react';
import { RefreshCw, Download, AlertTriangle, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { useAuth } from '@/shared/hooks';
import { useCutlistAggregation } from '../../hooks/useCutlistAggregation';
import { exportCutlistCSV, exportCutlistSummaryCSV, downloadCSV } from '../../services/cutlistAggregation';
import type { DesignProject, ConsolidatedCutlist, MaterialGroup } from '../../types';
import { formatDateTime } from '../../utils/formatting';

interface CutlistTabProps {
  project: DesignProject;
}

function MaterialGroupCard({ group, defaultExpanded = false }: { group: MaterialGroup; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">{group.materialName}</h3>
            <p className="text-sm text-gray-500">{group.thickness}mm • {group.totalParts} parts</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{group.totalArea.toFixed(2)} m²</p>
          <p className="text-sm text-gray-500">~{group.estimatedSheets} sheets</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Part #</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Design Item</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">L (mm)</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">W (mm)</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Qty</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Grain</th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">Edges</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.parts.map((part, idx) => (
                  <tr key={`${part.partId}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-gray-600">{part.partNumber}</td>
                    <td className="px-4 py-2 text-gray-900">{part.partName}</td>
                    <td className="px-4 py-2 text-gray-600">{part.designItemName}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{part.length}</td>
                    <td className="px-4 py-2 text-right text-gray-700">{part.width}</td>
                    <td className="px-4 py-2 text-center text-gray-700">{part.quantity}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        part.grainDirection === 'length' ? 'bg-blue-100 text-blue-700' :
                        part.grainDirection === 'width' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {part.grainDirection === 'length' ? 'L' : part.grainDirection === 'width' ? 'W' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center text-xs text-gray-500">
                      {[
                        part.edgeBanding?.top && 'T',
                        part.edgeBanding?.bottom && 'B',
                        part.edgeBanding?.left && 'L',
                        part.edgeBanding?.right && 'R',
                      ].filter(Boolean).join('') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function CutlistTab({ project }: CutlistTabProps) {
  const { user } = useAuth();
  const { regenerate, loading, error } = useCutlistAggregation(project.id);
  
  // Local state to hold cutlist (updated after regeneration)
  const [localCutlist, setLocalCutlist] = useState<ConsolidatedCutlist | null>(null);
  
  // Use local cutlist if available, otherwise use project's cutlist
  const projectCutlist = (project as any).consolidatedCutlist as ConsolidatedCutlist | undefined;
  const cutlist = localCutlist || projectCutlist;

  const handleRegenerate = async () => {
    if (!user?.email) return;
    try {
      const result = await regenerate(user.email);
      setLocalCutlist(result);
    } catch (err) {
      // Error handled by hook
      console.error('Failed to regenerate cutlist:', err);
    }
  };

  const handleExportDetails = () => {
    if (!cutlist) return;
    const csv = exportCutlistCSV(cutlist);
    downloadCSV(csv, `${project.code}-cutlist-details.csv`);
  };

  const handleExportSummary = () => {
    if (!cutlist) return;
    const csv = exportCutlistSummaryCSV(cutlist);
    downloadCSV(csv, `${project.code}-cutlist-summary.csv`);
  };

  return (
    <div className="space-y-4">
      {/* Stale Warning */}
      {cutlist?.isStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">Cutlist is outdated</p>
              <p className="text-sm text-amber-700">{cutlist.staleReason || 'Parts have been modified since last generation'}</p>
            </div>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {cutlist && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Parts</p>
            <p className="text-2xl font-bold text-gray-900">{cutlist.totalParts ?? 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Unique Parts</p>
            <p className="text-2xl font-bold text-gray-900">{cutlist.totalUniquePartsCount ?? 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Materials</p>
            <p className="text-2xl font-bold text-gray-900">{cutlist.totalMaterials ?? 0}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Total Area</p>
            <p className="text-2xl font-bold text-gray-900">{(cutlist.totalArea ?? 0).toFixed(2)} m²</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Est. Sheets</p>
            <p className="text-2xl font-bold text-gray-900">{cutlist.estimatedTotalSheets ?? 0}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Generating...' : 'Regenerate Cutlist'}
          </button>
          {cutlist && (
            <>
              <button
                onClick={handleExportDetails}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export Details
              </button>
              <button
                onClick={handleExportSummary}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export Summary
              </button>
            </>
          )}
        </div>
        {cutlist && (
          <span className="text-sm text-gray-500">
            Generated: {formatDateTime(cutlist.generatedAt)}
          </span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {/* Material Groups */}
      {!cutlist ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No cutlist generated</h3>
          <p className="text-gray-500 mt-1">Click "Regenerate Cutlist" to aggregate parts from all design items</p>
        </div>
      ) : !cutlist.materialGroups || cutlist.materialGroups.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No parts found</h3>
          <p className="text-gray-500 mt-1">Add parts to design items to generate the cutlist</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cutlist.materialGroups.map((group, idx) => (
            <MaterialGroupCard key={group.materialCode} group={group} defaultExpanded={idx === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CutlistTab;
