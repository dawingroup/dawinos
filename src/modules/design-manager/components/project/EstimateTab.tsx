/**
 * EstimateTab Component
 * Display and manage project estimates
 */

import { useState } from 'react';
import { RefreshCw, Download, AlertTriangle, Plus, Edit2, Trash2, Calculator } from 'lucide-react';
import { useAuth } from '@/shared/hooks';
import {
  calculateEstimate,
  addEstimateLineItem,
  updateEstimateLineItem,
  removeEstimateLineItem,
  exportEstimateCSV,
  downloadEstimateCSV,
} from '../../services/estimateService';
import { ESTIMATE_CATEGORY_LABELS, DEFAULT_ESTIMATE_CONFIG } from '../../types/estimate';
import type { DesignProject, ConsolidatedCutlist } from '../../types';
import type { ConsolidatedEstimate, EstimateLineItem, EstimateLineItemFormData, EstimateLineItemCategory } from '../../types/estimate';
import { formatDateTime } from '../../utils/formatting';

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

  const cutlist = (project as any).consolidatedCutlist as ConsolidatedCutlist | undefined;
  const projectEstimate = (project as any).consolidatedEstimate as ConsolidatedEstimate | undefined;
  const estimate = localEstimate || projectEstimate;

  const handleGenerate = async () => {
    if (!user?.email || !cutlist) return;
    setLoading(true);
    setError(null);
    try {
      const result = await calculateEstimate(
        project.id,
        project.customerId,
        cutlist,
        user.email,
        DEFAULT_ESTIMATE_CONFIG
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
      {/* No cutlist warning */}
      {!cutlist && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-800">No cutlist available</p>
            <p className="text-sm text-amber-700">Generate a cutlist first before creating an estimate</p>
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
            disabled={loading || !cutlist}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      )}

      {/* Summary */}
      {estimate && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Subtotal</p>
            <p className="text-xl font-bold text-gray-900">
              {estimate.currency} {estimate.subtotal.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Tax ({(estimate.taxRate * 100).toFixed(0)}%)</p>
            <p className="text-xl font-bold text-gray-900">
              {estimate.currency} {estimate.taxAmount.toLocaleString()}
            </p>
          </div>
          {estimate.marginAmount ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Margin ({((estimate.marginPercent || 0) * 100).toFixed(0)}%)</p>
              <p className="text-xl font-bold text-gray-900">
                {estimate.currency} {estimate.marginAmount.toLocaleString()}
              </p>
            </div>
          ) : null}
          <div className="bg-primary/10 rounded-lg p-4 col-span-2 sm:col-span-1">
            <p className="text-xs text-primary uppercase">Total</p>
            <p className="text-2xl font-bold text-primary">
              {estimate.currency} {estimate.total.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading || !cutlist}
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
            {cutlist 
              ? 'Click "Generate Estimate" to calculate costs from the cutlist'
              : 'Generate a cutlist first, then create an estimate'}
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
                  Tax ({(estimate.taxRate * 100).toFixed(0)}%)
                </td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {estimate.currency} {estimate.taxAmount.toLocaleString()}
                </td>
                <td></td>
              </tr>
              {estimate.marginAmount ? (
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-gray-600">
                    Margin ({((estimate.marginPercent || 0) * 100).toFixed(0)}%)
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700">
                    {estimate.currency} {estimate.marginAmount.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              ) : null}
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
          currency={estimate?.currency || 'KES'}
        />
      )}

      {/* Edit Item Dialog */}
      {editingItem && (
        <LineItemDialog
          item={editingItem}
          onSubmit={(data) => handleUpdateItem(editingItem.id, data)}
          onCancel={() => setEditingItem(null)}
          currency={estimate?.currency || 'KES'}
        />
      )}
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
