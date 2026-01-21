/**
 * ManualRequisitionFormPage
 *
 * Form for entering historical/backlog requisitions with their accountabilities.
 * These can later be linked to projects.
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Receipt,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  Link as LinkIcon,
  Info,
} from 'lucide-react';
import { useCreateManualRequisition, useManualRequisition, useUpdateManualRequisition } from '../hooks/manual-requisition-hooks';
import {
  ManualRequisitionFormData,
  ManualAccountabilityEntry,
  createEmptyManualAccountability,
  calculateManualAccountedTotal,
} from '../types/manual-requisition';
import {
  AdvanceType,
  ADVANCE_TYPE_LABELS,
  AccountabilityStatus,
  ACCOUNTABILITY_STATUS_CONFIG,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABELS,
} from '../types/requisition';

const generateId = () => Math.random().toString(36).substring(2, 9);

function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface AccountabilityEntryProps {
  entry: Omit<ManualAccountabilityEntry, 'id'> & { id?: string };
  index: number;
  currency: string;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function AccountabilityEntryCard({
  entry,
  index,
  currency,
  onUpdate,
  onRemove,
  canRemove,
}: AccountabilityEntryProps) {
  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-green-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            Accountability Entry #{index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input
            type="date"
            value={entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : String(entry.date).split('T')[0]}
            onChange={e => onUpdate(index, 'date', new Date(e.target.value))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
          <input
            type="number"
            value={entry.amount || ''}
            onChange={e => onUpdate(index, 'amount', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={entry.category}
            onChange={e => onUpdate(index, 'category', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <input
            type="text"
            value={entry.description}
            onChange={e => onUpdate(index, 'description', e.target.value)}
            placeholder="What was this expense for?"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
          <input
            type="text"
            value={entry.vendor || ''}
            onChange={e => onUpdate(index, 'vendor', e.target.value)}
            placeholder="Supplier name"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Receipt Number */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Receipt #</label>
          <input
            type="text"
            value={entry.receiptNumber || ''}
            onChange={e => onUpdate(index, 'receiptNumber', e.target.value)}
            placeholder="REC-XXX"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Invoice Number */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Invoice #</label>
          <input
            type="text"
            value={entry.invoiceNumber || ''}
            onChange={e => onUpdate(index, 'invoiceNumber', e.target.value)}
            placeholder="INV-XXX"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input
            type="text"
            value={entry.notes || ''}
            onChange={e => onUpdate(index, 'notes', e.target.value)}
            placeholder="Optional notes"
            className="w-full px-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

