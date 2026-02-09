// ============================================================================
// SECTION REVIEW CARD COMPONENT
// DawinOS v2.0 - CEO Strategy Command
// Reusable card for each strategy review section with score, status, notes
// ============================================================================

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  Plus,
  X,
} from 'lucide-react';
import type { SectionReview, ReviewSectionStatus } from '../../types/strategy.types';
import {
  REVIEW_SECTION_STATUS_LABELS,
  REVIEW_SECTION_STATUS_COLORS,
  REVIEW_SCORE_LABELS,
  REVIEW_SCORE_COLORS,
  REVIEW_SECTION_LABELS,
  REVIEW_SECTION_DESCRIPTIONS,
  type ReviewSectionKey,
} from '../../constants/strategyReview.constants';

export interface SectionReviewCardProps {
  sectionKey: ReviewSectionKey;
  review: SectionReview;
  onChange: (review: SectionReview) => void;
  onRequestAI?: () => void;
  isAILoading?: boolean;
  children?: React.ReactNode;
  readOnly?: boolean;
}

export const SectionReviewCard: React.FC<SectionReviewCardProps> = ({
  sectionKey,
  review,
  onChange,
  onRequestAI,
  isAILoading = false,
  children,
  readOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newRecommendation, setNewRecommendation] = useState('');

  const label = REVIEW_SECTION_LABELS[sectionKey];
  const description = REVIEW_SECTION_DESCRIPTIONS[sectionKey];
  const statusLabel = REVIEW_SECTION_STATUS_LABELS[review.status] || 'Not Started';
  const statusColor = REVIEW_SECTION_STATUS_COLORS[review.status] || 'bg-gray-100 text-gray-600';

  const handleStatusChange = (status: ReviewSectionStatus) => {
    onChange({ ...review, status, lastReviewedAt: new Date().toISOString() });
  };

  const handleScoreChange = (score: number) => {
    onChange({ ...review, score });
  };

  const handleAddRecommendation = () => {
    const text = newRecommendation.trim();
    if (!text) return;
    onChange({ ...review, recommendations: [...review.recommendations, text] });
    setNewRecommendation('');
  };

  const handleRemoveRecommendation = (index: number) => {
    const updated = [...review.recommendations];
    updated.splice(index, 1);
    onChange({ ...review, recommendations: updated });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">{label}</h3>
          </div>
          <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor}`}>
            {statusLabel}
          </span>
          {review.score > 0 && (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= review.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRequestAI && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestAI();
              }}
              disabled={isAILoading}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAILoading ? 'Analyzing...' : 'AI Assist'}
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100">
          {/* Description */}
          <p className="text-sm text-gray-500 pt-3">{description}</p>

          {/* Custom content (BMC, SWOT, etc.) */}
          {children}

          {/* Review Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Current Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current State
              </label>
              <textarea
                value={review.currentContent}
                onChange={(e) => onChange({ ...review, currentContent: e.target.value })}
                placeholder="Document the current state of this section..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                readOnly={readOnly}
              />
            </div>

            {/* Updated Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Updates
              </label>
              <textarea
                value={review.updatedContent}
                onChange={(e) => onChange({ ...review, updatedContent: e.target.value })}
                placeholder="Describe proposed changes and improvements..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                readOnly={readOnly}
              />
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Review Notes
            </label>
            <textarea
              value={review.reviewNotes}
              onChange={(e) => onChange({ ...review, reviewNotes: e.target.value })}
              placeholder="Add notes, observations, and commentary..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly={readOnly}
            />
          </div>

          {/* Score & Status Row */}
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Score */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Score</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleScoreChange(s)}
                      className="p-0.5 hover:scale-110 transition-transform"
                      title={REVIEW_SCORE_LABELS[s]}
                    >
                      <Star
                        className={`w-5 h-5 ${s <= review.score ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`}
                      />
                    </button>
                  ))}
                  {review.score > 0 && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${REVIEW_SCORE_COLORS[review.score]}`}>
                      {REVIEW_SCORE_LABELS[review.score]}
                    </span>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={review.status}
                  onChange={(e) => handleStatusChange(e.target.value as ReviewSectionStatus)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_review">In Review</option>
                  <option value="needs_update">Needs Update</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations ({review.recommendations.length})
            </label>
            <div className="space-y-1.5 mb-2">
              {review.recommendations.map((rec, i) => (
                <div key={i} className="group flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-xs font-medium text-blue-600 mt-0.5">{i + 1}.</span>
                  <span className="flex-1 text-sm text-blue-800">{rec}</span>
                  {!readOnly && (
                    <button
                      onClick={() => handleRemoveRecommendation(i)}
                      className="text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newRecommendation}
                  onChange={(e) => setNewRecommendation(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRecommendation()}
                  placeholder="Add a recommendation..."
                  className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddRecommendation}
                  disabled={!newRecommendation.trim()}
                  className="p-1.5 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionReviewCard;
