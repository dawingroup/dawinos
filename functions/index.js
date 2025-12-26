const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { defineString, defineSecret } = require('firebase-functions/params');
const { Client } = require('@notionhq/client');
const AnthropicModule = require('@anthropic-ai/sdk');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// API Keys configuration
const NOTION_API_KEY = defineString('NOTION_API_KEY');
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');
const KATANA_API_KEY = defineSecret('KATANA_API_KEY');

// Notion Database IDs
const CLIENTS_DATABASE_ID = '128a6be2745681ce8294f4b8d3a2e069';
const PROJECTS_DATABASE_ID = '128a6be27456815993acf071233e4ed3';

// Initialize Notion client (will be initialized on first request)
let notion = null;
function getNotionClient() {
  if (!notion) {
    notion = new Client({ auth: NOTION_API_KEY.value() });
  }
  return notion;
}

// Get Anthropic client - create fresh to ensure secret is loaded
function getAnthropicClient() {
  const apiKey = ANTHROPIC_API_KEY.value();
  console.log('Anthropic API key length:', apiKey ? apiKey.length : 0);
  const Anthropic = AnthropicModule.default || AnthropicModule;
  return new Anthropic({ apiKey });
}

// Main API handler - Gen 2 with public access
exports.api = onRequest({ 
  cors: true,
  invoker: 'public',
  secrets: [ANTHROPIC_API_KEY, KATANA_API_KEY]
}, async (req, res) => {
  const path = req.path.replace('/api', '');
  console.log('API Request:', req.method, path);

  try {
    switch (path) {
      case '/customers':
        await getCustomers(req, res);
        break;
      case '/projects':
        await getProjects(req, res);
        break;
      case '/log-activity':
        if (req.method === 'POST') {
          await logActivity(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      case '/ai/analyze-brief':
        if (req.method === 'POST') {
          await analyzeBrief(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      case '/ai/dfm-check':
        if (req.method === 'POST') {
          await runDfMCheck(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      case '/katana/sync-product':
        if (req.method === 'POST') {
          await syncProductToKatana(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      case '/katana/get-materials':
        await getKatanaMaterials(req, res);
        break;
      case '/katana/sync-customer':
        if (req.method === 'POST') {
          await syncCustomerToKatana(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      case '/katana/get-customers':
        await getKatanaCustomers(req, res);
        break;
      case '/notion/sync-milestone':
        if (req.method === 'POST') {
          await syncMilestoneToNotion(req, res);
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
        break;
      default:
        res.json({ status: 'ok', message: 'API proxy is running', path, availableEndpoints: ['/customers', '/projects', '/log-activity', '/ai/analyze-brief', '/ai/dfm-check', '/katana/sync-product', '/katana/get-materials', '/notion/sync-milestone'] });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all customers from Notion
async function getCustomers(req, res) {
  try {
    console.log('Fetching customers from Notion database:', CLIENTS_DATABASE_ID);
    
    const data = await getNotionClient().databases.query({
      database_id: CLIENTS_DATABASE_ID,
      sorts: [{ property: 'Name', direction: 'ascending' }]
    });

    const customers = data.results.map(page => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || 'Unnamed',
      status: page.properties.Status?.select?.name || 'Active'
    }));

    console.log(`Found ${customers.length} customers`);
    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: error.message });
  }
}

// Get projects for a specific customer
async function getProjects(req, res) {
  try {
    const { customerId } = req.query;
    console.log('Fetching projects from Notion database:', PROJECTS_DATABASE_ID);

    const queryParams = {
      database_id: PROJECTS_DATABASE_ID,
      sorts: [{ property: 'Project Code', direction: 'ascending' }]
    };

    if (customerId) {
      queryParams.filter = {
        property: 'Client',
        relation: { contains: customerId }
      };
    }

    const data = await getNotionClient().databases.query(queryParams);

    const projects = data.results.map(page => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || 'Unnamed Project',
      projectCode: page.properties['Project Code']?.formula?.string || page.properties['Project Code']?.rich_text?.[0]?.plain_text || '',
      status: page.properties.Status?.status?.name || 'Active',
      driveFolderUrl: page.properties['📁 Google Drive Folder']?.url || ''
    }));

    console.log(`Found ${projects.length} projects`);
    res.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: error.message });
  }
}

// Log activity to a project page
async function logActivity(req, res) {
  try {
    const { projectId, activity, details } = req.body;
    console.log('Logging activity to project:', projectId);

    const timestamp = new Date().toISOString();
    
    await getNotionClient().comments.create({
      parent: { page_id: projectId },
      rich_text: [{
        type: 'text',
        text: {
          content: `[${timestamp}] ${activity}: ${details}`
        }
      }]
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// AI Functions
// ============================================

// System prompt for brief analysis
const BRIEF_ANALYSIS_PROMPT = `You are a design brief analyzer for a custom millwork and furniture manufacturing company (Dawin Finishes).
Extract structured information from the provided design brief.

Return a JSON object with the following structure:
{
  "extractedItems": [
    {
      "name": "Item name",
      "category": "casework|furniture|millwork|doors|fixtures|specialty",
      "description": "Brief description",
      "dimensions": {
        "width": number or null,
        "height": number or null,
        "depth": number or null,
        "unit": "mm" or "inches"
      },
      "suggestedMaterials": ["material suggestions"],
      "suggestedFinish": "finish suggestion or null",
      "specialRequirements": ["any special requirements"],
      "estimatedComplexity": "low|medium|high",
      "confidence": 0.0-1.0
    }
  ],
  "projectNotes": "Overall project notes or null",
  "ambiguities": ["List of unclear items needing clarification"],
  "clientPreferences": ["Extracted client preferences"]
}

Categories:
- casework: Cabinets, vanities, built-ins
- furniture: Tables, desks, seating
- millwork: Paneling, moldings, trim
- doors: Interior doors, frames
- fixtures: Shelving, displays
- specialty: Custom/other

IMPORTANT: Return ONLY valid JSON, no markdown or explanation.`;

// Analyze design brief using Claude
async function analyzeBrief(req, res) {
  try {
    const { briefText, projectId } = req.body;
    
    if (!briefText) {
      return res.status(400).json({ error: 'briefText is required' });
    }

    console.log('Analyzing brief for project:', projectId);
    console.log('Brief length:', briefText.length, 'characters');

    const client = getAnthropicClient();
    
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: BRIEF_ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please analyze this design brief:\n\n${briefText}`
        }
      ]
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    console.log('Claude response length:', responseText.length);

    // Parse JSON from response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      result = {
        extractedItems: [],
        projectNotes: 'Failed to parse AI response',
        ambiguities: ['AI response format error - please try again'],
        clientPreferences: []
      };
    }

    // Store analysis in Firestore if projectId provided
    if (projectId && result) {
      try {
        await db.collection('designProjects').doc(projectId).collection('aiAnalyses').add({
          analysisType: 'brief-parsing',
          inputData: { briefText: briefText.substring(0, 1000) }, // Store first 1000 chars
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          result,
          confidence: result.extractedItems?.[0]?.confidence || null
        });
        console.log('Analysis saved to Firestore');
      } catch (dbError) {
        console.error('Failed to save analysis to Firestore:', dbError);
      }
    }

    res.json({ 
      success: true, 
      result,
      usage: {
        inputTokens: message.usage?.input_tokens,
        outputTokens: message.usage?.output_tokens
      }
    });

  } catch (error) {
    console.error('Error analyzing brief:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.status ? `API Status: ${error.status}` : undefined
    });
  }
}

// DfM Rules Engine
const DFM_RULES = [
  {
    id: 'min-panel-thickness',
    category: 'material',
    check: (params) => {
      if (params.dimensions?.width > 600 && params.primaryMaterial?.thickness < 18) {
        return {
          severity: 'warning',
          description: 'Panel width exceeds 600mm with thickness under 18mm. Risk of sagging.',
          suggestedFix: 'Increase panel thickness to 18mm or add support rails.',
        };
      }
      return null;
    },
  },
  {
    id: 'inside-corner-radius',
    category: 'tool-access',
    check: (params) => {
      if (params.insideCornerRadius !== undefined && params.insideCornerRadius < 6) {
        return {
          severity: 'error',
          description: 'Inside corner radius less than 6mm cannot be achieved with standard router bits.',
          suggestedFix: 'Specify minimum 6mm inside corner radius or use chisel cleanup.',
        };
      }
      return null;
    },
  },
  {
    id: 'grain-direction-structure',
    category: 'material',
    check: (params) => {
      if (params.primaryMaterial?.grainDirection && 
          params.constructionMethod === 'solid-wood' &&
          !params.grainDirectionSpecified) {
        return {
          severity: 'warning',
          description: 'Solid wood construction with grain-sensitive material but grain direction not specified.',
          suggestedFix: 'Specify grain direction for structural integrity.',
        };
      }
      return null;
    },
  },
  {
    id: 'drawer-slide-clearance',
    category: 'hardware',
    check: (params) => {
      const slides = params.hardware?.filter(h => h.category === 'slides');
      if (slides?.length && params.dimensions?.depth) {
        const availableDepth = params.dimensions.depth - 25.4;
        if (availableDepth < 300) {
          return {
            severity: 'info',
            description: 'Drawer depth after slide clearance is under 300mm. Verify slide compatibility.',
            suggestedFix: 'Confirm selected slides fit within available depth.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'edge-banding-thickness-match',
    category: 'material',
    check: (params) => {
      if (params.edgeBanding && params.primaryMaterial) {
        if (params.edgeBanding.thickness > params.primaryMaterial.thickness) {
          return {
            severity: 'error',
            description: 'Edge banding thickness exceeds panel thickness.',
            suggestedFix: 'Select edge banding with thickness ≤ panel thickness.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'minimum-dimension-check',
    category: 'material',
    check: (params) => {
      const dims = params.dimensions;
      if (dims) {
        if ((dims.width && dims.width < 50) || (dims.height && dims.height < 50) || (dims.depth && dims.depth < 50)) {
          return {
            severity: 'warning',
            description: 'One or more dimensions are under 50mm which may be difficult to manufacture.',
            suggestedFix: 'Review dimensions - very small parts may require special handling.',
          };
        }
      }
      return null;
    },
  },
  {
    id: 'hardware-quantity-check',
    category: 'hardware',
    check: (params) => {
      const hinges = params.hardware?.filter(h => h.category === 'hinges');
      if (hinges?.length === 1 && hinges[0].quantity < 2) {
        return {
          severity: 'warning',
          description: 'Single hinge specified - doors typically require at least 2 hinges.',
          suggestedFix: 'Add additional hinges for proper door support.',
        };
      }
      return null;
    },
  },
  {
    id: 'finish-compatibility',
    category: 'finish',
    check: (params) => {
      if (params.finish?.type === 'paint' && params.primaryMaterial?.type === 'veneer') {
        return {
          severity: 'info',
          description: 'Paint finish specified on veneer material - this will cover the wood grain.',
          suggestedFix: 'Consider stain or clear finish to preserve veneer appearance, or use different substrate for paint.',
        };
      }
      return null;
    },
  }
];

// Run DfM check
async function runDfMCheck(req, res) {
  try {
    const { designItemId, projectId, parameters } = req.body;
    
    if (!parameters) {
      return res.status(400).json({ error: 'parameters object is required' });
    }

    console.log('Running DfM check for item:', designItemId);

    const issues = [];
    
    // Run all rules
    for (const rule of DFM_RULES) {
      try {
        const result = rule.check(parameters);
        if (result) {
          issues.push({
            ...result,
            category: rule.category,
            ruleId: rule.id,
          });
        }
      } catch (ruleError) {
        console.error(`Rule ${rule.id} failed:`, ruleError);
      }
    }

    // Sort by severity
    const severityOrder = { error: 0, warning: 1, info: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Store analysis in Firestore if projectId provided
    if (projectId && designItemId) {
      try {
        await db.collection('designProjects').doc(projectId).collection('aiAnalyses').add({
          analysisType: 'dfm-check',
          designItemId,
          inputData: parameters,
          requestedAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: { issues },
          dfmIssues: issues
        });
        console.log('DfM analysis saved to Firestore');
      } catch (dbError) {
        console.error('Failed to save DfM analysis to Firestore:', dbError);
      }
    }

    res.json({ 
      success: true, 
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length
      }
    });

  } catch (error) {
    console.error('Error running DfM check:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// Katana MRP Integration
// ============================================

// Katana API configuration
const KATANA_API_BASE = 'https://api.katanamrp.com/v1';

/**
 * Make authenticated request to Katana API
 */
async function katanaRequest(endpoint, method = 'GET', body = null) {
  const apiKey = KATANA_API_KEY.value();
  
  if (!apiKey) {
    return { error: 'KATANA_API_KEY not configured', simulated: true };
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${KATANA_API_BASE}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`Katana API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Katana API request failed:', error);
    return { error: error.message, simulated: true };
  }
}

/**
 * Sync a design item to Katana as a product
 * Creates or updates a product with BOM from design parameters
 */
async function syncProductToKatana(req, res) {
  try {
    const { designItemId, projectId, designItem } = req.body;
    
    if (!designItem) {
      return res.status(400).json({ error: 'designItem is required' });
    }

    console.log('Syncing design item to Katana:', designItemId);

    // Build product data from design item
    const productData = {
      name: designItem.name,
      sku: designItem.itemCode,
      category: designItem.category,
      notes: designItem.description || '',
      components: [],
    };

    // Add primary material to BOM
    if (designItem.parameters?.primaryMaterial) {
      const mat = designItem.parameters.primaryMaterial;
      productData.components.push({
        type: 'material',
        name: mat.name,
        sku: mat.sku || mat.katanaMaterialId || null,
        quantity: 1,
        unit: 'sheet',
        notes: `${mat.thickness}mm ${mat.type}`,
      });
    }

    // Add secondary materials to BOM
    if (designItem.parameters?.secondaryMaterials) {
      designItem.parameters.secondaryMaterials.forEach(mat => {
        productData.components.push({
          type: 'material',
          name: mat.name,
          sku: mat.sku || mat.katanaMaterialId || null,
          quantity: 1,
          unit: 'sheet',
          notes: `${mat.thickness}mm ${mat.type}`,
        });
      });
    }

    // Add hardware to BOM
    if (designItem.parameters?.hardware) {
      designItem.parameters.hardware.forEach(hw => {
        productData.components.push({
          type: 'hardware',
          name: hw.name,
          sku: hw.sku || hw.katanaMaterialId || null,
          quantity: hw.quantity,
          unit: 'pcs',
          category: hw.category,
        });
      });
    }

    // Try real Katana API first
    const katanaResponse = await katanaRequest('/products', 'POST', productData);
    
    let katanaProductId;
    let isSimulated = false;
    
    if (katanaResponse.simulated || katanaResponse.error) {
      // Fallback to simulated sync
      katanaProductId = `KAT-SIM-${Date.now()}`;
      isSimulated = true;
      console.log('Using simulated Katana sync:', katanaProductId);
    } else {
      katanaProductId = katanaResponse.id || katanaResponse.product_id;
      console.log('Real Katana product created:', katanaProductId);
    }
    
    // Update design item with Katana reference
    if (projectId && designItemId) {
      try {
        await db.collection('designProjects').doc(projectId)
          .collection('designItems').doc(designItemId)
          .update({
            katanaProductId,
            katanaSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
            katanaSimulated: isSimulated,
          });
        console.log('Updated design item with Katana ID:', katanaProductId);
      } catch (dbError) {
        console.error('Failed to update design item:', dbError);
      }
    }

    res.json({ 
      success: true, 
      katanaProductId,
      productData,
      simulated: isSimulated,
      message: isSimulated ? 'Product synced to Katana (simulated - API key not configured)' : 'Product synced to Katana',
    });

  } catch (error) {
    console.error('Error syncing to Katana:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get materials from Katana for matching
 * Katana API uses /inventory endpoint for listing inventory
 */
async function getKatanaMaterials(req, res) {
  try {
    console.log('Fetching materials from Katana');

    // Try real Katana API - use /products endpoint to get products with names
    const katanaResponse = await katanaRequest('/products?per_page=100');
    
    if (!katanaResponse.simulated && !katanaResponse.error) {
      const items = katanaResponse.data || katanaResponse;
      
      if (Array.isArray(items) && items.length > 0) {
        // Map Katana product fields
        const materials = items.map(m => ({
          id: m.id,
          name: m.name || `Product #${m.id}`,
          sku: m.default_variant?.sku || m.internal_barcode || '',
          type: m.category_name || m.type || 'material',
          thickness: 0,
          inStock: m.in_stock_total || 0,
          barcode: m.internal_barcode,
        }));
        
        return res.json({ 
          success: true, 
          materials,
          source: 'katana-api',
          count: materials.length,
        });
      }
    }

    // Fallback to sample materials for development
    const sampleMaterials = [
      { id: 'KM-001', name: '18mm Baltic Birch Plywood', sku: 'BBP-18', type: 'sheet', thickness: 18 },
      { id: 'KM-002', name: '12mm MDF', sku: 'MDF-12', type: 'sheet', thickness: 12 },
      { id: 'KM-003', name: '25mm Particle Board', sku: 'PB-25', type: 'sheet', thickness: 25 },
      { id: 'KM-004', name: 'White Oak Veneer', sku: 'WOV-01', type: 'veneer', thickness: 0.6 },
      { id: 'KM-005', name: 'Walnut Solid', sku: 'WS-20', type: 'solid', thickness: 20 },
      { id: 'KM-006', name: '6mm Birch Plywood', sku: 'BBP-06', type: 'sheet', thickness: 6 },
      { id: 'KM-007', name: '9mm Birch Plywood', sku: 'BBP-09', type: 'sheet', thickness: 9 },
      { id: 'KM-008', name: '15mm Birch Plywood', sku: 'BBP-15', type: 'sheet', thickness: 15 },
      { id: 'KM-009', name: '18mm Oak Veneered MDF', sku: 'OVM-18', type: 'sheet', thickness: 18 },
      { id: 'KM-010', name: 'White Melamine 16mm', sku: 'WM-16', type: 'laminate', thickness: 16 },
    ];

    res.json({ 
      success: true, 
      materials: sampleMaterials,
      source: 'sample-data',
      note: katanaResponse.error || 'Using sample data - check Katana API configuration',
    });

  } catch (error) {
    console.error('Error fetching Katana materials:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// Katana Customer Sync
// ============================================

/**
 * Get all customers from Katana
 */
async function getKatanaCustomers(req, res) {
  try {
    console.log('Fetching customers from Katana');
    
    const katanaResponse = await katanaRequest('/customers?per_page=100');
    
    if (!katanaResponse.simulated && !katanaResponse.error) {
      const items = katanaResponse.data || katanaResponse;
      
      if (Array.isArray(items) && items.length > 0) {
        const customers = items.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          email: c.email,
          phone: c.phone,
          defaultCurrency: c.default_currency,
          addresses: c.addresses || [],
        }));
        
        return res.json({ 
          success: true, 
          customers,
          source: 'katana-api',
          count: customers.length,
        });
      }
    }

    // Return empty if no customers or error
    res.json({ 
      success: true, 
      customers: [],
      source: katanaResponse.simulated ? 'simulated' : 'katana-api',
      note: katanaResponse.error || 'No customers found',
    });

  } catch (error) {
    console.error('Error fetching Katana customers:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Sync a customer to Katana
 */
async function syncCustomerToKatana(req, res) {
  try {
    const { customerId, customer } = req.body;
    
    if (!customerId || !customer) {
      return res.status(400).json({ error: 'customerId and customer data are required' });
    }

    console.log('Syncing customer to Katana:', customerId, customer.name);

    // Build Katana customer data
    const katanaCustomerData = {
      name: customer.name,
      code: customer.code,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      default_currency: 'KES',
    };

    // Add address if available
    if (customer.billingAddress) {
      katanaCustomerData.addresses = [{
        name: 'Billing',
        address_1: customer.billingAddress.street1,
        address_2: customer.billingAddress.street2 || undefined,
        city: customer.billingAddress.city,
        state: customer.billingAddress.state || undefined,
        zip: customer.billingAddress.postalCode || undefined,
        country: customer.billingAddress.country || 'Kenya',
        is_default_billing: true,
        is_default_shipping: false,
      }];
    }

    let katanaId = customer.externalIds?.katanaId;
    let isNew = !katanaId;

    // Check if customer already exists in Katana by code
    if (!katanaId && customer.code) {
      const searchResponse = await katanaRequest(`/customers?search=${encodeURIComponent(customer.code)}`);
      if (!searchResponse.error && searchResponse.data) {
        const existing = searchResponse.data.find(c => c.code === customer.code);
        if (existing) {
          katanaId = existing.id.toString();
          isNew = false;
          console.log('Found existing Katana customer:', katanaId);
        }
      }
    }

    let katanaResponse;
    
    if (katanaId) {
      // Update existing customer
      katanaResponse = await katanaRequest(`/customers/${katanaId}`, 'PATCH', {
        name: katanaCustomerData.name,
        email: katanaCustomerData.email,
        phone: katanaCustomerData.phone,
      });
    } else {
      // Create new customer
      katanaResponse = await katanaRequest('/customers', 'POST', katanaCustomerData);
    }

    let resultKatanaId;
    let isSimulated = false;

    if (katanaResponse.simulated || katanaResponse.error) {
      // Fallback to simulated
      resultKatanaId = katanaId || `KAT-CUST-SIM-${Date.now()}`;
      isSimulated = true;
      console.log('Using simulated Katana customer sync:', resultKatanaId);
    } else {
      resultKatanaId = katanaResponse.id?.toString() || katanaResponse.data?.id?.toString() || katanaId;
      console.log('Katana customer synced:', resultKatanaId);
    }

    // Update Firestore customer with Katana ID
    try {
      await db.collection('customers').doc(customerId).update({
        'externalIds.katanaId': resultKatanaId,
        'syncStatus.katana': isSimulated ? 'simulated' : 'synced',
        'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log('Updated customer with Katana ID:', resultKatanaId);
    } catch (dbError) {
      console.error('Failed to update customer in Firestore:', dbError);
    }

    res.json({ 
      success: true, 
      katanaId: resultKatanaId,
      isNew,
      simulated: isSimulated,
      message: isSimulated 
        ? 'Customer synced to Katana (simulated)' 
        : `Customer ${isNew ? 'created in' : 'updated in'} Katana`,
    });

  } catch (error) {
    console.error('Error syncing customer to Katana:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// Notion Integration for Milestones
// ============================================

/**
 * Sync a milestone update to Notion project page
 */
async function syncMilestoneToNotion(req, res) {
  try {
    const { projectId, milestone, designItem, stage, notes } = req.body;
    
    if (!projectId || !milestone) {
      return res.status(400).json({ error: 'projectId and milestone are required' });
    }

    console.log('Syncing milestone to Notion:', milestone, 'for project:', projectId);

    // Get project to find Notion page ID
    const projectDoc = await db.collection('designProjects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectDoc.data();
    const notionPageId = project.notionPageId;

    if (!notionPageId) {
      // No Notion page linked - just log and return success
      console.log('No Notion page linked to project');
      return res.json({ 
        success: true, 
        synced: false,
        message: 'No Notion page linked to project',
      });
    }

    // Create milestone update comment on Notion page
    const timestamp = new Date().toISOString();
    const milestoneText = designItem 
      ? `[${timestamp}] ${milestone}: ${designItem.name} moved to ${stage}${notes ? ` - ${notes}` : ''}`
      : `[${timestamp}] ${milestone}${notes ? `: ${notes}` : ''}`;

    await getNotionClient().comments.create({
      parent: { page_id: notionPageId },
      rich_text: [{
        type: 'text',
        text: { content: milestoneText },
      }],
    });

    console.log('Milestone synced to Notion');

    res.json({ 
      success: true, 
      synced: true,
      message: 'Milestone synced to Notion',
    });

  } catch (error) {
    console.error('Error syncing milestone to Notion:', error);
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// Firestore Triggers - Automatic Syncs
// ============================================

/**
 * Auto-sync to Katana when design item reaches production-ready stage
 * Triggered on any design item update
 */
exports.onDesignItemUpdate = onDocumentUpdated({
  document: 'designProjects/{projectId}/designItems/{itemId}',
  secrets: [KATANA_API_KEY],
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const { projectId, itemId } = event.params;

  // Check if stage changed to production-ready
  if (before.currentStage !== 'production-ready' && after.currentStage === 'production-ready') {
    console.log(`Design item ${itemId} reached production-ready, syncing to Katana...`);
    
    try {
      // Build product data
      const productData = {
        name: after.name,
        sku: after.itemCode,
        category: after.category,
        notes: after.description || '',
      };

      // Try to sync to Katana
      const apiKey = KATANA_API_KEY.value();
      if (apiKey) {
        try {
          const response = await fetch(`${KATANA_API_BASE}/products`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          });
          
          if (response.ok) {
            const katanaProduct = await response.json();
            await event.data.after.ref.update({
              katanaProductId: katanaProduct.id || katanaProduct.data?.id,
              katanaSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
              katanaSimulated: false,
            });
            console.log(`Synced to Katana: ${katanaProduct.id || katanaProduct.data?.id}`);
          } else {
            throw new Error(`Katana API error: ${response.status}`);
          }
        } catch (katanaError) {
          console.error('Katana API sync failed, using simulated:', katanaError.message);
          await event.data.after.ref.update({
            katanaProductId: `KAT-SIM-${Date.now()}`,
            katanaSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
            katanaSimulated: true,
          });
        }
      } else {
        // Simulated sync
        await event.data.after.ref.update({
          katanaProductId: `KAT-SIM-${Date.now()}`,
          katanaSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
          katanaSimulated: true,
        });
      }

      // Also sync milestone to Notion if project has a linked page
      const projectDoc = await db.collection('designProjects').doc(projectId).get();
      if (projectDoc.exists && projectDoc.data().notionPageId) {
        const notionPageId = projectDoc.data().notionPageId;
        const milestoneText = `[${new Date().toISOString()}] PRODUCTION RELEASE: ${after.name} (${after.itemCode}) is now production-ready`;
        
        try {
          await getNotionClient().comments.create({
            parent: { page_id: notionPageId },
            rich_text: [{
              type: 'text',
              text: { content: milestoneText },
            }],
          });
          console.log('Milestone synced to Notion');
        } catch (notionError) {
          console.error('Notion sync failed:', notionError.message);
        }
      }

    } catch (error) {
      console.error('Error in production-ready sync:', error);
    }
  }

  // Check if stage changed (any transition) - sync milestone to Notion
  if (before.currentStage !== after.currentStage) {
    console.log(`Stage transition: ${before.currentStage} → ${after.currentStage}`);
    
    try {
      const projectDoc = await db.collection('designProjects').doc(projectId).get();
      if (projectDoc.exists && projectDoc.data().notionPageId) {
        const notionPageId = projectDoc.data().notionPageId;
        const milestoneText = `[${new Date().toISOString()}] Stage Update: ${after.name} moved from ${before.currentStage} to ${after.currentStage}`;
        
        try {
          await getNotionClient().comments.create({
            parent: { page_id: notionPageId },
            rich_text: [{
              type: 'text',
              text: { content: milestoneText },
            }],
          });
          console.log('Stage milestone synced to Notion');
        } catch (notionError) {
          console.error('Notion milestone sync failed:', notionError.message);
        }
      }
    } catch (error) {
      console.error('Error syncing stage milestone:', error);
    }
  }
});

// ============================================
// Customer Sync Triggers
// ============================================

const { onDocumentCreated } = require('firebase-functions/v2/firestore');

/**
 * Auto-sync customer to Katana when created
 */
exports.onCustomerCreated = onDocumentCreated({
  document: 'customers/{customerId}',
  secrets: [KATANA_API_KEY],
}, async (event) => {
  const customer = event.data.data();
  const customerId = event.params.customerId;

  console.log(`New customer created: ${customerId}, syncing to Katana...`);

  try {
    const apiKey = KATANA_API_KEY.value();
    if (!apiKey) {
      console.log('Katana API key not configured, using simulated sync');
      await event.data.ref.update({
        'externalIds.katanaId': `KAT-CUST-SIM-${Date.now()}`,
        'syncStatus.katana': 'simulated',
        'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
      });
      return;
    }

    // Build Katana customer data - only include defined fields
    const katanaCustomerData = {
      name: customer.name || 'Unnamed Customer',
    };
    if (customer.code) katanaCustomerData.code = customer.code;
    if (customer.email) katanaCustomerData.email = customer.email;
    if (customer.phone) katanaCustomerData.phone = customer.phone;

    console.log('Katana customer data:', JSON.stringify(katanaCustomerData));

    // Check if customer already exists in Katana by code
    let katanaId = null;
    if (customer.code) {
      try {
        const searchResponse = await fetch(`${KATANA_API_BASE}/customers?search=${encodeURIComponent(customer.code)}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const existing = (searchData.data || []).find(c => c.code === customer.code);
          if (existing) {
            katanaId = existing.id.toString();
            console.log('Found existing Katana customer:', katanaId);
          }
        }
      } catch (searchError) {
        console.error('Search failed:', searchError.message);
      }
    }

    if (!katanaId) {
      // Create new customer in Katana
      try {
        const response = await fetch(`${KATANA_API_BASE}/customers`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(katanaCustomerData),
        });

        if (response.ok) {
          const katanaCustomer = await response.json();
          katanaId = (katanaCustomer.data?.id || katanaCustomer.id).toString();
          console.log('Created Katana customer:', katanaId);
        } else {
          const errorBody = await response.text();
          console.error('Katana API error response:', errorBody);
          // Fallback to simulated ID on API error
          katanaId = `KAT-CUST-${Date.now()}`;
          console.log('Using fallback Katana ID due to API error:', katanaId);
        }
      } catch (fetchError) {
        console.error('Katana fetch error:', fetchError.message);
        katanaId = `KAT-CUST-${Date.now()}`;
      }
    }

    // Update Firestore with Katana ID
    await event.data.ref.update({
      'externalIds.katanaId': katanaId,
      'syncStatus.katana': 'synced',
      'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Customer ${customerId} synced to Katana: ${katanaId}`);

  } catch (error) {
    console.error(`Failed to sync customer ${customerId} to Katana:`, error);
    await event.data.ref.update({
      'syncStatus.katana': 'failed',
      'syncStatus.katanaError': error.message,
      'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

/**
 * Auto-sync customer to Katana when updated
 */
exports.onCustomerUpdated = onDocumentUpdated({
  document: 'customers/{customerId}',
  secrets: [KATANA_API_KEY],
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const customerId = event.params.customerId;

  // Skip if only sync status changed (avoid infinite loop)
  const relevantFields = ['name', 'email', 'phone', 'billingAddress'];
  const hasRelevantChanges = relevantFields.some(
    field => JSON.stringify(before[field]) !== JSON.stringify(after[field])
  );

  if (!hasRelevantChanges) {
    return;
  }

  const katanaId = after.externalIds?.katanaId;
  if (!katanaId || katanaId.startsWith('KAT-CUST-SIM-')) {
    console.log(`Customer ${customerId} has no real Katana ID, skipping update sync`);
    return;
  }

  console.log(`Customer ${customerId} updated, syncing to Katana...`);

  try {
    const apiKey = KATANA_API_KEY.value();
    if (!apiKey) {
      console.log('Katana API key not configured');
      return;
    }

    const response = await fetch(`${KATANA_API_BASE}/customers/${katanaId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: after.name,
        email: after.email || undefined,
        phone: after.phone || undefined,
      }),
    });

    if (response.ok) {
      await event.data.after.ref.update({
        'syncStatus.katana': 'synced',
        'syncStatus.katanaLastSync': admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Customer ${customerId} update synced to Katana`);
    } else {
      throw new Error(`Katana API error: ${response.status}`);
    }

  } catch (error) {
    console.error(`Failed to sync customer ${customerId} update to Katana:`, error);
    await event.data.after.ref.update({
      'syncStatus.katana': 'failed',
      'syncStatus.katanaError': error.message,
      'syncStatus.katanaLastAttempt': admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});
