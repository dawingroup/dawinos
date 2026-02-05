/**
 * MaterialsTab Component
 * Display raw materials with Material Library links and supplier pricing
 */

import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Filter,
  Layers,
  Building2,
  CheckCircle,
  Link,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useMaterialsInventory } from '../hooks/useMaterialsInventory';
import { INVENTORY_CATEGORIES, type InventoryCategory, type InventoryListItem } from '../types';

interface MaterialsTabProps {
  onItemClick?: (item: InventoryListItem) => void;
  onLinkToMaterial?: (item: InventoryListItem) => void;
  onManageSupplierPricing?: (item: InventoryListItem) => void;
  onAddItem?: () => void;
}

export function MaterialsTab({
  onItemClick,
  onLinkToMaterial,
  onManageSupplierPricing,
  onAddItem,
}: MaterialsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory | 'all'>('all');
  const [linkFilter, setLinkFilter] = useState<'all' | 'linked' | 'not-linked'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const { materials, loading, error, stats } = useMaterialsInventory();

  // Filter items
  const filteredMaterials = useMemo(() => {
    let result = materials;

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

    // Material library link filter
    if (linkFilter !== 'all') {
      result = result.filter((item) => {
        const isLinked = ((item as any).linkedMaterialIds?.length ?? 0) > 0;
        return linkFilter === 'linked' ? isLinked : !isLinked;
      });
    }

    return result;
  }, [materials, searchTerm, categoryFilter, linkFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMaterials.slice(start, start + itemsPerPage);
  }, [filteredMaterials, currentPage, itemsPerPage]);

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Materials</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Raw materials for manufacturing - linked to Material Library and suppliers
          </p>
        </div>

        {onAddItem && (
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Material
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Materials</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{stats.linkedToMaterialLibrary}</div>
          </div>
          <div className="text-xs text-gray-500">Linked to Library</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{stats.withSupplierPricing}</div>
          </div>
          <div className="text-xs text-gray-500">With Suppliers</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-2xl font-bold text-amber-600">{stats.total - stats.linkedToMaterialLibrary}</div>
          <div className="text-xs text-gray-500">Not Linked</div>
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
            placeholder="Search materials..."
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
            value={linkFilter}
            onChange={(e) => { setLinkFilter(e.target.value as 'all' | 'linked' | 'not-linked'); resetPage(); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Link Status</option>
            <option value="linked">Linked to Library</option>
            <option value="not-linked">Not Linked</option>
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
        <div className="text-center py-10 text-gray-500">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No materials found</h3>
          <p className="text-gray-500 mt-1">
            {searchTerm || categoryFilter !== 'all' || linkFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first material or sync from Katana'}
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
                  Material Link
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Suppliers
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  In Stock
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedMaterials.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onItemClick?.(item)}
                  className={`hover:bg-gray-50 ${onItemClick ? 'cursor-pointer' : ''}`}
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
                      {INVENTORY_CATEGORIES[item.category]?.icon}
                      {INVENTORY_CATEGORIES[item.category]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(item as any).linkedMaterialIds?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        <Link className="w-3 h-3" />
                        Linked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                        Not linked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {(item as any).supplierPricing?.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                        <Building2 className="w-3 h-3" />
                        {(item as any).supplierPricing.length}
                      </span>
                    ) : item.preferredSupplierName ? (
                      <span className="text-xs text-gray-600" title={item.preferredSupplierName}>
                        {item.preferredSupplierName.slice(0, 15)}...
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {item.inStock ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {item.costPerUnit
                      ? `${item.currency || 'UGX'} ${item.costPerUnit.toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {onLinkToMaterial && (
                        <button
                          onClick={() => onLinkToMaterial(item)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="Link to Material Library"
                        >
                          <Link className="w-4 h-4" />
                        </button>
                      )}
                      {onManageSupplierPricing && (
                        <button
                          onClick={() => onManageSupplierPricing(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Manage Supplier Pricing"
                        >
                          <DollarSign className="w-4 h-4" />
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
      {!loading && filteredMaterials.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMaterials.length)} of {filteredMaterials.length} materials
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

export default MaterialsTab;
