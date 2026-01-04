/**
 * MatFlowReportsPage
 * MatFlow analytics and reports
 */

import { Helmet } from 'react-helmet-async';
import { PieChart } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function MatFlowReportsPage() {
  return (
    <>
      <Helmet>
        <title>MatFlow Reports | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Material flow analytics and insights</p>
        </div>

        <EmptyState
          icon={PieChart}
          title="No reports generated"
          description="Reports will appear here once you have data"
        />
      </div>
    </>
  );
}
