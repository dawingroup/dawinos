/**
 * Katana MRP API Client
 * Handles authentication and API calls to Katana
 */

const fetch = require('node-fetch');
const functions = require('firebase-functions');

const KATANA_API_BASE = 'https://api.katanamrp.com/v1';

function getApiKey() {
  const apiKey = process.env.KATANA_API_KEY || functions.config().katana?.api_key;
  if (!apiKey) {
    console.warn('Katana API key not found in env or config');
    return ''; 
  }
  return apiKey;
}

async function katanaRequest(endpoint, options = {}) {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error('Katana API key not configured');
  }

  const response = await fetch(`${KATANA_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Katana API error (${response.status}): ${errorBody}`);
  }

  return response.json();
}

/**
 * List all customers from Katana
 */
async function listKatanaCustomers(page = 1, perPage = 100) {
  return katanaRequest(`/customers?page=${page}&per_page=${perPage}`);
}

/**
 * Get a single customer by ID
 */
async function getKatanaCustomer(customerId) {
  const response = await katanaRequest(`/customers/${customerId}`);
  return response.data;
}

/**
 * Find customer by code
 */
async function findKatanaCustomerByCode(code) {
  const response = await katanaRequest(`/customers?search=${encodeURIComponent(code)}`);
  return response.data.find((c) => c.code === code) || null;
}

/**
 * Create a new customer in Katana
 */
async function createKatanaCustomer(data) {
  const response = await katanaRequest('/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Update an existing customer in Katana
 */
async function updateKatanaCustomer(customerId, data) {
  const response = await katanaRequest(`/customers/${customerId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.data;
}

/**
 * Delete a customer from Katana
 */
async function deleteKatanaCustomer(customerId) {
  await katanaRequest(`/customers/${customerId}`, {
    method: 'DELETE',
  });
}

module.exports = {
  listKatanaCustomers,
  getKatanaCustomer,
  findKatanaCustomerByCode,
  createKatanaCustomer,
  updateKatanaCustomer,
  deleteKatanaCustomer,
};
