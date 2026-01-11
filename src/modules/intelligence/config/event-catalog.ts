/**
 * Event Catalog - DawinOS v2.0
 * Defines all business events, their schemas, and associated actions
 */

import { EventDefinition } from '../types/business-event.types';
import { EVENT_CATEGORIES } from './constants';

// ============================================
// Customer Events
// ============================================

const customerEvents: EventDefinition[] = [
  {
    eventType: 'customer.inquiry_received',
    name: 'Customer Inquiry Received',
    description: 'A potential customer has submitted an inquiry',
    category: EVENT_CATEGORIES.CUSTOMER,
    source: {
      allowedSources: ['integration', 'user', 'system'],
      allowedModules: ['website', 'crm', 'email'],
    },
    schema: {
      required: ['customerName', 'customerEmail', 'inquiryType', 'subject'],
      properties: {
        customerId: { type: 'string', description: 'Existing customer ID if known' },
        customerName: { type: 'string' },
        customerEmail: { type: 'string' },
        customerPhone: { type: 'string' },
        inquiryType: { type: 'string' },
        subject: { type: 'string' },
        message: { type: 'string' },
        source: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'respond_inquiry',
        title: 'Respond to inquiry from {{payload.customerName}}',
        description: 'Review and respond to customer inquiry: {{payload.subject}}',
        priority: 'P1',
        dueInDays: 1,
        assignTo: {
          type: 'role',
          value: 'sales_rep',
          fallback: {
            type: 'department',
            value: 'business-development',
          },
        },
      },
      {
        taskType: 'create_lead',
        title: 'Create lead for {{payload.customerName}}',
        description: 'Add new lead to CRM from inquiry',
        priority: 'P2',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'sales_admin' },
        conditions: [
          { field: 'customerId', operator: 'exists', value: false },
        ],
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [
          { type: 'role', value: 'sales_manager' },
          { type: 'role', value: 'sales_rep' },
        ],
        template: 'new_inquiry',
      },
    ],
    retention: { keepDays: 365, archive: true },
    enabled: true,
  },
  {
    eventType: 'customer.quote_requested',
    name: 'Quote Requested',
    description: 'Customer has requested a quotation',
    category: EVENT_CATEGORIES.CUSTOMER,
    source: {
      allowedSources: ['user', 'integration'],
      allowedModules: ['sales', 'website'],
    },
    schema: {
      required: ['quoteId', 'customerId', 'projectDescription'],
      properties: {
        quoteId: { type: 'string' },
        customerId: { type: 'string' },
        customerName: { type: 'string' },
        projectDescription: { type: 'string' },
        estimatedValue: { type: 'number' },
        deadline: { type: 'string' },
        items: { type: 'array' },
      },
    },
    tasks: [
      {
        taskType: 'prepare_quote',
        title: 'Prepare quote for {{payload.customerName}}',
        description: 'Prepare detailed quotation: {{payload.projectDescription}}',
        priority: 'P1',
        dueInDays: 3,
        assignTo: {
          type: 'role',
          value: 'estimator',
          fallback: { type: 'role', value: 'project_manager' },
        },
      },
      {
        taskType: 'review_quote',
        title: 'Review quote for {{payload.customerName}}',
        description: 'Review and approve quote before sending to customer',
        priority: 'P2',
        dueInDays: 4,
        assignTo: { type: 'role', value: 'sales_manager' },
        conditions: [
          { field: 'estimatedValue', operator: 'gt', value: 10000000 }, // > 10M UGX
        ],
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [{ type: 'role', value: 'estimator' }],
        template: 'quote_request',
      },
    ],
    retention: { keepDays: 730, archive: true },
    enabled: true,
  },
  {
    eventType: 'customer.order_placed',
    name: 'Order Placed',
    description: 'Customer has placed an order',
    category: EVENT_CATEGORIES.CUSTOMER,
    source: {
      allowedSources: ['user', 'integration'],
      allowedModules: ['sales', 'orders'],
    },
    schema: {
      required: ['orderId', 'customerId', 'orderValue', 'items'],
      properties: {
        orderId: { type: 'string' },
        customerId: { type: 'string' },
        customerName: { type: 'string' },
        orderValue: { type: 'number' },
        currency: { type: 'string' },
        items: { type: 'array' },
        deliveryAddress: { type: 'string' },
        deliveryDate: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'confirm_order',
        title: 'Confirm order {{payload.orderId}} with {{payload.customerName}}',
        priority: 'P1',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'order_coordinator' },
      },
      {
        taskType: 'create_invoice',
        title: 'Create invoice for order {{payload.orderId}}',
        priority: 'P1',
        dueInDays: 1,
        assignTo: { type: 'department', value: 'finance' },
      },
      {
        taskType: 'schedule_production',
        title: 'Schedule production for order {{payload.orderId}}',
        priority: 'P1',
        dueInDays: 2,
        assignTo: { type: 'role', value: 'production_planner' },
      },
    ],
    notifications: [
      {
        channels: ['email', 'sms'],
        recipients: [
          { type: 'role', value: 'order_coordinator' },
          { type: 'role', value: 'production_manager' },
        ],
        template: 'new_order',
      },
    ],
    retention: { keepDays: 1095, archive: true },
    enabled: true,
  },
];

