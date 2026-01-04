/**
 * Project List - List view of all projects with filtering
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, LayoutGrid, List, Loader2 } from 'lucide-react';
import { ProjectCard } from '../components/projects/ProjectCard';
import { FilterBar } from '../components/common/FilterBar';
import { Project, ProjectStatus } from '../types/project';

export function ProjectList() {
  const [loading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<string | 'all'>('all');

  // Mock data for demonstration - cast to avoid strict type checking on demo data
  const projects = useMemo<Project[]>(() => [
    {
      id: 'prj-1',
      programId: 'prg-1',
      projectCode: 'ARISE-001',
      name: 'Rushoroza Health Center IV',
      status: 'active',
      location: {
        siteName: 'Rushoroza HC IV',
        region: 'Western Region',
        district: 'Rukungiri',
      },
      budget: {
        totalBudget: 450000000,
        currency: 'UGX',
        spent: 180000000,
        varianceStatus: 'on_budget',
      },
      progress: {
        physicalProgress: 65,
        financialProgress: 40,
        progressStatus: 'on_track',
      },
      timeline: {
        isDelayed: false,
        daysRemaining: 180,
      },
    } as unknown as Project,
  ], []);

  const regions = useMemo(() => {
    const uniqueRegions = new Set(projects.map(p => p.location.region));
    return Array.from(uniqueRegions).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (regionFilter !== 'all') {
      result = result.filter(p => p.location.region === regionFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.projectCode.toLowerCase().includes(query) ||
        p.location.siteName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [projects, statusFilter, regionFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            {filteredProjects.length} of {projects.length} projects
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          
          <Link
            to="/advisory/delivery/projects/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        regionFilter={regionFilter}
        onRegionChange={setRegionFilter}
        regions={regions}
      />

      {/* Results */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="text-gray-600 mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-4'
        }>
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
