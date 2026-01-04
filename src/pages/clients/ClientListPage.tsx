/**
 * ClientListPage
 * List all clients
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function ClientListPage() {
  return (
    <>
      <Helmet>
        <title>Clients | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Manage your client relationships</p>
          </div>
          <Button asChild>
            <Link to="/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Get started by adding your first client"
          action={{ label: 'Add Client', onClick: () => window.location.href = '/clients/new' }}
        />
      </div>
    </>
  );
}
