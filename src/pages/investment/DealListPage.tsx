/**
 * DealListPage
 * List view of investment deals
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function DealListPage() {
  return (
    <>
      <Helmet>
        <title>Deals | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Deals</h1>
            <p className="text-muted-foreground">List of all investment deals</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        <EmptyState
          icon={FileText}
          title="No deals found"
          description="Create a new deal to get started"
          action={{ label: 'Create Deal', onClick: () => {} }}
        />
      </div>
    </>
  );
}
