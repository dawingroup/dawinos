/**
 * Project Dialog
 * Dialog for creating, editing, and deleting design projects
 */

import { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { createProject, updateProject, deleteProject } from '../../services/firestore';
import { formatProjectCode } from '../../utils/formatting';
import { useCustomers } from '@/modules/customer-hub/hooks';
import type { DesignProject } from '../../types';

export interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  project?: DesignProject | null; // If provided, dialog is in edit mode
  onDeleted?: () => void; // Callback when project is deleted
}

export function ProjectDialog({ open, onClose, userId, project, onDeleted }: ProjectDialogProps) {
  const { customers } = useCustomers({ status: 'active' });
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'on-hold' | 'completed' | 'cancelled'>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditMode = !!project;

  // Populate form when editing
  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setCustomerId(project.customerId || '');
      setCustomerName(project.customerName || '');
      setDescription(project.description || '');
      setStatus(project.status || 'active');
    } else {
      setName('');
      setCustomerId('');
      setCustomerName('');
      setDescription('');
      setStatus('active');
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [project, open]);

  // Handle customer selection
  const handleCustomerChange = (selectedId: string) => {
    setCustomerId(selectedId);
    if (selectedId) {
      const selected = customers.find(c => c.id === selectedId);
      setCustomerName(selected?.name || '');
    } else {
      setCustomerName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode && project) {
        // Update existing project
        await updateProject(project.id, {
          name: name.trim(),
          description: description.trim(),
          customerId: customerId || undefined,
          customerName: customerName.trim() || undefined,
          status,
        }, userId);
      } else {
        // Create new project
        const year = new Date().getFullYear();
        const sequence = Math.floor(Math.random() * 900) + 100;
        
        await createProject({
          code: formatProjectCode(year, sequence),
          name: name.trim(),
          description: description.trim(),
          customerId: customerId || undefined,
          customerName: customerName.trim() || undefined,
          status: 'active',
        }, userId);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} project`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project) return;

    try {
      setLoading(true);
      setError(null);
      await deleteProject(project.id);
      onClose();
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setShowDeleteConfirm(false);
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
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? 'Edit Project' : 'New Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm ? (
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Delete Project?</h3>
                <p className="text-sm text-red-700 mt-1">
                  This will permanently delete "{project?.name}" and all its design items, 
                  deliverables, and approvals. This action cannot be undone.
                </p>
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className={cn(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg',
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {loading ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g., Kitchen Renovation - Smith"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select a customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                <a href="/customers" className="text-primary hover:underline">Manage customers</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Brief description of the project..."
              />
            </div>

            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {isEditMode ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex items-center gap-3">
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
                      : 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {loading ? (isEditMode ? 'Saving...' : 'Creating...') : (isEditMode ? 'Save Changes' : 'Create Project')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProjectDialog;
