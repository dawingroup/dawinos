/**
 * ProjectInspirationSummary Component
 * Shows all inspiration clips linked to design items in this project
 * Allows converting clips to project parts
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { Lightbulb, ExternalLink, Sparkles, ChevronRight, ArrowRight, Package, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectParts } from '../../hooks/useProjectParts';
import type { DesignClip } from '@/subsidiaries/finishes/clipper/types';

interface ProjectInspirationSummaryProps {
  projectId: string;
}

interface ClipWithItemName extends DesignClip {
  designItemName?: string;
  convertedToPartId?: string;
}

export function ProjectInspirationSummary({ projectId }: ProjectInspirationSummaryProps) {
  const { user } = useAuth();
  const { parts, createFromClip, bulkConvertFromClips } = useProjectParts(projectId, user?.uid || '');
  const [clips, setClips] = useState<ClipWithItemName[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [bulkConverting, setBulkConverting] = useState(false);

  useEffect(() => {
    const clipsRef = collection(db, 'designClips');
    const q = query(clipsRef, where('projectId', '==', projectId));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const clipData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
      })) as ClipWithItemName[];
      
      // Fetch design item names for linked clips
      const clipsWithNames = await Promise.all(
        clipData.map(async (clip) => {
          if (clip.designItemId) {
            try {
              const itemRef = doc(db, 'designProjects', projectId, 'designItems', clip.designItemId);
              const itemSnap = await getDoc(itemRef);
              if (itemSnap.exists()) {
                return { ...clip, designItemName: itemSnap.data().name };
              }
            } catch (e) {
              console.error('Error fetching design item:', e);
            }
          }
          return clip;
        })
      );
      
      // Mark clips that are already converted to parts
      const clipsWithConversion = clipsWithNames.map(clip => ({
        ...clip,
        convertedToPartId: parts.find(p => p.clipId === clip.id)?.id,
      }));
      
      setClips(clipsWithConversion);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching project clips:', error);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [projectId, parts]);

  // Convert a single clip to project part
  const handleConvertToPart = async (clip: ClipWithItemName) => {
    setConvertingId(clip.id);
    try {
      await createFromClip(clip);
    } catch (error) {
      console.error('Failed to convert clip to part:', error);
      alert('Failed to convert clip to part');
    } finally {
      setConvertingId(null);
    }
  };

  // Bulk convert all unconverted clips to parts
  const handleBulkConvert = async () => {
    const unconvertedClips = clips.filter(c => !c.convertedToPartId);
    if (unconvertedClips.length === 0) return;
    
    if (!confirm(`Convert ${unconvertedClips.length} clips to project parts?`)) return;
    
    setBulkConverting(true);
    try {
      await bulkConvertFromClips(unconvertedClips);
    } catch (error) {
      console.error('Failed to bulk convert clips:', error);
      alert('Failed to convert some clips');
    } finally {
      setBulkConverting(false);
    }
  };

  const unconvertedCount = clips.filter(c => !c.convertedToPartId).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (clips.length === 0) {
    return null;
  }

  const displayClips = expanded ? clips : clips.slice(0, 6);
  const hasMore = clips.length > 6;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-600" />
          Project Inspiration
          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {clips.length} clips
          </span>
        </h2>
        
        {unconvertedCount > 0 && (
          <button
            onClick={handleBulkConvert}
            disabled={bulkConverting}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0A7C8E] text-white text-xs font-medium rounded-lg hover:bg-[#086a7a] disabled:opacity-50 transition-colors"
          >
            {bulkConverting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Package className="w-3 h-3" />
            )}
            Convert {unconvertedCount} to Parts
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {displayClips.map((clip) => (
          <div
            key={clip.id}
            className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all"
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              <img
                src={clip.thumbnailUrl || clip.imageUrl}
                alt={clip.title}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <a
                  href={clip.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  <ExternalLink className="w-4 h-4 text-gray-700" />
                </a>
              </div>

              {/* AI badge */}
              {clip.aiAnalysis && (
                <div className="absolute top-1 right-1 p-1 bg-purple-500 rounded-full">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-medium text-gray-900 truncate">{clip.title}</p>
              
              {/* Linked design item */}
              {clip.designItemId && clip.designItemName && (
                <Link
                  to={`/design/${projectId}/item/${clip.designItemId}`}
                  className="mt-1 flex items-center gap-1 text-xs text-[#0A7C8E] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="truncate">{clip.designItemName}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" />
                </Link>
              )}
              
              {/* Convert to part button or converted indicator */}
              {clip.convertedToPartId ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <Check className="w-3 h-3" />
                  <span>In Parts Library</span>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleConvertToPart(clip); }}
                  disabled={convertingId === clip.id}
                  className="mt-1 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  {convertingId === clip.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Package className="w-3 h-3" />
                  )}
                  <span>Convert to Part</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-1 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {expanded ? 'Show less' : `View all ${clips.length} clips`}
          <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
      )}
    </div>
  );
}
