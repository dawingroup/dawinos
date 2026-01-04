/**
 * Program List Page - View all programs
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Calendar, DollarSign, MapPin, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';

interface Program {
  id: string;
  name: string;
  code: string;
  client: string;
  status: string;
  totalBudget: number;
  currency: string;
  projectCount: number;
  regions: string[];
  startDate: string;
  endDate: string;
}

// Mock programs
const MOCK_PROGRAMS: Program[] = [
  {
    id: 'prg-1',
    name: 'ARISE Health Centers Phase II',
    code: 'ARISE-2024',
    client: 'Ministry of Health Uganda',
    status: 'active',
    totalBudget: 52000000000,
    currency: 'UGX',
    projectCount: 8,
    regions: ['Western Region', 'Eastern Region'],
    startDate: '2024-01-01',
    endDate: '2026-12-31',
  },
  {
    id: 'prg-2',
    name: 'Uganda Rural Electrification Program',
    code: 'UREP-2024',
    client: 'Ministry of Energy',
    status: 'active',
    totalBudget: 120000000,
    currency: 'USD',
    projectCount: 15,
    regions: ['Northern Region', 'Eastern Region', 'Western Region'],
    startDate: '2024-03-01',
    endDate: '2027-02-28',
  },
  {
    id: 'prg-3',
    name: 'School Infrastructure Improvement',
    code: 'SII-2024',
    client: 'Ministry of Education',
    status: 'planning',
    totalBudget: 35000000000,
    currency: 'UGX',
    projectCount: 0,
    regions: ['Central Region'],
    startDate: '2024-07-01',
    endDate: '2025-12-31',
  },
];

export function ProgramList() {
  const [programs] = useState<Program[]>(MOCK_PROGRAMS);

  const formatBudget = (amount: number, currency: string) => {
    if (amount >= 1000000000) return `${currency} ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-600">{programs.length} programs</p>
        </div>
        
        <Link
          to="/advisory/delivery/programs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          New Program
        </Link>
      </div>

      {/* Program Cards */}
      <div className="grid gap-4">
        {programs.map(program => (
          <Link
            key={program.id}
            to={`/advisory/delivery/programs/${program.id}`}
            className="block bg-white rounded-lg border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-500 font-mono">{program.code}</span>
                    <StatusBadge status={program.status} size="sm" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{program.name}</h2>
                  <p className="text-gray-600">{program.client}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span>{formatBudget(program.totalBudget, program.currency)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Building2 className="w-4 h-4" />
                <span>{program.projectCount} projects</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{program.regions.length} regions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{new Date(program.endDate).getFullYear()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
