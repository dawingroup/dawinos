/**
 * EngagementListPage
 * List all engagements
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function EngagementListPage() {
  return (
    <>
      <Helmet>
        <title>Engagements | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Engagements</h1>
            <p className="text-muted-foreground">
              Manage all your programs, deals, and advisory mandates
            </p>
          </div>
          <Button asChild>
            <Link to="/engagements/new">
              <Plus className="mr-2 h-4 w-4" />
              New Engagement
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={Briefcase}
          title="No engagements yet"
          description="Get started by creating your first engagement"
          action={{
            label: 'Create Engagement',
            onClick: () => window.location.href = '/engagements/new',
          }}
        />
      </div>
    </>
  );
}
