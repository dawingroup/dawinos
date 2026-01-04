/**
 * ProjectListPage
 * List infrastructure projects
 */

import { Helmet } from 'react-helmet-async';
import { Plus, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function ProjectListPage() {
  return (
    <>
      <Helmet>
        <title>Projects | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">Infrastructure delivery projects</p>
          </div>
          <Button asChild>
            <Link to="/delivery/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        <EmptyState
          icon={FolderOpen}
          title="No projects yet"
          description="Create your first infrastructure project"
          action={{ label: 'Create Project', onClick: () => window.location.href = '/delivery/projects/new' }}
        />
      </div>
    </>
  );
}
