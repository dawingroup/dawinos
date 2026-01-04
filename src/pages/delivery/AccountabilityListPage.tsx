/**
 * AccountabilityListPage
 * List accountability packages
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function AccountabilityListPage() {
  return (
    <>
      <Helmet>
        <title>Accountability | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accountability</h1>
            <p className="text-muted-foreground">Track accountability packages and reports</p>
          </div>
          <Button asChild>
            <Link to="/delivery/accountability/new">
              <Plus className="mr-2 h-4 w-4" />
              New Package
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={FileText}
          title="No accountability packages"
          description="Create your first accountability package"
          action={{ label: 'Create Package', onClick: () => window.location.href = '/delivery/accountability/new' }}
        />
      </div>
    </>
  );
}
