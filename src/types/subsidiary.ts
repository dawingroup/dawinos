/**
 * Subsidiary Types
 * Data model for multi-subsidiary support in DawinOS
 */

export interface Subsidiary {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  color: string;
  description: string;
  modules: SubsidiaryModule[];
  status: 'active' | 'inactive' | 'coming-soon';
  createdAt: Date;
  updatedAt: Date;
}

export type SubsidiaryModule = 
  | 'design-manager'
  | 'clipper'
  | 'asset-registry'
  | 'feature-library'
  | 'launch-pipeline'
  | 'procurement'
  | 'production'
  | 'matflow';

export interface SubsidiaryStats {
  activeProjects: number;
  totalDesignItems: number;
  pendingTasks: number;
  completedThisMonth: number;
}

/**
 * Default subsidiaries for Dawin Group
 */
export const DEFAULT_SUBSIDIARIES: Subsidiary[] = [
  {
    id: 'dawin-finishes',
    name: 'Dawin Finishes',
    shortName: 'Finishes',
    color: '#872E5C',
    description: 'Custom millwork and furniture manufacturing',
    modules: ['design-manager', 'clipper', 'asset-registry', 'feature-library', 'launch-pipeline'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dawin-advisory',
    name: 'Dawin Advisory',
    shortName: 'Advisory',
    color: '#D97706',
    description: 'Construction consulting and project management',
    modules: ['matflow'],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dawin-capital',
    name: 'Dawin Capital',
    shortName: 'Capital',
    color: '#059669',
    description: 'Investment and financial services',
    modules: ['clipper'],
    status: 'coming-soon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dawin-technology',
    name: 'Dawin Technology',
    shortName: 'Technology',
    color: '#E18425',
    description: 'Software development and technology solutions',
    modules: ['clipper', 'launch-pipeline'],
    status: 'coming-soon',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
