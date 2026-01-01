/**
 * CutlistTab Component
 * Display consolidated cutlist at project level
 * Includes sheet parts, standard parts, and special parts aggregation
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Download, AlertTriangle, ChevronDown, ChevronRight, Package, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCutlistAggregation } from '../../hooks/useCutlistAggregation';
import { exportCutlistCSV, exportCutlistSummaryCSV, downloadCSV } from '../../services/cutlistAggregation';
import { subscribeToDesignItems } from '../../services/firestore';
import type { DesignProject, DesignItem, ConsolidatedCutlist, MaterialGroup, StandardPartEntry, SpecialPartEntry } from '../../types';
import { formatDateTime } from '../../utils/formatting';

// Aggregated parts types
interface AggregatedStandardPart {
  name: string;
  category: string;
  totalQuantity: number;
  avgUnitCost: number;
  totalCost: number;
  fromItems: string[];
}

interface AggregatedSpecialPart {
  name: string;
  category: string;
  supplier?: string;
  totalQuantity: number;
  avgUnitCost: number;
  totalCost: number;
  fromItems: string[];
}

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
  const [designItems, setDesignItems] = useState<DesignItem[]>([]);
  const [activeTab, setActiveTab] = useState<'sheet' | 'standard' | 'special'>('sheet');
  
  // Subscribe to design items for parts aggregation
  useEffect(() => {
    const unsubscribe = subscribeToDesignItems(project.id, (items) => {
      setDesignItems(items);
    });
    return () => unsubscribe();
  }, [project.id]);
  
  // Aggregate standard parts from all design items
  const aggregatedStandardParts: AggregatedStandardPart[] = (() => {
    const partsMap = new Map<string, AggregatedStandardPart>();
    
    designItems.forEach(item => {
      const manufacturing = (item as any).manufacturing;
      const standardParts: StandardPartEntry[] = manufacturing?.standardParts || [];
      
      standardParts.forEach(part => {
        const key = `${part.name}-${part.category}`;
        const existing = partsMap.get(key);
        
        if (existing) {
          existing.totalQuantity += part.quantity;
          existing.totalCost += part.quantity * part.unitCost;
          if (!existing.fromItems.includes(item.name)) {
            existing.fromItems.push(item.name);
          }
          existing.avgUnitCost = existing.totalCost / existing.totalQuantity;
        } else {
          partsMap.set(key, {
            name: part.name,
            category: part.category,
            totalQuantity: part.quantity,
            avgUnitCost: part.unitCost,
            totalCost: part.quantity * part.unitCost,
            fromItems: [item.name],
          });
        }
      });
    });
    
    return Array.from(partsMap.values()).sort((a, b) => b.totalCost - a.totalCost);
  })();
  
  // Aggregate special parts from all design items
  const aggregatedSpecialParts: AggregatedSpecialPart[] = (() => {
    const partsMap = new Map<string, AggregatedSpecialPart>();
    
    designItems.forEach(item => {
      const manufacturing = (item as any).manufacturing;
      const specialParts: SpecialPartEntry[] = manufacturing?.specialParts || [];
      
      specialParts.forEach(part => {
        const key = `${part.name}-${part.category}-${part.supplier || ''}`;
        const existing = partsMap.get(key);
        
        if (existing) {
          existing.totalQuantity += part.quantity;
          existing.totalCost += part.quantity * part.unitCost;
          if (!existing.fromItems.includes(item.name)) {
            existing.fromItems.push(item.name);
          }
          existing.avgUnitCost = existing.totalCost / existing.totalQuantity;
        } else {
          partsMap.set(key, {
            name: part.name,
            category: part.category,
            supplier: part.supplier,
            totalQuantity: part.quantity,
            avgUnitCost: part.unitCost,
            totalCost: part.quantity * part.unitCost,
            fromItems: [item.name],
          });
        }
      });
    });
    
    return Array.from(partsMap.values()).sort((a, b) => b.totalCost - a.totalCost);
  })();
  
  // Calculate totals
  const standardPartsTotal = aggregatedStandardParts.reduce((sum, p) => sum + p.totalCost, 0);
  const specialPartsTotal = aggregatedSpecialParts.reduce((sum, p) => sum + p.totalCost, 0);
  
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
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">Sheet Parts</p>
          <p className="text-xl font-bold text-gray-900">{cutlist?.totalParts ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">Materials</p>
          <p className="text-xl font-bold text-gray-900">{cutlist?.totalMaterials ?? 0}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase">Est. Sheets</p>
          <p className="text-xl font-bold text-gray-900">{cutlist?.estimatedTotalSheets ?? 0}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-orange-600 uppercase">Standard Parts</p>
          <p className="text-xl font-bold text-orange-700">{aggregatedStandardParts.reduce((sum, p) => sum + p.totalQuantity, 0)}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <p className="text-xs text-orange-600 uppercase">Std Parts Cost</p>
          <p className="text-lg font-bold text-orange-700">UGX {standardPartsTotal.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 uppercase">Special Parts</p>
          <p className="text-xl font-bold text-purple-700">{aggregatedSpecialParts.reduce((sum, p) => sum + p.totalQuantity, 0)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-xs text-purple-600 uppercase">Special Cost</p>
          <p className="text-lg font-bold text-purple-700">UGX {specialPartsTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('sheet')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'sheet'
              ? 'text-primary border-primary'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Sheet Parts ({cutlist?.totalParts ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('standard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'standard'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4 inline mr-2" />
          Standard Parts ({aggregatedStandardParts.length})
        </button>
        <button
          onClick={() => setActiveTab('special')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'special'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          Special Parts ({aggregatedSpecialParts.length})
        </button>
      </div>

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

      {/* Tab Content */}
      {activeTab === 'sheet' && (
        <>
          {!cutlist ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No cutlist generated</h3>
              <p className="text-gray-500 mt-1">Click "Regenerate Cutlist" to aggregate parts from all design items</p>
            </div>
          ) : !cutlist.materialGroups || cutlist.materialGroups.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No sheet parts found</h3>
              <p className="text-gray-500 mt-1">Add parts to design items to generate the cutlist</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cutlist.materialGroups.map((group, idx) => (
                <MaterialGroupCard key={group.materialCode} group={group} defaultExpanded={idx === 0} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'standard' && (
        <>
          {aggregatedStandardParts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No standard parts</h3>
              <p className="text-gray-500 mt-1">Add standard parts (hinges, slides, screws) in the Parts tab of each design item</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-orange-50 border-b border-orange-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">Part Name</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">Category</th>
                    <th className="px-4 py-3 text-center font-medium text-orange-800">Total Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-orange-800">Avg Unit Cost</th>
                    <th className="px-4 py-3 text-right font-medium text-orange-800">Total Cost</th>
                    <th className="px-4 py-3 text-left font-medium text-orange-800">Used In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100">
                  {aggregatedStandardParts.map((part, idx) => (
                    <tr key={idx} className="hover:bg-orange-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{part.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs capitalize">
                          {part.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{part.totalQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">UGX {Math.round(part.avgUnitCost).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-orange-700">UGX {Math.round(part.totalCost).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{part.fromItems.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-50 border-t border-orange-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-medium text-orange-800">Total Standard Parts Cost</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-900">UGX {standardPartsTotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'special' && (
        <>
          {aggregatedSpecialParts.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No special parts</h3>
              <p className="text-gray-500 mt-1">Add special parts (custom handles, locks) in the Parts tab of each design item</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-purple-50 border-b border-purple-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-purple-800">Part Name</th>
                    <th className="px-4 py-3 text-left font-medium text-purple-800">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-purple-800">Supplier</th>
                    <th className="px-4 py-3 text-center font-medium text-purple-800">Total Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-purple-800">Avg Unit Cost</th>
                    <th className="px-4 py-3 text-right font-medium text-purple-800">Total Cost</th>
                    <th className="px-4 py-3 text-left font-medium text-purple-800">Used In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {aggregatedSpecialParts.map((part, idx) => (
                    <tr key={idx} className="hover:bg-purple-50/50">
                      <td className="px-4 py-3 font-medium text-gray-900">{part.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs capitalize">
                          {part.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{part.supplier || '-'}</td>
                      <td className="px-4 py-3 text-center font-medium">{part.totalQuantity}</td>
                      <td className="px-4 py-3 text-right text-gray-600">UGX {Math.round(part.avgUnitCost).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-purple-700">UGX {Math.round(part.totalCost).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{part.fromItems.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-purple-50 border-t border-purple-200">
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-right font-medium text-purple-800">Total Special Parts Cost</td>
                    <td className="px-4 py-3 text-right font-bold text-purple-900">UGX {specialPartsTotal.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CutlistTab;
