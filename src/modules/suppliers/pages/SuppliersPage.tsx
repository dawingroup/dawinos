/**
 * Unified Suppliers Page
 *
 * Supplier management with CRUD operations and performance tracking.
 * Supports subsidiary filtering for cross-platform access.
 *
 * Migrated from: src/subsidiaries/advisory/matflow/pages/SuppliersPage.tsx
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
  Filter,
} from 'lucide-react';
import { useSuppliers, useCreateSupplier } from '../hooks/useSuppliers';
import { useAuth } from '@/shared/hooks';
import type { Supplier, SupplierStatus, CreateSupplierInput, SubsidiaryId } from '../types/supplier';
import { SUBSIDIARY_CONFIG } from '../types/supplier';

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
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{supplier.name || supplier.code}</span>
            {supplier.rating && supplier.rating >= 4 && (
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusConfig.color}`}
            >
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
            {supplier.categories?.length > 0 && (
              <span className="text-xs text-gray-500 capitalize">{supplier.categories[0]}</span>
            )}
            {supplier.subsidiaries && supplier.subsidiaries.length > 0 && !supplier.subsidiaries.includes('all') && (
              <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                {supplier.subsidiaries.map(s => SUBSIDIARY_CONFIG[s]?.label.split(' ')[1] || s).join(', ')}
              </span>
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
        {supplier.address?.city && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            {supplier.address.city}
          </div>
        )}
      </div>

      {/* Performance */}
      <div className="pt-3 border-t grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{supplier.totalOrders || 0}</div>
          <div className="text-xs text-gray-500">Orders</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-green-600">
            {supplier.onTimeDeliveryRate ? Math.round(supplier.onTimeDeliveryRate * 100) : 0}%
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
  defaultSubsidiary?: SubsidiaryId;
}

function NewSupplierModal({ isOpen, onClose, onSubmit, loading, defaultSubsidiary }: NewSupplierModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('materials');
  const [city, setCity] = useState('');
  const [subsidiaries, setSubsidiaries] = useState<SubsidiaryId[]>(
    defaultSubsidiary ? [defaultSubsidiary] : ['all']
  );

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
      subsidiaries,
      createdBy: '', // Will be set by parent
    });
    // Reset form
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setCategory('materials');
    setCity('');
    setSubsidiaries(defaultSubsidiary ? [defaultSubsidiary] : ['all']);
    onClose();
  };

  const toggleSubsidiary = (sub: SubsidiaryId) => {
    if (sub === 'all') {
      setSubsidiaries(['all']);
    } else {
      const newSubs = subsidiaries.filter(s => s !== 'all');
      if (newSubs.includes(sub)) {
        const filtered = newSubs.filter(s => s !== sub);
        setSubsidiaries(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSubsidiaries([...newSubs, sub]);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add New Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Primary contact name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+256..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="email@example.com (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Kampala"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SUBSIDIARY_CONFIG) as SubsidiaryId[]).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => toggleSubsidiary(sub)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    subsidiaries.includes(sub)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                  }`}
                >
                  {SUBSIDIARY_CONFIG[sub].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !phone}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adding...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SuppliersPageProps {
  subsidiaryId?: SubsidiaryId;
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const SuppliersPage: React.FC<SuppliersPageProps> = ({
  subsidiaryId,
  title = 'Suppliers',
  breadcrumbs,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [subsidiaryFilter, setSubsidiaryFilter] = useState<SubsidiaryId | undefined>(subsidiaryId);

  const { suppliers, loading, error, refresh } = useSuppliers({
    subsidiaryId: subsidiaryFilter,
  });
  const { createSupplier, creating } = useCreateSupplier();

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let result = suppliers;

    // Tab filter
    switch (activeTab) {
      case 'active':
        result = result.filter((s) => s.status === 'active');
        break;
      case 'inactive':
        result = result.filter((s) => s.status === 'inactive' || s.status === 'blacklisted');
        break;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.code?.toLowerCase().includes(query) ||
          s.phone?.includes(query) ||
          s.email?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [suppliers, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(
    () => ({
      total: suppliers.length,
      active: suppliers.filter((s) => s.status === 'active').length,
      avgRating:
        suppliers.length > 0
          ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
          : '0',
    }),
    [suppliers]
  );

  const handleCreateSupplier = async (data: CreateSupplierInput) => {
    await createSupplier({
      ...data,
      createdBy: user?.uid || 'unknown',
    });
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-primary">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">Manage suppliers and track performance</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Total Suppliers</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-1">Avg. Rating</div>
            <div className="flex items-center gap-1 text-2xl font-bold text-amber-600">
              <Star className="w-5 h-5 fill-amber-500" />
              {stats.avgRating}
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tabs */}
          <div className="border-b sm:border-b-0 flex-1">
            <div className="flex gap-1">
              {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {TAB_CONFIG[tab].label}
                </button>
              ))}
            </div>
          </div>

          {/* Subsidiary Filter (only show if not locked to a specific subsidiary) */}
          {!subsidiaryId && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={subsidiaryFilter || ''}
                onChange={(e) => setSubsidiaryFilter((e.target.value as SubsidiaryId) || undefined)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Subsidiaries</option>
                <option value="finishes">Finishes</option>
                <option value="advisory">Advisory</option>
                <option value="matflow">Matflow</option>
              </select>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500 mb-4">
              {suppliers.length === 0
                ? 'Add your first supplier to start tracking.'
                : 'No suppliers match your current filters.'}
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
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
        defaultSubsidiary={subsidiaryId}
      />
    </div>
  );
};

export default SuppliersPage;
