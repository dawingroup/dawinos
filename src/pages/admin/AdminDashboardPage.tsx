/**
 * AdminDashboardPage
 * Admin dashboard
 */

import { Helmet } from 'react-helmet-async';
import { StatsCard } from '@/shared/components/data-display/StatsCard';
import { Users, Shield, Activity, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <>
      <Helmet>
        <title>Administration | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Users" value={45} icon={Users} />
          <StatsCard title="Active Roles" value={8} icon={Shield} />
          <StatsCard title="Audit Events" value={1250} icon={Activity} />
          <StatsCard title="Settings" value="Active" icon={Settings} />
        </div>
      </div>
    </>
  );
}
