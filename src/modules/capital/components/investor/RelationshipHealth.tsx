// ============================================================================
// RELATIONSHIP HEALTH
// DawinOS v2.0 - Capital Hub Module
// Displays relationship health metrics and alerts
// ============================================================================

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  MessageSquare,
  Users,
  Target,
  Lightbulb,
} from 'lucide-react';
import { RelationshipHealthMetrics } from '../../types/investor.types';
import {
  RELATIONSHIP_HEALTH_LABELS,
  RELATIONSHIP_HEALTH_COLORS,
  RelationshipHealthLevel,
} from '../../constants/investor.constants';

interface RelationshipHealthProps {
  metrics: RelationshipHealthMetrics;
  onRefresh?: () => void;
}

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving': return { icon: TrendingUp, color: 'text-green-500' };
    case 'declining': return { icon: TrendingDown, color: 'text-red-500' };
    default: return { icon: Minus, color: 'text-gray-400' };
  }
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
};

const getBarColor = (score: number): string => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const RelationshipHealth: React.FC<RelationshipHealthProps> = ({
  metrics,
  onRefresh,
}) => {
  const healthColor = RELATIONSHIP_HEALTH_COLORS[metrics.healthLevel as RelationshipHealthLevel];
  const trendInfo = getTrendIcon(metrics.trend);
  const TrendIcon = trendInfo.icon;

  const scoreFactors = [
    { label: 'Recency', score: metrics.recencyScore, icon: Clock },
    { label: 'Frequency', score: metrics.frequencyScore, icon: MessageSquare },
    { label: 'Engagement', score: metrics.engagementScore, icon: Users },
    { label: 'Deal Progress', score: metrics.dealProgressScore, icon: Target },
    { label: 'Sentiment', score: metrics.sentimentScore, icon: TrendingUp },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Relationship Health</h3>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Overall Score */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${healthColor}20` }}
            >
              <span
                className="text-2xl font-bold"
                style={{ color: healthColor }}
              >
                {metrics.overallScore}
              </span>
            </div>
            <div>
              <p
                className="text-lg font-semibold"
                style={{ color: healthColor }}
              >
                {RELATIONSHIP_HEALTH_LABELS[metrics.healthLevel as RelationshipHealthLevel]}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <TrendIcon className={`w-4 h-4 ${trendInfo.color}`} />
                <span className="text-gray-500 capitalize">{metrics.trend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all duration-500"
            style={{
              width: `${metrics.overallScore}%`,
              backgroundColor: healthColor,
            }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</p>
        <div className="space-y-3">
          {scoreFactors.map((factor) => {
            const FactorIcon = factor.icon;
            return (
              <div key={factor.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <FactorIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{factor.label}</span>
                  </div>
                  <span className={`font-medium ${getScoreColor(factor.score)}`}>
                    {factor.score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${getBarColor(factor.score)}`}
                    style={{ width: `${factor.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {metrics.alerts.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Alerts</p>
          <div className="space-y-2">
            {metrics.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2 rounded ${
                  alert.severity === 'high'
                    ? 'bg-red-50'
                    : alert.severity === 'medium'
                    ? 'bg-amber-50'
                    : 'bg-gray-50'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 mt-0.5 ${
                    alert.severity === 'high'
                      ? 'text-red-500'
                      : alert.severity === 'medium'
                      ? 'text-amber-500'
                      : 'text-gray-500'
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-medium ${
                      alert.severity === 'high'
                        ? 'text-red-700'
                        : alert.severity === 'medium'
                        ? 'text-amber-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {alert.message}
                  </p>
                  {alert.daysSince !== undefined && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alert.daysSince} days since last contact
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <div className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            <Lightbulb className="w-4 h-4 inline mr-1 text-amber-500" />
            Recommendations
          </p>
          <ul className="space-y-2">
            {metrics.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Updated */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Last calculated: {metrics.calculatedAt.toDate().toLocaleString()}
      </div>
    </div>
  );
};

export default RelationshipHealth;
