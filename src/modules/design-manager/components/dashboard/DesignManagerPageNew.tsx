/**
 * DesignManagerPage Component (New Figma Design)
 * Main page for the Design Manager module with view modes
 * Connected to real Firestore data and existing components
 */

import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, FolderOpen, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToProjects, subscribeToDesignItems } from '../../services/firestore';
import type { DesignProject, DesignItem } from '../../types';
import { ProjectDialog } from '../project/ProjectDialog';
import { isAtFinalStageForItem } from '../../utils/stage-gate';

export default function DesignManagerPageNew() {
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<DesignProject | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Open dialog to create new project
  const handleNewProject = () => {
    setEditingProject(null);
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

  // Get stats for dashboard
  const stats = useMemo(() => {
    const total = allDesignItems.length;
    const inProgress = allDesignItems.filter(i => !isAtFinalStageForItem(i)).length;
    const productionReady = allDesignItems.filter(i => isAtFinalStageForItem(i)).length;
    const needsAttention = allDesignItems.filter(i => 
      i.overallReadiness < 50 || i.priority === 'urgent'
    ).length;
    return { total, inProgress, productionReady, needsAttention };
  }, [allDesignItems]);

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
    <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design Manager</h1>
          <p className="text-muted-foreground">Track designs through manufacturing stages</p>
        </div>
<Button 
          onClick={handleNewProject}
          className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
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

      {/* Projects Section - Large Cards */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
            <span className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project) => {
              const projectItems = allDesignItems.filter(i => i.projectId === project.id);
              const readyCount = projectItems.filter(i => isAtFinalStageForItem(i)).length;
              const inProgressCount = projectItems.filter(i => !isAtFinalStageForItem(i) && i.overallReadiness > 0).length;
              const pendingCount = projectItems.filter(i => i.overallReadiness === 0).length;
              const avgReadiness = projectItems.length > 0 
                ? Math.round(projectItems.reduce((sum, i) => sum + i.overallReadiness, 0) / projectItems.length) 
                : 0;
              
              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`project/${project.id}`)}
                  className="bg-white rounded-xl border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-md">
                          <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-xl">{project.name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{project.code}</p>
                        </div>
                      </div>
                      <span className={`text-sm px-3 py-1.5 rounded-full font-medium border ${
                        project.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                        project.status === 'on-hold' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        project.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    {project.customerName && (
                      <p className="text-base text-gray-600">
                        <span className="text-gray-400">Customer:</span> {project.customerName}
                      </p>
                    )}
                  </div>

                  {/* Item Stats */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-base font-semibold text-gray-700">Design Items</span>
                      <span className="text-base text-gray-500">{projectItems.length} total</span>
                    </div>
                    
                    {projectItems.length > 0 ? (
                      <>
                        {/* Progress Bar */}
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-5">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${avgReadiness}%` }}
                          />
                        </div>
                        
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-green-50 rounded-xl py-4 px-2">
                            <p className="text-2xl font-bold text-green-600">{readyCount}</p>
                            <p className="text-sm text-green-600 mt-1">Ready</p>
                          </div>
                          <div className="bg-amber-50 rounded-xl py-4 px-2">
                            <p className="text-2xl font-bold text-amber-600">{inProgressCount}</p>
                            <p className="text-sm text-amber-600 mt-1">In Progress</p>
                          </div>
                          <div className="bg-gray-100 rounded-xl py-4 px-2">
                            <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
                            <p className="text-sm text-gray-600 mt-1">Pending</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-400">
                        No items yet
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {avgReadiness}% complete
                    </span>
                    <span className="text-sm text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Project →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
