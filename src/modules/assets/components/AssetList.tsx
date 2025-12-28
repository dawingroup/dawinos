/**
 * Asset List Component
 * Grid view of assets with status badges
 */

import type { Asset, AssetStatus } from '@/shared/types';

interface AssetListProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
  onStatusChange: (asset: Asset, newStatus: AssetStatus) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<AssetStatus, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Active', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  MAINTENANCE: { label: 'Maintenance', bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  BROKEN: { label: 'Broken', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  CHECKED_OUT: { label: 'Checked Out', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  RETIRED: { label: 'Retired', bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
};

const CATEGORY_ICONS: Record<string, string> = {
  STATIONARY_MACHINE: '🏭',
  POWER_TOOL: '🔌',
  HAND_TOOL: '🔧',
  JIG: '📐',
};

export function AssetList({ assets, onAssetClick, onStatusChange, isLoading }: AssetListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No assets</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first asset.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => {
        const statusConfig = STATUS_CONFIG[asset.status];
        const displayName = asset.nickname || `${asset.brand} ${asset.model}`;
        const maintenanceDue = asset.maintenance?.nextServiceDue 
          ? new Date(asset.maintenance.nextServiceDue) <= new Date()
          : false;

        return (
          <div
            key={asset.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onAssetClick(asset)}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CATEGORY_ICONS[asset.category] || '🔧'}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                      {displayName}
                    </h3>
                    {asset.nickname && (
                      <p className="text-sm text-gray-500">
                        {asset.brand} {asset.model}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Status Badge */}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} mr-1.5`} />
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              {/* Quick Specs */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(asset.specs || {}).slice(0, 3).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-700"
                  >
                    <span className="font-medium">{key}:</span>
                    <span className="ml-1">{value}</span>
                  </span>
                ))}
              </div>

              {/* Location */}
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {asset.location?.zone || 'No location set'}
              </div>

              {/* Maintenance Warning */}
              {maintenanceDue && (
                <div className="flex items-center text-sm text-amber-600 bg-amber-50 rounded px-2 py-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Maintenance due
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
              <div className="flex justify-between items-center">
                <select
                  value={asset.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    onStatusChange(asset, e.target.value as AssetStatus);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  {asset.manualUrl && (
                    <a
                      href={asset.manualUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-gray-600"
                      title="View Manual"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </a>
                  )}
                  {asset.productPageUrl && (
                    <a
                      href={asset.productPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-gray-600"
                      title="View Product Page"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
