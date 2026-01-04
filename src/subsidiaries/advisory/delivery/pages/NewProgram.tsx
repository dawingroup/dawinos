/**
 * New Program Page - Create a new program
 */

import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ProgramForm } from '../components/forms/ProgramForm';

export function NewProgram() {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    // TODO: Call service to create program
    console.log('Creating program:', data);
    
    // For now, just navigate back
    alert('Program created successfully! (Demo mode - data not saved)');
    navigate('/advisory/delivery');
  };

  const handleCancel = () => {
    navigate('/advisory/delivery');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <Link 
        to="/advisory/delivery" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Delivery Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Program</h1>
        <p className="text-gray-600 mt-1">
          Set up a new infrastructure delivery program
        </p>
      </div>

      {/* Form */}
      <ProgramForm 
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
