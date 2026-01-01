/**
 * DesignItemsTable Component
 * Table-based view of design items with stages as columns
 * Similar to Katana's sales order list view
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Check, Clock, AlertCircle, Package, ShoppingCart } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { DesignItem, DesignStage } from '../../types';
import { STAGE_LABELS } from '../../utils/formatting';
import { 
  MANUFACTURING_STAGE_ORDER, 
  PROCUREMENT_STAGE_ORDER,
  getStageOrderForItem 
} from '../../utils/stage-gate';

interface DesignItemsTableProps {
  items: DesignItem[];
  projectId: string;
}

type SortField = 'name' | 'createdAt' | 'category' | 'readiness' | 'stage';
type SortDirection = 'asc' | 'desc';

// Stage status for display
type StageStatus = 'completed' | 'current' | 'pending' | 'not-applicable';

function getStageStatus(item: DesignItem, stage: DesignStage): StageStatus {
  const stageOrder = getStageOrderForItem(item);
  const currentIndex = stageOrder.indexOf(item.currentStage);
  const stageIndex = stageOrder.indexOf(stage);
  
  if (stageIndex === -1) return 'not-applicable';
  if (stageIndex < currentIndex) return 'completed';
  if (stageIndex === currentIndex) return 'current';
  return 'pending';
}

// Stage cell colors - full cell background
const STAGE_CELL_CONFIG: Record<StageStatus, { bg: string; text: string; label: string }> = {
  'completed': { 
    bg: 'bg-green-500', 
    text: 'text-white font-medium',
    label: '✓'
  },
  'current': { 
    bg: 'bg-blue-500', 
    text: 'text-white font-medium',
    label: '●'
  },
  'pending': { 
    bg: 'bg-gray-100', 
    text: 'text-gray-400',
    label: '○'
  },
  'not-applicable': { 
    bg: 'bg-gray-50', 
    text: 'text-gray-300',
    label: '—'
  },
};

function ReadinessBadge({ readiness }: { readiness: number }) {
  let bg = 'bg-red-100 text-red-700';
  if (readiness >= 80) {
    bg = 'bg-green-100 text-green-700';
  } else if (readiness >= 50) {
    bg = 'bg-amber-100 text-amber-700';
  }

  return (
    <span className={cn('px-2 py-0.5 rounded text-xs font-medium', bg)}>
      {readiness}%
    </span>
  );
}

export function DesignItemsTable({ items, projectId }: DesignItemsTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Separate items by type
  const manufacturedItems = useMemo(() => 
    items.filter(i => (i as any).sourcingType !== 'PROCURED'),
    [items]
  );
  
  const procuredItems = useMemo(() => 
    items.filter(i => (i as any).sourcingType === 'PROCURED'),
    [items]
  );

  // Sort items
  const sortedManufactured = useMemo(() => {
    return [...manufacturedItems].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          comparison = aTime - bTime;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'readiness':
          comparison = a.overallReadiness - b.overallReadiness;
          break;
        case 'stage':
          const aIndex = MANUFACTURING_STAGE_ORDER.indexOf(a.currentStage);
          const bIndex = MANUFACTURING_STAGE_ORDER.indexOf(b.currentStage);
          comparison = aIndex - bIndex;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [manufacturedItems, sortField, sortDirection]);

  const sortedProcured = useMemo(() => {
    return [...procuredItems].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          comparison = aTime - bTime;
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'readiness':
          comparison = a.overallReadiness - b.overallReadiness;
          break;
        case 'stage':
          const aIndex = PROCUREMENT_STAGE_ORDER.indexOf(a.currentStage);
          const bIndex = PROCUREMENT_STAGE_ORDER.indexOf(b.currentStage);
          comparison = aIndex - bIndex;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [procuredItems, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = (itemList: DesignItem[]) => {
    const allSelected = itemList.every(i => selectedItems.has(i.id));
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      itemList.forEach(i => newSelected.delete(i.id));
    } else {
      itemList.forEach(i => newSelected.add(i.id));
    }
    setSelectedItems(newSelected);
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    let date: Date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds !== undefined) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const renderTable = (
    title: string,
    icon: React.ReactNode,
    itemList: DesignItem[],
    stageOrder: DesignStage[]
  ) => {
    if (itemList.length === 0) return null;

    const allSelected = itemList.every(i => selectedItems.has(i.id));
    const someSelected = itemList.some(i => selectedItems.has(i.id)) && !allSelected;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
            {itemList.length}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={() => toggleSelectAll(itemList)}
                    className="h-4 w-4 text-[#0A7C8E] border-gray-300 rounded focus:ring-[#0A7C8E]"
                  />
                </th>
                <SortHeader field="createdAt">Created</SortHeader>
                <SortHeader field="name">Item</SortHeader>
                <SortHeader field="category">Category</SortHeader>
                <SortHeader field="readiness">Readiness</SortHeader>
                {/* Stage columns - with thicker left border for separation */}
                {stageOrder.map((stage, idx) => (
                  <th
                    key={stage}
                    className={cn(
                      "px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]",
                      idx === 0 ? "border-l-2 border-l-gray-300" : "border-l-2 border-l-gray-200"
                    )}
                  >
                    {STAGE_LABELS[stage]?.replace('Procure: ', '') || stage}
                  </th>
                ))}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-l-2 border-l-gray-300">
                  Costing
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {itemList.map((item, idx) => {
                const isSelected = selectedItems.has(item.id);
                const hasCosting = (item as any).manufacturing?.totalCost || (item as any).procurement?.totalLandedCost;
                
                return (
                  <tr
                    key={item.id}
                    className={cn(
                      'hover:bg-gray-50 transition-colors',
                      isSelected && 'bg-blue-50',
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    )}
                  >
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        className="h-4 w-4 text-[#0A7C8E] border-gray-300 rounded focus:ring-[#0A7C8E]"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        to={`item/${item.id}`}
                        className="text-sm font-medium text-[#0A7C8E] hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.code && (
                        <p className="text-xs text-gray-500">{item.code}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-600">
                      {item.category || '—'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <ReadinessBadge readiness={item.overallReadiness} />
                    </td>
                    {/* Stage status columns - colored cells */}
                    {stageOrder.map((stage, stageIdx) => {
                      const status = getStageStatus(item, stage);
                      const config = STAGE_CELL_CONFIG[status];
                      return (
                        <td 
                          key={stage} 
                          className={cn(
                            "px-2 py-2 text-center whitespace-nowrap min-w-[80px]",
                            config.bg,
                            config.text,
                            stageIdx === 0 ? "border-l-2 border-l-gray-300" : "border-l-2 border-l-gray-200"
                          )}
                        >
                          <span className="text-sm">{config.label}</span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 whitespace-nowrap border-l-2 border-l-gray-300">
                      {hasCosting ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          <Check className="w-3 h-3" />
                          Costed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Manufacturing Items Table */}
      {renderTable(
        'Manufacturing Items',
        <Package className="w-4 h-4 text-blue-600" />,
        sortedManufactured,
        MANUFACTURING_STAGE_ORDER
      )}

      {/* Procurement Items Table */}
      {renderTable(
        'Procurement Items',
        <ShoppingCart className="w-4 h-4 text-purple-600" />,
        sortedProcured,
        PROCUREMENT_STAGE_ORDER
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No design items</h3>
          <p className="text-gray-500 mt-1">Add design items to see them here.</p>
        </div>
      )}
    </div>
  );
}
