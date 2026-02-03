/**
 * Manufacturing Order Triggers - DawinOS v2.0
 * Cloud Function triggers for Manufacturing Order lifecycle events
 * Creates business events when MOs are created or updated
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Helper: Create a business event for manufacturing
 */
async function createManufacturingEvent({
  eventType,
  severity,
  entityId,
  entityName,
  projectId,
  projectName,
  title,
  description,
  previousState,
  currentState,
  changedFields,
  triggeredBy,
  triggeredByName,
  metadata,
}) {
  const eventData = {
    eventType,
    category: 'production',
    severity: severity || 'medium',
    sourceModule: 'manufacturing',
    subsidiary: 'finishes',
    entityType: 'manufacturing_order',
    entityId,
    entityName: entityName || '',
    projectId: projectId || null,
    projectName: projectName || null,
    title,
    description: description || '',
    previousState: previousState || null,
    currentState: currentState || null,
    changedFields: changedFields || [],
    triggeredBy: triggeredBy || 'system',
    triggeredByName: triggeredByName || 'System',
    metadata: metadata || {},
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    processedAt: null,
  };

  const ref = await db.collection('businessEvents').add(eventData);
  logger.info(`Created manufacturing event: ${eventType} (${ref.id})`);
  return ref.id;
}

/**
 * Trigger: Manufacturing Order Created
 */
exports.onManufacturingOrderCreated = onDocumentCreated(
  { document: 'manufacturingOrders/{moId}', region: 'us-central1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    logger.info(`MO created: ${data.moNumber}`);

    await createManufacturingEvent({
      eventType: 'manufacturing_order_created',
      severity: data.priority === 'urgent' ? 'critical' : data.priority === 'high' ? 'high' : 'medium',
      entityId: event.params.moId,
      entityName: data.moNumber,
      projectId: data.projectId,
      projectName: data.projectCode,
      title: `New Manufacturing Order: ${data.moNumber}`,
      description: `Manufacturing order created for ${data.designItemName} (${data.projectCode}). Priority: ${data.priority}.`,
      currentState: { status: data.status, stage: data.currentStage },
      triggeredBy: data.createdBy,
      metadata: {
        moNumber: data.moNumber,
        designItemId: data.designItemId,
        designItemName: data.designItemName,
        priority: data.priority,
        bomItemCount: data.bom?.length || 0,
      },
    });
  }
);

/**
 * Trigger: Manufacturing Order Updated
 * Detects status changes, stage changes, and completion
 */
exports.onManufacturingOrderUpdated = onDocumentUpdated(
  { document: 'manufacturingOrders/{moId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const moId = event.params.moId;

    // Detect status changes
    if (before.status !== after.status) {
      // MO approved
      if (after.status === 'approved') {
        await createManufacturingEvent({
          eventType: 'manufacturing_order_approved',
          severity: 'medium',
          entityId: moId,
          entityName: after.moNumber,
          projectId: after.projectId,
          projectName: after.projectCode,
          title: `MO Approved: ${after.moNumber}`,
          description: `Manufacturing order approved. Materials reserved for production.`,
          previousState: { status: before.status },
          currentState: { status: after.status },
          changedFields: ['status'],
          triggeredBy: after.updatedBy || 'system',
        });
      }

      // MO completed
      if (after.status === 'completed') {
        await createManufacturingEvent({
          eventType: 'manufacturing_order_completed',
          severity: 'medium',
          entityId: moId,
          entityName: after.moNumber,
          projectId: after.projectId,
          projectName: after.projectCode,
          title: `MO Completed: ${after.moNumber}`,
          description: `Manufacturing order completed for ${after.designItemName}.`,
          previousState: { status: before.status },
          currentState: { status: after.status },
          changedFields: ['status'],
          triggeredBy: after.updatedBy || 'system',
        });
      }

      // MO on hold
      if (after.status === 'on-hold') {
        await createManufacturingEvent({
          eventType: 'manufacturing_order_on_hold',
          severity: 'high',
          entityId: moId,
          entityName: after.moNumber,
          projectId: after.projectId,
          projectName: after.projectCode,
          title: `MO On Hold: ${after.moNumber}`,
          description: `Manufacturing order put on hold. Reason: ${after.holdReason || 'Not specified'}.`,
          previousState: { status: before.status },
          currentState: { status: after.status, holdReason: after.holdReason },
          changedFields: ['status'],
          triggeredBy: after.updatedBy || 'system',
          metadata: { holdReason: after.holdReason },
        });
      }
    }

    // Detect stage changes
    if (before.currentStage !== after.currentStage && after.status === 'in-progress') {
      await createManufacturingEvent({
        eventType: 'manufacturing_order_stage_changed',
        severity: 'low',
        entityId: moId,
        entityName: after.moNumber,
        projectId: after.projectId,
        projectName: after.projectCode,
        title: `MO Stage Advanced: ${after.moNumber}`,
        description: `Production stage advanced from ${before.currentStage} to ${after.currentStage}.`,
        previousState: { stage: before.currentStage },
        currentState: { stage: after.currentStage },
        changedFields: ['currentStage'],
        triggeredBy: after.updatedBy || 'system',
        metadata: {
          previousStage: before.currentStage,
          currentStage: after.currentStage,
        },
      });
    }
  }
);
