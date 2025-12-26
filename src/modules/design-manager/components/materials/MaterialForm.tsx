/**
 * MaterialForm Component
 * Form for creating/editing materials
 */

import { useState, useEffect } from 'react';
import { generateMaterialCode } from '../../services/materialService';
import { MATERIAL_CATEGORIES, MATERIAL_UNITS, COMMON_THICKNESSES } from '../../types/materials';
import type { MaterialFormData, MaterialCategory, MaterialUnit, Material } from '../../types/materials';

interface MaterialFormProps {
  material?: Material;
  onSubmit: (data: MaterialFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function MaterialForm({ material, onSubmit, onCancel, isSubmitting = false }: MaterialFormProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    code: material?.code || '',
    name: material?.name || '',
    description: material?.description || '',
    category: material?.category || 'sheet-goods',
    dimensions: material?.dimensions || { length: 2440, width: 1220, thickness: 18 },
    pricing: material?.pricing ? {
      unitCost: material.pricing.unitCost,
      currency: material.pricing.currency,
      unit: material.pricing.unit,
      supplier: material.pricing.supplier,
    } : {
      unitCost: 0,
      currency: 'UGX',
      unit: 'sheet',
    },
    grainPattern: material?.grainPattern || 'none',
    status: material?.status || 'active',
  });

  const [autoCode, setAutoCode] = useState(!material);

  useEffect(() => {
    if (autoCode && formData.name) {
      setFormData((prev) => ({
        ...prev,
        code: generateMaterialCode(formData.name, formData.category),
      }));
    }
  }, [formData.name, formData.category, autoCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = <K extends keyof MaterialFormData>(field: K, value: MaterialFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateDimension = (field: 'length' | 'width' | 'thickness', value: number) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions!, [field]: value },
    }));
  };

  const updatePricing = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      pricing: { ...prev.pricing!, [field]: value },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            placeholder="e.g., Birch Plywood"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                setAutoCode(false);
                updateField('code', e.target.value);
              }}
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary font-mono"
              placeholder="SHT-BIRCH-001"
            />
          </div>
          {autoCode && (
            <p className="text-xs text-gray-500 mt-1">Auto-generated from name</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value as MaterialCategory)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          >
            {Object.entries(MATERIAL_CATEGORIES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>
                {icon} {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          placeholder="Optional description..."
        />
      </div>

      {/* Dimensions (for sheet goods) */}
      {(formData.category === 'sheet-goods' || formData.category === 'solid-wood') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dimensions (mm)</label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Length</label>
              <input
                type="number"
                value={formData.dimensions?.length || 0}
                onChange={(e) => updateDimension('length', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <input
                type="number"
                value={formData.dimensions?.width || 0}
                onChange={(e) => updateDimension('width', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thickness</label>
              <select
                value={formData.dimensions?.thickness || 18}
                onChange={(e) => updateDimension('thickness', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {COMMON_THICKNESSES.map((t) => (
                  <option key={t} value={t}>{t}mm</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Pricing */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Pricing</label>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit Cost</label>
            <input
              type="number"
              value={formData.pricing?.unitCost || 0}
              onChange={(e) => updatePricing('unitCost', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Currency</label>
            <select
              value={formData.pricing?.currency || 'UGX'}
              onChange={(e) => updatePricing('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="UGX">UGX</option>
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Per Unit</label>
            <select
              value={formData.pricing?.unit || 'sheet'}
              onChange={(e) => updatePricing('unit', e.target.value as MaterialUnit)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {Object.entries(MATERIAL_UNITS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Supplier</label>
            <input
              type="text"
              value={formData.pricing?.supplier || ''}
              onChange={(e) => updatePricing('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      {/* Grain Pattern */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grain Pattern</label>
          <select
            value={formData.grainPattern || 'none'}
            onChange={(e) => updateField('grainPattern', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="none">None</option>
            <option value="lengthwise">Lengthwise</option>
            <option value="crosswise">Crosswise</option>
            <option value="random">Random</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="active">Active</option>
            <option value="discontinued">Discontinued</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name || !formData.code}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : material ? 'Update Material' : 'Create Material'}
        </button>
      </div>
    </form>
  );
}

export default MaterialForm;
