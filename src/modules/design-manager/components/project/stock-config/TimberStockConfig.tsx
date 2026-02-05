/**
 * Timber Stock Configuration Component
 * For configuring dimensional lumber stock (cross-sections and lengths)
 */

import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import type { TimberStockDefinition } from '@/shared/types';
import type { InventoryListItem } from '@/modules/inventory/types';
import { TIMBER_SECTION_PRESETS, TIMBER_LENGTH_PRESETS } from '../../../types/materials';

// ============================================
// Types
// ============================================

interface TimberStockConfigProps {
  stock: TimberStockDefinition[];
  onChange: (stock: TimberStockDefinition[]) => void;
  inventoryItem: InventoryListItem | null;
  materialName: string;
}

// ============================================
// Helper Functions
// ============================================

function generateId(): string {
  return `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Component
// ============================================

export function TimberStockConfig({
  stock,
  onChange,
  inventoryItem,
  materialName,
}: TimberStockConfigProps) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customThickness, setCustomThickness] = useState<number>(38);
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [customLengths, setCustomLengths] = useState<number[]>([3000, 4800]);
  const [customCostPerMeter, setCustomCostPerMeter] = useState<number>(0);
  const [customIsDressed, setCustomIsDressed] = useState(true);
  const [customCanBeRipped, setCustomCanBeRipped] = useState(true);
  const [customSpecies, setCustomSpecies] = useState('');
  const [customGrade, setCustomGrade] = useState('');

  // Add stock from preset cross-section
  const handleAddPreset = (preset: { thickness: number; width: number; label: string }) => {
    const newStock: TimberStockDefinition = {
      id: generateId(),
      materialId: inventoryItem?.id || '',
      materialName: materialName,
      thickness: preset.thickness,
      width: preset.width,
      availableLengths: [2400, 3000, 4800, 6000], // Default lengths
      costPerLinearMeter: inventoryItem?.costPerUnit || 0,
      isDressed: true,
      canBeRipped: true,
    };
    onChange([...stock, newStock]);
  };

  // Toggle length selection
  const toggleLength = (length: number) => {
    if (customLengths.includes(length)) {
      setCustomLengths(customLengths.filter(l => l !== length));
    } else {
      setCustomLengths([...customLengths, length].sort((a, b) => a - b));
    }
  };

  // Add custom stock
  const handleAddCustom = () => {
    if (customLengths.length === 0) {
      alert('Please select at least one available length');
      return;
    }

    const newStock: TimberStockDefinition = {
      id: generateId(),
      materialId: inventoryItem?.id || '',
      materialName: materialName,
      thickness: customThickness,
      width: customWidth,
      availableLengths: customLengths,
      costPerLinearMeter: customCostPerMeter,
      isDressed: customIsDressed,
      canBeRipped: customCanBeRipped,
      species: customSpecies || undefined,
      grade: customGrade || undefined,
    };
    onChange([...stock, newStock]);
    setShowCustomForm(false);
    // Reset form
    setCustomThickness(38);
    setCustomWidth(100);
    setCustomLengths([3000, 4800]);
    setCustomCostPerMeter(0);
    setCustomIsDressed(true);
    setCustomCanBeRipped(true);
    setCustomSpecies('');
    setCustomGrade('');
  };

  // Update stock item
  const handleUpdateStock = (id: string, updates: Partial<TimberStockDefinition>) => {
    onChange(stock.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // Toggle available length for a stock item
  const handleToggleStockLength = (stockId: string, length: number) => {
    const item = stock.find(s => s.id === stockId);
    if (!item) return;

    const newLengths = item.availableLengths.includes(length)
      ? item.availableLengths.filter(l => l !== length)
      : [...item.availableLengths, length].sort((a, b) => a - b);

    if (newLengths.length === 0) {
      alert('Must have at least one available length');
      return;
    }

    handleUpdateStock(stockId, { availableLengths: newLengths });
  };

  // Remove stock item
  const handleRemoveStock = (id: string) => {
    onChange(stock.filter(s => s.id !== id));
  };

  // Check if preset is already added
  const isPresetAdded = (preset: { thickness: number; width: number }) => {
    return stock.some(s => s.thickness === preset.thickness && s.width === preset.width);
  };

  return (
    <div className="space-y-4">
      {/* Preset Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add from Common Cross-Sections
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMBER_SECTION_PRESETS.map((preset) => (
            <button
              key={`${preset.thickness}x${preset.width}`}
              onClick={() => handleAddPreset(preset)}
              disabled={isPresetAdded(preset)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                isPresetAdded(preset)
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-green-50 hover:border-green-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustomForm(true)}
            className="px-3 py-1.5 text-sm rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Custom Section
          </button>
        </div>
      </div>

      {/* Custom Form */}
      {showCustomForm && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-700">Add Custom Timber Stock</h4>

          {/* Cross-section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Thickness (mm)</label>
              <input
                type="number"
                value={customThickness}
                onChange={(e) => setCustomThickness(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="10"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Width (mm)</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                min="10"
              />
            </div>
          </div>

          {/* Available Lengths */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">Available Lengths</label>
            <div className="flex flex-wrap gap-2">
              {TIMBER_LENGTH_PRESETS.map((preset) => (
                <button
                  key={preset.length}
                  onClick={() => toggleLength(preset.length)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                    customLengths.includes(preset.length)
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {customLengths.includes(preset.length) && <Check className="w-3 h-3" />}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Species & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Species (optional)</label>
              <input
                type="text"
                value={customSpecies}
                onChange={(e) => setCustomSpecies(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., Meranti, Pine, Oak"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Grade (optional)</label>
              <input
                type="text"
                value={customGrade}
                onChange={(e) => setCustomGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="e.g., Select, Premium"
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Cost per Linear Meter</label>
            <input
              type="number"
              value={customCostPerMeter}
              onChange={(e) => setCustomCostPerMeter(Number(e.target.value))}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              min="0"
            />
          </div>

          {/* Options */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customIsDressed}
                onChange={(e) => setCustomIsDressed(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Dressed (PAR)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={customCanBeRipped}
                onChange={(e) => setCustomCanBeRipped(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Can be ripped</span>
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCustomForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustom}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Timber Stock
            </button>
          </div>
        </div>
      )}

      {/* Stock List */}
      {stock.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Configured Timber Stock
          </label>
          <div className="space-y-3">
            {stock.map((item) => (
              <div key={item.id} className="p-3 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.thickness} × {item.width}mm
                      {item.species && <span className="text-gray-500 ml-2">({item.species})</span>}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {item.isDressed ? 'PAR' : 'Rough sawn'}
                      {item.canBeRipped && ' • Can be ripped'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveStock(item.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Available Lengths */}
                <div className="mt-3">
                  <label className="text-xs text-gray-500 mb-1 block">Available Lengths:</label>
                  <div className="flex flex-wrap gap-1">
                    {TIMBER_LENGTH_PRESETS.map((preset) => (
                      <button
                        key={preset.length}
                        onClick={() => handleToggleStockLength(item.id, preset.length)}
                        className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                          item.availableLengths.includes(preset.length)
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-50 text-gray-400 border-gray-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost */}
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-xs text-gray-500">Cost/m:</label>
                  <input
                    type="number"
                    value={item.costPerLinearMeter || 0}
                    onChange={(e) => handleUpdateStock(item.id, { costPerLinearMeter: Number(e.target.value) })}
                    className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stock.length === 0 && !showCustomForm && (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          <p className="text-sm">No timber stock configured</p>
          <p className="text-xs mt-1">Select a cross-section above or add a custom one</p>
        </div>
      )}
    </div>
  );
}

export default TimberStockConfig;
