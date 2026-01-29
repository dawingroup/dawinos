/**
 * Task Generation Trigger - DawinOS v2.0
 * Cloud Function to process business events and generate tasks
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Collections — unified with frontend (top-level collections)
const COLLECTIONS = {
  BUSINESS_EVENTS: 'businessEvents',
  GENERATED_TASKS: 'generatedTasks',
  EMPLOYEES: 'employees',
  DEPARTMENTS: 'departments',
  USER_NOTIFICATIONS: 'user_notifications',
};

// Default configuration
const DEFAULT_ENGINE_CONFIG = {
  overdueEscalationHours: {
    critical: 1,
    high: 4,
    medium: 12,
    low: 48,
  },
  reminderBeforeDeadline: [24, 4, 1],
  slaHours: {
    critical: 4,
    high: 8,
    medium: 24,
    low: 72,
  },
};

// ============================================
// Design Manager Task Rules
// Maps event types to task generation rules
// ============================================

const EVENT_TASK_RULES = {
  // --------------------------------------------------
  // Design Item Events
  // --------------------------------------------------
  design_item_created: [
    {
      title: 'Review new design item: {{entityName}}',
      description: 'A new design item has been created and needs initial review.',
      defaultPriority: 'medium',
      assignToRole: 'design-manager',
      checklist: ['Review design brief', 'Verify category and specifications', 'Set initial RAG status', 'Assign to designer'],
    },
  ],
  design_item_stage_changed: [
    {
      title: 'Process stage transition for: {{entityName}}',
      description: 'Design item has moved to a new stage. Review stage gate requirements.',
      defaultPriority: 'high',
      assignToRole: 'designer',
      checklist: ['Verify previous stage deliverables', 'Review stage gate criteria', 'Update documentation', 'Notify stakeholders'],
    },
  ],
  design_item_approval_requested: [
    {
      title: 'Approval required: {{entityName}}',
      description: 'A design item requires approval to proceed.',
      defaultPriority: 'high',
      assignToRole: 'design-manager',
      checklist: ['Review design documentation', 'Check quality standards', 'Verify completeness', 'Provide approval decision'],
    },
  ],
  design_item_approved: [
    {
      title: 'Process approved design: {{entityName}}',
      description: 'Design item has been approved. Proceed with next steps.',
      defaultPriority: 'medium',
      assignToRole: 'production-planner',
      checklist: ['Update project status', 'Initiate next phase', 'Notify team'],
    },
  ],
  design_item_rejected: [
    {
      title: 'Address rejection for: {{entityName}}',
      description: 'Design item was rejected and needs revision.',
      defaultPriority: 'high',
      assignToRole: 'designer',
      checklist: ['Review rejection feedback', 'Identify required changes', 'Update design', 'Resubmit for approval'],
    },
  ],
  design_item_rag_updated: [
    {
      title: 'Critical RAG status: {{entityName}}',
      description: 'A design item has a critical (red) RAG status that needs attention.',
      defaultPriority: 'critical',
      assignToRole: 'design-manager',
      checklist: ['Identify root cause', 'Develop mitigation plan', 'Update stakeholders', 'Resolve blockers'],
    },
  ],

  // --------------------------------------------------
  // Design Project Events
  // --------------------------------------------------
  design_project_created: [
    {
      title: 'Set up new design project: {{entityName}}',
      description: 'A new design project has been created. Complete initial project setup.',
      defaultPriority: 'high',
      assignToRole: 'project-manager',
      checklist: ['Review project scope', 'Assign project team', 'Set milestones and deadlines', 'Create initial design items'],
    },
    {
      title: 'Prepare project brief for: {{entityName}}',
      description: 'Compile the project brief and share with the design team.',
      defaultPriority: 'medium',
      assignToRole: 'designer',
      checklist: ['Gather client requirements', 'Document design preferences', 'Identify material constraints', 'Share brief with team'],
    },
  ],

  // --------------------------------------------------
  // Project Brief Events
  // --------------------------------------------------
  project_brief_received: [
    {
      title: 'Review project brief: {{entityName}}',
      description: 'A new project brief has been received. Review requirements and prepare project plan.',
      defaultPriority: 'high',
      assignToRole: 'design-manager',
      checklist: ['Review client brief document', 'Assess feasibility and scope', 'Identify key deliverables', 'Prepare initial estimate'],
    },
    {
      title: 'Schedule client consultation for: {{entityName}}',
      description: 'Arrange an initial consultation meeting with the client to discuss their requirements.',
      defaultPriority: 'medium',
      assignToRole: 'client-liaison',
      checklist: ['Contact client for scheduling', 'Prepare consultation agenda', 'Book meeting room or video call', 'Send calendar invite'],
    },
    {
      title: 'Site assessment for: {{entityName}}',
      description: 'Conduct a site visit or assessment for the new project.',
      defaultPriority: 'medium',
      assignToRole: 'space-planner',
      checklist: ['Schedule site visit', 'Take measurements', 'Document existing conditions', 'Note access constraints'],
    },
  ],

  // --------------------------------------------------
  // Finishes Module Events (from generateDesignManagerEvents)
  // --------------------------------------------------
  'finishes.client_consultation_scheduled': [
    {
      title: 'Prepare for client consultation: {{entityName}}',
      description: 'A client consultation has been scheduled. Prepare materials and agenda.',
      defaultPriority: 'high',
      assignToRole: 'designer',
      checklist: ['Review client history', 'Prepare design options', 'Gather material samples', 'Prepare presentation'],
    },
    {
      title: 'Coordinate consultation logistics: {{entityName}}',
      description: 'Ensure all logistics are in place for the client consultation.',
      defaultPriority: 'medium',
      assignToRole: 'client-liaison',
      checklist: ['Confirm client attendance', 'Prepare meeting space', 'Arrange material samples', 'Brief design team'],
    },
  ],
  'finishes.space_planning_requested': [
    {
      title: 'Complete space planning analysis: {{entityName}}',
      description: 'Space planning has been requested. Conduct analysis and prepare layout options.',
      defaultPriority: 'high',
      assignToRole: 'space-planner',
      checklist: ['Review site measurements', 'Create layout options', 'Assess structural constraints', 'Prepare space plan deliverable'],
    },
  ],
  'finishes.design_concepts_created': [
    {
      title: 'Review design concepts: {{entityName}}',
      description: 'New design concepts are ready for internal review before client presentation.',
      defaultPriority: 'high',
      assignToRole: 'design-manager',
      checklist: ['Review design quality', 'Check brand alignment', 'Verify material feasibility', 'Approve for client presentation'],
    },
  ],
  'finishes.design_approval_requested': [
    {
      title: 'Process design approval: {{entityName}}',
      description: 'Design requires approval from stakeholders to proceed.',
      defaultPriority: 'high',
      assignToRole: 'design-manager',
      checklist: ['Review final design', 'Check compliance with brief', 'Verify cost estimates', 'Provide approval or feedback'],
    },
  ],
  'finishes.client_feedback_received': [
    {
      title: 'Process client feedback: {{entityName}}',
      description: 'Client feedback has been received and needs to be reviewed and actioned.',
      defaultPriority: 'high',
      assignToRole: 'designer',
      checklist: ['Review client comments', 'Identify required revisions', 'Update design accordingly', 'Schedule follow-up with client'],
    },
  ],
  'finishes.design_production_ready': [
    {
      title: 'Prepare production package: {{entityName}}',
      description: 'Design is approved and ready for production. Prepare manufacturing documentation.',
      defaultPriority: 'critical',
      assignToRole: 'production-planner',
      checklist: ['Finalize technical drawings', 'Generate cutlists', 'Verify material availability', 'Schedule production slot'],
    },
    {
      title: 'Procure materials for: {{entityName}}',
      description: 'Order required materials for the production phase.',
      defaultPriority: 'high',
      assignToRole: 'procurement-coordinator',
      checklist: ['Review bill of materials', 'Check stock availability', 'Place purchase orders', 'Confirm delivery dates'],
    },
  ],
  'finishes.installation_scheduled': [
    {
      title: 'Coordinate installation: {{entityName}}',
      description: 'Installation has been scheduled. Prepare team and logistics.',
      defaultPriority: 'high',
      assignToRole: 'installation-coordinator',
      checklist: ['Confirm installation date with client', 'Assign installation crew', 'Arrange transport', 'Prepare installation checklist'],
    },
  ],
  'finishes.installation_complete': [
    {
      title: 'Post-installation review: {{entityName}}',
      description: 'Installation is complete. Conduct final inspection and close project.',
      defaultPriority: 'medium',
      assignToRole: 'quality-inspector',
      checklist: ['Conduct final inspection', 'Document completion photos', 'Get client sign-off', 'Close project in system'],
    },
  ],

  // --------------------------------------------------
  // HR Events
  // --------------------------------------------------
  'hr.employee.created': [
    {
      title: 'Onboard new employee: {{entityName}}',
      description: 'A new employee has been added to the system. Complete onboarding process.',
      defaultPriority: 'high',
      assignToRole: 'hr-manager',
      checklist: ['Prepare workstation', 'Set up system access', 'Schedule orientation', 'Assign mentor or buddy'],
    },
    {
      title: 'Set up role profile for: {{entityName}}',
      description: 'Configure the new employee role profile, task capabilities, and workload settings.',
      defaultPriority: 'medium',
      assignToRole: 'hr-manager',
      checklist: ['Assign role profile', 'Set workload capacity', 'Configure task capabilities', 'Add to department'],
    },
  ],
  'hr.employee.updated': [
    {
      title: 'Review employee update: {{entityName}}',
      description: 'Employee record has been updated. Review changes and take any required action.',
      defaultPriority: 'low',
      assignToRole: 'hr-manager',
      checklist: ['Review changes made', 'Verify data accuracy', 'Update related records if needed'],
    },
  ],
};

/**
 * Get task rules for a given event type
 */
