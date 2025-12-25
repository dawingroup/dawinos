import React, { useState, useEffect } from 'react';
import { ChevronDown, Building2, FolderOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CustomerProjectSelector = ({ onProjectSelect, selectedCustomer, selectedProject }) => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [error, setError] = useState(null);

  // Fetch customers from Notion via Firebase Function
  const fetchCustomers = async () => {
    if (!user) return;
    
    setLoadingCustomers(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }
      
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch projects for selected customer
  const fetchProjects = async (customerId) => {
    if (!user || !customerId) return;
    
    setLoadingProjects(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects?customerId=${customerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCustomer) {
      fetchProjects(selectedCustomer.id);
    } else {
      setProjects([]);
    }
  }, [selectedCustomer]);

  const handleCustomerSelect = (customer) => {
    onProjectSelect({ customer, project: null });
  };

  const handleProjectSelect = (project) => {
    onProjectSelect({ customer: selectedCustomer, project });
  };

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800">Please sign in to select customers and projects</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Customer Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Customer
        </label>
        <div className="relative">
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(c => c.id === e.target.value);
              handleCustomerSelect(customer);
            }}
            disabled={loadingCustomers}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : 'Choose a customer'}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name || 'Unnamed Customer'}
              </option>
            ))}
          </select>
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Project Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Project
        </label>
        <div className="relative">
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              handleProjectSelect(project);
            }}
            disabled={!selectedCustomer || loadingProjects}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-50"
          >
            <option value="">
              {!selectedCustomer 
                ? 'Select a customer first'
                : loadingProjects 
                ? 'Loading projects...' 
                : 'Choose a project'
              }
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || 'Unnamed Project'} 
                {project.projectCode && ` (${project.projectCode})`}
              </option>
            ))}
          </select>
          <FolderOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Selected Project Info */}
      {selectedProject && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Selected Project</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <div>
              <strong>Name:</strong> {selectedProject.name}
            </div>
            {selectedProject.projectCode && (
              <div>
                <strong>Code:</strong> {selectedProject.projectCode}
              </div>
            )}
            {selectedProject.driveFolderUrl && (
              <div>
                <strong>Drive Folder:</strong> 
                <a 
                  href={selectedProject.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-blue-600 hover:underline"
                >
                  View Folder
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerProjectSelector;
