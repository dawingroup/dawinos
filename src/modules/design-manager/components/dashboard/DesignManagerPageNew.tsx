/**
 * DesignManagerPage Component (New Figma Design)
 * Main page for the Design Manager module with view modes
 * Connected to real Firestore data and existing components
 */

import { useState, useEffect, useMemo } from 'react';
import { Package, LayoutGrid, List, Plus, Search, Filter, FolderOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { useAuth } from '@/shared/hooks';
import { subscribeToProjects, subscribeToDesignItems } from '../../services/firestore';
import type { DesignProject, DesignItem } from '../../types';
import { DesignItemCard } from '../design-item/DesignItemCard';
import { StageKanban } from './StageKanban';
import { ProjectDialog } from '../project/ProjectDialog';
import { ProjectDashboardCard } from '../project/ProjectDashboardCard';

export default function DesignManagerPageNew() {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<DesignProject | null>(null);
  const [selectedProject, setSelectedProject] = useState<DesignProject | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Open dialog to create new project
  const handleNewProject = () => {
    setEditingProject(null);
    setShowProjectDialog(true);
  };

  // Open dialog to edit existing project
  const handleEditProject = (project: DesignProject) => {
    setEditingProject(project);
    setShowProjectDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setShowProjectDialog(false);
    setEditingProject(null);
  };

  // Real Firestore data
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [allDesignItems, setAllDesignItems] = useState<DesignItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to projects
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToProjects((projectsData) => {
      setProjects(projectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Subscribe to design items from all projects
  useEffect(() => {
    if (projects.length === 0) {
      setAllDesignItems([]);
      return;
    }

    // Subscribe to items from each project
    const unsubscribes: (() => void)[] = [];
    const itemsByProject: Record<string, DesignItem[]> = {};

    projects.forEach((project) => {
      const unsub = subscribeToDesignItems(project.id, (items) => {
        itemsByProject[project.id] = items;
        // Merge all items from all projects
        const allItems = Object.values(itemsByProject).flat();
        setAllDesignItems(allItems);
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [projects]);

  // Filter design items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return allDesignItems;
    const query = searchQuery.toLowerCase();
    return allDesignItems.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.itemCode.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [allDesignItems, searchQuery]);

  // Get stats for dashboard
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const inProgress = filteredItems.filter(i => 
      ['concept', 'preliminary', 'technical'].includes(i.currentStage)
    ).length;
    const productionReady = filteredItems.filter(i => 
      i.currentStage === 'production-ready'
    ).length;
    const needsAttention = filteredItems.filter(i => 
      i.overallReadiness < 50 || i.priority === 'urgent'
    ).length;
    return { total, inProgress, productionReady, needsAttention };
  }, [filteredItems]);

  // Handle item click - navigate to detail page
  const handleItemClick = (item: DesignItem) => {
    navigate(`project/${item.projectId}/item/${item.id}`);
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to access the Design Manager.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Manager</h1>
          <p className="text-muted-foreground">Track designs through manufacturing stages</p>
        </div>
<Button 
          onClick={handleNewProject}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-gray-600">Projects</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-xs text-gray-500">Active projects</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-gray-600">Total Designs</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Design items</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <p className="text-sm font-medium text-gray-600">In Progress</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
          <p className="text-xs text-gray-500">Across all stages</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium text-gray-600">Production Ready</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.productionReady}</p>
          <p className="text-xs text-gray-500">Ready to manufacture</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-gray-600">Needs Attention</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.needsAttention}</p>
          <p className="text-xs text-gray-500">Critical items</p>
        </div>
      </div>

      {/* Projects Section */}
      {projects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
            <span className="text-xs text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
                className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                  selectedProject?.id === project.id
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                <span className="font-medium">{project.name}</span>
                <span className="text-xs opacity-70">({project.code})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Project Dashboard Card */}
      {selectedProject && (
        <ProjectDashboardCard
          project={selectedProject}
          items={allDesignItems}
          onEdit={() => handleEditProject(selectedProject)}
          onClose={() => setSelectedProject(null)}
          onViewItem={handleItemClick}
        />
      )}

      {/* Filters and View Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto flex gap-2">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search designs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Package className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Design Items - Different Views */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No design items found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Try adjusting your search query' : 'Create a project to get started'}
          </p>
          {!searchQuery && (
            <button 
              onClick={handleNewProject}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <DesignItemCard 
                  key={item.id} 
                  item={item} 
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <DesignItemCard 
                  key={item.id} 
                  item={item} 
                  onClick={handleItemClick}
                  compact
                />
              ))}
            </div>
          )}

          {viewMode === 'kanban' && projects.length > 0 && (
            <StageKanban items={filteredItems} projectId={projects[0].id} />
          )}
        </>
      )}

      {/* Project Dialog (Create/Edit) */}
      <ProjectDialog
        open={showProjectDialog}
        onClose={handleCloseDialog}
        userId={user?.email || ''}
        project={editingProject}
      />
    </div>
  );
}
