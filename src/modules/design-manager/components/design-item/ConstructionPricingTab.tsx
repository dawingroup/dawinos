/**
 * Construction Pricing Tab
 * Manages pricing for construction/fitout items
 * Includes unit-based pricing, labor, materials, and contractor info
 */

import { useState } from 'react';
import { Calculator, Save } from 'lucide-react';
import type { DesignItem } from '../../types';
import {
  CONSTRUCTION_CATEGORY_LABELS,
  CONSTRUCTION_UNIT_SHORT_LABELS,
  calculateConstructionPricing,
  type ConstructionPricing,
  type ConstructionCategory,
  type ConstructionUnitType,
} from '../../types/deliverables';

export interface ConstructionPricingTabProps {
  item: DesignItem;
  projectId: string;
  userId: string;
  onUpdate: (updates: Partial<ConstructionPricing>) => Promise<void>;
  readOnly?: boolean;
}

const UNIT_OPTIONS: { value: ConstructionUnitType; label: string }[] = [
  { value: 'sqm', label: 'Square Meters (m²)' },
  { value: 'sqft', label: 'Square Feet (ft²)' },
  { value: 'lm', label: 'Linear Meters (lm)' },
  { value: 'unit', label: 'Units' },
  { value: 'lot', label: 'Lump Sum' },
];

const CATEGORY_OPTIONS: { value: ConstructionCategory; label: string }[] = Object.entries(
  CONSTRUCTION_CATEGORY_LABELS
).map(([value, label]) => ({ value: value as ConstructionCategory, label }));

const CURRENCY_OPTIONS = ['UGX', 'KES', 'USD', 'EUR', 'GBP', 'ZAR'];