function getTaskRulesForEvent(eventType) {
  return EVENT_TASK_RULES[eventType] || [];
}

/**
 * Interpolate template variables in task title
 */
function interpolateTitle(template, eventData) {
  return template
    .replace('{{entityName}}', eventData.entityName || eventData.payload?.entityName || 'Unknown')
    .replace('{{projectName}}', eventData.projectName || eventData.payload?.projectName || '')
    .replace('{{eventType}}', eventData.eventType || '');
}

/**
 * Find the best available employee for a role based on workload
 * Returns { assigneeId, assigneeName, assigneeEmail } or null
 */
async function findBestEmployeeForRole(roleSlug) {
  if (!roleSlug) return null;

  try {
    // Query employees with matching role profile
    const snapshot = await db
      .collection(COLLECTIONS.EMPLOYEES)
      .where('employmentStatus', 'in', ['active', 'probation'])
      .limit(50)
      .get();

    if (snapshot.empty) return null;

    // Filter by role and rank by workload
    const candidates = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const empRole = data.roleProfileId || data.position?.roleProfileId || '';

      // Match by systemAccess.accessRoles array (primary match)
      const accessRoles = data.systemAccess?.accessRoles || [];
      const accessRoleMatch = accessRoles.includes(roleSlug);

      // Match by roleProfileId
      const roleProfileMatch = empRole === roleSlug;

      // Match by position title (case-insensitive slug comparison)
      const titleMatch = (data.position?.title || '')
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .includes(roleSlug.toLowerCase());

      if (accessRoleMatch || roleProfileMatch || titleMatch) {
        const activeTaskCount = data.workload?.activeTaskCount ?? 0;
        const maxConcurrent = data.workload?.maxConcurrent ?? 40;
        const utilization = maxConcurrent > 0
          ? Math.round((activeTaskCount / maxConcurrent) * 100)
          : 100;

        candidates.push({
          id: doc.id,
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
          email: data.email || '',
          activeTaskCount,
          maxConcurrent,
          utilization,
        });
      }
    }

    if (candidates.length === 0) return null;

    // Sort by utilization (lowest first), then by active task count
    candidates.sort((a, b) => {
      if (a.utilization !== b.utilization) return a.utilization - b.utilization;
      return a.activeTaskCount - b.activeTaskCount;
    });

    const best = candidates[0];
    return {
      assigneeId: best.id,
      assigneeName: best.name,
      assigneeEmail: best.email,
    };
  } catch (err) {
    logger.warn('Employee lookup failed, task will be unassigned', {
      roleSlug,
      error: err.message,
    });
    return null;
  }
}

