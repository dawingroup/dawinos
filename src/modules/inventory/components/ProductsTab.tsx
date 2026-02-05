/**
 * ProductsTab Component
 * Display finished products with Shopify sync and Design Manager project links
 */

import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Filter,
  ShoppingBag,
  FolderOpen,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { INVENTORY_CATEGORIES, type InventoryCategory, type InventoryListItem } from '../types';

interface ProductsTabProps {
  onItemClick?: (item: InventoryListItem) => void;
  onSyncToShopify?: (item: InventoryListItem) => void;
  onAddToProject?: (item: InventoryListItem) => void;
  onAddItem?: () => void;
}

export function ProductsTab({
  onItemClick,
  onSyncToShopify,
  onAddToProject,
  onAddItem,
}: ProductsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'all'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'not-synced'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { products, loading, error, stats } = useProducts();

  // Filter items
  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(term) ||
          item.name.toLowerCase().includes(term) ||
          item.displayName?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((item) => item.category === categoryFilter);
    }

    // Sync status filter
    if (syncFilter !== 'all') {
      result = result.filter((item) => {
        const isSynced = !!(item as any).shopifyProductId;
        return syncFilter === 'synced' ? isSynced : !isSynced;
      });
    }

    return result;
  }, [products, searchTerm, categoryFilter, syncFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const resetPage = () => setCurrentPage(1);

  const getSyncStatusBadge = (item: any) => {
    if (!item.shopifyProductId) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          <Clock className="w-3 h-3" />
          Not synced
        </span>
      );
    }

    const status = item.shopifySyncStatus || 'synced';
    const statusConfig = {
      synced: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Synced' },
      syncing: { color: 'bg-blue-100 text-blue-700', icon: RefreshCw, label: 'Syncing...' },
      error: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Error' },
      not_synced: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Not synced' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.synced;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Finished goods for retail (Shopify) or design projects
          </p>
        </div>

        {onAddItem && (
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Products</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{stats.syncedToShopify}</div>
          </div>
          <div className="text-xs text-gray-500">On Shopify</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{stats.linkedToProjects}</div>
          </div>
          <div className="text-xs text-gray-500">In Projects</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-amber-600">{stats.total - stats.syncedToShopify}</div>
          <div className="text-xs text-gray-500">Not Synced</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); resetPage(); }}
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value as InventoryCategory | 'all'); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(INVENTORY_CATEGORIES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>
                {icon} {label}
              </option>
            ))}
          </select>

          <select
            value={syncFilter}
            onChange={(e) => { setSyncFilter(e.target.value as 'all' | 'synced' | 'not-synced'); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Sync Status</option>
            <option value="synced">Synced to Shopify</option>
            <option value="not-synced">Not Synced</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No products found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || categoryFilter !== 'all' || syncFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first product or sync from Shopify'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Shopify
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Projects
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className={`hover:bg-gray-50 ${onItemClick ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-gray-600">{item.sku}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {item.displayName || item.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      {INVENTORY_CATEGORIES[item.category]?.icon}
                      {INVENTORY_CATEGORIES[item.category]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getSyncStatusBadge(item)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(item as any).linkedProjectIds?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        <FolderOpen className="w-3 h-3" />
                        {(item as any).linkedProjectIds.length}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {item.costPerUnit
                      ? `${item.currency || 'UGX'} ${item.costPerUnit.toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!(item as any).shopifyProductId && onSyncToShopify && (
                        <button
                          onClick={() => onSyncToShopify(item)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Sync to Shopify"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      )}
                      {onAddToProject && (
                        <button
                          onClick={() => onAddToProject(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Add to Project"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredProducts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductsTab;
