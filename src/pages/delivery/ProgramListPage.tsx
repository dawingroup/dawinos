/**
 * ProgramListPage
 * List delivery programs
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function ProgramListPage() {
  return (
    <>
      <Helmet>
        <title>Programs | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
            <p className="text-muted-foreground">Manage delivery programs</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Program
          </Button>
        </div>

        <EmptyState
          icon={FolderOpen}
          title="No programs yet"
          description="Create your first delivery program"
          action={{ label: 'Create Program', onClick: () => {} }}
        />
      </div>
    </>
  );
}
