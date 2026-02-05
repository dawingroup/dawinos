/**
 * Manufacturing Order Detail Page
 * Full MO view with BOM, parts, stage tracker, and actions
 * Styled to match DawinOS Finishes design system
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  SkipForward,
  CheckCircle,
  Pause,
  XCircle,
  ShoppingCart,
  Package,
  BadgeCheck,
  Pencil,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useManufacturingOrder } from '../hooks/useManufacturingOrder';
import { useProcurementRequirements } from '../hooks/useProcurementRequirements';
import { useWarehouses } from '@/modules/inventory/hooks/useWarehouses';
import { MO_STAGES, MO_STAGE_LABELS, MO_STATUS_LABELS } from '../types';
import type { BOMEntry, ManufacturingOrderStatus } from '../types';
import { PROCUREMENT_STATUS_LABELS } from '../types/procurement';
import type { ProcurementRequirementStatus } from '../types/procurement';
import { useAuth } from '@/shared/hooks/useAuth';
import { MaterialConsumptionDialog } from '../components/mo/MaterialConsumptionDialog';
import { QCInspectionDialog } from '../components/mo/QCInspectionDialog';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';

const STATUS_CONFIG: Record<ManufacturingOrderStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  'pending-approval': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'in-progress': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'on-hold': { bg: 'bg-red-100', text: 'text-red-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const PRIORITY_CONFIG = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
};

const PROCUREMENT_STATUS_CONFIG: Record<ProcurementRequirementStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  'added-to-po': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  ordered: { bg: 'bg-blue-100', text: 'text-blue-700' },
  received: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export default function ManufacturingOrderDetailPage() {
  const { moId } = useParams<{ moId: string }>();
  const { user } = useAuth();
  const { order, loading, error, actions } = useManufacturingOrder(moId ?? null, user?.uid ?? '');
  const { requirements: procurementReqs } = useProcurementRequirements({
    subsidiaryId: 'finishes',
    filters: { moId: moId ?? undefined },
  });
  const { warehouses } = useWarehouses('finishes');
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [stageNotes, setStageNotes] = useState('');
  const [showAdvanceDialog, setShowAdvanceDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approveWarehouseId, setApproveWarehouseId] = useState('');
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [shortageAlert, setShortageAlert] = useState<string | null>(null);
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [showQCDialog, setShowQCDialog] = useState(false);

  // BOM editing state
  const [bomEditing, setBomEditing] = useState(false);
  const [editedBom, setEditedBom] = useState<BOMEntry[]>([]);
  const [bomSaving, setBomSaving] = useState(false);

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
          Manufacturing order not found
        </div>
      </div>
    );
  }

  const currentStageIndex = MO_STAGES.indexOf(order.currentStage);
  const statusConfig = STATUS_CONFIG[order.status];
  const priorityConfig = PRIORITY_CONFIG[order.priority];

  const handleApprove = async () => {
    if (!approveWarehouseId) return;
    setActionLoading(true);
    try {
      const result = await actions.approve(approveWarehouseId);
      if (!result.success && result.shortages.length > 0) {
        setShortageAlert(
          result.shortages
            .map((s) => `${s.itemName}: need ${s.required}, have ${s.available}`)
            .join('\n'),
        );
      }
      setShowApproveDialog(false);
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleAdvanceStage = async () => {
    setActionLoading(true);
    try {
      await actions.advanceStage(stageNotes || undefined);
      setShowAdvanceDialog(false);
      setStageNotes('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleHold = async () => {
    if (!holdReason.trim()) return;
    setActionLoading(true);
    try {
      await actions.hold(holdReason);
      setShowHoldDialog(false);
      setHoldReason('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    setActionLoading(true);
    try {
      await actions.cancel(cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch {
      // Error handled by hook
    }
    setActionLoading(false);
  };

  const handleSaveBom = async () => {
    setBomSaving(true);
    try {
      const recalculated = editedBom.map((e) => ({
        ...e,
        totalCost: e.quantityRequired * e.unitCost,
      }));
      await updateDoc(doc(db, 'manufacturingOrders', order.id), {
        bom: recalculated,
        'costSummary.materialCost': recalculated.reduce((s, e) => s + e.totalCost, 0),
        'costSummary.totalCost':
          recalculated.reduce((s, e) => s + e.totalCost, 0) + order.costSummary.laborCost,
        updatedAt: new Date(),
        updatedBy: user?.uid ?? '',
      });
      setBomEditing(false);
    } catch (e) {
      setShortageAlert((e as Error).message);
    } finally {
      setBomSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/manufacturing/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.moNumber}</h1>
            {order.projectId && order.designItemId ? (
              <Link
                to={`/design/project/${order.projectId}/item/${order.designItemId}`}
                className="text-muted-foreground hover:underline"
              >
                {order.designItemName} — {order.projectCode}
              </Link>
            ) : (
              <p className="text-muted-foreground">
                {order.designItemName} — {order.projectCode}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
            {MO_STATUS_LABELS[order.status]}
          </span>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityConfig.bg} ${priorityConfig.text}`}>
            {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Shortage Alert */}
      {shortageAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 mb-1">Material Shortages Detected</h4>
            <p className="text-yellow-700 whitespace-pre-line text-sm">{shortageAlert}</p>
          </div>
          <button onClick={() => setShortageAlert(null)} className="text-yellow-600 hover:text-yellow-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stage Tracker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Stage</h2>
        <div className="flex items-center justify-between">
          {MO_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            return (
              <div key={stage} className="flex-1 flex flex-col items-center relative">
                {/* Connector line */}
                {index > 0 && (
                  <div
                    className={`absolute left-0 top-4 w-1/2 h-0.5 -translate-x-1/2 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
                {index < MO_STAGES.length - 1 && (
                  <div
                    className={`absolute right-0 top-4 w-1/2 h-0.5 translate-x-1/2 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
                {/* Circle */}
                <div
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCompleted
                      ? 'bg-primary text-white'
                      : isCurrent
                        ? 'bg-primary/20 text-primary border-2 border-primary'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                {/* Label */}
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {MO_STAGE_LABELS[stage]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {order.status === 'draft' && (
          <button
            onClick={() => {
              setApproveWarehouseId(warehouses[0]?.id ?? '');
              setShowApproveDialog(true);
            }}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve & Reserve Materials
          </button>
        )}
        {order.status === 'approved' && (
          <button
            onClick={async () => {
              setActionLoading(true);
              await actions.startProduction();
              setActionLoading(false);
            }}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Start Production
          </button>
        )}
        {order.status === 'in-progress' && order.currentStage !== 'ready' && (
          <button
            onClick={() => setShowAdvanceDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
            Advance Stage
          </button>
        )}
        {order.status === 'in-progress' && (
          <button
            onClick={() => setShowHoldDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            <Pause className="h-4 w-4" />
            Put on Hold
          </button>
        )}
        {order.status === 'on-hold' && (
          <button
            onClick={async () => {
              setActionLoading(true);
              await actions.resume();
              setActionLoading(false);
            }}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            Resume
          </button>
        )}
        {order.status === 'in-progress' && (
          <button
            onClick={() => setShowConsumeDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            Consume Materials
          </button>
        )}
        {order.status === 'in-progress' && order.currentStage === 'qc' && (
          <button
            onClick={() => setShowQCDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            <BadgeCheck className="h-4 w-4" />
            Record QC
          </button>
        )}
        {!['completed', 'cancelled'].includes(order.status) && (
          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={actionLoading}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BOM Table - Full Width */}
        <div className="lg:col-span-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Bill of Materials</h2>
              {['draft', 'approved'].includes(order.status) && !bomEditing && (
                <button
                  onClick={() => {
                    setEditedBom(order.bom.map((e) => ({ ...e })));
                    setBomEditing(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                  Edit BOM
                </button>
              )}
              {bomEditing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditedBom((prev) => [
                        ...prev,
                        {
                          id: `BOM-${Date.now()}`,
                          inventoryItemId: '',
                          sku: '',
                          itemName: '',
                          category: '',
                          quantityRequired: 0,
                          unit: 'pcs',
                          unitCost: 0,
                          totalCost: 0,
                        },
                      ])
                    }
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Entry
                  </button>
                  <button
                    onClick={() => setBomEditing(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBom}
                    disabled={bomSaving}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {bomSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save BOM
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    {bomEditing && <th className="px-4 py-3 w-12" />}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bomEditing ? (
                    editedBom.map((entry, idx) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.itemName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedBom((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, itemName: val } : b)),
                              );
                            }}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.category}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedBom((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, category: val } : b)),
                              );
                            }}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-sm">
                          {entry.supplierName ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entry.quantityRequired}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditedBom((prev) =>
                                prev.map((b, i) =>
                                  i === idx
                                    ? { ...b, quantityRequired: val, totalCost: val * b.unitCost }
                                    : b,
                                ),
                              );
                            }}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={entry.unit}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditedBom((prev) =>
                                prev.map((b, i) => (i === idx ? { ...b, unit: val } : b)),
                              );
                            }}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={entry.unitCost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setEditedBom((prev) =>
                                prev.map((b, i) =>
                                  i === idx
                                    ? { ...b, unitCost: val, totalCost: b.quantityRequired * val }
                                    : b,
                                ),
                              );
                            }}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {(entry.quantityRequired * entry.unitCost).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setEditedBom((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    order.bom.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{entry.itemName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {entry.supplierName ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {entry.quantityRequired}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{entry.unit}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {entry.unitCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {entry.totalCost.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                  {(bomEditing ? editedBom : order.bom).length === 0 && (
                    <tr>
                      <td
                        colSpan={bomEditing ? 8 : 7}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No BOM entries
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Materials</span>
                <span className="text-gray-900">
                  {order.costSummary.materialCost.toLocaleString()} {order.costSummary.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor</span>
                <span className="text-gray-900">
                  {order.costSummary.laborCost.toLocaleString()} {order.costSummary.currency}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {order.costSummary.totalCost.toLocaleString()} {order.costSummary.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Material Reservations */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Material Reservations ({order.materialReservations.length})
              </h2>
            </div>
            {order.materialReservations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserved
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.materialReservations.map((res) => (
                      <tr key={res.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{res.inventoryItemId}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {res.quantityReserved}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              res.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : res.status === 'consumed'
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-gray-500">No materials reserved yet</div>
            )}
          </div>
        </div>

        {/* Procurement Requirements */}
        {procurementReqs.length > 0 && (
          <div className="lg:col-span-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Procurement Requirements ({procurementReqs.length})
                </h2>
                <Link
                  to="/manufacturing/procurement"
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Procurement Dashboard
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Est. Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {procurementReqs.map((req) => {
                      const reqStatusConfig = PROCUREMENT_STATUS_CONFIG[req.status];
                      return (
                        <tr key={req.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{req.itemDescription}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {req.supplierName ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {req.quantityRequired}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {req.estimatedTotalCost.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${reqStatusConfig.bg} ${reqStatusConfig.text}`}
                            >
                              {PROCUREMENT_STATUS_LABELS[req.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {req.poId ? (
                              <Link
                                to={`/manufacturing/purchase-orders/${req.poId}`}
                                className="text-primary text-sm hover:underline"
                              >
                                View PO
                              </Link>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Linked Purchase Orders */}
        {order.linkedPOIds && order.linkedPOIds.length > 0 && (
          <div className="lg:col-span-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Linked Purchase Orders ({order.linkedPOIds.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {order.linkedPOIds.map((poId) => (
                  <Link
                    key={poId}
                    to={`/manufacturing/purchase-orders/${poId}`}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    PO: {poId.slice(0, 8)}...
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Approve Dialog */}
      {showApproveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Approve & Reserve Materials</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Select the warehouse to reserve materials from for this manufacturing order.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
                <select
                  value={approveWarehouseId}
                  onChange={(e) => setApproveWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                  {warehouses.length === 0 && (
                    <option value="" disabled>
                      No warehouses available
                    </option>
                  )}
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowApproveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!approveWarehouseId || actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Stage Dialog */}
      {showAdvanceDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Advance to{' '}
                {order.currentStage !== 'ready' && MO_STAGE_LABELS[MO_STAGES[currentStageIndex + 1]]}
              </h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stage Notes (optional)
              </label>
              <textarea
                value={stageNotes}
                onChange={(e) => setStageNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAdvanceDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdvanceStage}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Advance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold Dialog */}
      {showHoldDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Put Order on Hold</h3>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Hold <span className="text-red-500">*</span>
              </label>
              <textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowHoldDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleHold}
                disabled={!holdReason.trim() || actionLoading}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Put on Hold
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
              <h3 className="text-lg font-semibold text-gray-900">Cancel Manufacturing Order</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                This will cancel the manufacturing order and release any material reservations. This
                action cannot be undone.
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
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason.trim() || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Consumption Dialog */}
      {showConsumeDialog && (
        <MaterialConsumptionDialog
          open={showConsumeDialog}
          onClose={() => setShowConsumeDialog(false)}
          order={order}
          warehouses={warehouses}
          onConsume={actions.consumeMaterials}
        />
      )}

      {/* QC Inspection Dialog */}
      {showQCDialog && (
        <QCInspectionDialog
          open={showQCDialog}
          onClose={() => setShowQCDialog(false)}
          order={order}
          userId={user?.uid ?? ''}
          onRecordQC={actions.recordQC}
        />
      )}
    </div>
  );
}
