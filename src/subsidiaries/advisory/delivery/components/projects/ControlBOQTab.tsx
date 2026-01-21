/**
 * Control BOQ Tab
 * 
 * Tab component for managing the Control BOQ within project detail.
 * Allows importing, viewing, and managing BOQ items.
 */

import { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useProjectBOQItems, useControlBOQ } from '../../core/hooks/useControlBOQ';
import { useBOQParsing } from '../../core/hooks/useBOQParsing';
import { updateControlBOQStatus } from '../../core/services/control-boq';
import { db } from '@/core/services/firebase';
import { useAuth } from '@/shared/hooks';
import { BOQ_ITEM_STATUS_CONFIG } from '../../core/types/boq';
import type { ControlBOQItem, BOQDocumentStatus } from '../../core/types/boq';

interface ControlBOQTabProps {
  projectId: string;
}

function formatCurrency(amount: number, currency: string = 'UGX'): string {
  if (amount >= 1000000000) return `${currency} ${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(1)}K`;
  return `${currency} ${amount.toLocaleString()}`;
}

interface BOQItemGroupProps {
  title: string;
  items: ControlBOQItem[];
  defaultExpanded?: boolean;
}

function BOQItemGroup({ title, items, defaultExpanded = false }: BOQItemGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const totalValue = items.reduce((sum, item) => sum + item.amount, 0);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className="font-medium">{title}</span>
          <span className="text-sm text-gray-500">({items.length} items)</span>
        </div>
        <span className="text-sm font-medium">{formatCurrency(totalValue)}</span>
      </button>
      
      {isExpanded && (
        <div className="divide-y">
          {items.map(item => (
            <div key={item.id} className="p-3 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{item.itemCode}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      BOQ_ITEM_STATUS_CONFIG[item.status].color === 'gray' ? 'bg-gray-100 text-gray-600' :
                      BOQ_ITEM_STATUS_CONFIG[item.status].color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      BOQ_ITEM_STATUS_CONFIG[item.status].color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      BOQ_ITEM_STATUS_CONFIG[item.status].color === 'green' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {BOQ_ITEM_STATUS_CONFIG[item.status].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{item.description}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{item.quantityContract} {item.unit}</div>
                  <div className="text-gray-500">{formatCurrency(item.rate)}/{item.unit}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ControlBOQTab({ projectId }: ControlBOQTabProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { controlBOQ, loading: boqLoading, refresh: refreshBOQ } = useControlBOQ(db, projectId);
  const { items, byBill, summary, loading: itemsLoading, refresh: refreshItems } = useProjectBOQItems(
    db,
    projectId,
    { realtime: true }
  );
  
  const {
    isParsing,
    isCleaning,
    isImporting,
    progress,
    progressStage,
    error,
    parsedItems,
    cleanedItems,
    cleanupResult,
    parseFile,
    importItems,
    clear,
  } = useBOQParsing({
    projectId,
    userId: user?.uid || '',
  });
  
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowImportDialog(true);
    await parseFile(file);
  };

  const handleImport = async () => {
    const fileName = fileInputRef.current?.files?.[0]?.name;
    await importItems(db, fileName);
    setShowImportDialog(false);
    clear();
    refreshBOQ();
    refreshItems();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStatusChange = async (newStatus: BOQDocumentStatus) => {
    if (!user?.uid) return;

    setIsUpdatingStatus(true);
    try {
      await updateControlBOQStatus(db, projectId, newStatus, user.uid);
      await refreshBOQ();
    } catch (error) {
      console.error('Failed to update BOQ status:', error);
      alert('Failed to update BOQ status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };
  
  const isLoading = boqLoading || itemsLoading;
  const isProcessing = isParsing || isCleaning || isImporting;

  // Debug logging
  console.log('ControlBOQTab Debug:', {
    projectId,
    controlBOQ: controlBOQ ? { id: controlBOQ.id, status: controlBOQ.status, name: controlBOQ.name } : null,
    itemsCount: items.length,
    isLoading,
    boqLoading,
    itemsLoading
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading Control BOQ...</span>
      </div>
    );
  }

  // No Control BOQ yet - show import prompt
  if (!controlBOQ && items.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Control BOQ</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Import a Bill of Quantities to establish the control baseline for this project.
            The BOQ will be used for requisitions, IPCs, and progress tracking.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import BOQ
          </button>
        </div>
        
        {/* Import Dialog */}
        {showImportDialog && (
          <ImportDialog
            isParsing={isParsing}
            isCleaning={isCleaning}
            isImporting={isImporting}
            progress={progress}
            progressStage={progressStage}
            error={error}
            parsedCount={parsedItems.length}
            cleanedCount={cleanedItems.length}
            cleanupResult={cleanupResult}
            onImport={handleImport}
            onCancel={() => {
              setShowImportDialog(false);
              clear();
            }}
          />
        )}
      </div>
    );
  }
  
  // Has Control BOQ - show items
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Control BOQ</h2>
              {controlBOQ && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  controlBOQ.status === 'approved' ? 'bg-green-100 text-green-700' :
                  controlBOQ.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                  controlBOQ.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                  controlBOQ.status === 'superseded' ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {controlBOQ.status === 'draft' && 'Draft'}
                  {controlBOQ.status === 'pending_review' && 'Pending Review'}
                  {controlBOQ.status === 'approved' && 'Approved'}
                  {controlBOQ.status === 'superseded' && 'Superseded'}
                  {controlBOQ.status === 'archived' && 'Archived'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {summary.totalItems} items • {formatCurrency(summary.totalContractValue)} contract value
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {controlBOQ && controlBOQ.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('approved')}
              disabled={isUpdatingStatus}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Approve & Publish
            </button>
          )}

          <button
            onClick={() => {
              refreshBOQ();
              refreshItems();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Upload className="w-4 h-4" />
            Re-import
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Contract Value</div>
          <div className="text-xl font-bold text-gray-900">
            {formatCurrency(summary.totalContractValue)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Processed</div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(summary.processedValue)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Executed</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(summary.executedValue)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="text-xl font-bold text-gray-600">
            {formatCurrency(summary.remainingValue)}
          </div>
        </div>
      </div>
      
      {/* Status Summary */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-500">Status:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          Pending: {summary.byStatus.pending}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Partial: {summary.byStatus.partial}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
          In Progress: {summary.byStatus.in_progress}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Completed: {summary.byStatus.completed}
        </span>
      </div>
      
      {/* Items by Bill */}
      <div className="space-y-3">
        {Object.entries(byBill).map(([billName, billItems], index) => (
          <BOQItemGroup
            key={billName}
            title={billName}
            items={billItems}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
      
      {/* Import Dialog */}
      {showImportDialog && (
        <ImportDialog
          isParsing={isParsing}
          isCleaning={isCleaning}
          isImporting={isImporting}
          progress={progress}
          progressStage={progressStage}
          error={error}
          parsedCount={parsedItems.length}
          cleanedCount={cleanedItems.length}
          cleanupResult={cleanupResult}
          onImport={handleImport}
          onCancel={() => {
            setShowImportDialog(false);
            clear();
          }}
        />
      )}
    </div>
  );
}

interface ImportDialogProps {
  isParsing: boolean;
  isCleaning: boolean;
  isImporting: boolean;
  progress: number;
  progressStage: string;
  error: string | null;
  parsedCount: number;
  cleanedCount: number;
  cleanupResult: { stats: { totalCleaned: number; summaryRowsRemoved: number } } | null;
  onImport: () => void;
  onCancel: () => void;
}

function ImportDialog({
  isParsing,
  isCleaning,
  isImporting,
  progress,
  progressStage,
  error,
  parsedCount,
  cleanedCount,
  cleanupResult,
  onImport,
  onCancel,
}: ImportDialogProps) {
  const isProcessing = isParsing || isCleaning || isImporting;
  const canImport = cleanedCount > 0 && !isProcessing;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold mb-4">Import BOQ</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        {isProcessing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 capitalize">{progressStage.replace('_', ' ')}</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        
        {parsedCount > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>Parsed {parsedCount} items</span>
            </div>
            {cleanupResult && (
              <div className="mt-2 text-sm text-green-600">
                Cleaned: {cleanupResult.stats.totalCleaned} items, 
                Removed: {cleanupResult.stats.summaryRowsRemoved} summary rows
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={onImport}
            disabled={!canImport}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Import to Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControlBOQTab;
