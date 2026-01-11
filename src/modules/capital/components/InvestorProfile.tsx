// ============================================================================
// INVESTOR PROFILE
// DawinOS v2.0 - Capital Hub Module
// Detailed investor profile view
// ============================================================================

import React from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Investor, InvestorCommitment } from '../types/capital.types';
import {
  INVESTOR_TYPE_LABELS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_COLORS,
  INVESTMENT_TYPE_LABELS,
  SECTOR_LABELS,
  COMMITMENT_STATUS_LABELS,
  COMMITMENT_STATUS_COLORS,
  CommitmentStatus,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface InvestorProfileProps {
  investor: Investor;
  commitments?: InvestorCommitment[];
  onEdit?: () => void;
  onBack?: () => void;
  onRecordContact?: () => void;
  onViewDeal?: (dealId: string) => void;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(1)}M`;
    return `UGX ${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatDate = (date: Date | undefined): string => {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getKycStatusColor = (status: string): string => {
  switch (status) {
    case 'verified': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-amber-100 text-amber-800';
    case 'expired': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCommitmentStatusIcon = (status: CommitmentStatus) => {
  switch (status) {
    case 'funded': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'documented':
    case 'firm': return <Clock className="w-4 h-4 text-amber-500" />;
    case 'cancelled': return <AlertCircle className="w-4 h-4 text-red-500" />;
    default: return <Clock className="w-4 h-4 text-gray-400" />;
  }
};

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export const InvestorProfile: React.FC<InvestorProfileProps> = ({
  investor,
  commitments = [],
  onEdit,
  onBack,
  onRecordContact,
  onViewDeal,
}) => {
  const totalCommitted = commitments.reduce((sum, c) => 
    c.status !== 'cancelled' ? sum + c.committedAmount : sum, 0
  );
  const totalFunded = commitments.reduce((sum, c) => sum + c.fundedAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              {investor.type === 'individual' ? (
                <User className="w-8 h-8 text-indigo-600" />
              ) : (
                <Building2 className="w-8 h-8 text-indigo-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{investor.name}</h1>
              <p className="text-gray-500">{INVESTOR_TYPE_LABELS[investor.type]}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${INVESTOR_STATUS_COLORS[investor.status]}`}>
              {INVESTOR_STATUS_LABELS[investor.status]}
            </span>
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-md">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Primary Contact</p>
              <p className="text-sm font-medium text-gray-900">{investor.primaryContactName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-md">
              <Mail className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <a
                href={`mailto:${investor.primaryContactEmail}`}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                {investor.primaryContactEmail}
              </a>
            </div>
          </div>

          {investor.primaryContactPhone && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-md">
                <Phone className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <a
                  href={`tel:${investor.primaryContactPhone}`}
                  className="text-sm font-medium text-gray-900"
                >
                  {investor.primaryContactPhone}
                </a>
              </div>
            </div>
          )}

          {investor.website && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-md">
                <Globe className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a
                  href={investor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  {investor.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Investment Profile */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Profile</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ticket Size Range</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(investor.minTicketSize, investor.preferredCurrency)} - {formatCurrency(investor.maxTicketSize, investor.preferredCurrency)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Preferred Currency</p>
                <p className="text-lg font-semibold text-gray-900">{investor.preferredCurrency}</p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Investment Types</p>
              <div className="flex flex-wrap gap-2">
                {investor.investmentTypesPreferred.map((type) => (
                  <span key={type} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full">
                    {INVESTMENT_TYPE_LABELS[type]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Sector Preferences</p>
              <div className="flex flex-wrap gap-2">
                {investor.sectorPreferences.map((sector) => (
                  <span key={sector} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                    {SECTOR_LABELS[sector] || sector}
                  </span>
                ))}
              </div>
            </div>

            {investor.geographicFocus.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Geographic Focus</p>
                <div className="flex flex-wrap gap-2">
                  {investor.geographicFocus.map((geo) => (
                    <span key={geo} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {geo}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Commitments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Commitments</h2>
            
            {commitments.length > 0 ? (
              <div className="space-y-3">
                {commitments.map((commitment) => (
                  <div
                    key={commitment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => onViewDeal?.(commitment.dealId)}
                  >
                    <div className="flex items-center gap-3">
                      {getCommitmentStatusIcon(commitment.status)}
                      <div>
                        <p className="font-medium text-gray-900">{commitment.dealName}</p>
                        <p className="text-sm text-gray-500">
                          {INVESTMENT_TYPE_LABELS[commitment.investmentType]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(commitment.committedAmount, commitment.currency)}
                      </p>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${COMMITMENT_STATUS_COLORS[commitment.status]}`}>
                        {COMMITMENT_STATUS_LABELS[commitment.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No commitments yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Committed</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(totalCommitted, investor.preferredCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total Funded</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(totalFunded, investor.preferredCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Active Deals</span>
                <span className="text-sm font-semibold text-gray-900">
                  {investor.activeDeals.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">Closed Deals</span>
                <span className="text-sm font-semibold text-gray-900">
                  {investor.closedDeals.length}
                </span>
              </div>
            </div>
          </div>

          {/* Relationship */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Relationship</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Owner</p>
                <p className="text-sm font-medium text-gray-900">{investor.relationshipOwnerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Contact</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(investor.lastContactDate)}
                </p>
              </div>
              {investor.nextFollowUpDate && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Next Follow-up</p>
                  <p className={`text-sm font-medium ${
                    new Date(investor.nextFollowUpDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatDate(investor.nextFollowUpDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <p className="text-sm font-medium text-gray-900">{investor.source || 'N/A'}</p>
              </div>
            </div>

            {onRecordContact && (
              <button
                onClick={onRecordContact}
                className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Record Contact
              </button>
            )}
          </div>

          {/* KYC Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">KYC Status</h3>
            
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getKycStatusColor(investor.kycStatus)}`}>
                {investor.kycStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              {investor.kycExpiryDate && (
                <span className="text-xs text-gray-500">
                  Expires: {formatDate(investor.kycExpiryDate)}
                </span>
              )}
            </div>
          </div>

          {/* Notes */}
          {investor.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{investor.notes}</p>
            </div>
          )}

          {/* Tags */}
          {investor.tags && investor.tags.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {investor.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
