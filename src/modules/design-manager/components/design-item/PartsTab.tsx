/**
 * PartsTab Component
 * Display and manage parts within a design item
 * Includes: Sheet parts, Standard parts (from Katana), and Special parts (approved for luxury)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Upload, Trash2, Edit2, Package, AlertCircle, Wrench, Sparkles, Save, Check, Library, Loader2, Search, DollarSign, RefreshCw, Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParts } from '../../hooks/useParts';
import type { DesignItem, PartEntry, StandardPartEntry, SpecialPartEntry, ProjectPart } from '../../types';
import { PartForm } from './PartForm';
import { PartsImportDialog } from './PartsImportDialog';
import { ProjectPartsPicker } from './ProjectPartsPicker';
import { updateDesignItem } from '../../services/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';

interface PartsTabProps {
  item: DesignItem;
  projectId: string;
}

type PartsSection = 'sheet' | 'standard' | 'special' | 'costing';

export function PartsTab({ item, projectId }: PartsTabProps) {
  const { user } = useAuth();
  const parts = useParts(projectId, item, user?.email || '');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingPart, setEditingPart] = useState<PartEntry | null>(null);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<PartsSection>('sheet');
  
  // Standard parts state (hinges, screws, edging from Katana)
  const manufacturing = (item as any).manufacturing || {};
  const [standardParts, setStandardParts] = useState<StandardPartEntry[]>(manufacturing.standardParts || []);
  const [newStandardPart, setNewStandardPart] = useState({ name: '', category: 'hinge', quantity: 1, katanaSku: '' });
  
  // Katana inventory state
  const [katanaInventory, setKatanaInventory] = useState<Array<{ id: string; name: string; sku: string; category: string; unitCost: number }>>([]);
  const [loadingKatana, setLoadingKatana] = useState(false);
  const [katanaSearch, setKatanaSearch] = useState('');
  
  // Exchange rates for special parts
  const EXCHANGE_RATES: Record<string, number> = {
    'USD': 3700, 'EUR': 4000, 'GBP': 4600, 'AED': 1000, 'CNY': 510, 'KES': 29, 'UGX': 1
  };
  const TARGET_CURRENCY = 'UGX';
  
  // Special parts state (for luxury projects) - includes inline costing
  const [specialParts, setSpecialParts] = useState<SpecialPartEntry[]>(manufacturing.specialParts || []);
  const [newSpecialPart, setNewSpecialPart] = useState({ name: '', category: 'handle', quantity: 1, supplier: '' });
  const [editingSpecialPartId, setEditingSpecialPartId] = useState<string | null>(null);
  const [editingCostingId, setEditingCostingId] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPartsPicker, setShowPartsPicker] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved'>('idle');
  
  // Costing state (sheet materials auto-calculated from parts)
  const [sheetMaterials, setSheetMaterials] = useState<any[]>(manufacturing.sheetMaterials || []);
  const [sheetMaterialsCost, setSheetMaterialsCost] = useState<number>(manufacturing.sheetMaterialsCost || 0);
  const [laborHours, setLaborHours] = useState<number>(manufacturing.laborHours || 0);
  const [laborRate, setLaborRate] = useState<number>(manufacturing.laborRate || 15000);
  const [calculating, setCalculating] = useState(false);

  const partsList: PartEntry[] = (item as any).parts || [];
  const summary = (item as any).partsSummary;
  
  // Required quantity multiplier (how many of this design item are needed)
  const requiredQuantity = (item as any).requiredQuantity || 1;
  
  // Calculate totals per unit
  const standardPartsCostPerUnit = standardParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
  // Special parts cost is calculated from costing data (managed in Costing Tab)
  const specialPartsCostPerUnit = specialParts.reduce((sum, p) => sum + (p.costing?.totalLandedCost || 0), 0);
  
  // Calculate totals with requiredQuantity multiplier
  const standardPartsCost = standardPartsCostPerUnit * requiredQuantity;
  const specialPartsCost = specialPartsCostPerUnit * requiredQuantity;
  const totalStandardPartsQty = standardParts.reduce((sum, p) => sum + p.quantity, 0) * requiredQuantity;
  const totalSpecialPartsQty = specialParts.reduce((sum, p) => sum + p.quantity, 0) * requiredQuantity;

  // Track initial values to detect changes
  const initialStandardPartsRef = useRef(JSON.stringify(manufacturing.standardParts || []));
  const initialSpecialPartsRef = useRef(JSON.stringify(manufacturing.specialParts || []));
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to remove undefined values from objects (Firestore doesn't accept undefined)
  const cleanUndefinedValues = useCallback((obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
    if (typeof obj !== 'object') return obj;
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = typeof value === 'object' && value !== null ? cleanUndefinedValues(value) : value;
      }
    }
    return cleaned;
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!user?.email) return;
    
    setAutoSaveStatus('saving');
    try {
      const updatedManufacturing = cleanUndefinedValues({
        ...manufacturing,
        standardParts: standardParts,
        standardPartsCost: standardPartsCost,
        specialParts: specialParts,
        specialPartsCost: specialPartsCost,
      });
      await updateDesignItem(projectId, item.id, {
        manufacturing: updatedManufacturing,
      } as any, user.email);
      
      // Update refs to reflect saved state
      initialStandardPartsRef.current = JSON.stringify(standardParts);
      initialSpecialPartsRef.current = JSON.stringify(specialParts);
      
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('idle');
    }
  }, [user?.email, manufacturing, standardParts, specialParts, standardPartsCost, specialPartsCost, projectId, item.id]);

  // Auto-save effect - triggers when standard or special parts change
  useEffect(() => {
    const currentStandard = JSON.stringify(standardParts);
    const currentSpecial = JSON.stringify(specialParts);
    
    // Check if there are actual changes from initial state
    const hasChanges = 
      currentStandard !== initialStandardPartsRef.current ||
      currentSpecial !== initialSpecialPartsRef.current;
    
    if (!hasChanges) {
      return;
    }
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set pending status and schedule auto-save
    setAutoSaveStatus('pending');
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 1500); // 1.5 second debounce
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [standardParts, specialParts, performAutoSave]);

  const handleDelete = async (partId: string) => {
    if (!confirm('Delete this part?')) return;
    try {
      await parts.remove(partId);
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedParts.size} selected parts?`)) return;
    for (const partId of selectedParts) {
      await parts.remove(partId);
    }
    setSelectedParts(new Set());
  };

  const toggleSelect = (partId: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
    } else {
      newSelected.add(partId);
    }
    setSelectedParts(newSelected);
  };

  const selectAll = () => {
    if (selectedParts.size === partsList.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(partsList.map((p) => p.id)));
    }
  };

  // Fetch Katana inventory on mount
  useEffect(() => {
    fetchKatanaInventory();
  }, []);

  const fetchKatanaInventory = async () => {
    setLoadingKatana(true);
    try {
      // Use Firebase callable function (bypasses Cloud Run IAM org policy)
      const getKatanaMaterials = httpsCallable(functions, 'getKatanaMaterialsCallable');
      const result = await getKatanaMaterials();
      const data = result.data as any;
      
      if (data.success && data.materials) {
        // Map Katana materials to inventory items with costs
        const inventory = data.materials.map((m: any) => ({
          id: m.katanaId || m.id,
          name: m.name,
          sku: m.sku || m.katanaId || m.id,
          category: m.type || 'other',
          unitCost: m.unitCost || m.cost || 0, // Cost from Katana
        }));
        setKatanaInventory(inventory);
        console.log(`Loaded ${inventory.length} materials from Katana`);
      }
    } catch (error) {
      console.error('Failed to fetch Katana inventory:', error);
    } finally {
      setLoadingKatana(false);
    }
  };

  // Filter Katana inventory based on search
  const filteredKatanaInventory = useMemo(() => {
    if (!katanaSearch.trim()) return katanaInventory.slice(0, 20);
    const search = katanaSearch.toLowerCase();
    return katanaInventory.filter(item =>
      item.name.toLowerCase().includes(search) ||
      item.sku.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [katanaInventory, katanaSearch]);

  // Add standard part from Katana selection
  const addStandardPartFromKatana = (katanaItem: typeof katanaInventory[0], quantity: number) => {
    setStandardParts([...standardParts, {
      id: `sp-${Date.now()}`,
      katanaSku: katanaItem.sku,
      name: katanaItem.name,
      category: (katanaItem.category || 'other') as StandardPartEntry['category'],
      quantity: quantity,
      unitCost: katanaItem.unitCost, // Auto-fetched from Katana
      totalCost: quantity * katanaItem.unitCost,
    }]);
    setKatanaSearch('');
    setNewStandardPart({ name: '', category: 'hinge', quantity: 1, katanaSku: '' });
  };

  // Add standard part manually (for items not in Katana)
  const addStandardPart = () => {
    if (!newStandardPart.name) return;
    // Find cost from Katana if SKU matches
    const katanaMatch = katanaInventory.find(k => k.sku === newStandardPart.katanaSku);
    const unitCost = katanaMatch?.unitCost || 0;
    
    setStandardParts([...standardParts, {
      id: `sp-${Date.now()}`,
      katanaSku: newStandardPart.katanaSku || undefined,
      name: newStandardPart.name,
      category: newStandardPart.category as StandardPartEntry['category'],
      quantity: newStandardPart.quantity,
      unitCost: unitCost,
      totalCost: newStandardPart.quantity * unitCost,
    }]);
    setNewStandardPart({ name: '', category: 'hinge', quantity: 1, katanaSku: '' });
  };

  // Remove standard part
  const removeStandardPart = (id: string) => {
    setStandardParts(standardParts.filter(p => p.id !== id));
  };

  // Add special part (identification only - costing handled in Costing Tab)
  const addSpecialPart = () => {
    if (!newSpecialPart.name) return;
    const newPart: any = {
      id: `xp-${Date.now()}`,
      name: newSpecialPart.name,
      category: newSpecialPart.category as SpecialPartEntry['category'],
      quantity: newSpecialPart.quantity,
      supplier: newSpecialPart.supplier || '',
      approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    };
    // Only add approvedBy if user email exists
    if (user?.email) {
      newPart.approvedBy = user.email;
    }
    setSpecialParts([...specialParts, newPart]);
    setNewSpecialPart({ name: '', category: 'handle', quantity: 1, supplier: '' });
  };

  // Remove special part
  const removeSpecialPart = (id: string) => {
    setSpecialParts(specialParts.filter(p => p.id !== id));
  };

  // Update special part
  const updateSpecialPart = (id: string, updates: Partial<SpecialPartEntry>) => {
    // Clean undefined values before updating
    const cleanedUpdates = cleanUndefinedValues(updates);
    setSpecialParts(specialParts.map(p => p.id === id ? { ...p, ...cleanedUpdates } : p));
  };

  // Add special part from project parts library - auto-populate costing from clip price
  const addPartFromLibrary = (part: ProjectPart, quantity: number) => {
    // Default exchange rates
    const exchangeRates: Record<string, number> = {
      'USD': 3700, 'EUR': 4000, 'GBP': 4600, 'AED': 1000, 'CNY': 510, 'KES': 29,
    };
    const targetCurrency = 'UGX';
    const exchangeRate = exchangeRates[part.currency] || 1;
    const totalSourceCost = part.unitCost * quantity;
    const totalLandedCost = totalSourceCost * exchangeRate;
    
    const newPart: SpecialPartEntry = {
      id: `xp-lib-${Date.now()}`,
      name: part.name,
      category: part.category,
      quantity: quantity,
      supplier: part.supplier,
      referenceImageUrl: part.referenceImageUrl,
      purchaseUrl: part.purchaseUrl,
      projectPartId: part.id,
      ...(user?.email && { approvedBy: user.email }),
      approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
      // Auto-populate costing from clip price data
      costing: part.unitCost > 0 ? {
        unitCost: part.unitCost,
        currency: part.currency,
        exchangeRate: exchangeRate,
        targetCurrency: targetCurrency,
        totalSourceCost: totalSourceCost,
        landedUnitCost: (totalSourceCost / quantity) * exchangeRate,
        totalLandedCost: totalLandedCost,
        pricedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        ...(user?.email && { pricedBy: user.email }),
      } : undefined,
    };
    setSpecialParts([...specialParts, newPart]);
    setShowPartsPicker(false);
  };

  // Save standard and special parts to Firestore
  const savePartsToFirestore = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatedManufacturing = cleanUndefinedValues({
        ...manufacturing,
        standardParts: standardParts,
        standardPartsCost: standardPartsCost,
        specialParts: specialParts,
        specialPartsCost: specialPartsCost,
      });
      await updateDesignItem(projectId, item.id, {
        manufacturing: updatedManufacturing,
      } as any, user?.email || 'system');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save parts:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-UG');
  };

  return (
    <div className="space-y-4">
      {/* Required Quantity Banner */}
      {requiredQuantity > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-blue-700">×{requiredQuantity}</span>
            </div>
            <div>
              <p className="font-medium text-blue-900">Quantity Multiplier Active</p>
              <p className="text-sm text-blue-700">This design item requires {requiredQuantity} units. All part quantities are multiplied accordingly.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600 uppercase">Total Parts Needed</p>
            <p className="text-xl font-bold text-blue-900">
              {(partsList.length * requiredQuantity) + totalStandardPartsQty + totalSpecialPartsQty}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Required Qty</p>
            <p className="text-xl font-bold text-gray-900">{requiredQuantity}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Sheet Parts</p>
            <p className="text-xl font-bold text-gray-900">
              {summary.totalParts}
              {requiredQuantity > 1 && <span className="text-sm text-gray-500 font-normal"> × {requiredQuantity} = {summary.totalParts * requiredQuantity}</span>}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Materials</p>
            <p className="text-xl font-bold text-gray-900">{summary.uniqueMaterials}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Total Area</p>
            <p className="text-xl font-bold text-gray-900">
              {(summary.totalArea * requiredQuantity)?.toFixed(2) || 0} m²
              {requiredQuantity > 1 && <span className="text-xs text-gray-500 font-normal block">({summary.totalArea?.toFixed(2)} × {requiredQuantity})</span>}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className={`text-xl font-bold ${summary.isComplete ? 'text-green-600' : 'text-amber-600'}`}>
              {summary.isComplete ? 'Complete' : 'Incomplete'}
            </p>
          </div>
        </div>
      )}

      {/* Auto-save Status Indicator */}
      {autoSaveStatus !== 'idle' && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
          autoSaveStatus === 'pending' ? 'bg-amber-50 text-amber-700' :
          autoSaveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          'bg-green-50 text-green-700'
        }`}>
          {autoSaveStatus === 'pending' && (
            <>
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span>Unsaved changes...</span>
            </>
          )}
          {autoSaveStatus === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <Check className="w-4 h-4" />
              <span>Saved</span>
            </>
          )}
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('sheet')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'sheet'
              ? 'border-[#0A7C8E] text-[#0A7C8E]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Sheet Parts
          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{partsList.length}</span>
        </button>
        <button
          onClick={() => setActiveSection('standard')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'standard'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Standard Parts
          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{standardParts.length}</span>
        </button>
        <button
          onClick={() => setActiveSection('special')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'special'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Special Parts
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{specialParts.length}</span>
        </button>
        <button
          onClick={() => setActiveSection('costing')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'costing'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Costing Summary
          {manufacturing.totalCost > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              UGX {formatCurrency(manufacturing.totalCost)}
            </span>
          )}
        </button>
      </div>

      {/* SHEET PARTS SECTION */}
      {activeSection === 'sheet' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Add Part
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                <Upload className="h-4 w-4" />
                Import CSV
              </button>
              {selectedParts.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedParts.size})
                </button>
              )}
            </div>
            <span className="text-sm text-gray-500">
              {partsList.length} part{partsList.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Error Display */}
          {parts.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="h-4 w-4" />
              {parts.error.message}
            </div>
          )}

          {/* Parts Table */}
          {partsList.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No parts yet</h3>
          <p className="text-gray-500 mt-1">Add parts manually or import from CSV</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="text-primary hover:underline"
            >
              Add Part
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setShowImport(true)}
              className="text-primary hover:underline"
            >
              Import CSV
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedParts.size === partsList.length && partsList.length > 0}
                      onChange={selectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Part #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">L (mm)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">W (mm)</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">T (mm)</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Qty</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Grain</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Edges</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700" title="Manufacturing Priority (lower = made first)">Priority</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partsList.map((part) => (
                  <tr key={part.id} className={selectedParts.has(part.id) ? 'bg-primary/5' : 'hover:bg-gray-50'}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedParts.has(part.id)}
                        onChange={() => toggleSelect(part.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-600">{part.partNumber}</td>
                    <td className="px-3 py-2 font-medium text-gray-900">{part.name}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{part.length}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{part.width}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{part.thickness}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{part.quantity}</td>
                    <td className="px-3 py-2 text-gray-700">{part.materialName}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        part.grainDirection === 'length' ? 'bg-blue-100 text-blue-700' :
                        part.grainDirection === 'width' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {part.grainDirection === 'length' ? 'L' : part.grainDirection === 'width' ? 'W' : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className="text-xs text-gray-500">
                        {[
                          part.edgeBanding?.top && 'T',
                          part.edgeBanding?.bottom && 'B',
                          part.edgeBanding?.left && 'L',
                          part.edgeBanding?.right && 'R',
                        ].filter(Boolean).join('') || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <select
                        value={(part as any).manufacturingPriority || ''}
                        onChange={async (e) => {
                          const priority = e.target.value ? parseInt(e.target.value) : undefined;
                          try {
                            await parts.update(part.id, { manufacturingPriority: priority } as any);
                          } catch (err) {
                            console.error('Failed to update priority:', err);
                          }
                        }}
                        className="w-16 px-1 py-0.5 text-xs border border-gray-200 rounded text-center bg-white"
                        title="Manufacturing priority (1=first, 5=last)"
                      >
                        <option value="">-</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingPart(part)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {/* Select All Header */}
            <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={selectedParts.size === partsList.length && partsList.length > 0}
                  onChange={selectAll}
                  className="rounded border-gray-300"
                />
                Select All
              </label>
              <span className="text-xs text-gray-500">{partsList.length} parts</span>
            </div>
            {partsList.map((part) => (
              <div 
                key={part.id} 
                className={`p-3 ${selectedParts.has(part.id) ? 'bg-primary/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedParts.has(part.id)}
                    onChange={() => toggleSelect(part.id)}
                    className="rounded border-gray-300 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Part Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{part.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{part.partNumber}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingPart(part)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(part.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Dimensions & Info */}
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dimensions:</span>
                        <span className="font-medium">{part.length} × {part.width} × {part.thickness}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Qty:</span>
                        <span className="font-medium">{part.quantity}</span>
                      </div>
                      <div className="flex justify-between col-span-2">
                        <span className="text-gray-500">Material:</span>
                        <span className="font-medium truncate ml-2">{part.materialName}</span>
                      </div>
                    </div>
                    
                    {/* Tags Row */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        part.grainDirection === 'length' ? 'bg-blue-100 text-blue-700' :
                        part.grainDirection === 'width' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        Grain: {part.grainDirection === 'length' ? 'L' : part.grainDirection === 'width' ? 'W' : '-'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        Edge: {[
                          part.edgeBanding?.top && 'T',
                          part.edgeBanding?.bottom && 'B',
                          part.edgeBanding?.left && 'L',
                          part.edgeBanding?.right && 'R',
                        ].filter(Boolean).join('') || '-'}
                      </span>
                      {(part as any).manufacturingPriority && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          Priority: {(part as any).manufacturingPriority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
        </>
      )}

      {/* STANDARD PARTS SECTION */}
      {activeSection === 'standard' && (
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-4">
              <Wrench className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Standard Parts</h3>
                <p className="text-sm text-orange-700">Hinges, slides, screws, cams, dowels, and edging from Katana inventory</p>
              </div>
            </div>

            {standardParts.length > 0 && (
              <div className="bg-white rounded-lg border border-orange-200 overflow-hidden mb-4">
                {/* Desktop Table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead className="bg-orange-50 border-b border-orange-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-orange-800">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-orange-800">Name</th>
                      <th className="px-3 py-2 text-right font-medium text-orange-800">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-orange-800">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-medium text-orange-800">Total</th>
                      <th className="px-3 py-2 text-right font-medium text-orange-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100">
                    {standardParts.map((part) => (
                      <tr key={part.id} className="hover:bg-orange-50/50">
                        <td className="px-3 py-2">
                          <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded capitalize">{part.category}</span>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{part.name}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{part.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">UGX {formatCurrency(part.unitCost)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">UGX {formatCurrency(part.quantity * part.unitCost)}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => removeStandardPart(part.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-orange-100">
                  {standardParts.map((part) => (
                    <div key={part.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded capitalize">{part.category}</span>
                          </div>
                          <p className="font-medium text-gray-900 mt-1">{part.name}</p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                            <span>Qty: <strong>{part.quantity}</strong></span>
                            <span>@ UGX {formatCurrency(part.unitCost)}</span>
                          </div>
                          <p className="mt-1 font-semibold text-orange-700">
                            Total: UGX {formatCurrency(part.quantity * part.unitCost)}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeStandardPart(part.id)} 
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Katana Inventory Search */}
            <div className="bg-white p-3 rounded-lg border border-orange-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={katanaSearch}
                    onChange={(e) => setKatanaSearch(e.target.value)}
                    placeholder="Search Katana inventory by name or SKU..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={fetchKatanaInventory}
                  disabled={loadingKatana}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingKatana ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Katana Items List */}
              {katanaSearch && filteredKatanaInventory.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-orange-100 rounded-lg divide-y divide-orange-100">
                  {filteredKatanaInventory.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-orange-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.sku} • UGX {formatCurrency(item.unitCost)}/unit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                          id={`qty-${item.id}`}
                        />
                        <button
                          onClick={() => {
                            const qty = parseInt((document.getElementById(`qty-${item.id}`) as HTMLInputElement)?.value || '1');
                            addStandardPartFromKatana(item, qty);
                          }}
                          className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {katanaSearch && filteredKatanaInventory.length === 0 && !loadingKatana && (
                <p className="text-sm text-gray-500 text-center py-2">No items found in Katana inventory</p>
              )}

              {loadingKatana && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                  <span className="ml-2 text-sm text-gray-500">Loading Katana inventory...</span>
                </div>
              )}

              <p className="text-xs text-orange-600">💡 Costs are auto-fetched from Katana inventory. Only specify quantity.</p>
            </div>

            {standardPartsCostPerUnit > 0 && (
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-orange-300">
                <div>
                  <span className="text-sm text-orange-800">Standard Parts Total:</span>
                  {requiredQuantity > 1 && (
                    <span className="text-xs text-orange-600 ml-2">(×{requiredQuantity} units)</span>
                  )}
                </div>
                <div className="text-right">
                  {requiredQuantity > 1 && (
                    <p className="text-xs text-orange-600">Per unit: UGX {formatCurrency(standardPartsCostPerUnit)}</p>
                  )}
                  <span className="font-bold text-orange-900 text-lg">UGX {formatCurrency(standardPartsCost)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePartsToFirestore}
              disabled={saving}
              className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : saveSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Standard Parts'}
            </button>
          </div>
        </div>
      )}

      {/* SPECIAL PARTS SECTION */}
      {activeSection === 'special' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-purple-900">Special Parts</h3>
                  <p className="text-sm text-purple-700">Custom handles, locks, and accessories for luxury projects (requires approval)</p>
                </div>
              </div>
              <button
                onClick={() => setShowPartsPicker(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
              >
                <Library className="w-4 h-4" />
                Select from Library
              </button>
            </div>

            {specialParts.length > 0 && (
              <div className="bg-white rounded-lg border border-purple-200 overflow-hidden mb-4">
                {/* Desktop Table */}
                <table className="hidden sm:table w-full text-sm">
                  <thead className="bg-purple-50 border-b border-purple-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Supplier</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Qty</th>
                      <th className="px-3 py-2 text-center font-medium text-purple-800">Costing</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {specialParts.map((part) => (
                      <React.Fragment key={part.id}>
                      <tr className="hover:bg-purple-50/50">
                        <td className="px-3 py-2">
                          {editingSpecialPartId === part.id ? (
                            <select
                              value={part.category}
                              onChange={(e) => updateSpecialPart(part.id, { category: e.target.value as any })}
                              className="text-xs border border-purple-300 rounded px-1 py-0.5"
                            >
                              <option value="handle">Handle</option>
                              <option value="lock">Lock</option>
                              <option value="hinge">Hinge</option>
                              <option value="pull">Pull</option>
                              <option value="knob">Knob</option>
                              <option value="fitting">Fitting</option>
                              <option value="accessory">Accessory</option>
                              <option value="other">Other</option>
                            </select>
                          ) : (
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded capitalize">{part.category}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingSpecialPartId === part.id ? (
                            <input
                              type="text"
                              value={part.name}
                              onChange={(e) => updateSpecialPart(part.id, { name: e.target.value })}
                              className="w-full text-sm border border-purple-300 rounded px-2 py-0.5"
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{part.name}</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {editingSpecialPartId === part.id ? (
                            <input
                              type="text"
                              value={part.supplier || ''}
                              onChange={(e) => updateSpecialPart(part.id, { supplier: e.target.value })}
                              className="w-full text-sm border border-purple-300 rounded px-2 py-0.5"
                              placeholder="Supplier"
                            />
                          ) : (
                            <span className="text-gray-600">{part.supplier || '-'}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {editingSpecialPartId === part.id ? (
                            <input
                              type="number"
                              value={part.quantity}
                              onChange={(e) => updateSpecialPart(part.id, { quantity: parseInt(e.target.value) || 1 })}
                              min="1"
                              className="w-16 text-sm border border-purple-300 rounded px-2 py-0.5 text-right"
                            />
                          ) : (
                            <span className="text-gray-700">{part.quantity}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {part.costing ? (
                            <button
                              onClick={() => setEditingCostingId(editingCostingId === part.id ? null : part.id)}
                              className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded hover:bg-green-200"
                            >
                              {part.costing.targetCurrency} {formatCurrency(part.costing.totalLandedCost)}
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingCostingId(part.id)}
                              className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded hover:bg-amber-200 flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3" />
                              Add Costing
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {editingSpecialPartId === part.id ? (
                              <button 
                                onClick={() => setEditingSpecialPartId(null)} 
                                className="text-green-600 hover:text-green-800 text-xs font-medium"
                              >
                                Done
                              </button>
                            ) : (
                              <button 
                                onClick={() => setEditingSpecialPartId(part.id)} 
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => removeSpecialPart(part.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Inline Costing Editor */}
                      {editingCostingId === part.id && (
                        <tr className="bg-purple-50/50">
                          <td colSpan={6} className="px-3 py-3">
                            <div className="bg-white rounded-lg border border-purple-200 p-4 space-y-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                                <DollarSign className="w-4 h-4" />
                                Landed Cost Calculation
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Unit Cost</label>
                                  <input
                                    type="number"
                                    value={part.costing?.unitCost || ''}
                                    onChange={(e) => {
                                      const unitCost = parseFloat(e.target.value) || 0;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, transportCost: 0, logisticsCost: 0, customsCost: 0, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const transportCost = (costing as any).transportCost || 0;
                                      const logisticsCost = (costing as any).logisticsCost || 0;
                                      const customsCost = (costing as any).customsCost || 0;
                                      const totalPerUnit = unitCost + transportCost + logisticsCost + customsCost;
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * costing.exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, unitCost, totalSourceCost, landedUnitCost: totalPerUnit * costing.exchangeRate, totalLandedCost, pricedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any, ...(user?.email && { pricedBy: user.email }) }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Currency</label>
                                  <select
                                    value={part.costing?.currency || 'USD'}
                                    onChange={(e) => {
                                      const currency = e.target.value;
                                      const exchangeRate = EXCHANGE_RATES[currency] || 1;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, transportCost: 0, logisticsCost: 0, customsCost: 0, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const totalPerUnit = (costing.unitCost || 0) + ((costing as any).transportCost || 0) + ((costing as any).logisticsCost || 0) + ((costing as any).customsCost || 0);
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, currency, exchangeRate, landedUnitCost: totalPerUnit * exchangeRate, totalLandedCost }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                  >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="AED">AED</option>
                                    <option value="CNY">CNY</option>
                                    <option value="KES">KES</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Exchange Rate</label>
                                  <input
                                    type="number"
                                    value={part.costing?.exchangeRate || EXCHANGE_RATES['USD']}
                                    onChange={(e) => {
                                      const exchangeRate = parseFloat(e.target.value) || 1;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, transportCost: 0, logisticsCost: 0, customsCost: 0, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const totalPerUnit = (costing.unitCost || 0) + ((costing as any).transportCost || 0) + ((costing as any).logisticsCost || 0) + ((costing as any).customsCost || 0);
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, exchangeRate, landedUnitCost: totalPerUnit * exchangeRate, totalLandedCost }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">To {TARGET_CURRENCY}</label>
                                  <div className="px-2 py-1.5 text-sm bg-gray-100 rounded text-gray-700">
                                    1 {part.costing?.currency || 'USD'} = {part.costing?.exchangeRate || EXCHANGE_RATES['USD']} UGX
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Transport/Shipping (per unit)</label>
                                  <input
                                    type="number"
                                    value={part.costing?.transportCost || ''}
                                    onChange={(e) => {
                                      const transportCost = parseFloat(e.target.value) || 0;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const totalPerUnit = (costing.unitCost || 0) + transportCost + (costing.logisticsCost || 0) + (costing.customsCost || 0);
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * costing.exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, transportCost, totalSourceCost, landedUnitCost: totalPerUnit * costing.exchangeRate, totalLandedCost }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Logistics/Handling (per unit)</label>
                                  <input
                                    type="number"
                                    value={part.costing?.logisticsCost || ''}
                                    onChange={(e) => {
                                      const logisticsCost = parseFloat(e.target.value) || 0;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const totalPerUnit = (costing.unitCost || 0) + (costing.transportCost || 0) + logisticsCost + (costing.customsCost || 0);
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * costing.exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, logisticsCost, totalSourceCost, landedUnitCost: totalPerUnit * costing.exchangeRate, totalLandedCost }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Customs/Duties (per unit)</label>
                                  <input
                                    type="number"
                                    value={part.costing?.customsCost || ''}
                                    onChange={(e) => {
                                      const customsCost = parseFloat(e.target.value) || 0;
                                      const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                      const totalPerUnit = (costing.unitCost || 0) + (costing.transportCost || 0) + (costing.logisticsCost || 0) + customsCost;
                                      const totalSourceCost = totalPerUnit * part.quantity;
                                      const totalLandedCost = totalSourceCost * costing.exchangeRate;
                                      updateSpecialPart(part.id, {
                                        costing: { ...costing, customsCost, totalSourceCost, landedUnitCost: totalPerUnit * costing.exchangeRate, totalLandedCost }
                                      });
                                    }}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-3 border-t border-purple-200">
                                <div className="text-sm text-gray-600">
                                  <span>Qty: {part.quantity} × </span>
                                  <span className="font-medium">{part.costing?.currency || 'USD'} {((part.costing?.unitCost || 0) + (part.costing?.transportCost || 0) + (part.costing?.logisticsCost || 0) + (part.costing?.customsCost || 0)).toFixed(2)}</span>
                                  <span> = {part.costing?.currency || 'USD'} {part.costing?.totalSourceCost?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">Total Landed Cost</p>
                                  <p className="text-lg font-bold text-purple-900">UGX {formatCurrency(part.costing?.totalLandedCost || 0)}</p>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => setEditingCostingId(null)}
                                  className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                
                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-purple-100">
                  {specialParts.map((part) => (
                    <div key={part.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded capitalize">{part.category}</span>
                            {part.referenceImageUrl && (
                              <img src={part.referenceImageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                            )}
                          </div>
                          <p className="font-medium text-gray-900 mt-1">{part.name}</p>
                          {part.supplier && (
                            <p className="text-sm text-gray-600">Supplier: {part.supplier}</p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className="text-gray-600">Qty: <strong>{part.quantity}</strong></span>
                          </div>
                          {/* Costing Info */}
                          <div className="mt-2">
                            {part.costing ? (
                              <button
                                onClick={() => setEditingCostingId(editingCostingId === part.id ? null : part.id)}
                                className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                Total: UGX {formatCurrency(part.costing.totalLandedCost)}
                              </button>
                            ) : (
                              <button
                                onClick={() => setEditingCostingId(part.id)}
                                className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200 flex items-center gap-1"
                              >
                                <DollarSign className="w-3 h-3" />
                                Add Costing
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button 
                            onClick={() => setEditingSpecialPartId(editingSpecialPartId === part.id ? null : part.id)} 
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeSpecialPart(part.id)} 
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Mobile Costing Editor - Expandable */}
                      {editingCostingId === part.id && (
                        <div className="mt-3 bg-purple-50 rounded-lg p-3 space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                            <DollarSign className="w-4 h-4" />
                            Landed Cost
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Unit Cost</label>
                              <input
                                type="number"
                                value={part.costing?.unitCost || ''}
                                onChange={(e) => {
                                  const unitCost = parseFloat(e.target.value) || 0;
                                  const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate: EXCHANGE_RATES['USD'], targetCurrency: TARGET_CURRENCY, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                  const totalSourceCost = unitCost * part.quantity;
                                  const totalLandedCost = totalSourceCost * costing.exchangeRate;
                                  updateSpecialPart(part.id, {
                                    costing: { ...costing, unitCost, totalSourceCost, landedUnitCost: unitCost * costing.exchangeRate, totalLandedCost }
                                  });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Currency</label>
                              <select
                                value={part.costing?.currency || 'USD'}
                                onChange={(e) => {
                                  const currency = e.target.value;
                                  const exchangeRate = EXCHANGE_RATES[currency] || 1;
                                  const costing = part.costing || { unitCost: 0, currency: 'USD', exchangeRate, targetCurrency: TARGET_CURRENCY, totalSourceCost: 0, landedUnitCost: 0, totalLandedCost: 0 };
                                  const totalSourceCost = (costing.unitCost || 0) * part.quantity;
                                  const totalLandedCost = totalSourceCost * exchangeRate;
                                  updateSpecialPart(part.id, {
                                    costing: { ...costing, currency, exchangeRate, landedUnitCost: (costing.unitCost || 0) * exchangeRate, totalLandedCost }
                                  });
                                }}
                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="AED">AED</option>
                                <option value="CNY">CNY</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                            <p className="text-sm text-gray-600">
                              {part.quantity} × {part.costing?.currency || 'USD'} {(part.costing?.unitCost || 0).toFixed(2)}
                            </p>
                            <div className="text-right">
                              <p className="font-bold text-purple-900">UGX {formatCurrency(part.costing?.totalLandedCost || 0)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setEditingCostingId(null)}
                            className="w-full py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            Done
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Special Part Form - Identification only, costing in Costing Tab */}
            <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-lg border border-purple-200">
              <select
                value={newSpecialPart.category}
                onChange={(e) => setNewSpecialPart({ ...newSpecialPart, category: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                <option value="handle">Handle</option>
                <option value="lock">Lock</option>
                <option value="hinge">Hinge</option>
                <option value="accessory">Accessory</option>
                <option value="lighting">Lighting</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                value={newSpecialPart.name}
                onChange={(e) => setNewSpecialPart({ ...newSpecialPart, name: e.target.value })}
                placeholder="Part name"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={newSpecialPart.supplier}
                onChange={(e) => setNewSpecialPart({ ...newSpecialPart, supplier: e.target.value })}
                placeholder="Supplier"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={newSpecialPart.quantity}
                onChange={(e) => setNewSpecialPart({ ...newSpecialPart, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="Qty"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button
                onClick={addSpecialPart}
                disabled={!newSpecialPart.name}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <p className="text-xs text-purple-600 mt-1">💡 Expand costing details inline or use the Costing Summary tab</p>

            {specialPartsCostPerUnit > 0 && (
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-purple-300">
                <div>
                  <span className="text-sm text-purple-800">Special Parts Total:</span>
                  {requiredQuantity > 1 && (
                    <span className="text-xs text-purple-600 ml-2">(×{requiredQuantity} units)</span>
                  )}
                </div>
                <div className="text-right">
                  {requiredQuantity > 1 && (
                    <p className="text-xs text-purple-600">Per unit: UGX {formatCurrency(specialPartsCostPerUnit)}</p>
                  )}
                  <span className="font-bold text-purple-900 text-lg">UGX {formatCurrency(specialPartsCost)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={savePartsToFirestore}
              disabled={saving}
              className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : saveSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Special Parts'}
            </button>
          </div>
        </div>
      )}

      {/* COSTING SUMMARY SECTION */}
      {activeSection === 'costing' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Costing Summary</h3>
                  <p className="text-sm text-green-700">Auto-calculate costs from sheet parts, standard parts, and special parts</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (partsList.length === 0) {
                    alert('No sheet parts found. Add parts in the Sheet Parts tab first.');
                    return;
                  }
                  setCalculating(true);
                  try {
                    const { calculateSheetMaterialsFromParts, calculateLaborFromParts } = await import('../../services/estimateService');
                    const { materials, totalCost: matCost } = await calculateSheetMaterialsFromParts(partsList);
                    setSheetMaterials(materials);
                    setSheetMaterialsCost(matCost);
                    const labor = calculateLaborFromParts(partsList);
                    setLaborHours(labor.hours);
                  } catch (error) {
                    console.error('Auto-calculation failed:', error);
                  } finally {
                    setCalculating(false);
                  }
                }}
                disabled={calculating || partsList.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {calculating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {calculating ? 'Calculating...' : 'Auto Calculate'}
              </button>
            </div>

            {/* Cost Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-xs text-gray-500 uppercase">Sheet Materials</p>
                <p className="text-lg font-bold text-gray-900">UGX {formatCurrency(sheetMaterialsCost)}</p>
                <p className="text-xs text-gray-500">{sheetMaterials.length} material types</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-xs text-orange-600 uppercase">Standard Parts</p>
                <p className="text-lg font-bold text-orange-700">UGX {formatCurrency(standardPartsCostPerUnit)}</p>
                <p className="text-xs text-gray-500">{standardParts.length} items</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <p className="text-xs text-purple-600 uppercase">Special Parts</p>
                <p className="text-lg font-bold text-purple-700">UGX {formatCurrency(specialPartsCostPerUnit)}</p>
                <p className="text-xs text-gray-500">{specialParts.length} items</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-blue-600 uppercase">Labor</p>
                <p className="text-lg font-bold text-blue-700">UGX {formatCurrency(laborHours * laborRate)}</p>
                <p className="text-xs text-gray-500">{laborHours} hrs @ {formatCurrency(laborRate)}/hr</p>
              </div>
            </div>

            {/* Labor Rate Adjustment */}
            <div className="bg-white rounded-lg p-3 border border-green-200 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Labor Hours</label>
                  <input
                    type="number"
                    value={laborHours}
                    onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    step="0.5"
                    min="0"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Labor Rate (UGX/hr)</label>
                  <input
                    type="number"
                    value={laborRate}
                    onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    step="1000"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Sheet Materials Breakdown */}
            {sheetMaterials.length > 0 && (
              <div className="bg-white rounded-lg border border-green-200 overflow-hidden mb-4">
                <div className="px-3 py-2 bg-green-50 border-b border-green-200">
                  <h4 className="text-sm font-medium text-green-800">Sheet Materials Breakdown</h4>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Sheets</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sheetMaterials.map((mat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900">{mat.materialName} ({mat.thickness}mm)</td>
                        <td className="px-3 py-2 text-right text-gray-700">{mat.sheetsRequired}</td>
                        <td className="px-3 py-2 text-right text-gray-700">UGX {formatCurrency(mat.unitCost)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">UGX {formatCurrency(mat.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Total Cost Summary */}
            <div className="bg-green-100 rounded-lg p-4 border border-green-300">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-green-800 font-medium">Total Manufacturing Cost (Per Unit)</p>
                  <p className="text-xs text-green-600">Sheet materials + Standard parts + Special parts + Labor</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-900">
                    UGX {formatCurrency(sheetMaterialsCost + standardPartsCostPerUnit + specialPartsCostPerUnit + (laborHours * laborRate))}
                  </p>
                  {requiredQuantity > 1 && (
                    <p className="text-sm text-green-700">
                      × {requiredQuantity} units = UGX {formatCurrency((sheetMaterialsCost + standardPartsCostPerUnit + specialPartsCostPerUnit + (laborHours * laborRate)) * requiredQuantity)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Save Costing Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={async () => {
                  setSaving(true);
                  setSaveSuccess(false);
                  try {
                    const totalMaterialCost = sheetMaterialsCost + standardPartsCostPerUnit + specialPartsCostPerUnit;
                    const laborCost = laborHours * laborRate;
                    const totalCost = totalMaterialCost + laborCost;
                    const quantity = 1;
                    const costPerUnit = totalCost;
                    
                    const manufacturingData: Record<string, any> = {
                      ...manufacturing,
                      sheetMaterials: sheetMaterials,
                      sheetMaterialsCost: sheetMaterialsCost,
                      standardParts: standardParts,
                      standardPartsCost: standardPartsCostPerUnit,
                      specialParts: specialParts,
                      specialPartsCost: specialPartsCostPerUnit,
                      materialCost: totalMaterialCost,
                      laborHours: laborHours,
                      laborRate: laborRate,
                      laborCost: laborCost,
                      totalCost: totalCost,
                      costPerUnit: costPerUnit,
                      quantity: quantity,
                      autoCalculated: sheetMaterials.length > 0,
                      estimatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
                      estimatedBy: user?.email || 'system',
                      lastAutoCalcAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
                    };
                    
                    await updateDesignItem(projectId, item.id, {
                      manufacturing: cleanUndefinedValues(manufacturingData),
                    } as any, user?.email || 'system');
                    
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  } catch (error) {
                    console.error('Failed to save costing:', error);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                  saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Costing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Part Form */}
      {(showAddForm || editingPart) && (
        <PartForm
          part={editingPart || undefined}
          onSave={async (data) => {
            if (editingPart) {
              await parts.update(editingPart.id, data);
            } else {
              await parts.add(data as any);
            }
            setShowAddForm(false);
            setEditingPart(null);
          }}
          onClose={() => {
            setShowAddForm(false);
            setEditingPart(null);
          }}
          loading={parts.loading}
        />
      )}

      {/* Import Dialog */}
      {showImport && (
        <PartsImportDialog
          onImport={async (importedParts, mode) => {
            if (mode === 'replace') {
              await parts.replaceAll(importedParts);
            } else {
              await parts.bulkAdd(importedParts);
            }
            setShowImport(false);
          }}
          onClose={() => setShowImport(false)}
          loading={parts.loading}
        />
      )}

      {/* Project Parts Picker */}
      {showPartsPicker && (
        <ProjectPartsPicker
          projectId={projectId}
          onSelect={addPartFromLibrary}
          onClose={() => setShowPartsPicker(false)}
          excludePartIds={specialParts.filter(p => p.projectPartId).map(p => p.projectPartId!)}
        />
      )}
    </div>
  );
}

export default PartsTab;
