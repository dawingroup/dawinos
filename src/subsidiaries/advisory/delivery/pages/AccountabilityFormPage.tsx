/**
 * Accountability Form Page
 * Form for submitting expense accountability for a requisition
 */

import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Receipt,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useRequisition, useCreateAccountability } from '../hooks/payment-hooks';
import { AccountabilityFormData } from '../types/accountability';
import { ExpenseCategory, EXPENSE_CATEGORY_LABELS } from '../types/requisition';
import { db } from '@/core/services/firebase';
import { useAuth } from '@/shared/hooks';

interface ExpenseItemForm {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  receiptNumber?: string;
  vendor?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function AccountabilityFormPage() {
  const navigate = useNavigate();
  const { requisitionId } = useParams<{ requisitionId: string }>();
  const { user } = useAuth();

  const { requisition, loading: reqLoading, error: reqError } = useRequisition(db, requisitionId || null);
  const { createAccountability, loading, error } = useCreateAccountability(db, user?.uid || '');

  const [expenses, setExpenses] = useState<ExpenseItemForm[]>([
    {
      id: generateId(),
      description: '',
      category: 'construction_materials',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      vendor: '',
    },
  ]);

  const [unspentReturned, setUnspentReturned] = useState(0);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const balanceDue = useMemo(() => {
    if (!requisition) return 0;
    const total = requisition.unaccountedAmount || requisition.grossAmount;
    return total - totalExpenses - unspentReturned;
  }, [requisition, totalExpenses, unspentReturned]);

  const addExpense = () => {
    setExpenses(prev => [...prev, {
      id: generateId(),
      description: '',
      category: 'construction_materials',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      vendor: '',
    }]);
  };

  const removeExpense = (index: number) => {
    if (expenses.length > 1) {
      setExpenses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (index: number, field: keyof ExpenseItemForm, value: string | number) => {
    setExpenses(prev => prev.map((exp, i) => 
      i === index ? { ...exp, [field]: value } : exp
    ));
  };

  const handleSubmit = async () => {
    if (!requisitionId || !requisition) return;

    const formData: AccountabilityFormData = {
      requisitionId,
      expenses: expenses.map(exp => ({
        date: new Date(exp.date),
        description: exp.description,
        category: exp.category,
        amount: exp.amount,
        receiptNumber: exp.receiptNumber,
        vendor: exp.vendor,
      })),
      unspentReturned,
    };

    try {
      await createAccountability(formData);
      navigate(`/advisory/delivery/requisitions/${requisitionId}`);
    } catch (err) {
      console.error('Failed to create accountability:', err);
    }
  };

  if (reqLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading requisition...</span>
      </div>
    );
  }

  if (reqError || !requisition) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{reqError?.message || 'Requisition not found'}</span>
        </div>
      </div>
    );
  }

  const isValid = expenses.some(exp => exp.description && exp.amount > 0);

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Accountability</h1>
          <p className="text-gray-500">
            For requisition {requisition.requisitionNumber} • 
            {formatCurrency(requisition.unaccountedAmount || requisition.grossAmount)} to account for
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error.message}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Requisition Amount</div>
          <div className="text-xl font-bold">{formatCurrency(requisition.grossAmount)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Expenses</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Balance Due</div>
          <div className={`text-xl font-bold ${balanceDue > 0 ? 'text-amber-600' : balanceDue < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(Math.abs(balanceDue))}
            {balanceDue < 0 && <span className="text-sm ml-1">(over)</span>}
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Expenses</h2>
          <button
            onClick={addExpense}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        <div className="divide-y">
          {expenses.map((expense, index) => (
            <div key={expense.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                      placeholder="What was this expense for?"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <input
                      type="number"
                      value={expense.amount || ''}
                      onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={expense.category}
                      onChange={(e) => updateExpense(index, 'category', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt #</label>
                    <input
                      type="text"
                      value={expense.receiptNumber || ''}
                      onChange={(e) => updateExpense(index, 'receiptNumber', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <input
                      type="text"
                      value={expense.vendor || ''}
                      onChange={(e) => updateExpense(index, 'vendor', e.target.value)}
                      placeholder="Supplier name"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeExpense(index)}
                  disabled={expenses.length === 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unspent Amount */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Unspent Amount Returned</h3>
        <p className="text-sm text-gray-500 mb-3">
          If you have any unspent funds to return, enter the amount here.
        </p>
        <div className="max-w-xs">
          <input
            type="number"
            value={unspentReturned || ''}
            onChange={(e) => setUnspentReturned(parseFloat(e.target.value) || 0)}
            placeholder="0"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg border p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid}
          className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Submit Accountability
        </button>
      </div>
    </div>
  );
}

export default AccountabilityFormPage;
