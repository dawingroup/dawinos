/**
 * BOQListPage
 * List Bills of Quantities
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function BOQListPage() {
  return (
    <>
      <Helmet>
        <title>Bills of Quantities | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bills of Quantities</h1>
            <p className="text-muted-foreground">Manage BOQs and material lists</p>
          </div>
          <Button asChild>
            <Link to="/matflow/boq/parse">
              <Plus className="mr-2 h-4 w-4" />
              Parse BOQ
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={FileText}
          title="No BOQs yet"
          description="Upload and parse your first Bill of Quantities"
          action={{ label: 'Parse BOQ', onClick: () => window.location.href = '/matflow/boq/parse' }}
        />
      </div>
    </>
  );
}
