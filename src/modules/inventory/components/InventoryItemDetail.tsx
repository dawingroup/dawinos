/**
 * InventoryItemDetail Component
 * Slide-over panel showing full item details with stock, cost history, and movements
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
  Warehouse,
  ArrowRightLeft,
  TrendingUp,
  History,
} from 'lucide-react';
import { getInventoryItem } from '../services/inventoryService';
import { useStockLevels } from '../hooks/useStockLevels';
import { useWarehouses } from '../hooks/useWarehouses';
import { useSubsidiary } from '@/contexts/SubsidiaryContext';
import { useAuth } from '@/contexts/AuthContext';
import type { InventoryItem } from '../types';
import { INVENTORY_CATEGORIES, INVENTORY_SOURCE_LABELS } from '../types';
import CostHistoryChart from './CostHistoryChart';
import StockMovementHistory from './StockMovementHistory';
import StockTransferDialog from './StockTransferDialog';

type DetailTab = 'overview' | 'stock' | 'cost-history' | 'movements';

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
  const { user } = useAuth();
  const { currentSubsidiary } = useSubsidiary();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedStockLevelId, setSelectedStockLevelId] = useState<string | null>(null);

  // Stock and cost hooks
  const { stockLevels, aggregated, loading: stockLoading } = useStockLevels(itemId);
  const { warehouses } = useWarehouses(currentSubsidiary?.id || null);

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

  const getWarehouseName = (warehouseId: string) => {
    const wh = warehouses.find(w => w.id === warehouseId);
    return wh ? `${wh.name} (${wh.code})` : warehouseId.slice(0, 8) + '...';
  };

  const DETAIL_TABS: { id: DetailTab; label: string; icon: typeof Package }[] = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'stock', label: 'Stock', icon: Warehouse },
    { id: 'cost-history', label: 'Costs', icon: TrendingUp },
    { id: 'movements', label: 'Movements', icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-2xl shadow-xl overflow-hidden flex flex-col">
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

        {/* Tabs */}
        {!loading && item && (
          <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex space-x-6">
              {DETAIL_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-3 border-b-2 text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

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
            <>
              {/* ============ OVERVIEW TAB ============ */}
              {activeTab === 'overview' && (
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

                  {/* Classification, Category & Source */}
                  <div className="flex flex-wrap gap-2">
                    {item.classification && (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                        item.classification === 'product'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.classification === 'product' ? 'Product' : 'Material'}
                      </span>
                    )}
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

                  {/* Supplier */}
                  {item.preferredSupplierName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-xs text-gray-500 uppercase mb-1">Preferred Supplier</h4>
                      <p className="text-sm font-medium text-gray-900">{item.preferredSupplierName}</p>
                    </div>
                  )}

                  {/* Shopify IDs (for products) */}
                  {item.classification === 'product' && (item.shopifyProductId || item.shopifyVariantId) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-xs text-blue-700 uppercase mb-2">Shopify Integration</h4>
                      <div className="space-y-1 text-sm">
                        {item.shopifyProductId && (
                          <p className="text-blue-800">
                            Product: <span className="font-mono text-xs">{item.shopifyProductId}</span>
                          </p>
                        )}
                        {item.shopifyVariantId && (
                          <p className="text-blue-800">
                            Variant: <span className="font-mono text-xs">{item.shopifyVariantId}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

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

                  {/* Stock Summary (aggregated from all locations) */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-gray-500" />
                        <h4 className="font-medium text-gray-900">Stock Summary</h4>
                      </div>
                      {stockLevels.length > 0 && (
                        <button
                          onClick={() => setActiveTab('stock')}
                          className="text-xs text-primary hover:underline"
                        >
                          View by location
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">On Hand</p>
                        <p className={`text-lg font-semibold ${
                          aggregated.totalOnHand > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stockLoading ? '...' : aggregated.totalOnHand}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Reserved</p>
                        <p className="text-lg font-medium text-amber-600">
                          {stockLoading ? '...' : aggregated.totalReserved}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Available</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {stockLoading ? '...' : aggregated.totalAvailable}
                        </p>
                      </div>
                    </div>
                    {/* Legacy stock (from Katana sync) */}
                    {(item.inventory?.inStock != null && item.inventory.inStock > 0 && aggregated.totalOnHand === 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Katana stock: <span className="font-medium text-gray-700">{item.inventory.inStock}</span>
                          {item.inventory?.reorderLevel != null && (
                            <span className="ml-3">Reorder level: {item.inventory.reorderLevel}</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dimensions Section */}
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
              )}

              {/* ============ STOCK TAB ============ */}
              {activeTab === 'stock' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      Stock by Location
                    </h3>
                    <button
                      onClick={() => setTransferOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Transfer
                    </button>
                  </div>

                  {/* Aggregated Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-green-700">{aggregated.totalOnHand}</p>
                      <p className="text-xs text-green-600">On Hand</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-amber-700">{aggregated.totalReserved}</p>
                      <p className="text-xs text-amber-600">Reserved</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-semibold text-gray-900">{aggregated.totalAvailable}</p>
                      <p className="text-xs text-gray-600">Available</p>
                    </div>
                  </div>

                  {stockLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : stockLevels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Warehouse className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No stock recorded at any location.</p>
                      <p className="text-xs mt-1">Stock levels are created when goods are received from purchase orders.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {stockLevels.map((sl) => (
                        <div
                          key={sl.id}
                          onClick={() => setSelectedStockLevelId(
                            selectedStockLevelId === sl.id ? null : sl.id
                          )}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedStockLevelId === sl.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getWarehouseName(sl.warehouseId)}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-right">
                                <p className="text-xs text-gray-500">On Hand</p>
                                <p className="font-medium text-gray-900">{sl.quantityOnHand}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Reserved</p>
                                <p className="font-medium text-amber-600">{sl.quantityReserved}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Available</p>
                                <p className="font-semibold text-green-600">{sl.quantityAvailable}</p>
                              </div>
                            </div>
                          </div>
                          {sl.reorderLevel != null && sl.quantityAvailable <= sl.reorderLevel && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Below reorder level ({sl.reorderLevel})
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Movement history for selected stock level */}
                  {selectedStockLevelId && (
                    <div className="mt-4 border-t pt-4">
                      <StockMovementHistory
                        stockLevelId={selectedStockLevelId}
                        title="Movement History"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ============ COST HISTORY TAB ============ */}
              {activeTab === 'cost-history' && (
                <div className="p-6">
                  <CostHistoryChart inventoryItemId={itemId} />
                </div>
              )}

              {/* ============ MOVEMENTS TAB ============ */}
              {activeTab === 'movements' && (
                <div className="p-6 space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Select a stock location to view movements
                  </h3>
                  {stockLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : stockLevels.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No stock locations to show movements for.
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {stockLevels.map((sl) => (
                          <button
                            key={sl.id}
                            onClick={() => setSelectedStockLevelId(
                              selectedStockLevelId === sl.id ? null : sl.id
                            )}
                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                              selectedStockLevelId === sl.id
                                ? 'border-primary bg-primary text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {getWarehouseName(sl.warehouseId)}
                          </button>
                        ))}
                      </div>
                      <StockMovementHistory stockLevelId={selectedStockLevelId} />
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-gray-500">
              Item not found
            </div>
          )}
        </div>
      </div>

      {/* Stock Transfer Dialog */}
      {user && (
        <StockTransferDialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          inventoryItemId={itemId}
          itemName={item?.displayName || item?.name}
          userId={user.uid}
        />
      )}
    </div>
  );
}

export default InventoryItemDetail;
