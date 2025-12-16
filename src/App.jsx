import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Upload, Settings, FileSpreadsheet, Calculator, Download, ChevronDown, ChevronRight, Plus, Trash2, Edit2, Check, X, AlertCircle, Package, Layers, Scissors, Grid, RotateCcw, ZoomIn, ZoomOut, Play } from 'lucide-react';

// ==================== CONFIGURATION ====================

// Default stock sheet sizes by material type (in mm)
const DEFAULT_STOCK_SHEETS = {
  'Blockboard Light Brown': { length: 2440, width: 1220, thickness: 18 },
  'Blockboard Ordinary': { length: 2440, width: 1220, thickness: 18 },
  'PG Bison White': { length: 2750, width: 1830, thickness: 18 },
  'PG Bison Backer': { length: 2750, width: 1830, thickness: 3 },
  'Plywood': { length: 2440, width: 1220, thickness: 18 },
  'MDF': { length: 2440, width: 1220, thickness: 18 },
  'Chipboard': { length: 2750, width: 1830, thickness: 16 },
  'OSB': { length: 2440, width: 1220, thickness: 18 },
  'default': { length: 2440, width: 1220, thickness: 18 },
};

// Blade kerf (cutting width) in mm
const DEFAULT_KERF = 4;

// Material mapping configuration
const DEFAULT_MATERIAL_MAPPING = {
  'Generic 0180': 'Blockboard Light Brown',
  'OSB3': 'PG Bison White',
  'Blockboard': 'Blockboard Ordinary',
  'Generic 0031': 'PG Bison Backer',
  'Plywood': 'Plywood',
};

// Milling configuration for timber
const DEFAULT_MILLING_CONFIG = {
  rawMaterialThickness: 60,
  intermediateMaterialThickness: 50,
  defectYield: 0.85,
};

// Cutting yield configurations
const CUTTING_YIELDS = {
  high: { label: 'High Yield (70-80%)', value: 0.75, examples: 'Table tops, rectangular panels' },
  medium: { label: 'Medium Yield (55-70%)', value: 0.65, examples: 'Legs, frames, standard cuts' },
  low: { label: 'Low Yield (40-55%)', value: 0.50, examples: 'Curved pieces, complex shapes' },
};

