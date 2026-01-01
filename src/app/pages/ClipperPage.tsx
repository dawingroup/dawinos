/**
 * ClipperPage
 * Main page for the Dawin Clipper module
 */

import { useState } from 'react';
import { Image, Download, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { ClipGallery } from '@/subsidiaries/finishes/clipper/components';
import { useClips } from '@/subsidiaries/finishes/clipper/hooks';
import type { DesignClip } from '@/subsidiaries/finishes/clipper/types';
import { ClipDetail } from '@/subsidiaries/finishes/clipper/components/ClipDetail';

export default function ClipperPage() {
  const { clips, loading } = useClips();
  const [selectedClip, setSelectedClip] = useState<DesignClip | null>(null);

  const syncedCount = clips.filter(c => c.syncStatus === 'synced').length;
  const pendingCount = clips.filter(c => c.syncStatus === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Design Clipper</h1>
          <p className="text-gray-500 mt-1">
            Capture and organize design inspiration from anywhere on the web
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://chrome.google.com/webstore"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Get Extension
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{clips.length}</p>
              <p className="text-sm text-gray-500">Total Clips</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{syncedCount}</p>
              <p className="text-sm text-gray-500">Synced</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Sync</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clips.filter(c => c.designItemId).length}
              </p>
              <p className="text-sm text-gray-500">Linked</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works - shown when no clips */}
      {!loading && clips.length === 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8 border border-purple-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900">Install Extension</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get the Dawin Clipper Chrome extension
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900">Clip Designs</h3>
              <p className="text-sm text-gray-600 mt-1">
                Browse Wayfair, Pinterest, Houzz and clip furniture you like
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900">Use in Projects</h3>
              <p className="text-sm text-gray-600 mt-1">
                Link clips to design items as inspiration
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clip Gallery */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ClipGallery 
          onClipSelect={(clip) => setSelectedClip(clip)}
        />
      </div>

      {/* Clip Detail Modal */}
      {selectedClip && (
        <ClipDetail
          clip={selectedClip}
          onClose={() => setSelectedClip(null)}
        />
      )}
    </div>
  );
}
