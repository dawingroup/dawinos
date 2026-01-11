// ============================================================================
// BUSINESS EVENT CONSTANTS
// DawinOS v2.0 - Intelligence Layer
// Constants for cross-module business event detection
// ============================================================================

import type { ModuleConfig, TaskTemplate, TaskChecklistItem } from '../types/businessEvents';

// ============================================================================
// MODULE CONFIGURATIONS
// ============================================================================

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  // Dawin Finishes Modules
  design_manager: {
    id: 'design_manager',
    subsidiary: 'finishes',
    name: 'Design Manager',
    description: 'Design workflow and project management',
    eventTypes: [
      'design_item_created',
      'design_item_stage_changed',
      'design_item_approval_requested',
      'design_item_approved',
      'design_item_rejected',
      'design_item_rag_updated',
      'design_item_file_uploaded',
      'design_item_costing_completed',
      'design_item_procurement_started',
      'design_item_production_ready',
      'design_project_created',
      'design_project_status_changed',
      'design_project_deadline_approaching',
    ],
    enabled: true,
  },
  launch_pipeline: {
    id: 'launch_pipeline',
    subsidiary: 'finishes',
    name: 'Launch Pipeline',
    description: 'Product launch and market readiness',
    eventTypes: [
      'product_created',
      'product_stage_changed',
      'product_launched',
      'product_synced_shopify',
      'product_pricing_updated',
    ],
    enabled: true,
  },
  inventory: {
    id: 'inventory',
    subsidiary: 'finishes',
    name: 'Inventory',
    description: 'Stock and material management',
    eventTypes: [
      'stock_low',
      'stock_reorder_required',
      'material_received',
      'material_allocated',
    ],
    enabled: true,
  },
  customer_hub: {
    id: 'customer_hub',
    subsidiary: 'finishes',
    name: 'Customer Hub',
    description: 'Customer relationship management',
    eventTypes: [
      'customer_created',
      'customer_project_assigned',
      'customer_communication_logged',
    ],
    enabled: true,
  },
  
  // Dawin Advisory Modules
  engagements: {
    id: 'engagements',
    subsidiary: 'advisory',
    name: 'Engagements',
    description: 'Client engagement management',
    eventTypes: [
      'engagement_created',
      'engagement_status_changed',
      'engagement_team_assigned',
      'engagement_milestone_reached',
      'engagement_deadline_approaching',
      'engagement_budget_threshold',
    ],
    enabled: true,
  },
  funding: {
    id: 'funding',
    subsidiary: 'advisory',
    name: 'Funding Management',
    description: 'Funding sources and disbursements',
    eventTypes: [
      'funding_source_added',
      'disbursement_requested',
      'disbursement_approved',
      'covenant_measurement_due',
      'covenant_breach_risk',
    ],
    enabled: true,
  },
  reporting: {
    id: 'reporting',
    subsidiary: 'advisory',
    name: 'Reporting',
    description: 'Compliance and funder reporting',
    eventTypes: [
      'report_due',
      'report_submitted',
      'report_approved',
      'report_overdue',
    ],
    enabled: true,
  },
  
  // Shared Modules
  financial: {
    id: 'financial',
    subsidiary: 'finishes',
    name: 'Financial Hub',
    description: 'Financial management and reporting',
    eventTypes: [
      'budget_created',
      'expense_submitted',
      'expense_approved',
      'budget_threshold_exceeded',
    ],
    enabled: true,
  },
  hr_central: {
    id: 'hr_central',
    subsidiary: 'finishes',
    name: 'HR Central',
    description: 'Human resources management',
    eventTypes: [
      'employee_onboarded',
      'leave_requested',
      'performance_review_due',
      'training_completed',
    ],
    enabled: true,
  },
  capital_hub: {
    id: 'capital_hub',
    subsidiary: 'capital',
    name: 'Capital Hub',
    description: 'Investment and deal management',
    eventTypes: [
      'deal_created',
      'deal_stage_changed',
      'deal_closed',
      'investor_added',
    ],
    enabled: true,
  },
};

// ============================================================================
// DESIGN MANAGER TASK TEMPLATES
// ============================================================================

const createChecklistItem = (
  id: string,
  title: string,
  description: string,
  isRequired: boolean,
  order: number,
  verificationCriteria?: string
): TaskChecklistItem => ({
  id,
  title,
  description,
  isRequired,
  order,
  completed: false,
  verificationCriteria,
});

