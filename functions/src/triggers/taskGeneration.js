/**
 * Task Generation Trigger - DawinOS v2.0
 * Cloud Function to process business events and generate tasks
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Collections
const COLLECTIONS = {
  BUSINESS_EVENTS: 'shared_ops/business_events',
  SMART_TASKS: 'shared_ops/smart_tasks',
  EMPLOYEES: 'hr/employees',
  DEPARTMENTS: 'hr/departments',
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
  design_item_created: [
    {
      title: 'Review new design item: {{entityName}}',
      description: 'A new design item has been created and needs initial review.',
      defaultPriority: 'medium',
      checklist: ['Review design brief', 'Verify category and specifications', 'Set initial RAG status', 'Assign to designer'],
    },
  ],
  design_item_stage_changed: [
    {
      title: 'Process stage transition for: {{entityName}}',
      description: 'Design item has moved to a new stage. Review stage gate requirements.',
      defaultPriority: 'high',
      checklist: ['Verify previous stage deliverables', 'Review stage gate criteria', 'Update documentation', 'Notify stakeholders'],
    },
  ],
  design_item_approval_requested: [
    {
      title: 'Approval required: {{entityName}}',
      description: 'A design item requires approval to proceed.',
      defaultPriority: 'high',
      checklist: ['Review design documentation', 'Check quality standards', 'Verify completeness', 'Provide approval decision'],
    },
  ],
  design_item_approved: [
    {
      title: 'Process approved design: {{entityName}}',
      description: 'Design item has been approved. Proceed with next steps.',
      defaultPriority: 'medium',
      checklist: ['Update project status', 'Initiate next phase', 'Notify team'],
    },
  ],
  design_item_rejected: [
    {
      title: 'Address rejection for: {{entityName}}',
      description: 'Design item was rejected and needs revision.',
      defaultPriority: 'high',
      checklist: ['Review rejection feedback', 'Identify required changes', 'Update design', 'Resubmit for approval'],
    },
  ],
  design_item_rag_updated: [
    {
      title: 'Critical RAG status: {{entityName}}',
      description: 'A design item has a critical (red) RAG status that needs attention.',
      defaultPriority: 'critical',
      checklist: ['Identify root cause', 'Develop mitigation plan', 'Update stakeholders', 'Resolve blockers'],
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
    document: 'shared_ops/business_events/{eventId}',
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
      // Mark event as processing
      await snapshot.ref.update({
        'processing.status': 'processing',
        'processing.processedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Generate tasks from event
      const eventType = eventData.eventType;
      const taskRules = getTaskRulesForEvent(eventType);
      const generatedTaskIds = [];

      for (const rule of taskRules) {
        const taskDoc = await db.collection(COLLECTIONS.SMART_TASKS).add({
          title: interpolateTitle(rule.title, eventData),
          description: rule.description || '',
          priority: eventData.metadata?.priority || rule.defaultPriority || 'medium',
          status: 'pending',
          stage: 'pending_assignment',
          sourceEventId: eventData.id,
          sourceEventType: eventType,
          sourceModule: eventData.sourceModule || 'unknown',
          subsidiary: eventData.subsidiary || 'finishes',
          entityType: eventData.entityType || 'unknown',
          entityId: eventData.entityId || null,
          entityName: eventData.entityName || null,
          projectId: eventData.projectId || eventData.payload?.projectId || null,
          dueDate: calculateDueDate(rule.defaultPriority || 'medium'),
          checklistItems: (rule.checklist || []).map((text) => ({
            text,
            completed: false,
          })),
          checklistProgress: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        generatedTaskIds.push(taskDoc.id);
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
      .collection(COLLECTIONS.SMART_TASKS)
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

      // Check escalation threshold based on priority
      const overdueHours =
        (now.toMillis() - task.dueDate.toMillis()) / (1000 * 60 * 60);
      const threshold =
        DEFAULT_ENGINE_CONFIG.overdueEscalationHours[task.priority] || 12;

      if (overdueHours >= threshold) {
        // Mark for escalation
        batch.update(doc.ref, {
          stage: 'escalated',
          priority: escalatePriority(task.priority),
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
        .collection(COLLECTIONS.SMART_TASKS)
        .where('status', 'in', ['pending', 'in-progress'])
        .where('dueDate', '>=', admin.firestore.Timestamp.fromDate(window.start))
        .where('dueDate', '<=', admin.firestore.Timestamp.fromDate(window.end))
        .get();

      for (const doc of snapshot.docs) {
        const task = doc.data();

        // Check if reminder already sent for this threshold
        const reminderKey = `reminder_${window.hours}h`;
        if (task[reminderKey]) continue;

        // Send reminder notification
        if (task.assignment?.assigneeId) {
          await db.collection(COLLECTIONS.USER_NOTIFICATIONS).add({
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

          // Mark reminder as sent
          await doc.ref.update({
            [reminderKey]: now,
            lastReminderAt: now,
            updatedAt: now,
          });

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
      .collection(COLLECTIONS.SMART_TASKS)
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

module.exports = {
  onBusinessEventCreated,
  processOverdueEscalations,
  sendTaskReminders,
  retryUnassignedTasks,
};
