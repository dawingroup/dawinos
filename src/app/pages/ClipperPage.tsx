/**
 * ClipperPage
 * Main page for the Dawin Clipper module
 */

import { useState } from 'react';
import { Image, Download, Lightbulb, Puzzle, ShoppingCart, ExternalLink, Sparkles } from 'lucide-react';
import { ClipGallery } from '@/subsidiaries/finishes/clipper/components';
import { useClips } from '@/subsidiaries/finishes/clipper/hooks';
import type { DesignClip } from '@/subsidiaries/finishes/clipper/types';
import { ClipDetail } from '@/subsidiaries/finishes/clipper/components/ClipDetail';
import { ClipEditModal } from '@/subsidiaries/finishes/clipper/components/ClipEditModal';

export default function ClipperPage() {
  const { clips, loading, deleteClip, updateClip } = useClips();
  const [selectedClip, setSelectedClip] = useState<DesignClip | null>(null);
  const [editingClip, setEditingClip] = useState<DesignClip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const inspirationCount = clips.filter(c => c.clipType === 'inspiration').length;
  const partsCount = clips.filter(c => c.clipType === 'parts-source').length;
  const procurementCount = clips.filter(c => c.clipType === 'procurement').length;

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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{inspirationCount}</p>
              <p className="text-sm text-gray-500">Inspiration</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Puzzle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{partsCount}</p>
              <p className="text-sm text-gray-500">Parts Source</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{procurementCount}</p>
              <p className="text-sm text-gray-500">Procurement</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {clips.filter(c => c.analysisStatus === 'completed').length}
              </p>
              <p className="text-sm text-gray-500">AI Analyzed</p>
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
          onEdit={() => {
            setEditingClip(selectedClip);
            setSelectedClip(null);
          }}
          onDelete={async () => {
            if (window.confirm('Are you sure you want to delete this clip?')) {
              setIsDeleting(true);
              try {
                await deleteClip(selectedClip.id);
                setSelectedClip(null);
              } catch (error) {
                console.error('Failed to delete clip:', error);
                alert('Failed to delete clip');
              } finally {
                setIsDeleting(false);
              }
            }
          }}
        />
      )}

      {/* Edit Modal */}
      {editingClip && (
        <ClipEditModal
          clip={editingClip}
          onClose={() => setEditingClip(null)}
          onSave={async (updates) => {
            try {
              await updateClip(editingClip.id, updates);
              setEditingClip(null);
            } catch (error) {
              console.error('Failed to update clip:', error);
              alert('Failed to update clip');
            }
          }}
        />
      )}
    </div>
  );
}
