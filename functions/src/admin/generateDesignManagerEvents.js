/**
 * Cloud Function to Generate Business Events for Design Manager Projects
 * This runs with Firebase Admin privileges, bypassing the need for service account keys
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

/**
 * Event type mapping for Design Manager project stages
 * Maps to actual event-catalog.ts events
 */
const EVENT_TYPES = {
  'brief': 'finishes.client_consultation_scheduled',
  'scoping': 'finishes.space_planning_requested',
  'design': 'finishes.design_concepts_created',
  'review': 'finishes.design_approval_requested',
  'approval': 'finishes.client_feedback_received',
  'production': 'finishes.design_production_ready',
  'delivery': 'finishes.installation_scheduled',
  'completed': 'finishes.installation_complete',
};

/**
 * Get appropriate event type based on project stage and status
 */
function getEventType(project) {
  const stage = project.currentStage || 'brief';
  const status = project.status || 'active';

  if (status === 'completed') {
    return 'finishes.installation_complete';
  }

  return EVENT_TYPES[stage] || 'finishes.client_consultation_scheduled';
}

/**
 * Generate business event for a Design Manager project
 */
function generateEventForProject(project, projectId) {
  const eventType = getEventType(project);

  return {
    eventType,
    sourceModule: 'design_manager',
    subsidiary: 'finishes',
    entityType: 'project',
    entityId: projectId,

    // Event metadata
    timestamp: admin.firestore.Timestamp.now(),
    createdAt: admin.firestore.Timestamp.now(),
    processedAt: null,
    status: 'pending',

    // Project context
    context: {
      projectId,
      projectName: project.name || 'Unnamed Project',
      customerId: project.customerId || null,
      customerName: project.customerName || null,
      currentStage: project.currentStage || 'brief',
      status: project.status || 'active',
      priority: project.priority || 'medium',

      // Team information
      assignedDesigner: project.assignedTo || null,
      projectManager: project.createdBy || null,

      // Dates
      createdDate: project.createdAt || null,
      dueDate: project.dueDate || null,
      updatedDate: project.updatedAt || null,

      // Additional context
      scope: project.scope || null,
      budget: project.budget || null,
      deliverables: project.deliverables || [],
    },

    // Processing metadata
    taskGenerationAttempts: 0,
    lastProcessingError: null,
    retryCount: 0,
  };
}

/**
 * Cloud Function: Generate Business Events for Design Manager Projects
 *
 * @param {Object} data - Request data
 * @param {boolean} data.dryRun - If true, only simulate without creating events
 * @returns {Object} Summary of events created
 */
exports.generateDesignManagerEvents = onCall({
  timeoutSeconds: 540,
  memory: '512MiB',
  invoker: 'public',
}, async (request) => {
  const { dryRun = false } = request.data || {};
  const db = admin.firestore();

  try {
    // Log authentication info
    const uid = request.auth?.uid;
    console.log('Starting Business Event Generation for Design Manager Projects');
    console.log(`Authenticated user: ${uid || 'anonymous'}`);
    console.log(`Dry Run: ${dryRun}`);

    // Fetch all Design Manager projects
    const projectsSnapshot = await db.collection('designProjects').get();

    if (projectsSnapshot.empty) {
      return {
        success: true,
        message: 'No Design Manager projects found',
        stats: {
          total: 0,
          processed: 0,
          skipped: 0,
          errors: 0,
        },
      };
    }

    console.log(`Found ${projectsSnapshot.size} projects`);

    // Statistics
    const stats = {
      total: projectsSnapshot.size,
      processed: 0,
      skipped: 0,
      errors: 0,
      byEventType: {},
      byStage: {},
    };

    const createdEvents = [];
    const errors = [];

    // Process each project
    for (const doc of projectsSnapshot.docs) {
      const projectId = doc.id;
      const project = doc.data();

      try {
        // Check if event already exists
        const existingEventQuery = await db.collection('businessEvents')
          .where('entityType', '==', 'project')
          .where('entityId', '==', projectId)
          .where('sourceModule', '==', 'design_manager')
          .limit(1)
          .get();

        if (!existingEventQuery.empty) {
          console.log(`Skipping ${projectId} - Event already exists`);
          stats.skipped++;
          continue;
        }

        // Generate event
        const event = generateEventForProject(project, projectId);
        const eventType = event.eventType;
        const stage = project.currentStage || 'unknown';

        // Update statistics
        stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;

        if (!dryRun) {
          // Create the business event
          const docRef = await db.collection('businessEvents').add(event);
          console.log(`Created event for project: ${project.name || projectId} (${docRef.id})`);

          createdEvents.push({
            projectId,
            projectName: project.name,
            eventType,
            stage,
            eventId: docRef.id,
          });
        } else {
          console.log(`[DRY RUN] Would create event for: ${project.name || projectId}`);

          createdEvents.push({
            projectId,
            projectName: project.name,
            eventType,
            stage,
            dryRun: true,
          });
        }

        stats.processed++;

      } catch (error) {
        console.error(`Error processing project ${projectId}:`, error.message);
        stats.errors++;
        errors.push({
          projectId,
          error: error.message,
        });
      }
    }

    const result = {
      success: true,
      dryRun,
      message: dryRun
        ? `Dry run completed. Would create ${stats.processed} events.`
        : `Successfully created ${stats.processed} business events.`,
      stats,
      events: createdEvents.slice(0, 50), // Return first 50 events
      totalEvents: createdEvents.length,
      errors: errors.slice(0, 10), // Return first 10 errors if any
    };

    console.log('Event generation completed:', result.message);
    return result;

  } catch (error) {
    console.error('Fatal error in generateDesignManagerEvents:', error);
    throw new HttpsError('internal', `Failed to generate events: ${error.message}`);
  }
});

