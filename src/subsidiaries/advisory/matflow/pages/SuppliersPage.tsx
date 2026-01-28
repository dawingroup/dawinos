/**
 * Suppliers Page
 * Supplier management with CRUD operations and performance tracking
 */

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useSuppliers, useCreateSupplier } from '../hooks/supplier-hooks';
import { useAuth } from '@/shared/hooks';
import type { Supplier, SupplierStatus } from '../types/supplier';
import type { CreateSupplierInput } from '../services/supplier-service';

type TabType = 'all' | 'active' | 'inactive';

const TAB_CONFIG: Record<TabType, { label: string }> = {
  all: { label: 'All Suppliers' },
  active: { label: 'Active' },
  inactive: { label: 'Inactive' },
};

const STATUS_CONFIG: Record<SupplierStatus, { label: string; color: string; icon: React.ElementType }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  pending_approval: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  blacklisted: { label: 'Blacklisted', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

interface SupplierCardProps {
  supplier: Supplier;
  onClick: () => void;
}

function SupplierCard({ supplier, onClick }: SupplierCardProps) {
  const statusConfig = STATUS_CONFIG[supplier.status] || STATUS_CONFIG.active;
  const StatusIcon = statusConfig.icon;

  return (
    <div
      onClick={onClick}
      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{supplier.name}</span>
            {supplier.rating && supplier.rating >= 4 && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            {supplier.categories?.length > 0 && (
              <span className="text-xs text-gray-500 capitalize">{supplier.categories[0]}</span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>

      {/* Contact Info */}
      <div className="space-y-1 text-sm mb-3">
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="w-4 h-4" />
          {supplier.phone}
        </div>
        {supplier.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4" />
            {supplier.email}
          </div>
        )}
        {supplier.address && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            {supplier.address.city}
          </div>
        )}
      </div>

      {/* Performance */}
      <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {supplier.totalOrders || 0}
          </div>
          <div className="text-xs text-gray-500">Orders</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">
            {supplier.onTimeDeliveryRate 
              ? Math.round(supplier.onTimeDeliveryRate * 100)
              : 0}%
          </div>
          <div className="text-xs text-gray-500">On-Time</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-lg font-semibold text-amber-600">
            <Star className="w-4 h-4 fill-amber-500" />
            {supplier.rating?.toFixed(1) || '-'}
          </div>
          <div className="text-xs text-gray-500">Rating</div>
        </div>
      </div>
    </div>
  );
}

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplierInput) => Promise<void>;
  loading: boolean;
}

function NewSupplierModal({ isOpen, onClose, onSubmit, loading }: NewSupplierModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('materials');
  const [city, setCity] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = `SUP-${Date.now().toString(36).toUpperCase()}`;
    await onSubmit({
      code,
      name,
      contactPerson,
      email,
      phone,
      category: category as 'materials' | 'equipment' | 'services' | 'subcontractor' | 'other',
      address: {
        line1: '',
        city,
        country: 'Uganda',
      },
      categories: [category],
      createdBy: '', // Will be set by parent
    });
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setCategory('materials');
    setCity('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Add New Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Primary contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="materials">Materials</option>
              <option value="equipment">Equipment</option>
              <option value="services">Services</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="+256..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="email@example.com (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Kampala"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !phone}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const { suppliers, loading, error, refresh } = useSuppliers();
  const { createSupplier, creating } = useCreateSupplier();

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers;

    // Tab filter
    switch (activeTab) {
      case 'active':
        result = result.filter(s => s.status === 'active');
        break;
      case 'inactive':
        result = result.filter(s => s.status === 'inactive' || s.status === 'blacklisted');
        break;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.code?.toLowerCase().includes(query) ||
        s.phone?.includes(query) ||
        s.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [suppliers, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    avgRating: suppliers.length > 0
      ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
      : '0',
  }), [suppliers]);

  const handleCreateSupplier = async (data: CreateSupplierInput) => {
    await createSupplier({
      ...data,
      createdBy: user?.uid || 'unknown',
    });
    refresh();
  };

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Manage suppliers and track performance"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Suppliers' },
        ]}
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600 mb-1">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-600 mb-1">Avg. Rating</div>
            <div className="flex items-center gap-1 text-2xl font-bold text-amber-600">
              <Star className="w-5 h-5 fill-amber-500" />
              {stats.avgRating}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-1">
            {(Object.keys(TAB_CONFIG) as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {TAB_CONFIG[tab].label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-lg border p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500 mb-4">
              {suppliers.length === 0
                ? 'Add your first supplier to start tracking.'
                : 'No suppliers match your current filters.'}
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map(supplier => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onClick={() => console.log('View supplier:', supplier.id)}
              />
            ))}
          </div>
        )}
      </div>

      <NewSupplierModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={handleCreateSupplier}
        loading={creating}
      />
    </div>
  );
};

export default SuppliersPage;
