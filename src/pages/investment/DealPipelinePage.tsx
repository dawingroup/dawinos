/**
 * DealPipelinePage
 * Deal pipeline kanban view
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Kanban } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function DealPipelinePage() {
  return (
    <>
      <Helmet>
        <title>Deal Pipeline | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deal Pipeline</h1>
            <p className="text-muted-foreground">Track and manage investment deals</p>
          </div>
          <Button asChild>
            <Link to="/investment/deals/new">
              <Plus className="mr-2 h-4 w-4" />
              New Deal
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={Kanban}
          title="No deals in pipeline"
          description="Start tracking your investment opportunities"
          action={{ label: 'Add Deal', onClick: () => window.location.href = '/investment/deals/new' }}
        />
      </div>
    </>
  );
}
