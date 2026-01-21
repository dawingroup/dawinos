/**
 * QuickBooks OAuth 2.0 Handler
 */

const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const functions = require('firebase-functions'); // For accessing config if needed, or process.env

const QBO_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QBO_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

function getConfig() {
  // Try to get from process.env (if set via secrets) or functions.config()
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || functions.config().quickbooks?.client_id;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || functions.config().quickbooks?.client_secret;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || functions.config().quickbooks?.redirect_uri || 'https://us-central1-dawin-cutlist-processor.cloudfunctions.net/qbCallback';

  if (!clientId || !clientSecret) {
    throw new Error(
      'QuickBooks credentials not configured. Set with: firebase functions:config:set quickbooks.client_id="..." quickbooks.client_secret="..."'
    );
  }
  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

/**
 * Generate OAuth authorization URL
 */
exports.getAuthUrl = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const config = getConfig();
  const state = Buffer.from(JSON.stringify({
    userId: request.auth.uid,
    timestamp: Date.now(),
  })).toString('base64');

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: config.redirectUri,
    state,
  });

  return {
    url: `${QBO_AUTH_URL}?${params.toString()}`,
  };
});

/**
 * Handle OAuth callback
 */
exports.handleCallback = onRequest(async (req, res) => {
  const { code, state, realmId, error } = req.query;

  if (error) {
    console.error('QuickBooks OAuth error:', error);
    res.redirect('/settings?qb_error=auth_failed');
    return;
  }

  if (!code || !state || !realmId) {
    res.redirect('/settings?qb_error=missing_params');
    return;
  }

  try {
    // Decode state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId } = stateData;

    // Exchange code for tokens
    const config = getConfig();
    const tokenResponse = await fetch(QBO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();

    // Store tokens in Firestore (encrypted in production)
    await db.collection('integrations').doc('quickbooks').set({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      x_refresh_token_expires_in: tokens.x_refresh_token_expires_in,
      realm_id: realmId,
      created_at: Date.now(),
      connected_by: userId,
      connected_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('QuickBooks connected successfully');
    res.redirect('/settings?qb_success=true');
  } catch (err) {
    console.error('QuickBooks callback error:', err);
    res.redirect('/settings?qb_error=token_exchange');
  }
});

/**
 * Refresh access token
 */
async function refreshTokens() {
  const doc = await db.collection('integrations').doc('quickbooks').get();
  if (!doc.exists) {
    throw new Error('QuickBooks not connected');
  }

  const tokens = doc.data();
  const config = getConfig();

  // Check if token needs refresh (expires in less than 5 minutes)
  const expiresAt = tokens.created_at + tokens.expires_in * 1000;
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokens; // Token still valid
  }

  // Refresh the token
  const response = await fetch(QBO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${errorText}`);
  }

  const newTokens = await response.json();

  const updatedTokens = {
    ...newTokens,
    realm_id: tokens.realm_id, // Persist realm_id
    created_at: Date.now(),
  };

  await db.collection('integrations').doc('quickbooks').update(updatedTokens);

  return updatedTokens;
}

exports.refreshTokens = refreshTokens;

/**
 * Check connection status
 */
exports.checkConnection = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const doc = await db.collection('integrations').doc('quickbooks').get();
    if (!doc.exists) {
      return { connected: false };
    }

    const tokens = doc.data();
    const refreshExpiresAt = tokens.created_at + tokens.x_refresh_token_expires_in * 1000;

    return {
      connected: true,
      realmId: tokens.realm_id,
      refreshTokenValid: Date.now() < refreshExpiresAt,
    };
  } catch (err) {
    return { connected: false, error: 'Failed to check connection' };
  }
});
