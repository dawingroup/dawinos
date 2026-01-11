/**
 * Formula Database Page
 * Standard calculation formulas for construction materials
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calculator, 
  Filter,
  Copy,
  CheckCircle2,
  Loader2,
  X,
  Info
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { getFormulas, incrementFormulaUsage } from '../services/formulaService';
import { MaterialCategory } from '../types';
import type { StandardFormula } from '../types';

const CATEGORIES: { value: MaterialCategory | ''; label: string }[] = [
  { value: '', label: 'All Categories' },
  { value: MaterialCategory.CONCRETE, label: 'Concrete' },
  { value: MaterialCategory.STEEL, label: 'Steel' },
  { value: MaterialCategory.MASONRY, label: 'Masonry' },
  { value: MaterialCategory.TIMBER, label: 'Timber' },
  { value: MaterialCategory.ROOFING, label: 'Roofing' },
  { value: MaterialCategory.PLUMBING, label: 'Plumbing' },
  { value: MaterialCategory.ELECTRICAL, label: 'Electrical' },
  { value: MaterialCategory.FINISHES, label: 'Finishes' },
];

const FormulaDatabase: React.FC = () => {
  const [formulas, setFormulas] = useState<StandardFormula[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | ''>('');
  const [selectedFormula, setSelectedFormula] = useState<StandardFormula | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load formulas
  useEffect(() => {
    loadFormulas();
  }, [selectedCategory]);

  const loadFormulas = async () => {
    setIsLoading(true);
    try {
      const data = await getFormulas(selectedCategory || undefined);
      setFormulas(data);
    } catch (err) {
      console.error('Failed to load formulas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by search
  const filteredFormulas = formulas.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build a formula string from components
  const buildFormulaString = (formula: StandardFormula): string => {
    if (!formula.components || formula.components.length === 0) return formula.name;
    return formula.components.map(c => `${c.quantity} ${c.materialName}`).join(' + ');
  };

  const handleCopyFormula = async (formula: StandardFormula) => {
    try {
      await navigator.clipboard.writeText(buildFormulaString(formula));
      setCopiedId(formula.id);
      await incrementFormulaUsage(formula.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getCategoryLabel = (cat: MaterialCategory) => {
    return CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  return (
    <div>
      <PageHeader
        title="Formula Database"
        description="Standard calculation formulas for construction materials"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Formula Database' },
        ]}
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search formulas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MaterialCategory | '')}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Formulas Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
        ) : filteredFormulas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No formulas found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your search or filter' 
                : 'No formulas have been added yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFormulas.map((formula) => (
              <div
                key={formula.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-amber-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{formula.name}</h3>
                    {formula.code && (
                      <span className="text-xs font-mono text-gray-500">{formula.code}</span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {getCategoryLabel(formula.category)}
                  </span>
                </div>
                
                {formula.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{formula.description}</p>
                )}
                
                {/* Formula Display */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3 font-mono text-sm">
                  <code className="text-gray-800">{buildFormulaString(formula)}</code>
                </div>
                
                {/* Components */}
                {formula.components && formula.components.length > 0 && (
                  <div className="text-xs text-gray-500 mb-3">
                    <span className="font-medium">Components: </span>
                    {formula.components.map((c, i) => (
                      <span key={i}>
                        {c.quantity} {c.materialName}
                        {i < formula.components.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedFormula(formula)}
                    className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    onClick={() => handleCopyFormula(formula)}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                  >
                    {copiedId === formula.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                {/* Usage Count */}
                {formula.usageCount > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Used {formula.usageCount} times
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Formulas</p>
            <p className="text-2xl font-semibold text-gray-900">{formulas.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-2xl font-semibold text-gray-900">
              {new Set(formulas.map(f => f.category)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Most Used</p>
            <p className="text-lg font-semibold text-gray-900 truncate">
              {formulas.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.name || '-'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Usage</p>
            <p className="text-2xl font-semibold text-amber-600">
              {formulas.reduce((sum, f) => sum + (f.usageCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Formula Detail Modal */}
      {selectedFormula && (
        <FormulaDetailModal
          formula={selectedFormula}
          onClose={() => setSelectedFormula(null)}
          onCopy={() => handleCopyFormula(selectedFormula)}
          isCopied={copiedId === selectedFormula.id}
        />
      )}
    </div>
  );
};

// Formula Detail Modal
interface FormulaDetailModalProps {
  formula: StandardFormula;
  onClose: () => void;
  onCopy: () => void;
  isCopied: boolean;
}

const FormulaDetailModal: React.FC<FormulaDetailModalProps> = ({
  formula,
  onClose,
  onCopy,
  isCopied,
}) => {
  // Build formula string from components
  const formulaString = formula.components && formula.components.length > 0
    ? formula.components.map(c => `${c.quantity} ${c.materialName}`).join(' + ')
    : formula.name;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{formula.name}</h3>
            {formula.code && (
              <span className="text-sm font-mono text-gray-500">{formula.code}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {formula.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
              <p className="text-gray-600">{formula.description}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Formula</h4>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-lg">
              <code className="text-gray-800">{formulaString}</code>
            </div>
          </div>

          {formula.components && formula.components.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Components</h4>
              <div className="space-y-2">
                {formula.components.map((component, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="font-mono font-semibold text-amber-600 w-16">
                      {component.quantity}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{component.materialName}</p>
                      <p className="text-xs text-gray-400">Unit: {component.unit}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Output Unit</h4>
            <p className="text-sm text-gray-600">{formula.outputUnit}</p>
          </div>

          {formula.keywords && formula.keywords.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {formula.keywords.map((keyword, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button
            onClick={onCopy}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Formula
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormulaDatabase;
