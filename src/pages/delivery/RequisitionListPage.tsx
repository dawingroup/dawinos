/**
 * RequisitionListPage
 * List requisitions
 */

import { Helmet } from 'react-helmet-async';
import { Plus, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function RequisitionListPage() {
  return (
    <>
      <Helmet>
        <title>Requisitions | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Requisitions</h1>
            <p className="text-muted-foreground">Manage material and resource requisitions</p>
          </div>
          <Button asChild>
            <Link to="/delivery/requisitions/new">
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={ClipboardList}
          title="No requisitions"
          description="Create your first requisition"
          action={{ label: 'Create Requisition', onClick: () => window.location.href = '/delivery/requisitions/new' }}
        />
      </div>
    </>
  );
}
