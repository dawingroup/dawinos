/**
 * ClipDetail Component
 * Full detail view of a design clip
 */

import React from 'react';
import { 
  X, 
  ExternalLink, 
  Tag, 
  Link2, 
  Ruler, 
  Palette, 
  Package,
  Brain,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { DesignClip } from '../types';

interface ClipDetailProps {
  clip: DesignClip;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onLink?: () => void;
}

export function ClipDetail({ clip, onClose, onEdit, onDelete, onLink }: ClipDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex">
        {/* Image */}
        <div className="w-1/2 bg-gray-100 relative">
          <img 
            src={clip.imageUrl} 
            alt={clip.title}
            className="w-full h-full object-contain"
          />
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details */}
        <div className="w-1/2 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{clip.title}</h2>
                {clip.brand && (
                  <p className="text-sm text-gray-500 mt-1">{clip.brand}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button onClick={onEdit} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button onClick={onDelete} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {clip.price && (
              <p className="text-2xl font-bold text-gray-900 mt-2">{clip.price.formatted}</p>
            )}

            <a 
              href={clip.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              View original <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Description */}
            {clip.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{clip.description}</p>
              </div>
            )}

            {/* Dimensions */}
            {clip.dimensions && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Dimensions
                </h3>
                <div className="flex gap-4 text-sm">
                  {clip.dimensions.width && <span>W: {clip.dimensions.width}{clip.dimensions.unit}</span>}
                  {clip.dimensions.height && <span>H: {clip.dimensions.height}{clip.dimensions.unit}</span>}
                  {clip.dimensions.depth && <span>D: {clip.dimensions.depth}{clip.dimensions.unit}</span>}
                </div>
              </div>
            )}

            {/* Materials */}
            {clip.materials && clip.materials.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Materials
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clip.materials.map(material => (
                    <span key={material} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {material}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {clip.colors && clip.colors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clip.colors.map(color => (
                    <span key={color} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {clip.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {clip.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Analysis */}
            {clip.aiAnalysis && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> AI Analysis
                </h3>
                <div className="space-y-2 text-sm">
                  {clip.aiAnalysis.productType && (
                    <p><span className="text-purple-600">Type:</span> {clip.aiAnalysis.productType}</p>
                  )}
                  {clip.aiAnalysis.style && (
                    <p><span className="text-purple-600">Style:</span> {clip.aiAnalysis.style}</p>
                  )}
                  {clip.aiAnalysis.millworkAssessment && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="font-medium text-purple-700">Millwork Assessment</p>
                      <p className="mt-1">
                        Complexity: <span className="capitalize">{clip.aiAnalysis.millworkAssessment.complexity}</span>
                      </p>
                      {clip.aiAnalysis.millworkAssessment.estimatedHours && (
                        <p>Est. Hours: {clip.aiAnalysis.millworkAssessment.estimatedHours}h</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {clip.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{clip.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(clip.createdAt).toLocaleDateString()}
              </div>
              {onLink && !clip.designItemId && (
                <button
                  onClick={onLink}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
                >
                  <Link2 className="w-4 h-4" />
                  Link to Design Item
                </button>
              )}
              {clip.designItemId && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <Link2 className="w-4 h-4" />
                  Linked to design
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
