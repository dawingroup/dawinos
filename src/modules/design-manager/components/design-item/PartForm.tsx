/**
 * PartForm Component
 * Form for adding/editing a single part
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { PartEntry } from '../../types';

interface PartFormProps {
  part?: PartEntry;
  onSave: (data: Partial<PartEntry>) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

export function PartForm({ part, onSave, onClose, loading }: PartFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    length: '',
    width: '',
    thickness: '18',
    quantity: '1',
    materialName: '',
    grainDirection: 'none' as 'length' | 'width' | 'none',
    edgeBanding: { top: false, bottom: false, left: false, right: false },
    notes: '',
  });

  useEffect(() => {
    if (part) {
      setFormData({
        name: part.name,
        length: part.length.toString(),
        width: part.width.toString(),
        thickness: part.thickness.toString(),
        quantity: part.quantity.toString(),
        materialName: part.materialName,
        grainDirection: part.grainDirection,
        edgeBanding: { ...part.edgeBanding },
        notes: part.notes || '',
      });
    }
  }, [part]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Build data object, only including notes if it has a value
    const data: Partial<PartEntry> = {
      name: formData.name,
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      thickness: parseFloat(formData.thickness),
      quantity: parseInt(formData.quantity, 10),
      materialName: formData.materialName,
      grainDirection: formData.grainDirection,
      edgeBanding: formData.edgeBanding,
      source: 'manual',
      hasCNCOperations: false,
    };
    // Only add notes if it has a value (Firestore doesn't accept undefined)
    if (formData.notes) {
      data.notes = formData.notes;
    }
    await onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {part ? 'Edit Part' : 'Add Part'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm) *</label>
              <input
                type="number"
                value={formData.length}
                onChange={(e) => setFormData((f) => ({ ...f, length: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width (mm) *</label>
              <input
                type="number"
                value={formData.width}
                onChange={(e) => setFormData((f) => ({ ...f, width: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thickness (mm)</label>
              <input
                type="number"
                value={formData.thickness}
                onChange={(e) => setFormData((f) => ({ ...f, thickness: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                min="1"
              />
            </div>
          </div>

          {/* Quantity and Material */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
              <input
                type="text"
                value={formData.materialName}
                onChange={(e) => setFormData((f) => ({ ...f, materialName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                placeholder="e.g., 18mm Birch Plywood"
              />
            </div>
          </div>

          {/* Grain Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grain Direction</label>
            <div className="flex gap-4">
              {(['none', 'length', 'width'] as const).map((dir) => (
                <label key={dir} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="grain"
                    checked={formData.grainDirection === dir}
                    onChange={() => setFormData((f) => ({ ...f, grainDirection: dir }))}
                    className="text-primary"
                  />
                  <span className="text-sm text-gray-700 capitalize">{dir}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Edge Banding */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Edge Banding</label>
            <div className="flex gap-4">
              {(['top', 'bottom', 'left', 'right'] as const).map((edge) => (
                <label key={edge} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.edgeBanding[edge]}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        edgeBanding: { ...f.edgeBanding, [edge]: e.target.checked },
                      }))
                    }
                    className="rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm text-gray-700 capitalize">{edge}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : part ? 'Save Changes' : 'Add Part'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PartForm;
