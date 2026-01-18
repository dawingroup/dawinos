/**
 * Formula Application Panel
 * Modal for applying formulas to BOQ items with AI suggestions and wastage controls
 */

import React, { useState } from 'react';
import { X, Beaker, Search, Sparkles, TrendingUp, Check } from 'lucide-react';
import type { BOQItem } from '../../types';

interface FormulaApplicationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: BOQItem[];
  onApply: (formulaId: string, formulaCode: string, wastageOverride?: number) => Promise<void>;
}

// Placeholder formula interface - replace with actual formula service
interface Formula {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  outputUnit: string;
  components: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    wastagePercent: number;
  }>;
  usageCount: number;
}

export function FormulaApplicationPanel({
  isOpen,
  onClose,
  selectedItems,
  onApply,
}: FormulaApplicationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null);
  const [wastageOverride, setWastageOverride] = useState<number | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Placeholder formulas - replace with actual formula service
  const mockFormulas: Formula[] = [
    {
      id: '1',
      code: 'C25',
      name: 'Concrete C25/30',
      description: 'Concrete mix with 25/30 MPa strength',
      category: 'Concrete',
      outputUnit: 'm³',
      components: [
        { materialName: 'Cement (50kg bags)', quantity: 7, unit: 'bags', wastagePercent: 5 },
        { materialName: 'Sand', quantity: 0.4, unit: 'm³', wastagePercent: 10 },
        { materialName: 'Aggregate (20mm)', quantity: 0.8, unit: 'm³', wastagePercent: 10 },
      ],
      usageCount: 145,
    },
    {
      id: '2',
      code: 'BRICK_230',
      name: 'Brick Wall 230mm',
      description: '230mm thick brick wall with mortar',
      category: 'Masonry',
      outputUnit: 'm²',
      components: [
        { materialName: 'Bricks (9")', quantity: 120, unit: 'No.', wastagePercent: 5 },
        { materialName: 'Cement (50kg bags)', quantity: 1.5, unit: 'bags', wastagePercent: 5 },
        { materialName: 'Sand', quantity: 0.05, unit: 'm³', wastagePercent: 10 },
      ],
      usageCount: 89,
    },
  ];

  const filteredFormulas = mockFormulas.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApply = async () => {
    if (!selectedFormula) return;

    setIsApplying(true);
    try {
      await onApply(selectedFormula.id, selectedFormula.code, wastageOverride || undefined);
      onClose();
      setSelectedFormula(null);
      setWastageOverride(null);
    } catch (error) {
      console.error('Error applying formula:', error);
      alert('Failed to apply formula. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Beaker className="w-6 h-6 text-purple-600" />
              Apply Formula
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Context Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-900 mb-2">Selected BOQ Items:</h3>
            <div className="space-y-1">
              {selectedItems.slice(0, 5).map((item) => (
                <div key={item.id} className="text-sm text-purple-700">
                  {item.hierarchyPath || item.itemNumber} - {item.description}
                </div>
              ))}
              {selectedItems.length > 5 && (
                <div className="text-sm text-purple-600">
                  ... and {selectedItems.length - 5} more
                </div>
              )}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Formulas
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* AI Suggestions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              AI Suggested Formulas
            </h3>
            <p className="text-sm text-gray-500 mb-4">Based on BOQ item descriptions</p>
            <div className="grid grid-cols-1 gap-2">
              {filteredFormulas.slice(0, 3).map((formula) => (
                <button
                  key={formula.id}
                  onClick={() => setSelectedFormula(formula)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    selectedFormula?.id === formula.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{formula.code}</span>
                        <span className="text-gray-600">-</span>
                        <span className="text-gray-700">{formula.name}</span>
                        {selectedFormula?.id === formula.id && (
                          <Check className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{formula.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">{formula.category}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Used {formula.usageCount} times
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Formula Preview */}
          {selectedFormula && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Formula Components</h3>
              <div className="space-y-2">
                {selectedFormula.components.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{comp.materialName}</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Wastage: {comp.wastagePercent}%
                      </p>
                    </div>
                    <div className="text-sm text-gray-700">
                      {comp.quantity} {comp.unit} per {selectedFormula.outputUnit}
                    </div>
                  </div>
                ))}
              </div>

              {/* Wastage Override */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Override Wastage (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={wastageOverride || ''}
                    onChange={(e) => setWastageOverride(e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Use formula defaults"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">%</span>
                  {wastageOverride && (
                    <button
                      onClick={() => setWastageOverride(null)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Reset to defaults
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isApplying}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedFormula || isApplying}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Beaker className="w-4 h-4" />
                  Apply Formula
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
