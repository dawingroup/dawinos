/**
 * InventoryList Component
 * Display and manage unified inventory items
 */

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  RefreshCw,
  Package,
  Filter,
  Database,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import {
  INVENTORY_CATEGORIES,
  INVENTORY_SOURCE_LABELS,
  type InventoryCategory,
  type InventorySource,
  type InventoryListItem,
} from '../types';

interface InventoryListProps {
  onSelectItem?: (item: InventoryListItem) => void;
  onItemClick?: (item: InventoryListItem) => void;
  onAddItem?: () => void;
  onSyncKatana?: () => void;
  showActions?: boolean;
}

export function InventoryList({
  onSelectItem,
  onItemClick,
  onAddItem,
  onSyncKatana,
  showActions = true,
}: InventoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<InventorySource | 'all'>('all');
  const [showStandardOnly, setShowStandardOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { items, loading, error, stats } = useInventory();

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

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

    // Source filter
    if (sourceFilter !== 'all') {
      result = result.filter((item) => item.source === sourceFilter);
    }

    // Standard only filter
    if (showStandardOnly) {
      result = result.filter((item) => item.isStandard);
    }

    return result;
  }, [items, searchTerm, categoryFilter, sourceFilter, showStandardOnly]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  const resetPage = () => setCurrentPage(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Inventory</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Unified material library - single source of truth for pricing and stock
          </p>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {onSyncKatana && (
              <button
                onClick={onSyncKatana}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
                Sync Katana
              </button>
            )}
            {onAddItem && (
              <button
                onClick={onAddItem}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Items</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.bySource.katana}</div>
          <div className="text-xs text-gray-500">From Katana</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-600">{stats.bySource.manual}</div>
          <div className="text-xs text-gray-500">Manual</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-green-600">{stats.standard}</div>
          <div className="text-xs text-gray-500">Standard Items</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Sync</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Every 6 hours</div>
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
            placeholder="Search by SKU, name..."
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
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value as InventorySource | 'all'); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Sources</option>
            {Object.entries(INVENTORY_SOURCE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showStandardOnly}
              onChange={(e) => { setShowStandardOnly(e.target.checked); resetPage(); }}
              className="h-4 w-4 rounded"
            />
            Standard only
          </label>
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
        <div className="text-center py-10 text-gray-500">Loading inventory...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || categoryFilter !== 'all' || sourceFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first inventory item or sync from Katana'}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  In Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => (onItemClick || onSelectItem)?.(item)}
                  className={`hover:bg-gray-50 ${(onItemClick || onSelectItem) ? 'cursor-pointer' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-600">{item.sku}</span>
                      {item.isStandard && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {item.displayName || item.name}
                    </div>
                    {item.thickness && (
                      <div className="text-xs text-gray-500">{item.thickness}mm</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      {INVENTORY_CATEGORIES[item.category as InventoryCategory]?.icon}
                      {INVENTORY_CATEGORIES[item.category as InventoryCategory]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        INVENTORY_SOURCE_LABELS[item.source as InventorySource]?.color
                      }`}
                    >
                      {item.source === 'katana' && <ExternalLink className="w-3 h-3" />}
                      {INVENTORY_SOURCE_LABELS[item.source as InventorySource]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {item.inStock ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {item.costPerUnit
                      ? `${item.currency || 'UGX'} ${item.costPerUnit.toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'discontinued'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.status === 'active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : item.status === 'out-of-stock' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredItems.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
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

export default InventoryList;
