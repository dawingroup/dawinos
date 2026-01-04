/**
 * InvestmentCommitteePage
 * Investment committee meetings and decisions
 */

import { Helmet } from 'react-helmet-async';
import { Scale } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function InvestmentCommitteePage() {
  return (
    <>
      <Helmet>
        <title>Investment Committee | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Investment Committee</h1>
          <p className="text-muted-foreground">Committee meetings and investment decisions</p>
        </div>

        <EmptyState
          icon={Scale}
          title="No committee meetings"
          description="Schedule your first investment committee meeting"
        />
      </div>
    </>
  );
}