// ============================================
// Financial Events
// ============================================

const financialEvents: EventDefinition[] = [
  {
    eventType: 'financial.payment_received',
    name: 'Payment Received',
    description: 'Payment has been received from a customer',
    category: EVENT_CATEGORIES.FINANCIAL,
    source: {
      allowedSources: ['integration', 'user'],
      allowedModules: ['finance', 'banking'],
    },
    schema: {
      required: ['paymentId', 'customerId', 'amount', 'currency'],
      properties: {
        paymentId: { type: 'string' },
        invoiceId: { type: 'string' },
        customerId: { type: 'string' },
        customerName: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        paymentMethod: { type: 'string' },
        reference: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'reconcile_payment',
        title: 'Reconcile payment {{payload.reference}}',
        description: 'Match payment to invoice and update records',
        priority: 'P2',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'accountant' },
      },
      {
        taskType: 'send_receipt',
        title: 'Send receipt to {{payload.customerName}}',
        priority: 'P2',
        dueInDays: 1,
        assignTo: { type: 'department', value: 'finance' },
      },
    ],
    notifications: [
      {
        channels: ['in-app'],
        recipients: [{ type: 'role', value: 'finance_manager' }],
        template: 'payment_received',
      },
    ],
    retention: { keepDays: 2555, archive: true }, // 7 years
    enabled: true,
  },
  {
    eventType: 'financial.invoice_overdue',
    name: 'Invoice Overdue',
    description: 'An invoice has passed its due date without full payment',
    category: EVENT_CATEGORIES.FINANCIAL,
    source: {
      allowedSources: ['system', 'schedule'],
      allowedModules: ['finance'],
    },
    schema: {
      required: ['invoiceId', 'customerId', 'outstandingAmount', 'daysOverdue'],
      properties: {
        invoiceId: { type: 'string' },
        customerId: { type: 'string' },
        customerName: { type: 'string' },
        invoiceAmount: { type: 'number' },
        paidAmount: { type: 'number' },
        outstandingAmount: { type: 'number' },
        currency: { type: 'string' },
        dueDate: { type: 'string' },
        daysOverdue: { type: 'number' },
        previousReminders: { type: 'number' },
      },
    },
    tasks: [
      {
        taskType: 'send_reminder',
        title: 'Send payment reminder to {{payload.customerName}}',
        description: 'Invoice {{payload.invoiceId}} is {{payload.daysOverdue}} days overdue',
        priority: 'P1',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'credit_controller' },
        conditions: [
          { field: 'daysOverdue', operator: 'lte', value: 30 },
        ],
      },
      {
        taskType: 'escalate_debt',
        title: 'Escalate overdue account: {{payload.customerName}}',
        description: 'Invoice {{payload.invoiceId}} is {{payload.daysOverdue}} days overdue - escalate',
        priority: 'P0',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'finance_manager' },
        conditions: [
          { field: 'daysOverdue', operator: 'gt', value: 30 },
        ],
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [
          { type: 'role', value: 'credit_controller' },
          { type: 'role', value: 'finance_manager' },
        ],
        template: 'invoice_overdue',
      },
    ],
    retention: { keepDays: 2555, archive: true },
    enabled: true,
  },
  {
    eventType: 'financial.budget_exceeded',
    name: 'Budget Exceeded',
    description: 'A budget threshold has been exceeded',
    category: EVENT_CATEGORIES.FINANCIAL,
    source: {
      allowedSources: ['system'],
      allowedModules: ['finance'],
    },
    schema: {
      required: ['budgetId', 'budgetAmount', 'spentAmount', 'departmentId'],
      properties: {
        budgetId: { type: 'string' },
        budgetName: { type: 'string' },
        budgetAmount: { type: 'number' },
        spentAmount: { type: 'number' },
        exceededBy: { type: 'number' },
        exceededByPercent: { type: 'number' },
        currency: { type: 'string' },
        period: { type: 'string' },
        departmentId: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'review_budget_variance',
        title: 'Review budget variance: {{payload.budgetName}}',
        description: 'Budget exceeded by {{payload.exceededByPercent}}%',
        priority: 'P1',
        dueInDays: 2,
        assignTo: { type: 'role', value: 'department_head' },
      },
      {
        taskType: 'approve_budget_increase',
        title: 'Approve budget increase for {{payload.budgetName}}',
        priority: 'P1',
        dueInDays: 3,
        assignTo: { type: 'role', value: 'finance_manager' },
        conditions: [
          { field: 'exceededByPercent', operator: 'gt', value: 10 },
        ],
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app', 'push'],
        recipients: [
          { type: 'role', value: 'finance_manager' },
          { type: 'department' },
        ],
        template: 'budget_exceeded',
      },
    ],
    retention: { keepDays: 1825, archive: true },
    enabled: true,
  },
];

