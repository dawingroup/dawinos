/**
 * EstimateTab Component
 * Display and manage project estimates
 * Includes aggregated standard and special parts for material palette mapping
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Download, AlertTriangle, Plus, Edit2, Trash2, Calculator, Layers, Package, Wrench, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NestingStudio } from '../production/NestingStudio';
import { MaterialPaletteTable } from './MaterialPaletteTable';
import { subscribeToDesignItems } from '../../services/firestore';
import type { Project } from '@/shared/types';
import type { DesignItem, StandardPartEntry, SpecialPartEntry } from '../../types';
import {
  calculateEstimateFromOptimization,
  addEstimateLineItem,
  updateEstimateLineItem,
  removeEstimateLineItem,
  exportEstimateCSV,
  downloadEstimateCSV,
} from '../../services/estimateService';
import { ESTIMATE_CATEGORY_LABELS, DEFAULT_ESTIMATE_CONFIG } from '../../types/estimate';
import type { DesignProject } from '../../types';
import type { ConsolidatedEstimate, EstimateLineItem, EstimateLineItemFormData, EstimateLineItemCategory } from '../../types/estimate';
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

interface EstimateTabProps {
  project: DesignProject;
}

export function EstimateTab({ project }: EstimateTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localEstimate, setLocalEstimate] = useState<ConsolidatedEstimate | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<EstimateLineItem | null>(null);
  const [paletteKey, setPaletteKey] = useState(0); // For refreshing palette
  const [showSettings, setShowSettings] = useState(false);
  const [designItems, setDesignItems] = useState<DesignItem[]>([]);
  const [partsTab, setPartsTab] = useState<'standard' | 'special'>('standard');

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
      const requiredQuantity = item.requiredQuantity || 1;
      
      standardParts.forEach(part => {
        const key = `${part.name}-${part.category}`;
        const existing = partsMap.get(key);
        // Multiply by requiredQuantity for correct totals
        const totalQty = part.quantity * requiredQuantity;
        
        if (existing) {
          existing.totalQuantity += totalQty;
          existing.totalCost += totalQty * part.unitCost;
          if (!existing.fromItems.includes(item.name)) {
            existing.fromItems.push(item.name);
          }
          existing.avgUnitCost = existing.totalCost / existing.totalQuantity;
        } else {
          partsMap.set(key, {
            name: part.name,
            category: part.category,
            totalQuantity: totalQty,
            avgUnitCost: part.unitCost,
            totalCost: totalQty * part.unitCost,
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
      const requiredQuantity = item.requiredQuantity || 1;
      
      specialParts.forEach(part => {
        const key = `${part.name}-${part.category}-${part.supplier || ''}`;
        const existing = partsMap.get(key);
        // Multiply by requiredQuantity for correct totals
        const totalQty = part.quantity * requiredQuantity;
        
        // Special parts use costing.landedUnitCost (includes transport, logistics, customs, exchange rate)
        // Falls back to unitCost * exchangeRate if landedUnitCost not set
        const costing = (part as any).costing;
        const partLandedUnitCost = costing?.landedUnitCost || 
          ((costing?.unitCost || 0) + (costing?.transportCost || 0) + (costing?.logisticsCost || 0) + (costing?.customsCost || 0)) * (costing?.exchangeRate || 1);
        
        if (existing) {
          existing.totalQuantity += totalQty;
          existing.totalCost += totalQty * partLandedUnitCost;
          if (!existing.fromItems.includes(item.name)) {
            existing.fromItems.push(item.name);
          }
          existing.avgUnitCost = existing.totalCost / existing.totalQuantity;
        } else {
          partsMap.set(key, {
            name: part.name,
            category: part.category,
            supplier: part.supplier,
            totalQuantity: totalQty,
            avgUnitCost: partLandedUnitCost,
            totalCost: totalQty * partLandedUnitCost,
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

  // Global cost adjustment settings
  const projectEstimateSettings = (project as any).estimateSettings || {};
  const [overheadPercent, setOverheadPercent] = useState<number>(
    projectEstimateSettings.overheadPercent ?? DEFAULT_ESTIMATE_CONFIG.overheadPercent * 100
  );
  const [marginPercent, setMarginPercent] = useState<number>(
    projectEstimateSettings.marginPercent ?? DEFAULT_ESTIMATE_CONFIG.defaultMarginPercent * 100
  );
  const [taxRate, setTaxRate] = useState<number>(
    projectEstimateSettings.taxRate ?? DEFAULT_ESTIMATE_CONFIG.defaultTaxRate * 100
  );
  const [taxMode, setTaxMode] = useState<'exclusive' | 'inclusive'>(
    projectEstimateSettings.taxMode || 'exclusive'
  );

  const projectData = project as unknown as Project;
  const projectEstimate = (project as any).consolidatedEstimate as ConsolidatedEstimate | undefined;
  const estimate = localEstimate || projectEstimate;
  
  // Get optimization state
  const estimation = projectData.optimizationState?.estimation;
  const isEstimationValid = estimation && !estimation.invalidatedAt;
  const materialPalette = projectData.materialPalette?.entries || [];

  // Build custom config from settings
  const customConfig = {
    ...DEFAULT_ESTIMATE_CONFIG,
    overheadPercent: overheadPercent / 100,
    defaultMarginPercent: marginPercent / 100,
    defaultTaxRate: taxRate / 100,
  };

  const handleGenerate = async () => {
    if (!user?.email) return;
    
    // Check if optimization has been run
    if (!estimation || !isEstimationValid) {
      setError('Please run the Nesting Studio optimization first before generating an estimate.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await calculateEstimateFromOptimization(
        project.id,
        estimation,
        materialPalette,
        user.email,
        customConfig,
        taxMode
      );
      setLocalEstimate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (data: EstimateLineItemFormData) => {
    if (!user?.email || !estimate) return;
    setLoading(true);
    try {
      const result = await addEstimateLineItem(project.id, estimate, data, user.email);
      setLocalEstimate(result);
      setShowAddItem(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId: string, data: Partial<EstimateLineItemFormData>) => {
    if (!user?.email || !estimate) return;
    setLoading(true);
    try {
      const result = await updateEstimateLineItem(project.id, estimate, itemId, data, user.email);
      setLocalEstimate(result);
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!user?.email || !estimate) return;
    if (!confirm('Remove this line item?')) return;
    setLoading(true);
    try {
      const result = await removeEstimateLineItem(project.id, estimate, itemId, user.email);
      setLocalEstimate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!estimate) return;
    const csv = exportEstimateCSV(estimate);
    downloadEstimateCSV(csv, `${project.code}-estimate.csv`);
  };

  return (
    <div className="space-y-4">
      {/* No optimization warning */}
      {!isEstimationValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-800">Optimization required</p>
            <p className="text-sm text-amber-700">Run the Nesting Studio optimization below to generate an estimate</p>
          </div>
        </div>
      )}

      {/* Stale warning */}
      {estimate?.isStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-800">Estimate is outdated</p>
              <p className="text-sm text-amber-700">{estimate.staleReason || 'Cutlist has been modified'}</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !isEstimationValid}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}

      {/* Global Cost Adjustment Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            ⚙️ Global Cost Adjustments
          </h3>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-primary hover:underline"
          >
            {showSettings ? 'Hide Settings' : 'Edit Settings'}
          </button>
        </div>

        {showSettings ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Overhead %</label>
              <input
                type="number"
                value={overheadPercent}
                onChange={(e) => setOverheadPercent(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Applied to all items</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Margin %</label>
              <input
                type="number"
                value={marginPercent}
                onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="1"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Profit margin</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tax Rate %</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.5"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">VAT/Sales tax</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tax Mode</label>
              <select
                value={taxMode}
                onChange={(e) => setTaxMode(e.target.value as 'exclusive' | 'inclusive')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="exclusive">Exclusive (added on top)</option>
                <option value="inclusive">Inclusive (included in total)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">How tax is applied</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">Overhead: {overheadPercent}%</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Margin: {marginPercent}%</span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Tax: {taxRate}% ({taxMode})</span>
          </div>
        )}
      </div>

      {/* Summary */}
      {estimate && (
        <div className="space-y-4">
          {/* Cost Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {/* Base Subtotal (pulled in from items before markup) */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase">Base Subtotal</p>
              <p className="text-xs text-gray-400 mb-1">(pulled in costs)</p>
              <p className="text-lg font-bold text-gray-900">
                {estimate.currency} {Math.round(estimate.subtotal / ((1 + (estimate.overheadPercent || 0)) * (1 + (estimate.marginPercent || 0)))).toLocaleString()}
              </p>
            </div>
            {/* Overhead */}
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs text-amber-600 uppercase">Overhead</p>
              <p className="text-xs text-amber-500 mb-1">({((estimate.overheadPercent || 0) * 100).toFixed(0)}%)</p>
              <p className="text-lg font-bold text-amber-700">
                +{estimate.currency} {(estimate.overheadAmount || 0).toLocaleString()}
              </p>
            </div>
            {/* Margin */}
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-purple-600 uppercase">Margin</p>
              <p className="text-xs text-purple-500 mb-1">({((estimate.marginPercent || 0) * 100).toFixed(0)}%)</p>
              <p className="text-lg font-bold text-purple-700">
                +{estimate.currency} {(estimate.marginAmount || 0).toLocaleString()}
              </p>
            </div>
            {/* Marked-up Subtotal */}
            <div className="bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-600 uppercase">Subtotal</p>
              <p className="text-xs text-gray-400 mb-1">(with markup)</p>
              <p className="text-lg font-bold text-gray-900">
                {estimate.currency} {estimate.subtotal.toLocaleString()}
              </p>
            </div>
            {/* Tax */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 uppercase">Tax</p>
              <p className="text-xs text-gray-400 mb-1">({(estimate.taxRate * 100).toFixed(0)}%{estimate.taxMode === 'inclusive' ? ' incl' : ''})</p>
              <p className="text-lg font-bold text-gray-900">
                {estimate.taxMode === 'inclusive' ? '' : '+'}{estimate.currency} {estimate.taxAmount.toLocaleString()}
              </p>
            </div>
            {/* Grand Total */}
            <div className="bg-primary/10 rounded-lg p-3">
              <p className="text-xs text-primary uppercase">Grand Total</p>
              <p className="text-2xl font-bold text-primary">
                {estimate.currency} {estimate.total.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading || !isEstimationValid}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Calculator className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Calculating...' : estimate ? 'Recalculate' : 'Generate Estimate'}
          </button>
          {estimate && (
            <>
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </>
          )}
        </div>
        {estimate && (
          <span className="text-sm text-gray-500">
            Generated: {formatDateTime(estimate.generatedAt)}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Line Items Table */}
      {!estimate ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No estimate generated</h3>
          <p className="text-gray-500 mt-1">
            {isEstimationValid 
              ? 'Click "Generate Estimate" to calculate costs from optimization'
              : 'Run the Nesting Studio optimization below, then generate an estimate'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estimate.lineItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.category === 'material' ? 'bg-blue-100 text-blue-700' :
                      item.category === 'labor' ? 'bg-green-100 text-green-700' :
                      item.category === 'overhead' ? 'bg-gray-100 text-gray-600' :
                      item.category === 'procurement' ? 'bg-teal-100 text-teal-700' :
                      item.category === 'procurement-logistics' ? 'bg-sky-100 text-sky-700' :
                      item.category === 'procurement-customs' ? 'bg-orange-100 text-orange-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {ESTIMATE_CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {item.description}
                    {item.isManual && (
                      <span className="ml-2 text-xs text-gray-400">(manual)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {estimate.currency} {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {estimate.currency} {item.totalPrice.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {item.isManual && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right font-medium text-gray-700">Subtotal</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {estimate.currency} {estimate.subtotal.toLocaleString()}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={5} className="px-4 py-2 text-right text-gray-600">
                  Tax ({(estimate.taxRate * 100).toFixed(0)}%) {estimate.taxMode === 'inclusive' ? '(included)' : ''}
                </td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {estimate.taxMode === 'inclusive' ? '' : '+'}{estimate.currency} {estimate.taxAmount.toLocaleString()}
                </td>
                <td></td>
              </tr>
              <tr className="border-t border-gray-300">
                <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-900">TOTAL</td>
                <td className="px-4 py-3 text-right font-bold text-lg text-primary">
                  {estimate.currency} {estimate.total.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add Item Dialog */}
      {showAddItem && (
        <LineItemDialog
          onSubmit={handleAddItem}
          onCancel={() => setShowAddItem(false)}
          currency={estimate?.currency || 'UGX'}
        />
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
        <LineItemDialog
          item={editingItem}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
          onCancel={() => setEditingItem(null)}
          currency={estimate?.currency || 'UGX'}
        />
      )}

      {/* Error Checking Section */}
      {estimate && (estimate.hasErrors || estimate.errorChecks?.length) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Cost Verification Issues</h3>
            <span className="text-sm text-red-600">
              ({estimate.errorChecks?.length || 0} design items need attention)
            </span>
          </div>
          <div className="space-y-2">
            {estimate.errorChecks?.map((err, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm bg-white rounded p-2 border border-red-100">
                <span className="font-medium text-gray-900">{err.itemName}</span>
                <span className="text-red-600">→ {err.issue}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-600 mt-3">
            Fix these issues and regenerate the estimate for accurate costing.
          </p>
        </div>
      )}

      {/* Cost Verification Summary */}
      {estimate && !estimate.hasErrors && estimate.designItemCount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span className="font-medium text-green-800">Cost Verification Passed</span>
            </div>
            <div className="text-sm text-green-700">
              {estimate.lineItemCount} of {estimate.designItemCount} design items costed
            </div>
          </div>
        </div>
      )}

      {/* Material Palette Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-purple-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Material Palette</h3>
            <p className="text-sm text-gray-500">Manage material inventory mappings for optimization</p>
          </div>
        </div>
        
        {user?.email && (
          <MaterialPaletteTable
            key={paletteKey}
            projectId={project.id}
            palette={projectData.materialPalette}
            onPaletteUpdated={() => setPaletteKey(k => k + 1)}
            userId={user.email}
          />
        )}
      </div>

      {/* Consumable Parts Section (Standard & Special) */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Consumable Parts</h3>
              <p className="text-sm text-gray-500">Aggregated standard and special parts from all design items</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
              Standard: {aggregatedStandardParts.reduce((s, p) => s + p.totalQuantity, 0)} pcs
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
              Special: {aggregatedSpecialParts.reduce((s, p) => s + p.totalQuantity, 0)} pcs
            </span>
          </div>
        </div>

        {/* Parts Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setPartsTab('standard')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              partsTab === 'standard'
                ? 'text-orange-600 border-orange-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Wrench className="w-4 h-4 inline mr-2" />
            Standard Parts ({aggregatedStandardParts.length})
          </button>
          <button
            onClick={() => setPartsTab('special')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              partsTab === 'special'
                ? 'text-purple-600 border-purple-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Special Parts ({aggregatedSpecialParts.length})
          </button>
        </div>

        {/* Standard Parts Table */}
        {partsTab === 'standard' && (
          <>
            {aggregatedStandardParts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No standard parts added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add standard parts in the Parts tab of each design item</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-orange-800">Part Name</th>
                      <th className="px-4 py-2 text-left font-medium text-orange-800">Category</th>
                      <th className="px-4 py-2 text-center font-medium text-orange-800">Qty</th>
                      <th className="px-4 py-2 text-right font-medium text-orange-800">Unit Cost</th>
                      <th className="px-4 py-2 text-right font-medium text-orange-800">Total</th>
                      <th className="px-4 py-2 text-left font-medium text-orange-800">Used In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {aggregatedStandardParts.map((part, idx) => (
                      <tr key={idx} className="hover:bg-orange-50/50">
                        <td className="px-4 py-2 font-medium text-gray-900">{part.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs capitalize">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center font-medium">{part.totalQuantity}</td>
                        <td className="px-4 py-2 text-right text-gray-600">UGX {Math.round(part.avgUnitCost).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-medium text-orange-700">UGX {Math.round(part.totalCost).toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate" title={part.fromItems.join(', ')}>{part.fromItems.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-orange-50 border-t border-orange-200">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-right font-medium text-orange-800">Total Standard Parts</td>
                      <td className="px-4 py-2 text-right font-bold text-orange-900">UGX {standardPartsTotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}

        {/* Special Parts Table */}
        {partsTab === 'special' && (
          <>
            {aggregatedSpecialParts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No special parts added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add special parts in the Parts tab of each design item</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50 border-b border-purple-200">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-purple-800">Part Name</th>
                      <th className="px-4 py-2 text-left font-medium text-purple-800">Category</th>
                      <th className="px-4 py-2 text-left font-medium text-purple-800">Supplier</th>
                      <th className="px-4 py-2 text-center font-medium text-purple-800">Qty</th>
                      <th className="px-4 py-2 text-right font-medium text-purple-800">Unit Cost</th>
                      <th className="px-4 py-2 text-right font-medium text-purple-800">Total</th>
                      <th className="px-4 py-2 text-left font-medium text-purple-800">Used In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {aggregatedSpecialParts.map((part, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/50">
                        <td className="px-4 py-2 font-medium text-gray-900">{part.name}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs capitalize">
                            {part.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">{part.supplier || '-'}</td>
                        <td className="px-4 py-2 text-center font-medium">{part.totalQuantity}</td>
                        <td className="px-4 py-2 text-right text-gray-600">UGX {Math.round(part.avgUnitCost).toLocaleString()}</td>
                        <td className="px-4 py-2 text-right font-medium text-purple-700">UGX {Math.round(part.totalCost).toLocaleString()}</td>
                        <td className="px-4 py-2 text-xs text-gray-500 max-w-[200px] truncate" title={part.fromItems.join(', ')}>{part.fromItems.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-purple-50 border-t border-purple-200">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-right font-medium text-purple-800">Total Special Parts</td>
                      <td className="px-4 py-2 text-right font-bold text-purple-900">UGX {specialPartsTotal.toLocaleString()}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Material Estimation Section */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <Layers className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">Material Estimation</h3>
            <p className="text-sm text-gray-500">Optimize sheet usage and estimate material costs</p>
          </div>
        </div>
        
        {user?.email && (
          <NestingStudio
            key={`nesting-${paletteKey}`}
            projectId={project.id}
            project={projectData}
            mode="ESTIMATION"
            userId={user.email}
            onRefresh={() => setPaletteKey(k => k + 1)}
          />
        )}
      </div>
    </div>
  );
}

function LineItemDialog({
  item,
  onSubmit,
  onCancel,
  currency,
}: {
  item?: EstimateLineItem;
  onSubmit: (data: EstimateLineItemFormData) => Promise<void>;
  onCancel: () => void;
  currency: string;
}) {
  const [formData, setFormData] = useState<EstimateLineItemFormData>({
    description: item?.description || '',
    category: item?.category || 'other',
    quantity: item?.quantity || 1,
    unit: item?.unit || 'ea',
    unitPrice: item?.unitPrice || 0,
    notes: item?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">{item ? 'Edit' : 'Add'} Line Item</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as EstimateLineItemCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              >
                {Object.entries(ESTIMATE_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ({currency})</label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            Total: {currency} {(formData.quantity * formData.unitPrice).toLocaleString()}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.description}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : item ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EstimateTab;
