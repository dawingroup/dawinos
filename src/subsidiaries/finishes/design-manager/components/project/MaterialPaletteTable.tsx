/**
 * Material Palette Table Component
 * Displays material palette entries with mapping status and actions
 */

import React, { useState } from 'react';
import { 
  Package, 
  Link, 
  Unlink, 
  RefreshCw, 
  Search, 
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import type { MaterialPalette, MaterialPaletteEntry, OptimizationStockSheet } from '@/shared/types';
import { 
  harvestMaterials, 
  mapMaterialToInventory, 
  unmapMaterial,
  getPaletteStats,
  allMaterialsMapped,
} from '../../services/materialHarvester';

// ============================================
// Types
// ============================================

interface MaterialPaletteTableProps {
  projectId: string;
  palette: MaterialPalette | undefined;
  onPaletteUpdated: () => void;
  userId: string;
  className?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unitCost: number;
  stockSheets: OptimizationStockSheet[];
}

// ============================================
// Mock Inventory Data (replace with real service)
// ============================================

const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-001',
    name: 'MDF 18mm White',
    sku: 'MDF-18-WHT',
    unitCost: 85000,
    stockSheets: [
      { id: 'ss-1', materialId: 'inv-001', materialName: 'MDF 18mm White', length: 2440, width: 1220, thickness: 18, quantity: 100, costPerSheet: 85000 },
    ],
  },
  {
    id: 'inv-002',
    name: 'Melamine White 18mm',
    sku: 'MEL-18-WHT',
    unitCost: 95000,
    stockSheets: [
      { id: 'ss-2', materialId: 'inv-002', materialName: 'Melamine White 18mm', length: 2440, width: 1220, thickness: 18, quantity: 50, costPerSheet: 95000 },
    ],
  },
  {
    id: 'inv-003',
    name: 'Plywood Birch 18mm',
    sku: 'PLY-18-BIR',
    unitCost: 180000,
    stockSheets: [
      { id: 'ss-3', materialId: 'inv-003', materialName: 'Plywood Birch 18mm', length: 2440, width: 1220, thickness: 18, quantity: 30, costPerSheet: 180000 },
    ],
  },
  {
    id: 'inv-004',
    name: 'Chipboard 18mm',
    sku: 'CHI-18-STD',
    unitCost: 65000,
    stockSheets: [
      { id: 'ss-4', materialId: 'inv-004', materialName: 'Chipboard 18mm', length: 2750, width: 1830, thickness: 18, quantity: 80, costPerSheet: 65000 },
    ],
  },
];

// ============================================
// Component
// ============================================

