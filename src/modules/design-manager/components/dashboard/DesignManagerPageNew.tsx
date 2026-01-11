/**
 * DesignManagerPage Component (New Figma Design)
 * Main page for the Design Manager module with view modes
 * Connected to real Firestore data and existing components
 */

import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, FolderOpen, Clock, CheckCircle, AlertTriangle, Calendar, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { Card, CardContent } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Progress } from '@/core/components/ui/progress';
import { cn } from '@/shared/lib/utils';
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

              // Status configuration matching Capital deals style
              const statusConfig = {
                active: { color: '#10B981', bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
                'on-hold': { color: '#F59E0B', bg: 'bg-amber-50', text: 'text-amber-700', label: 'On Hold' },
                completed: { color: '#3B82F6', bg: 'bg-blue-50', text: 'text-blue-700', label: 'Completed' },
                cancelled: { color: '#6B7280', bg: 'bg-gray-100', text: 'text-gray-600', label: 'Cancelled' },
              };
              const currentStatus = statusConfig[project.status] || statusConfig.active;

              // Days since last update
              const daysActive = project.updatedAt 
                ? Math.floor((new Date().getTime() - project.updatedAt.toDate().getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              
              return (
                <Card
                  key={project.id}
                  onClick={() => navigate(`project/${project.id}`)}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden group"
                  style={{ borderTop: `4px solid ${currentStatus.color}` }}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div 
                        className="h-11 w-11 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${currentStatus.color}15` }}
                      >
                        <FolderOpen className="w-5 h-5" style={{ color: currentStatus.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.code}</p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn('flex-shrink-0 text-xs', currentStatus.bg, currentStatus.text)}
                      >
                        {currentStatus.label}
                      </Badge>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {project.customerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {project.customerName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {daysActive === 0 ? 'Today' : `${daysActive}d ago`}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium" style={{ color: currentStatus.color }}>{avgReadiness}%</span>
                      </div>
                      <Progress value={avgReadiness} className="h-1.5" />
                    </div>

                    {/* Stats inline */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                        <CheckCircle className="w-3 h-3" /> {readyCount} ready
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded">
                        <Clock className="w-3 h-3" /> {inProgressCount} active
                      </span>
                      <span className="text-muted-foreground ml-auto">
                        {projectItems.length} items
                      </span>
                    </div>
                  </CardContent>
                </Card>
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
