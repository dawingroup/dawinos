/**
 * MatFlowProjectListPage
 * List MatFlow projects
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function MatFlowProjectListPage() {
  return (
    <>
      <Helmet>
        <title>MatFlow Projects | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Manage MatFlow projects</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first MatFlow project"
          action={{ label: 'Create Project', onClick: () => {} }}
        />
      </div>
    </>
  );
}
