/**
 * Purchase Order Detail Page
 * Full PO view with line items, landed costs, approvals, and goods receipt
 * Styled to match DawinOS Finishes design system
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  CheckCircle,
  Truck,
  Lock,
  XCircle,
  Package,
  Pencil,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { usePurchaseOrder } from '../hooks/usePurchaseOrder';
import { PO_STATUS_LABELS } from '../types/purchaseOrder';
import type { POLineItem, PurchaseOrderStatus } from '../types/purchaseOrder';
import { useAuth } from '@/shared/hooks/useAuth';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { GoodsReceiptDialog } from '../components/po/GoodsReceiptDialog';

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

export default function PurchaseOrderDetailPage() {
  const { poId } = useParams<{ poId: string }>();
  const { user } = useAuth();
  const { order, loading, error, actions } = usePurchaseOrder(poId ?? null, user?.uid ?? '');
  const { warehouses } = useWarehouses('finishes');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  // Line item editing
  const [editing, setEditing] = useState(false);
  const [editLineItems, setEditLineItems] = useState<POLineItem[]>([]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Purchase order not found
        </div>
      </div>
    );
  }

  const wrap = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
    } catch {
      /* hook handles */
    }
    setActionLoading(false);
  };

  const approverName = user?.displayName ?? 'Manager';
  const isDraft = order.status === 'draft';
  const isPending = order.status === 'pending-approval';
  const canEdit = isDraft || isPending;
  const canReceive = order.status === 'sent' || order.status === 'partially-received';
  const canCancel = !['closed', 'cancelled'].includes(order.status);
  const statusConfig = STATUS_CONFIG[order.status];

  // Line item editing helpers
  const startEditing = () => {
    setEditLineItems(order.lineItems.map((li) => ({ ...li })));
    setEditing(true);
  };

  const updateEditLine = (id: string, field: keyof POLineItem, value: string | number) => {
    setEditLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        const updated = { ...li, [field]: value };
        if (field === 'quantity' || field === 'unitCost') {
          updated.totalCost = (updated.quantity || 0) * (updated.unitCost || 0);
        }
        return updated;
      }),
    );
  };

  const addEditLine = () => {
    setEditLineItems((prev) => [
      ...prev,
      {
        id: `LI-${Date.now()}-${prev.length}`,
        description: '',
        quantity: 0,
        unitCost: 0,
        totalCost: 0,
        currency: order.totals.currency,
        unit: 'pcs',
        quantityReceived: 0,
      },
    ]);
  };

  const removeEditLine = (id: string) => {
    setEditLineItems((prev) => prev.filter((li) => li.id !== id));
  };

  const saveLineItems = async () => {
    const valid = editLineItems.filter((li) => li.description && li.quantity > 0);
    if (valid.length === 0) return;
    await wrap(async () => {
      await actions.update({ lineItems: valid });
      setEditing(false);
    });
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return;
    await wrap(() => actions.reject(approverName, rejectNotes));
    setShowRejectDialog(false);
    setRejectNotes('');
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    await wrap(() => actions.cancel(cancelReason));
    setShowCancelDialog(false);
    setCancelReason('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manufacturing/purchase-orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.poNumber}</h1>
            <p className="text-muted-foreground">
              Supplier: {order.supplierName}
              {order.supplierContact && ` — ${order.supplierContact}`}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
        >
          {PO_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
      )}

      {/* Linked References */}
      {(order.linkedMOIds?.length || order.linkedProjectId) && (
        <div className="flex flex-wrap gap-2 items-center">
          {order.linkedMOIds?.map((moId) => (
            <Link
              key={moId}
              to={`/manufacturing/orders/${moId}`}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              MO: {moId.slice(0, 8)}...
            </Link>
          ))}
          {order.linkedProjectId && (
            <Link
              to={`/design/project/${order.linkedProjectId}`}
              className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              View Project
            </Link>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {isDraft && (
          <button
            onClick={() => wrap(() => actions.submitForApproval())}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Submit for Approval
          </button>
        )}
        {isPending && (
          <>
            <button
              onClick={() => wrap(() => actions.approve(approverName))}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </>
        )}
        {order.status === 'approved' && (
          <button
            onClick={() => wrap(() => actions.markSent())}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Truck className="h-4 w-4" />
            Mark as Sent
          </button>
        )}
        {canReceive && (
          <button
            onClick={() => setShowReceiptDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            Receive Goods
          </button>
        )}
        {['received', 'partially-received'].includes(order.status) && (
          <button
            onClick={() => wrap(() => actions.close())}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            Close PO
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Line Items - Full Width */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              {canEdit && !editing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Items
                </button>
              )}
              {editing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={addEditLine}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                  <button
                    onClick={saveLineItems}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        Total
                      </th>
                      <th className="px-4 py-3 w-12" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {editLineItems.map((li) => (
                      <tr key={li.id}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={li.description}
                            onChange={(e) => updateEditLine(li.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={li.sku ?? ''}
                            onChange={(e) => updateEditLine(li.id, 'sku', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={li.quantity}
                            onChange={(e) =>
                              updateEditLine(li.id, 'quantity', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={li.unitCost}
                            onChange={(e) =>
                              updateEditLine(li.id, 'unitCost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {li.totalCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {li.quantityReceived === 0 && (
                            <button
                              onClick={() => removeEditLine(li.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Landed Alloc.
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effective Cost
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Received
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.lineItems.map((li) => (
                      <tr key={li.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{li.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{li.sku ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{li.quantity}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {li.unitCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {li.totalCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {(li.landedCostAllocation ?? 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {(li.effectiveUnitCost ?? li.unitCost).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {li.quantityReceived}/{li.quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Landed Costs */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Landed Costs</h2>
            <div className="space-y-2">
              {[
                ['Shipping', order.landedCosts.shipping],
                ['Customs', order.landedCosts.customs],
                ['Duties', order.landedCosts.duties],
                ['Insurance', order.landedCosts.insurance],
                ['Handling', order.landedCosts.handling],
                ['Other', order.landedCosts.other],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <span className="text-gray-600">{label as string}</span>
                  <span className="text-gray-900">
                    {(value as number).toLocaleString()} {order.landedCosts.currency}
                  </span>
                </div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total Landed</span>
                <span>
                  {order.landedCosts.totalLandedCost.toLocaleString()} {order.landedCosts.currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Distribution: {order.landedCosts.distributionMethod.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Totals</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{order.totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Landed Costs</span>
                <span className="text-gray-900">{order.totals.landedCostTotal.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Grand Total</span>
                <span>
                  {order.totals.grandTotal.toLocaleString()} {order.totals.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Receiving History */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Receiving History ({order.receivingHistory.length})
            </h2>
            {order.receivingHistory.length > 0 ? (
              <div className="space-y-2">
                {order.receivingHistory.map((receipt) => (
                  <div key={receipt.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{receipt.id}</p>
                    <p className="text-xs text-gray-500">
                      {receipt.lines.length} line(s) received
                      {receipt.deliveryReference && ` — Ref: ${receipt.deliveryReference}`}
                    </p>
                    {receipt.notes && (
                      <p className="text-xs text-gray-500 mt-1">{receipt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No goods received yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Purchase Order</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectNotes.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Purchase Order</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                This will cancel the purchase order. This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Keep PO
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Cancel PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goods Receipt Dialog */}
      {showReceiptDialog && (
        <GoodsReceiptDialog
          open={showReceiptDialog}
          onClose={() => setShowReceiptDialog(false)}
          order={order}
          warehouses={warehouses}
          onReceive={(receipt) => actions.receive(receipt as unknown as Parameters<typeof actions.receive>[0])}
          userId={user?.uid ?? ''}
        />
      )}
    </div>
  );
}
