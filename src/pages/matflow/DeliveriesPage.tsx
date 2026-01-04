/**
 * DeliveriesPage
 * MatFlow deliveries management
 */

import { Helmet } from 'react-helmet-async';
import { Truck } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function DeliveriesPage() {
  return (
    <>
      <Helmet>
        <title>Deliveries | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Deliveries</h1>
          <p className="text-muted-foreground">Track material deliveries</p>
        </div>

        <EmptyState
          icon={Truck}
          title="No deliveries"
          description="Scheduled and past deliveries will be listed here"
        />
      </div>
    </>
  );
}
