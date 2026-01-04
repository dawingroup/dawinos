/**
 * MatFlowDashboardPage
 * MatFlow module dashboard
 */

import { Helmet } from 'react-helmet-async';
import { StatsCard } from '@/shared/components/data-display/StatsCard';
import { FileText, Boxes, ShoppingCart, Truck } from 'lucide-react';

export default function MatFlowDashboardPage() {
  return (
    <>
      <Helmet>
        <title>MatFlow | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">MatFlow</h1>
          <p className="text-muted-foreground">BOQ management and material procurement</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active BOQs" value={15} icon={FileText} />
          <StatsCard title="Materials" value={234} icon={Boxes} />
          <StatsCard title="Open Orders" value={8} icon={ShoppingCart} />
          <StatsCard title="Suppliers" value={42} icon={Truck} />
        </div>
      </div>
    </>
  );
}
