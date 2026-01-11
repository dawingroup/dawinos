/**
 * ClipDetail - Detailed view of a single clip
 */

import { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Tag,
  Trash2,
  Edit2,
  Save,
  X,
  Ruler,
  DollarSign,
  Palette,
  Box,
  Sparkles,
} from 'lucide-react';
import type { PopupClipRecord } from '../types';
import { SyncBadge } from './SyncBadge';

interface ClipDetailProps {
  clip: PopupClipRecord;
  onBack: () => void;
  onUpdate: (id: string, updates: Partial<PopupClipRecord>) => void;
  onDelete: (id: string) => void;
  onAnalyze?: (id: string) => void;
}

export function ClipDetail({ clip, onBack, onUpdate, onDelete, onAnalyze }: ClipDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClip, setEditedClip] = useState(clip);
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdate(clip.id, {
      title: editedClip.title,
      description: editedClip.description,
      notes: editedClip.notes,
      tags: editedClip.tags,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedClip(clip);
    setIsEditing(false);
  };

  const addTag = () => {
    if (newTag.trim() && !editedClip.tags.includes(newTag.trim())) {
      setEditedClip({
        ...editedClip,
        tags: [...editedClip.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setEditedClip({
      ...editedClip,
      tags: editedClip.tags.filter((t) => t !== tag),
    });
  };

  const imageUrl = clip.thumbnailDataUrl || clip.imageUrl;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <SyncBadge status={clip.syncStatus} />
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="p-1.5 text-primary hover:bg-primary/10 rounded"
              >
                <Save className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(clip.id)}
                className="p-1.5 text-error hover:bg-error/10 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Image */}
        <div className="relative bg-gray-100">
          <img
            src={imageUrl}
            alt={clip.title}
            className="w-full h-48 object-contain"
          />
          <a
            href={clip.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </a>
        </div>

        {/* Details */}
        <div className="p-4 space-y-4">
          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={editedClip.title}
              onChange={(e) => setEditedClip({ ...editedClip, title: e.target.value })}
              className="w-full text-lg font-semibold border-b border-gray-200 pb-1 focus:outline-none focus:border-primary"
            />
          ) : (
            <h2 className="text-lg font-semibold">{clip.title || 'Untitled'}</h2>
          )}

          {/* Brand */}
          {clip.brand && (
            <p className="text-sm text-gray-500">{clip.brand}</p>
          )}

          {/* Price & Dimensions */}
          <div className="flex flex-wrap gap-3">
            {clip.price && (
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="font-medium">{clip.price.formatted}</span>
              </div>
            )}
            {clip.dimensions && (
              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                <Ruler className="w-4 h-4" />
                <span>
                  {clip.dimensions.width}" × {clip.dimensions.height}"
                  {clip.dimensions.depth && ` × ${clip.dimensions.depth}"`}
                </span>
              </div>
            )}
          </div>

          {/* Materials */}
          {clip.materials && clip.materials.length > 0 && (
            <div className="flex items-start gap-2">
              <Box className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {clip.materials.map((material) => (
                  <span
                    key={material}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {material}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {clip.colors && clip.colors.length > 0 && (
            <div className="flex items-start gap-2">
              <Palette className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {clip.colors.map((color) => (
                  <span
                    key={color}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {(isEditing ? editedClip.tags : clip.tags).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                >
                  {tag}
                  {isEditing && (
                    <button onClick={() => removeTag(tag)} className="hover:text-error">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    placeholder="Add tag..."
                    className="w-20 px-2 py-0.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {(clip.description || isEditing) && (
            <div className="space-y-1">
              <span className="text-sm font-medium">Description</span>
              {isEditing ? (
                <textarea
                  value={editedClip.description || ''}
                  onChange={(e) => setEditedClip({ ...editedClip, description: e.target.value })}
                  className="w-full text-sm text-gray-600 border border-gray-200 rounded p-2 focus:outline-none focus:border-primary"
                  rows={3}
                />
              ) : (
                <p className="text-sm text-gray-600">{clip.description}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <span className="text-sm font-medium">Notes</span>
            {isEditing ? (
              <textarea
                value={editedClip.notes || ''}
                onChange={(e) => setEditedClip({ ...editedClip, notes: e.target.value })}
                placeholder="Add your notes..."
                className="w-full text-sm border border-gray-200 rounded p-2 focus:outline-none focus:border-primary"
                rows={3}
              />
            ) : (
              <p className="text-sm text-gray-600">{clip.notes || 'No notes yet'}</p>
            )}
          </div>

          {/* AI Analysis */}
          {clip.aiAnalysis ? (
            <div className="p-3 bg-purple-50 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">AI Analysis</span>
              </div>
              <p className="text-sm text-purple-600">{clip.aiAnalysis.productType} - {clip.aiAnalysis.style}</p>
              {clip.aiAnalysis.style && (
                <p className="text-xs text-purple-500">Style: {clip.aiAnalysis.style}</p>
              )}
            </div>
          ) : onAnalyze && (
            <button
              onClick={() => onAnalyze(clip.id)}
              className="w-full flex items-center justify-center gap-2 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Analyze with AI</span>
            </button>
          )}

          {/* Metadata */}
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-1">
            <p>Clipped: {new Date(clip.createdAt).toLocaleString()}</p>
            {clip.sku && <p>SKU: {clip.sku}</p>}
            <p className="truncate">Source: {clip.sourceUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
