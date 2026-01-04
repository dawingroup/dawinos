/**
 * ProcurementListPage
 * Procurement orders management
 */

import { Helmet } from 'react-helmet-async';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function ProcurementListPage() {
  return (
    <>
      <Helmet>
        <title>Procurement | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
            <p className="text-muted-foreground">Manage procurement orders</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>

        <EmptyState
          icon={ShoppingCart}
          title="No procurement orders"
          description="Create your first procurement order"
          action={{ label: 'Create Order', onClick: () => {} }}
        />
      </div>
    </>
  );
}
