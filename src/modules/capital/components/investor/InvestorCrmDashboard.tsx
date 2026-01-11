// ============================================================================
// INVESTOR CRM DASHBOARD
// DawinOS v2.0 - Capital Hub Module
// Main dashboard for investor CRM
// ============================================================================

import React, { useState } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Mail,
  Filter,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useInvestors } from '../../hooks/useInvestors';
import { InvestorCrmCard } from './InvestorCrmCard';
import {
  INVESTOR_TYPES,
  RELATIONSHIP_STATUSES,
  RELATIONSHIP_HEALTH_LEVELS,
  INVESTOR_TYPE_LABELS,
  RELATIONSHIP_STATUS_LABELS,
  RELATIONSHIP_HEALTH_LABELS,
  InvestorType,
  RelationshipStatus,
  RelationshipHealthLevel,
} from '../../constants/investor.constants';
import { Investor, InvestorFilters } from '../../types/investor.types';

interface InvestorCrmDashboardProps {
  companyId: string;
  onAddInvestor?: () => void;
  onViewInvestor?: (investor: Investor) => void;
  onContactInvestor?: (investor: Investor) => void;
}

export const InvestorCrmDashboard: React.FC<InvestorCrmDashboardProps> = ({
  companyId,
  onAddInvestor,
  onViewInvestor,
  onContactInvestor,
}) => {
  const {
    investors,
    analytics,
    isLoading,
    error,
    loadInvestors,
    loadAnalytics,
  } = useInvestors({ companyId });

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<InvestorFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleRefresh = () => {
    loadInvestors(filters);
    loadAnalytics();
  };

  const handleFilterChange = (key: keyof InvestorFilters, value: string) => {
    const newFilters = { ...filters };
    if (value) {
      (newFilters as Record<string, unknown>)[key] = value;
    } else {
      delete (newFilters as Record<string, unknown>)[key];
    }
    setFilters(newFilters);
    loadInvestors(newFilters);
  };

  const filteredInvestors = investors.filter(investor => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      investor.name.toLowerCase().includes(query) ||
      investor.headquarters.toLowerCase().includes(query) ||
      investor.contacts.some(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query)
      )
    );
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Investor CRM</h1>
          <p className="text-gray-500">Manage investor relationships and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onAddInvestor}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add Investor
          </button>
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInvestors}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.activeInvestors}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.hotLeads}</p>
                <p className="text-sm text-gray-500">Hot Leads</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.overdueFollowUps}</p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalInteractionsThisMonth}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{analytics.atRiskRelationships}</p>
                <p className="text-sm text-gray-500">At Risk</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors, contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-300 text-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.keys(filters).length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Types</option>
                {Object.values(INVESTOR_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {INVESTOR_TYPE_LABELS[type as InvestorType]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Statuses</option>
                {Object.values(RELATIONSHIP_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {RELATIONSHIP_STATUS_LABELS[status as RelationshipStatus]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Health</label>
              <select
                value={filters.healthLevel || ''}
                onChange={(e) => handleFilterChange('healthLevel', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Health Levels</option>
                {Object.values(RELATIONSHIP_HEALTH_LEVELS).map((level) => (
                  <option key={level} value={level}>
                    {RELATIONSHIP_HEALTH_LABELS[level as RelationshipHealthLevel]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Uganda Presence</label>
              <select
                value={filters.hasUgandaPresence === undefined ? '' : String(filters.hasUgandaPresence)}
                onChange={(e) => handleFilterChange('hasUgandaPresence', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Any</option>
                <option value="true">Has Uganda Presence</option>
                <option value="false">No Uganda Presence</option>
              </select>
            </div>

            {Object.keys(filters).length > 0 && (
              <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                <button
                  onClick={() => {
                    setFilters({});
                    loadInvestors({});
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investor Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredInvestors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInvestors.map((investor) => (
            <InvestorCrmCard
              key={investor.id}
              investor={investor}
              onSelect={onViewInvestor}
              onContact={onContactInvestor}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No investors found</p>
          <p className="text-sm text-gray-500 mt-1">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'Add your first investor to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestorCrmDashboard;
