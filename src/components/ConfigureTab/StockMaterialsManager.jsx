/**
 * Stock Materials Manager Component
 * Manage persistent stock materials list
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Loader2, Package } from 'lucide-react';
import { 
  getStockMaterials, 
  addStockMaterial, 
  updateStockMaterial, 
  deleteStockMaterial 
} from '../../services/stockMaterialsService';

const StockMaterialsManager = ({ isOpen, onClose }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    thickness: 18,
    sheetLength: 2440,
    sheetWidth: 1220,
    category: 'Board'
  });

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getStockMaterials();
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.displayName.trim()) return;
    
    setSaving(true);
    try {
      const newMaterial = await addStockMaterial(formData);
      setMaterials(prev => [...prev, newMaterial]);
      setFormData({ displayName: '', thickness: 18, sheetLength: 2440, sheetWidth: 1220, category: 'Board' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add material:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    setSaving(true);
    try {
      await updateStockMaterial(id, formData);
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, ...formData } : m));
      setEditingId(null);
    } catch (error) {
      console.error('Failed to update material:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this stock material?')) return;
    
    try {
      await deleteStockMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  const startEdit = (material) => {
    setEditingId(material.id);
    setFormData({
      displayName: material.displayName,
      thickness: material.thickness,
      sheetLength: material.sheetLength,
      sheetWidth: material.sheetWidth,
      category: material.category || 'Board'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ displayName: '', thickness: 18, sheetLength: 2440, sheetWidth: 1220, category: 'Board' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-900">Stock Materials</h3>
            <span className="text-sm text-gray-500">({materials.length} materials)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map(material => (
                <div key={material.id} className="border border-gray-200 rounded-lg p-3">
                  {editingId === material.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="Material name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Thickness (mm)</label>
                          <input
                            type="number"
                            value={formData.thickness}
                            onChange={(e) => setFormData(prev => ({ ...prev, thickness: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Length (mm)</label>
                          <input
                            type="number"
                            value={formData.sheetLength}
                            onChange={(e) => setFormData(prev => ({ ...prev, sheetLength: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Width (mm)</label>
                          <input
                            type="number"
                            value={formData.sheetWidth}
                            onChange={(e) => setFormData(prev => ({ ...prev, sheetWidth: parseInt(e.target.value) || 0 }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Category</label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="Board">Board</option>
                            <option value="Melamine">Melamine</option>
                            <option value="Backer">Backer</option>
                            <option value="Veneer">Veneer</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={cancelEdit} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleUpdate(material.id)} 
                          disabled={saving}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{material.displayName}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {material.thickness}mm • {material.sheetLength}x{material.sheetWidth} • {material.category}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => startEdit(material)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(material.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add New Form */}
              {showAddForm ? (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 bg-blue-50">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="New material name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      autoFocus
                    />
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">Thickness (mm)</label>
                        <input
                          type="number"
                          value={formData.thickness}
                          onChange={(e) => setFormData(prev => ({ ...prev, thickness: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Length (mm)</label>
                        <input
                          type="number"
                          value={formData.sheetLength}
                          onChange={(e) => setFormData(prev => ({ ...prev, sheetLength: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Width (mm)</label>
                        <input
                          type="number"
                          value={formData.sheetWidth}
                          onChange={(e) => setFormData(prev => ({ ...prev, sheetWidth: parseInt(e.target.value) || 0 }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="Board">Board</option>
                          <option value="Melamine">Melamine</option>
                          <option value="Backer">Backer</option>
                          <option value="Veneer">Veneer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
                        Cancel
                      </button>
                      <button 
                        onClick={handleAdd} 
                        disabled={saving || !formData.displayName.trim()}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {saving ? 'Adding...' : 'Add Material'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-3 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Stock Material
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMaterialsManager;
