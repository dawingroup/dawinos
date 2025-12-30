/**
 * Scheduled Catalog Audit Functions
 * Daily and weekly automated product audits
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore } = require('firebase-admin/firestore');

/**
 * Default audit configuration
 */
function getDefaultAuditConfig() {
  return {
    minDescriptionLength: 100,
    maxDescriptionLength: 5000,
    minImageCount: 3,
    brandTerms: {
      required: ['Dawin', 'custom', 'crafted'],
      prohibited: ['cheap', 'discount', 'knockoff'],
    },
  };
}

/**
 * Run product audit logic
 */
function runProductAudit(shopifyProduct, config) {
  const issues = [];
  const categoryScores = {
    content_completeness: 100,
    seo_quality: 100,
    image_optimization: 100,
    schema_data: 100,
    brand_consistency: 100,
  };

  // Title check
  if (!shopifyProduct.title || shopifyProduct.title.length < 5) {
    issues.push({
      id: `title_${Date.now()}`,
      category: 'content_completeness',
      severity: 'critical',
      field: 'title',
      message: 'Title is missing or too short',
      autoFixAvailable: false,
    });
    categoryScores.content_completeness -= 25;
  }

  // Description check
  const descriptionLength = (shopifyProduct.body_html || '').replace(/<[^>]*>/g, '').length;
  if (descriptionLength < config.minDescriptionLength) {
    issues.push({
      id: `desc_short_${Date.now()}`,
      category: 'content_completeness',
      severity: 'high',
      field: 'body_html',
      message: `Description too short (${descriptionLength} chars, minimum ${config.minDescriptionLength})`,
      autoFixAvailable: true,
      fixAction: 'generate_description',
    });
    categoryScores.content_completeness -= 20;
  }

  // Image check
  const images = shopifyProduct.images || [];
  if (images.length < config.minImageCount) {
    issues.push({
      id: `img_count_${Date.now()}`,
      category: 'image_optimization',
      severity: 'high',
      field: 'images',
      message: `Insufficient images (${images.length}/${config.minImageCount} required)`,
      autoFixAvailable: false,
    });
    categoryScores.image_optimization -= 20;
  }

  // Check for alt text
  const missingAltText = images.filter(img => !img.alt || img.alt.trim() === '').length;
  if (missingAltText > 0) {
    issues.push({
      id: `img_alt_${Date.now()}`,
      category: 'seo_quality',
      severity: 'medium',
      field: 'images.alt',
      message: `${missingAltText} image(s) missing alt text`,
      autoFixAvailable: true,
      fixAction: 'generate_alt_text',
    });
    categoryScores.seo_quality -= 10;
  }

  // SEO meta check
  if (!shopifyProduct.metafields_global_description_tag) {
    issues.push({
      id: `meta_desc_${Date.now()}`,
      category: 'seo_quality',
      severity: 'medium',
      field: 'metafields_global_description_tag',
      message: 'Missing meta description',
      autoFixAvailable: true,
      fixAction: 'generate_meta_description',
    });
    categoryScores.seo_quality -= 15;
  }

  // Brand terms check
  const bodyText = (shopifyProduct.body_html || '').toLowerCase();
  const titleText = (shopifyProduct.title || '').toLowerCase();
  const combinedText = `${titleText} ${bodyText}`;

  config.brandTerms.prohibited.forEach(term => {
    if (combinedText.includes(term.toLowerCase())) {
      issues.push({
        id: `brand_prohibited_${term}_${Date.now()}`,
        category: 'brand_consistency',
        severity: 'high',
        field: 'content',
        message: `Contains prohibited term: "${term}"`,
        autoFixAvailable: false,
      });
      categoryScores.brand_consistency -= 15;
    }
  });

  // Ensure scores don't go below 0
  Object.keys(categoryScores).forEach(key => {
    categoryScores[key] = Math.max(0, categoryScores[key]);
  });

  // Calculate weighted overall score
  const weights = {
    content_completeness: 0.30,
    seo_quality: 0.25,
    image_optimization: 0.20,
    schema_data: 0.10,
    brand_consistency: 0.15,
  };

  let overallScore = 0;
  Object.entries(weights).forEach(([category, weight]) => {
    overallScore += categoryScores[category] * weight;
  });
  overallScore = Math.round(overallScore);

  // Generate recommendations
  const recommendations = issues
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 5)
    .map(i => `${i.severity.toUpperCase()}: ${i.message}`);

  return {
    overallScore,
    categoryScores,
    issues,
    recommendations,
  };
}

