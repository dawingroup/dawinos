/**
 * Item Detail Router
 * Routes to the appropriate detail page based on item sourcing type
 */

import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useDesignItem } from '../../hooks';

// Lazy load detail pages
const DesignItemDetail = lazy(() => import('./DesignItemDetail'));
const ProcuredItemDetail = lazy(() => import('./ProcuredItemDetail'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A7C8E]"></div>
    </div>
  );
}

export default function ItemDetailRouter() {
  const { projectId, itemId } = useParams<{ projectId: string; itemId: string }>();
  const { item, loading } = useDesignItem(projectId, itemId);

  if (loading) {
    return <PageLoader />;
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Item not found</h2>
      </div>
    );
  }

  // Route based on sourcing type
  const isProcured = (item as any).sourcingType === 'PROCURED';

  return (
    <Suspense fallback={<PageLoader />}>
      {isProcured ? <ProcuredItemDetail /> : <DesignItemDetail />}
    </Suspense>
  );
}
