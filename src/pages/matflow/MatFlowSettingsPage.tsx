/**
 * MatFlowSettingsPage
 * MatFlow configuration
 */

import { Helmet } from 'react-helmet-async';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function MatFlowSettingsPage() {
  return (
    <>
      <Helmet>
        <title>MatFlow Settings | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure MatFlow settings</p>
        </div>

        <EmptyState
          icon={Settings}
          title="Settings"
          description="Configuration options will appear here"
        />
      </div>
    </>
  );
}
