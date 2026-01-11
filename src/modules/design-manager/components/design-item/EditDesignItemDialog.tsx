/**
 * Edit Design Item Dialog
 * Dialog for editing an existing design item's basic information
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { updateDesignItem } from '../../services/firestore';
import type { DesignCategory, DesignItem } from '../../types';
import { CATEGORY_LABELS } from '../../utils/formatting';

export interface EditDesignItemDialogProps {
  open: boolean;
  onClose: () => void;
  item: DesignItem;
  projectId: string;
  userId: string;
}

const categories: DesignCategory[] = ['casework', 'furniture', 'millwork', 'doors', 'fixtures', 'specialty'];
const priorities = ['low', 'medium', 'high', 'urgent'] as const;
const sourcingTypes: Array<DesignItem['sourcingType']> = ['MANUFACTURED', 'PROCURED'];

export function EditDesignItemDialog({ 
  open, 
  onClose, 
  item,
  projectId, 
  userId 
}: EditDesignItemDialogProps) {
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<DesignCategory>(item.category);
  const [description, setDescription] = useState(item.description || '');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(item.priority || 'medium');
  const [sourcingType, setSourcingType] = useState<DesignItem['sourcingType']>((item as any).sourcingType || 'MANUFACTURED');
  const [requiredQuantity, setRequiredQuantity] = useState<number>((item as any).requiredQuantity || 1);
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize due date from item
  useEffect(() => {
    if (item.dueDate) {
      const date = new Date(item.dueDate.seconds * 1000);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [item.dueDate]);

  // Reset form when item changes
  useEffect(() => {
    setName(item.name);
    setCategory(item.category);
    setDescription(item.description || '');
    setPriority(item.priority || 'medium');
    setSourcingType((item as any).sourcingType || 'MANUFACTURED');
    setRequiredQuantity((item as any).requiredQuantity || 1);
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateDesignItem(projectId, item.id, {
        name: name.trim(),
        category,
        description: description.trim(),
        priority,
        sourcingType,
        requiredQuantity: requiredQuantity || 1,
        dueDate: dueDate ? { seconds: new Date(dueDate).getTime() / 1000, nanoseconds: 0 } : undefined,
      } as any, userId);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Design Item</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
              placeholder="e.g., Kitchen Island Unit"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DesignCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Quantity
              </label>
              <input
                type="number"
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sourcing Type
            </label>
            <select
              value={sourcingType}
              onChange={(e) => setSourcingType(e.target.value as DesignItem['sourcingType'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
            >
              {sourcingTypes.map((st) => (
                <option key={st} value={st}>
                  {st === 'MANUFACTURED' ? 'Manufactured' : 'Procured'}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A7C8E] focus:border-transparent resize-none"
              placeholder="Brief description of the design item..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'px-4 py-2 text-sm font-medium text-white rounded-lg',
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#0A7C8E] hover:bg-[#086a7a]'
              )}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDesignItemDialog;
