/**
 * BudgetTrackingPage
 * MatFlow budget tracking
 */

import { Helmet } from 'react-helmet-async';
import { Wallet } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function BudgetTrackingPage() {
  return (
    <>
      <Helmet>
        <title>Budget Tracking | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Budget Tracking</h1>
          <p className="text-muted-foreground">Track project budgets and expenses</p>
        </div>

        <EmptyState
          icon={Wallet}
          title="No budget data"
          description="Budget tracking information will appear here"
        />
      </div>
    </>
  );
}
