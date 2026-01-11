/**
 * FinanceDashboardPage.tsx
 * Financial Management dashboard with comprehensive overview
 * DawinOS v2.0 - Phase 8.8
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Receipt,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  Wallet,
  Smartphone,
  Banknote,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { ScrollArea } from '@/core/components/ui/scroll-area';
import { Skeleton } from '@/core/components/ui/skeleton';
import { cn } from '@/shared/lib/utils';

const FINANCE_COLOR = '#4CAF50';

// Format currency in UGX
function formatCurrencyUGX(amount: number): string {
  return `UGX ${amount.toLocaleString()}`;
}

// Mock data
const mockMetrics = {
  totalCash: 1250000000,
  cashTrend: 5.2,
  mtdExpenses: 85000000,
  expenseCount: 47,
  budgetUtilization: 72,
  totalSpent: 180000000,
  totalBudget: 250000000,
  pendingPayments: 45000000,
  pendingInvoiceCount: 8,
  pendingApprovalsCount: 3,
  pendingApprovalsAmount: 12500000,
};

const mockBudgets = [
  { id: '1', name: 'Operations Q1', category: 'Operational', spent: 45000000, allocated: 60000000, utilization: 75, remaining: 15000000 },
  { id: '2', name: 'Marketing Campaign', category: 'Marketing', spent: 28000000, allocated: 25000000, utilization: 112, remaining: -3000000 },
  { id: '3', name: 'IT Infrastructure', category: 'Capital', spent: 35000000, allocated: 50000000, utilization: 70, remaining: 15000000 },
  { id: '4', name: 'HR Training', category: 'HR', spent: 8000000, allocated: 15000000, utilization: 53, remaining: 7000000 },
  { id: '5', name: 'Office Supplies', category: 'Operational', spent: 4500000, allocated: 5000000, utilization: 90, remaining: 500000 },
];

const mockAccounts = [
  { id: '1', name: 'Stanbic Business Account', type: 'bank', balance: 850000000 },
  { id: '2', name: 'MTN Mobile Money', type: 'mobile_money', balance: 125000000 },
  { id: '3', name: 'Petty Cash', type: 'cash', balance: 5000000 },
  { id: '4', name: 'Airtel Money', type: 'mobile_money', balance: 45000000 },
  { id: '5', name: 'DFCU Savings', type: 'bank', balance: 225000000 },
];

const mockCashFlow = [
  { month: 'Aug 2025', income: 180000000, expenses: 145000000, net: 35000000 },
  { month: 'Sep 2025', income: 195000000, expenses: 160000000, net: 35000000 },
  { month: 'Oct 2025', income: 210000000, expenses: 175000000, net: 35000000 },
  { month: 'Nov 2025', income: 185000000, expenses: 155000000, net: 30000000 },
  { month: 'Dec 2025', income: 225000000, expenses: 190000000, net: 35000000 },
  { month: 'Jan 2026', income: 200000000, expenses: 165000000, net: 35000000 },
];

const mockExpenses = [
  { id: '1', description: 'Office Rent - January', amount: 15000000, date: new Date(2026, 0, 5), status: 'paid' },
  { id: '2', description: 'Fuel for Delivery Vehicles', amount: 3500000, date: new Date(2026, 0, 6), status: 'pending' },
  { id: '3', description: 'Staff Training Workshop', amount: 8000000, date: new Date(2026, 0, 4), status: 'approved' },
  { id: '4', description: 'Internet & Communication', amount: 2500000, date: new Date(2026, 0, 3), status: 'paid' },
  { id: '5', description: 'Marketing Materials', amount: 5000000, date: new Date(2026, 0, 2), status: 'pending' },
];

const accountTypeIcons: Record<string, React.ReactNode> = {
  bank: <Landmark className="h-4 w-4" />,
  mobile_money: <Smartphone className="h-4 w-4" />,
  cash: <Banknote className="h-4 w-4" />,
  wallet: <Wallet className="h-4 w-4" />,
};

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
  draft: 'bg-gray-100 text-gray-800',
};

export function FinanceDashboardPage() {
  const navigate = useNavigate();
  const [loading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-24" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="h-6 w-6" style={{ color: FINANCE_COLOR }} />
            Financial Management
          </h1>
          <p className="text-muted-foreground">Overview of company finances, budgets, and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={() => navigate('/finance/expenses/new')} style={{ backgroundColor: FINANCE_COLOR }}>
            <Plus className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Pending Approvals Banner */}
      {mockMetrics.pendingApprovalsCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-medium text-amber-900">
                  You have {mockMetrics.pendingApprovalsCount} expense{mockMetrics.pendingApprovalsCount > 1 ? 's' : ''} pending approval
                  totaling {formatCurrencyUGX(mockMetrics.pendingApprovalsAmount)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/finance/approvals')}>
                Review
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cash */}
        <Card className="border-l-4" style={{ borderLeftColor: FINANCE_COLOR }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cash</p>
                <p className="text-2xl font-bold mt-1">{formatCurrencyUGX(mockMetrics.totalCash)}</p>
                <div className="flex items-center gap-1 mt-2">
                  {mockMetrics.cashTrend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={cn('text-sm', mockMetrics.cashTrend >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {mockMetrics.cashTrend}% from last month
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${FINANCE_COLOR}15` }}>
                <Landmark className="h-5 w-5" style={{ color: FINANCE_COLOR }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MTD Expenses */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">MTD Expenses</p>
                <p className="text-2xl font-bold mt-1">{formatCurrencyUGX(mockMetrics.mtdExpenses)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {mockMetrics.expenseCount} expenses this month
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
              <p className="text-2xl font-bold mt-1">{mockMetrics.budgetUtilization}%</p>
              <Progress 
                value={mockMetrics.budgetUtilization} 
                className="h-2 mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrencyUGX(mockMetrics.totalSpent)} of {formatCurrencyUGX(mockMetrics.totalBudget)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold mt-1">{formatCurrencyUGX(mockMetrics.pendingPayments)}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {mockMetrics.pendingInvoiceCount} invoices pending
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Overview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/budgets')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBudgets.map(budget => (
                <div key={budget.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{budget.name}</span>
                      <Badge variant="outline" className="text-xs">{budget.category}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrencyUGX(budget.spent)} / {formatCurrencyUGX(budget.allocated)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budget.utilization, 100)} 
                    className={cn(
                      "h-2",
                      budget.utilization >= 100 ? "[&>div]:bg-red-500" :
                      budget.utilization >= 90 ? "[&>div]:bg-amber-500" : "[&>div]:bg-green-500"
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{budget.utilization.toFixed(1)}% utilized</span>
                    <span className={cn(
                      "text-xs font-medium",
                      budget.remaining >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {budget.remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                      {formatCurrencyUGX(Math.abs(budget.remaining))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Balances */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Account Balances</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/accounts')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockAccounts.map(account => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${FINANCE_COLOR}15`, color: FINANCE_COLOR }}
                    >
                      {accountTypeIcons[account.type] || <Wallet className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.type === 'mobile_money' ? 'Mobile Money' : account.type}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{formatCurrencyUGX(account.balance)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Cash Flow Summary (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Month</th>
                    <th className="text-right py-2 font-medium">Income</th>
                    <th className="text-right py-2 font-medium">Expenses</th>
                    <th className="text-right py-2 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCashFlow.map(row => (
                    <tr key={row.month} className="border-b last:border-0">
                      <td className="py-2">{row.month}</td>
                      <td className="py-2 text-right text-green-600">{formatCurrencyUGX(row.income)}</td>
                      <td className="py-2 text-right text-red-600">{formatCurrencyUGX(row.expenses)}</td>
                      <td className={cn(
                        "py-2 text-right font-semibold",
                        row.net >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrencyUGX(row.net)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Expenses</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/finance/expenses')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-3">
                {mockExpenses.map(expense => (
                  <div 
                    key={expense.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => navigate(`/finance/expenses/${expense.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(expense.date, 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrencyUGX(expense.amount)}</p>
                        <Badge className={cn("text-[10px] mt-1", statusColors[expense.status])}>
                          {expense.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FinanceDashboardPage;
