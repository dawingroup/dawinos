/**
 * Manufacturing Dashboard Page
 * Overview of MOs by stage, PO status, and key metrics
 * Styled to match DawinOS Finishes design system
 */

import { Link, useNavigate } from 'react-router-dom';
import {
  Factory,
  ShoppingCart,
  Package,
  CheckCircle,
  ArrowRight,
  Pause,
  FileText,
} from 'lucide-react';
import { useManufacturingOrders } from '../hooks/useManufacturingOrders';
import { usePurchaseOrders } from '../hooks/usePurchaseOrders';
import { MO_STAGE_LABELS, MO_STATUS_LABELS, type MOStage } from '../types';
import { PO_STATUS_LABELS, type PurchaseOrderStatus } from '../types/purchaseOrder';

const SUBSIDIARY_ID = 'finishes';

const STAGE_COLORS: Record<MOStage, { bg: string; text: string; border: string }> = {
  queued: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  cutting: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  assembly: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  finishing: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  qc: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  ready: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
};

const STATUS_COLORS = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
  'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Factory },
  'on-hold': { bg: 'bg-red-100', text: 'text-red-700', icon: Pause },
  completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
};

const PO_STATUS_COLORS: Record<PurchaseOrderStatus, { bg: string; text: string }> = {
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

export default function ManufacturingDashboardPage() {
  const navigate = useNavigate();
  const { stats: moStats, loading: moLoading } = useManufacturingOrders(SUBSIDIARY_ID);
  const { stats: poStats, loading: poLoading } = usePurchaseOrders(SUBSIDIARY_ID);

  const loading = moLoading || poLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalActive = (moStats.byStatus['in-progress'] ?? 0) + (moStats.byStatus['approved'] ?? 0);
  const totalPendingPO = (poStats.byStatus['sent'] ?? 0) + (poStats.byStatus['partially-received'] ?? 0);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manufacturing Dashboard</h1>
          <p className="text-muted-foreground">Monitor production pipeline and procurement status</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/manufacturing/orders"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Factory className="h-4 w-4" />
            Manufacturing Orders
          </Link>
          <Link
            to="/manufacturing/purchase-orders"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Purchase Orders
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Factory className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Production</p>
              <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Pause className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Hold</p>
              <p className="text-2xl font-bold text-gray-900">{moStats.byStatus['on-hold'] ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed (Month)</p>
              <p className="text-2xl font-bold text-gray-900">{moStats.byStatus['completed'] ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{totalPendingPO}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Pipeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Production Pipeline</h2>
            <Link
              to="/manufacturing/orders"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {(Object.entries(MO_STAGE_LABELS) as [MOStage, string][]).map(([stage, label]) => {
              const count = moStats.byStage[stage] ?? 0;
              const colors = STAGE_COLORS[stage];
              const hasItems = count > 0;

              return (
                <button
                  key={stage}
                  onClick={() => hasItems && navigate(`/manufacturing/orders?stage=${stage}`)}
                  disabled={!hasItems}
                  className={`relative rounded-lg border-2 p-4 text-center transition-all ${
                    hasItems
                      ? `${colors.border} hover:shadow-md cursor-pointer`
                      : 'border-gray-200 cursor-default opacity-60'
                  }`}
                >
                  <div
                    className={`text-3xl font-bold mb-1 ${hasItems ? colors.text : 'text-gray-400'}`}
                  >
                    {count}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{label}</div>
                  {stage !== 'ready' && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden lg:block">
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MO Status Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">MO Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(['draft', 'in-progress', 'on-hold', 'completed'] as const).map((status) => {
                const count = moStats.byStatus[status] ?? 0;
                const config = STATUS_COLORS[status];
                const Icon = config.icon;
                const total = Object.values(moStats.byStatus).reduce((a, b) => a + b, 0);
                const percent = total > 0 ? (count / total) * 100 : 0;

                return (
                  <button
                    key={status}
                    onClick={() => count > 0 && navigate(`/manufacturing/orders?status=${status}`)}
                    disabled={count === 0}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 transition-colors ${
                      count > 0 ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60 cursor-default'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.text}`} />
                      </div>
                      <span className="font-medium text-gray-700">{MO_STATUS_LABELS[status]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${config.bg.replace('100', '500')}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-lg font-semibold text-gray-900 w-8 text-right">
                        {count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PO Status Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Purchase Orders</h2>
              <Link
                to="/manufacturing/purchase-orders"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-3">
              {(['draft', 'pending-approval', 'sent', 'partially-received', 'received'] as const).map(
                (status) => {
                  const count = poStats.byStatus[status] ?? 0;
                  const colors = PO_STATUS_COLORS[status];
                  const hasItems = count > 0;

                  return (
                    <button
                      key={status}
                      onClick={() => hasItems && navigate(`/manufacturing/purchase-orders?status=${status}`)}
                      disabled={!hasItems}
                      className={`p-3 rounded-lg border transition-colors text-left ${
                        hasItems
                          ? 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                          : 'border-gray-100 opacity-60 cursor-default'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}
                        >
                          {count}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {PO_STATUS_LABELS[status]}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