/**
 * Daily catalog audit - runs at 2 AM UTC
 * Audits all active products
 */
exports.dailyCatalogAudit = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'UTC',
  },
  async (event) => {
    const db = getFirestore();
    console.log('Starting daily catalog audit...');

    try {
      // Get Shopify config from systemConfig
      const configDoc = await db.doc('systemConfig/shopifyConfig').get();
      if (!configDoc.exists || configDoc.data().status !== 'connected') {
        console.log('Shopify not connected, skipping audit');
        return;
      }

      const shopConfig = configDoc.data();
      const shopDomain = shopConfig.shopDomain;
      const accessToken = shopConfig.accessToken;

      // Fetch active products from Shopify
      const response = await fetch(
        `https://${shopDomain}/admin/api/2024-01/products.json?status=active&limit=250`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch Shopify products: ${response.status}`);
      }

      const { products } = await response.json();
      console.log(`Found ${products.length} active products to audit`);

      const config = getDefaultAuditConfig();
      let audited = 0;
      let errors = 0;

      for (const product of products) {
        try {
          // Find matching internal product
          const productQuery = await db
            .collection('launchProducts')
            .where('shopifySync.shopifyProductId', '==', product.id.toString())
            .limit(1)
            .get();

          if (productQuery.empty) {
            console.log(`No internal product found for Shopify ID ${product.id}`);
            continue;
          }

          const internalProduct = productQuery.docs[0];

          // Run audit
          const auditResult = runProductAudit(product, config);

          // Save audit result
          await db.collection('productAudits').add({
            productId: internalProduct.id,
            shopifyProductId: product.id.toString(),
            auditedAt: new Date(),
            auditType: 'scheduled',
            productStatus: product.status,
            ...auditResult,
          });

          // Update product's lastAudit reference
          await internalProduct.ref.update({
            lastAudit: {
              overallScore: auditResult.overallScore,
              auditedAt: new Date(),
              issueCount: auditResult.issues.length,
            },
          });

          audited++;
        } catch (err) {
          console.error(`Error auditing product ${product.id}:`, err);
          errors++;
        }
      }

      console.log(`Daily audit complete: ${audited} audited, ${errors} errors`);
    } catch (error) {
      console.error('Daily catalog audit failed:', error);
      throw error;
    }
  }
);

/**
 * Weekly catalog audit - runs Sunday at 3 AM UTC
 * Includes draft products
 */
exports.weeklyCatalogAudit = onSchedule(
  {
    schedule: '0 3 * * 0',
    timeZone: 'UTC',
  },
  async (event) => {
    const db = getFirestore();
    console.log('Starting weekly catalog audit (including drafts)...');

    try {
      const configDoc = await db.doc('settings/shopifyConfig').get();
      if (!configDoc.exists || configDoc.data().status !== 'connected') {
        console.log('Shopify not connected, skipping audit');
        return;
      }

      const shopConfig = configDoc.data();
      const shopDomain = shopConfig.shopDomain;
      const accessToken = shopConfig.accessToken;

      const config = getDefaultAuditConfig();
      let audited = 0;
      let errors = 0;

      // Audit both active and draft products
      for (const status of ['active', 'draft']) {
        const response = await fetch(
          `https://${shopDomain}/admin/api/2024-01/products.json?status=${status}&limit=250`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch ${status} products: ${response.status}`);
          continue;
        }

        const { products } = await response.json();
        console.log(`Found ${products.length} ${status} products`);

        for (const product of products) {
          try {
            const productQuery = await db
              .collection('launchProducts')
              .where('shopifySync.shopifyProductId', '==', product.id.toString())
              .limit(1)
              .get();

            if (productQuery.empty) continue;

            const internalProduct = productQuery.docs[0];
            const auditResult = runProductAudit(product, config);

            await db.collection('productAudits').add({
              productId: internalProduct.id,
              shopifyProductId: product.id.toString(),
              auditedAt: new Date(),
              auditType: 'scheduled',
              productStatus: product.status,
              ...auditResult,
            });

            await internalProduct.ref.update({
              lastAudit: {
                overallScore: auditResult.overallScore,
                auditedAt: new Date(),
                issueCount: auditResult.issues.length,
              },
            });

            audited++;
          } catch (err) {
            console.error(`Error auditing product ${product.id}:`, err);
            errors++;
          }
        }
      }

      console.log(`Weekly audit complete: ${audited} audited, ${errors} errors`);
    } catch (error) {
      console.error('Weekly catalog audit failed:', error);
      throw error;
    }
  }
);
