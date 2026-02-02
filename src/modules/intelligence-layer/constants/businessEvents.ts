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
    description: 'Interior design and custom furniture project management',
    eventTypes: [
      // Existing events
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

      // Interior design events
      'client_consultation_scheduled',
      'space_planning_requested',
      'design_concepts_created',
      'client_feedback_received',
      'material_samples_requested',
      'material_specification_needed',
      'upholstery_specification_required',
      'hardware_selection_required',
      'installation_scheduled',
      'site_preparation_required',
      'installation_complete',
      'post_installation_followup',
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
// INTERIOR DESIGN & CUSTOM FURNITURE TASK TEMPLATES
// ============================================================================

export const INTERIOR_DESIGN_TASK_TEMPLATES: TaskTemplate[] = [
  // Consultation Preparation
  {
    id: 'id_consultation_prep',
    name: 'Interior Design Consultation Preparation',
    description: 'Prepare for client design consultation',
    category: 'client_engagement',
    triggerEvents: ['finishes.client_consultation_scheduled'],
    triggerConditions: [
      { field: 'consultationType', operator: 'in', value: ['initial', 'follow-up'] },
    ],
    defaultTitle: 'Prepare for {{entityName}} Consultation',
    defaultDescription: 'Prepare materials and concepts for client consultation',
    defaultPriority: 'high',
    defaultDueDays: 3,
    checklistItems: [
      createChecklistItem('1', 'Review Client Brief and Requirements', 'Study client preferences, budget, timeline, and scope', true, 1, 'Client brief documented and understood'),
      createChecklistItem('2', 'Research Design Inspiration', 'Gather inspiration images matching client style preferences', true, 2, 'Mood board created with 10+ images'),
      createChecklistItem('3', 'Prepare Initial Concept Sketches', 'Create 2-3 design direction concepts', true, 3, 'Concepts prepared in Figma/CAD'),
      createChecklistItem('4', 'Gather Material Samples', 'Assemble relevant material and finish samples', true, 4, 'Sample board prepared'),
      createChecklistItem('5', 'Prepare Budget Estimate', 'Create preliminary cost estimate', false, 5, 'Budget range documented'),
      createChecklistItem('6', 'Prepare Consultation Agenda', 'Outline topics and questions for consultation', true, 6, 'Agenda sent to client 24hrs prior'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'interior_designer',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Space Planning
  {
    id: 'id_space_planning',
    name: 'Space Planning Analysis',
    description: 'Analyze space and create functional layout',
    category: 'design_analysis',
    triggerEvents: ['finishes.space_planning_requested'],
    defaultTitle: 'Space Planning for {{entityName}}',
    defaultDescription: 'Analyze space constraints and create optimal layout',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Site Measurement Verification', 'Verify all dimensions and document existing conditions', true, 1, 'Accurate measurements documented with photos'),
      createChecklistItem('2', 'Identify Space Constraints', 'Document doors, windows, utilities, structural elements', true, 2, 'Constraints marked on floor plan'),
      createChecklistItem('3', 'Analyze Traffic Flow', 'Map circulation paths and access requirements', true, 3, 'Traffic flow diagram created'),
      createChecklistItem('4', 'Review Building Codes', 'Check clearance, egress, and accessibility requirements', true, 4, 'Code compliance verified'),
      createChecklistItem('5', 'Create Space Plan Options', 'Develop 2-3 layout alternatives', true, 5, '2+ layout options in CAD'),
      createChecklistItem('6', 'Document Space Plan Rationale', 'Explain design decisions and trade-offs', true, 6, 'Rationale documented for each option'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'space_planner',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Design Concept Presentation
  {
    id: 'id_concept_presentation',
    name: 'Design Concept Presentation',
    description: 'Prepare and present design concepts to client',
    category: 'client_presentation',
    triggerEvents: ['finishes.design_concepts_created'],
    defaultTitle: 'Present Design Concepts for {{entityName}}',
    defaultDescription: 'Prepare presentation and present concepts to client',
    defaultPriority: 'high',
    defaultDueDays: 3,
    checklistItems: [
      createChecklistItem('1', 'Create Presentation Deck', 'Compile all concepts into cohesive presentation', true, 1, 'Presentation file created'),
      createChecklistItem('2', 'Prepare 3D Visualizations', 'Create renders for each concept', true, 2, 'Renders exported and included'),
      createChecklistItem('3', 'Document Material Selections', 'Specify materials and finishes for each concept', true, 3, 'Material boards created'),
      createChecklistItem('4', 'Prepare Cost Comparisons', 'Estimate costs for each concept', false, 4, 'Cost summary included'),
      createChecklistItem('5', 'Rehearse Presentation', 'Practice presentation delivery', true, 5, 'Presentation rehearsed'),
      createChecklistItem('6', 'Conduct Client Presentation', 'Present concepts and gather feedback', true, 6, 'Client feedback documented'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'interior_designer',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Client Feedback Processing
  {
    id: 'id_feedback_processing',
    name: 'Client Feedback Review and Action',
    description: 'Process client feedback and implement changes',
    category: 'revision',
    triggerEvents: ['finishes.client_feedback_received'],
    triggerConditions: [
      { field: 'feedbackType', operator: 'eq', value: 'revision-requested' },
    ],
    defaultTitle: 'Process Client Feedback for {{entityName}}',
    defaultDescription: 'Review feedback and implement requested changes',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Document All Feedback Points', 'Create comprehensive list of feedback items', true, 1, 'Feedback list documented'),
      createChecklistItem('2', 'Clarify Ambiguous Feedback', 'Contact client for clarification if needed', true, 2, 'All feedback understood'),
      createChecklistItem('3', 'Prioritize Revision Tasks', 'Categorize by importance and complexity', true, 3, 'Priority list created'),
      createChecklistItem('4', 'Implement Design Changes', 'Make requested modifications to design', true, 4, 'Changes implemented in design files'),
      createChecklistItem('5', 'Update Documentation', 'Revise all affected drawings and specs', true, 5, 'Documentation updated'),
      createChecklistItem('6', 'Prepare Revision Presentation', 'Document changes made in response to feedback', true, 6, 'Revision summary prepared'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'interior_designer',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Material Specification
  {
    id: 'id_material_specification',
    name: 'Material Specification and Sourcing',
    description: 'Specify materials and identify suppliers',
    category: 'material_sourcing',
    triggerEvents: ['finishes.material_specification_needed'],
    defaultTitle: 'Specify Materials for {{entityName}}',
    defaultDescription: 'Complete material specifications and sourcing',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Review Design Requirements', 'Understand aesthetic and functional requirements', true, 1, 'Requirements documented'),
      createChecklistItem('2', 'Research Material Options', 'Identify 2-3 suitable material options per category', true, 2, 'Options documented with specs'),
      createChecklistItem('3', 'Evaluate Suppliers', 'Identify and evaluate potential suppliers', true, 3, 'Minimum 2 suppliers per material'),
      createChecklistItem('4', 'Obtain Pricing and Lead Times', 'Get quotes and availability information', true, 4, 'Pricing documented in estimate'),
      createChecklistItem('5', 'Check Sustainability Certifications', 'Verify environmental and quality certifications', false, 5, 'Certifications documented'),
      createChecklistItem('6', 'Document Final Specifications', 'Complete specification sheets with all details', true, 6, 'Spec sheets attached to design item'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'material_specialist',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Material Sample Sourcing
  {
    id: 'id_sample_sourcing',
    name: 'Material Sample Sourcing',
    description: 'Source and deliver material samples to client',
    category: 'material_sourcing',
    triggerEvents: ['finishes.material_samples_requested'],
    defaultTitle: 'Source Samples for {{entityName}}',
    defaultDescription: 'Obtain and deliver material samples',
    defaultPriority: 'medium',
    defaultDueDays: 7,
    checklistItems: [
      createChecklistItem('1', 'Identify Sample Requirements', 'Review which materials need samples', true, 1, 'Sample list created'),
      createChecklistItem('2', 'Contact Suppliers', 'Request samples from identified suppliers', true, 2, 'All samples requested'),
      createChecklistItem('3', 'Track Sample Shipments', 'Monitor sample delivery status', true, 3, 'Tracking information recorded'),
      createChecklistItem('4', 'Receive and Inspect Samples', 'Verify samples match specifications', true, 4, 'Sample quality verified'),
      createChecklistItem('5', 'Create Sample Board', 'Organize samples for client presentation', true, 5, 'Sample board prepared'),
      createChecklistItem('6', 'Deliver to Client', 'Coordinate sample delivery or presentation', true, 6, 'Samples delivered to client'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'material_specialist',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Installation Coordination
  {
    id: 'id_installation_coordination',
    name: 'Installation Coordination',
    description: 'Coordinate on-site installation and quality verification',
    category: 'installation',
    triggerEvents: ['finishes.installation_scheduled'],
    defaultTitle: 'Coordinate Installation for {{entityName}}',
    defaultDescription: 'Manage on-site installation and quality control',
    defaultPriority: 'urgent',
    defaultDueDays: 2,
    checklistItems: [
      createChecklistItem('1', 'Verify Site Readiness', 'Confirm site is prepared and accessible', true, 1, 'Site inspection completed'),
      createChecklistItem('2', 'Coordinate Installation Team', 'Brief team on project requirements and schedule', true, 2, 'Team briefing held'),
      createChecklistItem('3', 'Verify Material Delivery', 'Confirm all materials delivered and inspected', true, 3, 'Delivery checklist completed'),
      createChecklistItem('4', 'Monitor Installation Progress', 'Conduct quality checks during installation', true, 4, 'Daily progress photos documented'),
      createChecklistItem('5', 'Document Site Conditions', 'Photo document before, during, and after installation', true, 5, 'Photo set uploaded'),
      createChecklistItem('6', 'Create Punch List', 'Document any defects or incomplete items', true, 6, 'Punch list created in system'),
      createChecklistItem('7', 'Conduct Client Walkthrough', 'Walk through installed work with client', true, 7, 'Client walkthrough completed'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'installation_coordinator',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Site Preparation
  {
    id: 'id_site_preparation',
    name: 'Pre-Installation Site Preparation',
    description: 'Ensure site is ready for installation',
    category: 'installation',
    triggerEvents: ['finishes.site_preparation_required'],
    defaultTitle: 'Prepare Site for {{entityName}}',
    defaultDescription: 'Complete all site preparation requirements',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Site Access Confirmation', 'Verify site access arrangements', true, 1, 'Access confirmed with client'),
      createChecklistItem('2', 'Clear Installation Area', 'Ensure installation area is clear', true, 2, 'Area cleared and verified'),
      createChecklistItem('3', 'Verify Utilities', 'Confirm power, water, and other utilities available', true, 3, 'Utilities tested'),
      createChecklistItem('4', 'Safety Assessment', 'Conduct site safety inspection', true, 4, 'Safety checklist completed'),
      createChecklistItem('5', 'Protection Measures', 'Install floor and wall protection as needed', true, 5, 'Protection installed'),
      createChecklistItem('6', 'Coordinate Staging Area', 'Set up materials staging area', true, 6, 'Staging area prepared'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'installation_coordinator',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Post-Installation Follow-up
  {
    id: 'id_post_installation',
    name: 'Post-Installation Follow-up',
    description: 'Follow up with client after installation',
    category: 'client_engagement',
    triggerEvents: ['finishes.post_installation_followup'],
    defaultTitle: 'Follow-up for {{entityName}}',
    defaultDescription: 'Conduct post-installation follow-up and satisfaction survey',
    defaultPriority: 'medium',
    defaultDueDays: 7,
    checklistItems: [
      createChecklistItem('1', 'Schedule Follow-up Visit', 'Arrange visit or call with client', true, 1, 'Appointment scheduled'),
      createChecklistItem('2', 'Conduct Satisfaction Survey', 'Gather feedback on project experience', true, 2, 'Survey completed'),
      createChecklistItem('3', 'Address Outstanding Issues', 'Resolve any remaining concerns from punch list', true, 3, 'All items addressed'),
      createChecklistItem('4', 'Provide Care Instructions', 'Supply maintenance and care documentation', true, 4, 'Care guide provided'),
      createChecklistItem('5', 'Request Testimonial', 'Ask for review or testimonial if appropriate', false, 5, 'Testimonial requested'),
      createChecklistItem('6', 'Document Lessons Learned', 'Record insights for future projects', false, 6, 'Lessons documented'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'client_liaison',
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },

  // Upholstery Specification
  {
    id: 'id_upholstery_spec',
    name: 'Custom Furniture Upholstery Specification',
    description: 'Specify upholstery details for custom furniture',
    category: 'material_sourcing',
    triggerEvents: ['finishes.upholstery_specification_required'],
    defaultTitle: 'Specify Upholstery for {{entityName}}',
    defaultDescription: 'Define fabric, foam, and construction details',
    defaultPriority: 'high',
    defaultDueDays: 4,
    checklistItems: [
      createChecklistItem('1', 'Select Upholstery Fabric', 'Choose appropriate fabric type and grade', true, 1, 'Fabric specified with code'),
      createChecklistItem('2', 'Specify Foam Density', 'Define foam type and density for comfort', true, 2, 'Foam spec documented'),
      createChecklistItem('3', 'Detail Construction Method', 'Specify stitching, tufting, or other details', true, 3, 'Construction notes added'),
      createChecklistItem('4', 'Plan Fabric Layout', 'Consider pattern matching and seam placement', true, 4, 'Fabric layout diagram created'),
      createChecklistItem('5', 'Calculate Fabric Yardage', 'Estimate required fabric quantity with waste', true, 5, 'Yardage calculated'),
      createChecklistItem('6', 'Obtain Client Approval', 'Get client sign-off on upholstery selections', true, 6, 'Client approval documented'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'material_specialist',
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
// INVENTORY TASK TEMPLATES
// ============================================================================

export const INVENTORY_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'inv_stock_low_reorder',
    name: 'Low Stock Reorder Process',
    description: 'Tasks when stock falls below reorder point',
    category: 'reorder',
    triggerEvents: ['stock_low', 'stock_reorder_required'],
    defaultTitle: 'Reorder Stock: {entityName}',
    defaultDescription: 'Stock level is low. Initiate reorder process.',
    defaultPriority: 'high',
    defaultDueDays: 3,
    checklistItems: [
      createChecklistItem('1', 'Verify Current Stock Level', 'Confirm actual stock matches system records', true, 1, 'Physical count matches system'),
      createChecklistItem('2', 'Check Pending Orders', 'Verify no pending orders already placed', true, 2, 'No duplicate orders'),
      createChecklistItem('3', 'Get Supplier Quotes', 'Request quotes from approved suppliers', true, 3, 'Minimum 2 quotes obtained'),
      createChecklistItem('4', 'Create Purchase Order', 'Raise PO for the reorder quantity', true, 4, 'PO number assigned'),
      createChecklistItem('5', 'Confirm Lead Time', 'Verify delivery timeline with supplier', true, 5, 'Expected delivery date recorded'),
      createChecklistItem('6', 'Notify Production', 'Alert production team of potential delay if critical', false, 6, 'Production team informed'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'procurement_officer',
    sourceModule: 'inventory',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'inv_material_received',
    name: 'Material Receiving Process',
    description: 'Tasks when material is received into stock',
    category: 'receiving',
    triggerEvents: ['material_received'],
    defaultTitle: 'Process Received Material: {entityName}',
    defaultDescription: 'New stock received. Complete receiving process.',
    defaultPriority: 'medium',
    defaultDueDays: 1,
    checklistItems: [
      createChecklistItem('1', 'Verify Delivery Against PO', 'Check quantities match purchase order', true, 1, 'Quantities verified'),
      createChecklistItem('2', 'Inspect Quality', 'Inspect materials for damage or defects', true, 2, 'Quality inspection passed'),
      createChecklistItem('3', 'Update Stock Levels', 'Record received quantities in inventory system', true, 3, 'System updated'),
      createChecklistItem('4', 'Store Materials', 'Place materials in designated warehouse location', true, 4, 'Location recorded'),
      createChecklistItem('5', 'Update Cost Records', 'Record actual costs and update average cost', false, 5, 'Cost records updated'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'warehouse_manager',
    sourceModule: 'inventory',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
];

// ============================================================================
// LAUNCH PIPELINE TASK TEMPLATES
// ============================================================================

export const LAUNCH_PIPELINE_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'lp_product_launch_prep',
    name: 'Product Launch Preparation',
    description: 'Tasks when product reaches ready-to-launch stage',
    category: 'launch',
    triggerEvents: ['product_stage_changed'],
    triggerConditions: [
      { field: 'currentState.stage', operator: 'equals', value: 'ready_to_launch' },
    ],
    defaultTitle: 'Prepare Launch: {entityName}',
    defaultDescription: 'Product is ready for launch. Complete launch checklist.',
    defaultPriority: 'high',
    defaultDueDays: 5,
    checklistItems: [
      createChecklistItem('1', 'Final Product Photography', 'Ensure all product images are shot and edited', true, 1, 'Images uploaded to DAM'),
      createChecklistItem('2', 'Product Description Copy', 'Write and approve product descriptions', true, 2, 'Copy approved by marketing'),
      createChecklistItem('3', 'Pricing Finalized', 'Confirm retail and wholesale pricing', true, 3, 'Pricing sheet signed off'),
      createChecklistItem('4', 'Inventory Stocked', 'Verify launch inventory is in warehouse', true, 4, 'Stock count confirmed'),
      createChecklistItem('5', 'Shopify Listing Prepared', 'Create or update Shopify product listing', true, 5, 'Listing in draft state'),
      createChecklistItem('6', 'Marketing Assets Ready', 'Social media and email assets prepared', false, 6, 'Assets reviewed'),
      createChecklistItem('7', 'Launch Date Confirmed', 'Set and communicate launch date', true, 7, 'Date communicated to team'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'product_manager',
    sourceModule: 'launch_pipeline',
    subsidiary: 'finishes',
    isActive: true,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  },
  {
    id: 'lp_product_pricing_review',
    name: 'Product Pricing Review',
    description: 'Tasks when product pricing is significantly updated',
    category: 'pricing',
    triggerEvents: ['product_pricing_updated'],
    defaultTitle: 'Review Pricing Update: {entityName}',
    defaultDescription: 'Product pricing has been updated. Review and ensure consistency.',
    defaultPriority: 'medium',
    defaultDueDays: 3,
    checklistItems: [
      createChecklistItem('1', 'Verify Margin Analysis', 'Check that margins meet minimum thresholds', true, 1, 'Margins above target'),
      createChecklistItem('2', 'Update Sales Channels', 'Sync pricing to all sales channels', true, 2, 'All channels updated'),
      createChecklistItem('3', 'Notify Sales Team', 'Inform sales team of pricing change', true, 3, 'Team notified'),
      createChecklistItem('4', 'Update Marketing Materials', 'Revise any materials showing old pricing', false, 4, 'Materials updated'),
    ],
    assignmentStrategy: 'specific_role',
    assignToRole: 'product_manager',
    sourceModule: 'launch_pipeline',
    subsidiary: 'finishes',
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
  ...INTERIOR_DESIGN_TASK_TEMPLATES,
  ...ADVISORY_TASK_TEMPLATES,
  ...INVENTORY_TASK_TEMPLATES,
  ...LAUNCH_PIPELINE_TASK_TEMPLATES,
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
