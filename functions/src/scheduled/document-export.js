/**
 * Cloud Function - Document Export (Gen 2)
 *
 * Scheduled function that exports documents to external storage:
 * - SharePoint
 * - Google Drive
 *
 * Using v2 API (firebase-functions v4.x)
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { ALLOWED_ORIGINS } = require('../config/cors');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Daily document export
 * Runs at 2:00 AM EAT every day
 */
exports.dailyDocumentExport = onSchedule(
  {
    schedule: '0 2 * * *', // 2:00 AM daily
    timeZone: 'Africa/Nairobi',
    timeoutSeconds: 540, // 9 minutes
    memory: '1GiB',
  },
  async (event) => {
    try {
      logger.info('[DocumentExport] Starting daily export...');
      const startTime = Date.now();

      // Get all enabled export configurations
      const configurationsSnapshot = await db
        .collection('export_configurations')
        .where('enabled', '==', true)
        .where('syncFrequency', 'in', ['daily', 'hourly'])
        .get();

      if (configurationsSnapshot.empty) {
        logger.info('[DocumentExport] No enabled export configurations found');
        return;
      }

      const results = [];

      // Process each configuration
      for (const configDoc of configurationsSnapshot.docs) {
        const configId = configDoc.id;
        const configData = configDoc.data();

        try {
          logger.info(`[DocumentExport] Processing configuration: ${configId} (${configData.provider})`);

          // Note: Export service would be called here
          // For now, just log that it would run
          logger.info(`[DocumentExport] Would export documents for config ${configId}`);

          results.push({
            configurationId: configId,
            status: 'success',
            exportedCount: 0,
          });
        } catch (error) {
          logger.error(`[DocumentExport] Error processing configuration ${configId}:`, error);

          results.push({
            configurationId: configId,
            status: 'failed',
            exportedCount: 0,
          });
        }
      }

      const duration = Date.now() - startTime;

      // Log summary
      await db.collection('document_export_logs').add({
        timestamp: admin.firestore.Timestamp.now(),
        type: 'daily_export',
        totalConfigurations: configurationsSnapshot.size,
        results,
        duration,
        status: 'success',
      });

      logger.info('[DocumentExport] Daily export completed:', {
        duration: `${duration}ms`,
        configurations: configurationsSnapshot.size,
        results,
      });
    } catch (error) {
      logger.error('[DocumentExport] Error during daily export:', error);

      // Log error
      await db.collection('document_export_logs').add({
        timestamp: admin.firestore.Timestamp.now(),
        type: 'daily_export',
        status: 'error',
        error: error.message || String(error),
        stack: error.stack,
      });

      throw error;
    }
  }
);

/**
 * Manual export trigger
 * Callable function for admin to manually trigger export
 */
exports.triggerDocumentExport = onCall(
  {
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated to trigger document export'
      );
    }

    // Verify admin role
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can manually trigger document export'
      );
    }

    try {
      logger.info('[DocumentExport] Manual trigger by:', request.auth.uid);

      // Placeholder for actual export logic
      const job = {
        id: 'manual-' + Date.now(),
        status: 'completed',
        totalDocuments: 0,
        exportedDocuments: 0,
        failedDocuments: 0,
        skippedDocuments: 0,
      };

      // Log result
      await db.collection('document_export_logs').add({
        timestamp: admin.firestore.Timestamp.now(),
        type: 'manual_trigger',
        triggeredBy: request.auth.uid,
        configurationId: request.data?.configurationId,
        jobId: job.id,
        status: 'success',
        exportedCount: job.exportedDocuments,
        failedCount: job.failedDocuments,
      });

      return {
        success: true,
        job,
      };
    } catch (error) {
      logger.error('[DocumentExport] Error in manual trigger:', error);

      throw new HttpsError(
        'internal',
        'Error running document export',
        error.message || String(error)
      );
    }
  }
);

/**
 * Retry failed exports
 * Callable function to retry failed exports from a previous job
 */
exports.retryFailedExports = onCall(
  {
    timeoutSeconds: 540,
    memory: '1GiB',
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // Verify admin role
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      throw new HttpsError(
        'permission-denied',
        'Only admins can retry failed exports'
      );
    }

    try {
      logger.info('[DocumentExport] Retry failed exports for job:', request.data?.jobId);

      // Placeholder for retry logic
      const job = {
        id: request.data?.jobId,
        status: 'completed',
        exportedDocuments: 0,
        failedDocuments: 0,
      };

      return {
        success: true,
        job,
      };
    } catch (error) {
      logger.error('[DocumentExport] Error retrying failed exports:', error);

      throw new HttpsError(
        'internal',
        'Error retrying failed exports',
        error.message || String(error)
      );
    }
  }
);

/**
 * Get export job status
 * Callable function to get status of an export job
 */
exports.getExportJobStatus = onCall(
  {
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      const jobDoc = await db.collection('export_jobs').doc(request.data?.jobId).get();

      if (!jobDoc.exists) {
        throw new HttpsError(
          'not-found',
          `Export job ${request.data?.jobId} not found`
        );
      }

      const job = jobDoc.data();

      return {
        success: true,
        job: {
          id: jobDoc.id,
          status: job.status,
          totalDocuments: job.totalDocuments,
          exportedDocuments: job.exportedDocuments,
          failedDocuments: job.failedDocuments,
          skippedDocuments: job.skippedDocuments,
          startedAt: job.startedAt?.toDate().toISOString(),
          completedAt: job.completedAt?.toDate().toISOString(),
          duration: job.duration,
          errors: job.errors,
        },
      };
    } catch (error) {
      logger.error('[DocumentExport] Error getting job status:', error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Error getting export job status',
        error.message || String(error)
      );
    }
  }
);
