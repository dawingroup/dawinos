import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Package, Filter, RotateCcw } from 'lucide-react';
import { useOffcuts } from '../contexts/OffcutContext';
import { useConfig } from '../contexts/ConfigContext';

const OffcutManager = ({ isOpen, onClose }) => {
  const { 
    offcuts, 
    availableOffcuts, 
    usedOffcuts,
    addOffcut, 
    updateOffcut, 
    removeOffcut,
    markAsUsed,
    markAsAvailable,
    availableCount
  } = useOffcuts();
  
  const { stockSheets } = useConfig();

  const [filter, setFilter] = useState('all'); // 'all', 'available', 'used'
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const [newOffcut, setNewOffcut] = useState({
    material: stockSheets[0]?.material || 'Blockboard',
    thickness: 18,
    length: 0,
    width: 0,
    quantity: 1,
    sourceProject: '',
    notes: ''
  });

  const handleAddOffcut = () => {
    if (newOffcut.length > 0 && newOffcut.width > 0) {
      addOffcut(newOffcut);
      setNewOffcut({
        material: newOffcut.material,
        thickness: newOffcut.thickness,
        length: 0,
        width: 0,
        quantity: 1,
        sourceProject: '',
        notes: ''
      });
    }
  };

  const handleDelete = (id) => {
    removeOffcut(id);
    setShowDeleteConfirm(null);
  };

  const filteredOffcuts = offcuts.filter(o => {
    if (filter === 'available') return o.available;
    if (filter === 'used') return !o.available;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="text-green-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Offcut Inventory</h2>
              <p className="text-sm text-gray-500">
                {availableCount} available offcut{availableCount !== 1 ? 's' : ''} in stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Offcut Form */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <Plus size={16} />
              Add New Offcut
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Material</label>
                <select
                  value={newOffcut.material}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                >
                  {stockSheets.map(sheet => (
                    <option key={sheet.id} value={sheet.material}>{sheet.material}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Length (mm) *</label>
                <input
                  type="number"
                  value={newOffcut.length || ''}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, length: parseInt(e.target.value) || 0 }))}
                  placeholder="Length"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Width (mm) *</label>
                <input
                  type="number"
                  value={newOffcut.width || ''}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                  placeholder="Width"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Thickness (mm)</label>
                <input
                  type="number"
                  value={newOffcut.thickness}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, thickness: parseInt(e.target.value) || 0 }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newOffcut.quantity}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Source Project</label>
                <input
                  type="text"
                  value={newOffcut.sourceProject}
                  onChange={(e) => setNewOffcut(prev => ({ ...prev, sourceProject: e.target.value }))}
                  placeholder="e.g., DF-2025-082"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddOffcut}
                  disabled={newOffcut.length <= 0 || newOffcut.width <= 0}
                  className="w-full flex items-center justify-center gap-1 px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-600 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={newOffcut.notes}
                onChange={(e) => setNewOffcut(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Left over from dining table project"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Filter size={16} className="text-gray-500" />
            <div className="flex gap-1">
              {[
                { id: 'all', label: `All (${offcuts.length})` },
                { id: 'available', label: `Available (${availableOffcuts.length})` },
                { id: 'used', label: `Used (${usedOffcuts.length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === f.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offcuts Table */}
          {filteredOffcuts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="mx-auto mb-4 text-gray-300" size={48} />
              <p>No offcuts found. Add your first offcut above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Material</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Dimensions (L×W×T)</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Source</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Added</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffcuts.map(offcut => (
                    <tr 
                      key={offcut.id} 
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        !offcut.available ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-medium">{offcut.material}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {offcut.length}×{offcut.width}×{offcut.thickness}
                      </td>
                      <td className="px-3 py-2 text-right">{offcut.quantity}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {offcut.sourceProject || '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-xs">
                        {formatDate(offcut.addedDate)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {offcut.available ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs" title={`Used in ${offcut.usedInProject}`}>
                            Used
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {offcut.available ? (
                            <button
                              onClick={() => markAsUsed(offcut.id, 'Manual')}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Mark as Used"
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => markAsAvailable(offcut.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Restore to Available"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setShowDeleteConfirm(offcut.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-500">
            Offcuts are saved automatically and persist across sessions.
          </p>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Offcut?</h3>
              <p className="text-gray-600 mb-4">
                This will permanently remove this offcut from your inventory.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffcutManager;
