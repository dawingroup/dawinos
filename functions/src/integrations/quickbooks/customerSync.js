/**
 * QuickBooks Customer Sync Service
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { refreshTokens } = require('./auth');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const QBO_API_BASE = 'https://quickbooks.api.intuit.com/v3/company';

async function qboRequest(endpoint, options = {}) {
  const tokens = await refreshTokens();

  const response = await fetch(
    `${QBO_API_BASE}/${tokens.realm_id}${endpoint}`,
    {
      ...options,
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Find QuickBooks customer by display name
 */
async function findQBOCustomer(displayName) {
  // Use simple query escaping for single quotes
  const escapedName = displayName.replace(/'/g, "\\'");
  const query = encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${escapedName}'`);
  const response = await qboRequest(`/query?query=${query}`);

  const customers = response.QueryResponse.Customer || [];
  return customers[0] || null;
}

/**
 * Create customer in QuickBooks
 */
async function createQBOCustomer(customer) {
  const response = await qboRequest('/customer', {
    method: 'POST',
    body: JSON.stringify(customer),
  });
  return response.Customer;
}

/**
 * Update customer in QuickBooks
 */
async function updateQBOCustomer(customer) {
  // QuickBooks requires SyncToken for updates. We need to fetch the latest version first.
  const existing = await qboRequest(`/customer/${customer.Id}`);

  const response = await qboRequest('/customer', {
    method: 'POST',
    body: JSON.stringify({
      ...customer,
      SyncToken: existing.Customer.MetaData?.LastUpdatedTime || existing.Customer.SyncToken,
      sparse: true,
    }),
  });
  return response.Customer;
}

/**
 * Convert Firestore customer to QuickBooks format
 */
function toQBOCustomer(firestoreCustomer) {
  const qboCustomer = {
    DisplayName: `${firestoreCustomer.name} (${firestoreCustomer.code})`,
    CompanyName: firestoreCustomer.name,
  };

  if (firestoreCustomer.email) {
    qboCustomer.PrimaryEmailAddr = { Address: firestoreCustomer.email };
  }

  if (firestoreCustomer.phone) {
    qboCustomer.PrimaryPhone = { FreeFormNumber: firestoreCustomer.phone };
  }

  if (firestoreCustomer.billingAddress) {
    qboCustomer.BillAddr = {
      Line1: firestoreCustomer.billingAddress.street1,
      Line2: firestoreCustomer.billingAddress.street2,
      City: firestoreCustomer.billingAddress.city,
      CountrySubDivisionCode: firestoreCustomer.billingAddress.state,
      PostalCode: firestoreCustomer.billingAddress.postalCode,
      Country: firestoreCustomer.billingAddress.country,
    };
  }

  return qboCustomer;
}

/**
 * Sync customer to QuickBooks on create
 */
exports.onCustomerCreatedQBO = onDocumentCreated('customers/{customerId}', async (event) => {
    const customerId = event.params.customerId;
    const customer = event.data.data();

    if (!customer) return;

    // Check if QuickBooks is connected
    const integrationDoc = await db.collection('integrations').doc('quickbooks').get();
    if (!integrationDoc.exists) {
      console.log('QuickBooks not connected, skipping sync');
      return;
    }

    console.log(`Syncing customer ${customerId} to QuickBooks`);

    try {
      const qboCustomer = toQBOCustomer(customer);

      // Check if customer exists in QBO
      const existing = await findQBOCustomer(qboCustomer.DisplayName);

      let qboId;
      if (existing) {
        qboId = existing.Id;
        console.log(`Found existing QuickBooks customer: ${qboId}`);
      } else {
        const created = await createQBOCustomer(qboCustomer);
        qboId = created.Id;
        console.log(`Created QuickBooks customer: ${qboId}`);
      }

      // Update Firestore with QuickBooks ID
      await db.collection('customers').doc(customerId).update({
        'externalIds.quickbooksId': qboId,
        'syncStatus.quickbooks': 'synced',
        'syncStatus.quickbooksLastSync': admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error(`Failed to sync customer ${customerId} to QuickBooks:`, error);
      await db.collection('customers').doc(customerId).update({
        'syncStatus.quickbooks': 'failed',
        'syncStatus.quickbooksError': error.message || 'Unknown error',
      });
    }
});

/**
 * Manual sync callable function
 */
exports.syncCustomerToQuickBooks = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { customerId } = request.data;
    const customerDoc = await db.collection('customers').doc(customerId).get();
    if (!customerDoc.exists) {
      throw new HttpsError('not-found', 'Customer not found');
    }

    const customer = customerDoc.data();

    try {
      const qboCustomer = toQBOCustomer(customer);
      let qboId = customer.externalIds?.quickbooksId;

      if (qboId) {
        // Update existing
        qboCustomer.Id = qboId;
        await updateQBOCustomer(qboCustomer);
      } else {
        // Create or find
        const existing = await findQBOCustomer(qboCustomer.DisplayName);
        if (existing) {
          qboId = existing.Id;
        } else {
          const created = await createQBOCustomer(qboCustomer);
          qboId = created.Id;
        }

        await db.collection('customers').doc(customerId).update({
          'externalIds.quickbooksId': qboId,
        });
      }

      await db.collection('customers').doc(customerId).update({
        'syncStatus.quickbooks': 'synced',
        'syncStatus.quickbooksLastSync': admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, quickbooksId: qboId };
    } catch (error) {
      throw new HttpsError(
        'internal',
        error.message || 'Failed to sync to QuickBooks'
      );
    }
});
