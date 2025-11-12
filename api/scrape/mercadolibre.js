/**
 * MercadoLibre Scraper API Endpoint
 * Fetches real estate listings from MercadoLibre API and stores them in Neon DB
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// MercadoLibre Argentina real estate categories
const CATEGORIES = {
  ALL_REAL_ESTATE: 'MLA1459', // Inmuebles
  APARTMENTS: 'MLA1472',       // Departamentos
  HOUSES: 'MLA1467',           // Casas
  LAND: 'MLA1476',             // Terrenos
};

// Helper: Extract property attributes from MercadoLibre listing
function extractPropertyAttributes(item) {
  const attributes = {};

  if (item.attributes) {
    item.attributes.forEach(attr => {
      switch (attr.id) {
        case 'BEDROOMS':
          attributes.bedrooms = parseInt(attr.value_name);
          break;
        case 'BATHROOMS':
        case 'FULL_BATHROOMS':
          attributes.bathrooms = parseInt(attr.value_name);
          break;
        case 'TOTAL_AREA':
        case 'COVERED_AREA':
          const area = parseFloat(attr.value_name);
          if (attr.id === 'TOTAL_AREA') attributes.area_sqm = area;
          if (attr.id === 'COVERED_AREA') attributes.covered_area_sqm = area;
          break;
        case 'OPERATION':
          // Map ML operation to our types
          const op = attr.value_name?.toLowerCase();
          if (op?.includes('venta')) attributes.operation_type = 'sale';
          else if (op?.includes('alquiler')) attributes.operation_type = 'rent';
          break;
        case 'PROPERTY_TYPE':
          attributes.property_type = attr.value_name?.toLowerCase();
          break;
      }
    });
  }

  return attributes;
}

// Helper: Extract location from MercadoLibre listing
function extractLocation(item) {
  const location = {
    address: null,
    neighborhood: null,
    city: null,
    state: null,
    latitude: null,
    longitude: null,
  };

  // Try to get geolocation
  if (item.location?.latitude && item.location?.longitude) {
    location.latitude = item.location.latitude;
    location.longitude = item.location.longitude;
  }

  // Extract location hierarchy
  if (item.location?.address_line) {
    location.address = item.location.address_line;
  }

  if (item.location?.city?.name) {
    location.city = item.location.city.name;
  }

  if (item.location?.state?.name) {
    location.state = item.location.state.name;
  }

  if (item.location?.neighborhood?.name) {
    location.neighborhood = item.location.neighborhood.name;
  }

  return location;
}

// Helper: Determine property type from category
function getPropertyTypeFromCategory(categoryId) {
  switch (categoryId) {
    case 'MLA1472': return 'apartment';
    case 'MLA1467': return 'house';
    case 'MLA1476': return 'land';
    default: return 'other';
  }
}

// Main scraper function
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ACCESS_TOKEN = process.env.ML_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'MercadoLibre access token not configured',
      hint: 'Add ML_ACCESS_TOKEN to environment variables'
    });
  }

  try {
    console.log('[ML Scraper] Starting scrape...');

    const stats = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Query parameters
    const category = req.query.category || CATEGORIES.ALL_REAL_ESTATE;
    const limit = Math.min(parseInt(req.query.limit) || 50, 50); // Max 50 per request
    const offset = parseInt(req.query.offset) || 0;

    // Fetch listings from MercadoLibre API
    // Using OAuth token for authenticated access
    const searchUrl = `https://api.mercadolibre.com/sites/MLA/search?category=${category}&limit=${limit}&offset=${offset}`;

    console.log('[ML Scraper] Fetching with authentication:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'User-Agent': 'PropTech-AI/1.0 (+https://prop-tech-ai.vercel.app)',
        'Accept': 'application/json',
        'Accept-Language': 'es-AR,es;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`MercadoLibre API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    stats.fetched = data.results?.length || 0;

    console.log(`[ML Scraper] Found ${stats.fetched} listings`);

    // Process each listing
    for (const item of data.results || []) {
      try {
        // Get detailed property info
        const detailUrl = `https://api.mercadolibre.com/items/${item.id}`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'User-Agent': 'PropTech-AI/1.0 (+https://prop-tech-ai.vercel.app)',
            'Accept': 'application/json',
          },
        });

        if (!detailResponse.ok) {
          console.warn(`[ML Scraper] Failed to fetch details for ${item.id}`);
          stats.errors++;
          continue;
        }

        const detail = await detailResponse.json();

        // Extract data
        const attributes = extractPropertyAttributes(detail);
        const location = extractLocation(detail);

        // Prepare property data
        const propertyData = {
          external_id: `ml_${item.id}`,
          source: 'mercadolibre',
          title: item.title,
          description: detail.descriptions?.[0]?.plain_text || detail.subtitle || '',
          url: item.permalink,
          price: item.price,
          currency: item.currency_id,
          operation_type: attributes.operation_type || (item.listing_type_id?.includes('rent') ? 'rent' : 'sale'),
          property_type: attributes.property_type || getPropertyTypeFromCategory(item.category_id),
          bedrooms: attributes.bedrooms || null,
          bathrooms: attributes.bathrooms || null,
          area_sqm: attributes.area_sqm || null,
          covered_area_sqm: attributes.covered_area_sqm || null,
          address: location.address,
          neighborhood: location.neighborhood,
          city: location.city,
          state: location.state,
          country: 'AR',
          images: JSON.stringify(detail.pictures?.map(p => p.secure_url) || []),
          features: JSON.stringify(detail.attributes || []),
          metadata: JSON.stringify({
            seller_id: item.seller?.id,
            listing_type: item.listing_type_id,
            condition: item.condition,
            tags: item.tags,
          }),
          status: item.status === 'active' ? 'active' : 'inactive',
        };

        // Build location PostGIS string
        let locationSQL = null;
        if (location.latitude && location.longitude) {
          locationSQL = `ST_GeogFromText('POINT(${location.longitude} ${location.latitude})')`;
        }

        // Insert or update property (UPSERT)
        const query = locationSQL
          ? `
            INSERT INTO properties (
              external_id, source, title, description, url,
              price, currency, operation_type, property_type,
              bedrooms, bathrooms, area_sqm, covered_area_sqm,
              location, address, neighborhood, city, state, country,
              images, features, metadata, status,
              scraped_at, last_seen_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              ${locationSQL},
              $14, $15, $16, $17, $18,
              $19::jsonb, $20::jsonb, $21::jsonb, $22,
              NOW(), NOW(), NOW()
            )
            ON CONFLICT (external_id)
            DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              url = EXCLUDED.url,
              price = EXCLUDED.price,
              currency = EXCLUDED.currency,
              operation_type = EXCLUDED.operation_type,
              property_type = EXCLUDED.property_type,
              bedrooms = EXCLUDED.bedrooms,
              bathrooms = EXCLUDED.bathrooms,
              area_sqm = EXCLUDED.area_sqm,
              covered_area_sqm = EXCLUDED.covered_area_sqm,
              location = EXCLUDED.location,
              address = EXCLUDED.address,
              neighborhood = EXCLUDED.neighborhood,
              city = EXCLUDED.city,
              state = EXCLUDED.state,
              images = EXCLUDED.images,
              features = EXCLUDED.features,
              metadata = EXCLUDED.metadata,
              status = EXCLUDED.status,
              last_seen_at = NOW(),
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `
          : `
            INSERT INTO properties (
              external_id, source, title, description, url,
              price, currency, operation_type, property_type,
              bedrooms, bathrooms, area_sqm, covered_area_sqm,
              address, neighborhood, city, state, country,
              images, features, metadata, status,
              scraped_at, last_seen_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12, $13,
              $14, $15, $16, $17, $18,
              $19::jsonb, $20::jsonb, $21::jsonb, $22,
              NOW(), NOW(), NOW()
            )
            ON CONFLICT (external_id)
            DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              url = EXCLUDED.url,
              price = EXCLUDED.price,
              currency = EXCLUDED.currency,
              operation_type = EXCLUDED.operation_type,
              property_type = EXCLUDED.property_type,
              bedrooms = EXCLUDED.bedrooms,
              bathrooms = EXCLUDED.bathrooms,
              area_sqm = EXCLUDED.area_sqm,
              covered_area_sqm = EXCLUDED.covered_area_sqm,
              address = EXCLUDED.address,
              neighborhood = EXCLUDED.neighborhood,
              city = EXCLUDED.city,
              state = EXCLUDED.state,
              images = EXCLUDED.images,
              features = EXCLUDED.features,
              metadata = EXCLUDED.metadata,
              status = EXCLUDED.status,
              last_seen_at = NOW(),
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
          `;

        const params = [
          propertyData.external_id,
          propertyData.source,
          propertyData.title,
          propertyData.description,
          propertyData.url,
          propertyData.price,
          propertyData.currency,
          propertyData.operation_type,
          propertyData.property_type,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.area_sqm,
          propertyData.covered_area_sqm,
          propertyData.address,
          propertyData.neighborhood,
          propertyData.city,
          propertyData.state,
          propertyData.country,
          propertyData.images,
          propertyData.features,
          propertyData.metadata,
          propertyData.status,
        ];

        const result = await sql(query, params);

        if (result[0]?.inserted) {
          stats.inserted++;
          console.log(`[ML Scraper] ✅ Inserted: ${item.id}`);
        } else {
          stats.updated++;
          console.log(`[ML Scraper] 🔄 Updated: ${item.id}`);
        }

        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (itemError) {
        console.error(`[ML Scraper] Error processing ${item.id}:`, itemError.message);
        stats.errors++;
      }
    }

    const duration = Date.now() - stats.startTime;

    console.log('[ML Scraper] Completed:', stats);

    return res.status(200).json({
      success: true,
      stats: {
        ...stats,
        duration: `${(duration / 1000).toFixed(2)}s`,
        total_results: data.paging?.total || 0,
        current_page: Math.floor(offset / limit) + 1,
        has_more: data.paging?.total > offset + limit,
      },
      message: `Scraped ${stats.fetched} listings: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.errors} errors`,
    });

  } catch (error) {
    console.error('[ML Scraper] Fatal error:', error);
    return res.status(500).json({
      error: 'Scraping failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
