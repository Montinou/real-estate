/**
 * MercadoLibre Scraper API Endpoint
 * Fetches property listings and stores them in Neon database
 *
 * Usage:
 * - GET/POST /api/scrape/mercadolibre
 * - Query params: ?city=Córdoba&limit=50&operation=sale|rent
 *
 * Note: Uses public MercadoLibre API (no auth required)
 */

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// MercadoLibre API configuration
const ML_BASE_URL = 'https://api.mercadolibre.com';
const ML_SITE = 'MLA'; // Argentina

/**
 * Rate limiting helper
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch properties from MercadoLibre API
 * Uses public search API without authentication
 */
async function fetchMLProperties(options = {}) {
  const url = `${ML_BASE_URL}/sites/${ML_SITE}/search`;
  const params = new URLSearchParams({
    limit: options.limit || 50,
    offset: options.offset || 0,
  });

  // Add category if searching for real estate
  if (options.category) {
    params.append('category', options.category);
  }

  // Search query
  if (options.query) {
    params.append('q', options.query);
  }

  // Build search query for real estate in Córdoba
  if (!options.query && !options.category) {
    const searchTerms = [];
    if (options.city) searchTerms.push(options.city);
    if (options.operation === 'sale') searchTerms.push('departamento venta');
    else if (options.operation === 'rent') searchTerms.push('departamento alquiler');
    else searchTerms.push('departamento');

    if (searchTerms.length > 0) {
      params.append('q', searchTerms.join(' '));
    }
  }

  const fullUrl = `${url}?${params}`;
  console.log(`📡 Fetching: ${fullUrl}`);

  const response = await fetch(fullUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'PropTech-AI/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ML API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch detailed property information
 */
async function fetchPropertyDetails(itemId) {
  try {
    const itemResponse = await fetch(`${ML_BASE_URL}/items/${itemId}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PropTech-AI/1.0',
      },
    });

    if (!itemResponse.ok) return null;

    const item = await itemResponse.json();

    // Try to get description (might fail)
    try {
      const descResponse = await fetch(`${ML_BASE_URL}/items/${itemId}/description`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PropTech-AI/1.0',
        },
      });

      if (descResponse.ok) {
        const description = await descResponse.json();
        item.full_description = description.plain_text || description.text || '';
      }
    } catch (descError) {
      // Description is optional
    }

    return item;
  } catch (error) {
    console.error(`Error fetching details for ${itemId}:`, error.message);
    return null;
  }
}

/**
 * Parse MercadoLibre property to our database format
 */
function parseMLProperty(mlProperty) {
  // Extract location
  const location = mlProperty.location || {};
  const address = mlProperty.address || {};

  // Get attributes helper
  const getAttribute = (attributeId) => {
    const attr = mlProperty.attributes?.find(a => a.id === attributeId);
    return attr?.value_struct?.number || parseFloat(attr?.value_name) || null;
  };

  // Map property type
  const typeMap = {
    'MLA1472': 'apartment',  // Departamento
    'MLA1466': 'house',      // Casa
    'MLA1474': 'ph',         // PH
    'MLA1468': 'land',       // Terreno
    'MLA50538': 'commercial' // Local comercial
  };

  // Determine operation type
  const operation = mlProperty.attributes?.find(a => a.id === 'OPERATION')?.value_name || '';
  let operationType = 'sale';
  if (operation.toLowerCase().includes('alquiler')) operationType = 'rent';
  if (operation.toLowerCase().includes('temporal')) operationType = 'temp_rent';

  return {
    external_id: mlProperty.id,
    source: 'mercadolibre',
    title: mlProperty.title,
    description: mlProperty.full_description || mlProperty.title,
    url: mlProperty.permalink,

    // Price
    price: mlProperty.price,
    currency: mlProperty.currency_id || 'ARS',
    operation_type: operationType,

    // Property details
    property_type: typeMap[mlProperty.category_id] || 'other',
    bedrooms: getAttribute('BEDROOMS'),
    bathrooms: getAttribute('FULL_BATHROOMS'),
    area_sqm: getAttribute('TOTAL_AREA'),
    covered_area_sqm: getAttribute('COVERED_AREA'),

    // Location
    latitude: location.latitude,
    longitude: location.longitude,
    address: location.address_line || [address.street_name, address.street_number].filter(Boolean).join(' '),
    neighborhood: location.neighborhood?.name,
    city: address.city_name || location.city?.name || 'Unknown',
    state: address.state_name || location.state?.name,
    country: 'AR',

    // Media
    images: mlProperty.pictures?.map(pic => pic.secure_url || pic.url) || [],

    // Features
    features: mlProperty.attributes
      ?.filter(a => a.value_name && a.name)
      .map(a => ({ name: a.name, value: a.value_name })) || [],

    // Metadata
    metadata: {
      seller_id: mlProperty.seller_id,
      condition: mlProperty.condition,
      listing_type: mlProperty.listing_type_id,
      created_date: mlProperty.date_created,
      updated_date: mlProperty.last_updated,
    },
  };
}

/**
 * Insert or update property in database
 */
async function upsertProperty(property) {
  try {
    // Build location geography if coordinates exist
    const locationSQL = property.latitude && property.longitude
      ? `ST_GeogFromText('POINT(${property.longitude} ${property.latitude})')`
      : 'NULL';

    const result = await sql`
      INSERT INTO properties (
        external_id,
        source,
        title,
        description,
        url,
        price,
        currency,
        operation_type,
        property_type,
        bedrooms,
        bathrooms,
        area_sqm,
        covered_area_sqm,
        location,
        address,
        neighborhood,
        city,
        state,
        country,
        images,
        features,
        metadata,
        status,
        scraped_at,
        last_seen_at
      ) VALUES (
        ${property.external_id},
        ${property.source},
        ${property.title},
        ${property.description},
        ${property.url},
        ${property.price},
        ${property.currency},
        ${property.operation_type},
        ${property.property_type},
        ${property.bedrooms},
        ${property.bathrooms},
        ${property.area_sqm},
        ${property.covered_area_sqm},
        ${locationSQL}::geography,
        ${property.address},
        ${property.neighborhood},
        ${property.city},
        ${property.state},
        ${property.country},
        ${JSON.stringify(property.images)},
        ${JSON.stringify(property.features)},
        ${JSON.stringify(property.metadata)},
        'active',
        NOW(),
        NOW()
      )
      ON CONFLICT (external_id) DO UPDATE SET
        price = EXCLUDED.price,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        images = EXCLUDED.images,
        features = EXCLUDED.features,
        metadata = EXCLUDED.metadata,
        last_seen_at = NOW(),
        status = 'active',
        updated_at = NOW()
    `;

    return { success: true, external_id: property.external_id };
  } catch (error) {
    console.error(`Error upserting property ${property.external_id}:`, error);
    return { success: false, external_id: property.external_id, error: error.message };
  }
}

/**
 * Main API handler
 */
export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Extract query parameters
    const {
      city = 'Córdoba',
      limit = 50,
      operation = 'sale',
      offset = 0,
    } = req.query;

    console.log(`🔍 Starting MercadoLibre scrape: city=${city}, operation=${operation}, limit=${limit}`);

    // Step 1: Fetch properties from MercadoLibre
    const searchResults = await fetchMLProperties({
      city,
      limit: parseInt(limit),
      offset: parseInt(offset),
      operation,
    });

    if (!searchResults.results || searchResults.results.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No properties found',
        total: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        duration: Date.now() - startTime,
      });
    }

    console.log(`📦 Found ${searchResults.results.length} properties, fetching details...`);

    // Step 2: Fetch detailed information for each property
    const properties = [];
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const item of searchResults.results) {
      // Rate limiting: 1 request per second
      await delay(1000);

      // Fetch full details
      const details = await fetchPropertyDetails(item.id);

      if (!details) {
        failed++;
        continue;
      }

      // Parse property
      const parsed = parseMLProperty(details);

      // Store in database
      const result = await upsertProperty(parsed);

      if (result.success) {
        // Check if it was an insert or update by checking the result
        // Since we're using ON CONFLICT, we'll count as updated if it already existed
        updated++;
        properties.push(parsed.external_id);
      } else {
        failed++;
      }
    }

    // Calculate stats
    const duration = Date.now() - startTime;
    const stats = {
      success: true,
      total: searchResults.results.length,
      inserted: 0, // We don't differentiate in current implementation
      updated,
      failed,
      properties: properties.slice(0, 10), // Return first 10 IDs
      duration,
      timestamp: new Date().toISOString(),
      query: { city, operation, limit, offset },
      paging: {
        total: searchResults.paging.total,
        offset: searchResults.paging.offset,
        limit: searchResults.paging.limit,
      },
    };

    console.log(`✅ Scrape complete: ${updated} properties processed, ${failed} failed in ${duration}ms`);

    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Scraper error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    });
  }
}
