/**
 * Purchase Orders List Page
 * Styled to match DawinOS Finishes design system
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingCart, ExternalLink, ArrowLeft, Plus } from 'lucide-react';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { PO_STATUS_LABELS } from '../types/purchaseOrder';
import type { PurchaseOrderStatus } from '../types/purchaseOrder';
import { CreatePurchaseOrderDialog } from '../components/po/CreatePurchaseOrderDialog';
import { useAuth } from '@/shared/hooks/useAuth';

const SUBSIDIARY_ID = 'finishes';

const STATUS_CONFIG: Record<PurchaseOrderStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  'pending-approval': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-blue-100', text: 'text-blue-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
  sent: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'partially-received': { bg: 'bg-amber-100', text: 'text-amber-700' },
  received: { bg: 'bg-green-100', text: 'text-green-700' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const filters = {
    search: search || undefined,
    status: statusFilter ? (statusFilter as PurchaseOrderStatus) : undefined,
  };

  const { orders, loading } = usePurchaseOrders(SUBSIDIARY_ID, filters);

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manufacturing"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage supplier orders and deliveries</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create PO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[160px]"
          >
            <option value="">All Statuses</option>
            {Object.entries(PO_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-500">
        {orders.length} order{orders.length !== 1 ? 's' : ''}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            className="ml-2 text-primary hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No purchase orders found</h3>
          <p className="text-gray-500 mt-1">
            {search || statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first purchase order to get started'}
          </p>
          {!search && !statusFilter && (
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 text-primary hover:underline"
            >
              Create Purchase Order
            </button>
          )}
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Landed Cost
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grand Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((po) => {
                  const statusConfig = STATUS_CONFIG[po.status];

                  return (
                    <tr
                      key={po.id}
                      onClick={() => navigate(`/manufacturing/purchase-orders/${po.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{po.poNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{po.supplierName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {PO_STATUS_LABELS[po.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-600">
                          {formatCurrency(po.totals.subtotal, po.totals.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-gray-600">
                          {formatCurrency(po.totals.landedCostTotal, po.totals.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(po.totals.grandTotal, po.totals.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manufacturing/purchase-orders/${po.id}`);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <CreatePurchaseOrderDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={(poId) => navigate(`/manufacturing/purchase-orders/${poId}`)}
        subsidiaryId={SUBSIDIARY_ID}
        userId={user?.uid ?? ''}
      />
    </div>
  );
}
