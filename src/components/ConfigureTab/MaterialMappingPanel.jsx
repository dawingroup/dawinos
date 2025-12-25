/**
 * Material Mapping Panel Component
 * Maps imported design software names to standard material types
 * For calculating material requirements - not inventory management
 * Users can change mappings at any time
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, AlertTriangle, Search, ChevronDown, Link2, Edit2 } from 'lucide-react';
import Fuse from 'fuse.js';

// Standard material types for requirements calculation
const STANDARD_MATERIALS = [
  { id: 'blockboard-light-brown', displayName: 'Blockboard Light Brown', thickness: 18, sheetSize: '2440×1220' },
  { id: 'blockboard-ordinary', displayName: 'Blockboard Ordinary', thickness: 18, sheetSize: '2440×1220' },
  { id: 'pg-bison-white', displayName: 'PG Bison White', thickness: 18, sheetSize: '2750×1830' },
  { id: 'pg-bison-backer', displayName: 'PG Bison Backer', thickness: 3, sheetSize: '2750×1830' },
  { id: 'plywood-18', displayName: 'Plywood 18mm', thickness: 18, sheetSize: '2440×1220' },
  { id: 'plywood-12', displayName: 'Plywood 12mm', thickness: 12, sheetSize: '2440×1220' },
  { id: 'plywood-9', displayName: 'Plywood 9mm', thickness: 9, sheetSize: '2440×1220' },
  { id: 'mdf-18', displayName: 'MDF 18mm', thickness: 18, sheetSize: '2440×1220' },
  { id: 'mdf-16', displayName: 'MDF 16mm', thickness: 16, sheetSize: '2440×1220' },
  { id: 'mdf-12', displayName: 'MDF 12mm', thickness: 12, sheetSize: '2440×1220' },
  { id: 'chipboard', displayName: 'Chipboard', thickness: 16, sheetSize: '2750×1830' },
  { id: 'osb', displayName: 'OSB', thickness: 18, sheetSize: '2440×1220' },
  { id: 'melamine-white', displayName: 'Melamine White', thickness: 18, sheetSize: '2750×1830' },
  { id: 'melamine-black', displayName: 'Melamine Black', thickness: 18, sheetSize: '2750×1830' },
  { id: 'supawood', displayName: 'Supawood', thickness: 16, sheetSize: '2750×1830' },
  { id: 'hardboard', displayName: 'Hardboard', thickness: 3, sheetSize: '2440×1220' },
];

const MaterialMappingPanel = ({ importedMaterials, onMappingComplete, onCancel }) => {
  const [mappings, setMappings] = useState({});
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Setup fuzzy search
  const fuse = useMemo(() => new Fuse(STANDARD_MATERIALS, {
    keys: ['displayName', 'id'],
    threshold: 0.4,
    includeScore: true
  }), []);

  // Analyze imported materials
  const analysis = useMemo(() => {
    const uniqueMaterials = [...new Set(importedMaterials.filter(Boolean))];
    
    return uniqueMaterials.map(materialName => {
      const fuzzyResults = fuse.search(materialName);
      
      if (fuzzyResults.length > 0 && fuzzyResults[0].score < 0.3) {
        return {
          designName: materialName,
          status: 'fuzzy',
          suggestedStock: fuzzyResults[0].item,
          confidence: 1 - fuzzyResults[0].score,
          alternatives: fuzzyResults.slice(1, 4).map(r => r.item)
        };
      }
      
      return {
        designName: materialName,
        status: 'unmapped',
        suggestedStock: null,
        confidence: 0,
        alternatives: fuzzyResults.slice(0, 3).map(r => r.item)
      };
    });
  }, [importedMaterials, fuse]);

  // Pre-populate high-confidence matches
  useEffect(() => {
    const initialMappings = {};
    analysis.forEach(m => {
      if (m.status === 'fuzzy' && m.confidence > 0.7) {
        initialMappings[m.designName] = m.suggestedStock.displayName;
      }
    });
    setMappings(initialMappings);
  }, [analysis]);

  const handleMappingChange = (designName, stockDisplayName) => {
    setMappings(prev => ({
      ...prev,
      [designName]: stockDisplayName
    }));
    setExpandedRow(null);
    setSearchTerm('');
  };

  const handleConfirm = () => {
    onMappingComplete(mappings);
  };

  const allMapped = analysis.length > 0 && analysis.every(m => mappings[m.designName]);

  const filteredMaterials = STANDARD_MATERIALS.filter(s => 
    s.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: analysis.length,
    mapped: analysis.filter(m => mappings[m.designName]).length,
    unmapped: analysis.filter(m => !mappings[m.designName]).length
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Map Materials for Requirements</h3>
        <p className="text-sm text-gray-600">
          Match design software names to standard materials • {stats.mapped}/{stats.total} mapped
        </p>
      </div>

      {/* Material List */}
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {analysis.map((material, idx) => (
          <div key={idx} className="p-3 hover:bg-gray-50">
            <div className="flex items-center justify-between gap-3">
              {/* Design Name */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-gray-900 truncate block">{material.designName}</span>
              </div>
              
              {/* Arrow */}
              <span className="text-gray-400">→</span>
              
              {/* Mapped Material or Select Button */}
              <div className="flex-1 min-w-0">
                {mappings[material.designName] ? (
                  <button
                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 w-full text-left"
                  >
                    <Check size={14} className="text-green-600 flex-shrink-0" />
                    <span className="text-sm text-green-800 font-medium truncate">{mappings[material.designName]}</span>
                    <Edit2 size={12} className="text-green-600 ml-auto flex-shrink-0" />
                  </button>
                ) : (
                  <button
                    onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 w-full justify-center"
                  >
                    <AlertTriangle size={14} />
                    Select Material
                    <ChevronDown size={14} className={`transition-transform ${expandedRow === idx ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Selection */}
            {expandedRow === idx && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                
                {/* Suggested Match */}
                {material.suggestedStock && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1">Suggested:</p>
                    <button
                      onClick={() => handleMappingChange(material.designName, material.suggestedStock.displayName)}
                      className="w-full text-left px-3 py-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 text-sm"
                    >
                      <span className="font-medium">{material.suggestedStock.displayName}</span>
                      <span className="text-xs text-blue-600 ml-2">({Math.round(material.confidence * 100)}% match)</span>
                    </button>
                  </div>
                )}

                {/* All Materials */}
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded bg-white">
                  {filteredMaterials.map(mat => (
                    <button
                      key={mat.id}
                      onClick={() => handleMappingChange(material.designName, mat.displayName)}
                      className={`w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex justify-between border-b border-gray-100 last:border-0 ${
                        mappings[material.designName] === mat.displayName ? 'bg-green-50' : ''
                      }`}
                    >
                      <span>{mat.displayName}</span>
                      <span className="text-xs text-gray-400">{mat.thickness}mm • {mat.sheetSize}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!allMapped}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check size={16} />
          {allMapped ? 'Proceed with Mappings' : `Map ${stats.unmapped} remaining`}
        </button>
      </div>
    </div>
  );
};

export default MaterialMappingPanel;