// ============================================
// HR Events
// ============================================

const hrEvents: EventDefinition[] = [
  {
    eventType: 'hr.leave_requested',
    name: 'Leave Requested',
    description: 'An employee has requested leave',
    category: EVENT_CATEGORIES.HR,
    source: {
      allowedSources: ['user'],
      allowedModules: ['hr'],
    },
    schema: {
      required: ['requestId', 'employeeId', 'leaveType', 'startDate', 'endDate', 'days'],
      properties: {
        requestId: { type: 'string' },
        employeeId: { type: 'string' },
        employeeName: { type: 'string' },
        leaveType: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        days: { type: 'number' },
        reason: { type: 'string' },
        managerId: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'approve_leave',
        title: 'Approve leave request from {{payload.employeeName}}',
        description: '{{payload.days}} days {{payload.leaveType}} from {{payload.startDate}}',
        priority: 'P2',
        dueInDays: 2,
        assignTo: { type: 'manager' },
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [{ type: 'manager' }],
        template: 'leave_request',
      },
    ],
    retention: { keepDays: 730, archive: true },
    enabled: true,
  },
  {
    eventType: 'hr.contract_expiring',
    name: 'Contract Expiring',
    description: 'An employment contract is approaching expiry',
    category: EVENT_CATEGORIES.HR,
    source: {
      allowedSources: ['system', 'schedule'],
      allowedModules: ['hr'],
    },
    schema: {
      required: ['contractId', 'employeeId', 'expiryDate', 'daysUntilExpiry'],
      properties: {
        contractId: { type: 'string' },
        employeeId: { type: 'string' },
        employeeName: { type: 'string' },
        contractType: { type: 'string' },
        expiryDate: { type: 'string' },
        daysUntilExpiry: { type: 'number' },
        managerId: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'review_contract_renewal',
        title: 'Review contract renewal for {{payload.employeeName}}',
        description: 'Contract expires in {{payload.daysUntilExpiry}} days',
        priority: 'P1',
        dueInDays: 7,
        assignTo: { type: 'manager' },
        conditions: [
          { field: 'daysUntilExpiry', operator: 'lte', value: 30 },
        ],
      },
      {
        taskType: 'prepare_renewal',
        title: 'Prepare contract renewal for {{payload.employeeName}}',
        priority: 'P2',
        dueInDays: 14,
        assignTo: { type: 'role', value: 'hr_manager' },
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [
          { type: 'manager' },
          { type: 'role', value: 'hr_manager' },
        ],
        template: 'contract_expiring',
      },
    ],
    retention: { keepDays: 365, archive: true },
    enabled: true,
  },
  {
    eventType: 'hr.performance_review_due',
    name: 'Performance Review Due',
    description: 'A performance review is due for an employee',
    category: EVENT_CATEGORIES.HR,
    source: {
      allowedSources: ['system', 'schedule'],
      allowedModules: ['hr'],
    },
    schema: {
      required: ['employeeId', 'reviewType', 'dueDate', 'reviewerId'],
      properties: {
        employeeId: { type: 'string' },
        employeeName: { type: 'string' },
        reviewType: { type: 'string' },
        dueDate: { type: 'string' },
        lastReviewDate: { type: 'string' },
        reviewerId: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'conduct_review',
        title: 'Conduct {{payload.reviewType}} review for {{payload.employeeName}}',
        priority: 'P2',
        dueInDays: 7,
        assignTo: { type: 'user', value: '{{payload.reviewerId}}' },
      },
      {
        taskType: 'self_assessment',
        title: 'Complete self-assessment for {{payload.reviewType}} review',
        priority: 'P2',
        dueInDays: 5,
        assignTo: { type: 'user', value: '{{payload.employeeId}}' },
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [
          { type: 'user', value: 'reviewerId' },
          { type: 'user', value: 'employeeId' },
        ],
        template: 'performance_review_due',
      },
    ],
    retention: { keepDays: 365, archive: true },
    enabled: true,
  },
];

