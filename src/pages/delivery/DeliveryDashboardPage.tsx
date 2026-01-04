/**
 * DeliveryDashboardPage
 * Infrastructure Delivery module dashboard
 */

import { Helmet } from 'react-helmet-async';
import { StatsCard } from '@/shared/components/data-display/StatsCard';
import { FolderOpen, Receipt, ClipboardList, CheckSquare } from 'lucide-react';

export default function DeliveryDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Infrastructure Delivery | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Infrastructure Delivery</h1>
          <p className="text-muted-foreground">Manage construction projects and deliverables</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Projects" value={5} icon={FolderOpen} />
          <StatsCard title="Pending IPCs" value={3} icon={Receipt} />
          <StatsCard title="Open Requisitions" value={12} icon={ClipboardList} />
          <StatsCard title="Pending Approvals" value={4} icon={CheckSquare} />
        </div>
      </div>
    </>
  );
}