export function ConstructionPricingTab({
  item,
  projectId: _projectId,
  userId: _userId,
  onUpdate,
  readOnly = false,
}: ConstructionPricingTabProps) {
  // Get existing pricing or create defaults
  const existingPricing = (item as any).construction as ConstructionPricing | undefined;

  const [pricing, setPricing] = useState<ConstructionPricing>({
    category: existingPricing?.category || 'other',
    contractor: existingPricing?.contractor || '',
    contractorContact: existingPricing?.contractorContact || '',
    unitType: existingPricing?.unitType || 'sqm',
    quantity: existingPricing?.quantity || 0,
    unitRate: existingPricing?.unitRate || 0,
    laborCost: existingPricing?.laborCost || 0,
    laborDays: existingPricing?.laborDays,
    laborNotes: existingPricing?.laborNotes || '',
    materialsCost: existingPricing?.materialsCost || 0,
    materialsBreakdown: existingPricing?.materialsBreakdown || '',
    subtotal: existingPricing?.subtotal || 0,
    vatRate: existingPricing?.vatRate,
    vatAmount: existingPricing?.vatAmount,
    totalCost: existingPricing?.totalCost || 0,
    currency: existingPricing?.currency || 'UGX',
    quoteReference: existingPricing?.quoteReference || '',
    scopeOfWork: existingPricing?.scopeOfWork || '',
    exclusions: existingPricing?.exclusions || '',
    notes: existingPricing?.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = <K extends keyof ConstructionPricing>(
    field: K,
    value: ConstructionPricing[K]
  ) => {
    const updated = { ...pricing, [field]: value };

    // Recalculate totals
    const calculated = calculateConstructionPricing(updated);
    setPricing(calculated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(pricing);
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${pricing.currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header with Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Construction Pricing</h3>
        {hasChanges && !readOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Category and Contractor */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">General Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Construction Category
            </label>
            <select
              value={pricing.category}
              onChange={(e) => handleFieldChange('category', e.target.value as ConstructionCategory)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={pricing.currency}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            >
              {CURRENCY_OPTIONS.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contractor Name
            </label>
            <input
              type="text"
              value={pricing.contractor || ''}
              onChange={(e) => handleFieldChange('contractor', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="e.g., ABC Construction Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contractor Contact
            </label>
            <input
              type="text"
              value={pricing.contractorContact || ''}
              onChange={(e) => handleFieldChange('contractorContact', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="Phone or email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quote Reference
            </label>
            <input
              type="text"
              value={pricing.quoteReference || ''}
              onChange={(e) => handleFieldChange('quoteReference', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="e.g., QT-2024-001"
            />
          </div>
        </div>
      </div>

      {/* Unit-Based Pricing */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Unit-Based Pricing</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Type
            </label>
            <select
              value={pricing.unitType}
              onChange={(e) => handleFieldChange('unitType', e.target.value as ConstructionUnitType)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity ({CONSTRUCTION_UNIT_SHORT_LABELS[pricing.unitType]})
            </label>
            <input
              type="number"
              value={pricing.quantity || ''}
              onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate per {CONSTRUCTION_UNIT_SHORT_LABELS[pricing.unitType]}
            </label>
            <input
              type="number"
              value={pricing.unitRate || ''}
              onChange={(e) => handleFieldChange('unitRate', parseFloat(e.target.value) || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">
            Unit Total: <span className="font-semibold">{formatCurrency(pricing.quantity * pricing.unitRate)}</span>
          </p>
        </div>
      </div>

      {/* Labor Costs */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Labor Costs</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Cost
            </label>
            <input
              type="number"
              value={pricing.laborCost || ''}
              onChange={(e) => handleFieldChange('laborCost', parseFloat(e.target.value) || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Days
            </label>
            <input
              type="number"
              value={pricing.laborDays || ''}
              onChange={(e) => handleFieldChange('laborDays', parseFloat(e.target.value) || undefined)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Labor Notes
            </label>
            <input
              type="text"
              value={pricing.laborNotes || ''}
              onChange={(e) => handleFieldChange('laborNotes', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="e.g., Includes weekend work"
            />
          </div>
        </div>
      </div>

      {/* Materials Costs */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Materials Costs</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materials Cost
            </label>
            <input
              type="number"
              value={pricing.materialsCost || ''}
              onChange={(e) => handleFieldChange('materialsCost', parseFloat(e.target.value) || 0)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Materials Breakdown
            </label>
            <input
              type="text"
              value={pricing.materialsBreakdown || ''}
              onChange={(e) => handleFieldChange('materialsBreakdown', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="e.g., Tiles, grout, adhesive"
            />
          </div>
        </div>
      </div>

      {/* VAT */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">VAT / Tax</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VAT Rate (%)
            </label>
            <input
              type="number"
              value={(pricing.vatRate || 0) * 100 || ''}
              onChange={(e) => handleFieldChange('vatRate', (parseFloat(e.target.value) || 0) / 100)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
          <div className="flex items-end">
            <div className="bg-gray-50 rounded-lg p-3 w-full">
              <p className="text-sm text-gray-600">
                VAT Amount: <span className="font-semibold">{formatCurrency(pricing.vatAmount || 0)}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scope and Notes */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-700 border-b pb-2">Scope & Notes</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scope of Work
          </label>
          <textarea
            value={pricing.scopeOfWork || ''}
            onChange={(e) => handleFieldChange('scopeOfWork', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            rows={4}
            placeholder="Describe the work to be done..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exclusions
          </label>
          <textarea
            value={pricing.exclusions || ''}
            onChange={(e) => handleFieldChange('exclusions', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            rows={2}
            placeholder="What's NOT included..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={pricing.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100"
            rows={2}
            placeholder="Any other notes..."
          />
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-amber-50 rounded-lg p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-amber-600" />
          <h4 className="text-lg font-medium text-amber-900">Cost Summary</h4>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Unit-based ({pricing.quantity} {CONSTRUCTION_UNIT_SHORT_LABELS[pricing.unitType]} @ {formatCurrency(pricing.unitRate)}):</span>
            <span className="font-medium">{formatCurrency(pricing.quantity * pricing.unitRate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Labor:</span>
            <span className="font-medium">{formatCurrency(pricing.laborCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Materials:</span>
            <span className="font-medium">{formatCurrency(pricing.materialsCost)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-700 font-medium">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(pricing.subtotal)}</span>
          </div>
          {(pricing.vatRate || 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">VAT ({((pricing.vatRate || 0) * 100).toFixed(0)}%):</span>
              <span className="font-medium">{formatCurrency(pricing.vatAmount || 0)}</span>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <span className="text-amber-800 font-semibold text-base">Total:</span>
            <span className="font-bold text-amber-800 text-lg">{formatCurrency(pricing.totalCost)}</span>
          </div>
        </div>
      </div>

      {/* Save Button (bottom) */}
      {hasChanges && !readOnly && (
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
