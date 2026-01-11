// ============================================================================
// INVESTOR LIST
// DawinOS v2.0 - Capital Hub Module
// Investor directory with filtering and search
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Edit,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import { Investor } from '../types/capital.types';
import {
  INVESTOR_TYPE_LABELS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_COLORS,
  SECTOR_LABELS,
  InvestorType,
  InvestorStatus,
} from '../constants/capital.constants';

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

interface InvestorListProps {
  investors: Investor[];
  onView: (investor: Investor) => void;
  onEdit: (investor: Investor) => void;
  onAdd: () => void;
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

const formatCurrency = (amount: number, currency: string): string => {
  if (currency === 'UGX') {
    if (amount >= 1000000000) return `UGX ${(amount / 1000000000).toFixed(0)}B`;
    if (amount >= 1000000) return `UGX ${(amount / 1000000).toFixed(0)}M`;
    return `UGX ${(amount / 1000).toFixed(0)}K`;
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

export const InvestorList: React.FC<InvestorListProps> = ({
  investors,
  onView,
  onEdit,
  onAdd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InvestorType | ''>('');
  const [statusFilter, setStatusFilter] = useState<InvestorStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter investors
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearch =
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.primaryContactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !typeFilter || investor.type === typeFilter;
      const matchesStatus = !statusFilter || investor.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [investors, searchTerm, typeFilter, statusFilter]);

  // Paginate
  const paginatedInvestors = filteredInvestors.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const totalPages = Math.ceil(filteredInvestors.length / rowsPerPage);
  const hasActiveFilters = typeFilter || statusFilter;

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Investor Directory</h2>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Investor
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
              hasActiveFilters
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-xs rounded-full">
                {(typeFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as InvestorType | ''); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              {Object.entries(INVESTOR_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as InvestorStatus | ''); setPage(0); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              {Object.entries(INVESTOR_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Investor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ticket Range
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Sectors
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Owner
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedInvestors.map((investor) => (
              <tr
                key={investor.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onView(investor)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-indigo-600">
                        {investor.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{investor.name}</p>
                      <p className="text-xs text-gray-500 truncate">{investor.primaryContactEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                    {INVESTOR_TYPE_LABELS[investor.type].split(' ')[0]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">
                    {formatCurrency(investor.minTicketSize, investor.preferredCurrency)} - {formatCurrency(investor.maxTicketSize, investor.preferredCurrency)}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {investor.sectorPreferences.slice(0, 2).map((sector) => (
                      <span key={sector} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {SECTOR_LABELS[sector] || sector}
                      </span>
                    ))}
                    {investor.sectorPreferences.length > 2 && (
                      <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                        +{investor.sectorPreferences.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${INVESTOR_STATUS_COLORS[investor.status]}`}>
                    {INVESTOR_STATUS_LABELS[investor.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-700">{investor.relationshipOwnerName}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); onView(investor); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(investor); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <a
                      href={`mailto:${investor.primaryContactEmail}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                    {investor.primaryContactPhone && (
                      <a
                        href={`tel:${investor.primaryContactPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {paginatedInvestors.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  {searchTerm || hasActiveFilters ? (
                    <p>No investors match your filters</p>
                  ) : (
                    <div>
                      <p className="mb-2">No investors added yet</p>
                      <button
                        onClick={onAdd}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        Add your first investor
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredInvestors.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              Showing {page * rowsPerPage + 1} - {Math.min((page + 1) * rowsPerPage, filteredInvestors.length)} of {filteredInvestors.length}
            </span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-500">per page</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
