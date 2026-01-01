/**
 * PartsTab Component
 * Display and manage parts within a design item
 * Includes: Sheet parts, Standard parts (from Katana), and Special parts (approved for luxury)
 */

import { useState } from 'react';
import { Plus, Upload, Trash2, Edit2, Package, AlertCircle, Wrench, Sparkles, Save, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useParts } from '../../hooks/useParts';
import type { DesignItem, PartEntry, StandardPartEntry, SpecialPartEntry } from '../../types';
import { PartForm } from './PartForm';
import { PartsImportDialog } from './PartsImportDialog';
import { updateDesignItem } from '../../services/firestore';

interface PartsTabProps {
  item: DesignItem;
  projectId: string;
}

type PartsSection = 'sheet' | 'standard' | 'special';

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
  const [newStandardPart, setNewStandardPart] = useState({ name: '', category: 'hinge', quantity: 1, unitCost: 0 });
  
  // Special parts state (for luxury projects)
  const [specialParts, setSpecialParts] = useState<SpecialPartEntry[]>(manufacturing.specialParts || []);
  const [newSpecialPart, setNewSpecialPart] = useState({ name: '', category: 'handle', quantity: 1, unitCost: 0, supplier: '' });
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const partsList: PartEntry[] = (item as any).parts || [];
  const summary = (item as any).partsSummary;
  
  // Calculate totals
  const standardPartsCost = standardParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
  const specialPartsCost = specialParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);

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

  // Add standard part
  const addStandardPart = () => {
    if (!newStandardPart.name || newStandardPart.unitCost <= 0) return;
    setStandardParts([...standardParts, {
      id: `sp-${Date.now()}`,
      name: newStandardPart.name,
      category: newStandardPart.category as StandardPartEntry['category'],
      quantity: newStandardPart.quantity,
      unitCost: newStandardPart.unitCost,
      totalCost: newStandardPart.quantity * newStandardPart.unitCost,
    }]);
    setNewStandardPart({ name: '', category: 'hinge', quantity: 1, unitCost: 0 });
  };

  // Remove standard part
  const removeStandardPart = (id: string) => {
    setStandardParts(standardParts.filter(p => p.id !== id));
  };

  // Add special part
  const addSpecialPart = () => {
    if (!newSpecialPart.name || newSpecialPart.unitCost <= 0) return;
    setSpecialParts([...specialParts, {
      id: `xp-${Date.now()}`,
      name: newSpecialPart.name,
      category: newSpecialPart.category as SpecialPartEntry['category'],
      quantity: newSpecialPart.quantity,
      unitCost: newSpecialPart.unitCost,
      totalCost: newSpecialPart.quantity * newSpecialPart.unitCost,
      supplier: newSpecialPart.supplier,
      approvedBy: user?.email,
      approvedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    }]);
    setNewSpecialPart({ name: '', category: 'handle', quantity: 1, unitCost: 0, supplier: '' });
  };

  // Remove special part
  const removeSpecialPart = (id: string) => {
    setSpecialParts(specialParts.filter(p => p.id !== id));
  };

  // Save standard and special parts to Firestore
  const savePartsToFirestore = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updatedManufacturing = {
        ...manufacturing,
        standardParts: standardParts,
        standardPartsCost: standardPartsCost,
        specialParts: specialParts,
        specialPartsCost: specialPartsCost,
      };
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
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Total Parts</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalParts}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Materials</p>
            <p className="text-xl font-bold text-gray-900">{summary.uniqueMaterials}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Total Area</p>
            <p className="text-xl font-bold text-gray-900">{summary.totalArea?.toFixed(2) || 0} m²</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Status</p>
            <p className={`text-xl font-bold ${summary.isComplete ? 'text-green-600' : 'text-amber-600'}`}>
              {summary.isComplete ? 'Complete' : 'Incomplete'}
            </p>
          </div>
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
          <div className="overflow-x-auto">
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
                <table className="w-full text-sm">
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
              </div>
            )}

            {/* Add Standard Part Form */}
            <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-lg border border-orange-200">
              <select
                value={newStandardPart.category}
                onChange={(e) => setNewStandardPart({ ...newStandardPart, category: e.target.value })}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                <option value="hinge">Hinge</option>
                <option value="slide">Slide</option>
                <option value="screw">Screw</option>
                <option value="cam">Cam</option>
                <option value="dowel">Dowel</option>
                <option value="edging">Edging</option>
                <option value="handle">Handle</option>
                <option value="knob">Knob</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                value={newStandardPart.name}
                onChange={(e) => setNewStandardPart({ ...newStandardPart, name: e.target.value })}
                placeholder="Part name"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={newStandardPart.quantity}
                onChange={(e) => setNewStandardPart({ ...newStandardPart, quantity: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="Qty"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <input
                type="number"
                value={newStandardPart.unitCost}
                onChange={(e) => setNewStandardPart({ ...newStandardPart, unitCost: parseFloat(e.target.value) || 0 })}
                placeholder="Unit cost"
                min="0"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button
                onClick={addStandardPart}
                disabled={!newStandardPart.name || newStandardPart.unitCost <= 0}
                className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {standardPartsCost > 0 && (
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-orange-300">
                <span className="text-sm text-orange-800">Standard Parts Total:</span>
                <span className="font-bold text-orange-900 text-lg">UGX {formatCurrency(standardPartsCost)}</span>
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
            <div className="flex items-start gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900">Special Parts</h3>
                <p className="text-sm text-purple-700">Custom handles, locks, and accessories for luxury projects (requires approval)</p>
              </div>
            </div>

            {specialParts.length > 0 && (
              <div className="bg-white rounded-lg border border-purple-200 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-purple-50 border-b border-purple-200">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-purple-800">Supplier</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Unit Cost</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Total</th>
                      <th className="px-3 py-2 text-right font-medium text-purple-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100">
                    {specialParts.map((part) => (
                      <tr key={part.id} className="hover:bg-purple-50/50">
                        <td className="px-3 py-2">
                          <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded capitalize">{part.category}</span>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{part.name}</td>
                        <td className="px-3 py-2 text-gray-600">{part.supplier || '-'}</td>
                        <td className="px-3 py-2 text-right text-gray-700">{part.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-700">UGX {formatCurrency(part.unitCost)}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">UGX {formatCurrency(part.quantity * part.unitCost)}</td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => removeSpecialPart(part.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Special Part Form */}
            <div className="grid grid-cols-6 gap-2 bg-white p-3 rounded-lg border border-purple-200">
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
              <input
                type="number"
                value={newSpecialPart.unitCost}
                onChange={(e) => setNewSpecialPart({ ...newSpecialPart, unitCost: parseFloat(e.target.value) || 0 })}
                placeholder="Unit cost"
                min="0"
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              />
              <button
                onClick={addSpecialPart}
                disabled={!newSpecialPart.name || newSpecialPart.unitCost <= 0}
                className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {specialPartsCost > 0 && (
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-purple-300">
                <span className="text-sm text-purple-800">Special Parts Total:</span>
                <span className="font-bold text-purple-900 text-lg">UGX {formatCurrency(specialPartsCost)}</span>
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
    </div>
  );
}

export default PartsTab;