/**
 * Calculate due date based on priority
 */
function calculateDueDate(priority) {
  const hours = DEFAULT_ENGINE_CONFIG.slaHours[priority] || 24;
  const dueDate = new Date();
  // Add hours, skipping weekends
  let hoursLeft = hours;
  while (hoursLeft > 0) {
    dueDate.setHours(dueDate.getHours() + 1);
    const day = dueDate.getDay();
    if (day !== 0 && day !== 6) { // Skip weekends
      hoursLeft--;
    }
  }
  return admin.firestore.Timestamp.fromDate(dueDate);
}

/**
 * Trigger: Process new business events
 */
const onBusinessEventCreated = onDocumentCreated(
  {
    document: 'businessEvents/{eventId}',
    region: 'europe-west1',
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('No data in event snapshot');
      return null;
    }

    const eventData = { id: event.params.eventId, ...snapshot.data() };

    logger.info('Processing business event', {
      eventId: eventData.id,
      eventType: eventData.eventType,
      subsidiaryId: eventData.metadata?.subsidiaryId,
    });

    try {
      // Idempotency check: use transaction to atomically claim this event
      const eventRef = snapshot.ref;
      const shouldProcess = await db.runTransaction(async (transaction) => {
        const freshDoc = await transaction.get(eventRef);
        const freshData = freshDoc.data();
        const currentStatus = freshData?.processing?.status;

        if (currentStatus === 'processing' || currentStatus === 'processed') {
          logger.info('Event already processed or in progress, skipping', {
            eventId: eventData.id,
            status: currentStatus,
          });
          return false;
        }

        transaction.update(eventRef, {
          'processing.status': 'processing',
          'processing.processedAt': admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return true;
      });

      if (!shouldProcess) return null;

      // Generate tasks from event
      const eventType = eventData.eventType;
      const taskRules = getTaskRulesForEvent(eventType);
      const generatedTaskIds = [];

      for (const rule of taskRules) {
        // Resolve assignee based on role and workload
        const assignee = rule.assignToRole
          ? await findBestEmployeeForRole(rule.assignToRole)
          : null;

        const priority = eventData.metadata?.priority || rule.defaultPriority || 'medium';

        const taskDoc = await db.collection(COLLECTIONS.GENERATED_TASKS).add({
          title: interpolateTitle(rule.title, eventData),
          description: rule.description || '',
          priority,
          status: 'pending',
          stage: assignee ? 'assigned' : 'pending_assignment',
          sourceEventId: eventData.id,
          sourceEventType: eventType,
          sourceModule: eventData.sourceModule || 'unknown',
          subsidiary: eventData.subsidiary || eventData.context?.subsidiary || 'finishes',
          entityType: eventData.entityType || eventData.context?.entityType || 'unknown',
          entityId: eventData.entityId || eventData.context?.entityId || null,
          entityName: eventData.entityName || eventData.context?.projectName || null,
          projectId: eventData.projectId || eventData.context?.projectId || null,
          projectName: eventData.projectName || eventData.context?.projectName || null,
          assignedTo: assignee?.assigneeId || null,
          assignedToName: assignee?.assigneeName || null,
          assignment: assignee ? {
            assigneeId: assignee.assigneeId,
            assigneeRef: {
              id: assignee.assigneeId,
              name: assignee.assigneeName,
              email: assignee.assigneeEmail,
            },
            assignedAt: admin.firestore.FieldValue.serverTimestamp(),
            assignedBy: 'system',
            assignmentMethod: 'workload_based',
            assignedRole: rule.assignToRole,
          } : null,
          dueDate: calculateDueDate(priority),
          checklistItems: (rule.checklist || []).map((text) => ({
            text,
            completed: false,
          })),
          checklistProgress: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        generatedTaskIds.push(taskDoc.id);

        logger.info('Task created', {
          taskId: taskDoc.id,
          title: rule.title,
          assignedTo: assignee?.assigneeName || 'unassigned',
          role: rule.assignToRole || 'none',
        });
      }

      // Mark event as processed with generated task IDs
      await snapshot.ref.update({
        'processing.status': 'processed',
        'processing.tasksGenerated': generatedTaskIds.length,
        'processing.generatedTaskIds': generatedTaskIds,
        'processing.completedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info('Event processed and tasks generated', {
        eventId: eventData.id,
        tasksGenerated: generatedTaskIds.length,
      });

      return { eventId: eventData.id, status: 'processed', tasksGenerated: generatedTaskIds.length };
    } catch (error) {
      logger.error('Event processing failed', {
        eventId: eventData.id,
        error: error.message,
      });

      await snapshot.ref.update({
        'processing.status': 'failed',
        'processing.errorMessage': error.message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      throw error;
    }
  }
);

/**
 * Scheduled: Process overdue task escalations
 * Runs every 30 minutes
 */
const processOverdueEscalations = onSchedule(
  {
    schedule: 'every 30 minutes',
    timeZone: 'Africa/Kampala',
    region: 'europe-west1',
  },
  async (event) => {
    logger.info('Starting overdue task escalation check');

    const now = admin.firestore.Timestamp.now();

    // Get overdue tasks
    const overdueSnapshot = await db
      .collection(COLLECTIONS.GENERATED_TASKS)
      .where('status', 'in', ['pending', 'in-progress'])
      .where('dueDate', '<', now)
      .where('stage', '!=', 'escalated')
      .get();

    if (overdueSnapshot.empty) {
      logger.info('No overdue tasks to escalate');
      return null;
    }

    const batch = db.batch();
    let escalatedCount = 0;

    for (const doc of overdueSnapshot.docs) {
      const task = doc.data();

      // Idempotency guard: skip already-escalated tasks
      if (task.escalatedAt) continue;

      // Check escalation threshold based on priority
      const overdueHours =
        (now.toMillis() - task.dueDate.toMillis()) / (1000 * 60 * 60);
      const threshold =
        DEFAULT_ENGINE_CONFIG.overdueEscalationHours[task.priority] || 12;

      if (overdueHours >= threshold) {
        // Mark for escalation with idempotency timestamp
        batch.update(doc.ref, {
          stage: 'escalated',
          priority: escalatePriority(task.priority),
          escalatedAt: now,
          escalations: admin.firestore.FieldValue.arrayUnion({
            escalatedAt: now,
            escalatedBy: 'system',
            reason: 'overdue',
            notes: `Task overdue by ${Math.round(overdueHours)} hours`,
          }),
          updatedAt: now,
        });

        escalatedCount++;
      }
    }

    if (escalatedCount > 0) {
      await batch.commit();
    }

    logger.info('Escalation check complete', {
      checked: overdueSnapshot.size,
      escalated: escalatedCount,
    });

    return { escalated: escalatedCount };
  }
);

/**
 * Scheduled: Send task reminders
 * Runs every hour
 */
const sendTaskReminders = onSchedule(
  {
    schedule: 'every 1 hours',
    timeZone: 'Africa/Kampala',
    region: 'europe-west1',
  },
  async (event) => {
    logger.info('Starting task reminder check');

    const now = admin.firestore.Timestamp.now();
    const reminderThresholds = DEFAULT_ENGINE_CONFIG.reminderBeforeDeadline;

    // Calculate time windows for reminders
    const windows = reminderThresholds.map((hours) => ({
      hours,
      start: new Date(now.toMillis() + (hours - 0.5) * 60 * 60 * 1000),
      end: new Date(now.toMillis() + (hours + 0.5) * 60 * 60 * 1000),
    }));

    let remindersSent = 0;

    for (const window of windows) {
      const snapshot = await db
        .collection(COLLECTIONS.GENERATED_TASKS)
        .where('status', 'in', ['pending', 'in-progress'])
        .where('dueDate', '>=', admin.firestore.Timestamp.fromDate(window.start))
        .where('dueDate', '<=', admin.firestore.Timestamp.fromDate(window.end))
        .get();

      for (const doc of snapshot.docs) {
        const task = doc.data();

        // Check if reminder already sent for this threshold
        const reminderKey = `reminder_${window.hours}h`;
        if (task[reminderKey]) continue;

        // Send reminder notification + mark as sent atomically
        if (task.assignment?.assigneeId) {
          const reminderBatch = db.batch();

          const notifRef = db.collection(COLLECTIONS.USER_NOTIFICATIONS).doc();
          reminderBatch.set(notifRef, {
            type: 'task_reminder',
            recipientId: task.assignment.assigneeId,
            title: 'Task Due Soon',
            body: `"${task.title}" is due in ${window.hours} hour${
              window.hours > 1 ? 's' : ''
            }`,
            data: {
              taskId: doc.id,
              dueDate: task.dueDate.toDate().toISOString(),
            },
            channels: ['push'],
            createdAt: now,
            read: false,
          });

          reminderBatch.update(doc.ref, {
            [reminderKey]: now,
            lastReminderAt: now,
            updatedAt: now,
          });

          await reminderBatch.commit();
          remindersSent++;
        }
      }
    }

    logger.info('Reminder check complete', {
      remindersSent,
    });

    return { remindersSent };
  }
);

/**
 * Scheduled: Retry unassigned tasks
 * Runs every 2 hours
 */
const retryUnassignedTasks = onSchedule(
  {
    schedule: 'every 2 hours',
    timeZone: 'Africa/Kampala',
    region: 'europe-west1',
  },
  async (event) => {
    logger.info('Retrying unassigned task assignments');

    const now = admin.firestore.Timestamp.now();
    const twoHoursAgo = new Date(now.toMillis() - 2 * 60 * 60 * 1000);

    // Get tasks that have been unassigned for at least 2 hours
    const snapshot = await db
      .collection(COLLECTIONS.GENERATED_TASKS)
      .where('stage', '==', 'pending_assignment')
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(twoHoursAgo))
      .limit(50)
      .get();

    if (snapshot.empty) {
      logger.info('No unassigned tasks to retry');
      return null;
    }

    let assigned = 0;
    let failed = 0;

    for (const doc of snapshot.docs) {
      const task = doc.data();

      // Try to find a fallback assignee (department manager)
      if (task.departmentId) {
        const deptSnapshot = await db
          .collection(COLLECTIONS.DEPARTMENTS)
          .doc(task.departmentId)
          .get();

        if (deptSnapshot.exists) {
          const dept = deptSnapshot.data();
          const managerId = dept?.managerId;

          if (managerId) {
            const managerSnapshot = await db
              .collection(COLLECTIONS.EMPLOYEES)
              .doc(managerId)
              .get();

            if (managerSnapshot.exists) {
              const manager = managerSnapshot.data();

              await doc.ref.update({
                stage: 'assigned',
                status: 'pending',
                assignment: {
                  assigneeId: managerId,
                  assigneeRef: {
                    id: managerId,
                    name: `${manager?.firstName} ${manager?.lastName}`,
                    email: manager?.email,
                  },
                  assignedAt: now,
                  assignedBy: 'system',
                  assignmentMethod: 'fallback',
                },
                updatedAt: now,
              });

              assigned++;
              continue;
            }
          }
        }
      }

      failed++;
    }

    logger.info('Unassigned task retry complete', {
      total: snapshot.size,
      assigned,
      failed,
    });

    return { assigned, failed };
  }
);

/**
 * Helper: Escalate priority level
 */
function escalatePriority(current) {
  const levels = ['low', 'medium', 'high', 'critical'];
  const currentIndex = levels.indexOf(current);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
}

// ============================================
// Callable: Assign Unassigned Tasks
// Manually triggered to assign pending tasks
// ============================================

const { onCall, onRequest } = require('firebase-functions/v2/https');

const TITLE_TO_ROLE_MAP = {
  'Review new design item:': 'design-manager',
  'Set up new design project:': 'project-manager',
  'Prepare initial design concepts for:': 'designer',
  'Prepare for client consultation:': 'designer',
  'Schedule client consultation:': 'project-coordinator',
  'Onboard new employee:': 'ceo',
  'Set up role profile:': 'ceo',
  'Review employee update:': 'ceo',
  'Review project brief:': 'design-manager',
  'Prepare project brief for:': 'project-coordinator',
  'Conduct initial space analysis:': 'space-planner',
  'Site assessment:': 'space-planner',
  'Coordinate consultation logistics:': 'project-coordinator',
  'Review design stage change:': 'designer',
  'Review approval request:': 'design-manager',
  'Process approved design:': 'production-planner',
  'Address design rejection:': 'designer',
  'Review RAG status update:': 'design-manager',
  'Review design concepts:': 'design-manager',
  'Process client feedback:': 'designer',
  'Prepare production for:': 'production-planner',
  'Coordinate procurement for:': 'procurement-coordinator',
  'Coordinate installation:': 'production-manager',
  'Inspect installation quality:': 'production-manager',
};

function determineRoleFromTitle(title) {
  for (const [prefix, role] of Object.entries(TITLE_TO_ROLE_MAP)) {
    if (title.startsWith(prefix)) return role;
  }
  return null;
}

const assignUnassignedTasks = onRequest(
  { region: 'europe-west1', timeoutSeconds: 120, cors: true },
  async (req, res) => {
    logger.info('assignUnassignedTasks called');

    const snapshot = await db
      .collection(COLLECTIONS.GENERATED_TASKS)
      .where('stage', '==', 'pending_assignment')
      .limit(200)
      .get();

    if (snapshot.empty) {
      res.json({ assigned: 0, skipped: 0, total: 0, message: 'No unassigned tasks found' });
      return;
    }

    let assigned = 0;
    let skipped = 0;
    const assignments = [];

    for (const doc of snapshot.docs) {
      const task = doc.data();
      const title = task.title || '';
      const role = determineRoleFromTitle(title);

      if (!role) {
        skipped++;
        assignments.push({ taskId: doc.id, title: title.substring(0, 60), status: 'skipped', reason: 'no role mapping' });
        continue;
      }

      const assignee = await findBestEmployeeForRole(role);

      if (!assignee) {
        skipped++;
        assignments.push({ taskId: doc.id, title: title.substring(0, 60), status: 'skipped', reason: `no employee for role: ${role}` });
        continue;
      }

      await doc.ref.update({
        assignedTo: assignee.assigneeId,
        assignedToName: assignee.assigneeName,
        assignment: {
          assigneeId: assignee.assigneeId,
          assigneeRef: {
            id: assignee.assigneeId,
            name: assignee.assigneeName,
            email: assignee.assigneeEmail,
          },
          assignedAt: admin.firestore.FieldValue.serverTimestamp(),
          assignedBy: 'system',
          assignmentMethod: 'workload_based',
          assignedRole: role,
        },
        stage: 'assigned',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      assigned++;
      assignments.push({ taskId: doc.id, title: title.substring(0, 60), status: 'assigned', assignee: assignee.assigneeName, role });
    }

    logger.info('assignUnassignedTasks complete', { total: snapshot.size, assigned, skipped });
    res.json({ total: snapshot.size, assigned, skipped, assignments });
  }
);

module.exports = {
  onBusinessEventCreated,
  processOverdueEscalations,
  sendTaskReminders,
  retryUnassignedTasks,
  assignUnassignedTasks,
};
