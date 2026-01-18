/**
 * Requisitions Page - List and manage project requisitions
 */

import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Wallet,
  MinusCircle,
} from 'lucide-react';
import { useProjectRequisitions } from '../hooks/payment-hooks';
import { Requisition, AccountabilityStatus } from '../types/requisition';
import { PaymentStatus } from '../types/payment';
import { db } from '@/core/services/firebase';

type FilterStatus = 'all' | PaymentStatus;
type AccountabilityFilter = 'all' | AccountabilityStatus;

const STATUS_COLORS: Record<PaymentStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processing: 'bg-purple-100 text-purple-700',
  paid: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-600',
};

const ACCOUNTABILITY_STATUS_CONFIG: Record<AccountabilityStatus, { color: string; icon: React.ElementType; label: string }> = {
  not_required: { color: 'bg-gray-100 text-gray-600', icon: MinusCircle, label: 'Not Required' },
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  partial: { color: 'bg-blue-100 text-blue-700', icon: AlertTriangle, label: 'Partial' },
  complete: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Complete' },
  overdue: { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Overdue' },
};

function formatCurrency(amount: number, currency: string = 'UGX'): string {
  if (amount >= 1000000000) return `${currency} ${(amount / 1000000000).toFixed(2)}B`;
  if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(1)}K`;
  return `${currency} ${amount.toLocaleString()}`;
}

function formatDate(date: Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

interface RequisitionCardProps {
  requisition: Requisition;
}

function RequisitionCard({ requisition }: RequisitionCardProps) {
  const accountabilityConfig = ACCOUNTABILITY_STATUS_CONFIG[requisition.accountabilityStatus];
  const AccountabilityIcon = accountabilityConfig.icon;

  return (
    <Link
      to={`/advisory/delivery/requisitions/${requisition.id}`}
      className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-purple-50 rounded-lg">
          <Receipt className="w-5 h-5 text-purple-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{requisition.requisitionNumber}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_COLORS[requisition.status]}`}>
              {requisition.status.replace('_', ' ')}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-1">{requisition.purpose}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-1 font-medium">{formatCurrency(requisition.grossAmount, requisition.currency)}</span>
            </div>
            <div>
              <span className="text-gray-500">Items:</span>
              <span className="ml-1">{requisition.items?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Due:</span>
              <span className="ml-1">{formatDate(requisition.accountabilityDueDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <AccountabilityIcon className={`w-4 h-4 ${accountabilityConfig.color.split(' ')[1]}`} />
              <span className={`text-xs ${accountabilityConfig.color.split(' ')[1]}`}>
                {accountabilityConfig.label}
              </span>
            </div>
          </div>

          {requisition.unaccountedAmount > 0 && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Wallet className="w-4 h-4 text-amber-500" />
              <span className="text-amber-600">
                {formatCurrency(requisition.unaccountedAmount, requisition.currency)} unaccounted
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
}

export function RequisitionsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [accountabilityFilter, setAccountabilityFilter] = useState<AccountabilityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { requisitions, byAccountabilityStatus, loading, error } = useProjectRequisitions(db, projectId || null);

  const filteredRequisitions = useMemo(() => {
    let result = [...requisitions];

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (accountabilityFilter !== 'all') {
      result = result.filter(r => r.accountabilityStatus === accountabilityFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.requisitionNumber.toLowerCase().includes(query) ||
        r.purpose.toLowerCase().includes(query)
      );
    }

    return result;
  }, [requisitions, statusFilter, accountabilityFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: requisitions.length,
    pending: byAccountabilityStatus.pending.length,
    partial: byAccountabilityStatus.partial.length,
    overdue: byAccountabilityStatus.overdue.length,
    complete: byAccountabilityStatus.complete.length,
    totalAmount: requisitions.reduce((sum, r) => sum + r.grossAmount, 0),
    unaccountedAmount: requisitions.reduce((sum, r) => sum + (r.unaccountedAmount || 0), 0),
  }), [requisitions, byAccountabilityStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading requisitions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-600">
            {stats.total} requisition{stats.total !== 1 ? 's' : ''} • 
            Total: {formatCurrency(stats.totalAmount)}
            {stats.unaccountedAmount > 0 && (
              <span className="text-amber-600 ml-2">
                ({formatCurrency(stats.unaccountedAmount)} unaccounted)
              </span>
            )}
          </p>
        </div>

        <button
          onClick={() => navigate(`/advisory/delivery/projects/${projectId}/requisitions/new`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Requisition
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setAccountabilityFilter('all')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            accountabilityFilter === 'all' ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">All</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </button>

        <button
          onClick={() => setAccountabilityFilter('pending')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            accountabilityFilter === 'pending' ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <div className="text-2xl font-bold">{stats.pending}</div>
        </button>

        <button
          onClick={() => setAccountabilityFilter('partial')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            accountabilityFilter === 'partial' ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Partial</span>
          </div>
          <div className="text-2xl font-bold">{stats.partial}</div>
        </button>

        <button
          onClick={() => setAccountabilityFilter('overdue')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            accountabilityFilter === 'overdue' ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">Overdue</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </button>

        <button
          onClick={() => setAccountabilityFilter('complete')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            accountabilityFilter === 'complete' ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Complete</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{stats.complete}</div>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by requisition number or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
            className="px-3 py-2 border rounded-lg bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requisitions List */}
      {filteredRequisitions.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {requisitions.length === 0 ? 'No Requisitions Yet' : 'No Results Found'}
          </h3>
          <p className="text-gray-600 mb-4">
            {requisitions.length === 0
              ? 'Create your first requisition to request funds for project activities.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {requisitions.length === 0 && (
            <button
              onClick={() => navigate(`/advisory/delivery/projects/${projectId}/requisitions/new`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="w-4 h-4" />
              Create Requisition
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequisitions.map(requisition => (
            <RequisitionCard key={requisition.id} requisition={requisition} />
          ))}
        </div>
      )}
    </div>
  );
}

export default RequisitionsPage;
