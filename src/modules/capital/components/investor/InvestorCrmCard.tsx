// ============================================================================
// INVESTOR CRM CARD
// DawinOS v2.0 - Capital Hub Module
// Investor card with relationship health and engagement metrics
// ============================================================================

import React from 'react';
import {
  Building2,
  MapPin,
  TrendingUp,
  Clock,
  Mail,
  Phone,
  Calendar,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Investor } from '../../types/investor.types';
import {
  INVESTOR_TYPE_LABELS,
  RELATIONSHIP_STATUS_LABELS,
  RELATIONSHIP_STATUS_COLORS,
  RELATIONSHIP_HEALTH_LABELS,
  RELATIONSHIP_HEALTH_COLORS,
  INVESTMENT_STAGE_LABELS,
  InvestorType,
  RelationshipStatus,
  RelationshipHealthLevel,
} from '../../constants/investor.constants';

interface InvestorCrmCardProps {
  investor: Investor;
  onSelect?: (investor: Investor) => void;
  onContact?: (investor: Investor) => void;
  compact?: boolean;
}

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
};

const formatDate = (timestamp: { toDate: () => Date } | undefined): string => {
  if (!timestamp) return 'Never';
  const date = timestamp.toDate();
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export const InvestorCrmCard: React.FC<InvestorCrmCardProps> = ({
  investor,
  onSelect,
  onContact: _onContact,
  compact = false,
}) => {
  const statusColor = RELATIONSHIP_STATUS_COLORS[investor.relationshipStatus];
  const healthColor = RELATIONSHIP_HEALTH_COLORS[investor.relationshipHealth];

  const hasOverdueFollowUp = investor.nextFollowUpDate && 
    investor.nextFollowUpDate.toDate() < new Date();

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(investor)}
    >
      <div className={compact ? 'p-3' : 'p-4'}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{investor.name}</h3>
              <p className="text-sm text-gray-500">
                {INVESTOR_TYPE_LABELS[investor.type as InvestorType]}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          <span
            className="px-2 py-1 text-xs font-medium rounded-full"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {RELATIONSHIP_STATUS_LABELS[investor.relationshipStatus as RelationshipStatus]}
          </span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>{investor.headquarters}</span>
          {investor.hasUgandaPresence && (
            <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
              Uganda
            </span>
          )}
        </div>

        {/* Investment Criteria Summary */}
        {!compact && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Check Size</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(investor.investmentCriteria.checkSizeMin)} - {formatCurrency(investor.investmentCriteria.checkSizeMax)}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {investor.investmentCriteria.stages.slice(0, 3).map((stage) => (
                <span key={stage} className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  {INVESTMENT_STAGE_LABELS[stage]}
                </span>
              ))}
              {investor.investmentCriteria.stages.length > 3 && (
                <span className="px-1.5 py-0.5 text-xs text-gray-500">
                  +{investor.investmentCriteria.stages.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Health Score */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: healthColor }} />
            <span className="text-sm font-medium" style={{ color: healthColor }}>
              {RELATIONSHIP_HEALTH_LABELS[investor.relationshipHealth as RelationshipHealthLevel]}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${investor.healthScore}%`,
                  backgroundColor: healthColor,
                }}
              />
            </div>
            <span className="text-xs text-gray-500">{investor.healthScore}%</span>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{investor.totalInteractions}</p>
            <p className="text-xs text-gray-500">Interactions</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{investor.totalMeetings}</p>
            <p className="text-xs text-gray-500">Meetings</p>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <p className="text-lg font-bold text-gray-900">{investor.activeDeals}</p>
            <p className="text-xs text-gray-500">Active Deals</p>
          </div>
        </div>

        {/* Last Contact & Follow-up */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>Last contact: {formatDate(investor.lastContactDate)}</span>
          </div>
          {investor.nextFollowUpDate && (
            <div className={`flex items-center gap-2 ${hasOverdueFollowUp ? 'text-red-600' : 'text-gray-600'}`}>
              <Calendar className="w-4 h-4" />
              <span>Follow-up: {formatDate(investor.nextFollowUpDate)}</span>
              {hasOverdueFollowUp && <AlertCircle className="w-4 h-4" />}
            </div>
          )}
        </div>

        {/* Primary Contact */}
        {investor.contacts.length > 0 && !compact && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Primary Contact</p>
            {investor.contacts.filter(c => c.isPrimary).slice(0, 1).map((contact) => (
              <div key={contact.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {contact.firstName} {contact.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{contact.title}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `mailto:${contact.email}`;
                    }}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                  {contact.phone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${contact.phone}`;
                      }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {investor.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-3">
            {investor.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                {tag}
              </span>
            ))}
            {investor.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs text-gray-500">
                +{investor.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Owner: {investor.relationshipOwnerName}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
};

export default InvestorCrmCard;
