/**
 * MaterialCatalogPage
 * Material catalog management
 */

import { Helmet } from 'react-helmet-async';
import { Plus, Boxes } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';

export default function MaterialCatalogPage() {
  return (
    <>
      <Helmet>
        <title>Material Catalog | Dawin Advisory Platform</title>
      </Helmet>

      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Material Catalog</h1>
            <p className="text-muted-foreground">Browse and manage materials</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>

        <EmptyState
          icon={Boxes}
          title="No materials in catalog"
          description="Add materials to your catalog"
          action={{ label: 'Add Material', onClick: () => {} }}
        />
      </div>
    </>
  );
}
