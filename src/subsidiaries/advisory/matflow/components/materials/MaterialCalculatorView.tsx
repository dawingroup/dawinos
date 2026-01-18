/**
 * Material Calculator View
 * Main container for Materials tab - calculate material requirements from BOQ items
 */

import React, { useState, useMemo } from 'react';
import { Calculator, List, BarChart3, Package, Beaker, AlertCircle } from 'lucide-react';
import type { BOQItem } from '../../types';
import { MaterialRequirementsTable } from './MaterialRequirementsTable';
import { MaterialAggregationView } from './MaterialAggregationView';
import { FormulaApplicationPanel } from './FormulaApplicationPanel';
import { CustomMaterialBuilder } from './CustomMaterialBuilder';
import { updateBOQItemMaterials, updateBOQItem } from '../../services/boqService';
import { useAuth } from '@/core/hooks/useAuth';
import { deleteField } from 'firebase/firestore';

interface MaterialCalculatorViewProps {
  projectId: string;
  items: BOQItem[];
  onItemsUpdate: () => void;
}

type CalcViewMode = 'items' | 'aggregation';
type FormulaFilter = 'all' | 'applied' | 'not_applied' | 'custom' | 'bulk';

export function MaterialCalculatorView({ projectId, items, onItemsUpdate }: MaterialCalculatorViewProps) {
  const { user } = useAuth();
  const orgId = (user as { organizationId?: string })?.organizationId || 'default';

  const [viewMode, setViewMode] = useState<CalcViewMode>('items');
  const [formulaFilter, setFormulaFilter] = useState<FormulaFilter>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalItem, setCustomModalItem] = useState<BOQItem | null>(null);

  // Helper: Check if item is marked as bulk purchase
  const isBulkItem = (item: BOQItem) => {
    return item.isBulkItem === true;
  };

  // Filter items based on formula status
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => item.hierarchyLevel && item.hierarchyLevel >= 3); // Only Level 3+ need materials

    switch (formulaFilter) {
      case 'applied':
        filtered = filtered.filter(item => item.formulaId && item.materialRequirements && item.materialRequirements.length > 0);
        break;
      case 'not_applied':
        // Items that need formulas but don't have them (exclude bulk items)
        filtered = filtered.filter(item => {
          const hasNoBreakdown = !item.formulaId && (!item.materialRequirements || item.materialRequirements.length === 0);
          return hasNoBreakdown && !isBulkItem(item);
        });
        break;
      case 'custom':
        filtered = filtered.filter(item => !item.formulaId && item.materialRequirements && item.materialRequirements.length > 0);
        break;
      case 'bulk':
        // Bulk items (sent to supplier as-is)
        filtered = filtered.filter(item => isBulkItem(item));
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [items, formulaFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const materialItems = items.filter(item => item.hierarchyLevel && item.hierarchyLevel >= 3);
    const itemsWithFormulas = materialItems.filter(item => item.formulaId && item.materialRequirements && item.materialRequirements.length > 0);
    const customMaterials = materialItems.filter(item => !item.formulaId && item.materialRequirements && item.materialRequirements.length > 0);
    const bulkItems = materialItems.filter(item => isBulkItem(item));

    // Items needing formulas (exclude bulk items)
    const itemsNeedingFormulas = materialItems.filter(item => {
      const hasNoBreakdown = !item.formulaId && (!item.materialRequirements || item.materialRequirements.length === 0);
      return hasNoBreakdown && !isBulkItem(item);
    });

    // Count unique materials
    const uniqueMaterials = new Set<string>();
    materialItems.forEach(item => {
      if (item.materialRequirements) {
        item.materialRequirements.forEach((req: any) => {
          if (req.materialId) uniqueMaterials.add(req.materialId);
        });
      }
    });

    return {
      totalItems: materialItems.length,
      itemsWithFormulas: itemsWithFormulas.length,
      itemsNeedingFormulas: itemsNeedingFormulas.length,
      customMaterials: customMaterials.length,
      bulkItems: bulkItems.length,
      uniqueMaterials: uniqueMaterials.size,
    };
  }, [items]);

  // Get selected BOQ items
  const selectedBoqItems = useMemo(() => {
    return items.filter(item => selectedItems.has(item.id));
  }, [items, selectedItems]);

  // Handlers
  const handleApplyFormula = (itemIds: string[]) => {
    setSelectedItems(new Set(itemIds));
    setIsFormulaModalOpen(true);
  };

  const handleCustomMaterials = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setCustomModalItem(item);
      setIsCustomModalOpen(true);
    }
  };

  const handleClearMaterials = async (itemId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to clear the material requirements for this item?')) return;

    try {
      await updateBOQItemMaterials(orgId, projectId, itemId, user.uid, [], undefined, undefined);
      onItemsUpdate();
    } catch (error) {
      console.error('Error clearing materials:', error);
      alert('Failed to clear materials. Please try again.');
    }
  };

  const handleConvertToBulk = async (itemId: string) => {
    if (!user) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const confirmMessage = `Mark "${item.description}" as bulk purchase?\n\nThe BOQ item description IS the material that will be purchased. The item will be sent to the supplier as-is with the quantities from the BOQ.\n\nThe supplier will be responsible for providing any material breakdown if needed.`;

    if (!confirm(confirmMessage)) return;

    try {
      // Mark as bulk item and clear formula/materials
      await updateBOQItem(orgId, projectId, itemId, user.uid, {
        isBulkItem: true,
        formulaId: deleteField(),
        formulaCode: deleteField(),
        materialRequirements: [],
      });
      onItemsUpdate();
    } catch (error) {
      console.error('Error converting to bulk:', error);
      alert('Failed to convert to bulk. Please try again.');
    }
  };

  const handleUnmarkBulk = async (itemId: string) => {
    if (!user) return;

    try {
      await updateBOQItem(orgId, projectId, itemId, user.uid, {
        isBulkItem: false,
      });
      onItemsUpdate();
    } catch (error) {
      console.error('Error unmarking bulk:', error);
      alert('Failed to unmark bulk. Please try again.');
    }
  };

  const handleFormulaApply = async (formulaId: string, formulaCode: string, wastageOverride?: number) => {
    if (!user) return;

    // Placeholder - implement actual material calculation from formula
    // This should use the materialCalculator service to calculate materials
    const mockMaterialRequirements = [
      {
        materialId: '1',
        materialName: 'Cement (50kg bags)',
        quantity: 7,
        unit: 'bags',
        unitRate: 32000,
        totalCost: 224000,
      },
      {
        materialId: '2',
        materialName: 'Sand',
        quantity: 0.4,
        unit: 'm³',
        unitRate: 90000,
        totalCost: 36000,
      },
    ];

    try {
      for (const itemId of selectedItems) {
        await updateBOQItemMaterials(
          orgId,
          projectId,
          itemId,
          user.uid,
          mockMaterialRequirements,
          formulaId,
          formulaCode
        );
      }
      setSelectedItems(new Set());
      onItemsUpdate();
    } catch (error) {
      console.error('Error applying formula:', error);
      throw error;
    }
  };

  const handleCustomMaterialsSave = async (materials: any[]) => {
    if (!user || !customModalItem) return;

    const materialRequirements = materials.map(m => ({
      materialId: m.materialId,
      materialName: m.materialName,
      quantity: m.quantity,
      unit: m.unit,
      wastagePercent: m.wastagePercent,
      unitRate: 0, // TODO: Get from material library
      totalCost: 0,
    }));

    try {
      await updateBOQItemMaterials(
        orgId,
        projectId,
        customModalItem.id,
        user.uid,
        materialRequirements,
        undefined,
        undefined
      );
      onItemsUpdate();
    } catch (error) {
      console.error('Error saving custom materials:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            Material Calculator
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Calculate material requirements from formulas or build custom lists
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('items')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'items'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List className="w-4 h-4" />
            Item View
          </button>
          <button
            onClick={() => setViewMode('aggregation')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
              viewMode === 'aggregation'
                ? 'bg-purple-100 text-purple-700 font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Aggregation
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
              <p className="text-xs text-gray-500 mt-1">Level 3+ items</p>
            </div>
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Formulas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.itemsWithFormulas}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.totalItems > 0 ? Math.round((stats.itemsWithFormulas / stats.totalItems) * 100) : 0}% complete
              </p>
            </div>
            <Beaker className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Formulas</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.itemsNeedingFormulas}</p>
              <p className="text-xs text-gray-500 mt-1">Requires breakdown</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bulk Items</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.bulkItems}</p>
              <p className="text-xs text-gray-500 mt-1">Sent to supplier</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Custom Lists</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.customMaterials}</p>
              <p className="text-xs text-gray-500 mt-1">Manual breakdown</p>
            </div>
            <Calculator className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Formula Filter */}
      {viewMode === 'items' && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormulaFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                formulaFilter === 'all'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({stats.totalItems})
            </button>
            <button
              onClick={() => setFormulaFilter('applied')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                formulaFilter === 'applied'
                  ? 'bg-green-100 text-green-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Applied ({stats.itemsWithFormulas})
            </button>
            <button
              onClick={() => setFormulaFilter('not_applied')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                formulaFilter === 'not_applied'
                  ? 'bg-orange-100 text-orange-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Not Applied ({stats.itemsNeedingFormulas})
            </button>
            <button
              onClick={() => setFormulaFilter('custom')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                formulaFilter === 'custom'
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Custom ({stats.customMaterials})
            </button>
            <button
              onClick={() => setFormulaFilter('bulk')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                formulaFilter === 'bulk'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Bulk ({stats.bulkItems})
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'items' ? (
        <MaterialRequirementsTable
          items={filteredItems}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onApplyFormula={handleApplyFormula}
          onCustomMaterials={handleCustomMaterials}
          onClearMaterials={handleClearMaterials}
          onConvertToBulk={handleConvertToBulk}
          onUnmarkBulk={handleUnmarkBulk}
        />
      ) : (
        <MaterialAggregationView items={items} />
      )}

      {/* Formula Application Modal */}
      <FormulaApplicationPanel
        isOpen={isFormulaModalOpen}
        onClose={() => {
          setIsFormulaModalOpen(false);
          setSelectedItems(new Set());
        }}
        selectedItems={selectedBoqItems}
        onApply={handleFormulaApply}
      />

      {/* Custom Material Builder Modal */}
      <CustomMaterialBuilder
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setCustomModalItem(null);
        }}
        boqItem={customModalItem}
        onSave={handleCustomMaterialsSave}
      />
    </div>
  );
}
