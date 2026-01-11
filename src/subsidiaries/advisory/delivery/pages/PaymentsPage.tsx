/**
 * Payments Page - Project payment management for IPCs, Requisitions, and Accountabilities
 */

import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  Receipt,
  Wallet,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Filter,
  Download,
} from 'lucide-react';
import { useProjectPayments, useProjectIPCs, useProjectRequisitions } from '../hooks/payment-hooks';
import { useProject } from '../hooks/project-hooks';
import { Payment, getPaymentStatusColor, PAYMENT_STATUS_CONFIG } from '../types/payment';
import { db } from '@/core/services/firebase';

type TabType = 'all' | 'ipcs' | 'requisitions' | 'accountabilities';

const TAB_CONFIG: Record<TabType, { label: string; icon: React.ElementType }> = {
  all: { label: 'All Payments', icon: FileText },
  ipcs: { label: 'IPCs', icon: FileText },
  requisitions: { label: 'Requisitions', icon: Receipt },
  accountabilities: { label: 'Accountabilities', icon: Wallet },
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

interface PaymentRowProps {
  payment: Payment;
}

function PaymentRow({ payment }: PaymentRowProps) {
  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];

  return (
    <Link
      to={`/advisory/delivery/payments/${payment.id}`}
      className="grid grid-cols-6 gap-4 px-4 py-3 hover:bg-gray-50 border-b items-center"
    >
      <div>
        <div className="font-medium text-gray-900">{payment.paymentNumber}</div>
        <div className="text-xs text-gray-500 capitalize">{payment.paymentType}</div>
      </div>
      <div className="text-sm text-gray-600">
        {formatDate(payment.periodFrom)} - {formatDate(payment.periodTo)}
      </div>
      <div className="text-right font-medium">
        {formatCurrency(payment.grossAmount, payment.currency)}
      </div>
      <div className="text-right text-gray-600">
        {formatCurrency(payment.deductions.reduce((sum, d) => sum + d.amount, 0), payment.currency)}
      </div>
      <div className="text-right font-medium text-green-600">
        {formatCurrency(payment.netAmount, payment.currency)}
      </div>
      <div className="text-right">
        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(payment.status)}`}>
          {statusConfig.label}
        </span>
      </div>
    </Link>
  );
}

export function PaymentsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { project, loading: projectLoading } = useProject(db, projectId || null);
  const { payments, summary, byType, loading, error } = useProjectPayments(db, projectId || null, { realtime: true });
  const { stats: ipcStats } = useProjectIPCs(db, projectId || null, true);
  const { requisitions } = useProjectRequisitions(db, projectId || null);

  // Filter payments based on active tab and status
  const filteredPayments = useMemo(() => {
    let result: Payment[] = [];

    switch (activeTab) {
      case 'ipcs':
        result = byType.ipcs;
        break;
      case 'requisitions':
        result = byType.requisitions;
        break;
      case 'accountabilities':
        result = byType.accountabilities;
        break;
      default:
        result = payments;
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    return result.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [payments, byType, activeTab, statusFilter]);

  const isContractorProject = project?.implementationType === 'contractor';

  if (projectLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading payments...</span>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/advisory/delivery/projects/${projectId}`}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">{project?.name || 'Project'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          {isContractorProject ? (
            <button
              onClick={() => navigate(`/advisory/delivery/projects/${projectId}/ipcs/new`)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New IPC
            </button>
          ) : (
            <button
              onClick={() => navigate(`/advisory/delivery/projects/${projectId}/requisitions/new`)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Requisition
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Total Paid</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalPaid)}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-amber-600">
            {formatCurrency(summary.totalPending)}
          </div>
          <div className="text-xs text-gray-500">{summary.pendingCount} payment(s)</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">Retention Held</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.retentionHeld)}
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-600 mb-1">
            {isContractorProject ? 'IPCs Certified' : 'Requisitions'}
          </div>
          <div className="text-2xl font-bold">
            {isContractorProject ? ipcStats.approvedCount : requisitions.length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {Object.entries(TAB_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
              {key !== 'all' && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  isActive ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  {key === 'ipcs' ? byType.ipcs.length :
                   key === 'requisitions' ? byType.requisitions.length :
                   byType.accountabilities.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 border rounded-lg bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-600">
          <div>Payment #</div>
          <div>Period</div>
          <div className="text-right">Gross Amount</div>
          <div className="text-right">Deductions</div>
          <div className="text-right">Net Amount</div>
          <div className="text-right">Status</div>
        </div>

        {/* Body */}
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No payments found</p>
            <p className="text-sm mt-1">
              {isContractorProject
                ? 'Create a new IPC to get started'
                : 'Create a new requisition to get started'}
            </p>
          </div>
        ) : (
          <div>
            {filteredPayments.map(payment => (
              <PaymentRow key={payment.id} payment={payment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
