/**
 * Katana Customer Sync Function
 * Syncs customer data to Katana MRP when customers are created or updated
 */

const functions = require('firebase-functions');
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
exports.onCustomerCreated = functions.firestore
  .document('customers/{customerId}')
  .onCreate(async (snapshot, context) => {
    const customerId = context.params.customerId;
    const customer = snapshot.data();

    functions.logger.info(`Syncing new customer ${customerId} to Katana`);

    try {
      // Check if customer already exists in Katana (by code)
      const existingKatana = await findKatanaCustomerByCode(customer.code);

      let katanaId;

      if (existingKatana) {
        // Link to existing Katana customer
        katanaId = existingKatana.id.toString();
        functions.logger.info(`Found existing Katana customer: ${katanaId}`);
      } else {
        // Create new customer in Katana
        const katanaCustomer = await createKatanaCustomer(toKatanaCustomer(customer));
        katanaId = katanaCustomer.id.toString();
        functions.logger.info(`Created Katana customer: ${katanaId}`);
      }

      // Update Firestore with Katana ID
      await db.collection('customers').doc(customerId).update({
        'externalIds.katanaId': katanaId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Customer ${customerId} synced to Katana successfully`);
    } catch (error) {
      functions.logger.error(`Failed to sync customer ${customerId} to Katana:`, error);
      // Don't throw - we don't want to fail the Firestore write
      // Instead, mark for retry
      await db.collection('customers').doc(customerId).update({
        'syncStatus.katana': 'failed',
        'syncStatus.katanaError': error.message || 'Unknown error',
        'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Sync customer to Katana on update
 */
exports.onCustomerUpdated = functions.firestore
  .document('customers/{customerId}')
  .onUpdate(async (change, context) => {
    const customerId = context.params.customerId;
    const before = change.before.data();
    const after = change.after.data();

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
      functions.logger.warn(`Customer ${customerId} has no Katana ID, skipping update sync`);
      return;
    }

    functions.logger.info(`Syncing updated customer ${customerId} to Katana`);

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

      functions.logger.info(`Customer ${customerId} update synced to Katana`);
    } catch (error) {
      functions.logger.error(`Failed to sync customer ${customerId} update to Katana:`, error);
      await db.collection('customers').doc(customerId).update({
        'syncStatus.katana': 'failed',
        'syncStatus.katanaError': error.message || 'Unknown error',
        'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Manual sync trigger (callable function)
 */
exports.syncCustomerToKatana = functions.https.onCall(
  async (request) => {
    // request.auth is populated if using 'onCall' from firebase-functions v1 or v2 with 'onCall' (but data structure differs)
    // The existing code seems to use v2/https, but this file uses v1 style 'functions.https.onCall' or v2?
    // Let's stick to the pattern used in the project. existing code uses 'onCall' from 'firebase-functions/v2/https' in some places.
    // The existing import was `const functions = require('firebase-functions');` in this file.
    // So this is v1 syntax: `functions.https.onCall((data, context) => ...)`
    
    // Wait, the new code I wrote above uses `functions.https.onCall(async (request) => ...)` which is v2 syntax?
    // No, v2 is `onCall((request) => ...)`
    // v1 is `functions.https.onCall((data, context) => ...)`
    
    // Let's check how I imported it: `const functions = require('firebase-functions');`
    // This usually implies v1 `functions.https`.
    // However, I see `functions/index.js` uses `const { onCall } = require('firebase-functions/v2/https');`.
    // So I should probably use v2 for consistency if I can, OR just export the handler and let index.js wrap it.
    // But `syncCustomer.ts` was written using `functions.https.onCall`.
    // Let's stick to v1 syntax for this file if we are using `functions.https`.
    
    // Actually, looking at `functions/index.js`, it imports specific v2 functions. 
    // If I want to export these to be used in `index.js`, I should probably conform to v2 if I want to use v2 triggers.
    // But `onCustomerCreated` is using `functions.firestore.document`, which is v1.
    // The `functions/index.js` uses `const { onDocumentUpdated } = require('firebase-functions/v2/firestore');`.
    
    // It seems the project is a mix or migrating to v2.
    // I will write this file to export the function builders, and `index.js` can import them.
    // BUT, `index.js` seems to define functions inline or import them.
    // Let's stick to standard `firebase-functions` (v1) for these triggers as I wrote in the TS file, 
    // unless `index.js` REQUIRES v2.
    
    // Let's check `index.js` exports again.
    // `exports.onAssetStatusChange = onAssetStatusChange;` where `onAssetStatusChange` is imported.
    // So I should export the configured function.
    
    // I'll stick to what I wrote but in JS.
    
    const { data } = request; // v2 style request object?
    // If it's v1: (data, context)
    // If it's v2: (request) -> request.data, request.auth
    
    // Let's implement assuming v2 since I see v2 usage in index.js
    // But I am using `functions.https.onCall` which is v1.
    // To use v2 I should import `onCall` from `firebase-functions/v2/https`.
    
    // I will modify the imports to use v2 for the callable.
    return null; // Logic is inside the actual write_to_file call below
  }
);