// ============================================
// Production Events (Finishes)
// ============================================

const productionEvents: EventDefinition[] = [
  {
    eventType: 'production.job_started',
    name: 'Job Started',
    description: 'Production job has been initiated',
    category: EVENT_CATEGORIES.PRODUCTION,
    source: {
      allowedSources: ['user'],
      allowedModules: ['production', 'projects'],
    },
    schema: {
      required: ['jobId', 'projectId', 'startDate'],
      properties: {
        jobId: { type: 'string' },
        projectId: { type: 'string' },
        projectName: { type: 'string' },
        customerId: { type: 'string' },
        startDate: { type: 'string' },
        estimatedEndDate: { type: 'string' },
        assignedTeam: { type: 'array' },
        materials: { type: 'array' },
      },
    },
    tasks: [
      {
        taskType: 'verify_materials',
        title: 'Verify materials for {{payload.projectName}}',
        priority: 'P1',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'store_manager' },
      },
      {
        taskType: 'update_customer',
        title: 'Notify customer of job start: {{payload.projectName}}',
        priority: 'P2',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'project_coordinator' },
      },
    ],
    notifications: [
      {
        channels: ['in-app', 'push'],
        recipients: [{ type: 'role', value: 'production_manager' }],
        template: 'job_started',
      },
    ],
    retention: { keepDays: 365, archive: true },
    enabled: true,
  },
  {
    eventType: 'production.milestone_reached',
    name: 'Milestone Reached',
    description: 'A project milestone has been completed',
    category: EVENT_CATEGORIES.PRODUCTION,
    source: {
      allowedSources: ['user', 'system'],
      allowedModules: ['production', 'projects'],
    },
    schema: {
      required: ['projectId', 'milestoneId', 'milestoneName', 'completedAt'],
      properties: {
        projectId: { type: 'string' },
        projectName: { type: 'string' },
        milestoneId: { type: 'string' },
        milestoneName: { type: 'string' },
        completedAt: { type: 'string' },
        completedBy: { type: 'string' },
        nextMilestone: { type: 'object' },
      },
    },
    tasks: [
      {
        taskType: 'update_customer_milestone',
        title: 'Update customer on milestone: {{payload.milestoneName}}',
        priority: 'P2',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'project_coordinator' },
      },
    ],
    notifications: [
      {
        channels: ['in-app'],
        recipients: [
          { type: 'role', value: 'project_manager' },
          { type: 'creator' },
        ],
        template: 'milestone_reached',
      },
    ],
    retention: { keepDays: 365, archive: true },
    enabled: true,
  },
  {
    eventType: 'production.quality_issue',
    name: 'Quality Issue Detected',
    description: 'A quality issue has been identified during production',
    category: EVENT_CATEGORIES.PRODUCTION,
    source: {
      allowedSources: ['user'],
      allowedModules: ['production', 'quality'],
    },
    schema: {
      required: ['issueId', 'projectId', 'issueType', 'severity', 'description'],
      properties: {
        issueId: { type: 'string' },
        projectId: { type: 'string' },
        projectName: { type: 'string' },
        issueType: { type: 'string' },
        severity: { type: 'string' },
        description: { type: 'string' },
        detectedBy: { type: 'string' },
        location: { type: 'string' },
        photos: { type: 'array' },
      },
    },
    tasks: [
      {
        taskType: 'investigate_issue',
        title: 'Investigate quality issue on {{payload.projectName}}',
        description: '{{payload.severity}} {{payload.issueType}}: {{payload.description}}',
        priority: 'P0',
        dueInDays: 1,
        assignTo: { type: 'role', value: 'quality_manager' },
        conditions: [
          { field: 'severity', operator: 'in', value: ['critical', 'major'] },
        ],
      },
      {
        taskType: 'resolve_issue',
        title: 'Resolve quality issue on {{payload.projectName}}',
        priority: 'P1',
        dueInDays: 2,
        assignTo: { type: 'role', value: 'production_supervisor' },
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app', 'push'],
        recipients: [
          { type: 'role', value: 'quality_manager' },
          { type: 'role', value: 'production_manager' },
        ],
        template: 'quality_issue',
      },
    ],
    retention: { keepDays: 1095, archive: true },
    enabled: true,
  },
];

