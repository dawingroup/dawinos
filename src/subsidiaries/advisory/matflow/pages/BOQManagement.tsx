/**
 * BOQ Management Page
 * Control BOQ for project - view, import, and manage BOQ items
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Upload,
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  Loader2,
  LayoutList,
  Table,
  Calculator,
  X,
  Plus,
  Edit
} from 'lucide-react';
import { subscribeToBOQItems, createBOQItem, updateBOQItem } from '../services/boqService';
import { useAuth } from '@/core/hooks/useAuth';
import { BOQSummary } from '../components/BOQSummary';
import { BOQItemModal } from '../components/BOQItemModal';
import { MaterialCalculatorView } from '../components/materials/MaterialCalculatorView';
import type { BOQItem } from '../types';

type ViewMode = 'summary' | 'details' | 'materials';

const BOQManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [boqItems, setBoqItems] = useState<BOQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [billFilter, setBillFilter] = useState<string | null>(null);
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BOQItem | undefined>(undefined);

  // Get organization ID from user (with type assertion)
  const orgId = (user as { organizationId?: string })?.organizationId || 'default';

  useEffect(() => {
    console.log('BOQManagement mounted', { projectId, orgId, userId: user?.uid });

    if (!projectId || !user) {
      console.warn('Missing projectId or user', { projectId, hasUser: !!user });
      setIsLoading(false);
      return;
    }

    console.log('Subscribing to BOQ items...');
    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = subscribeToBOQItems(
        orgId,
        projectId,
        (items) => {
          console.log('BOQ items received:', items.length);
          setBoqItems(items);
          setIsLoading(false);
        }
      );

      return () => {
        console.log('Unsubscribing from BOQ items');
        unsubscribe();
      };
    } catch (err) {
      console.error('Failed to subscribe to BOQ items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load BOQ items');
      setIsLoading(false);
    }
  }, [projectId, orgId, user]);

  const handleImportClick = () => {
    console.log('Navigating to BOQ import page');
    navigate(`/advisory/delivery/projects/${projectId}/boq/import`);
  };

  const handleNavigateToItems = (filter: { billNumber?: string; elementCode?: string }) => {
    setBillFilter(filter.billNumber || null);
    setElementFilter(filter.elementCode || null);
    setViewMode('details');
  };

  const clearFilters = () => {
    setBillFilter(null);
    setElementFilter(null);
  };

  const handleAddItem = () => {
    setSelectedItem(undefined);
    setIsModalOpen(true);
  };

  const handleAddItemInContext = (billNumber?: string, elementCode?: string, sectionCode?: string) => {
    setSelectedItem(undefined);
    // Store context for modal to use
    (window as any).__boqAddContext = { billNumber, elementCode, sectionCode };
    setIsModalOpen(true);
  };

  const handleEditItem = (item: BOQItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (itemData: Partial<BOQItem>) => {
    if (!projectId || !user) return;

    try {
      if (selectedItem) {
        // Update existing item
        await updateBOQItem(orgId, projectId, selectedItem.id, user.uid, itemData);
      } else {
        // Create new item - need to add missing required fields
        const newItemData = {
          itemCode: itemData.itemNumber || '',
          description: itemData.description || '',
          unit: itemData.unit || '',
          quantityContract: itemData.quantityContract || 0,
          rate: itemData.rate,
          stage: 'uncategorized' as const,
          ...itemData,
        };
        await createBOQItem(orgId, projectId, user.uid, newItemData as any);
      }
      setIsModalOpen(false);
      setSelectedItem(undefined);
    } catch (error) {
      console.error('Error saving BOQ item:', error);
      throw error;
    }
  };

  // Filtered and sorted items based on current filters
  const filteredItems = useMemo(() => {
    let filtered = boqItems;

    if (billFilter) {
      filtered = filtered.filter(item => item.billNumber === billFilter);
    }

    if (elementFilter) {
      filtered = filtered.filter(item => item.elementCode === elementFilter);
    }

    // Sort by hierarchical item code in ascending order
    const sorted = [...filtered].sort((a, b) => {
      const codeA = a.hierarchyPath || a.itemNumber || '';
      const codeB = b.hierarchyPath || b.itemNumber || '';

      // Parse into numeric parts for proper hierarchical sorting
      const partsA = codeA.split(/[.\-\/]/).map(p => parseInt(p) || 0);
      const partsB = codeB.split(/[.\-\/]/).map(p => parseInt(p) || 0);

      // Compare level by level
      const maxLength = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLength; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;

        if (numA !== numB) {
          return numA - numB;
        }
      }

      return 0;
    });

    return sorted;
  }, [boqItems, billFilter, elementFilter]);

  // Calculate statistics
  const stats = {
    totalItems: boqItems.length,
    totalValue: boqItems.reduce((sum, item) => sum + (item.amount || 0), 0),
    verified: boqItems.filter(item => item.status === 'approved').length,
    needsReview: boqItems.filter(item => item.status === 'draft').length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="ml-3 text-gray-600">Loading BOQ items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-900">Error Loading BOQ</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Import Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" />
            Control BOQ
          </h2>
          <p className="text-gray-600 mt-1">Bill of Quantities for this project</p>
        </div>
        <div className="flex items-center gap-3">
          {boqItems.length > 0 && (
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('summary')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'summary'
                    ? 'bg-amber-100 text-amber-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Summary
              </button>
              <button
                onClick={() => setViewMode('details')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'details'
                    ? 'bg-amber-100 text-amber-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table className="w-4 h-4" />
                Details
              </button>
              <button
                onClick={() => setViewMode('materials')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'materials'
                    ? 'bg-purple-100 text-purple-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calculator className="w-4 h-4" />
                Materials
              </button>
            </div>
          )}
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button
            onClick={handleImportClick}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import BOQ
          </button>
        </div>
      </div>

      {/* Empty State */}
      {boqItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No BOQ Items Yet</h3>
          <p className="text-gray-500 mb-6">Import a BOQ file to get started with project tracking</p>
          <button
            onClick={handleImportClick}
            className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2 mx-auto"
          >
            <Upload className="w-5 h-5" />
            Import Your First BOQ
          </button>
        </div>
      ) : (
        <>
          {/* Summary View */}
          {viewMode === 'summary' && (
            <BOQSummary items={boqItems} onNavigateToItems={handleNavigateToItems} />
          )}

          {/* Details View */}
          {viewMode === 'details' && (
            <>
              {/* Active Filters */}
              {(billFilter || elementFilter) && (
                <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <span className="text-sm text-amber-900 font-medium">Filtered by:</span>
                  {billFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-sm">
                      Bill {billFilter}
                      {!elementFilter && (
                        <button onClick={() => setBillFilter(null)} className="ml-1 text-gray-500 hover:text-gray-700">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  )}
                  {elementFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded text-sm">
                      Element {billFilter}.{elementFilter}
                      <button onClick={() => setElementFilter(null)} className="ml-1 text-gray-500 hover:text-gray-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-sm text-amber-700 hover:text-amber-800 font-medium"
                  >
                    Clear all filters
                  </button>
                </div>
              )}

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalItems}</p>
                    </div>
                    <ClipboardList className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {new Intl.NumberFormat('en-UG', {
                          style: 'currency',
                          currency: 'UGX',
                          maximumFractionDigits: 0
                        }).format(stats.totalValue)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Verified</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.verified}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.totalItems > 0 ? Math.round((stats.verified / stats.totalItems) * 100) : 0}% complete
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Needs Review</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.needsReview}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* BOQ Items Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    BOQ Items {(billFilter || elementFilter) && `(${filteredItems.length} filtered)`}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.slice(0, 50).map((item) => {
                        // Determine hierarchy level and if it's a header
                        const isLevel1 = item.hierarchyLevel === 1; // Bill header
                        const isLevel2 = item.hierarchyLevel === 2; // Element header
                        const isHeader = isLevel1 || isLevel2;

                        // Build hierarchical item code
                        const itemCode = item.hierarchyPath || item.itemNumber;

                        return (
                          <tr
                            key={item.id}
                            className={`${
                              isLevel1 ? 'bg-amber-50 hover:bg-amber-100 font-semibold' :
                              isLevel2 ? 'bg-blue-50 hover:bg-blue-100 font-medium' :
                              'hover:bg-gray-50'
                            }`}
                          >
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isLevel1 ? 'font-bold text-amber-900' :
                              isLevel2 ? 'font-semibold text-blue-900' :
                              'font-medium text-gray-900'
                            }`}>
                              {itemCode}
                            </td>
                            <td className={`px-6 py-4 text-sm ${
                              isLevel1 ? 'font-bold text-amber-900 uppercase' :
                              isLevel2 ? 'font-semibold text-blue-900' :
                              'text-gray-700'
                            }`}>
                              {isLevel1 && item.billName ? `BILL ${item.billNumber}: ${item.billName}` :
                               isLevel2 && item.elementName ? `${item.elementName}` :
                               item.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {!isHeader ? item.unit : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {!isHeader && (item.quantityContract || item.quantity) ? (item.quantityContract || item.quantity).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {!isHeader && (item.rate || item.unitRate) ? new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(item.rate || item.unitRate) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {!isHeader && item.amount ? new Intl.NumberFormat('en-UG', { maximumFractionDigits: 0 }).format(item.amount) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {!isHeader ? (
                                item.status === 'approved' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                    Approved
                                  </span>
                                ) : item.status === 'reviewed' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                    Reviewed
                                  </span>
                                ) : item.status === 'rejected' ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                                    Draft
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-gray-400">Header</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-amber-600 hover:text-amber-800"
                                title="Edit item"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredItems.length > 50 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
                    Showing first 50 of {filteredItems.length} items
                  </div>
                )}
              </div>
            </>
          )}

          {/* Materials View */}
          {viewMode === 'materials' && (
            <MaterialCalculatorView
              projectId={projectId || ''}
              items={boqItems}
              onItemsUpdate={() => {
                // BOQ items are already being updated via subscription
                // This callback is just for triggering any additional refresh if needed
              }}
            />
          )}
        </>
      )}

      {/* BOQ Item Modal */}
      <BOQItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(undefined);
        }}
        onSave={handleSaveItem}
        existingItem={selectedItem}
        projectId={projectId || ''}
        allItems={boqItems}
      />
    </div>
  );
};

export default BOQManagement;
