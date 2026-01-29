/**
 * Katana Customer Sync Function
 * Syncs customer data to Katana MRP when customers are created or updated
 *
 * Using v2 API (firebase-functions v4.x)
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const {
  createKatanaCustomer,
  updateKatanaCustomer,
  findKatanaCustomerByCode,
} = require('./client');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Convert Firestore customer to Katana format
 */
function toKatanaCustomer(customer) {
  const katanaData = {
    name: customer.name,
    code: customer.code,
    email: customer.email,
    phone: customer.phone,
    default_currency: 'USD',
  };

  if (customer.billingAddress) {
    katanaData.addresses = [
      {
        name: 'Billing',
        address_1: customer.billingAddress.street1,
        address_2: customer.billingAddress.street2,
        city: customer.billingAddress.city,
        state: customer.billingAddress.state,
        zip: customer.billingAddress.postalCode,
        country: customer.billingAddress.country,
        is_default_billing: true,
        is_default_shipping: false,
      },
    ];
  }

  return katanaData;
}

/**
 * Sync customer to Katana on create
 */
exports.onCustomerCreated = onDocumentCreated(
  'customers/{customerId}',
  async (event) => {
    const customerId = event.params.customerId;
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('No data in document');
      return;
    }
    const customer = snapshot.data();

    logger.info(`Syncing new customer ${customerId} to Katana`);

    try {
      // Check if customer already exists in Katana (by code)
      const existingKatana = await findKatanaCustomerByCode(customer.code);

      let katanaId;

      if (existingKatana) {
        // Link to existing Katana customer
        katanaId = existingKatana.id.toString();
        logger.info(`Found existing Katana customer: ${katanaId}`);
      } else {
        // Create new customer in Katana
        const katanaCustomer = await createKatanaCustomer(toKatanaCustomer(customer));
        katanaId = katanaCustomer.id.toString();
        logger.info(`Created Katana customer: ${katanaId}`);
      }

      // Update Firestore with Katana ID
      await db.collection('customers').doc(customerId).update({
        'externalIds.katanaId': katanaId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Customer ${customerId} synced to Katana successfully`);
    } catch (error) {
      logger.error(`Failed to sync customer ${customerId} to Katana:`, error);
      // Don't throw - we don't want to fail the Firestore write
      // Instead, mark for retry
      await db.collection('customers').doc(customerId).update({
        'syncStatus.katana': 'failed',
        'syncStatus.katanaError': error.message || 'Unknown error',
        'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

/**
 * Sync customer to Katana on update
 */
exports.onCustomerUpdated = onDocumentUpdated(
  'customers/{customerId}',
  async (event) => {
    const customerId = event.params.customerId;
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      logger.warn('No data in document update');
      return;
    }

    // Skip if only sync status changed (avoid infinite loop)
    const relevantFields = ['name', 'email', 'phone', 'billingAddress'];
    const hasRelevantChanges = relevantFields.some(
      (field) => JSON.stringify(before[field]) !== JSON.stringify(after[field])
    );

    if (!hasRelevantChanges) {
      return;
    }

    const katanaId = after.externalIds?.katanaId;
    if (!katanaId) {
      logger.warn(`Customer ${customerId} has no Katana ID, skipping update sync`);
      return;
    }

    logger.info(`Syncing updated customer ${customerId} to Katana`);

    try {
      await updateKatanaCustomer(parseInt(katanaId, 10), {
        name: after.name,
        email: after.email,
        phone: after.phone,
      });

      await db.collection('customers').doc(customerId).update({
        'syncStatus.katana': 'synced',
        'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Customer ${customerId} update synced to Katana`);
    } catch (error) {
      logger.error(`Failed to sync customer ${customerId} update to Katana:`, error);
      await db.collection('customers').doc(customerId).update({
        'syncStatus.katana': 'failed',
        'syncStatus.katanaError': error.message || 'Unknown error',
        'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);

/**
 * Manual sync trigger (callable function)
 */
exports.syncCustomerToKatana = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { customerId } = request.data || {};
    if (!customerId) {
      throw new HttpsError('invalid-argument', 'customerId is required');
    }

    logger.info(`Manual sync triggered for customer ${customerId}`);

    try {
      const customerDoc = await db.collection('customers').doc(customerId).get();
      if (!customerDoc.exists) {
        throw new HttpsError('not-found', `Customer ${customerId} not found`);
      }

      const customer = customerDoc.data();

      // Check if customer already exists in Katana (by code)
      const existingKatana = await findKatanaCustomerByCode(customer.code);

      let katanaId;

      if (existingKatana) {
        // Link to existing Katana customer
        katanaId = existingKatana.id.toString();
        logger.info(`Found existing Katana customer: ${katanaId}`);
      } else if (customer.externalIds?.katanaId) {
        // Update existing
        await updateKatanaCustomer(parseInt(customer.externalIds.katanaId, 10), toKatanaCustomer(customer));
        katanaId = customer.externalIds.katanaId;
        logger.info(`Updated Katana customer: ${katanaId}`);
      } else {
        // Create new customer in Katana
        const katanaCustomer = await createKatanaCustomer(toKatanaCustomer(customer));
        katanaId = katanaCustomer.id.toString();
        logger.info(`Created Katana customer: ${katanaId}`);
      }

      // Update Firestore with Katana ID
      await db.collection('customers').doc(customerId).update({
        'externalIds.katanaId': katanaId,
        'syncStatus.katana': 'synced',
        'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, katanaId };
    } catch (error) {
      logger.error(`Failed to manually sync customer ${customerId} to Katana:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', `Failed to sync customer: ${error.message}`);
    }
  }
);
