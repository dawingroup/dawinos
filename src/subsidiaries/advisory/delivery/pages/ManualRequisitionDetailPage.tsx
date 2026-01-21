/**
 * MANUAL REQUISITION DETAIL PAGE
 *
 * View and manage a single manual requisition including:
 * - Acknowledgement document generation
 * - Accountability entries
 * - Linking to projects
 */

import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Link as LinkIcon,
  FileText,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  Plus,
  Receipt,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/core/components/ui/dialog';
import { format } from 'date-fns';
import { useState } from 'react';
import {
  useManualRequisition,
  useDeleteManualRequisition,
  useSaveAcknowledgement,
} from '../hooks/manual-requisition-hooks';
import { AcknowledgementSection } from '../components/AcknowledgementSection';
import { ManualRequisitionStatus, AcknowledgementFormData } from '../types/manual-requisition';
import { AccountabilityStatus, EXPENSE_CATEGORY_LABELS } from '../types/requisition';
import { downloadAcknowledgementPDF } from '../services/acknowledgement-document-service';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | any): string {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
  return format(d, 'MMM d, yyyy');
}

// ─────────────────────────────────────────────────────────────────
// STATUS BADGES
// ─────────────────────────────────────────────────────────────────

function LinkStatusBadge({ status }: { status: ManualRequisitionStatus }) {
  switch (status) {
    case 'unlinked':
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-300">
          Unlinked
        </Badge>
      );
    case 'linked':
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
          Linked
        </Badge>
      );
    case 'reconciled':
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          Reconciled
        </Badge>
      );
    default:
      return null;
  }
}

function AccountabilityStatusBadge({ status }: { status: AccountabilityStatus }) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'partial':
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
          <TrendingUp className="w-3 h-3 mr-1" />
          Partial
        </Badge>
      );
    case 'complete':
      return (
        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Complete
        </Badge>
      );
    case 'overdue':
      return (
        <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export function ManualRequisitionDetailPage() {
  const navigate = useNavigate();
  const { requisitionId } = useParams<{ requisitionId: string }>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { requisition, loading, error, refresh } = useManualRequisition(requisitionId || null);
  const { deleteRequisition, loading: deleteLoading } = useDeleteManualRequisition();
  const { saveAcknowledgement, loading: savingAck } = useSaveAcknowledgement();

  const handleDelete = async () => {
    if (requisitionId) {
      await deleteRequisition(requisitionId);
      navigate('/advisory/delivery/backlog');
    }
  };

  const handleSaveAcknowledgement = async (data: AcknowledgementFormData) => {
    if (requisitionId && requisition) {
      await saveAcknowledgement(requisitionId, data);
      // Download the PDF after saving
      downloadAcknowledgementPDF({
        requisition,
        acknowledgement: data,
      });
      refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading requisition...</span>
      </div>
    );
  }

  if (error || !requisition) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-900">Requisition not found</h2>
        <p className="text-gray-500 mb-4">
          {error?.message || 'The requisition you are looking for does not exist.'}
        </p>
        <Button onClick={() => navigate('/advisory/delivery/backlog')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Backlog
        </Button>
      </div>
    );
  }

  const accountabilityPercentage = requisition.amount > 0
    ? Math.round((requisition.totalAccountedAmount / requisition.amount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/advisory/delivery/backlog')}
            className="p-2 hover:bg-gray-100 rounded-lg mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {requisition.referenceNumber}
              </h1>
              <LinkStatusBadge status={requisition.linkStatus} />
              <AccountabilityStatusBadge status={requisition.accountabilityStatus} />
            </div>
            <p className="text-gray-500">{requisition.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/advisory/delivery/backlog/${requisitionId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Amount</span>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(requisition.amount, requisition.currency)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Requisition Date</span>
            </div>
            <p className="text-lg font-semibold">
              {formatDate(requisition.requisitionDate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Accounted</span>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(requisition.totalAccountedAmount, requisition.currency)}
            </p>
            <p className="text-xs text-gray-500">{accountabilityPercentage}% complete</p>
          </CardContent>
        </Card>

        <Card className={requisition.unaccountedAmount > 0 ? 'border-amber-200' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Unaccounted</span>
            </div>
            <p className={`text-lg font-semibold ${requisition.unaccountedAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {formatCurrency(requisition.unaccountedAmount, requisition.currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acknowledgement Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          Step 1: Acknowledgement Document
        </h2>
        <AcknowledgementSection
          requisition={requisition}
          onAcknowledgementSaved={handleSaveAcknowledgement}
          isLoading={savingAck}
        />
      </div>

      {/* Accountability Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-500" />
              Step 2: Accountability Entries
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/advisory/delivery/backlog/${requisitionId}/edit`)}
              disabled={!requisition.acknowledgement}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!requisition.acknowledgement ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Complete the acknowledgement first</p>
              <p className="text-sm text-gray-400">
                You need to generate an acknowledgement document before adding accountability entries
              </p>
            </div>
          ) : requisition.accountabilities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No accountability entries yet</p>
              <p className="text-sm text-gray-400">Click "Add Entry" to record expenses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requisition.accountabilities.map((entry, index) => (
                <div key={entry.id || index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{entry.description}</span>
                        <Badge variant="outline" className="text-xs">
                          {EXPENSE_CATEGORY_LABELS[entry.category] || entry.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-x-4">
                        <span>{formatDate(entry.date)}</span>
                        {entry.vendor && <span>Vendor: {entry.vendor}</span>}
                        {entry.receiptNumber && <span>Receipt: {entry.receiptNumber}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(entry.amount, requisition.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Purpose</dt>
              <dd className="mt-1">{requisition.purpose}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Advance Type</dt>
              <dd className="mt-1 capitalize">{requisition.advanceType.replace(/_/g, ' ')}</dd>
            </div>
            {requisition.paidDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Paid Date</dt>
                <dd className="mt-1">{formatDate(requisition.paidDate)}</dd>
              </div>
            )}
            {requisition.accountabilityDueDate && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Accountability Due</dt>
                <dd className="mt-1">{formatDate(requisition.accountabilityDueDate)}</dd>
              </div>
            )}
            {requisition.linkedProjectName && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Linked Project</dt>
                <dd className="mt-1 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  {requisition.linkedProjectName}
                </dd>
              </div>
            )}
            {requisition.sourceDocument && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Source Document</dt>
                <dd className="mt-1">{requisition.sourceDocument}</dd>
              </div>
            )}
            {requisition.notes && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1">{requisition.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Requisition</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this requisition? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ManualRequisitionDetailPage;
