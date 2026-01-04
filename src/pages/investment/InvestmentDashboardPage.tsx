/**
 * InvestmentDashboardPage
 * Investment module dashboard
 */

import { Helmet } from 'react-helmet-async';
import { StatsCard } from '@/shared/components/data-display/StatsCard';
import { TrendingUp, Kanban, Scale, FileText } from 'lucide-react';

export default function InvestmentDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Investment | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Investment</h1>
          <p className="text-muted-foreground">Track deals and investment pipeline</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Deals" value={8} icon={Kanban} />
          <StatsCard title="In Due Diligence" value={3} icon={FileText} />
          <StatsCard title="Committee Review" value={2} icon={Scale} />
          <StatsCard title="Total Pipeline" value="$45M" icon={TrendingUp} />
        </div>
      </div>
    </>
  );
}
