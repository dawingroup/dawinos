/**
 * Manufacturing Orders List Page
 * Styled to match DawinOS Finishes design system
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Factory, ExternalLink, ArrowLeft } from 'lucide-react';
import { useManufacturingOrders } from '../hooks/useManufacturingOrders';
import { MO_STAGE_LABELS, MO_STATUS_LABELS } from '../types';
import type { ManufacturingOrderStatus, MOStage } from '../types';

const SUBSIDIARY_ID = 'finishes';

const STATUS_CONFIG: Record<ManufacturingOrderStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  'pending-approval': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  approved: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'in-progress': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  'on-hold': { bg: 'bg-red-100', text: 'text-red-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const STAGE_CONFIG: Record<MOStage, { bg: string; text: string }> = {
  queued: { bg: 'bg-gray-100', text: 'text-gray-700' },
  cutting: { bg: 'bg-blue-100', text: 'text-blue-700' },
  assembly: { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  finishing: { bg: 'bg-purple-100', text: 'text-purple-700' },
  qc: { bg: 'bg-amber-100', text: 'text-amber-700' },
  ready: { bg: 'bg-green-100', text: 'text-green-700' },
};

const PRIORITY_CONFIG = {
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
  medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
  high: { bg: 'bg-amber-100', text: 'text-amber-700' },
  urgent: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function ManufacturingOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') ?? '');
  const [stageFilter, setStageFilter] = useState<string>(searchParams.get('stage') ?? '');

  const filters = {
    search: search || undefined,
    status: statusFilter ? (statusFilter as ManufacturingOrderStatus) : undefined,
    currentStage: stageFilter ? (stageFilter as MOStage) : undefined,
  };

  const { orders, loading } = useManufacturingOrders(SUBSIDIARY_ID, filters);

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
            <h1 className="text-2xl font-bold text-gray-900">Manufacturing Orders</h1>
            <p className="text-muted-foreground">Track and manage production orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search MO number or item name..."
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
            {Object.entries(MO_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[140px]"
          >
            <option value="">All Stages</option>
            {Object.entries(MO_STAGE_LABELS).map(([value, label]) => (
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
        {(statusFilter || stageFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setStageFilter('');
            }}
            className="ml-2 text-primary hover:underline"
          >
            Clear filters
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
          <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No manufacturing orders found</h3>
          <p className="text-gray-500 mt-1">
            {search || statusFilter || stageFilter
              ? 'Try adjusting your filters'
              : 'Manufacturing orders will appear here when created'}
          </p>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Design Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((mo) => {
                  const statusConfig = STATUS_CONFIG[mo.status];
                  const stageConfig = STAGE_CONFIG[mo.currentStage];
                  const priorityConfig = PRIORITY_CONFIG[mo.priority];

                  return (
                    <tr
                      key={mo.id}
                      onClick={() => navigate(`/manufacturing/orders/${mo.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">{mo.moNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900">{mo.designItemName}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{mo.projectCode}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}
                        >
                          {MO_STATUS_LABELS[mo.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${stageConfig.bg} ${stageConfig.text}`}
                        >
                          {MO_STAGE_LABELS[mo.currentStage]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityConfig.bg} ${priorityConfig.text}`}
                        >
                          {mo.priority.charAt(0).toUpperCase() + mo.priority.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manufacturing/orders/${mo.id}`);
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
    </div>
  );
}
