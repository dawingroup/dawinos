/**
 * Accountability Detail Page - View and verify expense accountability
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAccountability, useExpenseVerification, useRequisition } from '../hooks/payment-hooks';
import { AccountabilityExpense, ExpenseStatus, EXPENSE_STATUS_CONFIG } from '../types/accountability';
import { PaymentStatus } from '../types/payment';
import { db } from '@/core/services/firebase';
import { useAuth } from '@/shared/hooks';

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

const EXPENSE_STATUS_ICONS: Record<ExpenseStatus, React.ElementType> = {
  pending: Clock,
  verified: CheckCircle,
  rejected: XCircle,
};

const EXPENSE_STATUS_COLORS: Record<ExpenseStatus, string> = {
  pending: 'text-amber-500',
  verified: 'text-green-500',
  rejected: 'text-red-500',
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

interface ExpenseRowProps {
  expense: AccountabilityExpense;
  onVerify: (expenseId: string, approved: boolean, reason?: string) => Promise<void>;
  canVerify: boolean;
  loading: boolean;
}

function ExpenseRow({ expense, onVerify, canVerify, loading }: ExpenseRowProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const StatusIcon = EXPENSE_STATUS_ICONS[expense.status];

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await onVerify(expense.id, false, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
  };

  return (
    <>
      <tr className="border-b hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${EXPENSE_STATUS_COLORS[expense.status]}`} />
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              expense.status === 'verified' ? 'bg-green-100 text-green-700' :
              expense.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {EXPENSE_STATUS_CONFIG[expense.status].label}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">{formatDate(expense.date)}</td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium">{expense.description}</div>
          {expense.vendor && (
            <div className="text-xs text-gray-500">{expense.vendor}</div>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 capitalize">
          {expense.category?.replace('_', ' ')}
        </td>
        <td className="px-4 py-3 text-sm">{expense.receiptNumber || '-'}</td>
        <td className="px-4 py-3 text-sm font-medium text-right">
          {formatCurrency(expense.amount)}
        </td>
        <td className="px-4 py-3">
          {canVerify && expense.status === 'pending' && (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => onVerify(expense.id, true)}
                disabled={loading}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                title="Verify"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={loading}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {expense.status === 'rejected' && expense.rejectionReason && (
            <div className="text-xs text-red-600 italic">
              "{expense.rejectionReason}"
            </div>
          )}
        </td>
      </tr>

      {showRejectModal && (
        <tr>
          <td colSpan={7} className="px-4 py-3 bg-red-50">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="flex-1 px-3 py-2 border border-red-200 rounded-lg text-sm"
                autoFocus
              />
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function AccountabilityDetailPage() {
  const { accountabilityId } = useParams<{ accountabilityId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { accountability, loading, error } = useAccountability(db, accountabilityId || null);
  const { requisition } = useRequisition(db, accountability?.requisitionId || null);
  const { verifyExpense, completeVerification, loading: verifying } = useExpenseVerification(
    db,
    accountabilityId || null,
    user?.uid || ''
  );

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');

  const handleVerifyExpense = async (expenseId: string, approved: boolean, reason?: string) => {
    try {
      await verifyExpense(expenseId, approved, reason);
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  const handleCompleteVerification = async () => {
    try {
      await completeVerification(verificationNotes || undefined);
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Failed to complete verification:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading accountability...</span>
      </div>
    );
  }

  if (error || !accountability) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error?.message || 'Accountability not found'}</span>
        </div>
      </div>
    );
  }

  const pendingCount = accountability.expenses?.filter(e => e.status === 'pending').length || 0;
  const verifiedCount = accountability.expenses?.filter(e => e.status === 'verified').length || 0;
  const rejectedCount = accountability.expenses?.filter(e => e.status === 'rejected').length || 0;
  const canVerify = accountability.status === 'submitted' || accountability.status === 'under_review';
  const canComplete = canVerify && pendingCount === 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Accountability Report</h1>
            <span className={`px-3 py-1 text-sm rounded-full ${STATUS_COLORS[accountability.status]}`}>
              {accountability.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600">
            For requisition {accountability.requisitionNumber || requisition?.requisitionNumber || '-'}
          </p>
        </div>
        {canComplete && (
          <button
            onClick={() => setShowCompleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Verification
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Requisition Amount</div>
          <div className="text-xl font-bold">
            {formatCurrency(accountability.requisitionAmount, accountability.currency)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(accountability.totalExpenses, accountability.currency)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Unspent Returned</div>
          <div className="text-xl font-bold">
            {formatCurrency(accountability.unspentReturned || 0, accountability.currency)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Balance Due</div>
          <div className={`text-xl font-bold ${
            accountability.balanceDue > 0 ? 'text-amber-600' : 
            accountability.balanceDue < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(Math.abs(accountability.balanceDue), accountability.currency)}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Verification Status</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-green-600 text-sm">{verifiedCount} verified</span>
            <span className="text-amber-600 text-sm">{pendingCount} pending</span>
            {rejectedCount > 0 && (
              <span className="text-red-600 text-sm">{rejectedCount} rejected</span>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Expenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-32">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-28">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-36">Category</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700 w-28">Receipt #</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 w-32">Amount</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountability.expenses?.map(expense => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  onVerify={handleVerifyExpense}
                  canVerify={canVerify}
                  loading={verifying}
                />
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-right">
                  Total
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  {formatCurrency(accountability.totalExpenses, accountability.currency)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Details Sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Submitted By
          </h3>
          <div className="text-sm">{accountability.createdBy || '-'}</div>
          <div className="text-xs text-gray-500">
            {formatDate(accountability.createdAt?.toDate())}
          </div>
        </div>

        {accountability.verifiedBy && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Verified By
            </h3>
            <div className="text-sm">{accountability.verifiedBy}</div>
            <div className="text-xs text-gray-500">
              {formatDate(accountability.verifiedAt?.toDate())}
            </div>
            {accountability.verificationNotes && (
              <p className="text-xs text-gray-600 mt-2 italic">
                "{accountability.verificationNotes}"
              </p>
            )}
          </div>
        )}

        <Link
          to={`/advisory/delivery/requisitions/${accountability.requisitionId}`}
          className="bg-white border rounded-lg p-4 hover:bg-gray-50"
        >
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Requisition
          </h3>
          <div className="text-sm text-primary">{accountability.requisitionNumber}</div>
          <div className="text-xs text-gray-500">View details</div>
        </Link>
      </div>

      {/* Complete Verification Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCompleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Complete Verification?</h3>
            <p className="text-gray-600 mb-4">
              Mark this accountability as verified. {verifiedCount} expense(s) verified, 
              total: {formatCurrency(accountability.receiptsSummary?.totalVerifiedAmount || accountability.totalExpenses)}.
            </p>
            <textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Optional verification notes..."
              rows={3}
              className="w-full px-3 py-2 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteVerification}
                disabled={verifying}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountabilityDetailPage;
