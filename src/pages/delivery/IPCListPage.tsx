/**
 * IPCListPage
 * List Interim Payment Certificates
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function IPCListPage() {
  return (
    <>
      <Helmet>
        <title>Payment Certificates | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Certificates</h1>
            <p className="text-muted-foreground">Manage Interim Payment Certificates (IPCs)</p>
          </div>
          <Button asChild>
            <Link to="/delivery/ipcs/new">
              <Plus className="mr-2 h-4 w-4" />
              New IPC
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={Receipt}
          title="No payment certificates"
          description="Create your first IPC"
          action={{ label: 'Create IPC', onClick: () => window.location.href = '/delivery/ipcs/new' }}
        />
      </div>
    </>
  );
}
