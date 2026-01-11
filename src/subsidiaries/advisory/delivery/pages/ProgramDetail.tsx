/**
 * Program Detail - Comprehensive program view
 */

import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Loader2, 
  Edit, 
  Trash2, 
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  FolderOpen,
  Plus
} from 'lucide-react';
import { useProgram, useProgramMutations } from '../hooks/program-hooks';
import { useProjects } from '../hooks/project-hooks';
import { StatusBadge } from '../components/common/StatusBadge';
import { db } from '@/core/services/firebase';
import { useAuth } from '@/shared/hooks';

export function ProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { program, loading, error } = useProgram(db, programId || null);
  const { deleteProgram, loading: deleting } = useProgramMutations(db, user?.uid || '');
  const { projects, loading: projectsLoading } = useProjects(db, programId || null);

  const handleDelete = async () => {
    if (!programId || !user) return;
    try {
      await deleteProgram(programId, 'Deleted by user');
      navigate('/advisory/delivery/programs');
    } catch (err) {
      console.error('Failed to delete program:', err);
    }
  };

  const formatBudget = (amount: number, currency: string) => {
    if (amount >= 1000000000) return `${currency} ${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    return `${currency} ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading program...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error.message}</span>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-gray-900">Program not found</h2>
        <p className="text-gray-600 mt-2">The program you're looking for doesn't exist.</p>
        <Link to="/advisory/delivery/programs" className="text-primary hover:underline mt-4 inline-block">
          ← Back to programs
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link 
          to="/advisory/delivery/programs" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Programs
        </Link>
        
        <div className="flex items-center gap-2">
          <Link
            to={`/advisory/delivery/programs/${programId}/edit`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Confirm?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500 font-mono">{program.code}</span>
              <StatusBadge status={program.status} size="sm" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
            <p className="text-gray-600 mt-1">{program.description || 'No description'}</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Budget</div>
              <div className="font-medium">
                {formatBudget(program.budget?.allocated?.amount || 0, program.budget?.currency || 'USD')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Projects</div>
              <div className="font-medium">{program.projectIds?.length || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Countries</div>
              <div className="font-medium">{program.coverage?.countries?.length || 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">End Date</div>
              <div className="font-medium">
                {program.endDate?.toDate?.()?.toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                }) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-medium">Projects</h2>
          <Link
            to={`/advisory/delivery/projects/new?programId=${programId}&programName=${encodeURIComponent(program.name)}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Project
          </Link>
        </div>
        
        <div className="p-4">
          {projectsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">Loading projects...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No projects in this program yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(project => (
                <Link
                  key={project.id}
                  to={`/advisory/delivery/projects/${project.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-gray-500">{project.projectCode}</span>
                        <StatusBadge status={project.status} size="sm" />
                      </div>
                      <div className="font-medium mt-1">{project.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {project.location?.region} • {project.location?.district}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Progress</div>
                      <div className="font-medium">{project.progress?.physicalProgress || 0}%</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-medium">Team</h2>
        </div>
        
        {program.managerId ? (
          <div className="text-gray-600">
            <div className="text-sm text-gray-500">Program Manager</div>
            <div className="font-medium">{program.managerId}</div>
          </div>
        ) : (
          <p className="text-gray-500">No team members assigned</p>
        )}
      </div>
    </div>
  );
}
