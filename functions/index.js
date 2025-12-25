const { onRequest } = require('firebase-functions/v2/https');
const { defineString } = require('firebase-functions/params');
const { Client } = require('@notionhq/client');

// Notion API configuration - use Firebase environment config
const NOTION_API_KEY = defineString('NOTION_API_KEY');
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

// Main API handler - Gen 2 with public access
exports.api = onRequest({ 
  cors: true,
  invoker: 'public'
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
      default:
        res.json({ status: 'ok', message: 'Notion API proxy is running', path });
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