export function MaterialPaletteTable({
  projectId,
  palette,
  onPaletteUpdated,
  userId,
  className = '',
}: MaterialPaletteTableProps) {
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MaterialPaletteEntry | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getPaletteStats(palette);
  const canExportToKatana = allMaterialsMapped(palette);

  // Handle harvest
  const handleHarvest = async () => {
    setIsHarvesting(true);
    try {
      await harvestMaterials(projectId, userId);
      onPaletteUpdated();
    } catch (error) {
      console.error('Failed to harvest materials:', error);
    } finally {
      setIsHarvesting(false);
    }
  };

  // Handle mapping
  const handleOpenMapping = (entry: MaterialPaletteEntry) => {
    setSelectedEntry(entry);
    setShowMappingModal(true);
  };

  const handleMapMaterial = async (inventoryItem: InventoryItem) => {
    if (!selectedEntry) return;

    try {
      await mapMaterialToInventory(
        projectId,
        selectedEntry.id,
        inventoryItem.id,
        inventoryItem.name,
        inventoryItem.sku,
        inventoryItem.unitCost,
        inventoryItem.stockSheets,
        userId
      );
      setShowMappingModal(false);
      setSelectedEntry(null);
      onPaletteUpdated();
    } catch (error) {
      console.error('Failed to map material:', error);
    }
  };

  const handleUnmapMaterial = async (entryId: string) => {
    try {
      await unmapMaterial(projectId, entryId, userId);
      onPaletteUpdated();
    } catch (error) {
      console.error('Failed to unmap material:', error);
    }
  };

  // Toggle expand
  const toggleExpand = (entryId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedItems(newExpanded);
  };

  // Filter entries
  const filteredEntries = (palette?.entries || []).filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.designName.toLowerCase().includes(query) ||
      entry.normalizedName.toLowerCase().includes(query) ||
      entry.inventoryName?.toLowerCase().includes(query) ||
      entry.inventorySku?.toLowerCase().includes(query)
    );
  });

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Material Palette</h3>
            <span className="text-sm text-gray-500">
              {stats.total} materials
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Status badges */}
            <div className="flex items-center gap-2 mr-4">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3" />
                {stats.mapped} mapped
              </span>
              {stats.unmapped > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  {stats.unmapped} unmapped
                </span>
              )}
            </div>
            
            {/* Actions */}
            <button
              onClick={handleHarvest}
              disabled={isHarvesting}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isHarvesting ? 'animate-spin' : ''}`} />
              {isHarvesting ? 'Scanning...' : 'Rescan'}
            </button>
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4" />
              Auto-Map
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Material</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thickness</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inventory Mapping</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {palette?.entries.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p>No materials found</p>
                      <button
                        onClick={handleHarvest}
                        className="text-blue-600 hover:underline"
                      >
                        Scan design items for materials
                      </button>
                    </div>
                  ) : (
                    'No materials match your search'
                  )}
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-gray-50">
                    {/* Expand toggle */}
                    <td className="pl-4">
                      <button
                        onClick={() => toggleExpand(entry.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedItems.has(entry.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>

                    {/* Design Material */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{entry.designName}</div>
                      <div className="text-xs text-gray-500">{entry.normalizedName}</div>
                    </td>

                    {/* Thickness */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.thickness}mm
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        entry.materialType === 'PANEL' ? 'bg-blue-100 text-blue-800' :
                        entry.materialType === 'SOLID' ? 'bg-amber-100 text-amber-800' :
                        entry.materialType === 'VENEER' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.materialType}
                      </span>
                    </td>

                    {/* Usage */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {entry.usageCount} parts in {entry.designItemIds.length} items
                    </td>

                    {/* Inventory Mapping */}
                    <td className="px-4 py-3">
                      {entry.inventoryId ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{entry.inventoryName}</div>
                            <div className="text-xs text-gray-500">{entry.inventorySku}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Not mapped</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenMapping(entry)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          <Link className="w-3 h-3" />
                          {entry.inventoryId ? 'Remap' : 'Map'}
                        </button>
                        {entry.inventoryId && (
                          <button
                            onClick={() => handleUnmapMaterial(entry.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100"
                          >
                            <Unlink className="w-3 h-3" />
                            Unmap
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {expandedItems.has(entry.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-8 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Used In Design Items</h4>
                            <ul className="space-y-1">
                              {entry.designItemIds.slice(0, 5).map((id) => (
                                <li key={id} className="text-gray-600">• {id}</li>
                              ))}
                              {entry.designItemIds.length > 5 && (
                                <li className="text-gray-500 italic">
                                  +{entry.designItemIds.length - 5} more...
                                </li>
                              )}
                            </ul>
                          </div>
                          {entry.stockSheets.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Stock Sheets</h4>
                              <ul className="space-y-1">
                                {entry.stockSheets.map((sheet) => (
                                  <li key={sheet.id} className="text-gray-600">
                                    {sheet.length}x{sheet.width}mm @ {sheet.costPerSheet?.toLocaleString()} UGX
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {entry.mappedAt && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Mapping Info</h4>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4" />
                                Mapped {new Date(entry.mappedAt.seconds * 1000).toLocaleDateString()}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Katana Export Status */}
      {palette && palette.entries.length > 0 && (
        <div className={`px-4 py-3 border-t ${canExportToKatana ? 'bg-green-50' : 'bg-amber-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {canExportToKatana ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    All materials mapped - Ready for Katana BOM export
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">
                    {stats.unmapped} unmapped material{stats.unmapped !== 1 ? 's' : ''} - Map all materials before Katana export
                  </span>
                </>
              )}
            </div>
            <span className="text-sm text-gray-600">
              {stats.percentMapped}% mapped
            </span>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {showMappingModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Map Material to Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select inventory item for: <strong>{selectedEntry.designName}</strong>
              </p>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {MOCK_INVENTORY.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMapMaterial(item)}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {item.unitCost.toLocaleString()} UGX
                        </div>
                        <div className="text-xs text-gray-500">per sheet</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowMappingModal(false);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialPaletteTable;
