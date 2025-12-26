/**
 * MaterialList Component
 * Display and manage materials at any tier
 */

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Filter } from 'lucide-react';
import { useMaterials, useMaterialMutations } from '../../hooks/useMaterials';
import { MaterialForm } from './MaterialForm';
import { MATERIAL_CATEGORIES } from '../../types/materials';
import type { MaterialTier, MaterialCategory, MaterialFormData, Material } from '../../types/materials';
import { getMaterial } from '../../services/materialService';

interface MaterialListProps {
  tier: MaterialTier;
  scopeId?: string;
  userId: string;
  title?: string;
}

export function MaterialList({ tier, scopeId, userId, title }: MaterialListProps) {
  const { materials, loading, error } = useMaterials({ tier, scopeId });
  const { createMaterial, updateMaterial, deleteMaterial, creating, updating, deleting } = useMaterialMutations(tier, scopeId, userId);
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch = !search || 
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async (data: MaterialFormData) => {
    await createMaterial(data);
    setShowForm(false);
  };

  const handleEdit = async (materialId: string) => {
    const material = await getMaterial(materialId, tier, scopeId);
    if (material) {
      setEditingMaterial(material);
    }
  };

  const handleUpdate = async (data: MaterialFormData) => {
    if (!editingMaterial) return;
    await updateMaterial(editingMaterial.id, data);
    setEditingMaterial(null);
  };

  const handleDelete = async (materialId: string) => {
    await deleteMaterial(materialId);
    setDeleteConfirm(null);
  };

  const tierLabel = tier === 'global' ? 'Global' : tier === 'customer' ? 'Customer' : 'Project';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {title || `${tierLabel} Materials`}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Material
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search materials..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as MaterialCategory | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Categories</option>
            {Object.entries(MATERIAL_CATEGORIES).map(([key, { label, icon }]) => (
              <option key={key} value={key}>{icon} {label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No materials found</h3>
          <p className="text-gray-500 mt-1">
            {search || categoryFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Add your first material to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thickness</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">{material.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{material.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                      {MATERIAL_CATEGORIES[material.category]?.icon}
                      {MATERIAL_CATEGORIES[material.category]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {material.thickness ? `${material.thickness}mm` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {material.unitCost 
                      ? `${material.currency} ${material.unitCost.toLocaleString()}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      material.status === 'active' 
                        ? 'bg-green-100 text-green-700'
                        : material.status === 'discontinued'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {material.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(material.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {deleteConfirm === material.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(material.id)}
                            disabled={deleting}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(material.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Material Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Add {tierLabel} Material</h3>
            </div>
            <div className="p-4">
              <MaterialForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isSubmitting={creating}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Material Dialog */}
      {editingMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Edit Material</h3>
            </div>
            <div className="p-4">
              <MaterialForm
                material={editingMaterial}
                onSubmit={handleUpdate}
                onCancel={() => setEditingMaterial(null)}
                isSubmitting={updating}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialList;
