/**
 * SupplierListPage
 * Supplier management
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Truck } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function SupplierListPage() {
  return (
    <>
      <Helmet>
        <title>Suppliers | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
            <p className="text-muted-foreground">Manage supplier relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>

        <EmptyState
          icon={Truck}
          title="No suppliers"
          description="Add your first supplier"
          action={{ label: 'Add Supplier', onClick: () => {} }}
        />
      </div>
    </>
  );
}
