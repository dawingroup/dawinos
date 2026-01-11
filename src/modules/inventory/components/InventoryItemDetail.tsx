/**
 * InventoryItemDetail Component
 * Slide-over panel showing full item details
 */

import { useState, useEffect } from 'react';
import {
  X,
  Package,
  Edit2,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Tag,
  DollarSign,
  Box,
  Layers,
} from 'lucide-react';
import { getInventoryItem } from '../services/inventoryService';
import type { InventoryItem } from '../types';
import { INVENTORY_CATEGORIES, INVENTORY_SOURCE_LABELS } from '../types';

interface InventoryItemDetailProps {
  itemId: string;
  onClose: () => void;
  onEdit: () => void;
}

export function InventoryItemDetail({
  itemId,
  onClose,
  onEdit,
}: InventoryItemDetailProps) {
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getInventoryItem(itemId);
      setItem(data);
    } catch (err) {
      setError('Failed to load item details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'discontinued':
        return 'bg-gray-100 text-gray-600';
      case 'out-of-stock':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30" 
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative bg-white w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Item Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : item ? (
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-mono text-gray-500">{item.sku}</p>
                    <h3 className="text-xl font-semibold text-gray-900 mt-1">
                      {item.displayName || item.name}
                    </h3>
                    {item.displayName && item.displayName !== item.name && (
                      <p className="text-sm text-gray-500 mt-0.5">{item.name}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                
                {item.description && (
                  <p className="text-gray-600 mt-3">{item.description}</p>
                )}
              </div>

              {/* Category & Source */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                  {INVENTORY_CATEGORIES[item.category]?.icon}
                  {INVENTORY_CATEGORIES[item.category]?.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${INVENTORY_SOURCE_LABELS[item.source]?.color}`}>
                  {item.source === 'katana' && <ExternalLink className="w-3.5 h-3.5" />}
                  {INVENTORY_SOURCE_LABELS[item.source]?.label}
                </span>
                {item.katanaSync?.isStandard && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Standard Item
                  </span>
                )}
              </div>

              {/* Pricing Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Pricing</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Cost per Unit</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {item.pricing?.currency || 'UGX'} {item.pricing?.costPerUnit?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Unit</p>
                    <p className="text-lg font-medium text-gray-700">
                      {item.pricing?.unit || 'sheet'}
                    </p>
                  </div>
                </div>
                {item.pricing?.lastSyncedFromKatana && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Last synced: {formatDate(item.pricing.lastSyncedFromKatana)}
                  </p>
                )}
              </div>

              {/* Stock Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Box className="w-4 h-4 text-gray-500" />
                  <h4 className="font-medium text-gray-900">Stock</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">In Stock</p>
                    <p className={`text-lg font-semibold ${
                      (item.inventory?.inStock || 0) > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.inventory?.inStock || 0}
                    </p>
                  </div>
                  {item.inventory?.reorderLevel && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Reorder Level</p>
                      <p className="text-lg font-medium text-gray-700">
                        {item.inventory.reorderLevel}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dimensions Section (if applicable) */}
              {item.dimensions && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Dimensions</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {item.dimensions.thickness && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Thickness</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.dimensions.thickness}mm
                        </p>
                      </div>
                    )}
                    {item.dimensions.length && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Length</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.dimensions.length}mm
                        </p>
                      </div>
                    )}
                    {item.dimensions.width && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Width</p>
                        <p className="text-sm font-medium text-gray-900">
                          {item.dimensions.width}mm
                        </p>
                      </div>
                    )}
                  </div>
                  {item.grainPattern && item.grainPattern !== 'none' && (
                    <p className="text-sm text-gray-600 mt-2">
                      Grain: {item.grainPattern}
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <h4 className="font-medium text-gray-900">Tags</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Aliases */}
              {item.aliases && item.aliases.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Also known as</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.aliases.map((alias, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Katana Sync Info */}
              {item.source === 'katana' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Katana Integration
                  </h4>
                  <div className="space-y-2 text-sm">
                    {item.katanaId && (
                      <p className="text-gray-600">
                        Katana ID: <span className="font-mono">{item.katanaId}</span>
                      </p>
                    )}
                    {item.katanaSync?.lastPulledAt && (
                      <p className="text-gray-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Last pull: {formatDate(item.katanaSync.lastPulledAt)}
                      </p>
                    )}
                    {item.katanaSync?.pendingPush && (
                      <p className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Changes pending push to Katana
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                <p>Created: {formatDate(item.createdAt)} by {item.createdBy}</p>
                <p>Updated: {formatDate(item.updatedAt)} by {item.updatedBy}</p>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Item not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryItemDetail;
