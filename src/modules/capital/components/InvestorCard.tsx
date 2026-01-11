// ============================================================================
// INVESTOR CARD
// DawinOS v2.0 - Capital Hub Module
// Investor profile card component
// ============================================================================

import React from 'react';
import {
  Building2,
  User,
  Mail,
  MapPin,
  DollarSign,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { Investor } from '../types/capital.types';
import {
  INVESTOR_TYPE_LABELS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_COLORS,
  SECTOR_LABELS,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface InvestorCardProps {
  investor: Investor;
  onView?: () => void;
  onContact?: () => void;
  showActions?: boolean;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    return `UGX ${(amount / 1000000).toFixed(0)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 0,
  }).format(amount);
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const InvestorCard: React.FC<InvestorCardProps> = ({
  investor,
  onView,
  onContact,
  showActions = true,
}) => {
  const ticketRange = `${formatCurrency(investor.minTicketSize, investor.preferredCurrency)} - ${formatCurrency(investor.maxTicketSize, investor.preferredCurrency)}`;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              {investor.type === 'individual' ? (
                <User className="w-5 h-5 text-indigo-600" />
              ) : (
                <Building2 className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{investor.name}</h3>
              <p className="text-sm text-gray-500">{INVESTOR_TYPE_LABELS[investor.type]}</p>
            </div>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${INVESTOR_STATUS_COLORS[investor.status]}`}>
            {INVESTOR_STATUS_LABELS[investor.status]}
          </span>
        </div>
        
        {/* Contact */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4 text-gray-400" />
            <span>{investor.primaryContactName}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{investor.primaryContactEmail}</span>
          </div>
          
          {investor.headquarters && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{investor.headquarters}</span>
            </div>
          )}
        </div>
        
        {/* Investment Profile */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span>Ticket: {ticketRange}</span>
          </div>
          
          {investor.sectorPreferences.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {investor.sectorPreferences.slice(0, 3).map(sector => (
                  <span key={sector} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                    {SECTOR_LABELS[sector] || sector}
                  </span>
                ))}
                {investor.sectorPreferences.length > 3 && (
                  <span className="text-xs text-gray-500">+{investor.sectorPreferences.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Relationship Owner & Last Contact */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Owner: {investor.relationshipOwnerName}</span>
          {investor.lastContactDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(investor.lastContactDate).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {/* Active Deals */}
        {investor.activeDeals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              {investor.activeDeals.length} active deal{investor.activeDeals.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
          <button
            onClick={onView}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View Profile
          </button>
          {onContact && (
            <button
              onClick={onContact}
              className="ml-auto text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Record Contact
            </button>
          )}
        </div>
      )}
    </div>
  );
};
