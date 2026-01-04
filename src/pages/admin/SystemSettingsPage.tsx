/**
 * SystemSettingsPage
 * System configuration settings
 */

import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';

export default function SystemSettingsPage() {
  return (
    <>
      <Helmet>
        <title>System Settings | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">System settings will be displayed here</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
