/**
 * Settings Modal Component
 * Global application settings management
 */

import React, { useState } from 'react';
import { X, Settings, Save, RotateCcw, Ruler, Monitor, Download, Link } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, saving, updateSection, resetToDefaults } = useSettings();
  const [activeTab, setActiveTab] = useState('defaults');
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  const tabs = [
    { id: 'defaults', label: 'Defaults', icon: Ruler },
    { id: 'display', label: 'Display', icon: Monitor },
    { id: 'export', label: 'Export', icon: Download },
    { id: 'integrations', label: 'Integrations', icon: Link },
  ];

  const handleSave = async () => {
    await updateSection(activeTab, localSettings[activeTab]);
  };

  const handleReset = async () => {
    if (confirm('Reset all settings to defaults? This cannot be undone.')) {
      await resetToDefaults();
      setLocalSettings(settings);
    }
  };

  const updateLocalSetting = (section, key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-boysenberry text-white">
          <div className="flex items-center gap-3">
            <Settings size={24} />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-boysenberry border-b-2 border-boysenberry bg-boysenberry/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === 'defaults' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blade Kerf (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.defaults?.bladeKerf || 3.2}
                  onChange={(e) => updateLocalSetting('defaults', 'bladeKerf', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
                <p className="text-xs text-gray-500 mt-1">Width of the saw blade cut</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Offcut Size (mm)
                </label>
                <input
                  type="number"
                  value={localSettings.defaults?.minimumOffcutSize || 300}
                  onChange={(e) => updateLocalSetting('defaults', 'minimumOffcutSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum size to save as reusable offcut</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edge Allowance (mm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localSettings.defaults?.edgeAllowance || 2}
                  onChange={(e) => updateLocalSetting('defaults', 'edgeAllowance', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
                <p className="text-xs text-gray-500 mt-1">Extra allowance for edge banding</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Stock Sheets
                </label>
                <select
                  multiple
                  value={localSettings.defaults?.preferredStockSheets || []}
                  onChange={(e) => updateLocalSetting('defaults', 'preferredStockSheets', 
                    Array.from(e.target.selectedOptions, o => o.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                >
                  <option value="2750x1830">2750 × 1830 mm (PG Bison)</option>
                  <option value="2440x1220">2440 × 1220 mm (Standard)</option>
                  <option value="3050x1830">3050 × 1830 mm (Large)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit System
                </label>
                <select
                  value={localSettings.display?.unitSystem || 'metric'}
                  onChange={(e) => updateLocalSetting('display', 'unitSystem', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                >
                  <option value="metric">Metric (mm)</option>
                  <option value="imperial">Imperial (inches)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                <select
                  value={localSettings.display?.dateFormat || 'DD/MM/YYYY'}
                  onChange={(e) => updateLocalSetting('display', 'dateFormat', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Show Part IDs</label>
                  <p className="text-xs text-gray-500">Display unique part identifiers in tables</p>
                </div>
                <button
                  onClick={() => updateLocalSetting('display', 'showPartIds', !localSettings.display?.showPartIds)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.display?.showPartIds ? 'bg-boysenberry' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.display?.showPartIds ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Drive Folder ID
                </label>
                <input
                  type="text"
                  value={localSettings.export?.defaultDriveFolder || ''}
                  onChange={(e) => updateLocalSetting('export', 'defaultDriveFolder', e.target.value)}
                  placeholder="Google Drive folder ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-Save Interval (seconds)
                </label>
                <input
                  type="number"
                  value={localSettings.export?.autoSaveInterval || 30}
                  onChange={(e) => updateLocalSetting('export', 'autoSaveInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Include Headers in CSV</label>
                  <p className="text-xs text-gray-500">Add column headers to exported CSV files</p>
                </div>
                <button
                  onClick={() => updateLocalSetting('export', 'includeHeadersInCSV', !localSettings.export?.includeHeadersInCSV)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    localSettings.export?.includeHeadersInCSV !== false ? 'bg-boysenberry' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    localSettings.export?.includeHeadersInCSV !== false ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notion Workspace ID
                </label>
                <input
                  type="text"
                  value={localSettings.integrations?.notionWorkspaceId || ''}
                  onChange={(e) => updateLocalSetting('integrations', 'notionWorkspaceId', e.target.value)}
                  placeholder="Your Notion workspace ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Katana API Key
                </label>
                <input
                  type="password"
                  value={localSettings.integrations?.katanaApiKey || ''}
                  onChange={(e) => updateLocalSetting('integrations', 'katanaApiKey', e.target.value)}
                  placeholder="Your Katana MRP API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-boysenberry/50 focus:border-boysenberry"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-boysenberry text-white rounded-lg hover:bg-boysenberry-dark disabled:opacity-50 transition-colors"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