export const DESIGN_MANAGER_TASK_TEMPLATES: TaskTemplate[] = [
  // Stage: Concept → Preliminary
  {
    id: 'dm_concept_to_preliminary',
    name: 'Concept to Preliminary Review',
    description: 'Tasks required when moving design from concept to preliminary stage',
    category: 'stage_transition',
    triggerEvents: ['design_item_stage_changed'],
    triggerConditions: [
      { field: 'currentState.currentStage', operator: 'equals', value: 'preliminary' },
      { field: 'previousState.currentStage', operator: 'equals', value: 'concept' },
    ],
    defaultTitle: 'Complete Preliminary Design Requirements',
    defaultDescription: 'Ensure all preliminary design requirements are met before proceeding to technical design.',
    defaultPriority: 'medium',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Overall Dimensions Defined', 'Confirm all major dimensions are documented', true, 1, 'Dimensions recorded in design file'),
      createChecklistItem('2', '3D Model Created', 'Create initial 3D model with basic geometry', true, 2, '3D model file uploaded'),
      createChecklistItem('3', 'Material Selection', 'Select primary materials for the design', true, 3, 'Materials specified in design parameters'),
      createChecklistItem('4', 'Client Brief Review', 'Review against original client requirements', true, 4, 'Client requirements checklist completed'),
      createChecklistItem('5', 'Initial Cost Estimate', 'Prepare preliminary cost estimate', false, 5, 'Cost estimate within 20% accuracy'),
    ],
    assignmentStrategy: 'creator',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Stage: Preliminary → Technical
  {
    id: 'dm_preliminary_to_technical',
    name: 'Preliminary to Technical Review',
    description: 'Tasks required when moving design from preliminary to technical stage',
    category: 'stage_transition',
    triggerEvents: ['design_item_stage_changed'],
    triggerConditions: [
      { field: 'currentState.currentStage', operator: 'equals', value: 'technical' },
      { field: 'previousState.currentStage', operator: 'equals', value: 'preliminary' },
    ],
    defaultTitle: 'Complete Technical Design Requirements',
    defaultDescription: 'Ensure all technical specifications are complete and verified.',
    defaultPriority: 'high',
    defaultDueDays: 7,
    checklistItems: [
      createChecklistItem('1', 'Production Drawings Complete', 'All shop drawings with dimensions and details', true, 1, 'Drawings reviewed and approved'),
      createChecklistItem('2', 'Material Specifications Finalized', 'All materials specified with SKUs/part numbers', true, 2, 'Materials linked to inventory/Katana'),
      createChecklistItem('3', 'Hardware Schedule Complete', 'All hardware items listed with quantities', true, 3, 'Hardware list verified'),
      createChecklistItem('4', 'Joinery Details Documented', 'All joinery types and locations specified', true, 4, 'Joinery details in drawings'),
      createChecklistItem('5', 'Tolerances Defined', 'Manufacturing tolerances specified', true, 5, 'Tolerance specifications documented'),
      createChecklistItem('6', 'Assembly Instructions Draft', 'Initial assembly sequence documented', false, 6, 'Assembly notes added'),
      createChecklistItem('7', 'Internal Design Review', 'Design reviewed by senior designer', true, 7, 'Review approval recorded'),
    ],
    assignmentStrategy: 'creator',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Stage: Technical → Pre-Production
  {
    id: 'dm_technical_to_preproduction',
    name: 'Technical to Pre-Production Review',
    description: 'Tasks required when preparing design for pre-production',
    category: 'stage_transition',
    triggerEvents: ['design_item_stage_changed'],
    triggerConditions: [
      { field: 'currentState.currentStage', operator: 'equals', value: 'pre-production' },
      { field: 'previousState.currentStage', operator: 'equals', value: 'technical' },
    ],
    defaultTitle: 'Complete Pre-Production Checklist',
    defaultDescription: 'Verify manufacturing readiness and material availability.',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Manufacturing Review Complete', 'Workshop has reviewed and approved design', true, 1, 'Manufacturing review sign-off'),
      createChecklistItem('2', 'Material Availability Confirmed', 'All materials in stock or ordered', true, 2, 'Stock check completed'),
      createChecklistItem('3', 'Hardware Availability Confirmed', 'All hardware items available', true, 3, 'Hardware stock verified'),
      createChecklistItem('4', 'CNC Programs Generated', 'Cutlist and CNC files prepared', false, 4, 'CNC files uploaded'),
      createChecklistItem('5', 'Quality Criteria Defined', 'Acceptance criteria documented', true, 5, 'QC checklist created'),
      createChecklistItem('6', 'Cost Validation Complete', 'Final costing approved', true, 6, 'Cost within budget'),
      createChecklistItem('7', 'Client Approval Obtained', 'Client has approved final design', true, 7, 'Client approval documented'),
    ],
    assignmentStrategy: 'project_lead',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Stage: Pre-Production → Production Ready
  {
    id: 'dm_preproduction_to_ready',
    name: 'Production Ready Final Check',
    description: 'Final checks before releasing to production',
    category: 'stage_transition',
    triggerEvents: ['design_item_stage_changed'],
    triggerConditions: [
      { field: 'currentState.currentStage', operator: 'equals', value: 'production-ready' },
      { field: 'previousState.currentStage', operator: 'equals', value: 'pre-production' },
    ],
    defaultTitle: 'Final Production Release Checklist',
    defaultDescription: 'Complete final verification before production begins.',
    defaultPriority: 'urgent',
    defaultDueDays: 2,
    checklistItems: [
      createChecklistItem('1', 'All RAG Items Green', 'All RAG status items are green or N/A', true, 1, 'RAG dashboard shows all green'),
      createChecklistItem('2', 'Production Schedule Confirmed', 'Workshop has capacity and timeline', true, 2, 'Production slot allocated'),
      createChecklistItem('3', 'Material Reserved', 'Materials reserved for this job', true, 3, 'Stock allocation confirmed'),
      createChecklistItem('4', 'Work Order Created', 'Production work order generated', true, 4, 'Work order number assigned'),
      createChecklistItem('5', 'Final Sign-Off', 'Project manager approval', true, 5, 'PM signature obtained'),
    ],
    assignmentStrategy: 'project_lead',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Approval Request
  {
    id: 'dm_approval_requested',
    name: 'Design Approval Required',
    description: 'Tasks when design approval is requested',
    category: 'approval',
    triggerEvents: ['design_item_approval_requested'],
    defaultTitle: 'Review and Approve Design',
    defaultDescription: 'Review the design submission and provide approval or feedback.',
    defaultPriority: 'high',
    defaultDueDays: 3,
    checklistItems: [
      createChecklistItem('1', 'Review Design Files', 'Review all uploaded design documents', true, 1),
      createChecklistItem('2', 'Check Specifications', 'Verify material and hardware specifications', true, 2),
      createChecklistItem('3', 'Validate Cost Estimate', 'Review and validate costing', true, 3),
      createChecklistItem('4', 'Provide Feedback', 'Document any required changes', false, 4),
      createChecklistItem('5', 'Record Decision', 'Approve or request revision', true, 5),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'design_approver',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Procurement Started
  {
    id: 'dm_procurement_started',
    name: 'Procurement Process Started',
    description: 'Tasks when design enters procurement phase',
    category: 'procurement',
    triggerEvents: ['design_item_procurement_started'],
    defaultTitle: 'Complete Procurement Requirements',
    defaultDescription: 'Manage the procurement process for special/procured items.',
    defaultPriority: 'high',
    defaultDueDays: 14,
    checklistItems: [
      createChecklistItem('1', 'Identify Items to Procure', 'List all items requiring procurement', true, 1),
      createChecklistItem('2', 'Obtain Quotes', 'Get quotes from at least 2 suppliers', true, 2),
      createChecklistItem('3', 'Calculate Landed Cost', 'Include shipping, customs, duties', true, 3),
      createChecklistItem('4', 'Get Procurement Approval', 'Obtain approval for purchase', true, 4),
      createChecklistItem('5', 'Place Orders', 'Submit purchase orders', true, 5),
      createChecklistItem('6', 'Track Shipments', 'Monitor delivery status', true, 6),
      createChecklistItem('7', 'Receive and Inspect', 'Verify items received match order', true, 7),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'procurement_officer',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
];

// ============================================================================
// ADVISORY ENGAGEMENT TASK TEMPLATES
// ============================================================================

export const ADVISORY_TASK_TEMPLATES: TaskTemplate[] = [
  // Engagement Created
  {
    id: 'adv_engagement_created',
    name: 'New Engagement Setup',
    description: 'Tasks for setting up a new client engagement',
    category: 'engagement_setup',
    triggerEvents: ['engagement_created'],
    defaultTitle: 'Complete Engagement Setup',
    defaultDescription: 'Set up all required elements for the new engagement.',
    defaultPriority: 'high',
    defaultDueDays: 7,
    checklistItems: [
      createChecklistItem('1', 'Client Onboarding', 'Complete client onboarding documentation', true, 1),
      createChecklistItem('2', 'Team Assignment', 'Assign engagement team members', true, 2),
      createChecklistItem('3', 'Kickoff Meeting', 'Schedule and conduct kickoff meeting', true, 3),
      createChecklistItem('4', 'Scope Documentation', 'Document engagement scope and deliverables', true, 4),
      createChecklistItem('5', 'Timeline Setup', 'Establish project timeline and milestones', true, 5),
      createChecklistItem('6', 'Budget Setup', 'Set up engagement budget tracking', true, 6),
      createChecklistItem('7', 'Reporting Schedule', 'Define reporting requirements and schedule', false, 7),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'engagement_lead',
    sourceModule: 'engagements',
    subsidiary: 'advisory',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Disbursement Requested
  {
    id: 'adv_disbursement_requested',
    name: 'Disbursement Request Review',
    description: 'Tasks for processing disbursement requests',
    category: 'financial',
    triggerEvents: ['disbursement_requested'],
    defaultTitle: 'Process Disbursement Request',
    defaultDescription: 'Review and process the disbursement request.',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Verify Documentation', 'Ensure all required documents are attached', true, 1),
      createChecklistItem('2', 'Budget Check', 'Verify funds available in budget', true, 2),
      createChecklistItem('3', 'Compliance Review', 'Check against funding agreement terms', true, 3),
      createChecklistItem('4', 'Technical Review', 'Verify work completed meets standards', true, 4),
      createChecklistItem('5', 'Approval Chain', 'Obtain required approvals', true, 5),
      createChecklistItem('6', 'Process Payment', 'Execute disbursement', true, 6),
      createChecklistItem('7', 'Update Records', 'Update financial records and funder portal', true, 7),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'finance_officer',
    sourceModule: 'funding',
    subsidiary: 'advisory',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  
  // Report Due
  {
    id: 'adv_report_due',
    name: 'Report Preparation',
    description: 'Tasks for preparing due reports',
    category: 'reporting',
    triggerEvents: ['report_due'],
    defaultTitle: 'Prepare and Submit Report',
    defaultDescription: 'Prepare the required report for submission.',
    defaultPriority: 'high',
    defaultDueDays: 7,
    checklistItems: [
      createChecklistItem('1', 'Gather Data', 'Collect all required data and metrics', true, 1),
      createChecklistItem('2', 'Draft Report', 'Prepare initial report draft', true, 2),
      createChecklistItem('3', 'Internal Review', 'Get internal review and feedback', true, 3),
      createChecklistItem('4', 'Incorporate Feedback', 'Update report based on feedback', true, 4),
      createChecklistItem('5', 'Final Approval', 'Obtain final approval from engagement lead', true, 5),
      createChecklistItem('6', 'Submit Report', 'Submit to funder/client', true, 6),
      createChecklistItem('7', 'File Documentation', 'Archive report and confirmation', true, 7),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'project_manager',
    sourceModule: 'reporting',
    subsidiary: 'advisory',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
];

// ============================================================================
// ALL TASK TEMPLATES
// ============================================================================

export const ALL_TASK_TEMPLATES: TaskTemplate[] = [
  ...DESIGN_MANAGER_TASK_TEMPLATES,
  ...ADVISORY_TASK_TEMPLATES,
];

// ============================================================================
// EVENT TO COLLECTION MAPPING
// ============================================================================

export const COLLECTION_EVENT_MAPPINGS: Record<string, { collection: string; events: string[] }> = {
  // Dawin Finishes
  designItems: {
    collection: 'designProjects/{projectId}/designItems',
    events: [
      'design_item_created',
      'design_item_stage_changed',
      'design_item_rag_updated',
      'design_item_file_uploaded',
    ],
  },
  designProjects: {
    collection: 'designProjects',
    events: [
      'design_project_created',
      'design_project_status_changed',
    ],
  },
  launchProducts: {
    collection: 'launchProducts',
    events: [
      'product_created',
      'product_stage_changed',
      'product_launched',
    ],
  },
  
  // Dawin Advisory
  engagements: {
    collection: 'engagements',
    events: [
      'engagement_created',
      'engagement_status_changed',
      'engagement_team_assigned',
    ],
  },
  fundingSources: {
    collection: 'engagements/{engagementId}/fundingSources',
    events: [
      'funding_source_added',
    ],
  },
  disbursements: {
    collection: 'engagements/{engagementId}/fundingSources/{fundingSourceId}/disbursements',
    events: [
      'disbursement_requested',
      'disbursement_approved',
    ],
  },
  reportSubmissions: {
    collection: 'engagements/{engagementId}/reportSubmissions',
    events: [
      'report_submitted',
      'report_approved',
    ],
  },
};
