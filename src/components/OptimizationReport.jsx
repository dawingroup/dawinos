import React, { useRef, useState } from 'react';
import { Download, FileText, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import CuttingDiagram from './CuttingDiagram';
import { calculateStatistics } from '../utils/optimizationEngine';
import { downloadOptimizationPDF } from '../services/pdfExportService';

/**
 * Optimization Report Component
 * Displays cutting layouts with statistics and export options
 */
const OptimizationReport = ({ 
  sheetLayouts, 
  projectCode = 'UNKNOWN',
  projectName = 'Untitled',
  onClose,
  onExportPDF,
  onSaveToDrive
}) => {
  const reportRef = useRef(null);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [scale, setScale] = useState(0.25);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'
  const [exporting, setExporting] = useState(false);

  if (!sheetLayouts || sheetLayouts.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md text-center">
          <FileText className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Optimization Results</h3>
          <p className="text-gray-600 mb-4">
            Run the optimization first to generate cutting layouts.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-boysenberry text-white rounded-lg hover:bg-boysenberry-dark"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const stats = calculateStatistics(sheetLayouts);
  const currentLayout = sheetLayouts[currentSheet];

  // Generate letter label for panel reference
  const getLetterLabel = (index) => {
    if (index < 26) {
      return String.fromCharCode(65 + index);
    }
    const first = Math.floor(index / 26) - 1;
    const second = index % 26;
    return String.fromCharCode(65 + first) + String.fromCharCode(65 + second);
  };

  const handlePrevSheet = () => {
    setCurrentSheet(prev => Math.max(0, prev - 1));
  };

  const handleNextSheet = () => {
    setCurrentSheet(prev => Math.min(sheetLayouts.length - 1, prev + 1));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cutting Optimization Report</h2>
            <p className="text-sm text-gray-500">
              Project: {projectCode} | {stats.totalSheets} sheet{stats.totalSheets !== 1 ? 's' : ''} | {stats.totalPanels} panels
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-4">
              <button
                onClick={() => setScale(s => Math.max(0.1, s - 0.05))}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale(s => Math.min(0.5, s + 0.05))}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
            </div>

            {/* View mode toggle */}
            <div className="flex border border-gray-300 rounded overflow-hidden mr-4">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 text-sm ${viewMode === 'single' ? 'bg-boysenberry text-white' : 'bg-white text-gray-600'}`}
              >
                Single
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm ${viewMode === 'all' ? 'bg-boysenberry text-white' : 'bg-white text-gray-600'}`}
              >
                All
              </button>
            </div>

            {/* Export buttons */}
            <button
              onClick={async () => {
                setExporting(true);
                try {
                  const fileName = await downloadOptimizationPDF(
                    sheetLayouts,
                    { code: projectCode, name: projectName },
                    reportRef.current
                  );
                  alert(`PDF exported: ${fileName}`);
                } catch (error) {
                  console.error('PDF export failed:', error);
                  alert('Failed to export PDF. Please try again.');
                }
                setExporting(false);
              }}
              disabled={exporting}
              className="flex items-center gap-1 px-3 py-1.5 bg-boysenberry text-white rounded hover:bg-boysenberry-dark text-sm disabled:opacity-50"
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'PDF'}
            </button>
            {onSaveToDrive && (
              <button
                onClick={onSaveToDrive}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal text-white rounded hover:bg-teal-dark text-sm"
              >
                <FileText size={16} />
                Drive
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-gray-600 hover:bg-gray-200 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="px-6 py-3 bg-cashmere-light border-b border-cashmere">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-boysenberry">Total Sheets:</span>
              <span className="ml-2 font-semibold">{stats.totalSheets}</span>
            </div>
            <div>
              <span className="text-boysenberry">Total Panels:</span>
              <span className="ml-2 font-semibold">{stats.totalPanels}</span>
            </div>
            <div>
              <span className="text-boysenberry">Avg Utilization:</span>
              <span className="ml-2 font-semibold">{stats.averageUtilization.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-boysenberry">Total Waste:</span>
              <span className="ml-2 font-semibold">{formatNumber(stats.totalWastedArea)} mm²</span>
            </div>
            <div>
              <span className="text-boysenberry">Cut Length:</span>
              <span className="ml-2 font-semibold">{formatNumber(stats.totalCutLength)} mm</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" ref={reportRef}>
          {viewMode === 'single' ? (
            /* Single Sheet View */
            <div>
              {/* Sheet Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePrevSheet}
                  disabled={currentSheet === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Sheet {currentSheet + 1} of {sheetLayouts.length}
                </span>
                <button
                  onClick={handleNextSheet}
                  disabled={currentSheet === sheetLayouts.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Sheet Info */}
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {currentLayout.material} - {currentLayout.width}×{currentLayout.height}mm
                    </h3>
                    <p className="text-sm text-gray-600">
                      Thickness: {currentLayout.thickness}mm | {currentLayout.placements.length} panels
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-boysenberry">
                      {currentLayout.utilization.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">utilization</div>
                  </div>
                </div>
              </div>

              {/* Cutting Diagram */}
              <div className="flex justify-center mb-6 overflow-x-auto">
                <CuttingDiagram 
                  sheetLayout={currentLayout} 
                  scale={scale}
                  showLabels={true}
                  showDimensions={true}
                  showEdgeBanding={true}
                  showGrainPattern={true}
                />
              </div>

              {/* Panel List */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-900">Panels on this sheet</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Ref</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Label</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Size (L×W)</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">Grain</th>
                        <th className="px-3 py-2 text-center font-medium text-gray-700">Rotated</th>
                        <th className="px-3 py-2 text-right font-medium text-gray-700">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentLayout.placements.map((placement, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-bold">{getLetterLabel(index)}</td>
                          <td className="px-3 py-2">{placement.label}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {placement.panel.length}×{placement.panel.width}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {placement.panel.grain === 0 ? '→' : placement.panel.grain === 1 ? '↓' : '-'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {placement.rotated ? '↻' : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-gray-500">
                            ({placement.x}, {placement.y})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheet Statistics */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Used Area:</span>
                    <span className="ml-2 font-mono">{formatNumber(currentLayout.usedArea)} mm²</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Waste Area:</span>
                    <span className="ml-2 font-mono">{formatNumber(currentLayout.wastedArea)} mm²</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cuts:</span>
                    <span className="ml-2 font-mono">{currentLayout.cuts.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cut Length:</span>
                    <span className="ml-2 font-mono">
                      {formatNumber(currentLayout.cuts.reduce((sum, cut) => {
                        return sum + (cut.type === 'horizontal' 
                          ? Math.abs(cut.x2 - cut.x1)
                          : Math.abs(cut.y2 - cut.y1));
                      }, 0))} mm
                    </span>
                  </div>
                </div>
              </div>

              {/* Edge Banding & Grain Key */}
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-1 bg-red-700 rounded"></div>
                    <span className="text-gray-600">2.0mm Edge (Thick)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-700 rounded" style={{ borderStyle: 'dashed' }}></div>
                    <span className="text-gray-600">0.4mm Edge (Thin)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">↕</span>
                    <span className="text-gray-600">Vertical Grain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">↔</span>
                    <span className="text-gray-600">Horizontal Grain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-gray-400 rounded"></div>
                    <span className="text-gray-600">Vertical Grain Panel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-100 border border-gray-400 rounded"></div>
                    <span className="text-gray-600">Horizontal Grain Panel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-gray-400 rounded"></div>
                    <span className="text-gray-600">Usable Offcut</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #ccc 2px, #ccc 3px)' }}></div>
                    <span className="text-gray-600">Waste Area</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* All Sheets View */
            <div className="space-y-8">
              {sheetLayouts.map((layout, sheetIndex) => (
                <div key={layout.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Sheet Header */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Sheet {sheetIndex + 1}: {layout.material}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {layout.width}×{layout.height}mm | {layout.thickness}mm thick | {layout.placements.length} panels
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {layout.utilization.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Diagram */}
                  <div className="p-4 flex justify-center bg-white">
                    <CuttingDiagram 
                      sheetLayout={layout} 
                      scale={scale * 0.8}
                      showLabels={true}
                      showDimensions={false}
                      showEdgeBanding={true}
                      showGrainPattern={true}
                    />
                  </div>

                  {/* Panel Summary */}
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm">
                    <span className="text-gray-600">Panels: </span>
                    {layout.placements.map((p, i) => (
                      <span key={i} className="inline-block mr-2">
                        <span className="font-bold">{getLetterLabel(i)}</span>
                        <span className="text-gray-500">({p.label})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span>Generated: {new Date().toLocaleString()}</span>
            <span>Dawin Cutlist Processor v1.2</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationReport;
