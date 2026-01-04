/**
 * New Project Page - Create a new project
 */

import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ProjectForm } from '../components/forms/ProjectForm';

export function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get program info from query params if creating under a program
  const programId = searchParams.get('programId');
  const programName = searchParams.get('programName');

  const handleSubmit = async (data: any) => {
    // TODO: Call service to create project
    console.log('Creating project:', data);
    
    // For now, just navigate back
    alert('Project created successfully! (Demo mode - data not saved)');
    navigate('/advisory/delivery/projects');
  };

  const handleCancel = () => {
    navigate('/advisory/delivery/projects');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link 
        to="/advisory/delivery/projects" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-600 mt-1">
          Add a new infrastructure project to the program
        </p>
      </div>

      {/* Form */}
      <ProjectForm 
        programId={programId || undefined}
        programName={programName || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
