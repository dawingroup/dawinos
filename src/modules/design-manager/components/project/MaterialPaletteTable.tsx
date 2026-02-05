/**
 * Material Palette Table Component
 * Displays material palette entries with mapping status and actions
 */

import React, { useState, useEffect } from 'react';
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
  DollarSign,
  Loader2,
  Settings2,
} from 'lucide-react';
import type { MaterialPalette, MaterialPaletteEntry, OptimizationStockSheet } from '@/shared/types';
import {
  harvestMaterials,
  mapMaterialToInventory,
  unmapMaterial,
  getPaletteStats,
  allMaterialsMapped,
} from '../../services/materialHarvester';
import { subscribeToInventory } from '@/modules/inventory/services/inventoryService';
import type { InventoryListItem } from '@/modules/inventory/types';
import { StockConfigurationModal, type StockConfigResult } from './StockConfigurationModal';

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

// Default sheet dimensions for stock sheets
const DEFAULT_SHEET_DIMENSIONS = { length: 2440, width: 1220 };

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
  
  // Katana inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryListItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  
  // Price override state
  const [priceOverride, setPriceOverride] = useState<string>('');
  const [useOverride, setUseOverride] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryListItem | null>(null);

  // Stock configuration state
  const [showStockConfigModal, setShowStockConfigModal] = useState(false);
  const [pendingStockConfig, setPendingStockConfig] = useState<StockConfigResult | null>(null);
  
  // Subscribe to Katana inventory when modal opens
  useEffect(() => {
    if (!showMappingModal) return;
    
    setInventoryLoading(true);
    const unsubscribe = subscribeToInventory(
      (items) => {
        // Filter to relevant categories for material palette mapping
        // Include sheet-goods, solid-wood, edge-banding, and other (for materials not yet categorized)
        const relevantCategories = ['sheet-goods', 'solid-wood', 'edge-banding', 'other'];
        const mappableItems = items.filter(i => 
          relevantCategories.includes(i.category) && i.status === 'active'
        );
        setInventoryItems(mappableItems);
        setInventoryLoading(false);
      },
      (error) => {
        console.error('Failed to load inventory:', error);
        setInventoryLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [showMappingModal]);
  
  // Reset modal state when closed
  useEffect(() => {
    if (!showMappingModal) {
      setPriceOverride('');
      setUseOverride(false);
      setSelectedInventoryItem(null);
      setInventorySearch('');
      setPendingStockConfig(null);
    }
  }, [showMappingModal]);
  
  // Filter inventory items by search
  const filteredInventory = inventoryItems.filter(item => {
    if (!inventorySearch) return true;
    const query = inventorySearch.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.displayName?.toLowerCase().includes(query)
    );
  });

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

  const handleMapMaterial = async (inventoryItem: InventoryListItem, overridePrice?: number) => {
    if (!selectedEntry) return;

    // Use override price if explicitly provided, otherwise let backend auto-fetch from inventory
    // This ensures we always use the latest price from Katana-synced inventory
    const unitCost = useOverride && overridePrice ? overridePrice : undefined;

    // Get the display cost for stock sheets (use inventory price or override)
    const displayCost = overridePrice || inventoryItem.costPerUnit || 0;

    // Use configured stock if available, otherwise create default based on material type
    let stockSheets: OptimizationStockSheet[] = pendingStockConfig?.stockSheets || [];

    // If no stock config, create default stock sheet for panel materials
    if (stockSheets.length === 0 && !pendingStockConfig?.glassStock?.length &&
        !pendingStockConfig?.timberStock?.length && !pendingStockConfig?.linearStock?.length) {
      stockSheets = [{
        id: `ss-${inventoryItem.id}`,
        materialId: inventoryItem.id,
        materialName: inventoryItem.displayName || inventoryItem.name,
        length: DEFAULT_SHEET_DIMENSIONS.length,
        width: DEFAULT_SHEET_DIMENSIONS.width,
        thickness: inventoryItem.thickness || selectedEntry.thickness,
        quantity: inventoryItem.inStock || 0,
        costPerSheet: displayCost,
      }];
    }

    try {
      await mapMaterialToInventory(
        projectId,
        selectedEntry.id,
        inventoryItem.id,
        inventoryItem.displayName || inventoryItem.name,
        inventoryItem.sku,
        unitCost, // undefined = auto-fetch from inventory
        stockSheets,
        userId,
        pendingStockConfig?.glassStock,
        pendingStockConfig?.timberStock,
        pendingStockConfig?.linearStock
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
                        entry.materialType === 'TIMBER' ? 'bg-green-100 text-green-800' :
                        entry.materialType === 'GLASS' ? 'bg-cyan-100 text-cyan-800' :
                        entry.materialType === 'METAL_BAR' ? 'bg-slate-100 text-slate-800' :
                        entry.materialType === 'ALUMINIUM' ? 'bg-gray-100 text-gray-800' :
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
                          {/* Panel/Sheet Stock */}
                          {entry.stockSheets.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Stock Sheets</h4>
                              <ul className="space-y-1">
                                {entry.stockSheets.map((sheet) => (
                                  <li key={sheet.id} className="text-gray-600">
                                    {sheet.length}×{sheet.width}mm @ {sheet.costPerSheet?.toLocaleString()} UGX
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Glass Stock */}
                          {entry.glassStock && entry.glassStock.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Glass Stock</h4>
                              <ul className="space-y-1">
                                {entry.glassStock.map((glass) => (
                                  <li key={glass.id} className="text-gray-600">
                                    {glass.length}×{glass.width}×{glass.thickness}mm ({glass.glassType}) @ {glass.costPerSheet?.toLocaleString()} UGX
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Timber Stock */}
                          {entry.timberStock && entry.timberStock.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Timber Stock</h4>
                              <ul className="space-y-1">
                                {entry.timberStock.map((timber) => (
                                  <li key={timber.id} className="text-gray-600">
                                    {timber.thickness}×{timber.width}mm • Lengths: {timber.availableLengths.map(l => `${l}mm`).join(', ')}
                                    {timber.species && ` (${timber.species})`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* Linear Stock (Metal Bars/Aluminium) */}
                          {entry.linearStock && entry.linearStock.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">Linear Stock</h4>
                              <ul className="space-y-1">
                                {entry.linearStock.map((linear) => (
                                  <li key={linear.id} className="text-gray-600">
                                    {linear.profile} ({linear.material}) • Lengths: {linear.availableLengths.map(l => `${l}mm`).join(', ')}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Map Material to Katana Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">
                Select inventory item for: <strong>{selectedEntry.designName}</strong> ({selectedEntry.thickness}mm)
              </p>
            </div>
            
            {/* Search and price override section */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Search inventory..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                {selectedInventoryItem && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useOverride}
                        onChange={(e) => setUseOverride(e.target.checked)}
                        className="rounded"
                      />
                      Override price
                    </label>
                    {useOverride && (
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={priceOverride}
                          onChange={(e) => setPriceOverride(e.target.value)}
                          placeholder="Price"
                          className="w-28 pl-8 pr-2 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 max-h-80 overflow-y-auto">
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading Katana inventory...</span>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {inventorySearch ? 'No matching inventory items' : 'No sheet goods in inventory'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInventory.map((item) => {
                    const isSelected = selectedInventoryItem?.id === item.id;
                    const hasCost = item.costPerUnit && item.costPerUnit > 0;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedInventoryItem(item);
                          // Don't auto-enable override - let backend fetch from inventory
                          setUseOverride(false);
                          setPriceOverride('');
                        }}
                        className={`w-full p-3 text-left border rounded-lg transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.displayName || item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {item.sku} {item.thickness && `• ${item.thickness}mm`}
                            </div>
                            {item.isStandard && (
                              <span className="inline-flex items-center px-2 py-0.5 mt-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Katana Standard
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            {hasCost ? (
                              <>
                                <div className="text-sm font-medium text-green-700">
                                  {item.costPerUnit?.toLocaleString()} {item.currency || 'UGX'}
                                </div>
                                <div className="text-xs text-green-600">auto-price</div>
                              </>
                            ) : (
                              <div className="text-sm text-amber-600 flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Price pending sync
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 border-t border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {selectedInventoryItem && (
                  <div className="flex items-center gap-3">
                    <span>
                      Selected: <strong>{selectedInventoryItem.displayName || selectedInventoryItem.name}</strong>
                      {useOverride && priceOverride ? (
                        <span className="ml-2 text-blue-600">
                          @ {Number(priceOverride).toLocaleString()} UGX (override)
                        </span>
                      ) : selectedInventoryItem.costPerUnit ? (
                        <span className="ml-2 text-green-600">
                          @ {selectedInventoryItem.costPerUnit.toLocaleString()} UGX (from inventory)
                        </span>
                      ) : (
                        <span className="ml-2 text-gray-500">
                          (price will be fetched from inventory)
                        </span>
                      )}
                    </span>
                    {pendingStockConfig && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Stock configured
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowMappingModal(false);
                    setSelectedEntry(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowStockConfigModal(true)}
                  disabled={!selectedInventoryItem}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  Configure Stock Sizes
                </button>
                <button
                  onClick={() => {
                    if (selectedInventoryItem) {
                      const override = useOverride && priceOverride ? Number(priceOverride) : undefined;
                      handleMapMaterial(selectedInventoryItem, override);
                    }
                  }}
                  disabled={!selectedInventoryItem}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Map Material
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Configuration Modal */}
      {showStockConfigModal && selectedEntry && (
        <StockConfigurationModal
          isOpen={showStockConfigModal}
          onClose={() => setShowStockConfigModal(false)}
          entry={selectedEntry}
          inventoryItem={selectedInventoryItem}
          onSave={(config) => {
            setPendingStockConfig(config);
            setShowStockConfigModal(false);
          }}
        />
      )}
    </div>
  );
}

export default MaterialPaletteTable;
