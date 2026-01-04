/**
 * ApprovalQueuePage
 * Approval queue for pending items
 */

import { Helmet } from 'react-helmet-async';
import { CheckSquare } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function ApprovalQueuePage() {
  return (
    <>
      <Helmet>
        <title>Approval Queue | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Approval Queue</h1>
          <p className="text-muted-foreground">Review and approve pending items</p>
        </div>

        <EmptyState
          icon={CheckSquare}
          title="No pending approvals"
          description="All items have been reviewed"
        />
      </div>
    </>
  );
}
