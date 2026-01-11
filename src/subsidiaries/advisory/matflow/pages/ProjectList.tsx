/**
 * Project List Page
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, HardHat, MapPin, Calendar, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { useMatFlowProjects, useProjectMutations } from '../hooks/useMatFlow';
import { formatDate } from '../utils/formatters';
import { cn } from '@/shared/lib/utils';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const { projects, isLoading } = useMatFlowProjects();
  const { remove } = useProjectMutations();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (deleteConfirm === projectId) {
      setIsDeleting(true);
      try {
        await remove(projectId);
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Failed to delete project:', err);
        alert('Failed to delete project');
      } finally {
        setIsDeleting(false);
      }
    } else {
      setDeleteConfirm(projectId);
      // Reset after 3 seconds if not confirmed
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleEdit = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/advisory/matflow/projects/${projectId}?tab=settings`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'on-hold': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Manage your construction projects"
        breadcrumbs={[
          { label: 'MatFlow', href: '/advisory/matflow' },
          { label: 'Projects' },
        ]}
        actions={
          <Link
            to="/advisory/matflow/projects/new"
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </Link>
        }
      />
      
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">Create your first construction project to get started.</p>
            <Link
              to="/advisory/matflow/projects/new"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 hover:border-amber-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Link
                    to={`/advisory/matflow/projects/${project.id}`}
                    className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0"
                  >
                    <HardHat className="w-6 h-6 text-amber-600" />
                  </Link>
                  
                  <Link to={`/advisory/matflow/projects/${project.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getStatusColor(project.status))}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {project.location?.district && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {project.location.district}
                        </span>
                      )}
                      {project.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(project.createdAt as unknown as Date)}
                        </span>
                      )}
                    </div>
                  </Link>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEdit(project.id, e)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Edit project"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      disabled={isDeleting}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        deleteConfirm === project.id
                          ? "text-white bg-red-600 hover:bg-red-700"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      )}
                      title={deleteConfirm === project.id ? "Click again to confirm" : "Delete project"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <Link to={`/advisory/matflow/projects/${project.id}`}>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectList;