// Sample data for demonstration
const SAMPLE_DATA = [
  { cabinet: 'Floating TV Cabinet', label: 'Top_1', material: 'Generic 0180', thickness: 18, quantity: 1, length: 1746, width: 100, grain: 0, topEdge: '', rightEdge: '', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Top_2', material: 'Generic 0180', thickness: 18, quantity: 1, length: 1746, width: 100, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Bottom', material: 'Generic 0180', thickness: 18, quantity: 1, length: 1746, width: 380, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Left Side', material: 'Generic 0180', thickness: 18, quantity: 1, length: 264, width: 380, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Right Side', material: 'Generic 0180', thickness: 18, quantity: 1, length: 264, width: 380, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Back', material: 'Generic 0180', thickness: 18, quantity: 1, length: 148, width: 1746, grain: 0, topEdge: '', rightEdge: '', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Fixed Shelf 1', material: 'OSB3', thickness: 18, quantity: 1, length: 1800, width: 405, grain: 1, topEdge: 'Edge-020', rightEdge: 'Edge-020', bottomEdge: 'Edge-020', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Fixed Shelf 2', material: 'OSB3', thickness: 18, quantity: 1, length: 1800, width: 405, grain: 1, topEdge: 'Edge-020', rightEdge: 'Edge-020', bottomEdge: 'Edge-020', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Vertical Div', material: 'Generic 0180', thickness: 18, quantity: 1, length: 228, width: 362, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Floating TV Cabinet', label: 'Door', material: 'OSB3', thickness: 18, quantity: 1, length: 262, width: 1185, grain: 1, topEdge: 'Edge-020', rightEdge: 'Edge-020', bottomEdge: 'Edge-020', leftEdge: 'Edge-020' },
  { cabinet: 'Shelf Unit', label: 'Top', material: 'Generic 0180', thickness: 18, quantity: 1, length: 700, width: 250, grain: 0, topEdge: 'Edge-020', rightEdge: 'Edge-020', bottomEdge: 'Edge-020', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Bottom', material: 'Generic 0180', thickness: 18, quantity: 1, length: 700, width: 250, grain: 0, topEdge: 'Edge-020', rightEdge: 'Edge-020', bottomEdge: 'Edge-020', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Left Side', material: 'Generic 0180', thickness: 18, quantity: 1, length: 2364, width: 250, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Right Side', material: 'Generic 0180', thickness: 18, quantity: 1, length: 2364, width: 250, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Back Panel', material: 'Generic 0031', thickness: 3, quantity: 1, length: 2374, width: 674, grain: 0, topEdge: '', rightEdge: '', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Fixed Shelf 1', material: 'Generic 0180', thickness: 18, quantity: 1, length: 664, width: 232, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Fixed Shelf 2', material: 'Generic 0180', thickness: 18, quantity: 1, length: 664, width: 232, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Fixed Shelf 3', material: 'Generic 0180', thickness: 18, quantity: 1, length: 664, width: 232, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
  { cabinet: 'Shelf Unit', label: 'Fixed Shelf 4', material: 'Generic 0180', thickness: 18, quantity: 1, length: 664, width: 232, grain: 0, topEdge: '', rightEdge: 'Edge-020', bottomEdge: '', leftEdge: '' },
];

// ==================== CUTTING OPTIMIZER ALGORITHM ====================

class CuttingOptimizer {
  constructor(stockSheets, kerf = DEFAULT_KERF) {
    this.stockSheets = stockSheets;
    this.kerf = kerf;
  }

  // Get stock sheet dimensions for a material
  getStockSheet(material) {
    return this.stockSheets[material] || this.stockSheets['default'] || DEFAULT_STOCK_SHEETS['default'];
  }

  // Expand parts based on quantity
  expandParts(parts) {
    const expanded = [];
    parts.forEach((part, originalIndex) => {
      for (let i = 0; i < part.quantity; i++) {
        expanded.push({
          ...part,
          originalIndex,
          instanceIndex: i,
          id: `${part.label}-${i}`,
          // Ensure dimensions include length as the larger dimension for consistency
          partLength: Math.max(part.length, part.width),
          partWidth: Math.min(part.length, part.width),
          needsRotation: part.length < part.width,
        });
      }
    });
    return expanded;
  }

  // Check if a part can be placed at position (considering grain)
  canPlace(part, x, y, sheetWidth, sheetHeight, placements, rotated = false) {
    let partL = rotated ? part.partWidth : part.partLength;
    let partW = rotated ? part.partLength : part.partWidth;

    // Check bounds
    if (x + partL > sheetWidth || y + partW > sheetHeight) {
      return false;
    }

    // Check overlap with existing placements
    for (const placed of placements) {
      if (this.rectsOverlap(
        x, y, partL, partW,
        placed.x, placed.y, placed.placedLength, placed.placedWidth
      )) {
        return false;
      }
    }

    return true;
  }

  // Check if two rectangles overlap
  rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return !(x1 + w1 <= x2 || x2 + w2 <= x1 || y1 + h1 <= y2 || y2 + h2 <= y1);
  }

  // Guillotine algorithm - First Fit Decreasing Height (FFDH) variant
  // Optimized for minimal waste
  optimizeSheet(parts, sheetWidth, sheetHeight) {
    const placements = [];
    const unplaced = [];
    
    // Sort parts by area (largest first) for better packing
    const sortedParts = [...parts].sort((a, b) => {
      const areaA = a.partLength * a.partWidth;
      const areaB = b.partLength * b.partWidth;
      return areaB - areaA;
    });

    // Free rectangles (guillotine cuts)
    let freeRects = [{ x: 0, y: 0, width: sheetWidth, height: sheetHeight }];

    for (const part of sortedParts) {
      let placed = false;
      let bestRect = null;
      let bestScore = Infinity;
      let bestRotated = false;
      let bestRectIndex = -1;

      // Try to find the best free rectangle for this part
      for (let i = 0; i < freeRects.length; i++) {
        const rect = freeRects[i];

        // Try without rotation
        if (part.partLength <= rect.width && part.partWidth <= rect.height) {
          // Score: prefer tighter fits (less waste)
          const score = (rect.width - part.partLength) * rect.height + 
                       (rect.height - part.partWidth) * part.partLength;
          if (score < bestScore) {
            bestScore = score;
            bestRect = rect;
            bestRotated = false;
            bestRectIndex = i;
          }
        }

        // Try with rotation (only if grain direction allows)
        // grain = 0 means horizontal (no grain restriction), grain = 1 means vertical (restricted)
        if (part.grain === 0 && part.partWidth <= rect.width && part.partLength <= rect.height) {
          const score = (rect.width - part.partWidth) * rect.height + 
                       (rect.height - part.partLength) * part.partWidth;
          if (score < bestScore) {
            bestScore = score;
            bestRect = rect;
            bestRotated = true;
            bestRectIndex = i;
          }
        }
      }

      if (bestRect) {
        const placedLength = bestRotated ? part.partWidth : part.partLength;
        const placedWidth = bestRotated ? part.partLength : part.partWidth;

        placements.push({
          ...part,
          x: bestRect.x,
          y: bestRect.y,
          placedLength: placedLength,
          placedWidth: placedWidth,
          rotated: bestRotated,
        });

        // Split the free rectangle (guillotine cut)
        freeRects.splice(bestRectIndex, 1);

        // Add new free rectangles from the split
        // Right remainder
        if (bestRect.width - placedLength - this.kerf > 0) {
          freeRects.push({
            x: bestRect.x + placedLength + this.kerf,
            y: bestRect.y,
            width: bestRect.width - placedLength - this.kerf,
            height: placedWidth,
          });
        }

        // Top remainder
        if (bestRect.height - placedWidth - this.kerf > 0) {
          freeRects.push({
            x: bestRect.x,
            y: bestRect.y + placedWidth + this.kerf,
            width: bestRect.width,
            height: bestRect.height - placedWidth - this.kerf,
          });
        }

        // Merge adjacent free rectangles where possible
        freeRects = this.mergeFreeRects(freeRects);

        placed = true;
      }

      if (!placed) {
        unplaced.push(part);
      }
    }

    return { placements, unplaced };
  }

  // Merge adjacent free rectangles
  mergeFreeRects(rects) {
    // Simple merge - could be more sophisticated
    return rects.filter(r => r.width > 0 && r.height > 0);
  }

  // Main optimization function
  optimize(rawParts, materialMapping) {
    // Group parts by material
    const partsByMaterial = {};
    
    rawParts.forEach(part => {
      const mappedMaterial = materialMapping[part.material] || part.material;
      if (!partsByMaterial[mappedMaterial]) {
        partsByMaterial[mappedMaterial] = [];
      }
      partsByMaterial[mappedMaterial].push({
        ...part,
        mappedMaterial,
      });
    });

    const results = {};

    // Optimize each material separately
    for (const [material, parts] of Object.entries(partsByMaterial)) {
      const stockSheet = this.getStockSheet(material);
      const expandedParts = this.expandParts(parts);
      
      const sheets = [];
      let remainingParts = [...expandedParts];

      while (remainingParts.length > 0) {
        const { placements, unplaced } = this.optimizeSheet(
          remainingParts,
          stockSheet.length,
          stockSheet.width
        );

        if (placements.length === 0) {
          // Parts too large for sheet - mark as errors
          console.warn('Parts too large for sheet:', unplaced);
          break;
        }

        // Calculate sheet statistics
        const usedArea = placements.reduce((sum, p) => sum + p.placedLength * p.placedWidth, 0);
        const totalArea = stockSheet.length * stockSheet.width;
        const wasteArea = totalArea - usedArea;
        const efficiency = (usedArea / totalArea) * 100;

        sheets.push({
          sheetNumber: sheets.length + 1,
          stockSheet,
          placements,
          usedArea,
          totalArea,
          wasteArea,
          efficiency,
        });

        remainingParts = unplaced;
      }

      results[material] = {
        material,
        stockSheet,
        sheets,
        totalSheets: sheets.length,
        totalParts: expandedParts.length,
        placedParts: sheets.reduce((sum, s) => sum + s.placements.length, 0),
        averageEfficiency: sheets.length > 0 
          ? sheets.reduce((sum, s) => sum + s.efficiency, 0) / sheets.length 
          : 0,
        totalUsedArea: sheets.reduce((sum, s) => sum + s.usedArea, 0),
        totalWasteArea: sheets.reduce((sum, s) => sum + s.wasteArea, 0),
      };
    }

    return results;
  }
}

// ==================== UI COMPONENTS ====================

// Tab Button Component
const TabButton = ({ active, onClick, children, icon: Icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    {Icon && <Icon size={18} />}
    {children}
  </button>
);

// Collapsible Section Component
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = true, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        {Icon && <Icon size={18} className="text-blue-600" />}
        <span className="font-medium flex-1 text-left">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
            {badge}
          </span>
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
};

// Sheet Visualization Component
const SheetVisualization = ({ sheet, scale = 0.15 }) => {
  const { stockSheet, placements, sheetNumber, efficiency } = sheet;
  const displayWidth = stockSheet.length * scale;
  const displayHeight = stockSheet.width * scale;

  // Generate colors for different parts
  const getPartColor = (index) => {
    const colors = [
      'bg-blue-200 border-blue-400',
      'bg-green-200 border-green-400',
      'bg-yellow-200 border-yellow-400',
      'bg-purple-200 border-purple-400',
      'bg-pink-200 border-pink-400',
      'bg-indigo-200 border-indigo-400',
      'bg-red-200 border-red-400',
      'bg-orange-200 border-orange-400',
      'bg-teal-200 border-teal-400',
      'bg-cyan-200 border-cyan-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium">Sheet #{sheetNumber}</h4>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">
            {stockSheet.length} × {stockSheet.width} mm
          </span>
          <span className={`px-2 py-0.5 rounded ${
            efficiency >= 80 ? 'bg-green-100 text-green-700' :
            efficiency >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {efficiency.toFixed(1)}% efficient
          </span>
        </div>
      </div>
      
      <div 
        className="relative bg-gray-100 border-2 border-gray-400 overflow-hidden"
        style={{ width: displayWidth, height: displayHeight }}
      >
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`grid-${sheetNumber}`} width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="gray" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${sheetNumber})`} />
        </svg>

        {/* Placed parts */}
        {placements.map((part, idx) => (
          <div
            key={part.id}
            className={`absolute border-2 flex items-center justify-center text-xs font-medium overflow-hidden ${getPartColor(part.originalIndex)}`}
            style={{
              left: part.x * scale,
              top: part.y * scale,
              width: part.placedLength * scale,
              height: part.placedWidth * scale,
            }}
            title={`${part.label}\n${part.placedLength} × ${part.placedWidth} mm${part.rotated ? ' (rotated)' : ''}`}
          >
            <div className="text-center p-1 truncate">
              <div className="truncate">{part.label}</div>
              {part.rotated && <RotateCcw size={10} className="inline ml-1" />}
            </div>
          </div>
        ))}
      </div>

      {/* Parts legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {placements.map((part, idx) => (
          <div
            key={part.id}
            className={`px-2 py-1 rounded text-xs border ${getPartColor(part.originalIndex)}`}
          >
            {part.label}: {part.placedLength}×{part.placedWidth}
            {part.rotated && ' ↻'}
            {part.grain === 1 && ' ║'}
          </div>
        ))}
      </div>
    </div>
  );
};

// Data Input Panel
const DataInputPanel = ({ rawData, setRawData }) => {
  const [pasteText, setPasteText] = useState('');
  
  const handleParse = () => {
    const lines = pasteText.trim().split('\n');
    const parsed = lines.slice(1).map(line => {
      const cols = line.split('\t');
      if (cols.length >= 8) {
        return {
          cabinet: cols[0] || '',
          label: cols[1] || '',
          material: cols[2] || '',
          thickness: parseFloat(cols[3]) || 0,
          quantity: parseInt(cols[4]) || 1,
          length: parseFloat(cols[5]) || 0,
          width: parseFloat(cols[6]) || 0,
          grain: parseInt(cols[7]) || 0,
          topEdge: cols[8] || '',
          rightEdge: cols[9] || '',
          bottomEdge: cols[10] || '',
          leftEdge: cols[11] || '',
        };
      }
      return null;
    }).filter(Boolean);
    
    if (parsed.length > 0) {
      setRawData(parsed);
      setPasteText('');
    }
  };

  return (
    <div className="space-y-4">
      <CollapsibleSection title="Paste from Polyboard/SketchUp" icon={Upload}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Paste your cutting list data (tab-separated) from Polyboard or SketchUp export.
            Expected columns: Cabinet, Label, Material, Thickness, Qty, Length, Width, Grain, TopEdge, RightEdge, BottomEdge, LeftEdge
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste cutting list data here..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleParse}
              disabled={!pasteText.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Parse Data
            </button>
            <button
              onClick={() => setRawData(SAMPLE_DATA)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Load Sample Data
            </button>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection 
        title="Raw Data" 
        icon={FileSpreadsheet} 
        defaultOpen={rawData.length > 0}
        badge={rawData.length > 0 ? `${rawData.length} items` : null}
      >
        {rawData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No data loaded. Paste data above or load sample data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-2 text-left">Cabinet</th>
                  <th className="px-2 py-2 text-left">Label</th>
                  <th className="px-2 py-2 text-left">Material</th>
                  <th className="px-2 py-2 text-right">Thk</th>
                  <th className="px-2 py-2 text-right">Qty</th>
                  <th className="px-2 py-2 text-right">L</th>
                  <th className="px-2 py-2 text-right">W</th>
                  <th className="px-2 py-2 text-center">Grain</th>
                  <th className="px-2 py-2 text-center">Edges</th>
                </tr>
              </thead>
              <tbody>
                {rawData.map((row, idx) => {
                  const edgeCount = [row.topEdge, row.rightEdge, row.bottomEdge, row.leftEdge].filter(Boolean).length;
                  return (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-2 truncate max-w-32">{row.cabinet}</td>
                      <td className="px-2 py-2 truncate max-w-32">{row.label}</td>
                      <td className="px-2 py-2 truncate max-w-28">{row.material}</td>
                      <td className="px-2 py-2 text-right">{row.thickness}</td>
                      <td className="px-2 py-2 text-right">{row.quantity}</td>
                      <td className="px-2 py-2 text-right">{row.length}</td>
                      <td className="px-2 py-2 text-right">{row.width}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          row.grain === 1 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {row.grain === 1 ? '║ V' : '═ H'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${edgeCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                          {edgeCount}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};

// Material Mapping Configuration Panel
const MaterialMappingPanel = ({ materialMapping, setMaterialMapping }) => {
  const [newMapping, setNewMapping] = useState({ source: '', target: '' });

  const handleAdd = () => {
    if (newMapping.source && newMapping.target) {
      setMaterialMapping(prev => ({ ...prev, [newMapping.source]: newMapping.target }));
      setNewMapping({ source: '', target: '' });
    }
  };

  const handleDelete = (key) => {
    setMaterialMapping(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Map generic material names from your design software to actual supplier material names.
      </p>
      
      <div className="space-y-2">
        {Object.entries(materialMapping).map(([source, target]) => (
          <div key={source} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="flex-1 font-mono text-sm">{source}</span>
            <span className="text-gray-400">→</span>
            <span className="flex-1 font-mono text-sm text-blue-600">{target}</span>
            <button
              onClick={() => handleDelete(source)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg">
        <input
          type="text"
          value={newMapping.source}
          onChange={(e) => setNewMapping(prev => ({ ...prev, source: e.target.value }))}
          placeholder="Generic name"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <span className="text-gray-400">→</span>
        <input
          type="text"
          value={newMapping.target}
          onChange={(e) => setNewMapping(prev => ({ ...prev, target: e.target.value }))}
          placeholder="Supplier name"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={!newMapping.source || !newMapping.target}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:text-gray-300"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

// Stock Sheet Configuration Panel
const StockSheetConfigPanel = ({ stockSheets, setStockSheets }) => {
  const [editMaterial, setEditMaterial] = useState(null);
  const [newSheet, setNewSheet] = useState({ material: '', length: 2440, width: 1220, thickness: 18 });

  const handleUpdate = (material, field, value) => {
    setStockSheets(prev => ({
      ...prev,
      [material]: { ...prev[material], [field]: parseFloat(value) || 0 }
    }));
  };

  const handleAdd = () => {
    if (newSheet.material) {
      setStockSheets(prev => ({
        ...prev,
        [newSheet.material]: { length: newSheet.length, width: newSheet.width, thickness: newSheet.thickness }
      }));
      setNewSheet({ material: '', length: 2440, width: 1220, thickness: 18 });
    }
  };

  const handleDelete = (material) => {
    if (material !== 'default') {
      setStockSheets(prev => {
        const updated = { ...prev };
        delete updated[material];
        return updated;
      });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Configure stock sheet dimensions for each material type. These are used by the cutting optimizer.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left">Material</th>
              <th className="px-3 py-2 text-right">Length (mm)</th>
              <th className="px-3 py-2 text-right">Width (mm)</th>
              <th className="px-3 py-2 text-right">Thickness (mm)</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stockSheets).map(([material, dims]) => (
              <tr key={material} className="border-b border-gray-100">
                <td className="px-3 py-2 font-medium">{material}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={dims.length}
                    onChange={(e) => handleUpdate(material, 'length', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={dims.width}
                    onChange={(e) => handleUpdate(material, 'width', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={dims.thickness}
                    onChange={(e) => handleUpdate(material, 'thickness', e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  {material !== 'default' && (
                    <button
                      onClick={() => handleDelete(material)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 p-3 border border-dashed border-gray-300 rounded-lg">
        <input
          type="text"
          value={newSheet.material}
          onChange={(e) => setNewSheet(prev => ({ ...prev, material: e.target.value }))}
          placeholder="Material name"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        <input
          type="number"
          value={newSheet.length}
          onChange={(e) => setNewSheet(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
          placeholder="Length"
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
        />
        <input
          type="number"
          value={newSheet.width}
          onChange={(e) => setNewSheet(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
          placeholder="Width"
          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
        />
        <input
          type="number"
          value={newSheet.thickness}
          onChange={(e) => setNewSheet(prev => ({ ...prev, thickness: parseFloat(e.target.value) || 0 }))}
          placeholder="Thickness"
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
        />
        <button
          onClick={handleAdd}
          disabled={!newSheet.material}
          className="p-1 text-green-600 hover:bg-green-50 rounded disabled:text-gray-300"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};

// Milling Configuration Panel
const MillingConfigPanel = ({ millingConfig, setMillingConfig }) => {
  const planingYield = millingConfig.intermediateMaterialThickness / millingConfig.rawMaterialThickness;
  const totalMillingYield = planingYield * millingConfig.defectYield;
  const millingFactor = 1 / totalMillingYield;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Configure milling parameters for timber volume calculations.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Raw Material Thickness (mm)
          </label>
          <input
            type="number"
            value={millingConfig.rawMaterialThickness}
            onChange={(e) => setMillingConfig(prev => ({ ...prev, rawMaterialThickness: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Intermediate Thickness (mm)
          </label>
          <input
            type="number"
            value={millingConfig.intermediateMaterialThickness}
            onChange={(e) => setMillingConfig(prev => ({ ...prev, intermediateMaterialThickness: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Defect/Squaring Yield (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={millingConfig.defectYield}
            onChange={(e) => setMillingConfig(prev => ({ ...prev, defectYield: parseFloat(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Calculated Values</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Planing Yield:</span>
            <span className="ml-2 font-mono">{(planingYield * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-blue-600">Total Yield:</span>
            <span className="ml-2 font-mono">{(totalMillingYield * 100).toFixed(1)}%</span>
          </div>
          <div>
            <span className="text-blue-600">Milling Factor:</span>
            <span className="ml-2 font-mono">{millingFactor.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cutting Optimizer Panel
const CuttingOptimizerPanel = ({ rawData, materialMapping, stockSheets, kerf }) => {
  const [optimizationResults, setOptimizationResults] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [scale, setScale] = useState(0.15);

  const runOptimization = useCallback(() => {
    setIsOptimizing(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
      const optimizer = new CuttingOptimizer(stockSheets, kerf);
      const results = optimizer.optimize(rawData, materialMapping);
      setOptimizationResults(results);
      setIsOptimizing(false);
    }, 100);
  }, [rawData, materialMapping, stockSheets, kerf]);

  const totalStats = useMemo(() => {
    if (!optimizationResults) return null;
    
    let totalSheets = 0;
    let totalParts = 0;
    let totalUsedArea = 0;
    let totalWasteArea = 0;

    Object.values(optimizationResults).forEach(result => {
      totalSheets += result.totalSheets;
      totalParts += result.placedParts;
      totalUsedArea += result.totalUsedArea;
      totalWasteArea += result.totalWasteArea;
    });

    const overallEfficiency = totalUsedArea / (totalUsedArea + totalWasteArea) * 100;

    return { totalSheets, totalParts, totalUsedArea, totalWasteArea, overallEfficiency };
  }, [optimizationResults]);

  const copyResults = () => {
    if (!optimizationResults) return;

    let output = "CUTTING OPTIMIZATION RESULTS\n";
    output += "============================\n\n";

    Object.entries(optimizationResults).forEach(([material, result]) => {
      output += `Material: ${material}\n`;
      output += `Stock Sheet: ${result.stockSheet.length} × ${result.stockSheet.width} mm\n`;
      output += `Total Sheets Required: ${result.totalSheets}\n`;
      output += `Average Efficiency: ${result.averageEfficiency.toFixed(1)}%\n\n`;

      result.sheets.forEach(sheet => {
        output += `  Sheet #${sheet.sheetNumber} (${sheet.efficiency.toFixed(1)}% efficient)\n`;
        sheet.placements.forEach(part => {
          output += `    - ${part.label}: ${part.placedLength} × ${part.placedWidth} mm at (${part.x}, ${part.y})${part.rotated ? ' [rotated]' : ''}\n`;
        });
        output += "\n";
      });
    });

    navigator.clipboard.writeText(output);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={runOptimization}
            disabled={rawData.length === 0 || isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play size={18} />
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </button>

          {optimizationResults && (
            <button
              onClick={copyResults}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Copy Results
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Zoom:</span>
          <button
            onClick={() => setScale(s => Math.max(0.05, s - 0.02))}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-sm font-mono w-12 text-center">{(scale * 100).toFixed(0)}%</span>
          <button
            onClick={() => setScale(s => Math.min(0.3, s + 0.02))}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {totalStats && (
        <div className="grid grid-cols-5 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-700">{totalStats.totalSheets}</div>
            <div className="text-sm text-blue-600">Total Sheets</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-700">{totalStats.totalParts}</div>
            <div className="text-sm text-green-600">Parts Placed</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-700">{(totalStats.totalUsedArea / 1000000).toFixed(2)}</div>
            <div className="text-sm text-purple-600">Used Area (m²)</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <div className="text-3xl font-bold text-red-700">{(totalStats.totalWasteArea / 1000000).toFixed(2)}</div>
            <div className="text-sm text-red-600">Waste Area (m²)</div>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            totalStats.overallEfficiency >= 80 ? 'bg-green-100' :
            totalStats.overallEfficiency >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            <div className={`text-3xl font-bold ${
              totalStats.overallEfficiency >= 80 ? 'text-green-700' :
              totalStats.overallEfficiency >= 60 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {totalStats.overallEfficiency.toFixed(1)}%
            </div>
            <div className={`text-sm ${
              totalStats.overallEfficiency >= 80 ? 'text-green-600' :
              totalStats.overallEfficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              Overall Efficiency
            </div>
          </div>
        </div>
      )}

      {/* Results by Material */}
      {optimizationResults && Object.entries(optimizationResults).map(([material, result]) => (
        <CollapsibleSection
          key={material}
          title={material}
          icon={Layers}
          badge={`${result.totalSheets} sheets`}
        >
          <div className="space-y-4">
            {/* Material Summary */}
            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="text-gray-500">Stock Size:</span>
                <span className="ml-2 font-medium">{result.stockSheet.length} × {result.stockSheet.width} mm</span>
              </div>
              <div>
                <span className="text-gray-500">Parts:</span>
                <span className="ml-2 font-medium">{result.placedParts} / {result.totalParts}</span>
              </div>
              <div>
                <span className="text-gray-500">Sheets:</span>
                <span className="ml-2 font-medium">{result.totalSheets}</span>
              </div>
              <div>
                <span className="text-gray-500">Avg Efficiency:</span>
                <span className={`ml-2 font-medium ${
                  result.averageEfficiency >= 80 ? 'text-green-600' :
                  result.averageEfficiency >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.averageEfficiency.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Sheet Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {result.sheets.map(sheet => (
                <SheetVisualization key={sheet.sheetNumber} sheet={sheet} scale={scale} />
              ))}
            </div>
          </div>
        </CollapsibleSection>
      ))}

      {/* No Results Message */}
      {!optimizationResults && rawData.length > 0 && (
        <div className="text-center py-12 text-gray-500">
          <Grid className="mx-auto mb-4" size={48} />
          <p>Click "Run Optimization" to generate cutting patterns.</p>
        </div>
      )}

      {rawData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="mx-auto mb-4" size={48} />
          <p>No data loaded. Go to Data Input tab to load cutting list data.</p>
        </div>
      )}
    </div>
  );
};

// Output Format: PG Bison
const PGBisonOutput = ({ data, materialMapping }) => {
  const processedData = useMemo(() => {
    return data.map(row => {
      const mappedMaterial = materialMapping[row.material] || row.material;
      const edgeLengthCount = [row.topEdge, row.bottomEdge].filter(Boolean).length;
      const edgeWidthCount = [row.leftEdge, row.rightEdge].filter(Boolean).length;
      
      return {
        component: row.label,
        length: row.length,
        width: row.width,
        quantity: row.quantity,
        edgeLength: edgeLengthCount,
        edgeWidth: edgeWidthCount,
        hingeHoles: 0,
        grooves: 0,
        material: mappedMaterial,
      };
    });
  }, [data, materialMapping]);

  const copyToClipboard = () => {
    const headers = ['Component', 'Length', 'Width', 'Quantity', 'Edge Length', 'Edge Width', 'Hinge Holes', 'Grooves', 'Material (Notes)'];
    const rows = processedData.map(r => [r.component, r.length, r.width, r.quantity, r.edgeLength, r.edgeWidth, r.hingeHoles, r.grooves, r.material]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">PG Bison Format Output</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
        >
          <Download size={16} />
          Copy TSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-green-50">
              <th className="px-2 py-2 text-left border-b">Component</th>
              <th className="px-2 py-2 text-right border-b">Length</th>
              <th className="px-2 py-2 text-right border-b">Width</th>
              <th className="px-2 py-2 text-right border-b">Qty</th>
              <th className="px-2 py-2 text-right border-b">Edge L</th>
              <th className="px-2 py-2 text-right border-b">Edge W</th>
              <th className="px-2 py-2 text-right border-b">Hinge</th>
              <th className="px-2 py-2 text-right border-b">Groove</th>
              <th className="px-2 py-2 text-left border-b">Material</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-2">{row.component}</td>
                <td className="px-2 py-2 text-right">{row.length}</td>
                <td className="px-2 py-2 text-right">{row.width}</td>
                <td className="px-2 py-2 text-right">{row.quantity}</td>
                <td className="px-2 py-2 text-right">{row.edgeLength}</td>
                <td className="px-2 py-2 text-right">{row.edgeWidth}</td>
                <td className="px-2 py-2 text-right">{row.hingeHoles}</td>
                <td className="px-2 py-2 text-right">{row.grooves}</td>
                <td className="px-2 py-2 text-blue-600">{row.material}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Output Format: CutlistOpt
const CutlistOptOutput = ({ data, materialMapping }) => {
  const processedData = useMemo(() => {
    return data.map(row => {
      const mappedMaterial = materialMapping[row.material] || row.material;
      return {
        length: row.length,
        width: row.width,
        qty: row.quantity,
        material: mappedMaterial,
        label: row.label,
        enabled: 'True',
        grainDirection: row.grain ? 'v' : 'h',
        topBand: row.topEdge || '',
        leftBand: row.leftEdge || '',
        bottomBand: row.bottomEdge || '',
        rightBand: row.rightEdge || '',
      };
    });
  }, [data, materialMapping]);

  const copyToClipboard = () => {
    const headers = ['Length', 'Width', 'Qty', 'Material', 'Label', 'Enabled', 'Grain direction', 'Top band', 'Left band', 'Bottom band', 'Right band'];
    const rows = processedData.map(r => [r.length, r.width, r.qty, r.material, r.label, r.enabled, r.grainDirection, r.topBand, r.leftBand, r.bottomBand, r.rightBand]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">CutlistOptimizer Format Output</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
        >
          <Download size={16} />
          Copy TSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-purple-50">
              <th className="px-2 py-2 text-right border-b">Length</th>
              <th className="px-2 py-2 text-right border-b">Width</th>
              <th className="px-2 py-2 text-right border-b">Qty</th>
              <th className="px-2 py-2 text-left border-b">Material</th>
              <th className="px-2 py-2 text-left border-b">Label</th>
              <th className="px-2 py-2 text-center border-b">Grain</th>
              <th className="px-2 py-2 text-left border-b">Top</th>
              <th className="px-2 py-2 text-left border-b">Left</th>
              <th className="px-2 py-2 text-left border-b">Bottom</th>
              <th className="px-2 py-2 text-left border-b">Right</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-2 text-right">{row.length}</td>
                <td className="px-2 py-2 text-right">{row.width}</td>
                <td className="px-2 py-2 text-right">{row.qty}</td>
                <td className="px-2 py-2 text-purple-600">{row.material}</td>
                <td className="px-2 py-2">{row.label}</td>
                <td className="px-2 py-2 text-center font-mono">{row.grainDirection}</td>
                <td className="px-2 py-2 text-xs">{row.topBand || '-'}</td>
                <td className="px-2 py-2 text-xs">{row.leftBand || '-'}</td>
                <td className="px-2 py-2 text-xs">{row.bottomBand || '-'}</td>
                <td className="px-2 py-2 text-xs">{row.rightBand || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Output Format: Katana BOM
const KatanaBOMOutput = ({ data, materialMapping }) => {
  const aggregatedData = useMemo(() => {
    const materialTotals = {};
    
    data.forEach(row => {
      const mappedMaterial = materialMapping[row.material] || row.material;
      const areaSqm = (row.length * row.width * row.quantity) / 1000000;
      
      if (!materialTotals[mappedMaterial]) {
        materialTotals[mappedMaterial] = 0;
      }
      materialTotals[mappedMaterial] += areaSqm;
    });

    return Object.entries(materialTotals).map(([material, quantity]) => ({
      material,
      quantity: quantity.toFixed(4),
      unit: 'SQM',
    }));
  }, [data, materialMapping]);

  const totalSqm = aggregatedData.reduce((sum, r) => sum + parseFloat(r.quantity), 0);

  const copyToClipboard = () => {
    const headers = ['Material Name (SKU)', 'Quantity', 'Unit of Measure'];
    const rows = aggregatedData.map(r => [r.material, r.quantity, r.unit]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Katana MRP BOM Output</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
        >
          <Download size={16} />
          Copy TSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700">{aggregatedData.length}</div>
          <div className="text-sm text-orange-600">Materials</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700">{totalSqm.toFixed(2)}</div>
          <div className="text-sm text-orange-600">Total SQM</div>
        </div>
        <div className="p-4 bg-orange-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-700">{data.length}</div>
          <div className="text-sm text-orange-600">Components</div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-orange-50">
              <th className="px-4 py-2 text-left border-b">Material Name (SKU)</th>
              <th className="px-4 py-2 text-right border-b">Quantity</th>
              <th className="px-4 py-2 text-left border-b">Unit</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-orange-700 font-medium">{row.material}</td>
                <td className="px-4 py-2 text-right font-mono">{row.quantity}</td>
                <td className="px-4 py-2">{row.unit}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-orange-100 font-medium">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right font-mono">{totalSqm.toFixed(4)}</td>
              <td className="px-4 py-2">SQM</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// Output Format: Timber Volumetric BOM
const TimberBOMOutput = ({ data, millingConfig }) => {
  const [componentYields, setComponentYields] = useState({});
  
  const getYieldForComponent = (label) => componentYields[label] || 'medium';
  const setYieldForComponent = (label, yield_) => setComponentYields(prev => ({ ...prev, [label]: yield_ }));

  const planingYield = millingConfig.intermediateMaterialThickness / millingConfig.rawMaterialThickness;
  const totalMillingYield = planingYield * millingConfig.defectYield;
  const millingFactor = 1 / totalMillingYield;

  const processedData = useMemo(() => {
    return data.map(row => {
      const netVolume = (row.length * row.width * row.thickness * row.quantity) / 1000000000;
      const yieldType = getYieldForComponent(row.label);
      const cuttingFactor = 1 / CUTTING_YIELDS[yieldType].value;
      const requiredIM = netVolume * cuttingFactor;
      const requiredRM = requiredIM * millingFactor;
      
      return { ...row, netVolume, yieldType, cuttingFactor, requiredIM, requiredRM };
    });
  }, [data, componentYields, millingFactor]);

  const totals = useMemo(() => ({
    netVolume: processedData.reduce((sum, r) => sum + r.netVolume, 0),
    requiredIM: processedData.reduce((sum, r) => sum + r.requiredIM, 0),
    requiredRM: processedData.reduce((sum, r) => sum + r.requiredRM, 0),
  }), [processedData]);

  const copyToClipboard = () => {
    const headers = ['Component', 'Qty', 'L(m)', 'W(m)', 'T(m)', 'Net Vol(m³)', 'Cutting Yield', 'Required IM(m³)', 'Required RM(m³)'];
    const rows = processedData.map(r => [
      r.label, r.quantity, (r.length/1000).toFixed(4), (r.width/1000).toFixed(4), (r.thickness/1000).toFixed(4),
      r.netVolume.toFixed(6), CUTTING_YIELDS[r.yieldType].label, r.requiredIM.toFixed(6), r.requiredRM.toFixed(6)
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Timber Volumetric BOM</h3>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
        >
          <Download size={16} />
          Copy TSV
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="p-4 bg-amber-50 rounded-lg">
          <div className="text-sm text-amber-600 mb-1">Net Volume (Finished)</div>
          <div className="text-xl font-bold text-amber-700">{totals.netVolume.toFixed(4)} m³</div>
        </div>
        <div className="p-4 bg-amber-50 rounded-lg">
          <div className="text-sm text-amber-600 mb-1">Required IM</div>
          <div className="text-xl font-bold text-amber-700">{totals.requiredIM.toFixed(4)} m³</div>
        </div>
        <div className="p-4 bg-amber-100 rounded-lg">
          <div className="text-sm text-amber-700 mb-1">Required RM (Purchase)</div>
          <div className="text-xl font-bold text-amber-800">{totals.requiredRM.toFixed(4)} m³</div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200">
          <thead>
            <tr className="bg-amber-50">
              <th className="px-2 py-2 text-left border-b">Component</th>
              <th className="px-2 py-2 text-right border-b">Qty</th>
              <th className="px-2 py-2 text-right border-b">L(m)</th>
              <th className="px-2 py-2 text-right border-b">W(m)</th>
              <th className="px-2 py-2 text-right border-b">T(m)</th>
              <th className="px-2 py-2 text-right border-b">Net Vol</th>
              <th className="px-2 py-2 text-left border-b">Cutting Yield</th>
              <th className="px-2 py-2 text-right border-b">Req IM</th>
              <th className="px-2 py-2 text-right border-b">Req RM</th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-2">{row.label}</td>
                <td className="px-2 py-2 text-right">{row.quantity}</td>
                <td className="px-2 py-2 text-right font-mono">{(row.length/1000).toFixed(3)}</td>
                <td className="px-2 py-2 text-right font-mono">{(row.width/1000).toFixed(3)}</td>
                <td className="px-2 py-2 text-right font-mono">{(row.thickness/1000).toFixed(3)}</td>
                <td className="px-2 py-2 text-right font-mono">{row.netVolume.toFixed(6)}</td>
                <td className="px-2 py-2">
                  <select
                    value={row.yieldType}
                    onChange={(e) => setYieldForComponent(row.label, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-1 py-0.5"
                  >
                    <option value="high">High (75%)</option>
                    <option value="medium">Medium (65%)</option>
                    <option value="low">Low (50%)</option>
                  </select>
                </td>
                <td className="px-2 py-2 text-right font-mono text-blue-600">{row.requiredIM.toFixed(6)}</td>
                <td className="px-2 py-2 text-right font-mono text-amber-700 font-medium">{row.requiredRM.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-amber-100 font-medium">
              <td className="px-2 py-2" colSpan={5}>Totals</td>
              <td className="px-2 py-2 text-right font-mono">{totals.netVolume.toFixed(4)}</td>
              <td className="px-2 py-2"></td>
              <td className="px-2 py-2 text-right font-mono text-blue-600">{totals.requiredIM.toFixed(4)}</td>
              <td className="px-2 py-2 text-right font-mono text-amber-700">{totals.requiredRM.toFixed(4)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// ==================== MAIN APPLICATION ====================

export default function CutlistProcessorApp() {
  const [activeTab, setActiveTab] = useState('input');
  const [rawData, setRawData] = useState([]);
  const [materialMapping, setMaterialMapping] = useState(DEFAULT_MATERIAL_MAPPING);
  const [stockSheets, setStockSheets] = useState(DEFAULT_STOCK_SHEETS);
  const [millingConfig, setMillingConfig] = useState(DEFAULT_MILLING_CONFIG);
  const [kerf, setKerf] = useState(DEFAULT_KERF);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Scissors className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Dawin Cutlist Processor</h1>
              <p className="text-sm text-gray-500">Design → Optimize → BOM → Production</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {rawData.length > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {rawData.length} components loaded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2 flex-wrap">
          <TabButton active={activeTab === 'input'} onClick={() => setActiveTab('input')} icon={Upload}>
            Data Input
          </TabButton>
          <TabButton active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={Settings}>
            Configuration
          </TabButton>
          <TabButton active={activeTab === 'optimizer'} onClick={() => setActiveTab('optimizer')} icon={Grid}>
            Cut Optimizer
          </TabButton>
          <TabButton active={activeTab === 'pgbison'} onClick={() => setActiveTab('pgbison')} icon={Package}>
            PG Bison
          </TabButton>
          <TabButton active={activeTab === 'cutlistopt'} onClick={() => setActiveTab('cutlistopt')} icon={Layers}>
            CutlistOpt
          </TabButton>
          <TabButton active={activeTab === 'katana'} onClick={() => setActiveTab('katana')} icon={FileSpreadsheet}>
            Katana BOM
          </TabButton>
          <TabButton active={activeTab === 'timber'} onClick={() => setActiveTab('timber')} icon={Calculator}>
            Timber BOM
          </TabButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'input' && (
          <DataInputPanel rawData={rawData} setRawData={setRawData} />
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <CollapsibleSection title="Material Mapping" icon={Package}>
              <MaterialMappingPanel
                materialMapping={materialMapping}
                setMaterialMapping={setMaterialMapping}
              />
            </CollapsibleSection>
            <CollapsibleSection title="Stock Sheet Sizes" icon={Layers}>
              <StockSheetConfigPanel
                stockSheets={stockSheets}
                setStockSheets={setStockSheets}
              />
            </CollapsibleSection>
            <CollapsibleSection title="Cutting Parameters" icon={Scissors}>
              <div className="space-y-4">
                <div className="max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blade Kerf (mm)
                  </label>
                  <input
                    type="number"
                    value={kerf}
                    onChange={(e) => setKerf(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Width of the saw blade cut. Typically 3-5mm for panel saws.
                  </p>
                </div>
              </div>
            </CollapsibleSection>
            <CollapsibleSection title="Milling Configuration (Timber)" icon={Settings}>
              <MillingConfigPanel
                millingConfig={millingConfig}
                setMillingConfig={setMillingConfig}
              />
            </CollapsibleSection>
          </div>
        )}

        {activeTab === 'optimizer' && (
          <CuttingOptimizerPanel
            rawData={rawData}
            materialMapping={materialMapping}
            stockSheets={stockSheets}
            kerf={kerf}
          />
        )}

        {activeTab === 'pgbison' && (
          rawData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No data loaded. Go to Data Input tab to load cutting list data.</p>
            </div>
          ) : (
            <PGBisonOutput data={rawData} materialMapping={materialMapping} />
          )
        )}

        {activeTab === 'cutlistopt' && (
          rawData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No data loaded. Go to Data Input tab to load cutting list data.</p>
            </div>
          ) : (
            <CutlistOptOutput data={rawData} materialMapping={materialMapping} />
          )
        )}

        {activeTab === 'katana' && (
          rawData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No data loaded. Go to Data Input tab to load cutting list data.</p>
            </div>
          ) : (
            <KatanaBOMOutput data={rawData} materialMapping={materialMapping} />
          )
        )}

        {activeTab === 'timber' && (
          rawData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto mb-4" size={48} />
              <p>No data loaded. Go to Data Input tab to load cutting list data.</p>
            </div>
          ) : (
            <TimberBOMOutput data={rawData} millingConfig={millingConfig} />
          )
        )}
      </div>
    </div>
  );
}
