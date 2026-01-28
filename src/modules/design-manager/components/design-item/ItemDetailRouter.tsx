/**
 * Item Detail Router
 * Routes to the appropriate detail page based on item sourcing type
 * Supports all 4 deliverable types: Custom Furniture, Procured, Design Document, Construction
 */

import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useDesignItem } from '../../hooks';
import { normalizeSourcingType } from '../../types/deliverables';

// Lazy load detail pages for code splitting
const ManufacturedItemDetail = lazy(() => import('./DesignItemDetail')); // Will be renamed later
const ProcuredItemDetail = lazy(() => import('./ProcuredItemDetail'));
const DesignDocumentDetail = lazy(() => import('./DesignDocumentDetail'));
const ConstructionItemDetail = lazy(() => import('./ConstructionItemDetail'));

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

  // Normalize the sourcing type to handle legacy values
  const sourcingType = normalizeSourcingType((item as any).sourcingType);

  // Route to the appropriate detail component based on sourcing type
  const DetailComponent = (() => {
    switch (sourcingType) {
      case 'PROCURED':
        return ProcuredItemDetail;
      case 'DESIGN_DOCUMENT':
        return DesignDocumentDetail;
      case 'CONSTRUCTION':
        return ConstructionItemDetail;
      case 'CUSTOM_FURNITURE_MILLWORK':
      default:
        return ManufacturedItemDetail;
    }
  })();

  return (
    <Suspense fallback={<PageLoader />}>
      <DetailComponent />
    </Suspense>
  );
}