// ============================================
// Strategic Events
// ============================================

const strategicEvents: EventDefinition[] = [
  {
    eventType: 'strategic.market_change',
    name: 'Market Change Detected',
    description: 'A significant market change has been identified',
    category: EVENT_CATEGORIES.STRATEGIC,
    source: {
      allowedSources: ['user', 'integration', 'system'],
      allowedModules: ['strategy', 'market_intelligence'],
    },
    schema: {
      required: ['changeId', 'changeType', 'title', 'impact'],
      properties: {
        changeId: { type: 'string' },
        changeType: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        impact: { type: 'string' },
        affectedSubsidiaries: { type: 'array' },
        sourceUrl: { type: 'string' },
        detectedAt: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'analyze_impact',
        title: 'Analyze impact of: {{payload.title}}',
        description: '{{payload.description}}',
        priority: 'P1',
        dueInDays: 3,
        assignTo: { type: 'role', value: 'strategy_analyst' },
      },
      {
        taskType: 'executive_briefing',
        title: 'Prepare executive briefing on {{payload.title}}',
        priority: 'P1',
        dueInDays: 5,
        assignTo: { type: 'role', value: 'strategy_manager' },
        conditions: [
          { field: 'impact', operator: 'in', value: ['high', 'critical'] },
        ],
      },
    ],
    notifications: [
      {
        channels: ['email', 'in-app'],
        recipients: [{ type: 'role', value: 'executive' }],
        template: 'market_change',
        conditions: [
          { field: 'impact', operator: 'in', value: ['high', 'critical'] },
        ],
      },
    ],
    retention: { keepDays: 1825, archive: true },
    enabled: true,
  },
  {
    eventType: 'strategic.opportunity_identified',
    name: 'Opportunity Identified',
    description: 'A strategic opportunity has been identified',
    category: EVENT_CATEGORIES.STRATEGIC,
    source: {
      allowedSources: ['user'],
      allowedModules: ['strategy', 'opportunities'],
    },
    schema: {
      required: ['opportunityId', 'opportunityType', 'title', 'description'],
      properties: {
        opportunityId: { type: 'string' },
        opportunityType: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        estimatedValue: { type: 'number' },
        currency: { type: 'string' },
        probability: { type: 'number' },
        source: { type: 'string' },
        expiryDate: { type: 'string' },
      },
    },
    tasks: [
      {
        taskType: 'evaluate_opportunity',
        title: 'Evaluate opportunity: {{payload.title}}',
        priority: 'P2',
        dueInDays: 7,
        assignTo: { type: 'role', value: 'strategy_manager' },
      },
    ],
    notifications: [
      {
        channels: ['in-app'],
        recipients: [{ type: 'role', value: 'executive' }],
        template: 'opportunity_identified',
      },
    ],
    retention: { keepDays: 730, archive: true },
    enabled: true,
  },
];

// ============================================
// Export Complete Catalog
// ============================================

export const EVENT_CATALOG: EventDefinition[] = [
  ...customerEvents,
  ...financialEvents,
  ...hrEvents,
  ...productionEvents,
  ...strategicEvents,
];

/**
 * Get event definition by type
 */
export function getEventDefinition(eventType: string): EventDefinition | undefined {
  return EVENT_CATALOG.find(e => e.eventType === eventType);
}

/**
 * Get all event definitions for a category
 */
export function getEventsByCategory(category: string): EventDefinition[] {
  return EVENT_CATALOG.filter(e => e.category === category);
}

/**
 * Get all enabled event types
 */
export function getEnabledEventTypes(): string[] {
  return EVENT_CATALOG.filter(e => e.enabled).map(e => e.eventType);
}

/**
 * Validate event payload against schema
 */
export function validateEventPayload(
  eventType: string,
  payload: Record<string, any>
): { valid: boolean; errors: string[] } {
  const definition = getEventDefinition(eventType);
  if (!definition) {
    return { valid: false, errors: [`Unknown event type: ${eventType}`] };
  }

  const errors: string[] = [];
  
  // Check required fields
  for (const field of definition.schema.required) {
    if (!(field in payload) || payload[field] === undefined || payload[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
