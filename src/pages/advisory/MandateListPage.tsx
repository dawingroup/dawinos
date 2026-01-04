/**
 * MandateListPage
 * List advisory mandates
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function MandateListPage() {
  return (
    <>
      <Helmet>
        <title>Mandates | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mandates</h1>
            <p className="text-muted-foreground">Manage advisory mandates</p>
          </div>
          <Button asChild>
            <Link to="/advisory/mandates/new">
              <Plus className="mr-2 h-4 w-4" />
              New Mandate
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={FileText}
          title="No mandates"
          description="Create your first advisory mandate"
          action={{ label: 'Create Mandate', onClick: () => window.location.href = '/advisory/mandates/new' }}
        />
      </div>
    </>
  );
}