export function ManualRequisitionFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const { requisition: existingRequisition, loading: loadingExisting } = useManualRequisition(id || null);
  const { createRequisition, loading: creating, error: createError } = useCreateManualRequisition();
  const { updateRequisition, loading: updating, error: updateError } = useUpdateManualRequisition();

  // Form state
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [currency, setCurrency] = useState('UGX');
  const [amount, setAmount] = useState<number>(0);
  const [requisitionDate, setRequisitionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paidDate, setPaidDate] = useState<string>('');
  const [accountabilityDueDate, setAccountabilityDueDate] = useState<string>('');
  const [advanceType, setAdvanceType] = useState<AdvanceType>('materials');
  const [accountabilityStatus, setAccountabilityStatus] = useState<AccountabilityStatus>('pending');
  const [sourceDocument, setSourceDocument] = useState('');
  const [sourceReference, setSourceReference] = useState('');
  const [notes, setNotes] = useState('');

  const [accountabilities, setAccountabilities] = useState<(Omit<ManualAccountabilityEntry, 'id'> & { id?: string })[]>([]);

  // Load existing data when editing
  useState(() => {
    if (existingRequisition) {
      setReferenceNumber(existingRequisition.referenceNumber);
      setDescription(existingRequisition.description);
      setPurpose(existingRequisition.purpose);
      setCurrency(existingRequisition.currency);
      setAmount(existingRequisition.amount);
      setRequisitionDate(
        existingRequisition.requisitionDate instanceof Date
          ? existingRequisition.requisitionDate.toISOString().split('T')[0]
          : String(existingRequisition.requisitionDate).split('T')[0]
      );
      if (existingRequisition.paidDate) {
        setPaidDate(
          existingRequisition.paidDate instanceof Date
            ? existingRequisition.paidDate.toISOString().split('T')[0]
            : String(existingRequisition.paidDate).split('T')[0]
        );
      }
      if (existingRequisition.accountabilityDueDate) {
        setAccountabilityDueDate(
          existingRequisition.accountabilityDueDate instanceof Date
            ? existingRequisition.accountabilityDueDate.toISOString().split('T')[0]
            : String(existingRequisition.accountabilityDueDate).split('T')[0]
        );
      }
      setAdvanceType(existingRequisition.advanceType);
      setAccountabilityStatus(existingRequisition.accountabilityStatus);
      setSourceDocument(existingRequisition.sourceDocument || '');
      setSourceReference(existingRequisition.sourceReference || '');
      setNotes(existingRequisition.notes || '');
      setAccountabilities(existingRequisition.accountabilities || []);
    }
  });

  // Calculations
  const totalAccountedAmount = useMemo(() => {
    return accountabilities.reduce((sum, acc) => sum + (acc.amount || 0), 0);
  }, [accountabilities]);

  const unaccountedAmount = useMemo(() => {
    return Math.max(0, amount - totalAccountedAmount);
  }, [amount, totalAccountedAmount]);

  const accountabilityPercentage = useMemo(() => {
    return amount > 0 ? (totalAccountedAmount / amount) * 100 : 0;
  }, [amount, totalAccountedAmount]);

  // Handlers
  const addAccountabilityEntry = () => {
    setAccountabilities(prev => [...prev, {
      ...createEmptyManualAccountability(),
      id: generateId(),
    }]);
  };

  const removeAccountabilityEntry = (index: number) => {
    setAccountabilities(prev => prev.filter((_, i) => i !== index));
  };

  const updateAccountabilityEntry = (index: number, field: string, value: any) => {
    setAccountabilities(prev =>
      prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc))
    );
  };

  const handleSubmit = async () => {
    const formData: ManualRequisitionFormData = {
      referenceNumber,
      description,
      purpose,
      currency,
      amount,
      requisitionDate: new Date(requisitionDate),
      paidDate: paidDate ? new Date(paidDate) : undefined,
      accountabilityDueDate: accountabilityDueDate ? new Date(accountabilityDueDate) : undefined,
      advanceType,
      accountabilityStatus,
      accountabilities: accountabilities.map(acc => ({
        date: acc.date,
        description: acc.description,
        category: acc.category,
        vendor: acc.vendor,
        amount: acc.amount,
        receiptNumber: acc.receiptNumber,
        invoiceNumber: acc.invoiceNumber,
        notes: acc.notes,
        documents: acc.documents || [],
      })),
      sourceDocument: sourceDocument || undefined,
      sourceReference: sourceReference || undefined,
      notes: notes || undefined,
    };

    try {
      if (isEditing && id) {
        await updateRequisition(id, formData);
      } else {
        await createRequisition(formData);
      }
      navigate('/advisory/delivery/backlog');
    } catch (err) {
      console.error('Failed to save manual requisition:', err);
    }
  };

  const isValid = description && purpose && amount > 0;
  const loading = creating || updating;
  const error = createError || updateError;

  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading requisition...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/advisory/delivery/backlog')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Manual Requisition' : 'Enter Manual Requisition'}
          </h1>
          <p className="text-gray-500">
            Enter historical requisition data from backlog. Can be linked to projects later.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Manual Entry Mode</p>
            <p className="text-blue-600 mt-1">
              Use this form to enter requisitions from your backlog (Excel, paper records, etc.).
              You can enter accountabilities directly here, and later link this entry to a project
              once the project is set up in the system.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error.message}</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Requisition Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                placeholder="Original reference (optional)"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank to auto-generate</p>
            </div>

            {/* Advance Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Advance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={advanceType}
                onChange={e => setAdvanceType(e.target.value as AdvanceType)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {Object.entries(ADVANCE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the requisition"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Purpose */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Detailed purpose of the requisition"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Amount & Dates */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-500" />
            Amount & Dates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="UGX">UGX</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Requisition Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requisition Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={requisitionDate}
                onChange={e => setRequisitionDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Paid Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
              <input
                type="date"
                value={paidDate}
                onChange={e => setPaidDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Accountability Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accountability Due Date
              </label>
              <input
                type="date"
                value={accountabilityDueDate}
                onChange={e => setAccountabilityDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Accountability Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accountability Status
              </label>
              <select
                value={accountabilityStatus}
                onChange={e => setAccountabilityStatus(e.target.value as AccountabilityStatus)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                {Object.entries(ACCOUNTABILITY_STATUS_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Accountability Progress */}
        {amount > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Accountability Progress</span>
              <span className="text-sm text-gray-600">
                {formatCurrency(totalAccountedAmount, currency)} of {formatCurrency(amount, currency)}
                ({accountabilityPercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  accountabilityPercentage >= 100
                    ? 'bg-green-500'
                    : accountabilityPercentage >= 50
                    ? 'bg-blue-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(accountabilityPercentage, 100)}%` }}
              />
            </div>
            {unaccountedAmount > 0 && (
              <p className="text-sm text-amber-600 mt-2">
                Unaccounted: {formatCurrency(unaccountedAmount, currency)}
              </p>
            )}
          </div>
        )}

        {/* Accountability Entries */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-gray-500" />
              Accountability Entries
            </h2>
            <button
              type="button"
              onClick={addAccountabilityEntry}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100"
            >
              <Plus className="w-4 h-4" />
              Add Entry
            </button>
          </div>

          {accountabilities.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No accountability entries yet</p>
              <p className="text-sm text-gray-400">Click "Add Entry" to add expense records</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accountabilities.map((entry, index) => (
                <AccountabilityEntryCard
                  key={entry.id || index}
                  entry={entry}
                  index={index}
                  currency={currency}
                  onUpdate={updateAccountabilityEntry}
                  onRemove={removeAccountabilityEntry}
                  canRemove={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Source Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-gray-500" />
            Source Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Document
              </label>
              <input
                type="text"
                value={sourceDocument}
                onChange={e => setSourceDocument(e.target.value)}
                placeholder="e.g., Excel backlog 2024, Paper records"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Source Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Reference
              </label>
              <input
                type="text"
                value={sourceReference}
                onChange={e => setSourceReference(e.target.value)}
                placeholder="e.g., Row 45, File: Reqs_Q1.xlsx"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional notes about this requisition"
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-4">
        <button
          onClick={() => navigate('/advisory/delivery/backlog')}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? 'Update Requisition' : 'Save Requisition'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ManualRequisitionFormPage;
