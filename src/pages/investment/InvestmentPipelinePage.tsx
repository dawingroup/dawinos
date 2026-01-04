/**
 * InvestmentPipelinePage
 * Visual pipeline for investment deals
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Kanban } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function InvestmentPipelinePage() {
  return (
    <>
      <Helmet>
        <title>Pipeline | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
            <p className="text-muted-foreground">Visual deal tracking</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>

        <EmptyState
          icon={Kanban}
          title="Pipeline empty"
          description="Start adding deals to your pipeline"
          action={{ label: 'Add Deal', onClick: () => {} }}
        />
      </div>
    </>
  );
}
