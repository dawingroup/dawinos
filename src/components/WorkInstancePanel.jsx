import React, { useState, useEffect } from 'react';
import { Save, Clock, FolderOpen, Plus, Check, Loader2, ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react';
import { useWorkInstance } from '../contexts/WorkInstanceContext';
import { useAuth } from '../contexts/AuthContext';

const WorkInstancePanel = ({ 
  selectedProject, 
  selectedCustomer,
  panelData,
  configuration,
  outputs,
  optimization,
  onLoadInstance 
}) => {
  const { user } = useAuth();
  const {
    currentInstance,
    currentProjectId,
    recentInstances,
    saving,
    lastSaved,
    loadingInstances,
    createNewInstance,
    saveInstance,
    loadInstance,
    loadProjectInstances,
    clearInstance,
    loadRecentInstances,
    handleProjectChange,
  } = useWorkInstance();

  const [projectInstances, setProjectInstances] = useState([]);
  const [showInstanceList, setShowInstanceList] = useState(false);
  const [showRecentList, setShowRecentList] = useState(false);
  const [loadingProjectInstances, setLoadingProjectInstances] = useState(false);

  // Handle project change - clear instance if project changed
  useEffect(() => {
    if (selectedProject?.id) {
      // Notify context about project change (will clear instance if different project)
      handleProjectChange(selectedProject.id);
      
      // Load instances for the new project
      setLoadingProjectInstances(true);
      loadProjectInstances(selectedProject.id)
        .then(setProjectInstances)
        .finally(() => setLoadingProjectInstances(false));
    } else {
      setProjectInstances([]);
    }
  }, [selectedProject?.id, handleProjectChange]);

  const handleCreateInstance = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    try {
      await createNewInstance({
        projectId: selectedProject.id,
        projectCode: selectedProject.projectCode,
        projectName: selectedProject.name,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        panelData,
        configuration,
        outputs,
        optimization,
      });
    } catch (error) {
      alert('Failed to create work instance: ' + error.message);
    }
  };

  const handleLoadInstance = async (instanceId) => {
    try {
      const instance = await loadInstance(instanceId);
      if (instance && onLoadInstance) {
        onLoadInstance(instance);
      }
      setShowInstanceList(false);
      setShowRecentList(false);
    } catch (error) {
      alert('Failed to load instance: ' + error.message);
    }
  };

  const handleManualSave = async () => {
    if (!currentInstance?.id) {
      await handleCreateInstance();
    } else {
      // Verify we're saving to the correct project
      if (selectedProject?.id && currentInstance.projectId !== selectedProject.id) {
        alert('Cannot save: The current work instance belongs to a different project. Please create a new instance for this project.');
        return;
      }
      
      try {
        await saveInstance({
          panelData,
          configuration,
          outputs,
          optimization,
        }, selectedProject?.id);
      } catch (error) {
        alert('Failed to save: ' + error.message);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      exported: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-600" size={18} />
          <h3 className="font-medium text-gray-800">Work Instance</h3>
          {saving && (
            <span className="flex items-center gap-1 text-sm text-blue-500">
              <Loader2 size={14} className="animate-spin" />
              Saving...
            </span>
          )}
          {!saving && lastSaved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check size={14} />
              Saved {formatRelativeTime(lastSaved)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Recent Button */}
          <button
            onClick={() => {
              setShowRecentList(!showRecentList);
              setShowInstanceList(false);
              if (!showRecentList) loadRecentInstances();
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Clock size={14} />
            Recent
            {showRecentList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Project Instances Button */}
          {selectedProject && (
            <button
              onClick={() => {
                setShowInstanceList(!showInstanceList);
                setShowRecentList(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <FolderOpen size={14} />
              Project ({projectInstances.length})
              {showInstanceList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Save/Create Button */}
          <button
            onClick={handleManualSave}
            disabled={saving || (!currentInstance && !selectedProject)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : currentInstance ? (
              <Save size={14} />
            ) : (
              <Plus size={14} />
            )}
            {currentInstance ? 'Save' : 'Create Instance'}
          </button>
        </div>
      </div>

      {/* Current Instance Info */}
      {currentInstance && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-900">
                {currentInstance.projectCode} - {currentInstance.projectName}
              </span>
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getStatusBadge(currentInstance.status)}`}>
                {currentInstance.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-700">
              <span>Updated {formatRelativeTime(currentInstance.updatedAt)} by {currentInstance.updatedBy}</span>
              <button
                onClick={clearInstance}
                className="text-red-500 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
          </div>
          {currentInstance.driveFiles?.length > 0 && (
            <div className="mt-2 text-xs text-green-700">
              📁 {currentInstance.driveFiles.length} file(s) exported to Drive
            </div>
          )}
        </div>
      )}

      {/* Recent Instances List */}
      {showRecentList && (
        <div className="px-4 py-3 border-b border-gray-100 max-h-72 overflow-y-auto">
          <h4 className="font-medium text-gray-700 mb-2 text-sm">Recent Work Instances</h4>
          {loadingInstances ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : recentInstances.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No recent instances</p>
          ) : (
            <ul className="space-y-2">
              {recentInstances.map(instance => (
                <li 
                  key={instance.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    currentInstance?.id === instance.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleLoadInstance(instance.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">
                      {instance.projectCode || 'No Project'} - {instance.projectName || 'Untitled'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(instance.status)}`}>
                      {instance.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {instance.panelData?.length || 0} panels • 
                    Updated {formatRelativeTime(instance.updatedAt)} by {instance.updatedBy}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Project Instances List */}
      {showInstanceList && (
        <div className="px-4 py-3 border-b border-gray-100 max-h-72 overflow-y-auto">
          <h4 className="font-medium text-gray-700 mb-2 text-sm">
            Instances for {selectedProject?.projectCode}
          </h4>
          {loadingProjectInstances ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : projectInstances.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No instances for this project</p>
          ) : (
            <ul className="space-y-2">
              {projectInstances.map(instance => (
                <li 
                  key={instance.id}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    currentInstance?.id === instance.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleLoadInstance(instance.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">
                      {instance.panelData?.length || 0} panels
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(instance.status)}`}>
                      {instance.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated {formatRelativeTime(instance.updatedAt)} by {instance.updatedBy}
                  </div>
                  {instance.driveFiles?.length > 0 && (
                    <div className="text-xs text-green-600 mt-1">
                      📁 {instance.driveFiles.length} file(s) exported
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* No Instance Prompt */}
      {!currentInstance && !showRecentList && !showInstanceList && (
        <div className="px-4 py-3 text-sm text-gray-500">
          {selectedProject ? (
            <span>Click "Create Instance" to start saving your work for <strong>{selectedProject.projectCode}</strong></span>
          ) : (
            <span>Select a project to create a work instance</span>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkInstancePanel;
