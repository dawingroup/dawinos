/**
 * UserManagementPage
 * User management interface
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function UserManagementPage() {
  return (
    <>
      <Helmet>
        <title>User Management | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Manage system users and permissions</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <EmptyState
          icon={Users}
          title="No users to display"
          description="User list will appear here"
          action={{ label: 'Add User', onClick: () => {} }}
        />
      </div>
    </>
  );
}
