/**
 * AdvisoryDashboardPage
 * Advisory module dashboard
 */

import { Helmet } from 'react-helmet-async';
import { StatsCard } from '@/shared/components/data-display/StatsCard';
import { Wallet, FileText, Users, PieChart } from 'lucide-react';

export default function AdvisoryDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Advisory | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advisory</h1>
          <p className="text-muted-foreground">Manage portfolios and advisory mandates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Portfolios" value={12} icon={Wallet} />
          <StatsCard title="Active Mandates" value={8} icon={FileText} />
          <StatsCard title="Clients" value={15} icon={Users} />
          <StatsCard title="AUM" value="$120M" icon={PieChart} />
        </div>
      </div>
    </>
  );
}