/**
 * HTTP endpoint version with CORS support
 */
exports.generateDesignManagerEventsHTTP = onRequest({
  timeoutSeconds: 540,
  memory: '512MiB',
  cors: ['https://dawinos.web.app', 'https://dawinos.firebaseapp.com'],
  invoker: 'public',
}, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Verify Firebase ID token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.substring(7);
      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log('Authenticated user:', decodedToken.uid, decodedToken.email);
      } catch (error) {
        console.warn('Token verification failed:', error.message);
        // Continue anyway - token is optional for now
      }
    }

    const { dryRun = false } = req.body;
    const db = admin.firestore();

    console.log('Starting Business Event Generation for Design Manager Projects');
    console.log(`Dry Run: ${dryRun}`);

    // Fetch all Design Manager projects
    const projectsSnapshot = await db.collection('designProjects').get();

    if (projectsSnapshot.empty) {
      res.json({
        success: true,
        message: 'No Design Manager projects found',
        stats: {
          total: 0,
          processed: 0,
          skipped: 0,
          errors: 0,
        },
      });
      return;
    }

    console.log(`Found ${projectsSnapshot.size} projects`);

    // Statistics
    const stats = {
      total: projectsSnapshot.size,
      processed: 0,
      skipped: 0,
      errors: 0,
      byEventType: {},
      byStage: {},
    };

    const createdEvents = [];
    const errors = [];

    // Process each project
    for (const doc of projectsSnapshot.docs) {
      const projectId = doc.id;
      const project = doc.data();

      try {
        // Check if event already exists
        const existingEventQuery = await db.collection('businessEvents')
          .where('entityType', '==', 'project')
          .where('entityId', '==', projectId)
          .where('sourceModule', '==', 'design_manager')
          .limit(1)
          .get();

        if (!existingEventQuery.empty) {
          console.log(`Skipping ${projectId} - Event already exists`);
          stats.skipped++;
          continue;
        }

        // Generate event
        const event = generateEventForProject(project, projectId);
        const eventType = event.eventType;
        const stage = project.currentStage || 'unknown';

        // Update statistics
        stats.byEventType[eventType] = (stats.byEventType[eventType] || 0) + 1;
        stats.byStage[stage] = (stats.byStage[stage] || 0) + 1;

        if (!dryRun) {
          // Create the business event
          const docRef = await db.collection('businessEvents').add(event);
          console.log(`Created event for project: ${project.name || projectId} (${docRef.id})`);

          createdEvents.push({
            projectId,
            projectName: project.name,
            eventType,
            stage,
            eventId: docRef.id,
          });
        } else {
          console.log(`[DRY RUN] Would create event for: ${project.name || projectId}`);

          createdEvents.push({
            projectId,
            projectName: project.name,
            eventType,
            stage,
            dryRun: true,
          });
        }

        stats.processed++;

      } catch (error) {
        console.error(`Error processing project ${projectId}:`, error.message);
        stats.errors++;
        errors.push({
          projectId,
          error: error.message,
        });
      }
    }

    const result = {
      success: true,
      dryRun,
      message: dryRun
        ? `Dry run completed. Would create ${stats.processed} events.`
        : `Successfully created ${stats.processed} business events.`,
      stats,
      events: createdEvents.slice(0, 50), // Return first 50 events
      totalEvents: createdEvents.length,
      errors: errors.slice(0, 10), // Return first 10 errors if any
    };

    console.log('Event generation completed:', result.message);
    res.json(result);

  } catch (error) {
    console.error('Fatal error in generateDesignManagerEventsHTTP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
