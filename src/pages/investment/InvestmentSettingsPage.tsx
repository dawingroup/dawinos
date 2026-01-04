/**
 * InvestmentSettingsPage
 * Investment module configuration
 */

import { Helmet } from 'react-helmet-async';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function InvestmentSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Investment Settings | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Investment Settings</h1>
          <p className="text-muted-foreground">Configure investment module preferences</p>
        </div>

        <EmptyState
          icon={Settings}
          title="Settings"
          description="Investment configuration options will appear here"
        />
      </div>
    </>
  );
}
