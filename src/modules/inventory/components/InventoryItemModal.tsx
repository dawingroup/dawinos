/**
 * InventoryItemModal Component
 * Modal for creating and editing inventory items
 */

import { useState, useEffect } from 'react';
import { X, Package, Save, Loader2 } from 'lucide-react';
import {
  createInventoryItem,
  updateInventoryItem,
  getInventoryItem,
  generateSku,
} from '../services/inventoryService';
import type {
  InventoryItem,
  InventoryCategory,
  InventoryClassification,
  InventoryUnit,
  InventoryStatus,
  GrainPattern,
} from '../types';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  COMMON_THICKNESSES,
} from '../types';
import { SupplierPicker } from '@/modules/manufacturing/components/po/SupplierPicker';

interface InventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  itemId?: string; // If provided, edit mode
  userId: string;
}

const CURRENCIES = ['UGX', 'KES', 'USD'];

export function InventoryItemModal({
  isOpen,
  onClose,
  onSaved,
  itemId,
  userId,
}: InventoryItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<InventoryClassification>('material');
  const [category, setCategory] = useState<InventoryCategory>('sheet-goods');
  const [subcategory, setSubcategory] = useState('');
  const [supplierValue, setSupplierValue] = useState<{ supplierId: string; supplierName: string } | null>(null);
  const [shopifyProductId, setShopifyProductId] = useState('');
  const [shopifyVariantId, setShopifyVariantId] = useState('');
  const [tags, setTags] = useState('');
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [currency, setCurrency] = useState('UGX');
  const [unit, setUnit] = useState<InventoryUnit>('sheet');
  const [thickness, setThickness] = useState<number | ''>('');
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [grainPattern, setGrainPattern] = useState<GrainPattern>('none');
  const [status, setStatus] = useState<InventoryStatus>('active');

  // Load existing item if editing
  useEffect(() => {
    if (isOpen && itemId) {
      loadItem();
    } else if (isOpen && !itemId) {
      resetForm();
    }
  }, [isOpen, itemId]);

  const loadItem = async () => {
    if (!itemId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const item = await getInventoryItem(itemId);
      if (item) {
        setSku(item.sku);
        setName(item.name);
        setDisplayName(item.displayName || '');
        setDescription(item.description || '');
        setClassification(item.classification || 'material');
        setCategory(item.category);
        setSubcategory(item.subcategory || '');
        setSupplierValue(
          item.preferredSupplierId
            ? { supplierId: item.preferredSupplierId, supplierName: item.preferredSupplierName || '' }
            : null,
        );
        setShopifyProductId(item.shopifyProductId || '');
        setShopifyVariantId(item.shopifyVariantId || '');
        setTags(item.tags?.join(', ') || '');
        setCostPerUnit(item.pricing?.costPerUnit || 0);
        setCurrency(item.pricing?.currency || 'UGX');
        setUnit(item.pricing?.unit || 'sheet');
        setThickness(item.dimensions?.thickness || '');
        setLength(item.dimensions?.length || '');
        setWidth(item.dimensions?.width || '');
        setGrainPattern(item.grainPattern || 'none');
        setStatus(item.status);
      }
    } catch (err) {
      setError('Failed to load item');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSku('');
    setName('');
    setDisplayName('');
    setDescription('');
    setClassification('material');
    setCategory('sheet-goods');
    setSubcategory('');
    setSupplierValue(null);
    setShopifyProductId('');
    setShopifyVariantId('');
    setTags('');
    setCostPerUnit(0);
    setCurrency('UGX');
    setUnit('sheet');
    setThickness('');
    setLength('');
    setWidth('');
    setGrainPattern('none');
    setStatus('active');
    setError(null);
  };

  const handleGenerateSku = () => {
    if (name && category) {
      const newSku = generateSku(category, name);
      setSku(newSku);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!sku.trim()) {
      setError('SKU is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const formData = {
        sku: sku.trim(),
        name: name.trim(),
        displayName: displayName.trim() || undefined,
        description: description.trim() || undefined,
        classification,
        category,
        subcategory: subcategory.trim() || undefined,
        preferredSupplierId: supplierValue?.supplierId || undefined,
        preferredSupplierName: supplierValue?.supplierName || undefined,
        shopifyProductId: classification === 'product' && shopifyProductId.trim() ? shopifyProductId.trim() : undefined,
        shopifyVariantId: classification === 'product' && shopifyVariantId.trim() ? shopifyVariantId.trim() : undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        pricing: {
          costPerUnit,
          currency,
          unit,
        },
        dimensions: (thickness || length || width) ? {
          thickness: thickness || undefined,
          length: length || undefined,
          width: width || undefined,
        } : undefined,
        grainPattern: grainPattern !== 'none' ? grainPattern : undefined,
        status,
      };

      if (itemId) {
        await updateInventoryItem(itemId, formData, userId);
      } else {
        await createInventoryItem(formData, userId);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {itemId ? 'Edit Inventory Item' : 'Add Inventory Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="e.g., SHT-MDF-18MM"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSku}
                        className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      {Object.entries(INVENTORY_CATEGORIES).map(([key, { label, icon }]) => (
                        <option key={key} value={key}>
                          {icon} {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="e.g., MDF Board 18mm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Optional friendly name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                      placeholder="e.g., Plain MDF"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as InventoryStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="discontinued">Discontinued</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    placeholder="e.g., standard, premium, imported"
                  />
                </div>
              </div>

              {/* Classification & Supplier */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Classification & Supplier
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classification *
                    </label>
                    <select
                      value={classification}
                      onChange={(e) => setClassification(e.target.value as InventoryClassification)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      <option value="material">Material (Raw / Component)</option>
                      <option value="product">Product (Finished / Sellable)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Supplier
                    </label>
                    <SupplierPicker
                      value={supplierValue}
                      onChange={setSupplierValue}
                      label=""
                      size="small"
                    />
                  </div>
                </div>

                {classification === 'product' && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">
                        Shopify Product ID
                      </label>
                      <input
                        type="text"
                        value={shopifyProductId}
                        onChange={(e) => setShopifyProductId(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                        placeholder="gid://shopify/Product/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">
                        Shopify Variant ID
                      </label>
                      <input
                        type="text"
                        value={shopifyVariantId}
                        onChange={(e) => setShopifyVariantId(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                        placeholder="gid://shopify/ProductVariant/..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Pricing
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost per Unit
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={costPerUnit}
                      onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as InventoryUnit)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      {Object.entries(INVENTORY_UNITS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dimensions (for sheet goods) */}
              {(category === 'sheet-goods' || category === 'solid-wood') && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                    Dimensions (mm)
                  </h3>
                  
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thickness
                      </label>
                      <select
                        value={thickness}
                        onChange={(e) => setThickness(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Custom</option>
                        {COMMON_THICKNESSES.map((t) => (
                          <option key={t} value={t}>{t}mm</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Thickness
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={thickness}
                        onChange={(e) => setThickness(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                        placeholder="mm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Length
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={length}
                        onChange={(e) => setLength(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                        placeholder="e.g., 2440"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={width}
                        onChange={(e) => setWidth(e.target.value ? parseFloat(e.target.value) : '')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                        placeholder="e.g., 1220"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grain Pattern
                    </label>
                    <select
                      value={grainPattern}
                      onChange={(e) => setGrainPattern(e.target.value as GrainPattern)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
                    >
                      <option value="none">None</option>
                      <option value="lengthwise">Lengthwise</option>
                      <option value="crosswise">Crosswise</option>
                      <option value="random">Random</option>
                    </select>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {itemId ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryItemModal;
