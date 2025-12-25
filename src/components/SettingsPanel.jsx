import React, { useState } from 'react';
import { Settings, Plus, Trash2, RotateCcw, Save, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useConfig } from '../contexts/ConfigContext';

const SettingsPanel = ({ isOpen, onClose }) => {
  const { 
    config, 
    updateConfig, 
    resetToDefaults,
    stockSheets,
    bladeKerf,
    edgeBanding,
    millingConfig,
    outputPreferences
  } = useConfig();

  const [activeSection, setActiveSection] = useState('stockSheets');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [newSheet, setNewSheet] = useState({
    material: '',
    width: 1220,
    height: 2440,
    thickness: 18
  });

  const handleAddSheet = () => {
    if (newSheet.material) {
      const newId = Math.max(...stockSheets.map(s => s.id), 0) + 1;
      updateConfig({
        stockSheets: [...stockSheets, { ...newSheet, id: newId }]
      });
      setNewSheet({ material: '', width: 1220, height: 2440, thickness: 18 });
      showSaveMessage();
    }
  };

  const handleDeleteSheet = (id) => {
    updateConfig({
      stockSheets: stockSheets.filter(s => s.id !== id)
    });
    showSaveMessage();
  };

  const handleUpdateSheet = (id, field, value) => {
    updateConfig({
      stockSheets: stockSheets.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    });
  };

  const handleReset = () => {
    resetToDefaults();
    setShowResetConfirm(false);
    showSaveMessage('Settings reset to defaults');
  };

  const showSaveMessage = (msg = 'Settings saved') => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Configure stock sheets, blade kerf, and preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check size={16} />
                {saveMessage}
              </span>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Section Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 pb-2">
            {[
              { id: 'stockSheets', label: 'Stock Sheets' },
              { id: 'cutting', label: 'Cutting Parameters' },
              { id: 'milling', label: 'Milling Config' },
              { id: 'output', label: 'Output Preferences' },
            ].map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Stock Sheets Section */}
          {activeSection === 'stockSheets' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Define available stock sheet sizes for each material type.
              </p>
              
              {/* Stock Sheets Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Width (mm)</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Height (mm)</th>
                      <th className="px-3 py-2 text-right font-medium text-gray-700">Thickness (mm)</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSheets.map(sheet => (
                      <tr key={sheet.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={sheet.material}
                            onChange={(e) => handleUpdateSheet(sheet.id, 'material', e.target.value)}
                            onBlur={showSaveMessage}
                            className="w-full px-2 py-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={sheet.width}
                            onChange={(e) => handleUpdateSheet(sheet.id, 'width', parseInt(e.target.value) || 0)}
                            onBlur={showSaveMessage}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={sheet.height}
                            onChange={(e) => handleUpdateSheet(sheet.id, 'height', parseInt(e.target.value) || 0)}
                            onBlur={showSaveMessage}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={sheet.thickness}
                            onChange={(e) => handleUpdateSheet(sheet.id, 'thickness', parseInt(e.target.value) || 0)}
                            onBlur={showSaveMessage}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-right"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteSheet(sheet.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Sheet */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newSheet.material}
                  onChange={(e) => setNewSheet(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="Material name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <input
                  type="number"
                  value={newSheet.width}
                  onChange={(e) => setNewSheet(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                  placeholder="Width"
                  className="w-24 px-3 py-2 border border-gray-300 rounded text-right"
                />
                <input
                  type="number"
                  value={newSheet.height}
                  onChange={(e) => setNewSheet(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                  placeholder="Height"
                  className="w-24 px-3 py-2 border border-gray-300 rounded text-right"
                />
                <input
                  type="number"
                  value={newSheet.thickness}
                  onChange={(e) => setNewSheet(prev => ({ ...prev, thickness: parseInt(e.target.value) || 0 }))}
                  placeholder="Thickness"
                  className="w-20 px-3 py-2 border border-gray-300 rounded text-right"
                />
                <button
                  onClick={handleAddSheet}
                  disabled={!newSheet.material}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Cutting Parameters Section */}
          {activeSection === 'cutting' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blade Kerf (mm)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  The width of material removed by the saw blade during cutting.
                </p>
                <input
                  type="number"
                  value={bladeKerf}
                  onChange={(e) => {
                    updateConfig({ bladeKerf: parseFloat(e.target.value) || 0 });
                    showSaveMessage();
                  }}
                  step="0.5"
                  min="0"
                  max="10"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thin Edge Banding (mm)
                  </label>
                  <input
                    type="number"
                    value={edgeBanding.thin}
                    onChange={(e) => {
                      updateConfig({ 
                        edgeBanding: { ...edgeBanding, thin: parseFloat(e.target.value) || 0 }
                      });
                      showSaveMessage();
                    }}
                    step="0.1"
                    min="0"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thick Edge Banding (mm)
                  </label>
                  <input
                    type="number"
                    value={edgeBanding.thick}
                    onChange={(e) => {
                      updateConfig({ 
                        edgeBanding: { ...edgeBanding, thick: parseFloat(e.target.value) || 0 }
                      });
                      showSaveMessage();
                    }}
                    step="0.1"
                    min="0"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Milling Config Section */}
          {activeSection === 'milling' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Configure milling parameters for timber volume calculations.
              </p>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raw Material Thickness (mm)
                  </label>
                  <input
                    type="number"
                    value={millingConfig.rawMaterialThickness}
                    onChange={(e) => {
                      updateConfig({ 
                        millingConfig: { ...millingConfig, rawMaterialThickness: parseFloat(e.target.value) || 0 }
                      });
                      showSaveMessage();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intermediate Thickness (mm)
                  </label>
                  <input
                    type="number"
                    value={millingConfig.intermediateMaterialThickness}
                    onChange={(e) => {
                      updateConfig({ 
                        millingConfig: { ...millingConfig, intermediateMaterialThickness: parseFloat(e.target.value) || 0 }
                      });
                      showSaveMessage();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Defect/Squaring Yield
                  </label>
                  <input
                    type="number"
                    value={millingConfig.defectYield}
                    onChange={(e) => {
                      updateConfig({ 
                        millingConfig: { ...millingConfig, defectYield: parseFloat(e.target.value) || 0 }
                      });
                      showSaveMessage();
                    }}
                    step="0.01"
                    min="0"
                    max="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Calculated Values */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Calculated Values</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Planing Yield:</span>
                    <span className="ml-2 font-mono">
                      {((millingConfig.intermediateMaterialThickness / millingConfig.rawMaterialThickness) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Total Yield:</span>
                    <span className="ml-2 font-mono">
                      {((millingConfig.intermediateMaterialThickness / millingConfig.rawMaterialThickness * millingConfig.defectYield) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-600">Milling Factor:</span>
                    <span className="ml-2 font-mono">
                      {(1 / (millingConfig.intermediateMaterialThickness / millingConfig.rawMaterialThickness * millingConfig.defectYield)).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Output Preferences Section */}
          {activeSection === 'output' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure which output formats to generate and save.
              </p>

              <div className="space-y-3">
                {[
                  { key: 'includePGBison', label: 'Include PG Bison Output' },
                  { key: 'includeCutlistOpt', label: 'Include CutlistOpt Output' },
                  { key: 'includeKatanaBOM', label: 'Include Katana BOM Output' },
                  { key: 'includeTimberBOM', label: 'Include Timber BOM Output' },
                  { key: 'autoSaveToDrive', label: 'Auto-save to Google Drive' },
                ].map(pref => (
                  <label key={pref.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={outputPreferences[pref.key]}
                      onChange={(e) => {
                        updateConfig({
                          outputPreferences: { ...outputPreferences, [pref.key]: e.target.checked }
                        });
                        showSaveMessage();
                      }}
                      className="w-5 h-5 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          <p className="text-sm text-gray-500">
            Settings are saved automatically
          </p>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Settings?</h3>
              <p className="text-gray-600 mb-4">
                This will restore all settings to their default values. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;
