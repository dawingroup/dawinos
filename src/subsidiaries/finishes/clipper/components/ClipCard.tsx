/**
 * ClipCard Component
 * Displays a single clip in gallery view
 */

import React from 'react';
import { ExternalLink, Tag, Link2, MoreVertical } from 'lucide-react';
import type { DesignClip } from '../types';

interface ClipCardProps {
  clip: DesignClip;
  onClick?: () => void;
  onLink?: () => void;
  selected?: boolean;
}

export function ClipCard({ clip, onClick, onLink, selected }: ClipCardProps) {
  return (
    <div 
      className={`group relative bg-white rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        selected ? 'ring-2 ring-primary border-primary' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <img 
          src={clip.thumbnailUrl || clip.imageUrl} 
          alt={clip.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <a 
              href={clip.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white rounded-full hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4 text-gray-700" />
            </a>
            {onLink && (
              <button 
                onClick={(e) => { e.stopPropagation(); onLink(); }}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
              >
                <Link2 className="w-4 h-4 text-gray-700" />
              </button>
            )}
          </div>
        </div>
        
        {/* Sync status badge */}
        {clip.syncStatus !== 'synced' && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${
            clip.syncStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
            clip.syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
            'bg-red-100 text-red-700'
          }`}>
            {clip.syncStatus}
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{clip.title}</h3>
        
        {clip.price && (
          <p className="text-sm text-gray-600 mt-0.5">{clip.price.formatted}</p>
        )}
        
        {clip.brand && (
          <p className="text-xs text-gray-500 mt-0.5">{clip.brand}</p>
        )}
        
        {/* Tags */}
        {clip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {clip.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {clip.tags.length > 3 && (
              <span className="text-xs text-gray-400">+{clip.tags.length - 3}</span>
            )}
          </div>
        )}
        
        {/* Linked indicator */}
        {clip.designItemId && (
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <Link2 className="w-3 h-3" />
            Linked to design
          </div>
        )}
      </div>
    </div>
  );
}
