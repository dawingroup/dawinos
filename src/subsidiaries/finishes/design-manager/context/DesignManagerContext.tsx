/**
 * Design Manager Context
 * Global state management for Design Manager module
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from '@/shared/hooks';
import type {
  DesignItem,
  DesignProject,
  DesignStage,
  DesignCategory,
  RAGStatusValue,
} from '../types';

// View modes
export type DesignViewMode = 'kanban' | 'list' | 'grid' | 'roadmap';

// Filter state
export interface DesignFilters {
  stages?: DesignStage[];
  categories?: DesignCategory[];
  readinessMin?: number;
  readinessMax?: number;
  search?: string;
  assignedTo?: string[];
  hasApprovalsPending?: boolean;
}

// Sort options
export type DesignSortField = 'name' | 'itemCode' | 'createdAt' | 'updatedAt' | 'overallReadiness' | 'currentStage';
export type SortDirection = 'asc' | 'desc';

export interface DesignSort {
  field: DesignSortField;
  direction: SortDirection;
}

// RAG update payload
export interface RAGUpdatePayload {
  category: 'designCompleteness' | 'manufacturingReadiness' | 'qualityGates';
  aspect: string;
  value: RAGStatusValue;
  notes?: string;
}

// Context value interface
export interface DesignManagerContextValue {
  // Auth
  currentUserId: string;
  currentUserName: string;

  // Current project
  currentProject: DesignProject | null;
  setCurrentProject: (project: DesignProject | null) => void;
  projectLoading: boolean;
  setProjectLoading: (loading: boolean) => void;

  // Design items
  designItems: DesignItem[];
  setDesignItems: (items: DesignItem[]) => void;
  itemsLoading: boolean;
  setItemsLoading: (loading: boolean) => void;

  // Selected item
  selectedItem: DesignItem | null;
  setSelectedItem: (item: DesignItem | null) => void;

  // View preferences
  viewMode: DesignViewMode;
  setViewMode: (mode: DesignViewMode) => void;

  // Filters & Sort
  filters: DesignFilters;
  setFilters: (filters: DesignFilters) => void;
  updateFilter: <K extends keyof DesignFilters>(key: K, value: DesignFilters[K]) => void;
  clearFilters: () => void;
  sort: DesignSort;
  setSort: (sort: DesignSort) => void;

  // Computed data
  filteredItems: DesignItem[];
  itemsByStage: Record<DesignStage, DesignItem[]>;
  statistics: DesignStatistics;

  // RAG editing
  isEditingRAG: boolean;
  setIsEditingRAG: (editing: boolean) => void;
  editingRAGItem: DesignItem | null;
  setEditingRAGItem: (item: DesignItem | null) => void;

  // Panels & Modals
  showApprovalPanel: boolean;
  setShowApprovalPanel: (show: boolean) => void;
  showMaterialPanel: boolean;
  setShowMaterialPanel: (show: boolean) => void;
  showPartsPanel: boolean;
  setShowPartsPanel: (show: boolean) => void;

  // Item creation
  showNewItemDialog: boolean;
  setShowNewItemDialog: (show: boolean) => void;
  newItemDefaults: Partial<DesignItem> | null;
  setNewItemDefaults: (defaults: Partial<DesignItem> | null) => void;
}

// Statistics type
export interface DesignStatistics {
  totalItems: number;
  byStage: Record<DesignStage, number>;
  byCategory: Record<DesignCategory, number>;
  averageReadiness: number;
  needsAttention: number;
  approvalsPending: number;
  readyForProduction: number;
}

const DEFAULT_FILTERS: DesignFilters = {};
const DEFAULT_SORT: DesignSort = { field: 'updatedAt', direction: 'desc' };

const DesignManagerContext = createContext<DesignManagerContextValue | undefined>(undefined);

interface DesignManagerProviderProps {
  children: ReactNode;
}

export const DesignManagerProvider: React.FC<DesignManagerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || '';
  const currentUserName = user?.displayName || user?.email || '';

  // Project state
  const [currentProject, setCurrentProject] = useState<DesignProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);

  // Items state
  const [designItems, setDesignItems] = useState<DesignItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Selected item
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);

  // View preferences
  const [viewMode, setViewMode] = useState<DesignViewMode>('kanban');

  // Filters & Sort
  const [filters, setFiltersState] = useState<DesignFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<DesignSort>(DEFAULT_SORT);

  // RAG editing
  const [isEditingRAG, setIsEditingRAG] = useState(false);
  const [editingRAGItem, setEditingRAGItem] = useState<DesignItem | null>(null);

  // Panels & Modals
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [showMaterialPanel, setShowMaterialPanel] = useState(false);
  const [showPartsPanel, setShowPartsPanel] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [newItemDefaults, setNewItemDefaults] = useState<Partial<DesignItem> | null>(null);

  // Filter functions
  const setFilters = useCallback((newFilters: DesignFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updateFilter = useCallback(<K extends keyof DesignFilters>(key: K, value: DesignFilters[K]) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  // Compute filtered items
  const filteredItems = useMemo(() => {
    let result = [...designItems];

    // Apply filters
    if (filters.stages?.length) {
      result = result.filter(item => filters.stages!.includes(item.currentStage));
    }
    if (filters.categories?.length) {
      result = result.filter(item => filters.categories!.includes(item.category));
    }
    if (filters.readinessMin !== undefined) {
      result = result.filter(item => item.overallReadiness >= filters.readinessMin!);
    }
    if (filters.readinessMax !== undefined) {
      result = result.filter(item => item.overallReadiness <= filters.readinessMax!);
    }
    if (filters.assignedTo?.length) {
      result = result.filter(item =>
        item.assignedTo && filters.assignedTo!.includes(item.assignedTo)
      );
    }
    if (filters.hasApprovalsPending) {
      result = result.filter(item =>
        item.approvals?.some(a => a.status === 'pending')
      );
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.itemCode.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sort.field) {
        case 'name':
        case 'itemCode':
          aVal = a[sort.field].toLowerCase();
          bVal = b[sort.field].toLowerCase();
          break;
        case 'overallReadiness':
          aVal = a.overallReadiness;
          bVal = b.overallReadiness;
          break;
        case 'createdAt':
        case 'updatedAt':
          aVal = a[sort.field]?.toMillis?.() || 0;
          bVal = b[sort.field]?.toMillis?.() || 0;
          break;
        case 'currentStage':
          const stageOrder: Record<DesignStage, number> = {
            concept: 0,
            preliminary: 1,
            technical: 2,
            'pre-production': 3,
            'production-ready': 4,
            'procure-identify': 5,
            'procure-quote': 6,
            'procure-approve': 7,
            'procure-order': 8,
            'procure-received': 9,
          };
          aVal = stageOrder[a.currentStage] ?? 0;
          bVal = stageOrder[b.currentStage] ?? 0;
          break;
        default:
          aVal = a[sort.field];
          bVal = b[sort.field];
      }

      if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [designItems, filters, sort]);

  // Items grouped by stage for Kanban
  const itemsByStage = useMemo(() => {
    const stages: DesignStage[] = [
      'concept',
      'preliminary',
      'technical',
      'pre-production',
      'production-ready',
      'procure-identify',
      'procure-quote',
      'procure-approve',
      'procure-order',
      'procure-received',
    ];

    const result: Record<DesignStage, DesignItem[]> = {} as any;
    for (const stage of stages) {
      result[stage] = filteredItems.filter(item => item.currentStage === stage);
    }
    return result;
  }, [filteredItems]);

  // Compute statistics
  const statistics = useMemo((): DesignStatistics => {
    const stages: DesignStage[] = [
      'concept', 'preliminary', 'technical', 'pre-production', 'production-ready',
      'procure-identify', 'procure-quote', 'procure-approve', 'procure-order', 'procure-received',
    ];
    const categories: DesignCategory[] = ['casework', 'furniture', 'millwork', 'doors', 'fixtures', 'specialty'];

    const byStage: Record<DesignStage, number> = {} as any;
    for (const stage of stages) {
      byStage[stage] = designItems.filter(item => item.currentStage === stage).length;
    }

    const byCategory: Record<DesignCategory, number> = {} as any;
    for (const cat of categories) {
      byCategory[cat] = designItems.filter(item => item.category === cat).length;
    }

    const totalReadiness = designItems.reduce((sum, item) => sum + item.overallReadiness, 0);
    const averageReadiness = designItems.length > 0 ? totalReadiness / designItems.length : 0;

    const needsAttention = designItems.filter(item => item.overallReadiness < 50).length;
    const approvalsPending = designItems.filter(item =>
      item.approvals?.some(a => a.status === 'pending')
    ).length;
    const readyForProduction = designItems.filter(item =>
      item.currentStage === 'production-ready' || item.currentStage === 'procure-received'
    ).length;

    return {
      totalItems: designItems.length,
      byStage,
      byCategory,
      averageReadiness: Math.round(averageReadiness),
      needsAttention,
      approvalsPending,
      readyForProduction,
    };
  }, [designItems]);

  const value: DesignManagerContextValue = {
    currentUserId,
    currentUserName,
    currentProject,
    setCurrentProject,
    projectLoading,
    setProjectLoading,
    designItems,
    setDesignItems,
    itemsLoading,
    setItemsLoading,
    selectedItem,
    setSelectedItem,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    sort,
    setSort,
    filteredItems,
    itemsByStage,
    statistics,
    isEditingRAG,
    setIsEditingRAG,
    editingRAGItem,
    setEditingRAGItem,
    showApprovalPanel,
    setShowApprovalPanel,
    showMaterialPanel,
    setShowMaterialPanel,
    showPartsPanel,
    setShowPartsPanel,
    showNewItemDialog,
    setShowNewItemDialog,
    newItemDefaults,
    setNewItemDefaults,
  };

  return (
    <DesignManagerContext.Provider value={value}>
      {children}
    </DesignManagerContext.Provider>
  );
};

export const useDesignManagerContext = (): DesignManagerContextValue => {
  const context = useContext(DesignManagerContext);
  if (!context) {
    throw new Error('useDesignManagerContext must be used within DesignManagerProvider');
  }
  return context;
};

export default DesignManagerContext;
