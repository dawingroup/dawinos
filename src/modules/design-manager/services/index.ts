/**
 * Design Manager Services
 * Business logic and API services for the design manager module
 */

// Firestore operations
export {
  // Project operations
  createProject,
  updateProject,
  getProject,
  getProjects,
  subscribeToProject,
  subscribeToProjects,
  
  // Design Item operations
  createDesignItem,
  updateDesignItem,
  deleteDesignItem,
  getDesignItem,
  getDesignItems,
  subscribeToDesignItems,
  subscribeToDesignItem,
  
  // RAG operations
  updateRAGAspect,
  batchUpdateRAGAspects,
  
  // Stage operations
  transitionStage,
} from './firestore';
